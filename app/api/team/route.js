import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const TEAM_PLAN_SEATS = { team: 5, agency: 999 }
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function generateCode() {
  // "TEAM-XXXX-YYYY" — easy to read out loud, unambiguous.
  const seg = () => Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('')
  return `TEAM-${seg()}-${seg()}`
}

async function getUser(request) {
  if (!supabaseUrl || !supabaseAnonKey) return null
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  const client = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await client.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user
}

export async function POST(request) {
  try {
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
    }
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createClient(supabaseUrl, serviceKey)
    const body = await request.json()
    const action = body.action

    // -------------------------------------------------------- create a team
    if (action === 'create') {
      const name = String(body.name || '').trim().slice(0, 120)
      const planTier = body.plan_tier === 'agency' ? 'agency' : 'team'
      if (!name) return NextResponse.json({ error: 'Team name required' }, { status: 400 })

      // Check the user isn't already in a team
      const { data: existingProfile } = await admin
        .from('profiles').select('team_id').eq('id', user.id).maybeSingle()
      if (existingProfile?.team_id) {
        return NextResponse.json({ error: 'You are already on a team. Leave it first.' }, { status: 400 })
      }

      // Generate a unique team_code (retry on collision — vanishingly rare)
      let team_code = null
      for (let i = 0; i < 6; i++) {
        const candidate = generateCode()
        const { data: clash } = await admin.from('teams').select('id').eq('team_code', candidate).maybeSingle()
        if (!clash) { team_code = candidate; break }
      }
      if (!team_code) return NextResponse.json({ error: 'Could not allocate team code, please retry' }, { status: 500 })

      const { data: team, error: teamErr } = await admin.from('teams').insert({
        name, team_code,
        plan_tier: planTier,
        owner_id: user.id,
        max_seats: TEAM_PLAN_SEATS[planTier] || 5,
        status: 'active',
      }).select('*').single()
      if (teamErr) return NextResponse.json({ error: teamErr.message }, { status: 500 })

      await admin.from('profiles').update({
        team_id: team.id,
        team_role: 'owner',
      }).eq('id', user.id)

      return NextResponse.json({ team })
    }

    // -------------------------------------------------------- join a team
    if (action === 'join') {
      const team_code = String(body.team_code || '').trim().toUpperCase()
      if (!team_code) return NextResponse.json({ error: 'Team code required' }, { status: 400 })

      const { data: team } = await admin
        .from('teams').select('*').eq('team_code', team_code).maybeSingle()
      if (!team) return NextResponse.json({ error: 'Invalid team code' }, { status: 404 })
      if (team.status !== 'active') {
        return NextResponse.json({ error: 'This team is not currently active' }, { status: 400 })
      }

      // Capacity check
      const { count: memberCount } = await admin
        .from('profiles').select('id', { count: 'exact', head: true }).eq('team_id', team.id)
      if (typeof memberCount === 'number' && memberCount >= team.max_seats) {
        return NextResponse.json({ error: 'This team is at capacity' }, { status: 400 })
      }

      const { data: profile } = await admin
        .from('profiles').select('team_id').eq('id', user.id).maybeSingle()
      if (profile?.team_id) {
        return NextResponse.json({ error: 'You are already on a team. Leave it first.' }, { status: 400 })
      }

      await admin.from('profiles').update({
        team_id: team.id,
        team_role: 'member',
      }).eq('id', user.id)

      return NextResponse.json({ team })
    }

    // -------------------------------------------------------- leave a team
    if (action === 'leave') {
      const { data: profile } = await admin
        .from('profiles').select('team_id, team_role').eq('id', user.id).maybeSingle()
      if (!profile?.team_id) return NextResponse.json({ error: 'Not on a team' }, { status: 400 })

      // Owner can't leave — they must transfer ownership or delete the team
      if (profile.team_role === 'owner') {
        return NextResponse.json({
          error: 'Owners cannot leave their own team. Use "delete team" instead.',
        }, { status: 400 })
      }

      await admin.from('profiles').update({
        team_id: null, team_role: null,
      }).eq('id', user.id)

      return NextResponse.json({ ok: true })
    }

    // -------------------------------------------------------- remove member (owner only)
    if (action === 'remove_member') {
      const target_user_id = body.user_id
      if (!target_user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

      const { data: team } = await admin
        .from('teams').select('*').eq('owner_id', user.id).maybeSingle()
      if (!team) return NextResponse.json({ error: 'Not a team owner' }, { status: 403 })
      if (target_user_id === user.id) {
        return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
      }

      await admin.from('profiles').update({
        team_id: null, team_role: null,
      }).eq('id', target_user_id).eq('team_id', team.id)

      return NextResponse.json({ ok: true })
    }

    // -------------------------------------------------------- regenerate code (owner only)
    if (action === 'regenerate_code') {
      const { data: team } = await admin
        .from('teams').select('id').eq('owner_id', user.id).maybeSingle()
      if (!team) return NextResponse.json({ error: 'Not a team owner' }, { status: 403 })

      let team_code = null
      for (let i = 0; i < 6; i++) {
        const candidate = generateCode()
        const { data: clash } = await admin.from('teams').select('id').eq('team_code', candidate).maybeSingle()
        if (!clash) { team_code = candidate; break }
      }
      if (!team_code) return NextResponse.json({ error: 'Could not allocate code' }, { status: 500 })

      await admin.from('teams').update({ team_code, updated_at: new Date().toISOString() }).eq('id', team.id)
      return NextResponse.json({ team_code })
    }

    // -------------------------------------------------------- delete team (owner only)
    if (action === 'delete') {
      const { data: team } = await admin
        .from('teams').select('id').eq('owner_id', user.id).maybeSingle()
      if (!team) return NextResponse.json({ error: 'Not a team owner' }, { status: 403 })

      // Detach all members
      await admin.from('profiles').update({ team_id: null, team_role: null }).eq('team_id', team.id)
      // Delete the team row
      await admin.from('teams').delete().eq('id', team.id)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('Team API error:', err?.message)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
    }
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = createClient(supabaseUrl, serviceKey)

    const { data: profile } = await admin
      .from('profiles').select('team_id, team_role').eq('id', user.id).maybeSingle()
    if (!profile?.team_id) return NextResponse.json({ team: null, members: [] })

    const [{ data: team }, { data: members }] = await Promise.all([
      admin.from('teams').select('*').eq('id', profile.team_id).single(),
      admin.from('profiles').select('id, full_name, phone, brokerage, team_role, created_at').eq('team_id', profile.team_id),
    ])
    return NextResponse.json({ team, members: members || [], role: profile.team_role })
  } catch (err) {
    console.error('Team GET error:', err?.message)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

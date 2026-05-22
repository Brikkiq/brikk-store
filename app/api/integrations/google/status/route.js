import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Returns the current user's Google Calendar integration status.
// Used by the Settings → Integrations tab to render Connected / Not connected.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function GET(request) {
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ connected: false, error: 'Not configured' }, { status: 503 })
  }
  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return NextResponse.json({ connected: false }, { status: 401 })

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user } } = await client.auth.getUser(token)
  if (!user) return NextResponse.json({ connected: false }, { status: 401 })

  const { data } = await client
    .from('integrations')
    .select('account_email, enabled, last_synced_at, sync_settings, created_at')
    .eq('user_id', user.id)
    .eq('provider', 'google_calendar')
    .maybeSingle()

  return NextResponse.json({
    connected: !!(data && data.enabled),
    account_email: data?.account_email || null,
    last_synced_at: data?.last_synced_at || null,
    sync_settings: data?.sync_settings || null,
    connected_at: data?.created_at || null,
  })
}

export async function POST(request) {
  // Update sync settings
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user } } = await client.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const settings = body.sync_settings
  if (!settings || typeof settings !== 'object') {
    return NextResponse.json({ error: 'sync_settings object required' }, { status: 400 })
  }

  // Only allow known boolean keys
  const allowed = ['birthdays', 'anniversaries', 'follow_ups', 'deal_milestones']
  const clean = {}
  for (const k of allowed) {
    if (typeof settings[k] === 'boolean') clean[k] = settings[k]
  }

  await client.from('integrations').update({
    sync_settings: clean,
    updated_at: new Date().toISOString(),
  }).eq('user_id', user.id).eq('provider', 'google_calendar')

  return NextResponse.json({ ok: true, sync_settings: clean })
}

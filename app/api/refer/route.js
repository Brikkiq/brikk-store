// Public lead-capture link (brikk.store/r/CODE).
//
//   GET  /api/refer?code=ABCD-1234   → { agent: { full_name, agency_name } }  (public info only)
//   POST /api/refer                  → adds the person to the agent's Book as a prospect
//
// No sign-in, so this route uses the service-role key — and is therefore
// strictly validated and rate-limited (per IP and per agent). The browser no
// longer reads the profiles table directly.
import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/server/auth'
import { ApiError } from '@/lib/server/http'
import { rateLimit, clientIp } from '@/lib/server/rateLimit'
import { sendEmail, buildLeadConfirmationEmail } from '@/lib/email'

const CODE_RE = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function errorResponse(err) {
  if (err instanceof ApiError) return NextResponse.json({ error: err.message }, { status: err.status })
  console.error('Refer API error:', err?.message)
  return NextResponse.json({ error: 'Server error' }, { status: 500 })
}

async function findAgent(admin, { code, agentId }) {
  let q = admin.from('profiles').select('id, full_name, agency_name, brokerage')
  if (code && CODE_RE.test(code)) q = q.eq('referral_code', code)
  else if (agentId && UUID_RE.test(agentId)) q = q.eq('id', agentId)
  else return null
  const { data } = await q.maybeSingle()
  return data || null
}

export async function GET(request) {
  try {
    const admin = adminClient()
    await rateLimit(admin, `refer-get:${clientIp(request)}`, { limit: 60, windowSeconds: 600 })
    const { searchParams } = new URL(request.url)
    const agent = await findAgent(admin, {
      code: String(searchParams.get('code') || '').toUpperCase(),
      agentId: searchParams.get('agent'),
    })
    if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ agent: { full_name: agent.full_name || '', agency_name: agent.agency_name || agent.brokerage || '' } })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST(request) {
  try {
    const admin = adminClient()
    const ip = clientIp(request)
    await rateLimit(admin, `refer-post:${ip}`, { limit: 5, windowSeconds: 3600 })

    let body
    try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }
    const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
    const name = clean(body?.name, 120)
    const phone = clean(body?.phone, 40)
    const email = clean(body?.email, 254)
    const notes = clean(body?.notes, 1000)
    const code = clean(body?.code, 20).toUpperCase()
    const agentId = clean(body?.agent_id, 40)

    if (!name || !phone) return NextResponse.json({ error: 'Name and phone required' }, { status: 400 })
    if (!/\d{7,}/.test(phone.replace(/\D/g, ''))) return NextResponse.json({ error: 'Please enter a valid phone number' }, { status: 400 })
    if (email && !EMAIL_RE.test(email)) return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })

    const agent = await findAgent(admin, { code, agentId })
    if (!agent) return NextResponse.json({ error: 'Invalid link' }, { status: 400 })

    // Per-agent cap so one agent's link can't be used to flood their Book.
    await rateLimit(admin, `refer-agent:${agent.id}`, { limit: 50, windowSeconds: 86400 })

    const { data: household, error } = await admin.from('households').insert({
      user_id: agent.id,
      display_name: name,
      phone,
      email: email || null,
      source: 'Lead capture link',
      status: 'prospect',
      notes: notes ? `Submitted via your lead capture link: ${notes}` : 'Submitted via your lead capture link',
      last_contact_at: null,
    }).select('id').single()
    if (error) {
      console.error('Refer insert error:', error.message)
      return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
    }
    const [first, ...rest] = name.split(/\s+/)
    await admin.from('household_members').insert({
      user_id: agent.id, household_id: household.id, role: 'policyholder',
      first_name: first.slice(0, 100), last_name: rest.join(' ').slice(0, 100) || null, phone,
    })

    // Confirmation email to the person who filled out the form (awaited — Vercel
    // can stop the function as soon as we respond). Rate limits above stop this
    // from being used to spam arbitrary inboxes.
    if (email) {
      let agentEmail = null
      try {
        const { data } = await admin.auth.admin.getUserById(agent.id)
        agentEmail = data?.user?.email || null
      } catch {}
      const { subject, html, text } = buildLeadConfirmationEmail({
        leadFirstName: first,
        agentName: agent.full_name || 'Your agent',
        agentBrokerage: agent.agency_name || agent.brokerage || '',
      })
      const result = await sendEmail({ fromName: agent.full_name || 'Brikk', to: email, replyTo: agentEmail || undefined, subject, html, text })
      if (!result.ok) console.warn('Lead confirmation email failed:', result.error)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return errorResponse(err)
  }
}

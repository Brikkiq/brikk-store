// Morning briefing — runs daily via Vercel cron. For each active agent:
//   1. Computes today's top actions (hot leads cold, deals closing, follow-ups due)
//   2. Generates a short AI draft per follow-up using existing /api/copilot logic
//   3. Sends a branded email through Resend with tap-to-send sms: / mailto: links
//
// Security: the cron endpoint is protected by CRON_SECRET. Vercel sets the
// Authorization header automatically when configured in vercel.json.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
const CRON_SECRET = process.env.CRON_SECRET
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://brikk.store'

const MODEL = 'claude-sonnet-4-5'

// Light-touch wrapper. Identical to /api/copilot's callClaude.
async function draftMessage(lead, agentName) {
  if (!ANTHROPIC_KEY) return null
  const days = lead.last_contact_date
    ? Math.floor((Date.now() - new Date(lead.last_contact_date).getTime()) / 86400000)
    : 0
  const prompt = `You write SMS follow-ups for real estate agents. Keep it under 35 words, warm, specific. Never use "just checking in" or "just following up". The agent is ${agentName || 'the agent'}. Lead: ${lead.name}, ${lead.lead_type || 'Buyer'}, ${lead.temperature || 'warm'}, ${days}d since contact. ${lead.notes ? 'Notes: ' + lead.notes.slice(0, 200) : ''} ${lead.price_range ? 'Price range ' + lead.price_range + '.' : ''} Reply with ONLY the SMS message text, no quotes, no preamble.`
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 120,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const text = data.content?.[0]?.text?.trim() || ''
    // Strip any surrounding quotes
    return text.replace(/^["']|["']$/g, '').trim() || null
  } catch {
    return null
  }
}

function buildBriefingHtml({ firstName, dateLabel, hotLeads, closingsSoon, drafts, birthdaysToday = [] }) {
  const block = (rows) => rows.map(r => `
    <tr><td style="padding:10px 0;border-bottom:1px solid #F0F0EC;">
      <div style="font-size:14px;font-weight:500;color:#1A1A18;">${r.title}</div>
      ${r.subtitle ? `<div style="font-size:12.5px;color:#6B6B66;margin-top:2px;">${r.subtitle}</div>` : ''}
      ${r.cta ? `<div style="margin-top:8px;">${r.cta}</div>` : ''}
    </td></tr>
  `).join('')

  const draftSection = drafts.length === 0 ? '' : `
    <h2 style="font-size:13px;font-weight:600;color:#9C9C96;text-transform:uppercase;letter-spacing:0.06em;margin:28px 0 12px 0;">Drafts ready</h2>
    <table cellspacing="0" cellpadding="0" border="0" width="100%">
      ${drafts.map(d => `
        <tr><td style="padding:14px 0;border-bottom:1px solid #F0F0EC;">
          <div style="font-size:14px;font-weight:500;color:#1A1A18;">${d.lead_name}</div>
          <div style="font-size:12.5px;color:#6B6B66;margin-top:2px;">${d.context}</div>
          <div style="background:#F5F5F2;border:1px solid #E8E8E4;border-radius:6px;padding:10px 12px;margin-top:8px;font-size:13px;line-height:1.55;color:#1A1A18;">${d.text}</div>
          <div style="margin-top:10px;">
            ${d.smsUrl ? `<a href="${d.smsUrl}" style="display:inline-block;background:#1A1A18;color:#FFFFFF;text-decoration:none;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:500;margin-right:6px;">Send via Messages</a>` : ''}
            ${d.mailtoUrl ? `<a href="${d.mailtoUrl}" style="display:inline-block;background:transparent;color:#1A1A18;border:1px solid #E8E8E4;text-decoration:none;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:500;margin-right:6px;">Email</a>` : ''}
            <a href="${APP_URL}/app/leads/${d.lead_id}" style="display:inline-block;color:#6B6B66;text-decoration:underline;font-size:12px;padding:8px 4px;">Open in Brikk</a>
          </div>
        </td></tr>
      `).join('')}
    </table>
  `

  return `
<!doctype html>
<html><body style="margin:0;padding:0;background:#FAFAF9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;color:#1A1A18;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FAFAF9;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E8E8E4;border-radius:8px;">
      <tr><td style="padding:28px 28px 8px 28px;">
        <div style="font-size:18px;font-weight:700;letter-spacing:-0.025em;">Brikk</div>
        <div style="font-size:11px;color:#9C9C96;letter-spacing:0.05em;margin-top:2px;text-transform:uppercase;">Morning brief · ${dateLabel}</div>
      </td></tr>
      <tr><td style="padding:4px 28px 8px 28px;">
        <h1 style="font-size:22px;font-weight:600;letter-spacing:-0.015em;margin:0 0 4px 0;color:#1A1A18;">Good morning${firstName ? ', ' + firstName : ''}.</h1>
        <p style="font-size:14px;line-height:1.65;color:#6B6B66;margin:0 0 18px 0;">${hotLeads.length + closingsSoon.length + drafts.length + birthdaysToday.length === 0 ? "You're all caught up. Nothing urgent today." : `${hotLeads.length} hot lead${hotLeads.length === 1 ? '' : 's'} need attention · ${closingsSoon.length} closing${closingsSoon.length === 1 ? '' : 's'} this week · ${drafts.length} draft${drafts.length === 1 ? '' : 's'} ready${birthdaysToday.length ? ' · ' + birthdaysToday.length + ' birthday' + (birthdaysToday.length === 1 ? '' : 's') + ' today' : ''}.`}</p>
      </td></tr>

      ${birthdaysToday.length > 0 ? `
      <tr><td style="padding:0 28px;">
        <h2 style="font-size:13px;font-weight:600;color:#9C9C96;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 4px 0;">Birthdays today</h2>
        <table cellspacing="0" cellpadding="0" border="0" width="100%">${block(birthdaysToday)}</table>
      </td></tr>` : ''}

      ${hotLeads.length > 0 ? `
      <tr><td style="padding:0 28px;">
        <h2 style="font-size:13px;font-weight:600;color:#9C9C96;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 4px 0;">Hot leads cold</h2>
        <table cellspacing="0" cellpadding="0" border="0" width="100%">${block(hotLeads)}</table>
      </td></tr>` : ''}

      ${closingsSoon.length > 0 ? `
      <tr><td style="padding:0 28px;">
        <h2 style="font-size:13px;font-weight:600;color:#9C9C96;text-transform:uppercase;letter-spacing:0.06em;margin:24px 0 4px 0;">Closing within 7 days</h2>
        <table cellspacing="0" cellpadding="0" border="0" width="100%">${block(closingsSoon)}</table>
      </td></tr>` : ''}

      ${draftSection ? `<tr><td style="padding:0 28px;">${draftSection}</td></tr>` : ''}

      <tr><td style="padding:24px 28px 28px 28px;border-top:1px solid #F0F0EC;">
        <a href="${APP_URL}/app" style="display:inline-block;background:#1A1A18;color:#FFFFFF;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:14px;font-weight:500;">Open Brikk</a>
        <p style="font-size:11px;color:#9C9C96;margin:18px 0 0 0;">Don't want these? Reply STOP and we'll switch them off.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`.trim()
}

export async function GET(request) {
  // Vercel cron + manual ping (with bearer secret) both supported
  const auth = request.headers.get('authorization') || ''
  if (CRON_SECRET) {
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  // Pull all active agents
  const { data: profiles } = await supabase.from('profiles').select('id, full_name')
  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  // Pull all auth users with pagination — the listUsers API caps each page,
  // so we keep fetching until a page comes back empty.
  const emailById = {}
  for (let page = 1; page <= 50; page++) {
    const { data: authList } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    const users = authList?.users || []
    if (users.length === 0) break
    for (const u of users) emailById[u.id] = u.email
    if (users.length < 200) break
  }

  let sent = 0
  let skipped = 0
  const startedAt = Date.now()
  const MAX_RUNTIME_MS = 55_000  // bail before Vercel's 60s cron timeout

  for (const p of profiles) {
    // Time guard — stop processing if we're about to hit the timeout. Better to
    // skip the last few users than have the function killed mid-send.
    if (Date.now() - startedAt > MAX_RUNTIME_MS) {
      skipped++
      continue
    }
    const agentEmail = emailById[p.id]
    if (!agentEmail) { skipped++; continue }
    const firstName = (p.full_name || '').split(' ')[0] || ''

    // Fetch this agent's pipeline
    const [{ data: leads }, { data: deals }] = await Promise.all([
      supabase.from('leads').select('*').eq('user_id', p.id),
      supabase.from('deals').select('*').eq('user_id', p.id),
    ])

    const today = new Date()
    const daysSince = (d) => d ? Math.floor((today - new Date(d)) / 86400000) : 999
    const daysUntil = (d) => d ? Math.ceil((new Date(d) - today) / 86400000) : null

    // Hot leads gone cold
    const hotLeads = (leads || [])
      .filter(l => l.temperature === 'hot' && daysSince(l.last_contact_date) >= 2)
      .slice(0, 5)
      .map(l => ({
        title: `Call ${l.name}`,
        subtitle: `Hot ${l.lead_type || 'lead'} · ${daysSince(l.last_contact_date)} days silent${l.price_range ? ' · ' + l.price_range : ''}`,
        cta: l.phone
          ? `<a href="tel:${String(l.phone).replace(/[^0-9+]/g, '')}" style="color:#16803C;text-decoration:none;font-size:12.5px;font-weight:500;">Call now ↗</a>`
          : '',
      }))

    // Deals closing within a week
    const closingsSoon = (deals || [])
      .filter(d => {
        const u = daysUntil(d.close_date)
        return u !== null && u >= 0 && u <= 7
      })
      .slice(0, 5)
      .map(d => ({
        title: d.address,
        subtitle: `${daysUntil(d.close_date)} days to close · ${d.stage}${d.client_name ? ' · ' + d.client_name : ''}`,
        cta: '',
      }))

    // Today's birthdays — high-touch, low-effort, high-ROI. Strong relationship glue.
    const birthdaysToday = (leads || [])
      .filter(l => {
        if (!l.birthday) return false
        const b = new Date(l.birthday)
        return b.getMonth() === today.getMonth() && b.getDate() === today.getDate()
      })
      .slice(0, 5)
      .map(l => {
        const bday = new Date(l.birthday)
        const turning = today.getFullYear() - bday.getFullYear()
        const phone = l.phone ? String(l.phone).replace(/[^0-9+]/g, '') : null
        const firstName = (l.name || '').split(' ')[0] || 'there'
        const draftText = `Happy birthday, ${firstName}! Hope you have a great day.`
        const smsUrl = phone ? `sms:${phone}?body=${encodeURIComponent(draftText)}` : null
        return {
          title: `🎂 ${l.name} turns ${turning} today`,
          subtitle: l.lead_type ? `${l.lead_type} · ${l.temperature || 'lead'}` : (l.temperature || 'lead'),
          cta: smsUrl
            ? `<a href="${smsUrl}" style="color:#16803C;text-decoration:none;font-size:12.5px;font-weight:500;">Send birthday wish ↗</a>`
            : '',
        }
      })

    // Generate up to 3 AI drafts for follow-ups
    const draftCandidates = (leads || [])
      .filter(l => {
        const d = daysSince(l.last_contact_date)
        return (l.temperature === 'hot' && d >= 1) || (l.temperature === 'warm' && d >= 3)
      })
      .sort((a, b) => {
        const order = { hot: 0, warm: 1, cold: 2 }
        return (order[a.temperature] || 2) - (order[b.temperature] || 2)
      })
      .slice(0, 3)

    // Parallel draft generation — three Anthropic calls fan out simultaneously instead
    // of running serially. Cuts per-user latency from ~6s to ~2s.
    const draftResults = await Promise.all(
      draftCandidates.map(lead => draftMessage(lead, p.full_name).then(text => ({ lead, text })))
    )
    const drafts = []
    for (const { lead, text } of draftResults) {
      if (!text) continue
      const phone = lead.phone ? String(lead.phone).replace(/[^0-9+]/g, '') : null
      const smsUrl = phone ? `sms:${phone}?body=${encodeURIComponent(text)}` : null
      const mailtoUrl = lead.email ? `mailto:${lead.email}?body=${encodeURIComponent(text)}` : null
      drafts.push({
        lead_id: lead.id,
        lead_name: lead.name,
        context: `${lead.lead_type || 'Buyer'} · ${lead.temperature || 'warm'} · ${daysSince(lead.last_contact_date)}d silent`,
        text,
        smsUrl,
        mailtoUrl,
      })
    }

    // Skip the email entirely if there's nothing to say
    if (hotLeads.length === 0 && closingsSoon.length === 0 && drafts.length === 0 && birthdaysToday.length === 0) {
      skipped++
      continue
    }

    const html = buildBriefingHtml({ firstName, dateLabel, hotLeads, closingsSoon, drafts, birthdaysToday })

    const result = await sendEmail({
      fromName: 'Brikk',
      to: agentEmail,
      subject: `Today's brief — ${drafts.length + hotLeads.length} action${drafts.length + hotLeads.length === 1 ? '' : 's'}`,
      html,
      text: `Good morning${firstName ? ', ' + firstName : ''}. ${hotLeads.length} hot leads need attention, ${drafts.length} drafts ready. Open Brikk: ${APP_URL}/app`,
    })
    if (result.ok) sent++
    else skipped++
  }

  return NextResponse.json({ ok: true, sent, skipped })
}

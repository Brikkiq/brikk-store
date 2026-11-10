// Morning brief — daily email listing who each agent should contact today.
// Runs via Vercel cron (vercel.json). Protected by CRON_SECRET: the route
// refuses to run at all if the secret is not configured.
//
// Scales by processing agents in pages of 50 with limited concurrency and
// stopping cleanly before Vercel's time limit; the next run picks up anyone
// who was skipped because each agent is sent at most one brief per day.
import { NextResponse } from 'next/server'
import { adminClient, requireCron } from '@/lib/server/auth'
import { ApiError } from '@/lib/server/http'
import { escapeHtml } from '@/lib/server/escape'
import { sendEmail } from '@/lib/email'
import { getTrialState } from '@/lib/trial'
import { todayIn, isValidTimeZone, longDate, addDays } from '@/lib/core/dates'
import { ensureBirthdayFollowUps } from '@/lib/server/book'
import { groupForToday } from '@/lib/core/today'

export const maxDuration = 60

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://brikk.store'
const PAGE = 50
const CONCURRENCY = 5
const TIME_BUDGET_MS = 50_000

export async function GET(request) {
  try {
    requireCron(request)
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 401
    return NextResponse.json({ error: err.message }, { status })
  }

  const admin = adminClient()
  const started = Date.now()
  let sent = 0, skipped = 0, failed = 0

  for (let from = 0; Date.now() - started < TIME_BUDGET_MS; from += PAGE) {
    const { data: profiles, error } = await admin
      .from('profiles')
      .select('id, full_name, timezone, created_at, subscription_status, team_id, team_role, last_brief_date')
      .order('id')
      .range(from, from + PAGE - 1)
    if (error) {
      console.error('[morning-brief] profile page failed:', error.message)
      break
    }
    if (!profiles?.length) break

    for (let i = 0; i < profiles.length && Date.now() - started < TIME_BUDGET_MS; i += CONCURRENCY) {
      const results = await Promise.allSettled(profiles.slice(i, i + CONCURRENCY).map(p => briefOne(admin, p)))
      for (const r of results) {
        if (r.status === 'rejected') { failed++; console.error('[morning-brief] agent failed:', r.reason?.message) }
        else if (r.value) sent++
        else skipped++
      }
    }
    if (profiles.length < PAGE) break
  }

  return NextResponse.json({ ok: true, sent, skipped, failed, ms: Date.now() - started })
}

async function briefOne(admin, profile) {
  // Only active trials / subscribers get the email.
  let team = null
  if (profile.team_id) {
    const { data } = await admin.from('teams').select('status').eq('id', profile.team_id).maybeSingle()
    team = data
  }
  const state = getTrialState({ profile, team }).state
  if (state === 'expired' || state === 'unknown') return false

  const tz = isValidTimeZone(profile.timezone) ? profile.timezone : 'America/New_York'
  const today = todayIn(tz)
  if (profile.last_brief_date === today) return false

  // Make sure today's birthdays exist as follow-ups even if the agent hasn't opened the app.
  await ensureBirthdayFollowUps(admin, profile.id, profile, addDays(today, -3), addDays(today, 7))

  const { data: followUps, error } = await admin
    .from('follow_ups')
    .select('id, household_id, kind, label, due_date, status')
    .eq('user_id', profile.id)
    .in('status', ['pending', 'opened'])
    .lte('due_date', today)
    .order('due_date')
    .limit(200)
  if (error) throw new Error(error.message)
  const groups = groupForToday(followUps || [], today)
  const items = [...groups.overdue, ...groups.today]
  if (!items.length) return false

  const ids = [...new Set(items.map(f => f.household_id))]
  const { data: households } = await admin.from('households').select('id, display_name').in('id', ids).eq('user_id', profile.id)
  const nameBy = Object.fromEntries((households || []).map(h => [h.id, h.display_name]))

  const { data: userData } = await admin.auth.admin.getUserById(profile.id)
  const email = userData?.user?.email
  if (!email) return false

  const firstName = String(profile.full_name || '').split(' ')[0]
  const result = await sendEmail({
    fromName: 'Brikk',
    to: email,
    subject: `${items.length} ${items.length === 1 ? 'person' : 'people'} to contact today`,
    html: buildHtml({ firstName, today, items, nameBy }),
    text: buildText({ firstName, today, items, nameBy }),
  })
  if (!result?.ok) throw new Error(result?.error || 'email failed')

  // Mark as sent for today (ignore if the column isn't there yet).
  await admin.from('profiles').update({ last_brief_date: today }).eq('id', profile.id)
  return true
}

function buildText({ firstName, today, items, nameBy }) {
  return [
    `Good morning${firstName ? ', ' + firstName : ''}. ${longDate(today)}`,
    '',
    ...items.map(f => `• ${nameBy[f.household_id] || 'Client'} — ${f.label}${f.due_date < today ? ' (overdue)' : ''}`),
    '',
    `Open Today to text them in one tap: ${APP_URL}/app`,
  ].join('\n')
}

function buildHtml({ firstName, today, items, nameBy }) {
  const rows = items.map(f => `
    <tr><td style="padding:10px 0;border-bottom:1px solid #F0F0EC;">
      <div style="font-size:14px;font-weight:600;color:#1A1A18;">${escapeHtml(nameBy[f.household_id] || 'Client')}</div>
      <div style="font-size:13px;color:#6B6B66;margin-top:2px;">${escapeHtml(f.label)}${f.due_date < today ? ' · <span style="color:#BE123C;">overdue</span>' : ''}</div>
    </td></tr>`).join('')
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#FAFAF9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;color:#1A1A18;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FAFAF9;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E8E8E4;border-radius:8px;">
      <tr><td style="padding:28px 28px 8px 28px;">
        <div style="font-size:18px;font-weight:700;letter-spacing:-0.025em;">Brikk</div>
        <div style="font-size:11px;color:#9C9C96;letter-spacing:0.05em;margin-top:2px;text-transform:uppercase;">${escapeHtml(longDate(today))}</div>
      </td></tr>
      <tr><td style="padding:4px 28px 8px 28px;">
        <h1 style="font-size:21px;font-weight:600;margin:0 0 4px 0;">Good morning${firstName ? ', ' + escapeHtml(firstName) : ''}.</h1>
        <p style="font-size:14px;line-height:1.6;color:#6B6B66;margin:0 0 12px 0;">${items.length} ${items.length === 1 ? 'person' : 'people'} to contact today.</p>
      </td></tr>
      <tr><td style="padding:0 28px;"><table cellspacing="0" cellpadding="0" border="0" width="100%">${rows}</table></td></tr>
      <tr><td style="padding:22px 28px 28px 28px;">
        <a href="${APP_URL}/app" style="display:inline-block;background:#1A1A18;color:#FFFFFF;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:14px;font-weight:500;">Open Today</a>
        <p style="font-size:11px;color:#9C9C96;margin:18px 0 0 0;">Don't want these? Reply STOP and we'll switch them off.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
}

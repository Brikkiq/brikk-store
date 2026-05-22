import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { googleCalendarFetch } from '@/lib/integrations/google'

// Vercel cron: every 15 minutes.
// For each connected user, pull changes from Google Calendar via incremental
// sync (syncToken). If a Brikk-managed event was edited in Google, reflect
// that change back into the Brikk source (lead/deal). For now we just track
// the changes and update `last_synced_at` — full conflict-resolution is in
// a TODO for v3.

const CRON_SECRET = process.env.CRON_SECRET
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(request) {
  // Auth: CRON_SECRET as a bearer header
  const auth = request.headers.get('authorization') || ''
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
  }

  const admin = createClient(supabaseUrl, serviceKey)

  // Find all enabled Google Calendar integrations
  const { data: integrations } = await admin
    .from('integrations')
    .select('id, user_id, calendar_id, sync_token')
    .eq('provider', 'google_calendar')
    .eq('enabled', true)

  if (!integrations || integrations.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  let pulled = 0
  let errors = 0

  for (const integ of integrations) {
    try {
      // Build the request. First-time sync (no sync_token) gets everything;
      // subsequent calls use the token for incremental sync (cheap).
      const params = new URLSearchParams()
      if (integ.sync_token) {
        params.set('syncToken', integ.sync_token)
      } else {
        // Initial sync: only get future events to keep volume low
        params.set('timeMin', new Date().toISOString())
        params.set('maxResults', '50')
        params.set('singleEvents', 'true')
        params.set('orderBy', 'startTime')
      }

      const calendarId = integ.calendar_id || 'primary'
      let response
      try {
        response = await googleCalendarFetch(admin, integ.user_id,
          `/calendars/${calendarId}/events?${params.toString()}`
        )
      } catch (err) {
        // 410 Gone = sync token expired (>7 days old). Reset and try again next run.
        if (String(err.message).includes('410')) {
          await admin.from('integrations').update({
            sync_token: null,
            updated_at: new Date().toISOString(),
          }).eq('id', integ.id)
          continue
        }
        throw err
      }

      const items = response?.items || []

      // For now we don't do full Google→Brikk reconciliation (out of scope for v1).
      // We just save the new sync_token + count items.
      pulled += items.length

      // Save the next syncToken if Google provided one
      if (response?.nextSyncToken) {
        await admin.from('integrations').update({
          sync_token: response.nextSyncToken,
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', integ.id)
      } else {
        await admin.from('integrations').update({
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', integ.id)
      }
    } catch (err) {
      console.error(`Google poll failed for user ${integ.user_id}:`, err?.message)
      errors++
    }
  }

  return NextResponse.json({
    ok: true,
    processed: integrations.length,
    items_pulled: pulled,
    errors,
  })
}

// Push Brikk-side events to Google Calendar.
//
// Each function is idempotent: if the event already exists (we have a
// calendar_event_sync row mapping it), PATCH the Google event. Otherwise
// POST a new one and save the returned google_event_id.

import { createClient } from '@supabase/supabase-js'
import { googleCalendarFetch } from './google'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://brikk.store'

function admin() {
  if (!supabaseUrl || !serviceKey) throw new Error('Supabase admin not configured')
  return createClient(supabaseUrl, serviceKey)
}

// Build "YYYY-MM-DD" from a Date (used for all-day events).
function isoDate(d) {
  return d.toISOString().slice(0, 10)
}

// Helper — get or create a calendar_event_sync row for a Brikk source.
// Returns { syncRow, isNew }.
async function getSyncRow(userId, sourceType, sourceId) {
  const supabase = admin()
  const { data } = await supabase
    .from('calendar_event_sync')
    .select('*')
    .eq('user_id', userId)
    .eq('brikk_source_type', sourceType)
    .eq('brikk_source_id', sourceId)
    .maybeSingle()
  return { syncRow: data, isNew: !data }
}

// Helper — upsert the sync row after a successful Google API call
async function upsertSyncRow(userId, sourceType, sourceId, googleEventId, calendarId = 'primary') {
  const supabase = admin()
  await supabase.from('calendar_event_sync').upsert({
    user_id: userId,
    brikk_source_type: sourceType,
    brikk_source_id: sourceId,
    google_event_id: googleEventId,
    google_calendar_id: calendarId,
    last_pushed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,brikk_source_type,brikk_source_id' })
}

// Returns the user's integration sync_settings, or null if no integration.
async function getSyncSettings(userId) {
  const supabase = admin()
  const { data } = await supabase
    .from('integrations')
    .select('sync_settings, enabled')
    .eq('user_id', userId)
    .eq('provider', 'google_calendar')
    .maybeSingle()
  if (!data || !data.enabled) return null
  return data.sync_settings || {}
}

/**
 * Sync a lead's birthday to Google Calendar as a recurring annual all-day event.
 */
export async function syncBirthdayToGoogle(userId, lead) {
  if (!lead?.birthday || !lead.id) return
  const settings = await getSyncSettings(userId)
  if (!settings?.birthdays) return

  const bday = new Date(lead.birthday)
  const supabase = admin()
  const { syncRow } = await getSyncRow(userId, 'birthday', lead.id)

  const event = {
    summary: `🎂 ${lead.name}'s birthday`,
    description: `Reach out to ${lead.name} today.\n\nManaged by Brikk · brikk.store/app/leads/${lead.id}`,
    start: { date: isoDate(bday) },
    end:   { date: isoDate(new Date(bday.getTime() + 86400000)) },
    recurrence: ['RRULE:FREQ=YEARLY'],
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: 24 * 60 }],  // 1 day before
    },
    transparency: 'transparent',  // doesn't block other meetings
  }

  try {
    if (syncRow?.google_event_id) {
      await googleCalendarFetch(supabase, userId,
        `/calendars/primary/events/${syncRow.google_event_id}`,
        { method: 'PATCH', body: JSON.stringify(event) }
      )
      await upsertSyncRow(userId, 'birthday', lead.id, syncRow.google_event_id)
    } else {
      const created = await googleCalendarFetch(supabase, userId,
        `/calendars/primary/events`,
        { method: 'POST', body: JSON.stringify(event) }
      )
      if (created?.id) await upsertSyncRow(userId, 'birthday', lead.id, created.id)
    }
  } catch (err) {
    console.error('syncBirthdayToGoogle failed:', lead.name, err?.message)
  }
}

/**
 * Sync a closed deal's anniversary as a recurring annual all-day event.
 */
export async function syncAnniversaryToGoogle(userId, deal) {
  if (!deal?.close_date || !deal.id || deal.stage !== 'Closed') return
  const settings = await getSyncSettings(userId)
  if (!settings?.anniversaries) return

  const closeDate = new Date(deal.close_date)
  // Start the recurring event 1 year after close (first anniversary)
  const firstAnniv = new Date(closeDate.getFullYear() + 1, closeDate.getMonth(), closeDate.getDate())
  const supabase = admin()
  const { syncRow } = await getSyncRow(userId, 'anniversary', deal.id)

  const event = {
    summary: `🏡 ${deal.client_name || 'Client'} — home anniversary`,
    description: `Reach out — ${deal.address}.\n\nManaged by Brikk · brikk.store/app/deals (deal ${deal.id})`,
    start: { date: isoDate(firstAnniv) },
    end:   { date: isoDate(new Date(firstAnniv.getTime() + 86400000)) },
    recurrence: ['RRULE:FREQ=YEARLY'],
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 24 * 60 }] },
    transparency: 'transparent',
  }

  try {
    if (syncRow?.google_event_id) {
      await googleCalendarFetch(supabase, userId,
        `/calendars/primary/events/${syncRow.google_event_id}`,
        { method: 'PATCH', body: JSON.stringify(event) }
      )
      await upsertSyncRow(userId, 'anniversary', deal.id, syncRow.google_event_id)
    } else {
      const created = await googleCalendarFetch(supabase, userId,
        `/calendars/primary/events`,
        { method: 'POST', body: JSON.stringify(event) }
      )
      if (created?.id) await upsertSyncRow(userId, 'anniversary', deal.id, created.id)
    }
  } catch (err) {
    console.error('syncAnniversaryToGoogle failed:', deal.address, err?.message)
  }
}

/**
 * Sync a deal's close date as a single timed event (~ 10am the day of).
 */
export async function syncDealMilestoneToGoogle(userId, deal) {
  if (!deal?.close_date || !deal.id) return
  const settings = await getSyncSettings(userId)
  if (!settings?.deal_milestones) return

  const closeDate = new Date(deal.close_date)
  closeDate.setHours(10, 0, 0, 0)
  const endDate = new Date(closeDate.getTime() + 60 * 60 * 1000)
  const supabase = admin()
  const { syncRow } = await getSyncRow(userId, 'deal', deal.id)

  const event = {
    summary: `Closing: ${deal.address}`,
    description:
      `Closing day. Confirm wire instructions, walkthrough, keys.\n\n` +
      `Client: ${deal.client_name || 'N/A'}\n` +
      `Price: ${deal.price ? '$' + Number(deal.price).toLocaleString() : 'N/A'}\n` +
      `Commission: ${deal.commission ? '$' + Number(deal.commission).toLocaleString() : 'N/A'}\n\n` +
      `Brikk · ${APP_URL}/app/deals`,
    start: { dateTime: closeDate.toISOString(), timeZone: 'America/Los_Angeles' },
    end:   { dateTime: endDate.toISOString(),   timeZone: 'America/Los_Angeles' },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 * 24 * 3 },  // 3 days before
        { method: 'popup', minutes: 60 * 2 },        // 2 hours before
      ],
    },
  }

  try {
    if (syncRow?.google_event_id) {
      await googleCalendarFetch(supabase, userId,
        `/calendars/primary/events/${syncRow.google_event_id}`,
        { method: 'PATCH', body: JSON.stringify(event) }
      )
      await upsertSyncRow(userId, 'deal', deal.id, syncRow.google_event_id)
    } else {
      const created = await googleCalendarFetch(supabase, userId,
        `/calendars/primary/events`,
        { method: 'POST', body: JSON.stringify(event) }
      )
      if (created?.id) await upsertSyncRow(userId, 'deal', deal.id, created.id)
    }
  } catch (err) {
    console.error('syncDealMilestoneToGoogle failed:', deal.address, err?.message)
  }
}

/**
 * Sync an arbitrary follow-up event (used by smart calendar entries).
 */
export async function syncFollowUpToGoogle(userId, lead, when, label) {
  if (!lead?.id || !when) return
  const settings = await getSyncSettings(userId)
  if (!settings?.follow_ups) return

  const start = new Date(when)
  start.setHours(start.getHours() || 10, 0, 0, 0)
  const end = new Date(start.getTime() + 30 * 60 * 1000)  // 30 min default
  const supabase = admin()
  const { syncRow } = await getSyncRow(userId, 'follow_up', lead.id)

  const event = {
    summary: label || `Follow up: ${lead.name}`,
    description:
      `Follow up on ${lead.name}.\n\n` +
      `Type: ${lead.lead_type || 'Lead'}\n` +
      `Source: ${lead.source || 'N/A'}\n\n` +
      `Brikk · ${APP_URL}/app/leads/${lead.id}`,
    start: { dateTime: start.toISOString(), timeZone: 'America/Los_Angeles' },
    end:   { dateTime: end.toISOString(),   timeZone: 'America/Los_Angeles' },
    reminders: { useDefault: true },
  }

  try {
    if (syncRow?.google_event_id) {
      await googleCalendarFetch(supabase, userId,
        `/calendars/primary/events/${syncRow.google_event_id}`,
        { method: 'PATCH', body: JSON.stringify(event) }
      )
      await upsertSyncRow(userId, 'follow_up', lead.id, syncRow.google_event_id)
    } else {
      const created = await googleCalendarFetch(supabase, userId,
        `/calendars/primary/events`,
        { method: 'POST', body: JSON.stringify(event) }
      )
      if (created?.id) await upsertSyncRow(userId, 'follow_up', lead.id, created.id)
    }
  } catch (err) {
    console.error('syncFollowUpToGoogle failed:', lead.name, err?.message)
  }
}

/**
 * Remove a Brikk-managed event from Google (when the source is deleted).
 */
export async function unsyncFromGoogle(userId, sourceType, sourceId) {
  const supabase = admin()
  const { syncRow } = await getSyncRow(userId, sourceType, sourceId)
  if (!syncRow?.google_event_id) return
  try {
    await googleCalendarFetch(supabase, userId,
      `/calendars/primary/events/${syncRow.google_event_id}`,
      { method: 'DELETE' }
    )
  } catch (err) {
    // 410 Gone is fine — already deleted on Google's side
    if (!String(err.message).includes('410')) {
      console.warn('unsyncFromGoogle delete failed:', err?.message)
    }
  }
  await supabase.from('calendar_event_sync').delete()
    .eq('user_id', userId)
    .eq('brikk_source_type', sourceType)
    .eq('brikk_source_id', sourceId)
}

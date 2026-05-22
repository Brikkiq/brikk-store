import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Disconnect Google Calendar for the current user.
// Deletes the integration row + all calendar_event_sync mappings.
// Does NOT delete events already in the user's Google Calendar — those stay.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request) {
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
  }

  // Auth
  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user } } = await userClient.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Delete integration + sync rows
  const admin = createClient(supabaseUrl, serviceKey)
  await admin.from('calendar_event_sync').delete().eq('user_id', user.id)
  await admin.from('integrations').delete()
    .eq('user_id', user.id).eq('provider', 'google_calendar')

  return NextResponse.json({ ok: true })
}

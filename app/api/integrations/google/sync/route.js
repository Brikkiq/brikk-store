import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  syncBirthdayToGoogle,
  syncAnniversaryToGoogle,
  syncDealMilestoneToGoogle,
  unsyncFromGoogle,
} from '@/lib/integrations/syncToGoogle'

// Client-callable sync trigger. The lead/deal pages call this fire-and-forget
// after a save so Google Calendar reflects the change within seconds.
// Body shape: { type: 'lead' | 'deal' | 'delete', id, deleted? }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request) {
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return NextResponse.json({ ok: true, skipped: 'not configured' })
  }
  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return NextResponse.json({ ok: true, skipped: 'no auth' })

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user } } = await userClient.auth.getUser(token)
  if (!user) return NextResponse.json({ ok: true, skipped: 'no user' })

  const body = await request.json().catch(() => ({}))
  const { type, id, deleted } = body
  if (!type || !id) return NextResponse.json({ error: 'type and id required' }, { status: 400 })

  // Check if the user has an active Google integration. If not, just bail
  // quietly (no error to the client — they shouldn't see any indication).
  const admin = createClient(supabaseUrl, serviceKey)
  const { data: integration } = await admin
    .from('integrations')
    .select('id, enabled')
    .eq('user_id', user.id)
    .eq('provider', 'google_calendar')
    .maybeSingle()
  if (!integration || !integration.enabled) {
    return NextResponse.json({ ok: true, skipped: 'no integration' })
  }

  try {
    if (type === 'lead' && !deleted) {
      const { data: lead } = await admin.from('leads').select('*').eq('id', id).eq('user_id', user.id).maybeSingle()
      if (lead && lead.birthday) {
        await syncBirthdayToGoogle(user.id, lead)
      } else if (lead) {
        // Birthday cleared — remove the Google event
        await unsyncFromGoogle(user.id, 'birthday', lead.id)
      }
    } else if (type === 'lead' && deleted) {
      await unsyncFromGoogle(user.id, 'birthday', id)
    } else if (type === 'deal' && !deleted) {
      const { data: deal } = await admin.from('deals').select('*').eq('id', id).eq('user_id', user.id).maybeSingle()
      if (deal) {
        await syncDealMilestoneToGoogle(user.id, deal)
        if (deal.stage === 'Closed') {
          await syncAnniversaryToGoogle(user.id, deal)
        } else {
          // Not closed yet — remove anniversary if one exists from a prior close
          await unsyncFromGoogle(user.id, 'anniversary', deal.id)
        }
      }
    } else if (type === 'deal' && deleted) {
      await unsyncFromGoogle(user.id, 'deal', id)
      await unsyncFromGoogle(user.id, 'anniversary', id)
    }
  } catch (err) {
    // Don't propagate sync failures back to the client UX. Log and move on.
    console.error('Google sync trigger failed:', err?.message)
  }

  return NextResponse.json({ ok: true })
}

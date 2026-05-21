// LEGACY — inbound SMS webhook for Twilio. Brikk no longer sends through Twilio,
// so there's no inbound stream to receive. Agents now log replies manually in the
// Conversations page. This route still validates Twilio signatures if you ever
// re-enable Twilio. Leave the env vars unset to disable.
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
// Legacy route — must bypass RLS to write inbound messages on behalf of any
// agent based on phone-number match. Service-role key is required when this
// route is in use.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const emptyResponse = () =>
  new Response('<Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  })

export async function POST(request) {
  try {
    // --- Verify the request is actually from Twilio ---
    // https://www.twilio.com/docs/usage/security#validating-requests
    if (!twilioAuthToken) {
      console.error('Webhook rejected: TWILIO_AUTH_TOKEN not configured')
      return emptyResponse()
    }

    const signature = request.headers.get('x-twilio-signature') || ''
    const url = request.url
    const rawForm = await request.formData()
    const params = {}
    for (const [k, v] of rawForm.entries()) params[k] = v

    const ok = twilio.validateRequest(twilioAuthToken, signature, url, params)
    if (!ok) {
      console.warn('Webhook rejected: bad Twilio signature')
      return emptyResponse()
    }

    const from = params.From || ''
    const body = params.Body || ''
    if (!from || !body) return emptyResponse()
    if (!supabaseUrl || !supabaseKey) {
      console.error('Webhook: Supabase not configured')
      return emptyResponse()
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const cleanFrom = from.replace(/[^0-9+]/g, '')

    const { data: leads } = await supabase.from('leads').select('id, user_id, name, phone')
    const matchedLead = (leads || []).find(l => {
      if (!l.phone) return false
      const lead = l.phone.replace(/[^0-9]/g, '')
      const incoming = cleanFrom.replace(/[^0-9]/g, '')
      return (
        incoming.endsWith(lead) ||
        lead.endsWith(incoming.slice(-10)) ||
        (lead.length >= 10 && incoming.length >= 10 && lead.slice(-10) === incoming.slice(-10))
      )
    })

    if (matchedLead) {
      await supabase.from('messages').insert({
        user_id: matchedLead.user_id,
        lead_id: matchedLead.id,
        direction: 'inbound',
        channel: 'text',
        content: body,
        status: 'received',
      })
      await supabase
        .from('leads')
        .update({
          last_contact_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', matchedLead.id)
      await supabase.from('interactions').insert({
        user_id: matchedLead.user_id,
        lead_id: matchedLead.id,
        interaction_type: 'text_received',
        notes: `Incoming text: ${body}`,
      })
    } else {
      console.log('Incoming SMS from unknown number:', cleanFrom, body)
    }

    return emptyResponse()
  } catch (error) {
    console.error('Webhook error:', error?.message)
    return emptyResponse()
  }
}

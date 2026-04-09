import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jfxihdmtwlpocpmzeeft.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmeGloZG10d2xwb2NwbXplZWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2Mzc3NjMsImV4cCI6MjA5MTIxMzc2M30.2TZILOqucNQwDWFRAL9McLNjI8yvWrVJfvS4eF0Lnyg'
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request) {
  try {
    // Twilio sends form data, not JSON
    const formData = await request.formData()
    const from = formData.get('From') || ''
    const body = formData.get('Body') || ''
    const messageSid = formData.get('MessageSid') || ''

    if (!from || !body) {
      return new Response('<Response></Response>', {
        headers: { 'Content-Type': 'text/xml' }
      })
    }

    // Clean the incoming phone number
    const cleanFrom = from.replace(/[^0-9+]/g, '')

    // Find the lead by phone number
    const { data: leads } = await supabase
      .from('leads')
      .select('id, user_id, name, phone')

    // Match phone number (flexible matching)
    const matchedLead = leads?.find(l => {
      if (!l.phone) return false
      const cleanLeadPhone = l.phone.replace(/[^0-9]/g, '')
      const cleanIncoming = cleanFrom.replace(/[^0-9]/g, '')
      return cleanIncoming.endsWith(cleanLeadPhone) || cleanLeadPhone.endsWith(cleanIncoming.slice(-10))
    })

    if (matchedLead) {
      // Save incoming message
      await supabase.from('messages').insert({
        user_id: matchedLead.user_id,
        lead_id: matchedLead.id,
        direction: 'inbound',
        channel: 'text',
        content: body,
        status: 'received'
      })

      // Update last contact date
      await supabase.from('leads').update({
        last_contact_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', matchedLead.id)

      // Log interaction
      await supabase.from('interactions').insert({
        user_id: matchedLead.user_id,
        lead_id: matchedLead.id,
        interaction_type: 'text_received',
        notes: `Incoming text: ${body}`
      })
    } else {
      // Unknown number — still log it if there are any users
      console.log('Incoming SMS from unknown number:', cleanFrom, body)
    }

    // Respond with empty TwiML (no auto-reply)
    return new Response('<Response></Response>', {
      headers: { 'Content-Type': 'text/xml' }
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('<Response></Response>', {
      headers: { 'Content-Type': 'text/xml' }
    })
  }
}

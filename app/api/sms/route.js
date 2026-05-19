import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'

const accountSid   = process.env.TWILIO_ACCOUNT_SID
const authToken    = process.env.TWILIO_AUTH_TOKEN
const twilioNumber = process.env.TWILIO_PHONE_NUMBER

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function cleanPhone(to) {
  let n = String(to || '').replace(/[^0-9+]/g, '')
  if (!n) return null
  if (n.startsWith('+')) return n
  if (n.length === 10) return '+1' + n
  if (n.length === 11 && n.startsWith('1')) return '+' + n
  return '+' + n
}

export async function POST(request) {
  try {
    if (!accountSid || !authToken || !twilioNumber) {
      return NextResponse.json({ error: 'SMS not configured' }, { status: 503 })
    }

    // --- Auth: require a Supabase access token from the caller. ---
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Auth not configured' }, { status: 503 })
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: userData, error: userErr } = await supabase.auth.getUser(token)
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { to, message } = await request.json()
    if (!to || !message) {
      return NextResponse.json({ error: 'Phone number and message required' }, { status: 400 })
    }

    const cleanNumber = cleanPhone(to)
    if (!cleanNumber) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }

    const client = twilio(accountSid, authToken)
    const result = await client.messages.create({
      body: String(message).slice(0, 1600), // SMS hard cap
      from: twilioNumber,
      to: cleanNumber,
    })

    return NextResponse.json({
      success: true,
      sid: result.sid,
      status: result.status,
      to: cleanNumber,
    })
  } catch (error) {
    console.error('Twilio send error:', error?.message)
    return NextResponse.json(
      { error: error?.message || 'Failed to send SMS', code: error?.code },
      { status: 500 },
    )
  }
}

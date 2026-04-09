import { NextResponse } from 'next/server'
import twilio from 'twilio'

const accountSid = 'AC126d74d36e89ba6f399584a333a22d16'
const authToken = '85724a9b356c8e78f7a7a10f2dce3629'
const twilioNumber = '+19494786557'

const client = twilio(accountSid, authToken)

export async function POST(request) {
  try {
    const { to, message, leadName } = await request.json()

    if (!to || !message) {
      return NextResponse.json({ error: 'Phone number and message required' }, { status: 400 })
    }

    // Clean phone number - ensure it starts with +1 for US
    let cleanNumber = to.replace(/[^0-9+]/g, '')
    if (!cleanNumber.startsWith('+')) {
      if (cleanNumber.startsWith('1') && cleanNumber.length === 11) {
        cleanNumber = '+' + cleanNumber
      } else if (cleanNumber.length === 10) {
        cleanNumber = '+1' + cleanNumber
      } else {
        cleanNumber = '+' + cleanNumber
      }
    }

    const result = await client.messages.create({
      body: message,
      from: twilioNumber,
      to: cleanNumber
    })

    return NextResponse.json({ 
      success: true, 
      sid: result.sid,
      status: result.status,
      to: cleanNumber
    })
  } catch (error) {
    console.error('Twilio send error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to send SMS',
      code: error.code
    }, { status: 500 })
  }
}

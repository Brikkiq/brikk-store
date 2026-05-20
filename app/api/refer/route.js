import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function POST(request) {
  try {
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
    }

    const { name, phone, email, type, price, notes, agent_id, referral_code } = await request.json()

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone required' }, { status: 400 })
    }
    if (!agent_id && !referral_code) {
      return NextResponse.json({ error: 'Invalid referral link' }, { status: 400 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    // Resolve agent — by id, or by short referral_code.
    let agentLookup
    if (agent_id) {
      agentLookup = await supabaseAdmin.from('profiles').select('id').eq('id', agent_id).single()
    } else {
      agentLookup = await supabaseAdmin
        .from('profiles').select('id')
        .eq('referral_code', String(referral_code).toUpperCase())
        .single()
    }
    const agent = agentLookup.data
    if (agentLookup.error || !agent) {
      return NextResponse.json({ error: 'Invalid referral link' }, { status: 400 })
    }

    // Light sanitization on free-text fields.
    const safe = (s) => (typeof s === 'string' ? s.slice(0, 2000) : null)

    const { error } = await supabaseAdmin.from('leads').insert({
      user_id: agent.id,
      name: safe(name),
      phone: safe(phone),
      email: email ? safe(email) : null,
      source: 'Referral Link',
      temperature: 'warm',
      stage: 'New Lead',
      lead_type: type === 'Seller' ? 'Seller' : 'Buyer',
      price_range: price ? safe(price) : null,
      notes: notes ? safe(notes) : null,
      last_contact_date: new Date().toISOString(),
    })

    if (error) {
      console.error('Refer insert error:', error)
      return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Refer API error:', err?.message)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

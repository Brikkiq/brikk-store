import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key to bypass RLS for public lead capture
const supabaseAdmin = createClient(
  'https://jfxihdmtwlpocpmzeeft.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmeGloZG10d2xwb2NwbXplZWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2Mzc3NjMsImV4cCI6MjA5MTIxMzc2M30.2TZILOqucNQwDWFRAL9McLNjI8yvWrVJfvS4eF0Lnyg'
)

export async function POST(request) {
  try {
    const { name, phone, email, type, price, notes, agent_id } = await request.json()

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone required' }, { status: 400 })
    }

    // Find agent - use provided agent_id or default to first agent
    let userId = agent_id
    if (!userId) {
      const { data: agents } = await supabaseAdmin.from('profiles').select('id').limit(1)
      if (agents && agents.length > 0) userId = agents[0].id
    }

    if (!userId) {
      return NextResponse.json({ error: 'No agent found' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('leads').insert({
      user_id: userId,
      name,
      phone,
      email: email || null,
      source: 'Referral Link',
      temperature: 'warm',
      stage: 'New Lead',
      lead_type: type || 'Buyer',
      price_range: price || null,
      notes: notes || null,
      last_contact_date: new Date().toISOString()
    })

    if (error) {
      console.error('Refer insert error:', error)
      return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Refer API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

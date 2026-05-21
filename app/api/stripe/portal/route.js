import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Stripe Customer Portal session creator.
// Lets a subscribed user manage their billing self-serve: update card,
// download invoices, cancel subscription, switch plan (if configured).
//
// Flow:
//   1. User clicks "Manage subscription" in settings → POST here
//   2. We auth the user via their Supabase Bearer token
//   3. We look up their stripe_customer_id from profiles
//   4. We create a Stripe Billing Portal session
//   5. We return the portal URL; the client redirects there
//
// Configuration: Stripe → Settings → Billing → Customer portal.
// Enable "Cancel subscription", "Update payment method", and "Invoice history"
// at minimum. The portal is themed in Stripe Dashboard, not here.

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://brikk.store'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request) {
  try {
    if (!STRIPE_SECRET) {
      return NextResponse.json({ error: 'Billing not configured' }, { status: 503 })
    }
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
    }

    // Auth: require a logged-in Supabase user.
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user }, error: userErr } = await userClient.auth.getUser(token)
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Look up the user's Stripe customer ID.
    const admin = createClient(supabaseUrl, serviceKey)
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found. Subscribe first.' },
        { status: 404 }
      )
    }

    // Create the Billing Portal session.
    const params = new URLSearchParams({
      customer: profile.stripe_customer_id,
      return_url: `${APP_URL}/app/settings?from=portal`,
    })

    const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const session = await res.json()
    if (session.error) {
      console.error('Stripe portal error:', session.error)
      // Common cause: Customer Portal hasn't been configured in Dashboard yet.
      const hint = session.error.message?.includes('configuration')
        ? 'Customer portal is not configured in Stripe Dashboard yet.'
        : session.error.message
      return NextResponse.json({ error: hint }, { status: 400 })
    }

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe portal API error:', err?.message)
    return NextResponse.json({ error: 'Failed to open billing portal' }, { status: 500 })
  }
}

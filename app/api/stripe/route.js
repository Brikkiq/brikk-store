import { NextResponse } from 'next/server'

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY

const PRICES = {
  pro: {
    monthly: 'price_1TMAOF2MsBrmQDSsosNK9PDd',
    setup: 'price_1TMAOY2MsBrmQDSssZerYEDF'
  },
  team: {
    monthly: 'price_1TMALg2MsBrmQDSseFz1jgY4',
    setup: 'price_1TMAN52MsBrmQDSs6JLxHq2q'
  }
}

export async function POST(request) {
  try {
    const { plan, email, userId } = await request.json()

    if (!plan || !PRICES[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const prices = PRICES[plan]

    // Create Stripe Checkout Session
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'success_url': 'https://brikk.store/app/settings?payment=success',
        'cancel_url': 'https://brikk.store/app/settings?payment=cancelled',
        'customer_email': email || '',
        'client_reference_id': userId || '',
        'subscription_data[trial_period_days]': '45',
        'line_items[0][price]': prices.monthly,
        'line_items[0][quantity]': '1',
        'line_items[1][price]': prices.setup,
        'line_items[1][quantity]': '1',
        'payment_method_types[0]': 'card',
        'allow_promotion_codes': 'true',
        'billing_address_collection': 'auto',
        'metadata[plan]': plan,
        'metadata[userId]': userId || '',
      }).toString()
    })

    const session = await res.json()

    if (session.error) {
      console.error('Stripe error:', session.error)
      return NextResponse.json({ error: session.error.message }, { status: 400 })
    }

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    console.error('Stripe API error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}

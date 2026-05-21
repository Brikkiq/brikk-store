import { NextResponse } from 'next/server'

// Stripe checkout-session creator.
// Called from /app/upgrade and /app/settings (Billing tab) when a user clicks
// "Subscribe to Pro" or "Subscribe to Team". Hands them a hosted Stripe
// checkout URL; the webhook at /api/stripe/webhook flips their subscription
// status when payment completes.

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://brikk.store'
// Enable Stripe Tax only if the partner has finished tax registration in the
// Stripe Dashboard. Until then, leaving this off avoids 400 errors at checkout.
const ENABLE_STRIPE_TAX = process.env.STRIPE_ENABLE_TAX === 'true'

const PRICES = {
  pro: {
    monthly: 'price_1TMALg2MsBrmQDSseFz1jgY4',
    setup:   'price_1TMAN52MsBrmQDSs6JLxHq2q',
  },
  team: {
    monthly: 'price_1TMAOF2MsBrmQDSsosNK9PDd',
    setup:   'price_1TMAOY2MsBrmQDSssZerYEDF',
  },
}

export async function POST(request) {
  try {
    if (!STRIPE_SECRET) {
      return NextResponse.json({ error: 'Billing not configured' }, { status: 503 })
    }

    const { plan, email, userId } = await request.json()
    if (!plan || !PRICES[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const prices = PRICES[plan]

    // Build the form payload. We deliberately do NOT pass payment_method_types —
    // omitting it tells Stripe to use the Dashboard-configured Payment Methods
    // for this account. That means Apple Pay, Google Pay, Link, Cash App, and
    // any other methods you toggle on in
    //   Dashboard → Settings → Payment Methods
    // appear automatically without a code change.
    //
    // Plan suffix — used for the subscription description in Stripe Dashboard
    // so finance/ops can quickly identify subscription type. The card-statement
    // descriptor itself is set at the Stripe account level ("BRIKK") and is
    // configured by Nathan in the Dashboard, not here.
    const planSuffix = plan === 'team' ? 'Team' : plan === 'agency' ? 'Agency' : 'Pro'

    const params = new URLSearchParams({
      mode: 'subscription',
      success_url: `${APP_URL}/app/settings?payment=success`,
      cancel_url:  `${APP_URL}/app/settings?payment=cancelled`,
      customer_email: email || '',
      client_reference_id: userId || '',
      'subscription_data[trial_period_days]': '14',
      'line_items[0][price]': prices.monthly,
      'line_items[0][quantity]': '1',
      'line_items[1][price]': prices.setup,
      'line_items[1][quantity]': '1',
      allow_promotion_codes: 'true',
      // Required for accurate tax calc and stronger fraud signals.
      billing_address_collection: 'required',
      // Let business customers add their tax ID (helps with B2B invoicing).
      'tax_id_collection[enabled]': 'true',
      // Phone number — fraud signal for Radar and useful for support escalation
      // if a payment fails or a dispute is filed.
      'phone_number_collection[enabled]': 'true',
      // Always collect a payment method, even during the trial, so the post-
      // trial charge succeeds and so the Customer Portal can manage it later.
      'payment_method_collection': 'always',
      // Require explicit agreement to TOS at checkout. Pairs with the
      // "Display agreement to legal terms" setting in Stripe Dashboard.
      // Stripe will show a checkbox the user must tick before submitting.
      // This dramatically strengthens enforceability of the no-refunds clause.
      'consent_collection[terms_of_service]': 'required',
      // Internal description shown in the Stripe Dashboard for ops review.
      // Not visible to customers; doesn't affect card statements.
      'subscription_data[description]': `Brikk ${planSuffix} subscription`,
      // Duplicate plan + user metadata onto the subscription so the webhook
      // can identify the plan even after the checkout session has expired.
      'metadata[plan]': plan,
      'metadata[userId]': userId || '',
      'subscription_data[metadata][plan]': plan,
      'subscription_data[metadata][userId]': userId || '',
    })

    // Stripe Tax — calculates and collects sales tax automatically based on
    // billing address. Only enable once partner has completed tax registration
    // in Stripe Dashboard → Tax → Registrations, otherwise checkout errors.
    if (ENABLE_STRIPE_TAX) {
      params.set('automatic_tax[enabled]', 'true')
    }

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const session = await res.json()
    if (session.error) {
      console.error('Stripe error:', session.error)
      // Map known Stripe error codes to friendly user-facing messages.
      // Radar rules Nathan tightened (3DS challenge, CVC fail, postal fail,
      // risk_level=highest) can trigger these at checkout creation time.
      const friendlyMessage = friendlyStripeError(session.error)
      return NextResponse.json({ error: friendlyMessage }, { status: 400 })
    }

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    console.error('Stripe API error:', err?.message)
    return NextResponse.json({ error: 'Failed to start checkout. Please try again or contact hello@brikk.store.' }, { status: 500 })
  }
}

// Map Stripe error codes/types to user-friendly messages. Anything not
// matched falls back to a generic but still helpful message.
function friendlyStripeError(error) {
  const code = error?.code || error?.decline_code
  const type = error?.type
  const map = {
    card_declined:           'Your card was declined. Try another card or contact your bank.',
    expired_card:            'That card has expired. Please use a current card.',
    incorrect_cvc:           'The CVC didn\'t match. Double-check the 3 or 4 digit code on the back of the card.',
    incorrect_number:        'That card number doesn\'t look right. Please re-enter it.',
    invalid_expiry_month:    'The expiration month is invalid.',
    invalid_expiry_year:     'The expiration year is invalid.',
    insufficient_funds:      'Insufficient funds on the card. Try another card.',
    incorrect_zip:           'The billing ZIP code didn\'t match your card.',
    postal_code_invalid:     'The billing ZIP code didn\'t match your card.',
    processing_error:        'Stripe couldn\'t process this card. Try again in a moment, or use a different card.',
    rate_limit:              'Too many requests in a short time. Please wait a moment and try again.',
    authentication_required: 'Your bank requires extra verification. Please complete the 3D Secure challenge.',
  }
  if (code && map[code]) return map[code]
  if (type === 'StripeInvalidRequestError') return 'Checkout config error. Please contact hello@brikk.store.'
  if (type === 'StripeAuthenticationError') return 'Billing not configured. Please contact hello@brikk.store.'
  return error?.message || 'Could not start checkout. Please try again.'
}

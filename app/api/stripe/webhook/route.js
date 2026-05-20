import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Stripe → Brikk webhook.
// Verified by HMAC-SHA256 against STRIPE_WEBHOOK_SECRET.
// Handles checkout completion, subscription updates, and cancellations.
// Idempotent — every team row uses stripe_subscription_id as a unique key.

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY
const supabaseUrl   = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey    = process.env.SUPABASE_SERVICE_ROLE_KEY

// Next.js App Router lets us read the raw body via request.text().
// IMPORTANT: do NOT call request.json() — it would consume the body and break verification.

function verifyStripeSignature(payload, header, secret) {
  if (!header || !secret) return false
  const parts = header.split(',').reduce((acc, p) => {
    const [k, v] = p.split('=')
    if (k && v) acc[k] = v
    return acc
  }, {})
  const timestamp = parts.t
  const v1 = parts.v1
  if (!timestamp || !v1) return false

  // Reject requests older than 5 minutes (replay protection)
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10)
  if (!Number.isFinite(age) || age > 300 || age < -300) return false

  const signed = `${timestamp}.${payload}`
  const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(v1, 'utf8'), Buffer.from(expected, 'utf8'))
  } catch {
    return false
  }
}

// Codes for auto-generated team rows (TEAM-XXXX-YYYY)
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
function generateTeamCode() {
  const seg = () =>
    Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('')
  return `TEAM-${seg()}-${seg()}`
}

// Plan-tier resolution. Brikk's Stripe products use predictable metadata; if metadata is missing,
// fall back to the dollar amount.
function resolvePlan(session, subscription) {
  const planFromMeta = session?.metadata?.plan || subscription?.metadata?.plan
  if (planFromMeta === 'team' || planFromMeta === 'agency' || planFromMeta === 'pro') return planFromMeta

  // Fallback: infer from price (in dollars)
  const amount = subscription?.items?.data?.[0]?.price?.unit_amount
  if (amount === 20000) return 'team'        // $200
  if (amount === 7500) return 'pro'          // $75
  return null
}

const SEATS_BY_PLAN = { pro: 1, team: 5, agency: 999 }

async function stripeGet(path) {
  if (!STRIPE_SECRET) throw new Error('STRIPE_SECRET_KEY not set')
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET}` },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Stripe API ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

// Idempotently create or update a team from a paid subscription.
async function upsertTeamForSubscription({ supabase, ownerId, plan, subscription, customerId }) {
  const subscriptionId = subscription.id
  const planTier = plan === 'agency' ? 'agency' : 'team'
  const maxSeats = SEATS_BY_PLAN[planTier] || 5

  // Does a team already exist for this subscription?
  const { data: existingBySub } = await supabase
    .from('teams').select('*').eq('stripe_subscription_id', subscriptionId).maybeSingle()
  if (existingBySub) {
    await supabase.from('teams').update({
      status: subscription.status === 'active' || subscription.status === 'trialing' ? 'active'
            : subscription.status === 'past_due' ? 'past_due'
            : 'cancelled',
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    }).eq('id', existingBySub.id)
    return existingBySub
  }

  // Does the owner already have a team (created manually before paying)?
  const { data: existingByOwner } = await supabase
    .from('teams').select('*').eq('owner_id', ownerId).maybeSingle()
  if (existingByOwner) {
    await supabase.from('teams').update({
      plan_tier: planTier,
      max_seats: Math.max(existingByOwner.max_seats || 0, maxSeats),
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      status: 'active',
      updated_at: new Date().toISOString(),
    }).eq('id', existingByOwner.id)
    return existingByOwner
  }

  // Fresh team. Generate a unique code.
  let team_code = null
  for (let i = 0; i < 6; i++) {
    const candidate = generateTeamCode()
    const { data: clash } = await supabase.from('teams').select('id').eq('team_code', candidate).maybeSingle()
    if (!clash) { team_code = candidate; break }
  }
  if (!team_code) throw new Error('Could not allocate team code')

  // Best-effort team name — use brokerage from profile, else generic
  const { data: profile } = await supabase
    .from('profiles').select('full_name, brokerage').eq('id', ownerId).maybeSingle()
  const name = profile?.brokerage || (profile?.full_name ? `${profile.full_name}'s team` : 'Your team')

  const { data: team, error: teamErr } = await supabase.from('teams').insert({
    name,
    team_code,
    plan_tier: planTier,
    owner_id: ownerId,
    max_seats: maxSeats,
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: customerId,
    status: 'active',
  }).select('*').single()
  if (teamErr) throw new Error(`Team insert failed: ${teamErr.message}`)

  await supabase.from('profiles').update({
    team_id: team.id, team_role: 'owner',
  }).eq('id', ownerId)

  return team
}

async function updateProfileSubscription({ supabase, ownerId, plan, subscription, customerId }) {
  await supabase.from('profiles').update({
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription?.id || null,
    subscription_plan: plan,
    subscription_status: subscription?.status || null,
    updated_at: new Date().toISOString(),
  }).eq('id', ownerId)
}

export async function POST(request) {
  try {
    if (!STRIPE_WEBHOOK_SECRET) {
      console.error('Webhook rejected: STRIPE_WEBHOOK_SECRET not set')
      return NextResponse.json({ error: 'Not configured' }, { status: 503 })
    }
    if (!supabaseUrl || !serviceKey) {
      console.error('Webhook rejected: Supabase service config missing')
      return NextResponse.json({ error: 'Not configured' }, { status: 503 })
    }

    // Read the raw body and the signature header
    const rawBody = await request.text()
    const sig = request.headers.get('stripe-signature') || ''

    if (!verifyStripeSignature(rawBody, sig, STRIPE_WEBHOOK_SECRET)) {
      console.warn('Webhook rejected: bad signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(rawBody)
    const supabase = createClient(supabaseUrl, serviceKey)

    // -------------------------------------------------- Checkout completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.client_reference_id || session.metadata?.userId
      if (!userId) {
        console.warn('Checkout completed without userId; ignoring', session.id)
        return NextResponse.json({ ok: true, ignored: 'no userId' })
      }

      // Pull the subscription so we have status + price metadata
      let subscription = null
      if (session.subscription) {
        try {
          subscription = await stripeGet(`/subscriptions/${session.subscription}`)
        } catch (err) {
          console.warn('Could not fetch subscription:', err.message)
        }
      }

      const plan = resolvePlan(session, subscription)
      if (!plan) {
        console.warn('Could not resolve plan for checkout', session.id)
        return NextResponse.json({ ok: true, ignored: 'no plan' })
      }

      // Update profile subscription columns regardless of plan
      await updateProfileSubscription({
        supabase,
        ownerId: userId,
        plan,
        subscription,
        customerId: session.customer,
      })

      // For team/agency plans: create or update the team row
      if (plan === 'team' || plan === 'agency') {
        if (subscription) {
          await upsertTeamForSubscription({
            supabase,
            ownerId: userId,
            plan,
            subscription,
            customerId: session.customer,
          })
        } else {
          console.warn('Team plan checkout had no subscription object; skipping team upsert', session.id)
        }
      }

      return NextResponse.json({ ok: true })
    }

    // -------------------------------------------------- Subscription updated
    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
      const subscription = event.data.object
      const status = subscription.status      // 'active' | 'trialing' | 'past_due' | 'canceled' | etc.
      const mapped = (status === 'active' || status === 'trialing') ? 'active'
                   : status === 'past_due' ? 'past_due'
                   : 'cancelled'

      // Update the team row if one exists for this sub
      await supabase.from('teams').update({
        status: mapped, updated_at: new Date().toISOString(),
      }).eq('stripe_subscription_id', subscription.id)

      // Update the owning profile
      await supabase.from('profiles').update({
        subscription_status: status, updated_at: new Date().toISOString(),
      }).eq('stripe_subscription_id', subscription.id)

      return NextResponse.json({ ok: true })
    }

    // -------------------------------------------------- Subscription deleted
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object
      await supabase.from('teams').update({
        status: 'cancelled', updated_at: new Date().toISOString(),
      }).eq('stripe_subscription_id', subscription.id)
      await supabase.from('profiles').update({
        subscription_status: 'canceled', updated_at: new Date().toISOString(),
      }).eq('stripe_subscription_id', subscription.id)
      return NextResponse.json({ ok: true })
    }

    // -------------------------------------------------- Payment failed
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object
      if (invoice.subscription) {
        await supabase.from('teams').update({
          status: 'past_due', updated_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', invoice.subscription)
        await supabase.from('profiles').update({
          subscription_status: 'past_due', updated_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', invoice.subscription)
      }
      return NextResponse.json({ ok: true })
    }

    // Any other event: just ack so Stripe stops retrying
    return NextResponse.json({ ok: true, event: event.type, handled: false })
  } catch (err) {
    console.error('Stripe webhook error:', err?.message)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }
}

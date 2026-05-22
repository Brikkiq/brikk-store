'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { c, type, card, btn } from '@/lib/design'
import { Logo } from '@/lib/Logo'
import { getTrialState, TRIAL_DAYS } from '@/lib/trial'

// Paywall landing for trial-expired users. The layout redirects them here.
// All in-app routes except /app/settings and /app/upgrade are blocked.
// On this page they pick a plan, hit Stripe checkout, and once the webhook
// flips subscription_status to 'active', they're released from the gate.

export default function UpgradePage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      if (prof?.team_id) {
        const { data: t } = await supabase.from('teams').select('*').eq('id', prof.team_id).maybeSingle()
        setTeam(t)
      }
      setLoading(false)
    })()
  }, [])

  const handleSubscribe = async (plan) => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, email: user?.email, userId: user?.id }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Could not start checkout.')
        setBusy(false)
      }
    } catch (err) {
      setError('Network error — please try again.')
      setBusy(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.bg }}>
        <div style={{ textAlign: 'center' }}>
          <Logo size={20} />
          <div style={{ ...type.meta, marginTop: 8 }}>Loading…</div>
        </div>
      </div>
    )
  }

  const trial = getTrialState({ profile, team })
  const isTeamMember = profile?.team_id && profile?.team_role === 'member'

  return (
    <div style={{
      minHeight: '100vh',
      background: c.bg,
      color: c.text,
      fontFamily: "'Instrument Sans',-apple-system,BlinkMacSystemFont,sans-serif",
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Slim top bar */}
      <header style={{
        padding: '16px 24px',
        borderBottom: `1px solid ${c.border}`,
        background: c.white,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Logo size={18} />
        <button onClick={handleLogout} style={{ ...btn.ghost, color: c.dim }}>Sign out</button>
      </header>

      <main style={{
        flex: 1,
        maxWidth: 920,
        width: '100%',
        margin: '0 auto',
        padding: '48px 24px',
      }}>
        {/* Headline */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-block',
            background: trial.state === 'past_due' ? c.redSoft : c.amberSoft,
            border: `1px solid ${trial.state === 'past_due' ? c.redBorder : c.amberBorder}`,
            borderRadius: 20,
            padding: '5px 14px',
            fontSize: 12, fontWeight: 600,
            color: trial.state === 'past_due' ? c.red : c.amber,
            marginBottom: 16,
            letterSpacing: '0.02em',
          }}>
            {trial.state === 'past_due' ? 'Payment failed' : 'Your trial has ended'}
          </div>

          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 10px' }}>
            {isTeamMember
              ? 'Your team subscription needs attention'
              : trial.state === 'past_due'
              ? 'Update your card to keep going'
              : 'Subscribe to keep using Brikk'}
          </h1>
          <p style={{ ...type.bodySub, fontSize: 15, maxWidth: 560, margin: '0 auto', lineHeight: 1.65 }}>
            {isTeamMember
              ? `Your team plan is currently ${team?.status || 'inactive'}. Reach out to ${team?.name || 'your team owner'} to restore access, or subscribe to your own Pro plan below.`
              : 'Your data — every lead, deal, message, and note — is exactly where you left it. Pick a plan and we\'ll have you back in within seconds.'}
          </p>
        </div>

        {/* Plan cards */}
        {error && (
          <div style={{
            maxWidth: 560, margin: '0 auto 16px',
            background: c.redSoft, border: `1px solid ${c.redBorder}`,
            color: c.red, borderRadius: 6, padding: '10px 12px',
            fontSize: 13, fontWeight: 500,
          }}>{error}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, maxWidth: 760, margin: '0 auto' }}>
          {/* Pro */}
          <div style={{
            ...card,
            padding: '24px 22px',
            border: `2px solid ${c.text}`,
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
              background: c.text, color: c.white,
              fontSize: 11, fontWeight: 600,
              padding: '4px 14px', borderRadius: 999,
            }}>Most popular</div>

            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 6 }}>Pro</div>
            <div style={{ ...type.meta, marginBottom: 12 }}>For solo agents</div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12 }}>
              <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.02em' }}>$69.99</span>
              <span style={{ fontSize: 14, color: c.dim }}>/month</span>
            </div>
            <div style={{ ...type.meta, marginBottom: 16 }}>No setup fee · Cancel anytime</div>

            <ul style={{ ...type.bodySub, paddingLeft: 18, margin: 0, marginBottom: 18, lineHeight: 1.75, fontSize: 13 }}>
              <li>Everything in the app</li>
              <li>AI Copilot drafts</li>
              <li>Voice-to-CRM</li>
              <li>Lead capture link</li>
              <li>Unlimited leads & deals</li>
            </ul>

            <button
              onClick={() => handleSubscribe('pro')}
              disabled={busy}
              style={{ ...btn.primary, width: '100%', height: 40, opacity: busy ? 0.5 : 1 }}
            >
              {busy ? 'Loading…' : 'Subscribe to Pro'}
            </button>
          </div>

          {/* Team */}
          <div style={card}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Team</div>
            <div style={{ ...type.meta, marginBottom: 12 }}>For small teams</div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12 }}>
              <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.02em' }}>$160</span>
              <span style={{ fontSize: 14, color: c.dim }}>/month</span>
            </div>
            <div style={{ ...type.meta, marginBottom: 16 }}>Up to 5 agents · No setup fee</div>

            <ul style={{ ...type.bodySub, paddingLeft: 18, margin: 0, marginBottom: 18, lineHeight: 1.75, fontSize: 13 }}>
              <li>Everything in Pro</li>
              <li>Up to 5 agent seats</li>
              <li>Team code for member onboarding</li>
              <li>Priority support</li>
            </ul>

            <button
              onClick={() => handleSubscribe('team')}
              disabled={busy}
              style={{ ...btn.secondary, width: '100%', height: 40, opacity: busy ? 0.5 : 1 }}
            >
              {busy ? 'Loading…' : 'Subscribe to Team'}
            </button>
          </div>
        </div>

        {/* Agency contact */}
        <div style={{ ...card, marginTop: 14, padding: '20px 22px', maxWidth: 760, marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Brokerage or agency?</div>
          <div style={{ ...type.bodySub, marginBottom: 12 }}>
            Unlimited seats, custom onboarding, dedicated success contact.
          </div>
          <a href="mailto:hello@brikk.store?subject=Brikk%20Agency%20plan%20enquiry" style={{ ...btn.secondary, textDecoration: 'none' }}>
            Contact sales
          </a>
        </div>

        {/* Reassurance footer */}
        <div style={{ textAlign: 'center', marginTop: 36 }}>
          <div style={{ ...type.meta, marginBottom: 6 }}>Your data is safe. Subscribe and you're back where you left off in seconds.</div>
          <div style={{ ...type.meta, color: c.dim, marginBottom: 6, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
            <strong style={{ color: c.text }}>All sales are final. No refunds.</strong> Your 14-day free trial is the time to evaluate Brikk — once you subscribe, monthly fees are non-refundable. You can cancel anytime to stop future charges. By subscribing you agree to our <a href="/terms" style={{ color: c.sub, textDecoration: 'underline' }}>Terms of Service</a>.
          </div>
          <a href="/app/settings" style={{ ...type.meta, color: c.dim }}>Settings · Privacy · Sign out</a>
        </div>
      </main>
    </div>
  )
}

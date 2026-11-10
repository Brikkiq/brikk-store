'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/client/api'
import { c, type, card, btn } from '@/lib/design'
import { Logo } from '@/lib/Logo'
import { TRIAL_DAYS } from '@/lib/trial'

// Paywall landing for trial-expired users. The layout redirects them here.
// All in-app routes except /app/settings and /app/upgrade are blocked.
// On this page they pick a plan, hit Stripe checkout, and once the webhook
// flips subscription_status to 'active', they're released from the gate.

export default function UpgradePage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [trial, setTrial] = useState({ state: 'unknown' })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      try {
        const me = await api.get('/me')
        setProfile(me.profile)
        setTrial(me.trial || { state: 'unknown' })
      } catch {}
      setLoading(false)
    })()
  }, [])

  const handleSubscribe = async (plan) => {
    setBusy(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ plan }),
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
              : 'Your Book — every client, policy, follow-up and note — is exactly where you left it. Pick a plan and we\'ll have you back in within seconds.'}
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

        <div style={{ maxWidth: 380, margin: '0 auto' }}>
          <div style={{ ...card, padding: '24px 22px', border: `2px solid ${c.text}` }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Pro</div>
            <div style={{ ...type.meta, marginBottom: 12 }}>For independent life insurance agents</div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12 }}>
              <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.02em' }}>$7.99</span>
              <span style={{ fontSize: 14, color: c.dim }}>/week</span>
            </div>
            <div style={{ ...type.meta, marginBottom: 16 }}>No setup fee · Cancel anytime</div>

            <ul style={{ ...type.bodySub, paddingLeft: 18, margin: 0, marginBottom: 18, lineHeight: 1.75, fontSize: 13 }}>
              <li>Unlimited clients and households</li>
              <li>Automatic policy follow-ups + annual reviews</li>
              <li>Birthday reminders for the whole family</li>
              <li>One-tap texts from your own phone</li>
            </ul>

            <button
              onClick={() => handleSubscribe('pro')}
              disabled={busy}
              style={{ ...btn.primary, width: '100%', height: 44, opacity: busy ? 0.5 : 1 }}
            >
              {busy ? 'Loading…' : 'Subscribe — $7.99/week'}
            </button>
          </div>
        </div>

        {/* Reassurance footer */}
        <div style={{ textAlign: 'center', marginTop: 36 }}>
          <div style={{ ...type.meta, marginBottom: 6 }}>Your data is safe. Subscribe and you're back where you left off in seconds.</div>
          <div style={{ ...type.meta, color: c.dim, marginBottom: 6, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
            <strong style={{ color: c.text }}>All sales are final. No refunds.</strong> Your {TRIAL_DAYS}-day free trial is the time to evaluate Brikk — once you subscribe, weekly fees are non-refundable. You can cancel anytime to stop future charges. By subscribing you agree to our <a href="/terms" style={{ color: c.sub, textDecoration: 'underline' }}>Terms of Service</a>.
          </div>
          <a href="/app/settings" style={{ ...type.meta, color: c.dim }}>Settings · Privacy · Sign out</a>
        </div>
      </main>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { c, type, card, btn, input, inputLabel } from '@/lib/design'
import { Logo } from '@/lib/Logo'

// Legacy referral page. The newer flow is /r/CODE which uses friendly short codes.
// This page is kept for compatibility — older share links carry ?agent=<uuid>.
// If no agent param is present, we show a generic "no agent attached" message
// instead of silently routing to the first agent in the DB (which used to leak
// real names to random visitors).

export default function ReferPage() {
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    type: 'Buyer', price: '', notes: '',
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const agentId = params.get('agent')
    if (!agentId) {
      setLoading(false)
      return
    }
    // Fetch ONLY this specific agent — never bulk-list all agents.
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, brokerage, referral_code')
        .eq('id', agentId)
        .maybeSingle()
      if (data) setAgent(data)
      setLoading(false)
    })()
  }, [])

  const handleSubmit = async () => {
    if (!form.name || !form.phone) { setError('Please enter your name and phone number.'); return }
    if (!agent) { setError('This link is missing an agent. Please ask for an updated link.'); return }
    setError(null)
    try {
      const res = await fetch('/api/refer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email || null,
          type: form.type === 'Both' ? 'Buyer' : form.type,
          price: form.price || null,
          notes: form.notes ? `[Submitted via referral link] ${form.notes}` : '[Submitted via referral link]',
          agent_id: agent.id,
        }),
      })
      const data = await res.json()
      if (data.error) setError('Something went wrong. Please try again or call directly.')
      else setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again or call directly.')
    }
  }

  if (loading) {
    return <Shell><div style={{ padding: 60, textAlign: 'center', color: c.dim, fontSize: 13 }}>Loading…</div></Shell>
  }

  // No agent specified — show neutral landing without exposing any agent name
  if (!agent) {
    return (
      <Shell>
        <div style={{ maxWidth: 440, margin: '60px auto', textAlign: 'center', padding: 20 }}>
          <Logo size={22} />
          <h1 style={{ ...type.pageTitle, fontSize: 22, marginTop: 20 }}>This link is missing an agent</h1>
          <p style={{ ...type.bodySub, marginTop: 8 }}>
            The link you followed doesn't include an agent reference. Ask the person who shared it for an updated link, or visit{' '}
            <a href="/" style={{ color: c.text, textDecoration: 'underline' }}>brikk.store</a> to learn more.
          </p>
        </div>
      </Shell>
    )
  }

  if (submitted) {
    return (
      <Shell>
        <div style={{ maxWidth: 440, margin: '60px auto', textAlign: 'center', padding: 20 }}>
          <Logo size={20} />
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: c.greenSoft, border: `1px solid ${c.greenBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '24px auto 20px', color: c.green, fontSize: 22,
          }}>✓</div>
          <h1 style={{ ...type.pageTitle, fontSize: 22, margin: '0 0 8px' }}>Thanks, {form.name.split(' ')[0]}.</h1>
          <p style={{ ...type.bodySub, margin: '0 0 6px' }}>
            <strong style={{ color: c.text }}>{agent.full_name}</strong>{agent.brokerage ? ` at ${agent.brokerage}` : ''} will reach out shortly.
          </p>
          <p style={{ ...type.meta, marginTop: 24 }}>You can close this page.</p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div style={{ maxWidth: 480, margin: '40px auto', padding: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Logo size={20} />
        </div>

        <div style={{ ...card, padding: '28px 24px' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em', marginBottom: 4 }}>
              Work with {agent.full_name}
            </div>
            <div style={{ ...type.bodySub }}>
              {agent.brokerage ? `${agent.brokerage} · ` : ''}Tell them what you're looking for and they'll reach out — usually within an hour.
            </div>
          </div>

          <Field label="Your name *">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Sarah Mitchell" style={input} />
          </Field>
          <Field label="Phone *">
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(801) 555-0142" style={input} />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" style={input} />
          </Field>
          <Field label="I'm a">
            <div style={{ display: 'flex', gap: 6 }}>
              {['Buyer', 'Seller', 'Both'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  style={{
                    flex: 1, height: 36, borderRadius: 6,
                    border: `1px solid ${form.type === t ? c.text : c.border}`,
                    background: form.type === t ? c.text : c.white,
                    color: form.type === t ? c.white : c.sub,
                    fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >{t}</button>
              ))}
            </div>
          </Field>
          <Field label="Price range">
            <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="$300K – $450K" style={input} />
          </Field>
          <Field label="Anything else they should know?">
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Looking for 3+ bedrooms near downtown, pre-approved, need to move by August…"
              rows={3}
              style={{ ...input, height: 'auto', padding: '10px 12px', resize: 'vertical' }}
            />
          </Field>

          {error && (
            <div style={{ background: c.redSoft, border: `1px solid ${c.redBorder}`, color: c.red, borderRadius: 6, padding: '10px 12px', fontSize: 12.5, marginBottom: 12 }}>
              {error}
            </div>
          )}

          <button onClick={handleSubmit} style={{ ...btn.primary, width: '100%', height: 40 }}>
            Submit
          </button>

          {/* TCPA + privacy disclosure — required for compliant lead capture
              that may result in SMS or phone contact. */}
          <div style={{ marginTop: 16, padding: '12px 14px', background: c.bgInset, borderRadius: 6, border: `1px solid ${c.borderLight}` }}>
            <p style={{ fontSize: 11, color: c.dim, lineHeight: 1.6, margin: 0 }}>
              By submitting this form, you consent to be contacted by {agent.full_name}
              {agent.brokerage ? ` at ${agent.brokerage}` : ''} by phone, text, or email
              about real estate services. Standard messaging rates may apply. Consent is not a
              condition of purchase. You can opt out at any time by replying STOP to any text.
              Your information is private — see our{' '}
              <a href="/privacy" target="_blank" rel="noreferrer" style={{ color: c.sub, textDecoration: 'underline' }}>Privacy Policy</a>{' '}
              and{' '}
              <a href="/terms" target="_blank" rel="noreferrer" style={{ color: c.sub, textDecoration: 'underline' }}>Terms</a>.
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/" style={{ ...type.meta }}>Powered by Brikk</a>
        </div>
      </div>
    </Shell>
  )
}

const Shell = ({ children }) => (
  <div style={{ background: c.bg, minHeight: '100vh', color: c.text, fontFamily: "'Instrument Sans',-apple-system,BlinkMacSystemFont,sans-serif" }}>
    {children}
  </div>
)

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={inputLabel}>{label}</label>
    {children}
  </div>
)

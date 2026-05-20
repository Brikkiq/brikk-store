'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { c, type, card, btn, input, inputLabel } from '@/lib/design'
import { Logo } from '@/lib/Logo'

// Friendly referral URLs: brikk.store/r/SARAH-7H2K
// Resolves the short code to an agent_id, then submits to /api/refer.

export default function ReferralCodePage() {
  const params = useParams()
  const code = (params?.code || '').toString().toUpperCase()

  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    type: 'Buyer', price: '', notes: '',
  })

  useEffect(() => {
    if (!code) { setLoading(false); setNotFound(true); return }
    const lookup = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, brokerage, referral_code')
        .eq('referral_code', code)
        .maybeSingle()
      if (error || !data) {
        setNotFound(true)
      } else {
        setAgent(data)
      }
      setLoading(false)
    }
    lookup()
  }, [code])

  const handleSubmit = async () => {
    if (!form.name || !form.phone) {
      setError('Please enter your name and phone number.')
      return
    }
    setError(null)
    try {
      const res = await fetch('/api/refer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email || null,
          type: form.type,
          price: form.price || null,
          notes: form.notes ? `[Submitted via /r/${code}] ${form.notes}` : `[Submitted via /r/${code}]`,
          agent_id: agent.id,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError('Something went wrong. Please try again or call directly.')
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Something went wrong. Please try again or call directly.')
    }
  }

  if (loading) {
    return (
      <Shell>
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Logo size={20} />
          <div style={{ ...type.meta, marginTop: 8 }}>Loading…</div>
        </div>
      </Shell>
    )
  }

  if (notFound) {
    return (
      <Shell>
        <div style={{ textAlign: 'center', maxWidth: 400, margin: '0 auto', padding: 40 }}>
          <Logo size={20} />
          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 16, marginBottom: 6 }}>Link not found</div>
          <div style={{ ...type.bodySub, marginBottom: 20 }}>
            We couldn't find a Brikk agent with that code. The link may be expired or mistyped.
          </div>
          <a href="/" style={{ ...btn.secondary, textDecoration: 'none' }}>Go to brikk.store</a>
        </div>
      </Shell>
    )
  }

  if (submitted) {
    return (
      <Shell>
        <div style={{ maxWidth: 440, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
          <Logo size={20} />
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: c.greenSoft, border: `1px solid ${c.greenBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '24px auto 20px', color: c.green,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 style={{ ...type.pageTitle, fontSize: 22, margin: '0 0 8px' }}>Thanks, {form.name.split(' ')[0]}.</h1>
          <p style={{ ...type.bodySub, margin: '0 0 6px' }}>
            <strong style={{ color: c.text }}>{agent.full_name || 'Your agent'}</strong>{agent.brokerage ? ` at ${agent.brokerage}` : ''} will reach out shortly.
          </p>
          <p style={{ ...type.meta, marginTop: 24 }}>You can close this page.</p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div style={{ maxWidth: 440, margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Logo size={20} />
        </div>

        <div style={{ ...card, padding: '24px 22px' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em', marginBottom: 4 }}>
              Get in touch with {agent.full_name || 'your agent'}
            </div>
            <div style={{ ...type.bodySub }}>
              {agent.brokerage ? `${agent.brokerage}. ` : ''}Fill in your details and they'll reach out — usually within an hour.
            </div>
          </div>

          <Field label="Full name *">
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
              {['Buyer', 'Seller'].map(t => (
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
            <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="$275K – $350K" style={input} />
          </Field>
          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Looking for 3 bedrooms near downtown…"
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
            Send
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/" style={{ ...type.meta }}>Powered by Brikk</a>
        </div>
      </div>
    </Shell>
  )
}

const Shell = ({ children }) => (
  <div style={{
    background: c.bg, minHeight: '100vh', color: c.text,
    fontFamily: "'Instrument Sans',-apple-system,BlinkMacSystemFont,sans-serif",
  }}>{children}</div>
)

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={inputLabel}>{label}</label>
    {children}
  </div>
)

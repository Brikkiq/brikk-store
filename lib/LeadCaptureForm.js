'use client'
// Public "get in touch" form behind an agent's lead capture link.
// Looks the agent up via /api/refer (never reads the database directly).
import { useEffect, useState } from 'react'
import { c, type, card, btn, input, inputLabel } from './design'
import { Logo } from './Logo'

export function LeadCaptureForm({ code, agentId }) {
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' })

  useEffect(() => {
    const q = code ? `code=${encodeURIComponent(code)}` : agentId ? `agent=${encodeURIComponent(agentId)}` : null
    if (!q) { setNotFound(true); setLoading(false); return }
    fetch(`/api/refer?${q}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => setAgent(d.agent))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [code, agentId])

  const submit = async (e) => {
    e.preventDefault()
    const missing = []
    if (!form.name.trim()) missing.push('your name')
    if (!form.phone.trim()) missing.push('your phone number')
    if (missing.length) { setError(`Please enter ${missing.join(' and ')}.`); return }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('That email doesn’t look right. Double-check it or leave it blank.'); return
    }
    setError(null); setSending(true)
    try {
      const res = await fetch('/api/refer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, email: form.email || null, ...(code ? { code } : { agent_id: agentId }) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) setError(res.status === 429 ? 'Too many submissions — please try again later or call directly.' : (data.error || 'Something went wrong. Please try again.'))
      else setSubmitted(true)
    } catch {
      setError('Network error — please try again.')
    }
    setSending(false)
  }

  const shell = (children) => (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: "'Instrument Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", color: c.text }}>
      <div style={{ maxWidth: 440, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}><Logo size={20} /></div>
        {children}
        <div style={{ textAlign: 'center', marginTop: 20 }}><a href="/" style={type.meta}>Powered by Brikk</a></div>
      </div>
    </div>
  )

  if (loading) return shell(<div style={{ ...type.meta, textAlign: 'center' }}>Loading…</div>)
  if (notFound) return shell(
    <div style={{ ...card, textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Link not found</div>
      <div style={type.bodySub}>This link may be expired or mistyped. Please ask your agent for a new one.</div>
    </div>
  )
  const who = agent.full_name || 'your agent'
  if (submitted) return shell(
    <div style={{ ...card, textAlign: 'center', padding: '28px 22px' }}>
      <h1 style={{ ...type.pageTitle, fontSize: 22, margin: '0 0 8px' }}>Thanks, {form.name.split(' ')[0]}.</h1>
      <p style={{ ...type.bodySub, margin: 0 }}><strong style={{ color: c.text }}>{who}</strong>{agent.agency_name ? ` at ${agent.agency_name}` : ''} will reach out shortly.</p>
      <p style={{ ...type.meta, marginTop: 20 }}>You can close this page.</p>
    </div>
  )

  return shell(
    <form onSubmit={submit} style={{ ...card, padding: '24px 22px', display: 'grid', gap: 14 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Get in touch with {who}</div>
        <div style={type.bodySub}>Questions about life insurance for you or your family? Leave your details and {who} will reach out.</div>
      </div>
      <label><span style={inputLabel}>Your name</span>
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={input} maxLength={120} autoComplete="name" /></label>
      <label><span style={inputLabel}>Phone</span>
        <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={input} maxLength={40} autoComplete="tel" /></label>
      <label><span style={inputLabel}>Email (optional)</span>
        <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={input} maxLength={254} autoComplete="email" /></label>
      <label><span style={inputLabel}>Best time to reach you (optional)</span>
        <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={input} maxLength={300} placeholder="Weekday evenings" /></label>
      <div style={{ ...type.meta }}>Please don’t include any health or medical information.</div>
      {error && <div style={{ color: c.red, fontSize: 13 }}>{error}</div>}
      <button type="submit" disabled={sending} style={{ ...btn.primary, height: 44 }}>{sending ? 'Sending…' : 'Send'}</button>
      <div style={{ ...type.meta }}>By submitting, you agree that {who}{agent.agency_name ? ` at ${agent.agency_name}` : ''} may contact you by phone, text, or email about life insurance.</div>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { c, type, card, btn, input, inputLabel } from '@/lib/design'
import { Logo } from '@/lib/Logo'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [brokerage, setBrokerage] = useState('')
  const [teamCode, setTeamCode] = useState('')
  const [showTeamCode, setShowTeamCode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setError('Please check your email and click the confirmation link before signing in.')
      } else if (error.message.includes('Invalid login')) {
        setError('Invalid email or password.')
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else {
      window.location.href = '/app'
    }
  }

  const handleSignup = async () => {
    if (!fullName) return setError('Please enter your full name.')
    if (!email) return setError('Please enter your email.')
    if (!password || password.length < 6) return setError('Password must be at least 6 characters.')

    setLoading(true); setError(null)
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
      },
    })

    if (error) {
      if (error.message.includes('already registered')) setError('This email is already registered. Try signing in.')
      else setError(error.message)
      setLoading(false)
      return
    }

    if (data?.user?.id && (phone || brokerage)) {
      const { error: profileErr } = await supabase.from('profiles').update({
        phone: phone || null, brokerage: brokerage || null,
      }).eq('id', data.user.id)
      if (profileErr) console.warn('Profile update failed:', profileErr.message)
    }

    // Pending team join — applied after the user confirms their email and signs in for the first time.
    if (teamCode.trim()) {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('brikk-pending-team-code', teamCode.trim().toUpperCase())
        }
      } catch {}
    }

    setShowConfirmation(true)
    setLoading(false)
  }

  const submit = () => mode === 'login' ? handleLogin() : handleSignup()
  const onKey = (e) => { if (e.key === 'Enter') submit() }

  if (showConfirmation) {
    return (
      <Shell>
        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: c.greenSoft, border: `1px solid ${c.greenBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', color: c.green,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6l8 6 8-6" />
              <rect x="3" y="5" width="18" height="14" rx="2" />
            </svg>
          </div>
          <h1 style={{ ...type.pageTitle, fontSize: 22, margin: '0 0 8px' }}>Check your email</h1>
          <p style={{ ...type.bodySub, margin: '0 0 6px' }}>
            We sent a confirmation link to <span style={{ color: c.text, fontWeight: 500 }}>{email}</span>.
          </p>
          <p style={{ ...type.meta, margin: '0 0 20px' }}>
            Click the link to activate your account, then come back here to sign in.
          </p>
          <div style={{
            background: c.amberSoft, border: `1px solid ${c.amberBorder}`,
            borderRadius: 6, padding: '12px 14px', marginBottom: 20,
            textAlign: 'left',
          }}>
            <div style={{ ...type.eyebrow, color: c.amber, marginBottom: 4 }}>Don't see it?</div>
            <div style={{ ...type.bodySub }}>Check spam. The email comes from noreply@mail.app.supabase.io.</div>
          </div>
          <button
            onClick={() => {
              setShowConfirmation(false)
              setMode('login')
              setPassword('')
              setSuccess('Account created — sign in with your email and password.')
            }}
            style={btn.primary}
          >Go to sign in</button>
          <div style={{ marginTop: 16 }}>
            <a href="/" style={{ ...type.meta, color: c.dim }}>Back to brikk.store</a>
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <a href="/" style={{ display: 'inline-flex', textDecoration: 'none' }}>
            <Logo size={22} />
          </a>
          <div style={{ ...type.bodySub, marginTop: 10 }}>
            {mode === 'login' ? 'Welcome back.' : 'Start your 14-day free trial.'}
          </div>
          {mode === 'signup' && (
            <div style={{ fontSize: 12, color: c.green, fontWeight: 500, marginTop: 4 }}>
              No credit card required.
            </div>
          )}
        </div>

        <div style={{ ...card, padding: '24px 22px' }}>
          {/* Mode toggle */}
          <div style={{
            display: 'flex', gap: 2,
            background: c.bgInset, borderRadius: 6, padding: 2,
            border: `1px solid ${c.border}`,
            marginBottom: 18,
          }}>
            {[{ k: 'login', l: 'Sign in' }, { k: 'signup', l: 'Sign up' }].map(m => (
              <button
                key={m.k}
                onClick={() => { setMode(m.k); setError(null); setSuccess(null) }}
                style={{
                  flex: 1,
                  background: mode === m.k ? c.white : 'transparent',
                  color: mode === m.k ? c.text : c.dim,
                  border: 'none',
                  borderRadius: 4,
                  padding: '7px 0',
                  fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: mode === m.k ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
                }}
              >{m.l}</button>
            ))}
          </div>

          {mode === 'signup' && (
            <>
              <Field label="Full name *">
                <input value={fullName} onChange={e => setFullName(e.target.value)} onKeyDown={onKey} placeholder="Alex Johnson" style={input} />
              </Field>
              <Field label="Phone">
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={onKey} placeholder="(801) 555-0142" style={input} />
              </Field>
              <Field label="Brokerage">
                <input value={brokerage} onChange={e => setBrokerage(e.target.value)} onKeyDown={onKey} placeholder="Keller Williams, eXp…" style={input} />
              </Field>
              {!showTeamCode ? (
                <button
                  type="button"
                  onClick={() => setShowTeamCode(true)}
                  style={{
                    background: 'none', border: 'none',
                    color: c.sub, fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'inherit',
                    padding: 0, marginBottom: 12, textAlign: 'left',
                  }}
                >+ I have a team code</button>
              ) : (
                <Field label="Team code">
                  <input
                    value={teamCode}
                    onChange={e => setTeamCode(e.target.value.toUpperCase())}
                    onKeyDown={onKey}
                    placeholder="TEAM-XXXX-YYYY"
                    style={{ ...input, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.04em' }}
                  />
                </Field>
              )}
            </>
          )}

          <Field label="Email *">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={onKey} placeholder="you@email.com" style={input} />
          </Field>
          <Field label="Password *">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={onKey}
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'} style={input} />
          </Field>

          {error && (
            <div style={{ background: c.redSoft, border: `1px solid ${c.redBorder}`, color: c.red, borderRadius: 6, padding: '10px 12px', fontSize: 12.5, marginBottom: 12 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: c.greenSoft, border: `1px solid ${c.greenBorder}`, color: c.green, borderRadius: 6, padding: '10px 12px', fontSize: 12.5, marginBottom: 12 }}>
              {success}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            style={{ ...btn.primary, width: '100%', height: 38, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>

          {mode === 'login' && (
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button
                onClick={async () => {
                  if (!email) { setError('Enter your email, then click this link.'); return }
                  const { error } = await supabase.auth.resetPasswordForEmail(email)
                  if (error) setError(error.message)
                  else setSuccess('Password reset link sent to your email.')
                }}
                style={{ ...btn.ghost, color: c.dim }}
              >Forgot password?</button>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <a href="/" style={{ ...type.meta }}>Back to brikk.store</a>
          <span style={{ fontSize: 11, color: c.faint }}>
            By signing up you agree to Brikk's{' '}
            <a href="/terms" style={{ color: c.dim, textDecoration: 'underline' }}>Terms</a> and{' '}
            <a href="/privacy" style={{ color: c.dim, textDecoration: 'underline' }}>Privacy Policy</a>.
          </span>
        </div>
      </div>
    </Shell>
  )
}

const Shell = ({ children }) => (
  <div style={{
    background: c.bg,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Instrument Sans',-apple-system,BlinkMacSystemFont,sans-serif",
    padding: 20,
    color: c.text,
  }}>{children}</div>
)

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={inputLabel}>{label}</label>
    {children}
  </div>
)

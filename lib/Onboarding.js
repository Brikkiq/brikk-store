'use client'
// First-run onboarding: shows once for a new agent whose Book is empty.
//   1. Welcome — what the app does
//   2. Confirm time zone (follow-ups and birthdays are scheduled by local date)
//   3. Add your first client
// Dismissible at any time; completion is remembered in localStorage.
import { useEffect, useState } from 'react'
import { api } from './client/api'
import { c, type, btn, input, inputLabel, card } from './design'
import { Logo } from './Logo'
import { isValidTimeZone } from './core/dates'

const STORAGE_KEY = 'brikk-onboarded-li-v1'

export function Onboarding() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)
  const [tz, setTz] = useState('America/New_York')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    try { if (localStorage.getItem(STORAGE_KEY)) return } catch { return }
    api.get('/households').then(book => {
      if (!cancelled && Array.isArray(book) && book.length === 0) {
        try {
          const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
          if (isValidTimeZone(detected)) setTz(detected)
        } catch {}
        setShow(true)
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
    setShow(false)
  }

  const saveTz = async () => {
    setSaving(true)
    try { await api.patch('/me', { timezone: tz }) } catch {}
    setSaving(false)
    setStep(2)
  }

  if (!show) return null

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(25,25,23,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ ...card, maxWidth: 440, width: '100%', padding: '28px 24px', position: 'relative' }}>
        <button onClick={finish} aria-label="Close" style={{ ...btn.ghost, position: 'absolute', top: 8, right: 8 }}>Skip</button>
        <Logo size={18} />

        {step === 0 && (
          <>
            <h2 style={{ ...type.pageTitle, margin: '18px 0 8px' }}>Never miss a client follow-up again.</h2>
            <p style={{ ...type.bodySub, margin: 0 }}>
              Add a client’s household and their policy. We’ll schedule every follow-up for the first six months,
              an annual review, and a birthday reminder for everyone in the family. Each morning, Today shows who
              to text — tap once and it opens in your phone’s Messages app with the text written for you.
            </p>
            <button onClick={() => setStep(1)} style={{ ...btn.primary, marginTop: 20, width: '100%', height: 44 }}>Get started</button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 style={{ ...type.pageTitle, margin: '18px 0 8px' }}>Your time zone</h2>
            <p style={{ ...type.bodySub, margin: '0 0 14px' }}>Follow-ups and birthdays show up on the right day where you live.</p>
            <label style={inputLabel} htmlFor="onb-tz">Time zone</label>
            <select id="onb-tz" value={tz} onChange={e => setTz(e.target.value)} style={input}>
              {[...new Set([tz, ...US_ZONES])].map(z => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}
            </select>
            <button onClick={saveTz} disabled={saving} style={{ ...btn.primary, marginTop: 20, width: '100%', height: 44 }}>{saving ? 'Saving…' : 'Continue'}</button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ ...type.pageTitle, margin: '18px 0 8px' }}>Add your first client</h2>
            <p style={{ ...type.bodySub, margin: 0 }}>
              Start with someone you wrote recently. Add the household, then their policy dates — the follow-ups appear right away.
            </p>
            <a href="/app/book/new" onClick={finish} style={{ ...btn.primary, marginTop: 20, width: '100%', height: 44, textDecoration: 'none', boxSizing: 'border-box' }}>Add a client</a>
            <button onClick={finish} style={{ ...btn.ghost, marginTop: 8, width: '100%', justifyContent: 'center', color: c.sub }}>I’ll do it later</button>
          </>
        )}
      </div>
    </div>
  )
}

export const US_ZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix',
  'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu', 'America/Puerto_Rico',
]

'use client'

// First-run onboarding flow.
//
// THE PROBLEM IT SOLVES (from the deep review): a new agent signs up, lands on
// an empty dashboard with no path, and the killer feature (voice) is hidden.
// Only ~15-25% of trial signups reach the "aha" in 48 hours.
//
// THE FIX: a 4-step guided flow that gets a new agent to a POPULATED dashboard
// + their first AI follow-up draft, centered on voice, in their first session.
//   1. Welcome
//   2. Add your first lead (populates the dashboard)
//   3. Meet your voice assistant (solves the hidden-button problem)
//   4. Watch AI write your first follow-up (the aha moment)
//
// Shows when: leads.length === 0 AND localStorage flag not set.
// Dismissible at any time. Completion persists in localStorage.

import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { c, type, btn, input, inputLabel } from './design'
import { Logo } from './Logo'

const STORAGE_KEY = 'brikk-onboarded-v1'

export function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)         // 0=welcome,1=add lead,2=voice,3=aha,4=done
  const [show, setShow] = useState(false)
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', temperature: 'warm', lead_type: 'Buyer' })
  const [savedLead, setSavedLead] = useState(null)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(null)
  const [draftLoading, setDraftLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      if (typeof window === 'undefined') return
      if (localStorage.getItem(STORAGE_KEY)) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // Only show for genuinely new accounts (zero leads).
      const { count } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      if ((count || 0) === 0) setShow(true)
    })()
  }, [])

  const finish = () => {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, '1')
    setShow(false)
    onComplete && onComplete()
  }

  const skip = () => finish()

  const handleAddLead = async () => {
    if (!leadForm.name.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const { data, error } = await supabase
      .from('leads')
      .insert({
        user_id: user.id,
        name: leadForm.name.trim(),
        phone: leadForm.phone.trim() || null,
        temperature: leadForm.temperature,
        lead_type: leadForm.lead_type,
        stage: 'New Lead',
        source: 'Other',
        last_contact_date: new Date().toISOString(),
      })
      .select('*')
      .single()
    setSaving(false)
    if (error) { console.error('Onboarding add lead failed:', error); return }
    setSavedLead(data)
    setStep(2)
  }

  const generateFirstDraft = async () => {
    if (!savedLead) return
    setDraftLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data: profile } = await supabase
        .from('profiles').select('full_name').eq('id', savedLead.user_id).maybeSingle()
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          leads: [{
            ...savedLead,
            days_since_contact: 0,
            recent_messages: [],
            recent_interactions: [],
          }],
          agentName: profile?.full_name || 'there',
        }),
      })
      const data = await res.json()
      setDraft(data.drafts?.[0] || null)
    } catch (err) {
      console.error('First draft failed:', err)
    }
    setDraftLoading(false)
  }

  if (!show) return null

  const Shell = ({ children }) => (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(20,20,18,0.62)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      fontFamily: "'Instrument Sans',-apple-system,BlinkMacSystemFont,sans-serif",
    }}>
      <div style={{
        background: c.white, borderRadius: 16,
        width: '100%', maxWidth: 460, maxHeight: '92vh', overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>{children}</div>
    </div>
  )

  // Progress dots
  const Dots = () => (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 4 }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          width: i === Math.min(step, 3) ? 20 : 6, height: 6, borderRadius: 3,
          background: i <= step ? c.text : c.border,
          transition: 'width 0.2s ease, background 0.2s ease',
        }} />
      ))}
    </div>
  )

  // STEP 0 — Welcome
  if (step === 0) {
    return (
      <Shell>
        <div style={{ padding: '40px 32px 32px', textAlign: 'center' }}>
          <Logo size={22} />
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: '24px 0 10px' }}>
            Welcome to Brikk.
          </h1>
          <p style={{ fontSize: 15, color: c.sub, lineHeight: 1.6, margin: '0 0 8px' }}>
            Let's get you set up in about 2 minutes. By the end you'll have your first lead in, you'll have met your voice assistant, and you'll see Brikk write a follow-up for you.
          </p>
          <p style={{ fontSize: 13, color: c.dim, margin: '0 0 28px' }}>
            No fluff. Just the stuff that closes deals.
          </p>
          <button onClick={() => setStep(1)} style={{ ...btn.primary, width: '100%', height: 46, fontSize: 15 }}>
            Let's go
          </button>
          <button onClick={skip} style={{ ...btn.ghost, marginTop: 10, color: c.dim }}>
            Skip — I'll explore on my own
          </button>
        </div>
      </Shell>
    )
  }

  // STEP 1 — Add first lead
  if (step === 1) {
    return (
      <Shell>
        <div style={{ padding: '28px 32px 32px' }}>
          <Dots />
          <div style={{ ...type.eyebrow, textAlign: 'center', margin: '14px 0 4px' }}>Step 1 of 3</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.015em', textAlign: 'center', margin: '0 0 8px' }}>
            Add your first lead
          </h2>
          <p style={{ fontSize: 13.5, color: c.sub, textAlign: 'center', lineHeight: 1.55, margin: '0 0 20px' }}>
            Even a name is enough to start. The more Brikk knows, the smarter it gets — but don't overthink it.
          </p>
          <div style={{ marginBottom: 12 }}>
            <label style={inputLabel}>Name *</label>
            <input
              value={leadForm.name}
              onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
              placeholder="Sarah Mitchell"
              style={input}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={inputLabel}>Phone</label>
            <input
              type="tel"
              value={leadForm.phone}
              onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
              placeholder="(801) 555-0142"
              style={input}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
            <div>
              <label style={inputLabel}>Temperature</label>
              <select value={leadForm.temperature} onChange={e => setLeadForm({ ...leadForm, temperature: e.target.value })} style={input}>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
              </select>
            </div>
            <div>
              <label style={inputLabel}>Type</label>
              <select value={leadForm.lead_type} onChange={e => setLeadForm({ ...leadForm, lead_type: e.target.value })} style={input}>
                <option value="Buyer">Buyer</option>
                <option value="Seller">Seller</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleAddLead}
            disabled={!leadForm.name.trim() || saving}
            style={{ ...btn.primary, width: '100%', height: 46, fontSize: 15, opacity: (!leadForm.name.trim() || saving) ? 0.5 : 1 }}
          >
            {saving ? 'Adding…' : 'Add lead'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 10, ...type.meta }}>
            Have a list already? You can import a CSV from the Leads page later.
          </div>
        </div>
      </Shell>
    )
  }

  // STEP 2 — Meet the voice assistant
  if (step === 2) {
    return (
      <Shell>
        <div style={{ padding: '28px 32px 32px', textAlign: 'center' }}>
          <Dots />
          <div style={{ ...type.eyebrow, margin: '14px 0 4px' }}>Step 2 of 3</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.015em', margin: '0 0 8px' }}>
            Meet your voice assistant
          </h2>
          <p style={{ fontSize: 13.5, color: c.sub, lineHeight: 1.6, margin: '0 0 18px' }}>
            This is the feature agents can't live without. After a showing or a call, tap the <strong style={{ color: c.text }}>"Talk to Brikk"</strong> button (bottom right), speak naturally, and Brikk turns it into structured updates you approve.
          </p>
          {/* Visual mock of the labeled voice button */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 18px' }}>
            <div style={{
              height: 48, padding: '0 18px 0 14px', borderRadius: 999,
              background: c.text, display: 'inline-flex', alignItems: 'center', gap: 9,
              boxShadow: '0 6px 24px rgba(0,0,0,0.24)',
            }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Talk to Brikk</span>
            </div>
          </div>
          <div style={{
            background: c.bg, border: `1px solid ${c.borderLight}`, borderRadius: 8,
            padding: '12px 14px', textAlign: 'left', marginBottom: 22,
          }}>
            <div style={{ ...type.eyebrow, marginBottom: 6 }}>Try saying something like</div>
            <div style={{ fontSize: 13, color: c.sub, fontStyle: 'italic', lineHeight: 1.5 }}>
              "Just showed Sarah the house on Oak Ave, she loved the kitchen, wants a second showing Saturday — remind me to text her Friday."
            </div>
          </div>
          <button onClick={() => { setStep(3); generateFirstDraft() }} style={{ ...btn.primary, width: '100%', height: 46, fontSize: 15 }}>
            Got it — what's next
          </button>
        </div>
      </Shell>
    )
  }

  // STEP 3 — The aha: AI writes the first follow-up
  if (step === 3) {
    return (
      <Shell>
        <div style={{ padding: '28px 32px 32px' }}>
          <Dots />
          <div style={{ ...type.eyebrow, textAlign: 'center', margin: '14px 0 4px' }}>Step 3 of 3</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.015em', textAlign: 'center', margin: '0 0 8px' }}>
            Watch Brikk write your first follow-up
          </h2>
          <p style={{ fontSize: 13.5, color: c.sub, textAlign: 'center', lineHeight: 1.55, margin: '0 0 18px' }}>
            Here's a follow-up message Brikk drafted for <strong style={{ color: c.text }}>{savedLead?.name || 'your lead'}</strong>. You approve, edit, or skip — Brikk never sends without you.
          </p>

          {draftLoading ? (
            <div style={{ background: c.bg, border: `1px solid ${c.borderLight}`, borderRadius: 10, padding: '28px 20px', textAlign: 'center', color: c.dim, fontSize: 13, marginBottom: 20 }}>
              Brikk is writing…
            </div>
          ) : draft ? (
            <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: '16px 18px', marginBottom: 20 }}>
              <div style={{ fontSize: 14, color: c.text, lineHeight: 1.6, fontStyle: 'italic' }}>
                "{draft.draft}"
              </div>
              {draft.reason && (
                <div style={{ fontSize: 11.5, color: c.indigo, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${c.borderLight}` }}>
                  Why now: {draft.reason}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: c.bg, border: `1px solid ${c.borderLight}`, borderRadius: 10, padding: '20px', textAlign: 'center', color: c.sub, fontSize: 13, marginBottom: 20 }}>
              Your AI Copilot is ready. Open the Copilot tab anytime to generate follow-ups for every lead that needs one.
            </div>
          )}

          <button onClick={() => setStep(4)} style={{ ...btn.primary, width: '100%', height: 46, fontSize: 15 }}>
            Amazing — finish setup
          </button>
        </div>
      </Shell>
    )
  }

  // STEP 4 — Done
  return (
    <Shell>
      <div style={{ padding: '40px 32px 32px', textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: c.greenSoft, border: `1px solid ${c.greenBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', color: c.green,
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 10px' }}>
          You're set up.
        </h2>
        <p style={{ fontSize: 14.5, color: c.sub, lineHeight: 1.6, margin: '0 0 8px' }}>
          This is your command center. Open it every morning and Brikk tells you exactly who to follow up with.
        </p>
        <div style={{ background: c.bg, border: `1px solid ${c.borderLight}`, borderRadius: 8, padding: '14px 16px', textAlign: 'left', margin: '18px 0 24px' }}>
          <div style={{ ...type.eyebrow, marginBottom: 8 }}>To get the most out of Brikk this week</div>
          <ul style={{ fontSize: 13, color: c.sub, lineHeight: 1.7, margin: 0, paddingLeft: 18 }}>
            <li>Add 4 more leads (or import a CSV) — the AI gets sharper with each one</li>
            <li>Use "Talk to Brikk" after every showing or call</li>
            <li>Share your lead capture link (Settings) on your business card + Instagram</li>
          </ul>
        </div>
        <button onClick={finish} style={{ ...btn.primary, width: '100%', height: 46, fontSize: 15 }}>
          Open my dashboard
        </button>
      </div>
    </Shell>
  )
}

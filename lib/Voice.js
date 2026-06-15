'use client'

// Floating mic button + voice capture modal that lives in the app layout —
// available on every page. Handles recording, multi-action AI extraction, and
// applying each action to Supabase. When done, fires a window event
// "brikk:voice-saved" so the currently visible page can refresh its data.

import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import { c, type, card, btn } from './design'

export function VoiceButton({ leadHint }) {
  const [open, setOpen] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [leads, setLeads] = useState([])
  const recognitionRef = useRef(null)
  // Mirror the recording state into a ref so SpeechRecognition's onend handler
  // doesn't read a stale closure value when deciding whether to auto-restart.
  const recordingRef = useRef(false)

  // Lazy-load the user's leads on first open so name-matching works.
  useEffect(() => {
    if (!open || leads.length) return
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('leads').select('id, name, notes, price_range, stage, temperature, source').eq('user_id', user.id)
      setLeads(data || [])
    })()
  }, [open])

  const startRecording = () => {
    const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null
    if (!SR) { alert('Voice input is not supported in this browser. Chrome / Safari / Edge work.'); return }
    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    let final = ''
    recognition.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' '
        else interim += e.results[i][0].transcript
      }
      setTranscript(final + interim)
    }
    recognition.onerror = (e) => { console.error('Speech error:', e.error); recordingRef.current = false; setRecording(false) }
    recognition.onend = () => { if (recordingRef.current) recognition.start() }
    recognition.start()
    recordingRef.current = true
    setRecording(true)
    setOpen(true)
    setTranscript('')
    setResult(null)
    recognitionRef.current = recognition
    if (typeof window !== 'undefined' && window.brikk?.haptic) window.brikk.haptic('medium')
  }

  const stopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      recognitionRef.current.stop()
    }
    recordingRef.current = false
    setRecording(false)
    if (typeof window !== 'undefined' && window.brikk?.haptic) window.brikk.haptic('success')
    if (!transcript.trim()) return
    setProcessing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ mode: 'voice_extract', transcript: transcript.trim() }),
      })
      const data = await res.json()
      const extraction = data.extraction || { actions: [], raw: transcript.trim() }
      // Inject lead context — when triggered from a lead's page, pre-fill lead_name on every action
      if (leadHint?.name && (!extraction.lead_name || extraction.actions?.every(a => !a.lead_name))) {
        extraction.lead_name = leadHint.name
        extraction.actions = (extraction.actions || []).map(a => ({ ...a, lead_name: a.lead_name || leadHint.name }))
      }
      setResult(extraction)
    } catch {
      setResult({ actions: [], raw: transcript.trim(), note: 'AI unavailable — saved as raw note.' })
    }
    setProcessing(false)
  }

  const matchLeadByName = (name) => {
    if (!name) return null
    const q = name.toLowerCase().trim()
    return leads.find(l => {
      const ln = (l.name || '').toLowerCase()
      if (!ln) return false
      return ln === q || ln.includes(q) || q.includes(ln) || ln.split(' ')[0] === q.split(' ')[0]
    }) || null
  }

  const applyAction = async (action, user, isNewLead) => {
    let lead = matchLeadByName(action.lead_name)
    if (!lead && action.lead_name && (isNewLead || ['outbound_message', 'inbound_message', 'profile_update', 'interaction'].includes(action.type))) {
      const { data: created } = await supabase.from('leads').insert({
        user_id: user.id,
        name: action.lead_name,
        source: 'Voice Note',
        temperature: 'warm',
        stage: 'New Lead',
        lead_type: 'Buyer',
        last_contact_date: new Date().toISOString(),
      }).select('*').single()
      if (created) lead = created
    }
    if (!lead) {
      await supabase.from('interactions').insert({
        user_id: user.id, interaction_type: 'voice_note',
        notes: action.content || action.notes || transcript,
      })
      return 'General note logged'
    }
    const touchLead = async (extra = {}) => {
      await supabase.from('leads').update({
        last_contact_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...extra,
      }).eq('id', lead.id)
    }
    switch (action.type) {
      case 'outbound_message':
        await supabase.from('messages').insert({
          user_id: user.id, lead_id: lead.id,
          direction: 'outbound', channel: action.channel || 'text',
          content: action.content || '', status: 'logged_via_voice',
        })
        await supabase.from('interactions').insert({
          user_id: user.id, lead_id: lead.id,
          interaction_type: action.channel === 'email' ? 'email' : action.channel === 'phone' ? 'call' : 'text',
          notes: `Voice-logged outbound: ${action.content || ''}`,
        })
        await touchLead()
        return `Logged outbound to ${lead.name}`
      case 'inbound_message':
        await supabase.from('messages').insert({
          user_id: user.id, lead_id: lead.id,
          direction: 'inbound', channel: action.channel || 'text',
          content: action.content || '', status: 'logged_via_voice',
        })
        await supabase.from('interactions').insert({
          user_id: user.id, lead_id: lead.id,
          interaction_type: 'text_received',
          notes: `Voice-logged reply: ${action.content || ''}`,
        })
        await touchLead()
        return `Logged reply from ${lead.name}`
      case 'profile_update': {
        const allowed = ['price_range', 'temperature', 'stage', 'lead_type', 'phone', 'email',
                         'preferred_area', 'bedrooms', 'pre_approved', 'pre_approved_amount',
                         'timeline', 'contact_preference']
        const fields = action.fields || {}
        const update = {}
        for (const k of allowed) {
          if (fields[k] !== undefined && fields[k] !== null && fields[k] !== '') update[k] = fields[k]
        }
        if (fields.notes) {
          const existing = lead.notes || ''
          update.notes = existing ? `${existing}\n\n[Voice ${new Date().toLocaleDateString()}] ${fields.notes}` : `[Voice] ${fields.notes}`
        }
        await touchLead(update)
        return `Updated ${lead.name}: ${Object.keys(update).join(', ') || 'no fields'}`
      }
      case 'interaction':
        await supabase.from('interactions').insert({
          user_id: user.id, lead_id: lead.id,
          interaction_type: action.kind || 'voice_note',
          notes: action.notes || action.content || '',
        })
        await touchLead()
        return `Logged ${action.kind || 'interaction'} on ${lead.name}`
      default:
        return null
    }
  }

  const applyAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const actions = (result?.actions || []).filter(a => a._enabled !== false)
    let summary = []
    if (actions.length === 0) {
      await supabase.from('interactions').insert({
        user_id: user.id, interaction_type: 'voice_note',
        notes: `[Voice ${new Date().toLocaleDateString()}] ${result?.raw || transcript}`,
      })
      summary = ['General note logged']
    } else {
      for (const a of actions) {
        try {
          const r = await applyAction(a, user, result?.is_new_lead)
          if (r) summary.push(r)
        } catch (err) {
          console.error('apply failed', err?.message)
        }
      }
    }
    setResult(prev => ({ ...prev, saved: true, savedSummary: summary }))
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('brikk:voice-saved'))
    if (typeof window !== 'undefined' && window.brikk?.haptic) window.brikk.haptic('success')
    setTimeout(() => {
      setOpen(false); setTranscript(''); setResult(null)
    }, 2400)
  }

  const toggleAction = (idx) => {
    setResult(prev => {
      if (!prev) return prev
      const actions = (prev.actions || []).map((a, i) =>
        i === idx ? { ...a, _enabled: a._enabled === false ? true : false } : a)
      return { ...prev, actions }
    })
  }

  const close = () => {
    if (recording) return
    setOpen(false); setTranscript(''); setResult(null)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={startRecording}
        aria-label="Voice capture"
        style={{
          position: 'fixed',
          // Sits above the mobile bottom tab bar with safe-area inset. The bar
          // is taller now (10px top + ~35px content + 10px bottom + safe-area).
          bottom: 'calc(108px + env(safe-area-inset-bottom, 0px))',
          right: 20,
          width: 52, height: 52, borderRadius: '50%',
          background: c.text,
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 6px 24px rgba(0,0,0,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 80,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>

      {/* Modal */}
      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) close() }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(20,20,18,0.5)',
            zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div style={{
            background: c.white, borderRadius: 12,
            padding: '24px 22px', width: '100%', maxWidth: 520,
            maxHeight: '82vh', overflow: 'auto',
            marginBottom: 24,
            border: `1px solid ${c.border}`,
            boxShadow: '0 10px 40px rgba(20,20,18,0.18)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Voice capture</div>
                <div style={{ ...type.meta }}>
                  {leadHint?.name && <span>About {leadHint.name} · </span>}
                  {recording ? 'Listening…'
                    : processing ? 'Parsing…'
                    : result?.saved ? 'Saved'
                    : result ? 'Review actions'
                    : transcript ? 'Process or record again'
                    : 'Talk naturally — Brikk will sort it out'}
                </div>
              </div>
              {!recording && (
                <button onClick={close} style={{ background: 'none', border: 'none', fontSize: 18, color: c.dim, cursor: 'pointer' }}>×</button>
              )}
            </div>

            {recording && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: c.redSoft, border: `2px solid ${c.red}`,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                  animation: 'brikkVoicePulse 1.2s ease-in-out infinite',
                }}>
                  <div style={{ width: 16, height: 16, borderRadius: 3, background: c.red }} />
                </div>
                <style>{`@keyframes brikkVoicePulse{0%,100%{transform:scale(1);opacity:0.7}50%{transform:scale(1.08);opacity:1}}`}</style>
                <div>
                  <button onClick={stopRecording} style={{ ...btn.primary, background: c.red, border: 'none' }}>Stop</button>
                </div>
              </div>
            )}

            {transcript && (
              <div style={{
                background: c.bgInset, border: `1px solid ${c.border}`,
                borderRadius: 6, padding: '12px 14px', marginBottom: 12,
              }}>
                <div style={type.eyebrow}>What you said</div>
                <div style={{ ...type.body, fontSize: 13, marginTop: 6 }}>{transcript}</div>
              </div>
            )}

            {processing && (
              <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 13, color: c.dim }}>
                Reading between the lines…
              </div>
            )}

            {result && !processing && (
              <div style={{ marginBottom: 12 }}>
                {result.saved ? (
                  <div style={{ ...card, padding: '16px', background: c.greenSoft, borderColor: c.greenBorder }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: c.green, marginBottom: 6 }}>Saved</div>
                    {(result.savedSummary || []).map((s, i) => (
                      <div key={i} style={{ ...type.bodySub, fontSize: 12.5 }}>✓ {s}</div>
                    ))}
                  </div>
                ) : (
                  <>
                    {(!result.actions || result.actions.length === 0) && (
                      <div style={{ ...card, padding: '14px 16px', marginBottom: 10 }}>
                        <div style={type.eyebrow}>Couldn't extract structured actions</div>
                        <div style={{ ...type.bodySub, marginTop: 6 }}>{result.note || 'Will save your transcript as a general note.'}</div>
                      </div>
                    )}
                    {result.actions && result.actions.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                        <div style={type.eyebrow}>{result.actions.length} action{result.actions.length === 1 ? '' : 's'} — tap to toggle</div>
                        {result.actions.map((a, i) => {
                          const enabled = a._enabled !== false
                          const matched = matchLeadByName(a.lead_name)
                          return (
                            <ActionRow key={i} action={a} enabled={enabled} matched={matched} onToggle={() => toggleAction(i)} />
                          )
                        })}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={applyAll} style={{ ...btn.primary, flex: 1 }}>Apply all</button>
                      <button onClick={close} style={btn.secondary}>Discard</button>
                    </div>
                  </>
                )}
              </div>
            )}

            {!recording && !processing && !result && transcript && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={startRecording} style={{ ...btn.secondary, flex: 1 }}>Record again</button>
                <button onClick={stopRecording} style={{ ...btn.primary, flex: 1 }}>Process</button>
              </div>
            )}

            {!recording && !transcript && !result && (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <button onClick={startRecording} style={btn.primary}>Start recording</button>
                <div style={{ ...type.meta, marginTop: 10, lineHeight: 1.55 }}>
                  <em>"Texted Sarah we have 3 new listings — she replied she's free Thursday at 2."</em><br/>
                  <em>"James's budget went up to 480K. Pre-approved now."</em>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

const ActionRow = ({ action, enabled, matched, onToggle }) => {
  const label = {
    outbound_message: 'Outbound message',
    inbound_message: 'Inbound reply',
    profile_update: 'Profile update',
    interaction: 'Activity',
  }[action.type] || action.type
  const accent = {
    outbound_message: c.indigo,
    inbound_message: c.green,
    profile_update: c.amber,
    interaction: c.purple,
  }[action.type] || c.dim
  return (
    <button
      onClick={onToggle}
      style={{
        background: enabled ? c.white : c.bgInset,
        border: `1px solid ${enabled ? c.border : c.borderLight}`,
        borderLeft: `3px solid ${enabled ? accent : c.borderLight}`,
        borderRadius: 6,
        padding: '10px 12px',
        textAlign: 'left',
        cursor: 'pointer', fontFamily: 'inherit',
        opacity: enabled ? 1 : 0.55,
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: 4,
        background: enabled ? accent : 'transparent',
        border: `1.5px solid ${enabled ? accent : c.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: 2, flexShrink: 0,
      }}>
        {enabled && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{ ...type.eyebrow, color: accent }}>{label}</span>
          <span style={{ ...type.meta }}>
            · {action.lead_name || 'unknown lead'}
            {matched && <span style={{ color: c.green }}> · matched</span>}
            {!matched && action.lead_name && <span style={{ color: c.amber }}> · will create</span>}
          </span>
        </div>
        {action.content && <div style={{ ...type.bodySub, fontSize: 13, fontStyle: 'italic' }}>"{action.content}"</div>}
        {action.type === 'profile_update' && action.fields && (
          <div style={{ ...type.bodySub, fontSize: 13 }}>
            {Object.entries(action.fields).map(([k, v]) => `${k}: ${v}`).join(' · ')}
          </div>
        )}
        {action.type === 'interaction' && action.notes && (
          <div style={{ ...type.bodySub, fontSize: 13 }}>{action.kind ? `${action.kind} — ` : ''}{action.notes}</div>
        )}
      </div>
    </button>
  )
}

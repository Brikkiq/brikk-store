'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { c, type, card, statTile, btn, chipFor, fmt } from '@/lib/design'

export default function AppOverview() {
  const [leads, setLeads] = useState([])
  const [deals, setDeals] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dismissedActions, setDismissedActions] = useState([])
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [voiceProcessing, setVoiceProcessing] = useState(false)
  const [voiceResult, setVoiceResult] = useState(null)
  const [showVoice, setShowVoice] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    try {
      const [leadsRes, dealsRes, profileRes] = await Promise.all([
        supabase.from('leads').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('deals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ])
      setLeads(leadsRes.data || [])
      setDeals(dealsRes.data || [])
      setProfile(profileRes.data)
    } catch (err) {
      console.error('Dashboard load failed:', err?.message)
    }
    setLoading(false)
  }

  const handleLogContact = async (leadId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('leads').update({
      last_contact_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', leadId)
    await supabase.from('interactions').insert({
      user_id: user.id, lead_id: leadId,
      interaction_type: 'contact', notes: 'Quick action: logged contact',
    })
    setDismissedActions(prev => [...prev, `lead-${leadId}`])
    loadData()
  }

  // --- Voice-to-CRM ---
  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Voice input is not supported in this browser.'); return }
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
    recognition.onerror = (e) => { console.error('Speech error:', e.error); setRecording(false) }
    recognition.onend = () => { if (recording) recognition.start() }
    recognition.start()
    setRecording(true)
    setShowVoice(true)
    setTranscript('')
    setVoiceResult(null)
    window._brikk_recognition = recognition
    if (window.brikk?.haptic) window.brikk.haptic('medium')
  }

  const stopRecording = async () => {
    if (window._brikk_recognition) {
      window._brikk_recognition.onend = null
      window._brikk_recognition.stop()
    }
    setRecording(false)
    if (window.brikk?.haptic) window.brikk.haptic('success')
    if (!transcript.trim()) return
    setVoiceProcessing(true)
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'voice_extract', transcript: transcript.trim() }),
      })
      const data = await res.json()
      setVoiceResult(data.extraction || { raw: transcript.trim(), note: 'Could not extract structured data — saved as note.' })
    } catch {
      setVoiceResult({ raw: transcript.trim(), note: 'AI unavailable — saved as raw note.' })
    }
    setVoiceProcessing(false)
  }

  const saveVoiceNote = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const matchName = voiceResult?.lead_name || voiceResult?.new_lead_name || null
    let matched = null
    if (matchName) {
      const q = matchName.toLowerCase().trim()
      matched = leads.find(l => {
        const ln = (l.name || '').toLowerCase()
        return ln.includes(q) || q.includes(ln) || ln.split(' ')[0] === q.split(' ')[0]
      })
    }
    const newNote = voiceResult?.notes || voiceResult?.raw || transcript

    if (matched) {
      const existing = matched.notes || ''
      const update = {
        last_contact_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: existing
          ? `${existing}\n\n[Voice ${new Date().toLocaleDateString()}] ${newNote}`
          : `[Voice ${new Date().toLocaleDateString()}] ${newNote}`,
      }
      if (voiceResult?.price && !matched.price_range) update.price_range = voiceResult.price
      if (voiceResult?.stage) update.stage = voiceResult.stage
      if (voiceResult?.temperature) update.temperature = voiceResult.temperature
      await supabase.from('leads').update(update).eq('id', matched.id)
      await supabase.from('interactions').insert({
        user_id: user.id, lead_id: matched.id,
        interaction_type: 'voice_note', notes: newNote,
      })
      setVoiceResult(prev => ({ ...prev, saved: true, savedTo: matched.name }))
    } else if (matchName) {
      await supabase.from('leads').insert({
        user_id: user.id,
        name: matchName,
        phone: voiceResult?.phone || '',
        notes: `[Voice ${new Date().toLocaleDateString()}] ${newNote}`,
        source: 'Voice Note',
        temperature: voiceResult?.temperature || 'warm',
        stage: voiceResult?.stage || 'New Lead',
        lead_type: voiceResult?.lead_type || 'Buyer',
        price_range: voiceResult?.price || '',
        last_contact_date: new Date().toISOString(),
      })
      setVoiceResult(prev => ({ ...prev, saved: true, savedTo: matchName + ' (new)' }))
    } else {
      await supabase.from('interactions').insert({
        user_id: user.id,
        interaction_type: 'voice_note',
        notes: `[Voice ${new Date().toLocaleDateString()}] ${transcript}`,
      })
      setVoiceResult(prev => ({ ...prev, saved: true, savedTo: 'General notes' }))
    }

    if (window.brikk?.haptic) window.brikk.haptic('success')
    loadData()
    setTimeout(() => {
      setShowVoice(false); setTranscript(''); setVoiceResult(null)
    }, 1400)
  }

  // --- Build action list ---
  const actions = []

  leads.forEach(l => {
    const days = fmt.daysSince(l.last_contact_date) ?? 999
    if (l.temperature === 'hot' && days >= 1) {
      actions.push({
        id: `lead-${l.id}`,
        priority: days >= 3 ? 'critical' : 'high',
        category: 'Follow up',
        title: `Reach out to ${l.name}`,
        subtitle: `Hot ${l.lead_type || 'lead'} · ${days}d since contact`,
        meta: [l.stage, l.price_range].filter(Boolean).join(' · '),
        tone: days >= 3 ? 'urgent' : 'warn',
        primaryLabel: 'Log contact',
        primaryFn: () => handleLogContact(l.id),
        secondaryHref: '/app/messages',
        secondaryLabel: 'Message',
      })
    } else if (l.temperature === 'warm' && days >= 3) {
      actions.push({
        id: `lead-${l.id}`,
        priority: days >= 7 ? 'high' : 'medium',
        category: 'Follow up',
        title: `Check in with ${l.name}`,
        subtitle: `Warm lead · ${days}d since contact${days >= 7 ? ' — going cold' : ''}`,
        meta: [l.stage, l.price_range].filter(Boolean).join(' · '),
        tone: days >= 7 ? 'urgent' : 'warn',
        primaryLabel: 'Log contact',
        primaryFn: () => handleLogContact(l.id),
        secondaryHref: '/app/messages',
        secondaryLabel: 'Message',
      })
    }
  })

  deals.forEach(d => {
    if (!d.close_date) return
    const left = fmt.daysUntil(d.close_date)
    if (left === null || left > 14 || left < -3) return
    actions.push({
      id: `deal-${d.id}`,
      priority: left <= 3 ? 'critical' : left <= 7 ? 'high' : 'medium',
      category: 'Closing',
      title: d.address,
      subtitle:
        left <= 0 ? 'Closes today or overdue — confirm signatures and funds'
        : left <= 3 ? `Closes in ${left} day${left === 1 ? '' : 's'} — confirm clear-to-close`
        : left <= 7 ? `${left} days to close — verify lender and title`
        : `${left} days to close — on track`,
      meta: [d.client_name, d.price ? fmt.money(d.price) : null, d.commission ? `Commission ${fmt.money(d.commission)}` : null]
        .filter(Boolean).join(' · '),
      tone: left <= 3 ? 'urgent' : left <= 7 ? 'warn' : 'info',
      secondaryHref: '/app/deals',
      secondaryLabel: 'Open deal',
    })
  })

  const leadsNeedingFollowUp = leads.filter(l => {
    const d = fmt.daysSince(l.last_contact_date) ?? 999
    return (l.temperature === 'hot' && d >= 1) || (l.temperature === 'warm' && d >= 3) || (l.temperature === 'cold' && d >= 7)
  }).length

  if (leadsNeedingFollowUp > 0) {
    actions.push({
      id: 'copilot',
      priority: 'medium',
      category: 'Copilot',
      title: `${leadsNeedingFollowUp} draft${leadsNeedingFollowUp === 1 ? '' : 's'} ready to review`,
      subtitle: 'AI-written follow-ups awaiting your approval',
      tone: 'info',
      secondaryHref: '/app/copilot',
      secondaryLabel: 'Open Copilot',
    })
  }

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  actions.sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3))
  const pending = actions.filter(a => !dismissedActions.includes(a.id))

  const totalCommission = deals.reduce((s, d) => s + (d.commission || 0), 0)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : ''

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: c.dim, fontSize: 13 }}>Loading your day…</div>
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ ...type.pageTitle, margin: 0 }}>
          Good {greeting}{firstName ? `, ${firstName}` : ''}.
        </h1>
        <p style={{ ...type.bodySub, margin: '4px 0 0' }}>
          {pending.length === 0
            ? "You're all caught up."
            : pending.length === 1
              ? '1 item needs your attention today.'
              : `${pending.length} items need your attention today.`}
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        <KPI label="Open actions" value={pending.length} accent={pending.length > 0 ? c.amber : c.green} />
        <KPI label="Active leads" value={leads.length} />
        <KPI label="Deals in flight" value={deals.length} accent={c.green} />
        <KPI label="Pending commission" value={fmt.moneyK(totalCommission)} accent={c.green} />
      </div>

      {/* Actions */}
      <section style={{ marginBottom: 32 }}>
        <SectionHeader label="Today's actions" />
        {pending.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pending.map(a => <ActionRow key={a.id} action={a} onDismiss={() => setDismissedActions(p => [...p, a.id])} />)}
          </div>
        ) : (
          <EmptyState
            isFresh={leads.length === 0 && deals.length === 0}
          />
        )}
      </section>

      {/* Quick links */}
      <section>
        <SectionHeader label="Jump to" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
          <QuickLink href="/app/leads"     label="Add a lead"        sub="Capture a new prospect" />
          <QuickLink href="/app/deals"     label="Log a deal"        sub="Under contract" />
          <QuickLink href="/app/copilot"   label="Generate drafts"   sub="AI follow-ups" />
          <QuickLink href="/app/calendar"  label="Smart calendar"    sub="Today + upcoming" />
        </div>
      </section>

      {/* Floating voice button */}
      {!showVoice && (
        <button
          onClick={startRecording}
          aria-label="Record voice note"
          style={{
            position: 'fixed', bottom: 92, right: 24,
            width: 48, height: 48, borderRadius: '50%',
            background: c.text, border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>
      )}

      {/* Voice modal */}
      {showVoice && (
        <VoiceModal
          recording={recording}
          transcript={transcript}
          processing={voiceProcessing}
          result={voiceResult}
          leads={leads}
          onStart={startRecording}
          onStop={stopRecording}
          onSave={saveVoiceNote}
          onClose={() => { setShowVoice(false); setTranscript(''); setVoiceResult(null) }}
        />
      )}
    </div>
  )
}

const KPI = ({ label, value, accent }) => (
  <div style={statTile}>
    <span style={type.eyebrow}>{label}</span>
    <span style={{ ...type.metric, color: accent || c.text }}>{value}</span>
  </div>
)

const SectionHeader = ({ label, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
    <span style={type.eyebrow}>{label}</span>
    {action}
  </div>
)

const ActionRow = ({ action, onDismiss }) => {
  const tone = action.tone || 'neutral'
  const accent = tone === 'urgent' ? c.red : tone === 'warn' ? c.amber : tone === 'info' ? c.indigo : c.dim
  return (
    <div style={{
      ...card,
      padding: '16px 18px',
      borderLeft: `3px solid ${accent}`,
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start',
      flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ ...type.eyebrow, color: accent }}>{action.category}</span>
          {action.priority === 'critical' && (
            <span style={{ ...chipFor('hot'), border: 'none', background: c.redSoft }}>Urgent</span>
          )}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 2 }}>
          {action.title}
        </div>
        <div style={{ ...type.bodySub, fontSize: 13 }}>{action.subtitle}</div>
        {action.meta && <div style={{ ...type.meta, marginTop: 4 }}>{action.meta}</div>}
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {action.primaryFn && (
          <button onClick={action.primaryFn} style={btn.primary}>{action.primaryLabel}</button>
        )}
        {action.secondaryHref && (
          <a href={action.secondaryHref} style={{ ...btn.secondary, textDecoration: 'none' }}>
            {action.secondaryLabel}
          </a>
        )}
        <button onClick={onDismiss} style={btn.ghost} aria-label="Dismiss">Skip</button>
      </div>
    </div>
  )
}

const EmptyState = ({ isFresh }) => (
  <div style={{ ...card, padding: '32px 24px', textAlign: 'center' }}>
    {isFresh ? (
      <>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Welcome to Brikk</div>
        <div style={{ ...type.bodySub, marginBottom: 16, maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>
          Start by adding your current leads. Once your pipeline is in here, this screen will tell you exactly what to do every day.
        </div>
        <a href="/app/leads" style={{ ...btn.primary, textDecoration: 'none' }}>Add your first lead</a>
      </>
    ) : (
      <>
        <div style={{ fontSize: 15, fontWeight: 600, color: c.green, marginBottom: 6 }}>All caught up</div>
        <div style={{ ...type.bodySub }}>Nothing needs attention right now. Check back later.</div>
      </>
    )}
  </div>
)

const QuickLink = ({ href, label, sub }) => (
  <a href={href} style={{
    ...card, padding: '14px 16px',
    textDecoration: 'none', display: 'block',
    transition: 'border-color 0.12s ease, transform 0.08s ease',
  }}>
    <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{label}</div>
    <div style={{ ...type.meta, marginTop: 2 }}>{sub}</div>
  </a>
)

const VoiceModal = ({ recording, transcript, processing, result, leads, onStart, onStop, onSave, onClose }) => (
  <div
    onClick={e => { if (e.target === e.currentTarget && !recording) onClose() }}
    style={{
      position: 'fixed', inset: 0, background: 'rgba(20,20,18,0.5)',
      zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: 20,
    }}
  >
    <div style={{
      background: c.white, borderRadius: 12,
      padding: '24px 22px', width: '100%', maxWidth: 460,
      maxHeight: '78vh', overflow: 'auto',
      marginBottom: 24,
      border: `1px solid ${c.border}`,
      boxShadow: '0 10px 40px rgba(20,20,18,0.18)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Voice note</div>
          <div style={{ ...type.meta }}>{recording ? 'Listening…' : 'Review and save'}</div>
        </div>
        {!recording && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, color: c.dim, cursor: 'pointer' }}>×</button>
        )}
      </div>

      {recording && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: c.redSoft, border: `2px solid ${c.red}`,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
            animation: 'brikkPulse 1.2s ease-in-out infinite',
          }}>
            <div style={{ width: 16, height: 16, borderRadius: 3, background: c.red }} />
          </div>
          <style>{`@keyframes brikkPulse{0%,100%{transform:scale(1);opacity:0.7}50%{transform:scale(1.08);opacity:1}}`}</style>
          <div>
            <button onClick={onStop} style={{ ...btn.primary, background: c.red, border: 'none' }}>Stop</button>
          </div>
        </div>
      )}

      {transcript && (
        <div style={{
          background: c.bgInset, border: `1px solid ${c.border}`,
          borderRadius: 6, padding: '12px 14px', marginBottom: 12,
        }}>
          <div style={type.eyebrow}>Transcript</div>
          <div style={{ ...type.body, fontSize: 13, marginTop: 6 }}>{transcript}</div>
        </div>
      )}

      {processing && (
        <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 13, color: c.dim }}>
          Extracting lead details…
        </div>
      )}

      {result && !processing && (
        <div style={{ marginBottom: 12 }}>
          {result.saved ? (
            <div style={{ ...card, padding: '18px 16px', textAlign: 'center', background: c.greenSoft, borderColor: c.greenBorder }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: c.green }}>Saved</div>
              <div style={{ ...type.bodySub, marginTop: 2 }}>Updated: {result.savedTo}</div>
            </div>
          ) : (
            <>
              {(result.lead_name || result.new_lead_name) && (
                <div style={{ ...card, padding: '14px 16px', marginBottom: 10 }}>
                  <div style={type.eyebrow}>Extracted</div>
                  {(() => {
                    const q = (result.lead_name || result.new_lead_name || '').toLowerCase().trim()
                    const match = leads.find(l => {
                      const ln = (l.name || '').toLowerCase()
                      return ln.includes(q) || q.includes(ln) || ln.split(' ')[0] === q.split(' ')[0]
                    })
                    return match ? (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ ...type.meta, color: c.green }}>Matched existing lead</div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{match.name}</div>
                        <div style={{ ...type.meta, marginTop: 2 }}>
                          {[match.temperature, match.stage, match.source].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ ...type.meta, color: c.amber }}>New lead will be created</div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{result.lead_name || result.new_lead_name}</div>
                      </div>
                    )
                  })()}
                  {result.action && <div style={{ ...type.bodySub, marginTop: 6 }}>{result.action}</div>}
                  {result.notes && <div style={{ ...type.bodySub, marginTop: 6 }}>{result.notes}</div>}
                </div>
              )}
              {!(result.lead_name || result.new_lead_name) && result.raw && (
                <div style={{ ...card, padding: '14px 16px', marginBottom: 10 }}>
                  <div style={type.eyebrow}>Voice note</div>
                  <div style={{ ...type.bodySub, marginTop: 6 }}>{result.raw}</div>
                  <div style={{ ...type.meta, marginTop: 6, fontStyle: 'italic' }}>No lead name detected — will save as general note.</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={onSave} style={{ ...btn.primary, flex: 1 }}>Save to CRM</button>
                <button onClick={onClose} style={btn.secondary}>Discard</button>
              </div>
            </>
          )}
        </div>
      )}

      {!recording && !processing && !result && transcript && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onStart} style={{ ...btn.secondary, flex: 1 }}>Record again</button>
          <button onClick={onStop} style={{ ...btn.primary, flex: 1 }}>Process</button>
        </div>
      )}

      {!recording && !transcript && (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <button onClick={onStart} style={btn.primary}>Start recording</button>
          <div style={{ ...type.meta, marginTop: 8 }}>Speak naturally — AI will extract lead details.</div>
        </div>
      )}
    </div>
  </div>
)

'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { c, type, card, btn, input, fmt, temperatureChip } from '@/lib/design'

export default function MessagesPage() {
  const [leads, setLeads] = useState([])
  const [messages, setMessages] = useState([])
  const [selectedLead, setSelectedLead] = useState(null)
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [profile, setProfile] = useState(null)
  const [toast, setToast] = useState(null)
  const messagesEndRef = useRef(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => { loadData() }, [])
  useEffect(() => { if (selectedLead) loadMessages(selectedLead.id) }, [selectedLead])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [leadsRes, profileRes] = await Promise.all([
      supabase.from('leads').select('*').eq('user_id', user.id).order('last_contact_date', { ascending: false }),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ])
    setLeads(leadsRes.data || [])
    setProfile(profileRes.data)
    setLoading(false)
  }

  const loadMessages = async (leadId) => {
    const { data } = await supabase.from('messages').select('*')
      .eq('lead_id', leadId).order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const handleSend = async () => {
    if (!draft.trim() || !selectedLead) return
    setSending(true)
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    const session = (await supabase.auth.getSession()).data.session
    if (authErr || !user) { setSending(false); return }

    let smsStatus = 'logged'
    let smsError = null

    if (selectedLead.phone) {
      try {
        const smsRes = await fetch('/api/sms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ to: selectedLead.phone, message: draft.trim() }),
        })
        const smsData = await smsRes.json()
        if (smsData.success) smsStatus = 'sent'
        else { smsStatus = 'failed'; smsError = smsData.error }
      } catch (err) {
        smsStatus = 'failed'
        smsError = err?.message || 'Network error'
      }
    }

    await supabase.from('messages').insert({
      user_id: user.id, lead_id: selectedLead.id,
      direction: 'outbound', channel: 'text',
      content: draft.trim(), status: smsStatus,
    })
    await supabase.from('leads').update({
      last_contact_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', selectedLead.id)
    await supabase.from('interactions').insert({
      user_id: user.id, lead_id: selectedLead.id,
      interaction_type: 'text',
      notes: `${smsStatus === 'sent' ? 'SMS sent' : 'Message logged'}: ${draft.trim()}`,
    })

    if (smsError) showToast(`SMS failed: ${smsError}`)
    else showToast('Message sent')

    setDraft('')
    setSending(false)
    if (window.brikk?.haptic) window.brikk.haptic('success')
    loadMessages(selectedLead.id)
    loadData()
  }

  const handleAIDraft = async () => {
    if (!selectedLead) return
    setGenerating(true)
    const days = fmt.daysSince(selectedLead.last_contact_date) ?? 0
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: [{ ...selectedLead, days_since_contact: days }],
          agentName: profile?.full_name || 'Alex',
        }),
      })
      const data = await res.json()
      if (data.drafts?.[0]?.draft) setDraft(data.drafts[0].draft)
    } catch (err) {
      console.error('AI draft failed:', err?.message)
    }
    setGenerating(false)
  }

  const filteredLeads = searchTerm
    ? leads.filter(l => (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
    : leads

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: c.dim, fontSize: 13 }}>Loading messages…</div>

  const showConversation = selectedLead !== null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', minHeight: 500 }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 80, right: 24, zIndex: 200,
          background: c.greenSoft, border: `1px solid ${c.greenBorder}`,
          borderRadius: 6, padding: '10px 16px',
          fontSize: 13, color: c.green, fontWeight: 500,
          boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
        }}>{toast}</div>
      )}

      <div style={{ marginBottom: 16 }}>
        <h1 style={{ ...type.pageTitle, margin: 0 }}>Messages</h1>
        <p style={{ ...type.bodySub, margin: '4px 0 0' }}>Text leads directly. AI can draft a message for you.</p>
      </div>

      <style>{`
        .brikk-back-btn { display: none; }
        @media (max-width: 700px) {
          .brikk-msg-list { display: ${showConversation ? 'none' : 'flex'} !important; }
          .brikk-msg-conv { display: ${showConversation ? 'flex' : 'none'} !important; }
          .brikk-back-btn { display: inline-flex !important; }
        }
      `}</style>

      <div style={{ flex: 1, display: 'flex', gap: 14, minHeight: 0 }}>
        {/* Lead list */}
        <div className="brikk-msg-list" style={{
          flex: '0 0 280px',
          ...card, padding: 0,
          display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: '100%',
        }}>
          <div style={{ padding: 12, borderBottom: `1px solid ${c.border}` }}>
            <input
              placeholder="Search leads…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={input}
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredLeads.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: c.dim, fontSize: 13 }}>No leads</div>
            ) : filteredLeads.map(l => {
              const days = fmt.daysSince(l.last_contact_date)
              const isSelected = selectedLead?.id === l.id
              const init = fmt.initials(l.name)
              const tChip = temperatureChip(l.temperature)
              return (
                <button
                  key={l.id}
                  onClick={() => { setSelectedLead(l); setDraft('') }}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '12px 14px',
                    borderBottom: `1px solid ${c.borderLight}`,
                    cursor: 'pointer',
                    background: isSelected ? c.bgInset : 'transparent',
                    border: 'none', borderLeft: isSelected ? `3px solid ${c.text}` : '3px solid transparent',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ ...tChip, width: 32, height: 32, borderRadius: 6, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                      {init}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</span>
                        <span style={{ fontSize: 11, color: days != null && days >= 5 ? c.red : days != null && days >= 3 ? c.amber : c.dim, fontWeight: 500, flexShrink: 0 }}>
                          {fmt.relativeDate(l.last_contact_date)}
                        </span>
                      </div>
                      <div style={{ ...type.meta, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {[l.lead_type, l.source].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Conversation */}
        <div className="brikk-msg-conv" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {!selectedLead ? (
            <div style={{ ...card, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', padding: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Pick a lead</div>
                <div style={{ ...type.bodySub }}>Choose someone from the list to start a conversation.</div>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{
                ...card,
                borderRadius: '8px 8px 0 0',
                padding: '12px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => setSelectedLead(null)} className="brikk-back-btn" aria-label="Back" style={{ ...btn.ghost, padding: '0 8px', fontSize: 20, lineHeight: 1 }}>
                    ‹
                  </button>
                  <Avatar name={selectedLead.name} temperature={selectedLead.temperature} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedLead.name}</div>
                    <div style={{ ...type.meta }}>
                      {selectedLead.phone || 'No phone'} · {[selectedLead.lead_type, selectedLead.stage].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
                <span style={temperatureChip(selectedLead.temperature)}>{(selectedLead.temperature || '').toUpperCase()}</span>
              </div>

              {/* Messages */}
              <div style={{
                flex: 1, background: c.bgInset,
                borderLeft: `1px solid ${c.border}`, borderRight: `1px solid ${c.border}`,
                padding: '16px 20px', overflowY: 'auto', minHeight: 240,
              }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: 13, color: c.sub, marginBottom: 4 }}>No messages yet</div>
                    <div style={{ ...type.meta }}>Type below or generate an AI draft.</div>
                  </div>
                ) : messages.map(m => (
                  <div key={m.id} style={{
                    display: 'flex',
                    justifyContent: m.direction === 'outbound' ? 'flex-end' : 'flex-start',
                    marginBottom: 10,
                  }}>
                    <div style={{
                      maxWidth: '70%',
                      padding: '10px 14px',
                      borderRadius: m.direction === 'outbound' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      background: m.direction === 'outbound' ? c.text : c.white,
                      color: m.direction === 'outbound' ? c.white : c.text,
                      border: m.direction === 'outbound' ? 'none' : `1px solid ${c.border}`,
                    }}>
                      <div style={{ fontSize: 13, lineHeight: 1.55 }}>{m.content}</div>
                      <div style={{ fontSize: 10.5, color: m.direction === 'outbound' ? 'rgba(255,255,255,0.55)' : c.dim, marginTop: 4, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <span>{new Date(m.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                        {m.status && (
                          <span style={{ color: m.status === 'failed' ? '#EF4444' : undefined }}>
                            {m.status === 'sent' ? 'Sent' : m.status === 'received' ? 'Received' : m.status === 'failed' ? 'Failed' : m.status === 'logged' ? 'Logged' : m.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Compose */}
              <div style={{
                ...card,
                borderRadius: '0 0 8px 8px',
                padding: '12px 16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <button onClick={handleAIDraft} disabled={generating} style={{ ...btn.secondary, color: c.purple, borderColor: c.purpleBorder }}>
                    {generating ? 'Drafting…' : 'Draft with Copilot'}
                  </button>
                  {selectedLead.notes && (
                    <span style={{ ...type.meta, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Notes: {selectedLead.notes}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <textarea
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    placeholder={`Message ${selectedLead.name}…`}
                    rows={2}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    style={{ ...input, height: 'auto', padding: '10px 12px', resize: 'none', flex: 1, lineHeight: 1.5 }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!draft.trim() || sending}
                    style={{ ...btn.primary, height: 'auto', alignSelf: 'flex-end', opacity: !draft.trim() || sending ? 0.5 : 1 }}
                  >
                    {sending ? '…' : 'Send'}
                  </button>
                </div>
                <div style={{ ...type.meta, marginTop: 6 }}>
                  Enter to send · Shift+Enter for new line{selectedLead.phone ? ` · sent as SMS to ${selectedLead.phone}` : ''}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const Avatar = ({ name, temperature }) => {
  const init = fmt.initials(name)
  const t = temperature === 'hot' ? { bg: c.redSoft, color: c.red }
         : temperature === 'warm' ? { bg: c.amberSoft, color: c.amber }
         : { bg: c.bgInset, color: c.dim }
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 6,
      background: t.bg, color: t.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 600, flexShrink: 0,
    }}>{init || '—'}</div>
  )
}

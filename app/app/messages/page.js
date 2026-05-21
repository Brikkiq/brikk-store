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

  // Toggle a body class so the app shell hides its top bar / tab bar when
  // a conversation is open on mobile. Cleaned up on unmount.
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (selectedLead) document.body.classList.add('brikk-msg-fullscreen')
    else document.body.classList.remove('brikk-msg-fullscreen')
    return () => document.body.classList.remove('brikk-msg-fullscreen')
  }, [selectedLead])

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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    // Belt-and-suspenders: RLS already enforces user_id, but we filter here too
    // so a misconfigured RLS policy can't leak other agents' messages.
    const { data } = await supabase.from('messages').select('*')
      .eq('lead_id', leadId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  // Log an outbound message to the conversation history. Called after the agent
  // taps "Open in Messages" or "Copy" — we assume they actually sent it.
  // Channel describes how the agent sent it: 'text' (native SMS), 'email', 'manual' (copy/paste anywhere).
  const logOutbound = async (channel) => {
    if (!draft.trim() || !selectedLead) return
    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSending(false); return }

    await supabase.from('messages').insert({
      user_id: user.id,
      lead_id: selectedLead.id,
      direction: 'outbound',
      channel,
      content: draft.trim(),
      status: channel === 'manual' ? 'copied' : 'sent_via_phone',
    })
    await supabase.from('leads').update({
      last_contact_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', selectedLead.id)
    await supabase.from('interactions').insert({
      user_id: user.id, lead_id: selectedLead.id,
      interaction_type: channel === 'email' ? 'email' : 'text',
      notes: `Sent via ${channel}: ${draft.trim()}`,
    })

    setDraft('')
    setSending(false)
    if (window.brikk?.haptic) window.brikk.haptic('success')
    loadMessages(selectedLead.id)
    loadData()
  }

  // Format the lead's phone for an sms: URL. Returns null if no phone.
  const smsHref = (() => {
    if (!selectedLead?.phone || !draft.trim()) return null
    const phone = selectedLead.phone.replace(/[^0-9+]/g, '')
    if (!phone) return null
    // iOS uses sms:NUMBER&body=… ; Android accepts the same.
    // encodeURIComponent handles emoji + apostrophes correctly.
    return `sms:${phone}${navigator.userAgent.includes('iPhone') ? '&' : '?'}body=${encodeURIComponent(draft.trim())}`
  })()

  const mailtoHref = (() => {
    if (!selectedLead?.email || !draft.trim()) return null
    return `mailto:${selectedLead.email}?body=${encodeURIComponent(draft.trim())}`
  })()

  // Open in native messages: triggers sms: link, then logs as sent.
  const handleOpenInMessages = async () => {
    if (!smsHref) return
    window.location.href = smsHref
    // Give iOS a beat to hand off, then log
    setTimeout(() => logOutbound('text'), 300)
  }

  const handleOpenInEmail = async () => {
    if (!mailtoHref) return
    window.location.href = mailtoHref
    setTimeout(() => logOutbound('email'), 300)
  }

  const handleCopyDraft = async () => {
    if (!draft.trim()) return
    try {
      await navigator.clipboard.writeText(draft.trim())
      showToast('Copied — paste it wherever you message from')
      logOutbound('manual')
    } catch {
      showToast('Could not copy — try selecting the text manually')
    }
  }

  // Log an inbound reply manually — the agent pastes what the lead said back.
  const [replyText, setReplyText] = useState('')
  const [showReplyField, setShowReplyField] = useState(false)

  const handleLogReply = async () => {
    if (!replyText.trim() || !selectedLead) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('messages').insert({
      user_id: user.id,
      lead_id: selectedLead.id,
      direction: 'inbound',
      channel: 'text',
      content: replyText.trim(),
      status: 'logged',
    })
    await supabase.from('leads').update({
      last_contact_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', selectedLead.id)
    await supabase.from('interactions').insert({
      user_id: user.id, lead_id: selectedLead.id,
      interaction_type: 'text_received',
      notes: `Reply logged: ${replyText.trim()}`,
    })
    setReplyText('')
    setShowReplyField(false)
    showToast('Reply logged')
    loadMessages(selectedLead.id)
    loadData()
  }

  // Paste an entire chat history — AI parses it into individual messages.
  const [pasteHistory, setPasteHistory] = useState('')
  const [showPasteField, setShowPasteField] = useState(false)
  const [parsingHistory, setParsingHistory] = useState(false)

  const handleParseHistory = async () => {
    if (!pasteHistory.trim() || !selectedLead) return
    setParsingHistory(true)
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'parse_chat_history',
          transcript: pasteHistory,
          agentName: profile?.full_name || '',
        }),
      })
      const data = await res.json()
      const parsed = data.messages || []
      if (parsed.length === 0) {
        showToast('Could not parse any messages')
        setParsingHistory(false)
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setParsingHistory(false); return }
      // Insert in sequence so created_at preserves order
      for (const m of parsed) {
        await supabase.from('messages').insert({
          user_id: user.id,
          lead_id: selectedLead.id,
          direction: m.direction,
          channel: 'text',
          content: m.content,
          status: 'imported',
        })
      }
      await supabase.from('leads').update({
        last_contact_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', selectedLead.id)
      setPasteHistory('')
      setShowPasteField(false)
      showToast(`Imported ${parsed.length} message${parsed.length === 1 ? '' : 's'}`)
      loadMessages(selectedLead.id)
    } catch (err) {
      console.error('parse history failed:', err?.message)
      showToast('Import failed')
    }
    setParsingHistory(false)
  }

  // Generic AI draft for the lead (uses full message history server-side).
  const handleAIDraft = async () => {
    if (!selectedLead) return
    await runAIDraft({})
  }

  // Reply-to-this: drafts a response that explicitly addresses a specific inbound message.
  const handleReplyToMessage = async (inboundMessage) => {
    if (!selectedLead) return
    await runAIDraft({ replyingTo: inboundMessage.content })
  }

  const runAIDraft = async ({ replyingTo } = {}) => {
    setGenerating(true)
    const days = fmt.daysSince(selectedLead.last_contact_date) ?? 0
    // Pass full message history + optional "this is the message we're responding to" hint
    const leadPayload = {
      ...selectedLead,
      days_since_contact: days,
      recent_messages: messages.slice(-12).map(m => ({
        direction: m.direction,
        content: m.content,
        created_at: m.created_at,
      })),
    }
    if (replyingTo) leadPayload.replying_to = replyingTo
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: [leadPayload],
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
    <div style={{ display: 'flex', flexDirection: 'column', height: showConversation ? '100vh' : 'calc(100vh - 140px)', minHeight: 500 }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 80, right: 24, zIndex: 200,
          background: c.greenSoft, border: `1px solid ${c.greenBorder}`,
          borderRadius: 6, padding: '10px 16px',
          fontSize: 13, color: c.green, fontWeight: 500,
          boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
        }}>{toast}</div>
      )}

      <div className="brikk-msg-page-title" style={{ marginBottom: 16 }}>
        <h1 style={{ ...type.pageTitle, margin: 0 }}>Conversations</h1>
        <p style={{ ...type.bodySub, margin: '4px 0 0' }}>Draft with AI, send from your own phone, keep every conversation logged.</p>
      </div>

      <style>{`
        .brikk-back-btn { display: none; }
        .brikk-msg-mobile-header { display: none; }
        @media (max-width: 700px) {
          .brikk-msg-list { display: ${showConversation ? 'none' : 'flex'} !important; }
          .brikk-msg-conv { display: ${showConversation ? 'flex' : 'none'} !important; }
          .brikk-back-btn { display: inline-flex !important; }
          .brikk-msg-page-title { display: ${showConversation ? 'none' : 'block'} !important; }
          .brikk-msg-mobile-header { display: ${showConversation ? 'flex' : 'none'} !important; }
          .brikk-msg-desktop-header { display: ${showConversation ? 'none' : 'flex'} !important; }
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
              {/* Mobile slim header — just a back arrow + name */}
              <div className="brikk-msg-mobile-header" style={{
                display: 'none',
                position: 'sticky', top: 0, zIndex: 20,
                background: 'rgba(255,255,255,0.96)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderBottom: `1px solid ${c.border}`,
                padding: '12px 12px calc(12px + env(safe-area-inset-top, 0px)) 12px',
                paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
                alignItems: 'center', gap: 8,
              }}>
                <button
                  onClick={() => setSelectedLead(null)}
                  aria-label="Back"
                  style={{
                    width: 36, height: 36, borderRadius: 6,
                    background: 'transparent', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontFamily: 'inherit',
                    color: c.text, fontSize: 20, lineHeight: 1,
                    flexShrink: 0,
                  }}
                >‹</button>
                <Avatar name={selectedLead.name} temperature={selectedLead.temperature} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedLead.name}
                  </div>
                  <div style={{ ...type.meta, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedLead.phone || 'No phone'}
                  </div>
                </div>
                <span style={temperatureChip(selectedLead.temperature)}>{(selectedLead.temperature || '').toUpperCase()}</span>
              </div>

              {/* Desktop header */}
              <div className="brikk-msg-desktop-header" style={{
                ...card,
                borderRadius: '8px 8px 0 0',
                padding: '12px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                ) : messages.map((m, idx) => {
                  // Find the most recent inbound message to attach the Reply-with-AI button to
                  const lastInboundIdx = messages.map((mm, i) => mm.direction === 'inbound' ? i : -1).filter(i => i >= 0).pop()
                  const showReplyButton = m.direction === 'inbound' && idx === lastInboundIdx
                  return (
                    <div key={m.id} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: m.direction === 'outbound' ? 'flex-end' : 'flex-start',
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
                              {messageStatusLabel(m.status)}
                            </span>
                          )}
                        </div>
                      </div>
                      {showReplyButton && (
                        <button
                          onClick={() => handleReplyToMessage(m)}
                          disabled={generating}
                          style={{
                            marginTop: 6,
                            background: c.purpleSoft,
                            border: `1px solid ${c.purpleBorder}`,
                            borderRadius: 999,
                            padding: '4px 12px',
                            fontSize: 11.5,
                            fontWeight: 500,
                            color: c.purple,
                            cursor: generating ? 'wait' : 'pointer',
                            fontFamily: 'inherit',
                            opacity: generating ? 0.6 : 1,
                          }}
                        >
                          {generating ? 'Drafting…' : '↪ Draft reply with Copilot'}
                        </button>
                      )}
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Compose */}
              <div style={{
                ...card,
                borderRadius: '0 0 8px 8px',
                padding: '12px 16px',
              }}>
                {/* Tools row: AI draft + import history + log inbound reply */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button onClick={handleAIDraft} disabled={generating} style={{ ...btn.secondary, color: c.purple, borderColor: c.purpleBorder }}>
                      {generating ? 'Drafting…' : 'Draft with Copilot'}
                    </button>
                    <button onClick={() => setShowReplyField(s => !s)} style={btn.secondary}>
                      {showReplyField ? 'Cancel reply log' : '+ Log a reply'}
                    </button>
                    <button onClick={() => setShowPasteField(s => !s)} style={btn.ghost}>
                      {showPasteField ? 'Cancel import' : 'Import chat history'}
                    </button>
                  </div>
                  {selectedLead.notes && (
                    <span style={{ ...type.meta, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Notes: {selectedLead.notes}
                    </span>
                  )}
                </div>

                {/* Optional: log inbound reply */}
                {showReplyField && (
                  <div style={{ background: c.bgInset, border: `1px solid ${c.border}`, borderRadius: 6, padding: 10, marginBottom: 10 }}>
                    <div style={{ ...type.eyebrow, marginBottom: 6 }}>What did {selectedLead.name?.split(' ')[0] || 'they'} say?</div>
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Paste their reply…"
                      rows={2}
                      style={{ ...input, height: 'auto', padding: '8px 10px', resize: 'vertical', lineHeight: 1.5, width: '100%', background: c.white }}
                    />
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button onClick={handleLogReply} disabled={!replyText.trim()} style={{ ...btn.primary, opacity: !replyText.trim() ? 0.5 : 1 }}>Log reply</button>
                      <button onClick={() => { setShowReplyField(false); setReplyText('') }} style={btn.ghost}>Cancel</button>
                    </div>
                  </div>
                )}

                {/* Optional: paste full chat history for AI parsing */}
                {showPasteField && (
                  <div style={{ background: c.bgInset, border: `1px solid ${c.border}`, borderRadius: 6, padding: 10, marginBottom: 10 }}>
                    <div style={{ ...type.eyebrow, marginBottom: 6 }}>Paste an existing text exchange</div>
                    <textarea
                      value={pasteHistory}
                      onChange={e => setPasteHistory(e.target.value)}
                      placeholder="Paste a back-and-forth chat. AI will sort outbound vs inbound and log each message."
                      rows={5}
                      style={{ ...input, height: 'auto', padding: '8px 10px', resize: 'vertical', lineHeight: 1.5, width: '100%', background: c.white }}
                    />
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button onClick={handleParseHistory} disabled={!pasteHistory.trim() || parsingHistory} style={{ ...btn.primary, opacity: !pasteHistory.trim() || parsingHistory ? 0.5 : 1 }}>
                        {parsingHistory ? 'Parsing…' : 'Import messages'}
                      </button>
                      <button onClick={() => { setShowPasteField(false); setPasteHistory('') }} style={btn.ghost}>Cancel</button>
                    </div>
                  </div>
                )}

                {/* Quick-reply templates — one tap fills the draft */}
                <QuickReplyRow
                  firstName={selectedLead.name?.split(' ')[0] || 'there'}
                  agentName={profile?.full_name?.split(' ')[0] || ''}
                  onPick={(text) => setDraft(text)}
                />

                {/* Compose textarea */}
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  placeholder={`Draft a message for ${selectedLead.name?.split(' ')[0] || 'them'}…`}
                  rows={3}
                  style={{ ...input, height: 'auto', padding: '10px 12px', resize: 'none', width: '100%', lineHeight: 1.5 }}
                />

                {/* Send-from-your-phone action row */}
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {selectedLead.phone && (
                    <a
                      href={smsHref || '#'}
                      onClick={(e) => { if (!smsHref) e.preventDefault(); else handleOpenInMessages() }}
                      style={{
                        ...btn.primary,
                        textDecoration: 'none',
                        opacity: smsHref && !sending ? 1 : 0.5,
                        pointerEvents: smsHref && !sending ? 'auto' : 'none',
                      }}
                    >Open in Messages</a>
                  )}
                  {selectedLead.email && (
                    <a
                      href={mailtoHref || '#'}
                      onClick={(e) => { if (!mailtoHref) e.preventDefault(); else handleOpenInEmail() }}
                      style={{
                        ...btn.secondary,
                        textDecoration: 'none',
                        opacity: mailtoHref && !sending ? 1 : 0.5,
                        pointerEvents: mailtoHref && !sending ? 'auto' : 'none',
                      }}
                    >Open in Email</a>
                  )}
                  <button
                    onClick={handleCopyDraft}
                    disabled={!draft.trim() || sending}
                    style={{ ...btn.secondary, opacity: !draft.trim() || sending ? 0.5 : 1 }}
                  >Copy</button>
                </div>

                <div style={{ ...type.meta, marginTop: 8, lineHeight: 1.55 }}>
                  Tapping <b>Open in Messages</b> opens your phone's text app with this pre-filled — you send it from your number, and Brikk auto-logs it here as a contact.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Quick-reply templates — one-tap pre-fills for the most common short replies
// agents send between full follow-ups. Personalized with the lead's first name and
// the agent's first name when known.
const QuickReplyRow = ({ firstName, agentName, onPick }) => {
  const sig = agentName ? ` — ${agentName}` : ''
  const templates = [
    { label: 'On it', text: `On it — give me 15 minutes and I'll be back to you, ${firstName}.${sig}` },
    { label: 'Let me check', text: `Let me check on that and circle back today, ${firstName}.${sig}` },
    { label: 'Yes that works', text: `Yes — that works for me. Confirming now.${sig}` },
    { label: 'Send address', text: `Sending the address now — give me a sec.${sig}` },
    { label: 'Call you', text: `Easier on a quick call — what's a good 5-minute window today or tomorrow?${sig}` },
    { label: 'New listing', text: `Hey ${firstName}, just got a new listing that fits what you're looking for. Want me to send the details?${sig}` },
  ]
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
      {templates.map((t, i) => (
        <button
          key={i}
          onClick={() => onPick(t.text)}
          style={{
            background: 'transparent',
            border: `1px solid ${c.border}`,
            borderRadius: 999,
            padding: '5px 12px',
            fontSize: 11.5,
            fontWeight: 500,
            color: c.sub,
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
          title={t.text}
        >{t.label}</button>
      ))}
    </div>
  )
}

// Human-readable label for the various statuses we now log.
const messageStatusLabel = (status) => {
  switch (status) {
    case 'sent':              return 'Sent'
    case 'sent_via_phone':    return 'Sent from phone'
    case 'sent_via_email':    return 'Sent via email'
    case 'received':          return 'Received'
    case 'failed':            return 'Failed'
    case 'logged':            return 'Logged'
    case 'logged_via_voice':  return 'Logged via voice'
    case 'imported':          return 'Imported'
    case 'copied':            return 'Copied'
    case 'approved':          return 'Approved'
    default:                  return status
  }
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

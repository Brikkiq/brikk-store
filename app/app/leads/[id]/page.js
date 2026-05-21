'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { c, type, card, btn, input, inputLabel, chipFor, temperatureChip, fmt } from '@/lib/design'

const sourceOptions = ['Zillow', 'Referral', 'Open House', 'Social Media', 'Website', 'Cold Call', 'Referral Link', 'Voice Note', 'Other']
const tempOptions   = ['hot', 'warm', 'cold']
const stageOptions  = ['New Lead', 'Contacted', 'Showing Scheduled', 'Offer Submitted', 'Under Contract', 'Closed Won', 'Closed Lost']
const typeOptions   = ['Buyer', 'Seller']

export default function LeadDetailPage() {
  const params = useParams()
  const leadId = params?.id
  const [lead, setLead] = useState(null)
  const [messages, setMessages] = useState([])
  const [interactions, setInteractions] = useState([])
  const [deals, setDeals] = useState([])
  const [aiSummary, setAiSummary] = useState(null)
  const [summarizing, setSummarizing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')

  const showToast = (msg, kind = 'success') => {
    setToast({ msg, kind })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    if (!leadId) return
    load()
    // Reload when the floating voice modal applies actions
    const handler = () => load()
    if (typeof window !== 'undefined') window.addEventListener('brikk:voice-saved', handler)
    return () => { if (typeof window !== 'undefined') window.removeEventListener('brikk:voice-saved', handler) }
  }, [leadId])

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    // Every query scoped by user_id as defense-in-depth alongside RLS.
    const [leadRes, msgsRes, intsRes, dealsRes] = await Promise.all([
      supabase.from('leads').select('*').eq('id', leadId).eq('user_id', user.id).single(),
      supabase.from('messages').select('*').eq('lead_id', leadId).eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('interactions').select('*').eq('lead_id', leadId).eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('deals').select('*').eq('user_id', user.id),
    ])
    if (leadRes.error) console.error('Load lead failed:', leadRes.error.message)
    const l = leadRes.data
    setLead(l)
    setMessages(msgsRes.data || [])
    setInteractions(intsRes.data || [])
    // Attached deals — heuristic: any deal whose client_name matches the lead's name
    if (l) {
      const matchName = (l.name || '').toLowerCase()
      setDeals((dealsRes.data || []).filter(d => (d.client_name || '').toLowerCase() === matchName))
    }
    setLoading(false)
  }

  const generateSummary = async () => {
    if (!lead) return
    setSummarizing(true)
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'lead_summary',
          lead: {
            ...lead,
            recent_messages: messages.slice(-15).map(m => ({ direction: m.direction, content: m.content, created_at: m.created_at })),
            recent_interactions: interactions.slice(0, 10).map(i => ({ interaction_type: i.interaction_type, notes: i.notes, created_at: i.created_at })),
          },
        }),
      })
      const data = await res.json()
      if (data.summary) setAiSummary(data.summary)
      else showToast('Could not generate summary', 'error')
    } catch (err) {
      showToast('AI summary unavailable', 'error')
    }
    setSummarizing(false)
  }

  // Inline edit save
  const startEdit = (field, current) => { setEditingField(field); setEditValue(current ?? '') }
  const cancelEdit = () => { setEditingField(null); setEditValue('') }
  const saveEdit = async () => {
    if (!lead) return
    setSaving(true)
    const value = editValue === '' ? null : editValue
    const { error } = await supabase.from('leads').update({
      [editingField]: value,
      updated_at: new Date().toISOString(),
    }).eq('id', lead.id)
    setSaving(false)
    if (error) { showToast(error.message, 'error'); return }
    setLead(prev => ({ ...prev, [editingField]: value }))
    setEditingField(null)
    showToast('Saved')
  }

  const handleDelete = async () => {
    if (!confirm('Delete this lead and all attached messages? This cannot be undone.')) return
    await supabase.from('leads').delete().eq('id', lead.id)
    window.location.href = '/app/leads'
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: c.dim, fontSize: 13 }}>Loading lead…</div>
  if (!lead) return (
    <div style={{ ...card, padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Lead not found</div>
      <div style={{ ...type.bodySub, marginBottom: 16 }}>It may have been deleted or you don't have access.</div>
      <a href="/app/leads" style={{ ...btn.primary, textDecoration: 'none' }}>← Back to Leads</a>
    </div>
  )

  // Merge messages + interactions into a single chronological timeline
  const timeline = [
    ...messages.map(m => ({
      kind: 'message',
      id: 'm-' + m.id,
      created_at: m.created_at,
      direction: m.direction,
      channel: m.channel,
      content: m.content,
      status: m.status,
    })),
    ...interactions.map(i => ({
      kind: 'interaction',
      id: 'i-' + i.id,
      created_at: i.created_at,
      interaction_type: i.interaction_type,
      notes: i.notes,
    })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const days = fmt.daysSince(lead.last_contact_date)
  const phone = lead.phone ? String(lead.phone).replace(/[^0-9+]/g, '') : null

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: 80, right: 24, zIndex: 200,
          background: toast.kind === 'error' ? c.redSoft : c.greenSoft,
          border: `1px solid ${toast.kind === 'error' ? c.redBorder : c.greenBorder}`,
          color: toast.kind === 'error' ? c.red : c.green,
          borderRadius: 6, padding: '10px 16px', fontSize: 13, fontWeight: 500,
          boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
        }}>{toast.msg}</div>
      )}

      {/* Back link */}
      <div style={{ marginBottom: 12 }}>
        <a href="/app/leads" style={{ ...type.meta, color: c.dim, textDecoration: 'none' }}>← Back to Leads</a>
      </div>

      {/* Hero card */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <Avatar name={lead.name} temperature={lead.temperature} />
            <div style={{ minWidth: 0 }}>
              <h1 style={{ ...type.pageTitle, margin: 0, fontSize: 22, wordBreak: 'break-word' }}>{lead.name}</h1>
              <div style={{ ...type.bodySub, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={temperatureChip(lead.temperature)}>{(lead.temperature || '').toUpperCase()}</span>
                <span>· {lead.lead_type || 'Buyer'}</span>
                <span>· {lead.source || 'Unknown source'}</span>
                <span>· {lead.stage || 'New Lead'}</span>
              </div>
            </div>
          </div>

          {/* Quick actions — wrap-friendly. The 'Open conversation' label is the
              longest, so on phones it tends to drop to its own line, which is fine. */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: '0 1 auto' }}>
            {phone && (
              <a href={`tel:${phone}`} style={{ ...btn.secondary, textDecoration: 'none' }}>Call</a>
            )}
            {phone && (
              <a href={`sms:${phone}`} style={{ ...btn.primary, textDecoration: 'none' }}>Text</a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} style={{ ...btn.secondary, textDecoration: 'none' }}>Email</a>
            )}
            <a href={`/app/messages?lead=${lead.id}`} style={{ ...btn.secondary, textDecoration: 'none' }}>Conversation</a>
          </div>
        </div>

        {/* Compact KPI bar */}
        <div style={{ display: 'flex', gap: 18, marginTop: 16, flexWrap: 'wrap' }}>
          <Stat label="Last contact" value={fmt.relativeDate(lead.last_contact_date)} accent={days != null && days >= 5 ? c.red : days != null && days >= 3 ? c.amber : c.text} />
          <Stat label="Price range" value={lead.price_range || '—'} />
          <Stat label="Timeline" value={lead.timeline || '—'} />
          <Stat label="Pre-approved" value={lead.pre_approved ? (lead.pre_approved_amount || 'Yes') : 'No'} accent={lead.pre_approved ? c.green : c.dim} />
        </div>
      </div>

      {/* AI summary */}
      <div style={{ ...card, marginBottom: 16, borderLeft: `3px solid ${c.purple}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ ...type.eyebrow, color: c.purple }}>AI summary</div>
          <button
            onClick={generateSummary}
            disabled={summarizing}
            style={{ ...btn.ghost, color: c.purple, opacity: summarizing ? 0.5 : 1 }}
          >
            {summarizing ? 'Generating…' : aiSummary ? 'Regenerate' : 'Generate'}
          </button>
        </div>
        {aiSummary ? (
          <div style={{ ...type.body, fontSize: 14, color: c.text, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{aiSummary}</div>
        ) : (
          <div style={{ ...type.bodySub }}>
            Tap Generate. Brikk reads this lead's full conversation history, profile, and recent activity and writes a 2–3 sentence summary of where they're at and what the next step should be.
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Profile fields */}
        <div style={card}>
          <div style={{ ...type.eyebrow, marginBottom: 14 }}>Profile</div>
          <Field label="Name"          value={lead.name}          onEdit={() => startEdit('name', lead.name)}        />
          <Field label="Phone"         value={lead.phone}         onEdit={() => startEdit('phone', lead.phone)}      />
          <Field label="Email"         value={lead.email}         onEdit={() => startEdit('email', lead.email)}      />
          <Field label="Source"        value={lead.source}        onEdit={() => startEdit('source', lead.source)}    options={sourceOptions} />
          <Field label="Temperature"   value={lead.temperature}   onEdit={() => startEdit('temperature', lead.temperature)} options={tempOptions} />
          <Field label="Stage"         value={lead.stage}         onEdit={() => startEdit('stage', lead.stage)}      options={stageOptions} />
          <Field label="Type"          value={lead.lead_type}     onEdit={() => startEdit('lead_type', lead.lead_type)} options={typeOptions} />
          <Field label="Price range"   value={lead.price_range}   onEdit={() => startEdit('price_range', lead.price_range)} />
          <Field label="Preferred area" value={lead.preferred_area} onEdit={() => startEdit('preferred_area', lead.preferred_area)} />
          <Field label="Bedrooms"      value={lead.bedrooms}      onEdit={() => startEdit('bedrooms', lead.bedrooms)} />
          <Field label="Pre-approved amount" value={lead.pre_approved_amount} onEdit={() => startEdit('pre_approved_amount', lead.pre_approved_amount)} />
          <Field label="Timeline"      value={lead.timeline}      onEdit={() => startEdit('timeline', lead.timeline)} />
          <Field label="Contact preference" value={lead.contact_preference} onEdit={() => startEdit('contact_preference', lead.contact_preference)} options={['text', 'call', 'email']} />
          <Field label="Spouse / partner" value={lead.spouse_name} onEdit={() => startEdit('spouse_name', lead.spouse_name)} />
          <Field label="Notes"         value={lead.notes}         onEdit={() => startEdit('notes', lead.notes)}      multiline />
        </div>

        {/* Timeline */}
        <div style={card}>
          <div style={{ ...type.eyebrow, marginBottom: 14 }}>Activity timeline</div>
          {timeline.length === 0 ? (
            <div style={{ ...type.bodySub }}>No activity yet. Send a message, log a contact, or record a voice note.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {timeline.slice(0, 40).map(t => <TimelineRow key={t.id} item={t} />)}
            </div>
          )}
        </div>

        {/* Attached deals */}
        {deals.length > 0 && (
          <div style={card}>
            <div style={{ ...type.eyebrow, marginBottom: 14 }}>Attached deals</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {deals.map(d => (
                <a key={d.id} href="/app/deals" style={{
                  display: 'block',
                  border: `1px solid ${c.border}`,
                  borderRadius: 6, padding: '10px 12px',
                  textDecoration: 'none',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: c.text }}>{d.address}</div>
                  <div style={{ ...type.meta, marginTop: 2 }}>
                    {[d.stage, d.close_date && `closes ${d.close_date}`, d.commission && `commission ${fmt.money(d.commission)}`].filter(Boolean).join(' · ')}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleDelete} style={btn.danger}>Delete lead</button>
      </div>

      {/* Inline edit modal — bottom-sheet style on phones so it doesn't fight the keyboard */}
      {editingField && (
        <div onClick={(e) => { if (e.target === e.currentTarget) cancelEdit() }} style={{
          position: 'fixed', inset: 0, background: 'rgba(20,20,18,0.4)', zIndex: 250,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16,
        }}>
          <div style={{ ...card, padding: '20px 22px', maxWidth: 420, width: '100%', marginBottom: 20 }}>
            <div style={{ ...type.eyebrow, marginBottom: 8 }}>Edit · {editingField.replace(/_/g, ' ')}</div>
            <EditInput
              field={editingField}
              value={editValue}
              onChange={setEditValue}
              options={
                editingField === 'source'             ? sourceOptions
                : editingField === 'temperature'      ? tempOptions
                : editingField === 'stage'            ? stageOptions
                : editingField === 'lead_type'        ? typeOptions
                : editingField === 'contact_preference' ? ['text', 'call', 'email']
                : null
              }
              multiline={editingField === 'notes'}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
              <button onClick={cancelEdit} style={btn.secondary}>Cancel</button>
              <button onClick={saveEdit} disabled={saving} style={{ ...btn.primary, opacity: saving ? 0.5 : 1 }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const Stat = ({ label, value, accent }) => (
  <div>
    <div style={type.eyebrow}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 500, color: accent || c.text, marginTop: 2 }}>{value || '—'}</div>
  </div>
)

const Field = ({ label, value, onEdit, options, multiline }) => (
  <div
    onClick={onEdit}
    style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      gap: 10, padding: '10px 0', borderBottom: `1px solid ${c.borderLight}`,
      cursor: 'pointer',
    }}
  >
    <span style={{ ...type.meta, color: c.dim, minWidth: 110, textTransform: 'capitalize' }}>{label}</span>
    <span style={{
      fontSize: 13, color: value ? c.text : c.dim, textAlign: 'right',
      flex: 1, whiteSpace: multiline ? 'pre-wrap' : 'normal', wordBreak: 'break-word',
    }}>
      {value || 'Add'}
    </span>
  </div>
)

const EditInput = ({ field, value, onChange, options, multiline }) => {
  if (options) {
    return (
      <select value={value || ''} onChange={e => onChange(e.target.value)} style={{ ...input, width: '100%' }}>
        <option value="">—</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    )
  }
  if (multiline) {
    return (
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        rows={5}
        style={{ ...input, width: '100%', height: 'auto', padding: '10px 12px', resize: 'vertical', lineHeight: 1.55 }}
      />
    )
  }
  return (
    <input
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      style={{ ...input, width: '100%' }}
    />
  )
}

const Avatar = ({ name, temperature }) => {
  const init = fmt.initials(name)
  const t = temperature === 'hot' ? { bg: c.redSoft, color: c.red }
         : temperature === 'warm' ? { bg: c.amberSoft, color: c.amber }
         : { bg: c.bgInset, color: c.dim }
  return (
    <div style={{
      width: 48, height: 48, borderRadius: 10,
      background: t.bg, color: t.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 16, fontWeight: 600, flexShrink: 0,
    }}>{init || '—'}</div>
  )
}

const TimelineRow = ({ item }) => {
  if (item.kind === 'message') {
    const outbound = item.direction === 'outbound'
    const accent = outbound ? c.indigo : c.green
    return (
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: accent, marginTop: 7, flexShrink: 0,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...type.eyebrow, color: accent }}>
            {outbound ? 'You sent' : 'They replied'} · {item.channel || 'text'}
          </div>
          <div style={{ fontSize: 13, color: c.text, lineHeight: 1.55, marginTop: 2 }}>{item.content}</div>
          <div style={{ ...type.meta, marginTop: 3 }}>{fmt.relativeDate(item.created_at)}</div>
        </div>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: c.dim, marginTop: 7, flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...type.eyebrow }}>{(item.interaction_type || 'activity').replace(/_/g, ' ')}</div>
        {item.notes && <div style={{ ...type.bodySub, marginTop: 2 }}>{item.notes}</div>}
        <div style={{ ...type.meta, marginTop: 3 }}>{fmt.relativeDate(item.created_at)}</div>
      </div>
    </div>
  )
}

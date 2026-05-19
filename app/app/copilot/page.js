'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { c, type, card, btn, statTile, chipFor, fmt } from '@/lib/design'

export default function CopilotPage() {
  const [leads, setLeads] = useState([])
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [approvedIds, setApprovedIds] = useState([])
  const [skippedIds, setSkippedIds] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [toast, setToast] = useState(null)
  const [profile, setProfile] = useState(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [leadsRes, profileRes] = await Promise.all([
      supabase.from('leads').select('*').eq('user_id', user.id).order('last_contact_date', { ascending: true }),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ])
    const allLeads = (leadsRes.data || []).map(l => ({
      ...l,
      days_since_contact: fmt.daysSince(l.last_contact_date) ?? 0,
    }))
    setLeads(allLeads)
    setProfile(profileRes.data)
    setLoading(false)
  }

  const needsFollowUp = (l) => {
    const d = l.days_since_contact
    return (l.temperature === 'hot' && d >= 1) ||
           (l.temperature === 'warm' && d >= 3) ||
           (l.temperature === 'cold' && d >= 7)
  }

  const generateDrafts = async () => {
    setGenerating(true)
    const candidates = leads.filter(needsFollowUp).sort((a, b) => {
      const p = { hot: 0, warm: 1, cold: 2 }
      return (p[a.temperature] || 2) - (p[b.temperature] || 2)
    })
    if (candidates.length === 0) { setDrafts([]); setGenerating(false); return }

    const enriched = await Promise.all(candidates.map(async l => {
      const { data: msgs } = await supabase.from('messages')
        .select('direction,content,created_at')
        .eq('lead_id', l.id).order('created_at', { ascending: false }).limit(5)
      const { data: interactions } = await supabase.from('interactions')
        .select('interaction_type,notes,created_at')
        .eq('lead_id', l.id).order('created_at', { ascending: false }).limit(5)
      return { ...l, recent_messages: msgs || [], recent_interactions: interactions || [] }
    }))

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: enriched, agentName: profile?.full_name || 'Alex' }),
      })
      const data = await res.json()
      setDrafts(data.drafts || [])
    } catch (err) {
      console.error('Generate failed:', err?.message)
      showToast('Could not generate drafts — please try again')
    }
    setGenerating(false)
  }

  const handleApprove = async (draft) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('interactions').insert({
      user_id: user.id, lead_id: draft.lead_id,
      interaction_type: draft.channel === 'Text' ? 'text' : 'email',
      notes: `Copilot draft approved: ${draft.draft}`,
    })
    await supabase.from('leads').update({
      last_contact_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', draft.lead_id)
    setApprovedIds(p => [...p, draft.lead_id])
    showToast('Approved — contact logged')
    if (window.brikk?.haptic) window.brikk.haptic('success')
  }

  const handleSkip = (id) => setSkippedIds(p => [...p, id])
  const handleEdit = (d) => { setEditingId(d.lead_id); setEditText(d.draft) }
  const handleSaveEdit = (d) => {
    setDrafts(p => p.map(x => x.lead_id === d.lead_id ? { ...x, draft: editText } : x))
    setEditingId(null); setEditText('')
  }

  const pending = drafts.filter(d => !approvedIds.includes(d.lead_id) && !skippedIds.includes(d.lead_id))
  const eligibleCount = leads.filter(needsFollowUp).length

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: c.dim, fontSize: 13 }}>Loading Copilot…</div>

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: 80, right: 24, zIndex: 200,
          background: c.greenSoft, border: `1px solid ${c.greenBorder}`,
          borderRadius: 6, padding: '10px 16px',
          fontSize: 13, color: c.green, fontWeight: 500,
          boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <h1 style={{ ...type.pageTitle, margin: 0 }}>Copilot</h1>
          <p style={{ ...type.bodySub, margin: '4px 0 0' }}>AI-drafted follow-ups using each lead's full context.</p>
        </div>
        <button
          onClick={generateDrafts}
          disabled={generating || leads.length === 0}
          style={{ ...btn.primary, opacity: generating || leads.length === 0 ? 0.5 : 1 }}
        >
          {generating ? 'Generating…' : drafts.length > 0 ? 'Regenerate' : 'Generate drafts'}
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <KPI label="Need follow-up" value={eligibleCount} accent={eligibleCount > 0 ? c.amber : c.green} />
        <KPI label="Pending review" value={pending.length} accent={c.purple} />
        <KPI label="Approved this session" value={approvedIds.length} accent={c.green} />
        <KPI label="Total leads" value={leads.length} />
      </div>

      {/* States */}
      {leads.length === 0 && (
        <EmptyCard title="Add some leads first" body="Copilot needs leads to work with. Add your current pipeline, then come back.">
          <a href="/app/leads" style={{ ...btn.primary, textDecoration: 'none' }}>Go to Leads</a>
        </EmptyCard>
      )}

      {leads.length > 0 && drafts.length === 0 && !generating && (
        <EmptyCard
          title="Ready when you are"
          body={`Click "Generate drafts" to have AI write personalized follow-ups for ${eligibleCount || 'your'} lead${eligibleCount === 1 ? '' : 's'}.`}
        />
      )}

      {generating && (
        <div style={{ ...card, padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Drafting messages…</div>
          <div style={{ ...type.bodySub, marginTop: 4 }}>Analyzing context and writing personalized follow-ups. About 10–15 seconds.</div>
        </div>
      )}

      {/* Pending drafts */}
      {pending.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <div style={{ ...type.eyebrow, marginBottom: 12 }}>Pending your approval</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending.map(d => (
              <DraftCard
                key={d.lead_id} draft={d}
                isEditing={editingId === d.lead_id}
                editText={editText}
                setEditText={setEditText}
                onApprove={() => handleApprove(d)}
                onSkip={() => handleSkip(d.lead_id)}
                onEdit={() => handleEdit(d)}
                onSaveEdit={() => handleSaveEdit(d)}
                onCancelEdit={() => setEditingId(null)}
              />
            ))}
          </div>
        </section>
      )}

      {drafts.length > 0 && pending.length === 0 && !generating && (
        <EmptyCard title="Inbox zero" body="You've reviewed every draft. Approved messages are logged on each lead." />
      )}

      {/* Approved log */}
      {approvedIds.length > 0 && (
        <section>
          <div style={{ ...type.eyebrow, marginBottom: 12 }}>Approved this session</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {drafts.filter(d => approvedIds.includes(d.lead_id)).map(d => (
              <div key={d.lead_id} style={{ ...card, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={chipFor('success')}>✓</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{d.lead_name}</span>
                  <span style={chipFor('info')}>{d.channel}</span>
                </div>
                <span style={{ ...type.meta }}>Contact logged</span>
              </div>
            ))}
          </div>
        </section>
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

const EmptyCard = ({ title, body, children }) => (
  <div style={{ ...card, padding: '36px 24px', textAlign: 'center' }}>
    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{title}</div>
    <div style={{ ...type.bodySub, marginBottom: children ? 16 : 0, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>{body}</div>
    {children}
  </div>
)

const DraftCard = ({ draft, isEditing, editText, setEditText, onApprove, onSkip, onEdit, onSaveEdit, onCancelEdit }) => {
  const urgencyChip = draft.urgency === 'high' ? chipFor('hot')
                    : draft.urgency === 'medium' ? chipFor('warm')
                    : chipFor('neutral')
  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{draft.lead_name}</span>
          <span style={urgencyChip}>{draft.urgency}</span>
          <span style={chipFor('info')}>{draft.channel}</span>
        </div>
        <div style={{ ...type.meta }}>
          {[draft.lead_type, draft.source, draft.stage].filter(Boolean).join(' · ')} · {draft.days_since_contact}d since contact
        </div>
      </div>

      <div style={{ background: c.bgInset, border: `1px solid ${c.border}`, borderRadius: 6, padding: '12px 14px', marginBottom: 12 }}>
        <div style={{ ...type.eyebrow, marginBottom: 6 }}>Draft message</div>
        {isEditing ? (
          <>
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={3}
              style={{
                width: '100%', padding: '10px 12px',
                borderRadius: 6, border: `1px solid ${c.border}`,
                fontSize: 13, fontFamily: 'inherit',
                background: c.white, color: c.text, outline: 'none',
                resize: 'vertical', lineHeight: 1.6,
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button onClick={onSaveEdit} style={btn.primary}>Save edit</button>
              <button onClick={onCancelEdit} style={btn.secondary}>Cancel</button>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13.5, lineHeight: 1.65, color: c.text }}>{draft.draft}</div>
        )}
      </div>

      <div style={{
        background: c.purpleSoft,
        borderLeft: `2px solid ${c.purple}`,
        padding: '10px 12px',
        borderRadius: 4,
        marginBottom: 14,
      }}>
        <div style={{ ...type.eyebrow, color: c.purple, marginBottom: 3 }}>Why now</div>
        <div style={{ fontSize: 12.5, color: c.sub, lineHeight: 1.55 }}>{draft.reason}</div>
      </div>

      {!isEditing && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onApprove} style={{ ...btn.primary, background: c.green, border: `1px solid ${c.green}` }}>Approve & log</button>
          <button onClick={onEdit} style={btn.secondary}>Edit</button>
          <button onClick={onSkip} style={btn.ghost}>Skip</button>
        </div>
      )}
    </div>
  )
}

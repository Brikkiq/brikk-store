'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { c, type, card, btn, input, inputLabel, chipFor, fmt, temperatureChip } from '@/lib/design'

const sourceOptions = ['Zillow', 'Referral', 'Open House', 'Social Media', 'Website', 'Cold Call', 'Other']
const tempOptions   = ['hot', 'warm', 'cold']
const stageOptions  = ['New Lead', 'Contacted', 'Showing Scheduled', 'Offer Submitted', 'Under Contract', 'Closed Won', 'Closed Lost']
const typeOptions   = ['Buyer', 'Seller']

const emptyForm = {
  name: '', phone: '', email: '', source: 'Zillow', temperature: 'warm', stage: 'New Lead',
  lead_type: 'Buyer', price_range: '', notes: '', last_contact_date: '',
  address: '', preferred_area: '', bedrooms: '',
  pre_approved: false, pre_approved_amount: '', timeline: '',
  birthday: '', contact_preference: 'text', spouse_name: '',
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'last_contact_date', dir: 'asc' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const showToast = (msg, kind = 'success') => {
    setToast({ msg, kind })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => { loadLeads() }, [])

  const loadLeads = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [leadsRes, messagesRes] = await Promise.all([
      supabase.from('leads').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('messages').select('lead_id, direction, content, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    if (leadsRes.error) console.error('Load leads failed:', leadsRes.error.message)

    // Build a quick lookup of the most recent message per lead
    const lastByLead = {}
    for (const m of (messagesRes.data || [])) {
      if (!lastByLead[m.lead_id]) lastByLead[m.lead_id] = m
    }
    setLeads((leadsRes.data || []).map(l => ({ ...l, _last_message: lastByLead[l.id] || null })))
    setLoading(false)
  }

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setSaving(true)
    const payload = { ...form }
    payload.last_contact_date = payload.last_contact_date
      ? new Date(payload.last_contact_date).toISOString()
      : new Date().toISOString()
    payload.birthday = payload.birthday ? new Date(payload.birthday).toISOString() : null

    try {
      if (editId) {
        await supabase.from('leads').update({
          ...payload,
          updated_at: new Date().toISOString(),
        }).eq('id', editId)
        showToast('Lead updated')
      } else {
        await supabase.from('leads').insert({ ...payload, user_id: user.id })
        showToast('Lead added')
      }
    } catch {
      showToast('Something went wrong', 'error')
    }

    setSaving(false)
    setForm(emptyForm)
    setShowForm(false)
    setEditId(null)
    loadLeads()
  }

  const handleEdit = (lead) => {
    const lcd = lead.last_contact_date ? new Date(lead.last_contact_date).toISOString().split('T')[0] : ''
    const bday = lead.birthday ? new Date(lead.birthday).toISOString().split('T')[0] : ''
    setForm({
      name: lead.name || '', phone: lead.phone || '', email: lead.email || '',
      source: lead.source || 'Zillow', temperature: lead.temperature || 'warm',
      stage: lead.stage || 'New Lead', lead_type: lead.lead_type || 'Buyer',
      price_range: lead.price_range || '', notes: lead.notes || '',
      last_contact_date: lcd,
      address: lead.address || '', preferred_area: lead.preferred_area || '',
      bedrooms: lead.bedrooms || '',
      pre_approved: !!lead.pre_approved,
      pre_approved_amount: lead.pre_approved_amount || '',
      timeline: lead.timeline || '', birthday: bday,
      contact_preference: lead.contact_preference || 'text',
      spouse_name: lead.spouse_name || '',
    })
    setEditId(lead.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead? This cannot be undone.')) return
    await supabase.from('leads').delete().eq('id', id)
    showToast('Lead deleted')
    loadLeads()
  }

  const handleLogContact = async (id) => {
    await supabase.from('leads').update({
      last_contact_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('interactions').insert({
        user_id: user.id, lead_id: id,
        interaction_type: 'contact', notes: 'Logged contact',
      })
    }
    showToast('Contact logged')
    loadLeads()
  }

  const filtered = useMemo(() => {
    let rows = leads
    if (filter !== 'all') rows = rows.filter(l => l.temperature === filter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      rows = rows.filter(l =>
        (l.name || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.phone || '').toLowerCase().includes(q) ||
        (l.preferred_area || '').toLowerCase().includes(q),
      )
    }
    const dir = sort.dir === 'asc' ? 1 : -1
    rows = [...rows].sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (sort.key.includes('date')) {
        return (new Date(av) - new Date(bv)) * dir
      }
      return String(av).localeCompare(String(bv)) * dir
    })
    return rows
  }, [leads, filter, search, sort])

  const toggleSort = (key) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
  }

  const counts = {
    all: leads.length,
    hot: leads.filter(l => l.temperature === 'hot').length,
    warm: leads.filter(l => l.temperature === 'warm').length,
    cold: leads.filter(l => l.temperature === 'cold').length,
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: c.dim, fontSize: 13 }}>Loading leads…</div>

  return (
    <div>
      {toast && <Toast {...toast} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <h1 style={{ ...type.pageTitle, margin: 0 }}>Leads</h1>
          <p style={{ ...type.bodySub, margin: '4px 0 0' }}>{leads.length} total · {counts.hot} hot · {counts.warm} warm</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm) }} style={btn.primary}>
          + Add lead
        </button>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 2, background: c.white, border: `1px solid ${c.border}`, borderRadius: 6, padding: 2 }}>
          {['all', 'hot', 'warm', 'cold'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? c.text : 'transparent',
                color: filter === f ? c.white : c.sub,
                border: 'none', borderRadius: 4,
                padding: '6px 12px',
                fontSize: 12, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
                textTransform: 'capitalize',
              }}
            >
              {f === 'all' ? 'All' : f} <span style={{ opacity: 0.6, marginLeft: 4 }}>{counts[f]}</span>
            </button>
          ))}
        </div>
        <input
          placeholder="Search by name, email, phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...input, maxWidth: 280 }}
        />
      </div>

      {/* Form */}
      {showForm && (
        <LeadForm
          form={form} setForm={setForm}
          editId={editId} saving={saving}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditId(null) }}
        />
      )}

      {/* Table (desktop) / Cards (mobile) */}
      <style>{`
        @media (min-width: 901px) {
          .brikk-leads-table { display: table !important; }
          .brikk-leads-cards { display: none !important; }
        }
        @media (max-width: 900px) {
          .brikk-leads-table { display: none !important; }
          .brikk-leads-cards { display: flex !important; }
        }
        .brikk-row:hover { background: ${c.bgInset}; }
      `}</style>

      {filtered.length === 0 ? (
        <div style={{ ...card, padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No leads to show</div>
          <div style={{ ...type.bodySub }}>{leads.length === 0 ? 'Click "Add lead" to start building your pipeline.' : 'Try a different filter or search.'}</div>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <table className="brikk-leads-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: c.bgInset }}>
                  <Th label="Name"          sortKey="name"               sort={sort} onClick={toggleSort} />
                  <Th label="Status"        sortKey="temperature"        sort={sort} onClick={toggleSort} />
                  <Th label="Stage"         sortKey="stage"              sort={sort} onClick={toggleSort} />
                  <Th label="Source"        sortKey="source"             sort={sort} onClick={toggleSort} />
                  <Th label="Price range"   sortKey="price_range"        sort={sort} onClick={toggleSort} />
                  <Th label="Last contact"  sortKey="last_contact_date"  sort={sort} onClick={toggleSort} />
                  <th style={th()}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => {
                  const days = fmt.daysSince(l.last_contact_date)
                  const overdue = (l.temperature === 'hot' && days >= 2) || (l.temperature === 'warm' && days >= 5)
                  return (
                    <tr
                      key={l.id}
                      className="brikk-row"
                      style={{ borderTop: `1px solid ${c.border}`, transition: 'background 0.1s ease' }}
                    >
                      <td style={td()}>
                        <a href={`/app/leads/${l.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                          <Avatar name={l.name} temperature={l.temperature} />
                          <div>
                            <div style={{ fontWeight: 500, color: c.text }}>{l.name}</div>
                            <div style={{ ...type.meta }}>{l.phone || l.email || '—'}</div>
                          </div>
                        </a>
                      </td>
                      <td style={td()}>
                        <span style={temperatureChip(l.temperature)}>{(l.temperature || '—').toUpperCase()}</span>
                      </td>
                      <td style={td()}>{l.stage || '—'}</td>
                      <td style={td()}>{l.source || '—'}</td>
                      <td style={td()}>{l.price_range || '—'}</td>
                      <td style={td()}>
                        <ReadIndicator lead={l} overdue={overdue} daysSince={days} />
                      </td>
                      <td style={{ ...td(), textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <QuickActions lead={l} onLog={() => handleLogContact(l.id)} />
                        <button onClick={() => handleEdit(l)} style={btn.ghost}>Edit</button>
                        <button onClick={() => handleDelete(l.id)} style={{ ...btn.ghost, color: c.red }} aria-label="Delete">×</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="brikk-leads-cards" style={{ display: 'none', flexDirection: 'column' }}>
              {filtered.map(l => (
                <LeadCard
                  key={l.id} lead={l}
                  onEdit={() => handleEdit(l)}
                  onDelete={() => handleDelete(l.id)}
                  onLog={() => handleLogContact(l.id)}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const Th = ({ label, sortKey, sort, onClick }) => (
  <th
    onClick={() => onClick(sortKey)}
    style={{
      ...th(),
      cursor: 'pointer', userSelect: 'none',
    }}
  >
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {label}
      {sort.key === sortKey && (
        <span style={{ color: c.text, fontSize: 10 }}>{sort.dir === 'asc' ? '▲' : '▼'}</span>
      )}
    </span>
  </th>
)

const th = () => ({
  textAlign: 'left',
  padding: '12px 16px',
  fontSize: 11,
  fontWeight: 600,
  color: c.dim,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
})

const td = () => ({
  padding: '14px 16px',
  fontSize: 13,
  color: c.text,
  verticalAlign: 'middle',
})

const Avatar = ({ name, temperature }) => {
  const init = fmt.initials(name)
  const t = temperature === 'hot' ? { bg: c.redSoft, color: c.red }
         : temperature === 'warm' ? { bg: c.amberSoft, color: c.amber }
         : { bg: c.bgInset, color: c.dim }
  return (
    <div style={{
      width: 30, height: 30, borderRadius: 6,
      background: t.bg, color: t.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 600,
      flexShrink: 0,
    }}>{init || '—'}</div>
  )
}

// Read-indicator: who owes a response and how stale is the thread.
const ReadIndicator = ({ lead, overdue, daysSince }) => {
  const last = lead._last_message
  if (!last) {
    return (
      <span style={{ color: overdue ? c.red : daysSince != null && daysSince >= 3 ? c.amber : c.sub }}>
        {fmt.relativeDate(lead.last_contact_date)}
      </span>
    )
  }
  const sentByYou = last.direction === 'outbound'
  const rel = fmt.relativeDate(last.created_at)
  // If they replied and we haven't responded — flag it.
  const yourTurn = !sentByYou
  const tone = yourTurn ? c.red : daysSince != null && daysSince >= 5 ? c.amber : c.sub
  const label = sentByYou ? 'You sent' : 'They replied'
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
      <span style={{ fontSize: 12, color: tone, fontWeight: yourTurn ? 600 : 400 }}>
        {label} · {rel}
      </span>
      {yourTurn && (
        <span style={{ fontSize: 10, color: c.red, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
          Your turn
        </span>
      )}
    </span>
  )
}

// Inline native-action icons. Clicking phone/text/email fires the right
// device-level link AND logs the touch as an interaction so the activity shows up
// in the lead's history.
const QuickActions = ({ lead, onLog }) => {
  const phone = lead.phone ? String(lead.phone).replace(/[^0-9+]/g, '') : null
  const email = lead.email
  const messagesHref = `/app/messages?lead=${lead.id}`

  const fireAndLog = async (kind) => {
    // Best-effort log — runs after the native link fires
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('interactions').insert({
        user_id: user.id,
        lead_id: lead.id,
        interaction_type: kind,
        notes: `Opened native ${kind} from leads`,
      })
      await supabase.from('leads').update({
        last_contact_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', lead.id)
    } catch {}
  }

  const iconBtn = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 6px',
    color: c.sub,
    fontFamily: 'inherit',
    fontSize: 13,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    textDecoration: 'none',
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginRight: 4 }}>
      {phone && (
        <a href={`tel:${phone}`} onClick={() => fireAndLog('call')} style={iconBtn} title="Call" aria-label={`Call ${lead.name}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        </a>
      )}
      {phone && (
        <a href={`sms:${phone}`} onClick={() => fireAndLog('text')} style={iconBtn} title="Text" aria-label={`Text ${lead.name}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a8 8 0 0 1-11.4 7.3L3 21l1.7-6.6A8 8 0 1 1 21 12z"/>
          </svg>
        </a>
      )}
      {email && (
        <a href={`mailto:${email}`} onClick={() => fireAndLog('email')} style={iconBtn} title="Email" aria-label={`Email ${lead.name}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </a>
      )}
      <button onClick={onLog} style={{ ...iconBtn, color: c.green }} title="Log contact" aria-label="Log contact">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>
    </span>
  )
}

const LeadCard = ({ lead, onEdit, onDelete, onLog }) => {
  const days = fmt.daysSince(lead.last_contact_date)
  return (
    <div style={{ borderTop: `1px solid ${c.border}`, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Avatar name={lead.name} temperature={lead.temperature} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div style={{ fontWeight: 500 }}>{lead.name}</div>
            <span style={temperatureChip(lead.temperature)}>{(lead.temperature || '').toUpperCase()}</span>
          </div>
          <div style={{ ...type.meta, marginTop: 2 }}>
            {[lead.lead_type, lead.source, lead.stage].filter(Boolean).join(' · ')}
          </div>
          {lead.phone && <div style={{ ...type.meta, marginTop: 2 }}>{lead.phone}</div>}
          {lead.price_range && <div style={{ ...type.meta, marginTop: 2 }}>{lead.price_range}</div>}
          <div style={{ marginTop: 4 }}>
            <ReadIndicator lead={lead} overdue={days != null && days >= 5} daysSince={days} />
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <QuickActions lead={lead} onLog={onLog} />
            <button onClick={onEdit} style={{ ...btn.secondary, height: 30, padding: '4px 12px', fontSize: 12 }}>Edit</button>
            <button onClick={onDelete} style={{ ...btn.ghost, height: 30, padding: '4px 12px', fontSize: 12, color: c.red, marginLeft: 'auto' }}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const Toast = ({ msg, kind }) => (
  <div style={{
    position: 'fixed', top: 80, right: 24, zIndex: 200,
    background: kind === 'error' ? c.redSoft : c.greenSoft,
    border: `1px solid ${kind === 'error' ? c.redBorder : c.greenBorder}`,
    color: kind === 'error' ? c.red : c.green,
    borderRadius: 6, padding: '10px 16px',
    fontSize: 13, fontWeight: 500,
    boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
  }}>{msg}</div>
)

const Field = ({ label, children, span = 1 }) => (
  <div style={{ gridColumn: `span ${span}` }}>
    <label style={inputLabel}>{label}</label>
    {children}
  </div>
)

const LeadForm = ({ form, setForm, editId, saving, onSave, onCancel }) => (
  <div style={{ ...card, marginBottom: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div style={type.sectionTitle}>{editId ? 'Edit lead' : 'New lead'}</div>
      <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: 18, color: c.dim, cursor: 'pointer' }}>×</button>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
      <Field label="Name *">
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Sarah Mitchell" style={input} />
      </Field>
      <Field label="Phone">
        <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(801) 555-0142" style={input} />
      </Field>
      <Field label="Email">
        <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="sarah@email.com" style={input} />
      </Field>
      <Field label="Source">
        <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} style={input}>
          {sourceOptions.map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Temperature">
        <select value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })} style={input}>
          {tempOptions.map(t => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
        </select>
      </Field>
      <Field label="Stage">
        <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} style={input}>
          {stageOptions.map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Type">
        <select value={form.lead_type} onChange={e => setForm({ ...form, lead_type: e.target.value })} style={input}>
          {typeOptions.map(t => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Price range">
        <input value={form.price_range} onChange={e => setForm({ ...form, price_range: e.target.value })} placeholder="$275K – $350K" style={input} />
      </Field>
      <Field label="Last contacted">
        <input type="date" value={form.last_contact_date} onChange={e => setForm({ ...form, last_contact_date: e.target.value })} style={input} />
      </Field>
      <Field label="Preferred area">
        <input value={form.preferred_area} onChange={e => setForm({ ...form, preferred_area: e.target.value })} placeholder="Downtown, Westside" style={input} />
      </Field>
      <Field label="Bedrooms">
        <select value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })} style={input}>
          <option value="">Any</option>
          {['1', '2', '3', '4', '5+'].map(b => <option key={b}>{b}</option>)}
        </select>
      </Field>
      <Field label="Timeline">
        <select value={form.timeline} onChange={e => setForm({ ...form, timeline: e.target.value })} style={input}>
          <option value="">Not specified</option>
          {['ASAP', '1–3 months', '3–6 months', '6–12 months', 'Just browsing'].map(t => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Pre-approved">
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ l: 'No', v: false }, { l: 'Yes', v: true }].map(o => (
            <button
              key={o.l}
              type="button"
              onClick={() => setForm({ ...form, pre_approved: o.v })}
              style={{
                flex: 1, height: 36, borderRadius: 6,
                border: `1px solid ${form.pre_approved === o.v ? c.text : c.border}`,
                background: form.pre_approved === o.v ? c.text : c.white,
                color: form.pre_approved === o.v ? c.white : c.sub,
                fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >{o.l}</button>
          ))}
        </div>
      </Field>
      {form.pre_approved && (
        <Field label="Pre-approval amount">
          <input value={form.pre_approved_amount} onChange={e => setForm({ ...form, pre_approved_amount: e.target.value })} placeholder="$350,000" style={input} />
        </Field>
      )}
      <Field label="Address">
        <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Current address" style={input} />
      </Field>
      <Field label="Contact preference">
        <div style={{ display: 'flex', gap: 4 }}>
          {['text', 'call', 'email'].map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setForm({ ...form, contact_preference: p })}
              style={{
                flex: 1, height: 36, borderRadius: 6,
                border: `1px solid ${form.contact_preference === p ? c.text : c.border}`,
                background: form.contact_preference === p ? c.text : c.white,
                color: form.contact_preference === p ? c.white : c.sub,
                fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                textTransform: 'capitalize',
              }}
            >{p}</button>
          ))}
        </div>
      </Field>
      <Field label="Birthday">
        <input type="date" value={form.birthday} onChange={e => setForm({ ...form, birthday: e.target.value })} style={input} />
      </Field>
      <Field label="Spouse / partner">
        <input value={form.spouse_name} onChange={e => setForm({ ...form, spouse_name: e.target.value })} placeholder="Partner's name" style={input} />
      </Field>
    </div>

    <div style={{ marginBottom: 16 }}>
      <label style={inputLabel}>Notes</label>
      <textarea
        value={form.notes}
        onChange={e => setForm({ ...form, notes: e.target.value })}
        placeholder="Interested in 3br homes near downtown…"
        rows={3}
        style={{ ...input, height: 'auto', padding: '10px 12px', resize: 'vertical' }}
      />
    </div>

    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={onSave}
        disabled={!form.name || saving}
        style={{ ...btn.primary, opacity: !form.name || saving ? 0.5 : 1, cursor: !form.name || saving ? 'default' : 'pointer' }}
      >
        {saving ? 'Saving…' : editId ? 'Update lead' : 'Add lead'}
      </button>
      <button onClick={onCancel} style={btn.secondary}>Cancel</button>
    </div>
  </div>
)

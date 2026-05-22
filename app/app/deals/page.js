'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { c, type, card, btn, input, inputLabel, fmt } from '@/lib/design'

const stageOptions = ['Contract', 'Inspection', 'Appraisal', 'Financing', 'Title', 'Closing', 'Closed']
const stageProgress = { Contract: 10, Inspection: 25, Appraisal: 40, Financing: 60, Title: 80, Closing: 90, Closed: 100 }

const emptyForm = {
  address: '', client_name: '', price: '', commission: '',
  close_date: '', stage: 'Contract', notes: '',
  lead_id: '',
}

export default function DealsPage() {
  const [deals, setDeals] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const showToast = (msg, kind = 'success') => {
    setToast({ msg, kind })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => { loadDeals(); loadLeads() }, [])

  const loadDeals = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('deals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setDeals(data || [])
    setLoading(false)
  }

  // Load the agent's leads so the deal form can offer a "Linked lead" dropdown.
  // Lightweight — only the fields the dropdown needs.
  const loadLeads = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('leads')
      .select('id, name, lead_type, temperature, phone, email')
      .eq('user_id', user.id)
      .order('name', { ascending: true })
    setLeads(data || [])
  }

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setSaving(true)
    const payload = {
      ...form,
      price: parseFloat(form.price) || 0,
      commission: parseFloat(form.commission) || 0,
      progress: stageProgress[form.stage] || 0,
      lead_id: form.lead_id || null,
      user_id: user.id,
    }
    let savedDealId = editId
    try {
      if (editId) {
        const { user_id, ...rest } = payload
        await supabase.from('deals').update({
          ...rest, updated_at: new Date().toISOString(),
        }).eq('id', editId)
        showToast('Deal updated')
      } else {
        const { data: inserted } = await supabase
          .from('deals')
          .insert(payload)
          .select('id')
          .single()
        savedDealId = inserted?.id
        showToast('Deal added')
      }
      if (window.brikk?.haptic) window.brikk.haptic('success')
    } catch {
      showToast('Something went wrong', 'error')
    }

    // Fire-and-forget Google Calendar sync for closing date + anniversary
    if (savedDealId) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        fetch('/api/integrations/google/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ type: 'deal', id: savedDealId }),
        }).catch(() => {})
      }
    }

    setSaving(false)
    setForm(emptyForm)
    setShowForm(false)
    setEditId(null)
    loadDeals()
  }

  const handleEdit = (deal) => {
    setForm({
      address: deal.address || '', client_name: deal.client_name || '',
      price: deal.price?.toString() || '', commission: deal.commission?.toString() || '',
      close_date: deal.close_date || '', stage: deal.stage || 'Contract',
      notes: deal.notes || '',
      lead_id: deal.lead_id || '',
    })
    setEditId(deal.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this deal?')) return
    await supabase.from('deals').delete().eq('id', id)
    showToast('Deal deleted')
    loadDeals()
  }

  const handleStageUpdate = async (id, newStage) => {
    await supabase.from('deals').update({
      stage: newStage,
      progress: stageProgress[newStage] || 0,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    loadDeals()
  }

  const totalCommission = deals.reduce((s, d) => s + (d.commission || 0), 0)
  const totalValue = deals.reduce((s, d) => s + (d.price || 0), 0)

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: c.dim, fontSize: 13 }}>Loading deals…</div>

  return (
    <div>
      {toast && <Toast {...toast} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <h1 style={{ ...type.pageTitle, margin: 0 }}>Deals</h1>
          <p style={{ ...type.bodySub, margin: '4px 0 0' }}>
            {deals.length} active · {fmt.moneyK(totalValue)} pipeline · {fmt.moneyK(totalCommission)} pending commission
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm) }} style={btn.primary}>
          + Add deal
        </button>
      </div>

      {showForm && (
        <DealForm
          form={form} setForm={setForm}
          editId={editId} saving={saving}
          leads={leads}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditId(null) }}
        />
      )}

      {deals.length === 0 ? (
        <div style={{ ...card, padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No deals yet</div>
          <div style={{ ...type.bodySub }}>Log a deal when you go under contract — Brikk will track every milestone to close.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {deals.map(d => (
            <DealCard
              key={d.id} deal={d}
              onEdit={() => handleEdit(d)}
              onDelete={() => handleDelete(d.id)}
              onStage={(s) => handleStageUpdate(d.id, s)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const DealCard = ({ deal, onEdit, onDelete, onStage }) => {
  const daysLeft = fmt.daysUntil(deal.close_date)
  const urgent = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0
  const overdue = daysLeft !== null && daysLeft < 0

  return (
    <div style={card}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>{deal.address}</div>
          <div style={{ ...type.bodySub, marginTop: 2 }}>
            {deal.client_name || 'No client'}
            {deal.close_date && (
              <span style={{ marginLeft: 8, color: urgent ? c.amber : overdue ? c.red : c.dim }}>
                · {overdue ? `${Math.abs(daysLeft)} days overdue` : daysLeft === 0 ? 'closes today' : `${daysLeft} days to close`}
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {deal.price > 0 && (
            <div style={{ fontSize: 16, fontWeight: 600, color: c.text }}>{fmt.money(deal.price)}</div>
          )}
          {deal.commission > 0 && (
            <div style={{ ...type.meta, marginTop: 2 }}>
              Commission {fmt.money(deal.commission)}
            </div>
          )}
        </div>
      </div>

      {/* Stepper */}
      <div style={{ marginTop: 18, marginBottom: 14 }}>
        <Stepper current={deal.stage} onSelect={onStage} />
      </div>

      {/* Notes + actions */}
      {deal.notes && (
        <div style={{ ...type.bodySub, paddingTop: 12, borderTop: `1px solid ${c.borderLight}`, marginBottom: 12 }}>
          {deal.notes}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <ShareTrackerLink deal={deal} />
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onEdit} style={btn.secondary}>Edit</button>
          <button onClick={onDelete} style={btn.ghost}>Delete</button>
        </div>
      </div>
    </div>
  )
}

// Client-facing tracker link share button. Copies the public URL to the clipboard.
const ShareTrackerLink = ({ deal }) => {
  const [copied, setCopied] = useState(false)
  if (!deal.client_token) {
    return <span style={{ ...type.meta, color: c.dim }}>Tracker link unavailable — run v2 schema migration</span>
  }
  const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://brikk.store'}/track/${deal.client_token}`
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      if (window.brikk?.haptic) window.brikk.haptic('success')
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // Fallback for old browsers
      prompt('Copy this link:', url)
    }
  }
  return (
    <button onClick={copy} style={{
      ...btn.ghost,
      fontSize: 12,
      color: copied ? c.green : c.sub,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
    }}>
      <span style={{ fontSize: 14 }}>{copied ? '✓' : '🔗'}</span>
      {copied ? 'Copied — share with client' : 'Share tracker link with client'}
    </button>
  )
}

const Stepper = ({ current, onSelect }) => {
  const currentIdx = stageOptions.indexOf(current)
  return (
    <>
      <style>{`
        .brikk-stepper-h { display: flex; }
        .brikk-stepper-v { display: none; }
        @media (max-width: 700px) {
          .brikk-stepper-h { display: none !important; }
          .brikk-stepper-v { display: flex !important; }
        }
      `}</style>

      {/* Horizontal — desktop / tablet */}
      <div className="brikk-stepper-h" style={{ position: 'relative', alignItems: 'center', justifyContent: 'space-between', gap: 0 }}>
        <div style={{
          position: 'absolute', left: 12, right: 12, top: 9,
          height: 1, background: c.border, zIndex: 0,
        }} />
        {currentIdx > 0 && (
          <div style={{
            position: 'absolute', left: 12, top: 9,
            height: 1, background: c.green,
            width: `calc(${(currentIdx / (stageOptions.length - 1)) * 100}% - 24px)`,
            zIndex: 1,
          }} />
        )}
        {stageOptions.map((s, i) => {
          const done = i <= currentIdx
          const isCurrent = i === currentIdx
          return (
            <button
              key={s}
              onClick={() => onSelect(s)}
              style={{
                position: 'relative', zIndex: 2,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: 0, fontFamily: 'inherit', flex: 1, minWidth: 0,
              }}
            >
              <span style={{
                width: 18, height: 18, borderRadius: '50%',
                background: done ? c.green : c.white,
                border: `1px solid ${done ? c.green : c.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 10, fontWeight: 700,
                boxShadow: isCurrent ? `0 0 0 4px ${c.greenSoft}` : 'none',
                flexShrink: 0,
              }}>
                {done && '✓'}
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: isCurrent ? 600 : 500,
                color: done ? c.text : c.dim,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                padding: '0 2px',
              }}>{s}</span>
            </button>
          )
        })}
      </div>

      {/* Vertical — mobile */}
      <div className="brikk-stepper-v" style={{ flexDirection: 'column', gap: 0, position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 8, top: 12, bottom: 12,
          width: 1, background: c.border, zIndex: 0,
        }} />
        {currentIdx > 0 && (
          <div style={{
            position: 'absolute', left: 8, top: 12,
            width: 1, background: c.green,
            height: `calc(${(currentIdx / (stageOptions.length - 1)) * 100}% - 24px)`,
            zIndex: 1,
          }} />
        )}
        {stageOptions.map((s, i) => {
          const done = i <= currentIdx
          const isCurrent = i === currentIdx
          return (
            <button
              key={s}
              onClick={() => onSelect(s)}
              style={{
                position: 'relative', zIndex: 2,
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '6px 0', fontFamily: 'inherit', textAlign: 'left',
              }}
            >
              <span style={{
                width: 18, height: 18, borderRadius: '50%',
                background: done ? c.green : c.white,
                border: `1px solid ${done ? c.green : c.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 10, fontWeight: 700,
                boxShadow: isCurrent ? `0 0 0 4px ${c.greenSoft}` : 'none',
                flexShrink: 0,
              }}>
                {done && '✓'}
              </span>
              <span style={{
                fontSize: 13,
                fontWeight: isCurrent ? 600 : 500,
                color: done ? c.text : c.dim,
              }}>{s}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}

const DealForm = ({ form, setForm, editId, saving, leads = [], onSave, onCancel }) => {
  // When a lead is selected, auto-fill client_name from the chosen lead.
  // Agent can still edit the field afterward if they want a different label.
  const handleLeadLink = (leadId) => {
    if (!leadId) {
      setForm({ ...form, lead_id: '' })
      return
    }
    const linkedLead = leads.find(l => l.id === leadId)
    setForm({
      ...form,
      lead_id: leadId,
      client_name: linkedLead?.name || form.client_name,
    })
  }
  return (
  <div style={{ ...card, marginBottom: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div style={type.sectionTitle}>{editId ? 'Edit deal' : 'New deal'}</div>
      <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: 18, color: c.dim, cursor: 'pointer' }}>×</button>
    </div>

    {/* Lead linker — pick an existing lead to auto-fill client info and keep
        them in sync. Selecting a lead pre-populates the client name; future
        edits to the lead's name flow back into this deal via DB trigger. */}
    {leads.length > 0 && (
      <div style={{ marginBottom: 14 }}>
        <label style={inputLabel}>Linked lead {form.lead_id ? '(auto-syncs name)' : '(optional)'}</label>
        <select
          value={form.lead_id || ''}
          onChange={e => handleLeadLink(e.target.value)}
          style={input}
        >
          <option value="">— No linked lead —</option>
          {leads.map(l => (
            <option key={l.id} value={l.id}>
              {l.name}{l.lead_type ? ` · ${l.lead_type}` : ''}{l.temperature ? ` · ${l.temperature}` : ''}
            </option>
          ))}
        </select>
      </div>
    )}

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 14 }}>
      <Field label="Property address *">
        <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="742 Oak Avenue" style={input} />
      </Field>
      <Field label="Client name">
        <input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} placeholder="Marcus Johnson" style={input} />
      </Field>
      <Field label="Price">
        <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="520000" style={input} />
      </Field>
      <Field label="Commission">
        <input type="number" value={form.commission} onChange={e => setForm({ ...form, commission: e.target.value })} placeholder="15600" style={input} />
      </Field>
      <Field label="Close date">
        <input type="date" value={form.close_date} onChange={e => setForm({ ...form, close_date: e.target.value })} style={input} />
      </Field>
      <Field label="Stage">
        <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} style={input}>
          {stageOptions.map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
    </div>

    <div style={{ marginBottom: 16 }}>
      <label style={inputLabel}>Notes</label>
      <textarea
        value={form.notes}
        onChange={e => setForm({ ...form, notes: e.target.value })}
        placeholder="Lender, title company, special terms…"
        rows={3}
        style={{ ...input, height: 'auto', padding: '10px 12px', resize: 'vertical' }}
      />
    </div>

    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={onSave}
        disabled={!form.address || saving}
        style={{ ...btn.primary, opacity: !form.address || saving ? 0.5 : 1 }}
      >
        {saving ? 'Saving…' : editId ? 'Update deal' : 'Add deal'}
      </button>
      <button onClick={onCancel} style={btn.secondary}>Cancel</button>
    </div>
  </div>
  )
}

const Field = ({ label, children }) => (
  <div>
    <label style={inputLabel}>{label}</label>
    {children}
  </div>
)

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

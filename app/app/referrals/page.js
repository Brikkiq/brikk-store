'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { c, type, card, btn, input, inputLabel, fmt } from '@/lib/design'

// Referral ledger — track who sent you business and who you sent business to.
// 20-30% of agent business comes from referrals but almost no CRM tracks them
// systematically. This becomes a referral-network moat over time.

const empty = {
  direction: 'received',
  party_name: '',
  party_phone: '',
  party_email: '',
  party_brokerage: '',
  client_name: '',
  status: 'open',
  expected_commission: '',
  notes: '',
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(empty)
  const [filter, setFilter] = useState('all') // 'all' | 'received' | 'given' | 'open' | 'closed'
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadReferrals() }, [])

  const loadReferrals = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('referrals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setReferrals(data || [])
    setLoading(false)
  }

  const showToast = (msg, kind = 'success') => {
    setToast({ msg, kind })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (!form.party_name.trim()) {
      showToast('Party name is required', 'error')
      return
    }
    setSaving(true)
    const payload = {
      ...form,
      user_id: user.id,
      expected_commission: form.expected_commission ? parseFloat(form.expected_commission) : null,
    }
    if (editId) {
      const { user_id, ...rest } = payload
      await supabase.from('referrals').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', editId)
      showToast('Referral updated')
    } else {
      await supabase.from('referrals').insert(payload)
      showToast('Referral added')
    }
    setSaving(false)
    setForm(empty)
    setShowForm(false)
    setEditId(null)
    loadReferrals()
  }

  const handleClose = async (r) => {
    if (!confirm('Mark this referral as closed?')) return
    await supabase.from('referrals').update({
      status: 'closed',
      closed_at: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    }).eq('id', r.id)
    showToast('Referral closed')
    loadReferrals()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this referral?')) return
    await supabase.from('referrals').delete().eq('id', id)
    showToast('Deleted')
    loadReferrals()
  }

  const handleEdit = (r) => {
    setForm({
      direction: r.direction,
      party_name: r.party_name || '',
      party_phone: r.party_phone || '',
      party_email: r.party_email || '',
      party_brokerage: r.party_brokerage || '',
      client_name: r.client_name || '',
      status: r.status || 'open',
      expected_commission: r.expected_commission?.toString() || '',
      notes: r.notes || '',
    })
    setEditId(r.id)
    setShowForm(true)
  }

  // Filter
  const filtered = referrals.filter(r => {
    if (filter === 'all') return true
    if (filter === 'received' || filter === 'given') return r.direction === filter
    return r.status === filter
  })

  // Stats
  const stats = {
    received: referrals.filter(r => r.direction === 'received').length,
    given: referrals.filter(r => r.direction === 'given').length,
    open: referrals.filter(r => r.status === 'open').length,
    closedCommission: referrals
      .filter(r => r.status === 'closed' && r.direction === 'received')
      .reduce((sum, r) => sum + (Number(r.actual_commission || r.expected_commission) || 0), 0),
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: c.dim, fontSize: 13 }}>Loading…</div>

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: 80, right: 24, zIndex: 200,
          background: toast.kind === 'error' ? c.redSoft : c.greenSoft,
          border: `1px solid ${toast.kind === 'error' ? c.redBorder : c.greenBorder}`,
          color: toast.kind === 'error' ? c.red : c.green,
          borderRadius: 6, padding: '10px 16px',
          fontSize: 13, fontWeight: 500,
        }}>{toast.msg}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ ...type.pageTitle, margin: 0 }}>Referrals</h1>
          <p style={{ ...type.bodySub, margin: '4px 0 0' }}>
            {stats.received} received · {stats.given} given · {stats.open} open · {fmt.money(stats.closedCommission)} closed commission
          </p>
        </div>
        <button onClick={() => { setForm(empty); setEditId(null); setShowForm(true) }} style={btn.primary}>
          + Log referral
        </button>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {['all', 'received', 'given', 'open', 'closed'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? c.text : c.white,
            color: filter === f ? c.white : c.sub,
            border: `1px solid ${filter === f ? c.text : c.border}`,
            borderRadius: 999,
            padding: '6px 14px',
            fontSize: 12, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
            textTransform: 'capitalize',
          }}>{f}</button>
        ))}
      </div>

      {showForm && (
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={type.sectionTitle}>{editId ? 'Edit referral' : 'New referral'}</div>
            <button onClick={() => { setShowForm(false); setEditId(null) }} style={{ background: 'none', border: 'none', fontSize: 18, color: c.dim, cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
            <Field label="Direction">
              <select value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })} style={input}>
                <option value="received">I received this referral</option>
                <option value="given">I sent this referral</option>
              </select>
            </Field>
            <Field label="Other agent / referrer *">
              <input value={form.party_name} onChange={e => setForm({ ...form, party_name: e.target.value })} placeholder="Sarah Mitchell" style={input} />
            </Field>
            <Field label="Their brokerage">
              <input value={form.party_brokerage} onChange={e => setForm({ ...form, party_brokerage: e.target.value })} placeholder="Keller Williams" style={input} />
            </Field>
            <Field label="Their phone">
              <input type="tel" value={form.party_phone} onChange={e => setForm({ ...form, party_phone: e.target.value })} style={input} />
            </Field>
            <Field label="Their email">
              <input type="email" value={form.party_email} onChange={e => setForm({ ...form, party_email: e.target.value })} style={input} />
            </Field>
            <Field label="Client name">
              <input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} placeholder="John Smith" style={input} />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={input}>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="lost">Lost</option>
              </select>
            </Field>
            <Field label="Expected commission ($)">
              <input type="number" value={form.expected_commission} onChange={e => setForm({ ...form, expected_commission: e.target.value })} placeholder="2500" style={input} />
            </Field>
          </div>
          <Field label="Notes">
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} style={{ ...input, height: 'auto', padding: '10px 12px' }} />
          </Field>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <button onClick={() => { setShowForm(false); setEditId(null) }} style={btn.secondary}>Cancel</button>
            <button onClick={handleSave} style={{ ...btn.primary, opacity: saving ? 0.6 : 1 }} disabled={saving}>
              {saving ? 'Saving…' : editId ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ ...card, padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No referrals yet</div>
          <div style={{ ...type.bodySub }}>Log every referral — given and received — so you know who to send business back to. 20-30% of agent revenue comes from referrals.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(r => (
            <div key={r.id} style={{ ...card }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600,
                      color: r.direction === 'received' ? c.green : c.indigo,
                      background: r.direction === 'received' ? c.greenSoft : c.indigoSoft,
                      padding: '2px 8px', borderRadius: 4,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      {r.direction === 'received' ? '← Received' : '→ Given'}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 600,
                      color: r.status === 'open' ? c.amber : r.status === 'closed' ? c.green : c.dim,
                      background: r.status === 'open' ? c.amberSoft : r.status === 'closed' ? c.greenSoft : 'rgba(26,26,24,0.04)',
                      padding: '2px 8px', borderRadius: 4,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      {r.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{r.party_name}</div>
                  {r.party_brokerage && <div style={{ ...type.meta }}>{r.party_brokerage}</div>}
                  {r.client_name && <div style={{ ...type.bodySub, marginTop: 6 }}>Client: <strong style={{ color: c.text }}>{r.client_name}</strong></div>}
                  {r.notes && <div style={{ ...type.bodySub, marginTop: 8, fontSize: 12.5 }}>{r.notes}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {r.expected_commission > 0 && (
                    <div style={{ fontSize: 15, fontWeight: 600, color: r.status === 'closed' ? c.green : c.text }}>
                      {fmt.money(r.expected_commission)}
                    </div>
                  )}
                  <div style={{ ...type.meta, marginTop: 4 }}>
                    {r.referred_at ? new Date(r.referred_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 12, justifyContent: 'flex-end' }}>
                {r.status === 'open' && (
                  <button onClick={() => handleClose(r)} style={{ ...btn.secondary, color: c.green, borderColor: c.greenBorder }}>Mark closed</button>
                )}
                <button onClick={() => handleEdit(r)} style={btn.secondary}>Edit</button>
                <button onClick={() => handleDelete(r.id)} style={{ ...btn.ghost, color: c.red }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const Field = ({ label, children }) => (
  <div>
    <label style={inputLabel}>{label}</label>
    {children}
  </div>
)

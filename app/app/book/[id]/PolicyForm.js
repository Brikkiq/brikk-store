'use client'
// Add / edit a policy. No health or underwriting fields — by design.
import { useState } from 'react'
import { c, type, card, btn, input } from '@/lib/design'
import { Field } from '@/lib/ui'

export function PolicyForm({ initial, members, onSubmit, onCancel }) {
  const [p, setP] = useState({
    carrier: initial?.carrier || '',
    product: initial?.product || '',
    policy_number: initial?.policy_number || '',
    face_amount: initial?.face_amount ?? '',
    monthly_premium: initial?.monthly_premium ?? '',
    application_date: initial?.application_date || '',
    effective_date: initial?.effective_date || '',
    first_draft_date: initial?.first_draft_date || '',
    status: initial?.status || 'pending',
    insured_member_id: initial?.insured_member_id || (members.find(m => m.role === 'policyholder')?.id ?? ''),
  })
  const [bens, setBens] = useState(initial?.beneficiaries?.length ? initial.beneficiaries : [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const set = (k) => (e) => setP(prev => ({ ...prev, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!p.carrier.trim()) { setError('Enter the carrier.'); return }
    setSaving(true)
    try {
      await onSubmit({
        ...p,
        face_amount: p.face_amount === '' ? null : p.face_amount,
        monthly_premium: p.monthly_premium === '' ? null : p.monthly_premium,
        application_date: p.application_date || null,
        effective_date: p.effective_date || null,
        first_draft_date: p.first_draft_date || null,
        insured_member_id: p.insured_member_id || null,
        beneficiaries: bens.filter(b => b.name?.trim()).map(b => ({ name: b.name.trim(), relationship: b.relationship?.trim() || null })),
      })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }

  return (
    <form onSubmit={submit} style={{ ...card, display: 'grid', gap: 14 }}>
      <div style={type.sectionTitle}>{initial ? 'Edit policy' : 'Add policy'}</div>
      <div style={grid}>
        <Field label="Carrier"><input value={p.carrier} onChange={set('carrier')} style={input} maxLength={120} required placeholder="e.g. Mutual of Omaha" /></Field>
        <Field label="Product"><input value={p.product} onChange={set('product')} style={input} maxLength={120} placeholder="e.g. Final Expense, Term 20" /></Field>
        <Field label="Face amount ($)"><input value={p.face_amount} onChange={set('face_amount')} style={input} inputMode="decimal" placeholder="250000" /></Field>
        <Field label="Monthly premium ($)"><input value={p.monthly_premium} onChange={set('monthly_premium')} style={input} inputMode="decimal" placeholder="45.20" /></Field>
        <Field label="Application date" hint="Thank-you, 30/60/90-day, 6-month and annual follow-ups count from this">
          <input type="date" value={p.application_date} onChange={set('application_date')} style={input} />
        </Field>
        <Field label="Effective date"><input type="date" value={p.effective_date} onChange={set('effective_date')} style={input} /></Field>
        <Field label="First draft date" hint="Pre-draft and payment checks count from this">
          <input type="date" value={p.first_draft_date} onChange={set('first_draft_date')} style={input} />
        </Field>
        <Field label="Status">
          <select value={p.status} onChange={set('status')} style={input}>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Field>
        <Field label="Insured person">
          <select value={p.insured_member_id} onChange={set('insured_member_id')} style={input}>
            <option value="">—</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name || ''}</option>)}
          </select>
        </Field>
        <Field label="Policy number (optional)"><input value={p.policy_number} onChange={set('policy_number')} style={input} maxLength={60} /></Field>
      </div>

      <div>
        <div style={{ ...type.label, marginBottom: 8 }}>Beneficiaries</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {bens.map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input value={b.name || ''} onChange={e => setBens(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                placeholder="Name" aria-label="Beneficiary name" style={{ ...input, flex: '2 1 180px' }} maxLength={120} />
              <input value={b.relationship || ''} onChange={e => setBens(prev => prev.map((x, j) => j === i ? { ...x, relationship: e.target.value } : x))}
                placeholder="Relationship (e.g. Spouse)" aria-label="Relationship" style={{ ...input, flex: '1 1 140px' }} maxLength={60} />
              <button type="button" onClick={() => setBens(prev => prev.filter((_, j) => j !== i))} style={btn.ghost}>Remove</button>
            </div>
          ))}
        </div>
        {bens.length < 10 && (
          <button type="button" onClick={() => setBens(prev => [...prev, { name: '', relationship: '' }])} style={{ ...btn.secondary, marginTop: 8 }}>+ Add beneficiary</button>
        )}
      </div>

      {initial && <div style={type.meta}>Changing dates or status recalculates this policy’s upcoming follow-ups. Completed ones are kept.</div>}
      {error && <div style={{ color: c.red, fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={saving} style={{ ...btn.primary, minHeight: 44 }}>{saving ? 'Saving…' : initial ? 'Save policy' : 'Add policy & schedule follow-ups'}</button>
        <button type="button" onClick={onCancel} style={{ ...btn.secondary, minHeight: 44 }}>Cancel</button>
      </div>
    </form>
  )
}

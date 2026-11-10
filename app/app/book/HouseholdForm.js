'use client'
// Add / edit a household: contact info + people (policyholder, spouse, kids).
import { useState } from 'react'
import { c, type, card, btn, input } from '@/lib/design'
import { Field, HealthInfoWarning } from '@/lib/ui'

export const ROLE_LABEL = { policyholder: 'Policyholder', spouse: 'Spouse', child: 'Child', other: 'Other' }

const blankMember = (role) => ({ role, first_name: '', last_name: '', birthday: '', phone: '' })

export function HouseholdForm({ initial, withMembers = true, onSubmit, onCancel, submitLabel = 'Save' }) {
  const [h, setH] = useState({
    display_name: initial?.display_name || '',
    phone: initial?.phone || '',
    email: initial?.email || '',
    address_line: initial?.address_line || '',
    city: initial?.city || '',
    state: initial?.state || '',
    zip: initial?.zip || '',
    source: initial?.source || '',
    status: initial?.status || 'prospect',
    notes: initial?.notes || '',
  })
  const [members, setMembers] = useState(withMembers ? [blankMember('policyholder')] : [])
  const [nameTouched, setNameTouched] = useState(!!initial?.display_name)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (k) => (e) => setH(prev => ({ ...prev, [k]: e.target.value }))

  const setMember = (i, k, v) => {
    setMembers(prev => prev.map((m, j) => (j === i ? { ...m, [k]: v } : m)))
    if (i === 0 && !nameTouched && (k === 'first_name' || k === 'last_name')) {
      const m = { ...members[0], [k]: v }
      setH(prev => ({ ...prev, display_name: [m.first_name, m.last_name].filter(Boolean).join(' ') }))
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (withMembers && !members[0]?.first_name.trim()) { setError('Enter the policyholder’s first name.'); return }
    if (!h.display_name.trim()) { setError('Enter a name for this household.'); return }
    setSaving(true)
    try {
      const body = { ...h }
      if (withMembers) {
        body.members = members.filter(m => m.first_name.trim()).map(m => ({
          role: m.role, first_name: m.first_name, last_name: m.last_name || null,
          birthday: m.birthday || null, phone: m.phone || null,
        }))
        if (!body.phone && body.members[0]?.phone) body.phone = body.members[0].phone
      }
      await onSubmit(body)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
      {withMembers && (
        <div style={{ ...card }}>
          <div style={{ ...type.sectionTitle, marginBottom: 12 }}>People in this household</div>
          <div style={{ display: 'grid', gap: 14 }}>
            {members.map((m, i) => (
              <div key={i} style={{ paddingTop: i ? 14 : 0, borderTop: i ? `1px solid ${c.borderLight}` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={type.eyebrow}>{ROLE_LABEL[m.role]}</span>
                  {i > 0 && <button type="button" onClick={() => setMembers(prev => prev.filter((_, j) => j !== i))} style={btn.ghost}>Remove</button>}
                </div>
                <div style={grid}>
                  <Field label="First name"><input value={m.first_name} onChange={e => setMember(i, 'first_name', e.target.value)} style={input} required={i === 0} maxLength={100} /></Field>
                  <Field label="Last name"><input value={m.last_name} onChange={e => setMember(i, 'last_name', e.target.value)} style={input} maxLength={100} /></Field>
                  <Field label="Birthday"><input type="date" value={m.birthday} onChange={e => setMember(i, 'birthday', e.target.value)} style={input} /></Field>
                  {m.role !== 'child' && <Field label="Mobile phone"><input type="tel" value={m.phone} onChange={e => setMember(i, 'phone', e.target.value)} style={input} maxLength={40} /></Field>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            {!members.some(m => m.role === 'spouse') && (
              <button type="button" onClick={() => setMembers(prev => [...prev, blankMember('spouse')])} style={btn.secondary}>+ Add spouse</button>
            )}
            <button type="button" onClick={() => setMembers(prev => [...prev, blankMember('child')])} style={btn.secondary}>+ Add child</button>
          </div>
        </div>
      )}

      <div style={{ ...card }}>
        <div style={{ ...type.sectionTitle, marginBottom: 12 }}>Contact</div>
        <div style={grid}>
          <Field label="Household name" hint="How it shows in your Book">
            <input value={h.display_name} onChange={e => { setNameTouched(true); set('display_name')(e) }} style={input} maxLength={200} required />
          </Field>
          <Field label="Main phone (for texts)"><input type="tel" value={h.phone} onChange={set('phone')} style={input} maxLength={40} /></Field>
          <Field label="Email"><input type="email" value={h.email} onChange={set('email')} style={input} maxLength={254} /></Field>
          <Field label="How they found you"><input value={h.source} onChange={set('source')} placeholder="Referral, Facebook lead…" style={input} maxLength={100} /></Field>
          <Field label="Street address"><input value={h.address_line} onChange={set('address_line')} style={input} maxLength={200} /></Field>
          <Field label="City"><input value={h.city} onChange={set('city')} style={input} maxLength={100} /></Field>
          <Field label="State"><input value={h.state} onChange={set('state')} style={input} maxLength={50} /></Field>
          <Field label="ZIP"><input value={h.zip} onChange={set('zip')} style={input} maxLength={20} inputMode="numeric" /></Field>
          <Field label="Status">
            <select value={h.status} onChange={set('status')} style={input}>
              <option value="prospect">Prospect</option>
              <option value="client">Client</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </div>
        <div style={{ marginTop: 12 }}>
          <Field label="Notes">
            <textarea value={h.notes} onChange={set('notes')} rows={3} maxLength={5000}
              style={{ ...input, height: 'auto', minHeight: 80, lineHeight: 1.5, resize: 'vertical' }} />
          </Field>
          <HealthInfoWarning />
        </div>
      </div>

      {error && <div style={{ color: c.red, fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={saving} style={{ ...btn.primary, minHeight: 44 }}>{saving ? 'Saving…' : submitLabel}</button>
        {onCancel && <button type="button" onClick={onCancel} style={{ ...btn.secondary, minHeight: 44 }}>Cancel</button>}
      </div>
    </form>
  )
}

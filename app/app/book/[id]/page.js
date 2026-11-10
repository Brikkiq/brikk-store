'use client'
// One client household: who they are, their policies, and their timeline.
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/client/api'
import { c, type, card, btn, input, chipFor, fmt } from '@/lib/design'
import { Loading, ErrorBox, Field, SectionLabel, HealthInfoWarning, useToast, money } from '@/lib/ui'
import { smsHref, telHref, platformFromUserAgent } from '@/lib/core/sms'
import { shortDate, nextBirthdayLabel } from './helpers'
import { HouseholdForm, ROLE_LABEL } from '../HouseholdForm'
import { PolicyForm } from './PolicyForm'
import { Timeline } from './Timeline'

export default function HouseholdPage() {
  const { id } = useParams()
  const [h, setH] = useState(null)
  const [timeline, setTimeline] = useState(null)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [policyForm, setPolicyForm] = useState(null) // null | 'new' | policy object
  const [memberForm, setMemberForm] = useState(null) // null | 'new' | member object
  const [platform, setPlatform] = useState('other')
  const [toast, showToast] = useToast()

  const load = useCallback(async () => {
    setError(null)
    try {
      const [detail, tl] = await Promise.all([api.get(`/households/${id}`), api.get(`/households/${id}/timeline`)])
      setH(detail)
      setTimeline(tl)
    } catch (e) {
      setError(e.message)
    }
  }, [id])

  useEffect(() => {
    setPlatform(platformFromUserAgent(navigator.userAgent))
    if (new URLSearchParams(window.location.search).get('add') === 'policy') setPolicyForm('new')
    load()
  }, [load])

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  if (error && !h) return <ErrorBox message={error} onRetry={load} />
  if (!h) return <Loading />

  const sms = smsHref(h.phone, '', platform)
  const tel = telHref(h.phone)

  const savePolicy = async (body) => {
    if (policyForm === 'new') {
      await api.post(`/households/${id}/policies`, body)
      showToast('Policy added — follow-ups scheduled')
    } else {
      await api.patch(`/policies/${policyForm.id}`, body)
      showToast('Policy saved')
    }
    setPolicyForm(null)
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname)
    await load()
  }

  const deletePolicy = async (p) => {
    if (!confirm(`Delete the ${p.carrier} policy and its scheduled follow-ups? This can’t be undone.`)) return
    try { await api.del(`/policies/${p.id}`); await load() } catch (e) { showToast(e.message, 'error') }
  }

  const deleteHousehold = async () => {
    if (!confirm(`Delete ${h.display_name} and everything in their timeline? This can’t be undone.`)) return
    try { await api.del(`/households/${id}`); window.location.href = '/app/book' } catch (e) { showToast(e.message, 'error') }
  }

  return (
    <div style={{ maxWidth: 920 }}>
      {toast}
      <a href="/app/book" style={{ ...type.meta, textDecoration: 'none', color: c.sub }}>← Book</a>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start', margin: '8px 0 20px' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h1 style={{ ...type.pageTitle, margin: 0 }}>{h.display_name}</h1>
            <span style={chipFor(h.status === 'client' ? 'success' : h.status === 'prospect' ? 'warm' : 'cold')}>{h.status}</span>
          </div>
          <div style={{ ...type.bodySub, marginTop: 4 }}>
            {[h.phone && fmt.phone(h.phone), h.email, [h.city, h.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ') || 'No contact info yet'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {sms && <a href={sms} style={{ ...btn.primary, textDecoration: 'none', minHeight: 44 }}>Text</a>}
          {tel && <a href={tel} style={{ ...btn.secondary, textDecoration: 'none', minHeight: 44 }}>Call</a>}
          <button onClick={() => setEditing(v => !v)} style={{ ...btn.secondary, minHeight: 44 }}>{editing ? 'Close' : 'Edit info'}</button>
        </div>
      </div>

      {editing && (
        <div style={{ marginBottom: 24 }}>
          <HouseholdForm initial={h} withMembers={false} submitLabel="Save changes"
            onSubmit={async (body) => { await api.patch(`/households/${id}`, body); setEditing(false); showToast('Saved'); await load() }}
            onCancel={() => setEditing(false)} />
          <button onClick={deleteHousehold} style={{ ...btn.danger, marginTop: 12 }}>Delete this client</button>
        </div>
      )}

      {/* People */}
      <section style={{ marginBottom: 26 }}>
        <SectionLabel right={<button onClick={() => setMemberForm('new')} style={btn.ghost}>+ Add person</button>}>People</SectionLabel>
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          {h.members.length === 0 && <div style={{ ...type.bodySub, padding: 16 }}>No one added yet.</div>}
          {h.members.map((m, i) => (
            memberForm?.id === m.id ? (
              <MemberEditor key={m.id} member={m} householdId={id} onDone={async (msg) => { setMemberForm(null); if (msg) showToast(msg); await load() }} />
            ) : (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: i ? `1px solid ${c.borderLight}` : 'none', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{m.first_name} {m.last_name || ''}</div>
                  <div style={type.meta}>{ROLE_LABEL[m.role]}{m.birthday ? ` · Born ${shortDate(m.birthday)}, ${m.birthday.slice(0, 4)} · ${nextBirthdayLabel(m.birthday, timeline?.today)}` : ' · No birthday on file'}{m.phone ? ` · ${fmt.phone(m.phone)}` : ''}</div>
                </div>
                <button onClick={() => setMemberForm(m)} style={btn.ghost}>Edit</button>
              </div>
            )
          ))}
          {memberForm === 'new' && <MemberEditor householdId={id} onDone={async (msg) => { setMemberForm(null); if (msg) showToast(msg); await load() }} />}
        </div>
      </section>

      {/* Policies */}
      <section style={{ marginBottom: 26 }}>
        <SectionLabel right={!policyForm && <button onClick={() => setPolicyForm('new')} style={btn.ghost}>+ Add policy</button>}>Policies</SectionLabel>
        {policyForm && (
          <div style={{ marginBottom: 12 }}>
            <PolicyForm initial={policyForm === 'new' ? null : policyForm} members={h.members} onSubmit={savePolicy}
              onCancel={() => { setPolicyForm(null); if (window.location.search) window.history.replaceState(null, '', window.location.pathname) }} />
          </div>
        )}
        {h.policies.length === 0 && !policyForm && (
          <div style={{ ...card, ...type.bodySub }}>No policies yet. <button onClick={() => setPolicyForm('new')} style={{ ...btn.ghost, padding: 0, height: 'auto', color: c.text, textDecoration: 'underline' }}>Add one</button> to schedule follow-ups.</div>
        )}
        <div style={{ display: 'grid', gap: 10 }}>
          {h.policies.filter(p => p.id !== policyForm?.id).map(p => (
            <div key={p.id} style={{ ...card, padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'baseline' }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{p.carrier}{p.product ? ` · ${p.product}` : ''}</div>
                <span style={chipFor(p.status === 'active' ? 'success' : p.status === 'pending' ? 'warm' : 'cold')}>{p.status}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 10 }}>
                <Kv k="Face amount" v={money(p.face_amount)} />
                <Kv k="Monthly premium" v={money(p.monthly_premium, 2)} />
                <Kv k="Application" v={p.application_date ? shortDate(p.application_date) + ', ' + p.application_date.slice(0, 4) : '—'} />
                <Kv k="Effective" v={p.effective_date ? shortDate(p.effective_date) + ', ' + p.effective_date.slice(0, 4) : '—'} />
                <Kv k="First draft" v={p.first_draft_date ? shortDate(p.first_draft_date) + ', ' + p.first_draft_date.slice(0, 4) : '—'} />
                {p.policy_number && <Kv k="Policy #" v={p.policy_number} />}
              </div>
              {p.beneficiaries?.length > 0 && (
                <div style={{ ...type.meta, marginTop: 8 }}>Beneficiaries: {p.beneficiaries.map(b => b.relationship ? `${b.name} (${b.relationship})` : b.name).join(', ')}</div>
              )}
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button onClick={() => setPolicyForm(p)} style={btn.secondary}>Edit</button>
                <button onClick={() => deletePolicy(p)} style={btn.ghost}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section style={{ marginBottom: 26 }}>
        <SectionLabel>Timeline</SectionLabel>
        <Timeline data={timeline} household={{ id: h.id, display_name: h.display_name }} phone={h.phone} onChanged={load} />
        <LogActivity householdId={id} onSaved={async () => { showToast('Saved to timeline'); await load() }} />
      </section>

      {h.notes && (
        <section style={{ marginBottom: 26 }}>
          <SectionLabel>Notes</SectionLabel>
          <div style={{ ...card, whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.55 }}>{h.notes}</div>
        </section>
      )}
    </div>
  )
}

const Kv = ({ k, v }) => (
  <div>
    <div style={type.meta}>{k}</div>
    <div style={{ fontSize: 14, fontWeight: 500 }}>{v}</div>
  </div>
)

function MemberEditor({ member, householdId, onDone }) {
  const [m, setM] = useState({
    role: member?.role || 'child', first_name: member?.first_name || '', last_name: member?.last_name || '',
    birthday: member?.birthday || '', phone: member?.phone || '',
  })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setM(prev => ({ ...prev, [k]: e.target.value }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true); setError(null)
    const body = { ...m, last_name: m.last_name || null, birthday: m.birthday || null, phone: m.phone || null }
    try {
      if (member) await api.patch(`/members/${member.id}`, body)
      else await api.post(`/households/${householdId}/members`, body)
      onDone(member ? 'Saved' : 'Person added')
    } catch (err) { setError(err.message); setSaving(false) }
  }
  const remove = async () => {
    if (!confirm(`Remove ${member.first_name} from this household?`)) return
    try { await api.del(`/members/${member.id}`); onDone('Removed') } catch (err) { setError(err.message) }
  }

  return (
    <form onSubmit={save} style={{ padding: 16, borderTop: `1px solid ${c.borderLight}`, background: c.bgInset, display: 'grid', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        <Field label="Role">
          <select value={m.role} onChange={set('role')} style={input}>
            {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="First name"><input value={m.first_name} onChange={set('first_name')} style={input} required maxLength={100} /></Field>
        <Field label="Last name"><input value={m.last_name} onChange={set('last_name')} style={input} maxLength={100} /></Field>
        <Field label="Birthday"><input type="date" value={m.birthday} onChange={set('birthday')} style={input} /></Field>
        <Field label="Mobile phone"><input type="tel" value={m.phone} onChange={set('phone')} style={input} maxLength={40} /></Field>
      </div>
      {error && <div style={{ color: c.red, fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="submit" disabled={saving} style={btn.primary}>{saving ? 'Saving…' : 'Save'}</button>
        <button type="button" onClick={() => onDone(null)} style={btn.secondary}>Cancel</button>
        {member && <button type="button" onClick={remove} style={btn.ghost}>Remove person</button>}
      </div>
    </form>
  )
}

function LogActivity({ householdId, onSaved }) {
  const [open, setOpen] = useState(false)
  const [type_, setType] = useState('call')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  if (!open) return <button onClick={() => setOpen(true)} style={{ ...btn.secondary, marginTop: 4 }}>+ Log a call or note</button>

  const save = async (e) => {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      await api.post(`/households/${householdId}/activity`, { type: type_, note: note || null })
      setOpen(false); setNote(''); setSaving(false)
      onSaved()
    } catch (err) { setError(err.message); setSaving(false) }
  }

  return (
    <form onSubmit={save} style={{ ...card, display: 'grid', gap: 10, marginTop: 4 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {[['call', 'Call'], ['text_sent', 'Text'], ['note', 'Note']].map(([k, v]) => (
          <button key={k} type="button" onClick={() => setType(k)} style={type_ === k ? btn.primary : btn.secondary}>{v}</button>
        ))}
      </div>
      <div>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} maxLength={2000} placeholder="What happened? (optional)"
          aria-label="Note" style={{ ...input, height: 'auto', minHeight: 64, lineHeight: 1.5, resize: 'vertical' }} />
        <HealthInfoWarning />
      </div>
      {error && <div style={{ color: c.red, fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={saving} style={btn.primary}>Save</button>
        <button type="button" onClick={() => setOpen(false)} style={btn.secondary}>Cancel</button>
      </div>
    </form>
  )
}

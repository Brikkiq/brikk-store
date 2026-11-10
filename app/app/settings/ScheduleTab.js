'use client'
// Settings → Follow-up schedule. Edits the agent's own schedule via /api/v1/schedule.
// Changes apply to policies added afterwards; existing follow-ups can be edited
// one by one from the client's timeline.
import { useEffect, useState } from 'react'
import { api } from '@/lib/client/api'
import { c, type, card, btn, input, inputLabel } from '@/lib/design'
import { ANCHORS, ANCHOR_LABELS, describeTiming } from '@/lib/core/schedule'
import { PLACEHOLDERS } from '@/lib/core/messages'

export function ScheduleTab({ showToast }) {
  const [steps, setSteps] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => { api.get('/schedule').then(setSteps).catch(e => setError(e.message)) }, [])

  const update = (i, k, v) => { setDirty(true); setSteps(prev => prev.map((s, j) => (j === i ? { ...s, [k]: v } : s))) }
  const move = (i, d) => {
    setDirty(true)
    setSteps(prev => {
      const next = [...prev]
      const j = i + d
      if (j < 0 || j >= next.length) return prev
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const save = async () => {
    setSaving(true); setError(null)
    try {
      const saved = await api.put('/schedule', {
        templates: steps.map(s => ({
          ...(s.id ? { id: s.id } : {}),
          label: s.label, anchor: s.anchor,
          offset_days: Number(s.offset_days) || 0, offset_months: Number(s.offset_months) || 0,
          repeat_yearly: !!s.repeat_yearly, message_template: s.message_template, active: s.active !== false,
        })),
      })
      setSteps(saved); setDirty(false)
      showToast('Schedule saved — applies to new policies')
    } catch (e) { setError(e.message) }
    setSaving(false)
  }

  const reset = async () => {
    if (!confirm('Reset your schedule to the default steps? Your custom steps and texts will be replaced.')) return
    setSaving(true)
    try { setSteps(await api.post('/schedule/reset')); setDirty(false); showToast('Schedule reset') } catch (e) { setError(e.message) }
    setSaving(false)
  }

  if (error && !steps) return <div style={{ color: c.red, fontSize: 13 }}>{error}</div>
  if (!steps) return <div style={{ ...type.meta, padding: 24 }}>Loading schedule…</div>

  return (
    <div>
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={type.sectionTitle}>Follow-up schedule</div>
        <p style={{ ...type.bodySub, margin: '6px 0 0' }}>
          These steps are scheduled automatically when you add a policy. Changes apply to policies you add from now on —
          you can still edit any single follow-up from a client’s timeline. Birthday texts are separate and automatic for everyone in a household.
        </p>
        <p style={{ ...type.meta, margin: '8px 0 0' }}>
          Placeholders you can use in texts: {PLACEHOLDERS.filter(p => p !== 'turning').map(p => `{${p}}`).join(' ')}
        </p>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {steps.map((s, i) => (
          <div key={s.id || `new-${i}`} style={{ ...card, padding: '14px 16px', opacity: s.active === false ? 0.6 : 1 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
              <input value={s.label} onChange={e => update(i, 'label', e.target.value)} aria-label="Step name" maxLength={80}
                style={{ ...input, flex: '1 1 200px', fontWeight: 600 }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: c.sub }}>
                <input type="checkbox" checked={s.active !== false} onChange={e => update(i, 'active', e.target.checked)} /> On
              </label>
              <button onClick={() => move(i, -1)} disabled={i === 0} style={btn.ghost} aria-label="Move up">↑</button>
              <button onClick={() => move(i, 1)} disabled={i === steps.length - 1} style={btn.ghost} aria-label="Move down">↓</button>
              <button onClick={() => { setDirty(true); setSteps(prev => prev.filter((_, j) => j !== i)) }} style={btn.ghost}>Delete</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
              <label><span style={inputLabel}>Counts from</span>
                <select value={s.anchor} onChange={e => update(i, 'anchor', e.target.value)} style={input}>
                  {ANCHORS.map(a => <option key={a} value={a}>{ANCHOR_LABELS[a]}</option>)}
                </select>
              </label>
              <label><span style={inputLabel}>Days (+ after, − before)</span>
                <input type="number" value={s.offset_days} onChange={e => update(i, 'offset_days', e.target.value)} style={input} min={-365} max={3650} />
              </label>
              <label><span style={inputLabel}>Months after</span>
                <input type="number" value={s.offset_months} onChange={e => update(i, 'offset_months', e.target.value)} style={input} min={0} max={120} />
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-end', gap: 6, fontSize: 13, color: c.sub, paddingBottom: 10 }}>
                <input type="checkbox" checked={!!s.repeat_yearly} onChange={e => update(i, 'repeat_yearly', e.target.checked)} /> Repeat every year
              </label>
            </div>
            <div style={{ ...type.meta, margin: '6px 0 8px' }}>
              {describeTiming({ ...s, offset_days: Number(s.offset_days) || 0, offset_months: Number(s.offset_months) || 0 })}
            </div>
            <textarea value={s.message_template} onChange={e => update(i, 'message_template', e.target.value)} rows={3} maxLength={1000}
              aria-label="Text message" style={{ ...input, height: 'auto', minHeight: 72, lineHeight: 1.5, resize: 'vertical' }} />
          </div>
        ))}
      </div>

      {error && <div style={{ color: c.red, fontSize: 13, marginTop: 10 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <button onClick={save} disabled={saving || !dirty} style={{ ...btn.primary, opacity: saving || !dirty ? 0.5 : 1 }}>{saving ? 'Saving…' : 'Save schedule'}</button>
        <button onClick={() => { setDirty(true); setSteps(prev => [...prev, { label: 'New step', anchor: 'application_date', offset_days: 14, offset_months: 0, repeat_yearly: false, message_template: 'Hi {first_name}, ', active: true }]) }}
          style={btn.secondary}>+ Add step</button>
        <button onClick={reset} disabled={saving} style={btn.ghost}>Reset to defaults</button>
      </div>
    </div>
  )
}

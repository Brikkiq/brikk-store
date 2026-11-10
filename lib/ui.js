'use client'
// Shared UI pieces for the signed-in app. Styling only from lib/design.js.
import { useEffect, useState } from 'react'
import { api } from './client/api'
import { c, type, card, btn, input, inputLabel, chipFor, fmt } from './design'
import { smsHref, telHref, platformFromUserAgent } from './core/sms'
import { daysBetween, shortDate, longDate } from './core/dates'

export const PageHeader = ({ title, subtitle, actions }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
    <div style={{ minWidth: 0 }}>
      <h1 style={{ ...type.pageTitle, margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ ...type.bodySub, margin: '4px 0 0' }}>{subtitle}</p>}
    </div>
    {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
  </div>
)

export const SectionLabel = ({ children, right }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '0 0 10px' }}>
    <span style={type.eyebrow}>{children}</span>
    {right}
  </div>
)

export const Field = ({ label, hint, children }) => (
  <label style={{ display: 'block', minWidth: 0 }}>
    <span style={inputLabel}>{label}</span>
    {children}
    {hint && <span style={{ ...type.meta, display: 'block', marginTop: 4 }}>{hint}</span>}
  </label>
)

export const Loading = ({ label = 'Loading…' }) => (
  <div style={{ padding: 48, textAlign: 'center', color: c.dim, fontSize: 13 }}>{label}</div>
)

export const ErrorBox = ({ message, onRetry }) => (
  <div style={{ ...card, borderColor: c.redBorder, background: c.redSoft, color: c.red, fontSize: 13, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
    <span>{message}</span>
    {onRetry && <button onClick={onRetry} style={btn.secondary}>Try again</button>}
  </div>
)

export const Empty = ({ title, body, action }) => (
  <div style={{ ...card, textAlign: 'center', padding: '28px 20px' }}>
    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{title}</div>
    {body && <div style={{ ...type.bodySub, maxWidth: 420, margin: '0 auto' }}>{body}</div>}
    {action && <div style={{ marginTop: 14 }}>{action}</div>}
  </div>
)

export const HealthInfoWarning = () => (
  <span style={{ ...type.meta, color: c.amber, display: 'block', marginTop: 4 }}>
    Don’t enter health or medical information here. This app never stores it.
  </span>
)

// Small toast helper: const [toast, show] = useToast()
export function useToast() {
  const [toast, setToast] = useState(null)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])
  const node = toast ? (
    <div role="status" style={{
      position: 'fixed', left: '50%', bottom: 96, transform: 'translateX(-50%)', zIndex: 400,
      background: toast.tone === 'error' ? c.red : c.text, color: c.white,
      padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, maxWidth: 'calc(100vw - 32px)',
    }}>{toast.msg}</div>
  ) : null
  return [node, (msg, tone) => setToast({ msg, tone })]
}

export function dueText(dueDate, today) {
  if (!dueDate || !today) return ''
  const d = daysBetween(today, dueDate)
  if (d === 0) return 'Today'
  if (d === 1) return 'Tomorrow'
  if (d === -1) return 'Yesterday'
  if (d < 0) return `${-d} days overdue`
  if (d < 7) return longDate(dueDate).split(',')[0]
  return shortDate(dueDate)
}

const KIND_LABEL = { policy: 'Policy follow-up', annual_review: 'Annual review', birthday: 'Birthday', manual: 'Reminder' }

// One follow-up with the one-tap text flow:
//   Text → marks "opened" and opens the phone's Messages app with the text filled in
//   When the agent comes back → "Did you send it?"  Yes = done, Not yet = back to pending.
// Nothing is ever marked sent automatically.
export function FollowUpCard({ item, today, onChanged, showHousehold = true, compact = false }) {
  const [status, setStatus] = useState(item.status)
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState(item.message || '')
  const [draft, setDraft] = useState(item.message || '')
  const [dueDate, setDueDate] = useState(item.due_date)
  const [busy, setBusy] = useState(false)
  const [platform, setPlatform] = useState('other')
  const [error, setError] = useState(null)

  useEffect(() => { setPlatform(platformFromUserAgent(navigator.userAgent)) }, [])
  useEffect(() => { setStatus(item.status); setMessage(item.message || ''); setDraft(item.message || ''); setDueDate(item.due_date) }, [item])

  const href = smsHref(item.phone, message, platform)
  const tel = telHref(item.phone)
  const overdue = today && daysBetween(today, dueDate) < 0
  const accent = status === 'opened' ? c.indigo : overdue ? c.red : item.kind === 'birthday' ? c.purple : c.amber

  const act = async (action, body) => {
    setBusy(true); setError(null)
    try {
      await api.post(`/follow-ups/${item.id}/${action}`, body)
      if (action === 'reopen') setStatus('pending')
      else if (action === 'opened') setStatus('opened')
      else setStatus(action === 'skip' ? 'skipped' : 'done')
      if (action !== 'opened') onChanged?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const onText = async (e) => {
    if (!href) return
    e.preventDefault()
    // Record "opened" (never "sent"), then hand off to the Messages app.
    try { await api.post(`/follow-ups/${item.id}/opened`) } catch {}
    setStatus('opened')
    window.location.href = href
  }

  const save = async () => {
    setBusy(true); setError(null)
    try {
      await api.patch(`/follow-ups/${item.id}`, { message: draft, due_date: dueDate })
      setMessage(draft)
      setEditing(false)
      if (dueDate !== item.due_date) onChanged?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (status === 'done' || status === 'skipped') {
    return (
      <div style={{ ...card, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, opacity: 0.75 }}>
        <span style={{ fontSize: 13, color: c.sub }}>{status === 'done' ? '✓ Done' : 'Skipped'} — {item.label}{showHousehold ? ` · ${item.household?.display_name}` : ''}</span>
        <button onClick={() => act('reopen')} disabled={busy} style={btn.ghost}>Undo</button>
      </div>
    )
  }

  return (
    <div style={{ ...card, padding: compact ? '12px 16px' : '16px 18px', borderLeft: `3px solid ${accent}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <span style={{ ...type.eyebrow, color: accent }}>{KIND_LABEL[item.kind] || 'Follow-up'} · {dueText(dueDate, today)}</span>
        {status === 'opened' && <span style={chipFor('info')}>Text opened</span>}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>
        {showHousehold && item.household
          ? <a href={`/app/book/${item.household.id}`} style={{ color: c.text, textDecoration: 'none' }}>{item.person || item.household.display_name}</a>
          : (item.person || '')}
        {(showHousehold || item.person) && <span style={{ fontWeight: 400, color: c.sub }}> — </span>}
        <span style={{ fontWeight: 500 }}>{item.label}</span>
      </div>

      {!compact && !editing && message && (
        <div style={{ marginTop: 10, background: c.bgInset, border: `1px solid ${c.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
          {message}
        </div>
      )}

      {editing && (
        <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
          <Field label="Text message">
            <textarea value={draft} onChange={e => setDraft(e.target.value)} maxLength={1000} rows={4}
              style={{ ...input, height: 'auto', minHeight: 96, lineHeight: 1.5, resize: 'vertical' }} />
          </Field>
          <Field label="Due date">
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...input, maxWidth: 220 }} />
          </Field>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={busy} style={btn.primary}>Save</button>
            <button onClick={() => { setEditing(false); setDraft(message); setDueDate(item.due_date) }} style={btn.secondary}>Cancel</button>
          </div>
        </div>
      )}

      {error && <div style={{ ...type.meta, color: c.red, marginTop: 8 }}>{error}</div>}

      {!editing && status === 'opened' && (
        <div style={{ marginTop: 12, padding: '10px 12px', background: c.indigoSoft, border: `1px solid ${c.indigoBorder}`, borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 500, flex: '1 1 140px' }}>Did you send it?</span>
          <button onClick={() => act('done', { via: 'text' })} disabled={busy} style={{ ...btn.primary, minHeight: 44 }}>Yes, sent</button>
          <button onClick={() => act('reopen')} disabled={busy} style={{ ...btn.secondary, minHeight: 44 }}>Not yet</button>
        </div>
      )}

      {!editing && status !== 'opened' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {href ? (
            <a href={href} onClick={onText} style={{ ...btn.primary, textDecoration: 'none', minHeight: 44, padding: '0 22px', fontSize: 14 }}>Text</a>
          ) : (
            <a href={item.household ? `/app/book/${item.household.id}` : '#'} style={{ ...btn.secondary, textDecoration: 'none', minHeight: 44 }}>Add a phone number</a>
          )}
          {!compact && <button onClick={() => setEditing(true)} disabled={busy} style={{ ...btn.secondary, minHeight: 44 }}>Edit</button>}
          {tel && !compact && <a href={tel} style={{ ...btn.secondary, textDecoration: 'none', minHeight: 44 }}>Call</a>}
          {!compact && <button onClick={() => act('done', { via: 'call' })} disabled={busy} style={{ ...btn.ghost, minHeight: 44 }}>Mark done</button>}
          <button onClick={() => act('skip')} disabled={busy} style={{ ...btn.ghost, minHeight: 44 }}>Skip</button>
        </div>
      )}
    </div>
  )
}

export const money = (n, decimals = 0) =>
  n == null || n === '' ? '—' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

export { fmt }

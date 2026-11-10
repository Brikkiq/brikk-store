'use client'
// Book — everyone the agent works with. Just names; tap one to see their info and timeline.
import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/client/api'
import { c, type, card, btn, input, chipFor, fmt } from '@/lib/design'
import { PageHeader, Loading, ErrorBox, Empty } from '@/lib/ui'
import { shortDate } from '@/lib/core/dates'

const FILTERS = [
  { id: '', label: 'Everyone' },
  { id: 'client', label: 'Clients' },
  { id: 'prospect', label: 'Prospects' },
  { id: 'inactive', label: 'Inactive' },
]

export default function BookPage() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [pickPolicy, setPickPolicy] = useState(false)

  const load = async () => {
    setError(null)
    try { setRows(await api.get('/households')) } catch (e) { setError(e.message) }
  }

  useEffect(() => {
    setPickPolicy(new URLSearchParams(window.location.search).get('pick') === 'policy')
    load()
  }, [])

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (rows || []).filter(h =>
      (!status || h.status === status) &&
      (!needle || [h.display_name, h.phone, h.email, ...h.members.map(m => `${m.first_name} ${m.last_name || ''}`)]
        .some(v => String(v || '').toLowerCase().includes(needle))))
  }, [rows, q, status])

  if (error && !rows) return <ErrorBox message={error} onRetry={load} />
  if (!rows) return <Loading label="Loading your Book…" />

  return (
    <div>
      <PageHeader
        title="Book"
        subtitle={`${rows.length} ${rows.length === 1 ? 'household' : 'households'}`}
        actions={<a href="/app/book/new" style={{ ...btn.primary, textDecoration: 'none', minHeight: 44 }}>+ Add client</a>}
      />

      {pickPolicy && (
        <div style={{ ...card, padding: '12px 16px', marginBottom: 14, background: c.indigoSoft, borderColor: c.indigoBorder, fontSize: 14 }}>
          Pick the client to add a policy to — or <a href="/app/book/new" style={{ color: c.indigo, fontWeight: 600 }}>add a new client</a> first.
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search names, phone, email" aria-label="Search your Book"
          style={{ ...input, flex: '1 1 220px', maxWidth: 420 }} />
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setStatus(f.id)}
              style={{ ...(status === f.id ? btn.primary : btn.secondary), minHeight: 40 }}>{f.label}</button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <Empty title="No one in your Book yet" body="Add a client household — policyholder, spouse and kids — then their policy."
          action={<a href="/app/book/new" style={{ ...btn.primary, textDecoration: 'none' }}>Add your first client</a>} />
      ) : visible.length === 0 ? (
        <div style={{ ...type.bodySub, padding: 12 }}>No matches.</div>
      ) : (
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          {visible.map((h, i) => (
            <a key={h.id} href={`/app/book/${h.id}${pickPolicy ? '?add=policy' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', minHeight: 56, boxSizing: 'border-box',
                textDecoration: 'none', color: c.text, borderTop: i ? `1px solid ${c.borderLight}` : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: c.bgInset, border: `1px solid ${c.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                {fmt.initials(h.display_name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.display_name}</div>
                <div style={{ ...type.meta, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {[
                    h.members.length > 1 ? `${h.members.length} people` : null,
                    h.policy_count ? `${h.policy_count} ${h.policy_count === 1 ? 'policy' : 'policies'}` : null,
                    h.next_follow_up ? `Next: ${h.next_follow_up.label} · ${shortDate(h.next_follow_up.due_date)}` : null,
                  ].filter(Boolean).join(' · ') || (h.phone ? fmt.phone(h.phone) : 'No policy yet')}
                </div>
              </div>
              {h.status !== 'client' && <span style={chipFor(h.status === 'prospect' ? 'warm' : 'cold')}>{h.status}</span>}
              <span aria-hidden style={{ color: c.faint, fontSize: 18 }}>›</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

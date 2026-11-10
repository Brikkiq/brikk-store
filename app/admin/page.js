'use client'
// Admin overview. Access is decided on the server (ADMIN_EMAILS env var) by
// /api/admin/overview — nothing about who is an admin ships to the browser.
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { c, type, card, statTile, chipFor } from '@/lib/design'
import { Logo } from '@/lib/Logo'
import { getTrialState } from '@/lib/trial'

export default function AdminDashboard() {
  const [rows, setRows] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ok | forbidden | error

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const res = await fetch('/api/admin/overview', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' })
      if (res.status === 403 || res.status === 401) { setStatus('forbidden'); return }
      if (!res.ok) { setStatus('error'); return }
      setRows((await res.json()).data || [])
      setStatus('ok')
    })()
  }, [])

  const shell = (children) => (
    <div style={{ minHeight: '100vh', background: c.bg, color: c.text, fontFamily: "'Instrument Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Logo size={18} /><span style={type.eyebrow}>Admin</span>
        </div>
        {children}
      </div>
    </div>
  )

  if (status === 'loading') return shell(<div style={type.meta}>Loading admin…</div>)
  if (status === 'forbidden') return shell(<div style={card}>You don’t have admin access.</div>)
  if (status === 'error') return shell(<div style={card}>Could not load admin data. Check that ADMIN_EMAILS and SUPABASE_SERVICE_ROLE_KEY are set.</div>)

  const paying = rows.filter(r => r.subscription_status === 'active' || r.subscription_status === 'trialing').length
  const trialing = rows.filter(r => getTrialState({ profile: r }).state === 'trialing').length
  const totals = rows.reduce((t, r) => ({ h: t.h + r.households, p: t.p + r.policies, d: t.d + r.follow_ups_done }), { h: 0, p: 0, d: 0 })

  return shell(
    <>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {[['Agents', rows.length], ['Subscribed', paying], ['In free trial', trialing], ['Households', totals.h], ['Policies', totals.p], ['Follow-ups done', totals.d]].map(([k, v]) => (
          <div key={k} style={statTile}><span style={type.eyebrow}>{k}</span><span style={type.metric}>{v}</span></div>
        ))}
      </div>
      <div style={{ ...card, padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: c.sub }}>
              {['Agent', 'Email', 'Signed up', 'Plan', 'Households', 'Policies', 'Follow-ups done'].map(h => (
                <th key={h} style={{ padding: '10px 12px', borderBottom: `1px solid ${c.border}`, fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const st = getTrialState({ profile: r }).state
              return (
                <tr key={r.id}>
                  <td style={td}>{r.full_name || '—'}{r.agency_name ? <div style={type.meta}>{r.agency_name}</div> : null}</td>
                  <td style={td}>{r.email || '—'}</td>
                  <td style={td}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                  <td style={td}><span style={chipFor(st === 'subscribed' || st === 'team_member' ? 'success' : st === 'trialing' ? 'info' : st === 'past_due' ? 'warm' : 'cold')}>{st}</span></td>
                  <td style={td}>{r.households}</td>
                  <td style={td}>{r.policies}</td>
                  <td style={td}>{r.follow_ups_done}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

const td = { padding: '10px 12px', borderBottom: `1px solid ${c.borderLight}`, verticalAlign: 'top' }

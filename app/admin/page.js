'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { c, type, card, btn, statTile, chipFor, temperatureChip, fmt } from '@/lib/design'
import { Logo } from '@/lib/Logo'

// Only these emails can access /admin.
const OWNER_EMAILS = ['brikkiq@gmail.com', 'review@brikk.store', 'hmdesrosier@gmail.com']

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  const [users, setUsers] = useState([])
  const [allLeads, setAllLeads] = useState([])
  const [allDeals, setAllDeals] = useState([])
  const [allMessages, setAllMessages] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [leadFilter, setLeadFilter] = useState('all')

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)
    if (!OWNER_EMAILS.includes(user.email)) {
      setAuthorized(false); setLoading(false); return
    }
    setAuthorized(true)
    await loadAllData()
    setLoading(false)
  }

  const loadAllData = async () => {
    const [profilesRes, leadsRes, dealsRes, messagesRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('leads').select('*'),
      supabase.from('deals').select('*'),
      supabase.from('messages').select('*'),
    ])
    setUsers(profilesRes.data || [])
    setAllLeads(leadsRes.data || [])
    setAllDeals(dealsRes.data || [])
    setAllMessages(messagesRes.data || [])
  }

  if (loading) {
    return (
      <Shell>
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Logo size={20} />
          <div style={{ ...type.meta, marginTop: 8 }}>Loading admin…</div>
        </div>
      </Shell>
    )
  }

  if (!authorized) {
    return (
      <Shell>
        <div style={{ textAlign: 'center', padding: 80, maxWidth: 400, margin: '0 auto' }}>
          <Logo size={20} />
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 16, marginBottom: 6 }}>Restricted</div>
          <div style={{ ...type.bodySub, marginBottom: 20 }}>You don't have admin privileges for this workspace.</div>
          <a href="/app" style={{ ...btn.primary, textDecoration: 'none' }}>Back to app</a>
        </div>
      </Shell>
    )
  }

  // Stats
  const totalLeads = allLeads.length
  const totalDeals = allDeals.length
  const totalMessages = allMessages.length
  const totalCommission = allDeals.reduce((s, d) => s + (d.commission || 0), 0)
  const hotLeads = allLeads.filter(l => l.temperature === 'hot').length
  const activeUsers = users.filter(u => allLeads.some(l => l.user_id === u.id)).length
  const last7Days = allLeads.filter(l => (new Date() - new Date(l.created_at)) < 7 * 864e5).length
  const last30Days = allLeads.filter(l => (new Date() - new Date(l.created_at)) < 30 * 864e5).length
  const potentialMRR = activeUsers * 75

  const getUserStats = (userId) => {
    const leads = allLeads.filter(l => l.user_id === userId)
    const deals = allDeals.filter(d => d.user_id === userId)
    const msgs = allMessages.filter(m => m.user_id === userId)
    return {
      leads: leads.length, deals: deals.length, messages: msgs.length,
      commission: deals.reduce((s, d) => s + (d.commission || 0), 0),
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users',    label: `Users (${users.length})` },
    { id: 'leads',    label: `Leads (${totalLeads})` },
    { id: 'deals',    label: `Deals (${totalDeals})` },
    { id: 'activity', label: 'Activity' },
  ]

  const filteredLeads = leadFilter === 'all' ? allLeads : allLeads.filter(l => l.temperature === leadFilter)

  return (
    <Shell>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        padding: '14px 24px',
        borderBottom: `1px solid ${c.border}`,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(10px)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <Logo size={18} />
          <span style={{ ...type.eyebrow, color: c.dim }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ ...type.meta, marginRight: 4 }}>{user?.email}</span>
          <a href="/app" style={{ ...btn.secondary, textDecoration: 'none' }}>Back to app</a>
          <button onClick={loadAllData} style={btn.primary}>Refresh</button>
        </div>
      </header>

      {/* Tabs */}
      <nav style={{
        padding: '10px 24px',
        display: 'flex', gap: 4, overflowX: 'auto',
        borderBottom: `1px solid ${c.border}`,
        background: c.white,
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSelectedUser(null) }}
            style={{
              background: tab === t.id ? c.text : 'transparent',
              color: tab === t.id ? c.white : c.sub,
              border: `1px solid ${tab === t.id ? c.text : c.border}`,
              borderRadius: 6, padding: '6px 14px',
              fontSize: 12, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >{t.label}</button>
        ))}
      </nav>

      <main style={{ padding: '24px', maxWidth: 1240, margin: '0 auto' }}>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 20 }}>
              <Stat label="Total users"        value={users.length} />
              <Stat label="Active users"       value={activeUsers} accent={c.purple} />
              <Stat label="Total leads"        value={totalLeads} />
              <Stat label="Hot leads"          value={hotLeads} accent={c.red} />
              <Stat label="Total deals"        value={totalDeals} accent={c.green} />
              <Stat label="Commission tracked" value={fmt.moneyK(totalCommission)} accent={c.green} />
              <Stat label="Messages sent"      value={totalMessages} />
              <Stat label="Potential MRR"      value={fmt.money(potentialMRR)} accent={c.indigo} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 16 }}>
              <BigStat title="Leads this week" value={last7Days} sub="New in last 7 days" accent={c.green} />
              <BigStat title="Leads this month" value={last30Days} sub="New in last 30 days" />
            </div>

            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ ...type.eyebrow, marginBottom: 14 }}>Lead sources (all users)</div>
              <SourceBars leads={allLeads} />
            </div>

            <div style={card}>
              <div style={{ ...type.eyebrow, marginBottom: 14 }}>Lead temperature (all users)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: 'Hot',  count: allLeads.filter(l => l.temperature === 'hot').length,  color: c.red,   bg: c.redSoft },
                  { label: 'Warm', count: allLeads.filter(l => l.temperature === 'warm').length, color: c.amber, bg: c.amberSoft },
                  { label: 'Cold', count: allLeads.filter(l => l.temperature === 'cold').length, color: c.dim,   bg: c.bgInset },
                ].map(t => (
                  <div key={t.label} style={{ background: t.bg, border: `1px solid ${c.border}`, borderRadius: 6, padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ ...type.metric, color: t.color }}>{t.count}</div>
                    <div style={{ ...type.eyebrow, color: t.color, marginTop: 4 }}>{t.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* USERS */}
        {tab === 'users' && (
          <>
            {selectedUser ? (
              <UserDetail
                userId={selectedUser}
                users={users}
                allLeads={allLeads}
                allDeals={allDeals}
                getUserStats={getUserStats}
                onBack={() => setSelectedUser(null)}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {users.length === 0 && (
                  <div style={{ ...card, padding: '32px 20px', textAlign: 'center' }}>
                    <div style={{ ...type.bodySub }}>No users yet.</div>
                  </div>
                )}
                {users.map(u => {
                  const stats = getUserStats(u.id)
                  return (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUser(u.id)}
                      style={{
                        ...card, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        gap: 16, flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{u.full_name || 'No name'}</div>
                        <div style={{ ...type.meta }}>{u.email}</div>
                        <div style={{ ...type.meta, marginTop: 2 }}>
                          {u.brokerage || 'No brokerage'} · joined {fmt.relativeDate(u.created_at)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <Mini value={stats.leads} label="Leads" />
                        <Mini value={stats.deals} label="Deals" />
                        <Mini value={fmt.moneyK(stats.commission)} label="Comm" color={c.green} />
                        <span style={{ color: c.dim, fontSize: 16 }}>›</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* LEADS */}
        {tab === 'leads' && (
          <>
            <div style={{ display: 'flex', gap: 2, background: c.white, border: `1px solid ${c.border}`, borderRadius: 6, padding: 2, marginBottom: 14, width: 'fit-content' }}>
              {['all', 'hot', 'warm', 'cold'].map(f => (
                <button
                  key={f}
                  onClick={() => setLeadFilter(f)}
                  style={{
                    background: leadFilter === f ? c.text : 'transparent',
                    color: leadFilter === f ? c.white : c.sub,
                    border: 'none', borderRadius: 4,
                    padding: '6px 12px',
                    fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'inherit',
                    textTransform: 'capitalize',
                  }}
                >{f} <span style={{ opacity: 0.6, marginLeft: 4 }}>
                  {f === 'all' ? allLeads.length : allLeads.filter(l => l.temperature === f).length}
                </span></button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredLeads.slice(0, 100).map(l => {
                const owner = users.find(u => u.id === l.user_id)
                return (
                  <div key={l.id} style={{ ...card, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{l.name}</div>
                      <div style={{ ...type.meta }}>{[l.phone, l.source, l.stage].filter(Boolean).join(' · ')}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ ...chipFor('neutral') }}>{owner?.full_name || 'Unknown'}</span>
                      <span style={temperatureChip(l.temperature)}>{(l.temperature || '').toUpperCase()}</span>
                      <span style={{ ...type.meta }}>{fmt.relativeDate(l.created_at)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* DEALS */}
        {tab === 'deals' && (
          <>
            {allDeals.length === 0 ? (
              <div style={{ ...card, padding: '32px 20px', textAlign: 'center' }}>
                <div style={{ ...type.bodySub }}>No deals yet.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {allDeals.map(d => {
                  const owner = users.find(u => u.id === d.user_id)
                  return (
                    <div key={d.id} style={{ ...card, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{d.address || 'No address'}</div>
                        <div style={{ ...type.meta }}>{[d.stage, d.close_date ? `closes ${d.close_date}` : null, `agent ${owner?.full_name || 'Unknown'}`].filter(Boolean).join(' · ')}</div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: c.green }}>{fmt.money(d.commission || 0)}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ACTIVITY */}
        {tab === 'activity' && (
          <>
            <div style={{ ...card, marginBottom: 14 }}>
              <div style={{ ...type.eyebrow, marginBottom: 12 }}>Recent signups</div>
              {users.slice(0, 10).map(u => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${c.borderLight}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{u.full_name || 'No name'}</div>
                    <div style={{ ...type.meta }}>{u.email}</div>
                  </div>
                  <div style={{ ...type.meta }}>{fmt.relativeDate(u.created_at)}</div>
                </div>
              ))}
            </div>

            <div style={card}>
              <div style={{ ...type.eyebrow, marginBottom: 12 }}>Recent leads added</div>
              {[...allLeads]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 15)
                .map(l => {
                  const owner = users.find(u => u.id === l.user_id)
                  return (
                    <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${c.borderLight}` }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{l.name}</div>
                        <div style={{ ...type.meta }}>by {owner?.full_name || 'Unknown'} · {l.source || '—'}</div>
                      </div>
                      <div style={{ ...type.meta }}>{fmt.relativeDate(l.created_at)}</div>
                    </div>
                  )
                })}
            </div>
          </>
        )}
      </main>
    </Shell>
  )
}

const Shell = ({ children }) => (
  <div style={{ minHeight: '100vh', background: c.bg, fontFamily: "'Instrument Sans',-apple-system,BlinkMacSystemFont,sans-serif", color: c.text, WebkitFontSmoothing: 'antialiased' }}>
    {children}
  </div>
)

const Stat = ({ label, value, accent }) => (
  <div style={statTile}>
    <span style={type.eyebrow}>{label}</span>
    <span style={{ ...type.metric, color: accent || c.text, fontSize: 20 }}>{value}</span>
  </div>
)

const BigStat = ({ title, value, sub, accent }) => (
  <div style={card}>
    <div style={{ ...type.eyebrow, marginBottom: 8 }}>{title}</div>
    <div style={{ ...type.metric, fontSize: 28, color: accent || c.text }}>{value}</div>
    <div style={{ ...type.meta, marginTop: 4 }}>{sub}</div>
  </div>
)

const Mini = ({ value, label, color }) => (
  <div style={{ textAlign: 'center', minWidth: 50 }}>
    <div style={{ fontSize: 14, fontWeight: 600, color: color || c.text }}>{value}</div>
    <div style={{ ...type.eyebrow, marginTop: 2 }}>{label}</div>
  </div>
)

const SourceBars = ({ leads }) => {
  const sources = {}
  leads.forEach(l => { const s = l.source || 'Unknown'; sources[s] = (sources[s] || 0) + 1 })
  const sorted = Object.entries(sources).sort((a, b) => b[1] - a[1])
  if (sorted.length === 0) return <div style={{ ...type.bodySub }}>No leads yet.</div>
  const max = sorted[0][1]
  return sorted.map(([source, count]) => (
    <div key={source} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
      <div style={{ width: 110, fontSize: 12.5, color: c.sub, flexShrink: 0 }}>{source}</div>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: c.bgInset, overflow: 'hidden' }}>
        <div style={{ width: `${(count / max) * 100}%`, height: '100%', background: c.text, borderRadius: 3 }} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, width: 32, textAlign: 'right' }}>{count}</div>
    </div>
  ))
}

const UserDetail = ({ userId, users, allLeads, allDeals, getUserStats, onBack }) => {
  const u = users.find(x => x.id === userId)
  const stats = getUserStats(userId)
  const userLeads = allLeads.filter(l => l.user_id === userId)
  const userDeals = allDeals.filter(d => d.user_id === userId)

  return (
    <div>
      <button onClick={onBack} style={{ ...btn.secondary, marginBottom: 16 }}>← Back to users</button>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 2 }}>{u?.full_name || 'No name'}</div>
        <div style={{ ...type.bodySub }}>{u?.email}</div>
        <div style={{ ...type.meta, marginTop: 4 }}>
          Phone: {u?.phone || '—'} · Brokerage: {u?.brokerage || '—'} · Joined {fmt.relativeDate(u?.created_at)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 16 }}>
          <Mini value={stats.leads} label="Leads" />
          <Mini value={stats.deals} label="Deals" />
          <Mini value={stats.messages} label="Messages" />
          <Mini value={fmt.moneyK(stats.commission)} label="Commission" color={c.green} />
        </div>
      </div>

      <div style={{ ...type.eyebrow, marginBottom: 10 }}>Leads ({userLeads.length})</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
        {userLeads.slice(0, 30).map(l => (
          <div key={l.id} style={{ ...card, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{l.name}</div>
              <div style={{ ...type.meta }}>{[l.phone, l.source, l.stage].filter(Boolean).join(' · ')}</div>
            </div>
            <span style={temperatureChip(l.temperature)}>{(l.temperature || '').toUpperCase()}</span>
          </div>
        ))}
      </div>

      {userDeals.length > 0 && (
        <>
          <div style={{ ...type.eyebrow, marginBottom: 10 }}>Deals ({userDeals.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {userDeals.map(d => (
              <div key={d.id} style={{ ...card, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{d.address || 'No address'}</div>
                  <div style={{ ...type.meta }}>{d.stage} · close {d.close_date || '—'}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: c.green }}>{fmt.money(d.commission || 0)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

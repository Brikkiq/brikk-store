'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { c, type, card, statTile, fmt } from '@/lib/design'

const sourceColors = {
  Zillow: '#3730A3',
  Referral: '#16803C',
  'Open House': '#A16207',
  'Social Media': '#BE123C',
  Website: '#5B21B6',
  'Cold Call': '#475569',
  Other: '#9C9C96',
}

export default function MarketingPage() {
  const [leads, setLeads] = useState([])
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const [leadsRes, dealsRes] = await Promise.all([
      supabase.from('leads').select('*').eq('user_id', user.id),
      supabase.from('deals').select('*').eq('user_id', user.id),
    ])
    setLeads(leadsRes.data || [])
    setDeals(dealsRes.data || [])
    setLoading(false)
  }

  // --- Source metrics ---
  const sourceMap = {}
  leads.forEach(l => {
    const src = l.source || 'Other'
    if (!sourceMap[src]) sourceMap[src] = { name: src, leads: 0, hot: 0, warm: 0, cold: 0, closedWon: 0, closedLost: 0 }
    sourceMap[src].leads++
    if (l.temperature === 'hot') sourceMap[src].hot++
    if (l.temperature === 'warm') sourceMap[src].warm++
    if (l.temperature === 'cold') sourceMap[src].cold++
    if (l.stage === 'Closed Won') sourceMap[src].closedWon++
    if (l.stage === 'Closed Lost') sourceMap[src].closedLost++
  })
  const sourceData = Object.values(sourceMap).sort((a, b) => b.leads - a.leads)
  const totalLeads = leads.length
  const pieData = sourceData.map(s => ({ name: s.name, value: s.leads, fill: sourceColors[s.name] || c.dim }))

  const withConv = sourceData.map(s => ({
    ...s,
    convRate: s.leads > 0 ? (s.closedWon / s.leads) * 100 : 0,
    hotRate: s.leads > 0 ? (s.hot / s.leads) * 100 : 0,
  }))
  const bestSource = withConv.length ? withConv.reduce((b, s) => s.hotRate > b.hotRate ? s : b, withConv[0]) : null
  const worstSource = withConv.length > 1
    ? withConv.reduce((w, s) => s.hotRate < w.hotRate && s.leads > 0 ? s : w, withConv[0])
    : null

  const hotCount = leads.filter(l => l.temperature === 'hot').length
  const stageOrder = ['New Lead', 'Contacted', 'Showing Scheduled', 'Offer Submitted', 'Under Contract', 'Closed Won', 'Closed Lost']
  const stageCounts = stageOrder.map(s => ({ stage: s, count: leads.filter(l => l.stage === s).length }))
  const totalCommission = deals.reduce((s, d) => s + (d.commission || 0), 0)

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: c.dim, fontSize: 13 }}>Loading marketing data…</div>

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ ...type.pageTitle, margin: 0 }}>Marketing</h1>
        <p style={{ ...type.bodySub, margin: '4px 0 0' }}>See which sources actually produce closings — not just leads.</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <KPI label="Total leads" value={totalLeads} note={`${sourceData.length} source${sourceData.length === 1 ? '' : 's'}`} />
        <KPI label="Hot leads" value={hotCount} accent={c.red} note={totalLeads > 0 ? `${((hotCount / totalLeads) * 100).toFixed(0)}% of total` : '—'} />
        <KPI label="Best source" value={bestSource ? bestSource.name : '—'} accent={c.green} note={bestSource ? `${bestSource.hotRate.toFixed(0)}% hot rate` : 'Need more data'} />
        <KPI label="Pending commission" value={fmt.moneyK(totalCommission)} accent={c.green} note={`${deals.length} active deal${deals.length === 1 ? '' : 's'}`} />
      </div>

      {/* Distribution + breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12, marginBottom: 20 }}>
        {/* Pie + legend */}
        <div style={card}>
          <div style={{ ...type.eyebrow, marginBottom: 14 }}>Lead distribution by source</div>
          {totalLeads === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: c.dim, fontSize: 13 }}>Add leads to see distribution.</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ width: 130, height: 130, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={36} outerRadius={62} dataKey="value" stroke="none" paddingAngle={2}>
                      {pieData.map((s, i) => <Cell key={i} fill={s.fill} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 180 }}>
                {sourceData.map(s => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: sourceColors[s.name] || c.dim }} />
                    <span style={{ fontSize: 12.5, color: c.sub, flex: 1 }}>{s.name}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: c.text }}>{s.leads}</span>
                    <span style={{ fontSize: 11.5, color: c.dim, width: 36, textAlign: 'right' }}>
                      {totalLeads > 0 ? `${((s.leads / totalLeads) * 100).toFixed(0)}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Performance table */}
        <div style={card}>
          <div style={{ ...type.eyebrow, marginBottom: 14 }}>Source performance</div>
          {sourceData.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: c.dim, fontSize: 13 }}>No data yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr>
                  {['Source', 'Leads', 'Hot', 'Warm', 'Hot %'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left',
                      padding: '8px 0',
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: c.dim,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      borderBottom: `1px solid ${c.border}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sourceData.map(s => {
                  const hotPct = s.leads > 0 ? (s.hot / s.leads) * 100 : 0
                  const pctColor = hotPct >= 30 ? c.green : hotPct >= 15 ? c.amber : c.red
                  return (
                    <tr key={s.name} style={{ borderBottom: `1px solid ${c.borderLight}` }}>
                      <td style={{ padding: '10px 0' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: 2, background: sourceColors[s.name] || c.dim }} />
                          {s.name}
                        </span>
                      </td>
                      <td style={{ padding: '10px 0', color: c.sub }}>{s.leads}</td>
                      <td style={{ padding: '10px 0', color: c.red, fontWeight: 500 }}>{s.hot}</td>
                      <td style={{ padding: '10px 0', color: c.amber }}>{s.warm}</td>
                      <td style={{ padding: '10px 0', color: pctColor, fontWeight: 600 }}>{hotPct.toFixed(0)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Funnel */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ ...type.eyebrow, marginBottom: 14 }}>Pipeline funnel</div>
        {totalLeads === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: c.dim, fontSize: 13 }}>Add leads to see your funnel.</div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {stageCounts.filter(s => s.count > 0).map(s => {
              const pct = totalLeads > 0 ? (s.count / totalLeads) * 100 : 0
              const isWon = s.stage === 'Closed Won'
              const isLost = s.stage === 'Closed Lost'
              return (
                <div key={s.stage} style={{
                  flex: '1 1 110px', minWidth: 110,
                  background: isWon ? c.greenSoft : isLost ? c.redSoft : c.bgInset,
                  border: `1px solid ${isWon ? c.greenBorder : isLost ? c.redBorder : c.border}`,
                  borderRadius: 6, padding: '14px 12px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: isWon ? c.green : isLost ? c.red : c.text }}>
                    {s.count}
                  </div>
                  <div style={{ ...type.meta, marginTop: 4 }}>{s.stage}</div>
                  <div style={{ ...type.meta, marginTop: 2 }}>{pct.toFixed(0)}%</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Insight */}
      {totalLeads > 0 && (
        <div style={{
          background: c.purpleSoft, border: `1px solid ${c.purpleBorder}`,
          borderRadius: 8, padding: '14px 18px',
        }}>
          <div style={{ ...type.eyebrow, color: c.purple, marginBottom: 6 }}>AI insight</div>
          <div style={{ fontSize: 13, color: c.sub, lineHeight: 1.65 }}>
            {bestSource && worstSource && bestSource.name !== worstSource.name
              ? `${bestSource.name} is your strongest source — ${bestSource.hotRate.toFixed(0)}% hot-lead rate from ${bestSource.leads} total. ${worstSource.name} sits at ${worstSource.hotRate.toFixed(0)}%. Consider shifting effort toward ${bestSource.name}-style acquisition.`
              : totalLeads < 5
                ? 'Add more leads across different sources to see meaningful patterns. Brikk needs 10–15 leads spread across sources to generate actionable insights.'
                : `${totalLeads} leads across ${sourceData.length} source${sourceData.length === 1 ? '' : 's'}, ${hotCount} hot (${((hotCount / totalLeads) * 100).toFixed(0)}%). Keep logging sources on every new lead to sharpen the picture.`}
          </div>
        </div>
      )}
    </div>
  )
}

const KPI = ({ label, value, accent, note }) => (
  <div style={statTile}>
    <span style={type.eyebrow}>{label}</span>
    <span style={{ ...type.metric, color: accent || c.text }}>{value}</span>
    {note && <span style={{ ...type.meta }}>{note}</span>}
  </div>
)

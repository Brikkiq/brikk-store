'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { c, type, card, statTile, btn, input, fmt } from '@/lib/design'

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
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const [leadsRes, dealsRes, profileRes] = await Promise.all([
      supabase.from('leads').select('*').eq('user_id', user.id),
      supabase.from('deals').select('*').eq('user_id', user.id),
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    ])
    setLeads(leadsRes.data || [])
    setDeals(dealsRes.data || [])
    setProfile(profileRes.data || null)
    setLoading(false)
  }

  const saveGoal = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const goalNum = parseFloat(goalInput)
    if (!goalNum || goalNum < 0) return
    await supabase.from('profiles').update({
      annual_commission_goal: goalNum,
      goal_year: new Date().getFullYear(),
    }).eq('id', user.id)
    setEditingGoal(false)
    loadData()
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

      {/* Commission goal pacing — only shown when goal is set */}
      <CommissionGoalCard
        profile={profile}
        leads={leads}
        deals={deals}
        editing={editingGoal}
        setEditing={setEditingGoal}
        goalInput={goalInput}
        setGoalInput={setGoalInput}
        onSave={saveGoal}
      />

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

// Commission goal pacing card — shows progress toward annual target and tells
// the agent how many leads they need to work to hit it at their current
// conversion rate. Sits at the top of the Marketing page.
const CommissionGoalCard = ({ profile, leads, deals, editing, setEditing, goalInput, setGoalInput, onSave }) => {
  const goal = Number(profile?.annual_commission_goal) || 0

  if (!goal && !editing) {
    return (
      <div style={{
        background: c.white, border: `1px dashed ${c.border}`,
        borderRadius: 8, padding: '16px 20px',
        marginBottom: 18,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Set an annual commission goal</div>
          <div style={{ ...type.meta, marginTop: 2 }}>Track pacing against your target so you know if you need to work more leads.</div>
        </div>
        <button onClick={() => { setGoalInput(''); setEditing(true) }} style={{ fontSize: 13, fontWeight: 600, color: c.text, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
          Set goal
        </button>
      </div>
    )
  }

  if (editing) {
    return (
      <div style={{ ...card, marginBottom: 18 }}>
        <div style={{ ...type.eyebrow, marginBottom: 8 }}>Annual commission goal ({new Date().getFullYear()})</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="number"
            value={goalInput}
            onChange={e => setGoalInput(e.target.value)}
            placeholder="100000"
            style={{ ...input, maxWidth: 200 }}
            autoFocus
          />
          <button onClick={onSave} style={btn.primary}>Save</button>
          <button onClick={() => setEditing(false)} style={btn.ghost}>Cancel</button>
        </div>
      </div>
    )
  }

  // Goal is set — calculate pacing
  const yearStart = new Date(new Date().getFullYear(), 0, 1)
  const yearEnd = new Date(new Date().getFullYear(), 11, 31)
  const totalDaysInYear = Math.round((yearEnd - yearStart) / 86400000)
  const daysPassed = Math.max(1, Math.round((new Date() - yearStart) / 86400000))
  const yearFraction = daysPassed / totalDaysInYear
  const expectedToHere = goal * yearFraction
  const earned = deals
    .filter(d => d.stage === 'Closed' && d.commission > 0 && new Date(d.close_date || d.updated_at).getFullYear() === new Date().getFullYear())
    .reduce((sum, d) => sum + Number(d.commission), 0)
  const pendingCommission = deals
    .filter(d => d.stage !== 'Closed' && d.commission > 0)
    .reduce((sum, d) => sum + Number(d.commission), 0)
  const remaining = Math.max(0, goal - earned - pendingCommission)
  const pacingPct = goal > 0 ? Math.min(100, (earned / goal) * 100) : 0
  const conversionRate = Number(profile?.conversion_rate_estimate) || 0.15
  const avgCommission = deals.filter(d => d.commission > 0).length > 0
    ? deals.reduce((s, d) => s + (d.commission || 0), 0) / deals.filter(d => d.commission > 0).length
    : 8000
  const leadsNeeded = Math.ceil(remaining / (avgCommission * conversionRate))

  const onPace = earned >= expectedToHere
  const accentColor = onPace ? c.green : c.amber

  return (
    <div style={{ ...card, marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ ...type.eyebrow, marginBottom: 4 }}>Annual commission pacing</div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em' }}>
            {fmt.money(earned)} <span style={{ fontSize: 14, color: c.dim, fontWeight: 400 }}>of {fmt.money(goal)}</span>
          </div>
          <div style={{ fontSize: 12.5, color: accentColor, fontWeight: 500, marginTop: 4 }}>
            {onPace
              ? `On pace — you should be at ${fmt.money(Math.round(expectedToHere))} by now`
              : `Behind pace — should be at ${fmt.money(Math.round(expectedToHere))} by now (${fmt.money(Math.round(expectedToHere - earned))} short)`}
          </div>
        </div>
        <button onClick={() => { setGoalInput(goal.toString()); setEditing(true) }} style={{ ...btn.ghost, fontSize: 12 }}>Edit goal</button>
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <div style={{ background: c.borderLight, borderRadius: 4, height: 8, overflow: 'hidden', position: 'relative' }}>
          <div style={{
            width: `${pacingPct}%`, height: '100%',
            background: accentColor, borderRadius: 4,
            transition: 'width 0.4s ease',
          }} />
          {/* Expected-pace marker */}
          <div style={{
            position: 'absolute', top: -3, bottom: -3,
            left: `${Math.min(100, yearFraction * 100)}%`,
            width: 2, background: c.dim,
            borderRadius: 1,
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, ...type.meta }}>
          <span>$0</span>
          <span>Today: {(yearFraction * 100).toFixed(0)}%</span>
          <span>{fmt.money(goal)}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, fontSize: 12.5, color: c.sub }}>
        <div>
          <div style={{ fontWeight: 600, color: c.text, fontSize: 13 }}>{fmt.money(pendingCommission)}</div>
          <div style={{ color: c.dim }}>In pending deals</div>
        </div>
        <div>
          <div style={{ fontWeight: 600, color: c.text, fontSize: 13 }}>{fmt.money(remaining)}</div>
          <div style={{ color: c.dim }}>Still needed</div>
        </div>
        <div>
          <div style={{ fontWeight: 600, color: c.text, fontSize: 13 }}>~{leadsNeeded} leads</div>
          <div style={{ color: c.dim }}>To close at {(conversionRate * 100).toFixed(0)}% rate</div>
        </div>
        <div>
          <div style={{ fontWeight: 600, color: c.text, fontSize: 13 }}>{fmt.money(Math.round(avgCommission))}</div>
          <div style={{ color: c.dim }}>Avg commission</div>
        </div>
      </div>
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

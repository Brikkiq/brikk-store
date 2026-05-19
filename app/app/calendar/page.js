'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { c, type, card, statTile, chipFor, fmt } from '@/lib/design'

export default function CalendarPage() {
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

  const events = buildEvents(leads, deals)
  const todayEvents = events.filter(e => e.bucket === 'today')
  const upcomingEvents = events.filter(e => e.bucket !== 'today')

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: c.dim, fontSize: 13 }}>Loading calendar…</div>

  const overdueHot = leads.filter(l =>
    (l.temperature === 'hot' && fmt.daysSince(l.last_contact_date) >= 3) ||
    (l.temperature === 'warm' && fmt.daysSince(l.last_contact_date) >= 7),
  ).length
  const closingsThisWeek = deals.filter(d => {
    const u = fmt.daysUntil(d.close_date)
    return u !== null && u >= 0 && u <= 7
  }).length

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ ...type.pageTitle, margin: 0 }}>Calendar</h1>
        <p style={{ ...type.bodySub, margin: '4px 0 0' }}>Auto-generated from your pipeline — follow-ups, milestones, and closings.</p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <KPI label="Today" value={todayEvents.length} accent={todayEvents.length > 0 ? c.amber : c.green} />
        <KPI label="Closings within 7 days" value={closingsThisWeek} accent={c.indigo} />
        <KPI label="Overdue follow-ups" value={overdueHot} accent={overdueHot > 0 ? c.red : c.green} />
        <KPI label="Total events" value={events.length} />
      </div>

      {events.length === 0 ? (
        <div style={{ ...card, padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Calendar is clear</div>
          <div style={{ ...type.bodySub }}>Add leads and deals to see auto-populated follow-ups, deadlines, and milestones.</div>
        </div>
      ) : (
        <>
          {todayEvents.length > 0 && <EventSection title="Today" events={todayEvents} />}
          {upcomingEvents.length > 0 && <EventSection title="Upcoming" events={upcomingEvents} />}
        </>
      )}
    </div>
  )
}

const KPI = ({ label, value, accent }) => (
  <div style={statTile}>
    <span style={type.eyebrow}>{label}</span>
    <span style={{ ...type.metric, color: accent || c.text }}>{value}</span>
  </div>
)

const EventSection = ({ title, events }) => (
  <section style={{ marginBottom: 28 }}>
    <div style={{ ...type.eyebrow, marginBottom: 12 }}>{title}</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {events.map((e, i) => <EventRow key={i} event={e} />)}
    </div>
  </section>
)

const EventRow = ({ event }) => {
  const accent = event.tone === 'urgent' ? c.red : event.tone === 'warn' ? c.amber : event.tone === 'success' ? c.green : c.indigo
  return (
    <div style={{
      ...card,
      padding: '14px 16px',
      borderLeft: `3px solid ${accent}`,
      display: 'flex', gap: 14, alignItems: 'flex-start',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
          <span style={{ ...type.eyebrow, color: accent }}>{event.category}</span>
          <span style={{ ...type.eyebrow, color: c.dim }}>· {event.dateLabel}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{event.label}</div>
        {event.detail && <div style={{ ...type.bodySub, marginTop: 2 }}>{event.detail}</div>}
        {event.ai && (
          <div style={{
            marginTop: 10,
            background: c.purpleSoft,
            borderLeft: `2px solid ${c.purple}`,
            padding: '8px 12px',
            borderRadius: 4,
          }}>
            <div style={{ ...type.eyebrow, color: c.purple, marginBottom: 3 }}>AI context</div>
            <div style={{ fontSize: 12.5, color: c.sub, lineHeight: 1.55 }}>{event.ai}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function buildEvents(leads, deals) {
  const today = new Date()
  const events = []

  leads.forEach(l => {
    const days = fmt.daysSince(l.last_contact_date) ?? 999
    const needs =
      (l.temperature === 'hot' && days >= 1) ||
      (l.temperature === 'warm' && days >= 3) ||
      (l.temperature === 'cold' && days >= 7)
    if (!needs) return

    let ai = ''
    if (l.temperature === 'hot' && days >= 3) ai = `${days} days without contact on a hot lead. Every day reduces conversion probability — call now.`
    else if (l.temperature === 'hot') ai = `Hot lead, ${days} day${days === 1 ? '' : 's'} silent. A quick check-in maintains momentum.`
    else if (l.temperature === 'warm' && days >= 7) ai = `Going cold — ${days} days. Try a value-add touchpoint like a market update.`
    else if (l.temperature === 'warm') ai = `${days} days since contact. A short check-in keeps you top of mind.`
    else ai = `${days} days since contact. Consider a re-engagement message or move to a nurture sequence.`
    if (l.notes) ai += ` Notes: ${l.notes}`

    events.push({
      bucket: 'today',
      dateLabel: 'today',
      category: 'Follow up',
      label: l.name,
      detail: [l.lead_type, l.source, l.stage, l.price_range].filter(Boolean).join(' · '),
      tone: l.temperature === 'hot' ? 'urgent' : l.temperature === 'warm' ? 'warn' : 'info',
      ai,
    })
  })

  deals.forEach(d => {
    if (!d.close_date) return
    const left = fmt.daysUntil(d.close_date)
    if (left === null || left < -7) return

    let ai
    if (left <= 0) ai = 'Closing date has arrived or passed. Confirm all documents are signed and funds are ready.'
    else if (left <= 3) ai = `Only ${left} days to close. Confirm lender clear-to-close, title work complete, and walkthrough scheduled.`
    else if (left <= 7) ai = `${left} days. Check lender status, clear contingencies, schedule walkthrough.`
    else if (left <= 14) ai = `${left} days. Verify appraisal is complete and lender is on track.`
    else ai = `${left} days. On track — monitor for delays.`
    if (d.notes) ai += ` Notes: ${d.notes}`

    events.push({
      bucket: left === 0 ? 'today' : 'upcoming',
      dateLabel: left === 0 ? 'today' : left === 1 ? 'tomorrow' : left < 0 ? `${Math.abs(left)} days overdue` : `in ${left} days`,
      category: 'Closing',
      label: d.address,
      detail: [d.client_name, d.price ? fmt.money(d.price) : null, d.commission ? `commission ${fmt.money(d.commission)}` : null].filter(Boolean).join(' · '),
      tone: left <= 3 ? 'urgent' : left <= 7 ? 'warn' : 'success',
      ai,
    })
  })

  // Sort: today first, then by tone urgency
  const order = { urgent: 0, warn: 1, info: 2, success: 3 }
  return events.sort((a, b) => {
    if (a.bucket === 'today' && b.bucket !== 'today') return -1
    if (b.bucket === 'today' && a.bucket !== 'today') return 1
    return (order[a.tone] || 2) - (order[b.tone] || 2)
  })
}

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { c, type, card, statTile, btn, chipFor, fmt } from '@/lib/design'
import { findUpcomingBirthdays, birthdayLabel, birthdayMessageDraft } from '@/lib/birthdays'

export default function AppOverview() {
  const [leads, setLeads] = useState([])
  const [deals, setDeals] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dismissedActions, setDismissedActions] = useState([])

  useEffect(() => {
    loadData()
    // Refresh when voice modal applies actions globally
    const handler = () => loadData()
    if (typeof window !== 'undefined') window.addEventListener('brikk:voice-saved', handler)
    return () => { if (typeof window !== 'undefined') window.removeEventListener('brikk:voice-saved', handler) }
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    try {
      const [leadsRes, dealsRes, profileRes] = await Promise.all([
        supabase.from('leads').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('deals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ])
      setLeads(leadsRes.data || [])
      setDeals(dealsRes.data || [])
      setProfile(profileRes.data)
    } catch (err) {
      console.error('Dashboard load failed:', err?.message)
    }
    setLoading(false)
  }

  const handleLogContact = async (leadId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('leads').update({
      last_contact_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', leadId)
    await supabase.from('interactions').insert({
      user_id: user.id, lead_id: leadId,
      interaction_type: 'contact', notes: 'Quick action: logged contact',
    })
    setDismissedActions(prev => [...prev, `lead-${leadId}`])
    loadData()
  }

  // --- Build action list ---
  const actions = []

  leads.forEach(l => {
    const days = fmt.daysSince(l.last_contact_date) ?? 999
    if (l.temperature === 'hot' && days >= 1) {
      actions.push({
        id: `lead-${l.id}`,
        priority: days >= 3 ? 'critical' : 'high',
        category: 'Follow up',
        title: `Reach out to ${l.name}`,
        subtitle: `Hot ${l.lead_type || 'lead'} · ${days}d since contact`,
        meta: [l.stage, l.price_range].filter(Boolean).join(' · '),
        tone: days >= 3 ? 'urgent' : 'warn',
        primaryLabel: 'Log contact',
        primaryFn: () => handleLogContact(l.id),
        secondaryHref: '/app/messages',
        secondaryLabel: 'Open conversation',
      })
    } else if (l.temperature === 'warm' && days >= 3) {
      actions.push({
        id: `lead-${l.id}`,
        priority: days >= 7 ? 'high' : 'medium',
        category: 'Follow up',
        title: `Check in with ${l.name}`,
        subtitle: `Warm lead · ${days}d since contact${days >= 7 ? ' — going cold' : ''}`,
        meta: [l.stage, l.price_range].filter(Boolean).join(' · '),
        tone: days >= 7 ? 'urgent' : 'warn',
        primaryLabel: 'Log contact',
        primaryFn: () => handleLogContact(l.id),
        secondaryHref: '/app/messages',
        secondaryLabel: 'Open conversation',
      })
    }
  })

  deals.forEach(d => {
    if (!d.close_date) return
    const left = fmt.daysUntil(d.close_date)
    if (left === null || left > 14 || left < -3) return
    actions.push({
      id: `deal-${d.id}`,
      priority: left <= 3 ? 'critical' : left <= 7 ? 'high' : 'medium',
      category: 'Closing',
      title: d.address,
      subtitle:
        left <= 0 ? 'Closes today or overdue — confirm signatures and funds'
        : left <= 3 ? `Closes in ${left} day${left === 1 ? '' : 's'} — confirm clear-to-close`
        : left <= 7 ? `${left} days to close — verify lender and title`
        : `${left} days to close — on track`,
      meta: [d.client_name, d.price ? fmt.money(d.price) : null, d.commission ? `Commission ${fmt.money(d.commission)}` : null]
        .filter(Boolean).join(' · '),
      tone: left <= 3 ? 'urgent' : left <= 7 ? 'warn' : 'info',
      secondaryHref: '/app/deals',
      secondaryLabel: 'Open deal',
    })
  })

  const leadsNeedingFollowUp = leads.filter(l => {
    const d = fmt.daysSince(l.last_contact_date) ?? 999
    return (l.temperature === 'hot' && d >= 1) || (l.temperature === 'warm' && d >= 3) || (l.temperature === 'cold' && d >= 7)
  }).length

  if (leadsNeedingFollowUp > 0) {
    actions.push({
      id: 'copilot',
      priority: 'medium',
      category: 'Copilot',
      title: `${leadsNeedingFollowUp} draft${leadsNeedingFollowUp === 1 ? '' : 's'} ready to review`,
      subtitle: 'AI-written follow-ups awaiting your approval',
      tone: 'info',
      secondaryHref: '/app/copilot',
      secondaryLabel: 'Open Copilot',
    })
  }

  // Birthday alerts — surface today + next 7 days as action cards.
  // Touching a client's birthday is one of the highest-ROI moments an agent
  // can engineer; missing it is the most damaging.
  const upcomingBirthdays = findUpcomingBirthdays(leads, 7)
  upcomingBirthdays.forEach(l => {
    const label = birthdayLabel(l)
    const draftMsg = encodeURIComponent(birthdayMessageDraft(l.name, l.isToday))
    const phoneClean = l.phone ? String(l.phone).replace(/[^0-9+]/g, '') : null
    actions.push({
      id: `birthday-${l.id}`,
      priority: l.isToday ? 'high' : l.daysUntil <= 2 ? 'medium' : 'low',
      category: 'Birthday',
      title: `🎂 ${l.name}`,
      subtitle: label,
      meta: l.lead_type ? `${l.lead_type} · ${l.temperature || 'lead'}` : (l.temperature || 'lead'),
      tone: l.isToday ? 'celebrate' : 'info',
      primaryLabel: phoneClean ? 'Text birthday wish' : null,
      primaryHref: phoneClean ? `sms:${phoneClean}?&body=${draftMsg}` : null,
      secondaryHref: `/app/leads/${l.id}`,
      secondaryLabel: 'Open lead',
    })
  })

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  actions.sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3))
  const pending = actions.filter(a => !dismissedActions.includes(a.id))

  const totalCommission = deals.reduce((s, d) => s + (d.commission || 0), 0)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : ''

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: c.dim, fontSize: 13 }}>Loading your day…</div>
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ ...type.pageTitle, margin: 0 }}>
          Good {greeting}{firstName ? `, ${firstName}` : ''}.
        </h1>
        <p style={{ ...type.bodySub, margin: '4px 0 0' }}>
          {pending.length === 0
            ? "You're all caught up."
            : pending.length === 1
              ? '1 item needs your attention today.'
              : `${pending.length} items need your attention today.`}
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        <KPI label="Open actions" value={pending.length} accent={pending.length > 0 ? c.amber : c.green} />
        <KPI label="Active leads" value={leads.length} />
        <KPI label="Deals in flight" value={deals.length} accent={c.green} />
        <KPI label="Pending commission" value={fmt.moneyK(totalCommission)} accent={c.green} />
      </div>

      {/* Actions */}
      <section style={{ marginBottom: 32 }}>
        <SectionHeader label="Today's actions" />
        {pending.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pending.map(a => <ActionRow key={a.id} action={a} onDismiss={() => setDismissedActions(p => [...p, a.id])} />)}
          </div>
        ) : (
          <EmptyState
            isFresh={leads.length === 0 && deals.length === 0}
          />
        )}
      </section>

      {/* Quick links */}
      <section>
        <SectionHeader label="Jump to" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
          <QuickLink href="/app/copilot"   label="Copilot"      sub="AI follow-ups" />
          <QuickLink href="/app/calendar"  label="Calendar"     sub="Today + upcoming" />
          <QuickLink href="/app/marketing" label="Marketing"    sub="ROI by source" />
          <QuickLink href="/app/leads"     label="Add a lead"   sub="Capture a prospect" />
          <QuickLink href="/app/deals"     label="Log a deal"   sub="Under contract" />
        </div>
      </section>

    </div>
  )
}

const KPI = ({ label, value, accent }) => (
  <div style={statTile}>
    <span style={type.eyebrow}>{label}</span>
    <span style={{ ...type.metric, color: accent || c.text }}>{value}</span>
  </div>
)

const SectionHeader = ({ label, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
    <span style={type.eyebrow}>{label}</span>
    {action}
  </div>
)

const ActionRow = ({ action, onDismiss }) => {
  const tone = action.tone || 'neutral'
  const accent = tone === 'urgent' ? c.red : tone === 'warn' ? c.amber : tone === 'info' ? c.indigo : c.dim
  return (
    <div style={{
      ...card,
      padding: '16px 18px',
      borderLeft: `3px solid ${accent}`,
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start',
      flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ ...type.eyebrow, color: accent }}>{action.category}</span>
          {action.priority === 'critical' && (
            <span style={{ ...chipFor('hot'), border: 'none', background: c.redSoft }}>Urgent</span>
          )}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 2 }}>
          {action.title}
        </div>
        <div style={{ ...type.bodySub, fontSize: 13 }}>{action.subtitle}</div>
        {action.meta && <div style={{ ...type.meta, marginTop: 4 }}>{action.meta}</div>}
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {action.primaryFn && action.primaryLabel && (
          <button onClick={action.primaryFn} style={btn.primary}>{action.primaryLabel}</button>
        )}
        {action.primaryHref && action.primaryLabel && (
          <a href={action.primaryHref} style={{ ...btn.primary, textDecoration: 'none' }}>
            {action.primaryLabel}
          </a>
        )}
        {action.secondaryHref && (
          <a href={action.secondaryHref} style={{ ...btn.secondary, textDecoration: 'none' }}>
            {action.secondaryLabel}
          </a>
        )}
        <button onClick={onDismiss} style={btn.ghost} aria-label="Dismiss">Skip</button>
      </div>
    </div>
  )
}

const EmptyState = ({ isFresh }) => (
  <div style={{ ...card, padding: '32px 24px', textAlign: 'center' }}>
    {isFresh ? (
      <>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Welcome to Brikk</div>
        <div style={{ ...type.bodySub, marginBottom: 16, maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>
          Start by adding your current leads. Once your pipeline is in here, this screen will tell you exactly what to do every day.
        </div>
        <a href="/app/leads" style={{ ...btn.primary, textDecoration: 'none' }}>Add your first lead</a>
      </>
    ) : (
      <>
        <div style={{ fontSize: 15, fontWeight: 600, color: c.green, marginBottom: 6 }}>All caught up</div>
        <div style={{ ...type.bodySub }}>Nothing needs attention right now. Check back later.</div>
      </>
    )}
  </div>
)

const QuickLink = ({ href, label, sub }) => (
  <a href={href} style={{
    ...card, padding: '14px 16px',
    textDecoration: 'none', display: 'block',
    transition: 'border-color 0.12s ease, transform 0.08s ease',
  }}>
    <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{label}</div>
    <div style={{ ...type.meta, marginTop: 2 }}>{sub}</div>
  </a>
)

// Voice modal lives in lib/Voice.js and is mounted globally in app/app/layout.js.

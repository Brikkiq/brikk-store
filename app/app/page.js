'use client'
// Today — who the agent needs to contact, with one-tap texting.
// All logic lives in GET /api/v1/today; this page only renders it.
import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/client/api'
import { c, type, btn, statTile } from '@/lib/design'
import { FollowUpCard, SectionLabel, Loading, ErrorBox, Empty, money } from '@/lib/ui'
import { longDate } from '@/lib/core/dates'

export default function TodayPage() {
  const [data, setData] = useState(null)
  const [me, setMe] = useState(null)
  const [error, setError] = useState(null)
  const [showWeek, setShowWeek] = useState(true)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [today, profile] = await Promise.all([api.get('/today'), me ? Promise.resolve(me) : api.get('/me')])
      setData(today)
      setMe(profile)
    } catch (e) {
      setError(e.message)
    }
  }, [me])

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Coming back from the Messages app: refresh so "Did you send it?" shows.
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  if (error && !data) return <ErrorBox message={error} onRetry={load} />
  if (!data) return <Loading label="Loading your day…" />

  const firstName = (me?.profile?.full_name || '').split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const s = data.stats
  const mainCount = data.overdue.length + data.today.length
  const isEmptyBook = s.clients === 0 && mainCount === 0 && data.this_week.length === 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h1 style={{ ...type.pageTitle, margin: 0 }}>{greeting}{firstName ? `, ${firstName}` : ''}.</h1>
          <p style={{ ...type.bodySub, margin: '4px 0 0' }}>
            {longDate(data.date)} · {mainCount === 0 ? 'Nobody to contact right now.' : `${mainCount} ${mainCount === 1 ? 'person' : 'people'} to contact.`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href="/app/book/new" style={{ ...btn.primary, textDecoration: 'none', minHeight: 44 }}>+ Add client</a>
          <a href="/app/book?pick=policy" style={{ ...btn.secondary, textDecoration: 'none', minHeight: 44 }}>+ Add policy</a>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 26 }}>
        <Stat label="Due today" value={s.due_today} accent={s.due_today ? c.amber : c.green} />
        <Stat label="Overdue" value={s.overdue} accent={s.overdue ? c.red : c.text} />
        <Stat label="Done this week" value={s.done_this_week} accent={c.green} />
        <Stat label="Active policies" value={s.active_policies} sub={s.pending_policies ? `${s.pending_policies} pending` : null} />
        <Stat label="Monthly premium" value={money(s.monthly_premium)} sub="in your book" />
      </div>

      {error && <div style={{ marginBottom: 16 }}><ErrorBox message={error} onRetry={load} /></div>}

      {isEmptyBook ? (
        <Empty
          title="Your Book is empty"
          body="Add a client household and their policy. Thank-you texts, draft-day check-ins, 30/60/90-day check-ins, annual reviews and birthdays will show up here automatically."
          action={<a href="/app/book/new" style={{ ...btn.primary, textDecoration: 'none' }}>Add your first client</a>}
        />
      ) : (
        <>
          {data.overdue.length > 0 && (
            <Section label={`Overdue · ${data.overdue.length}`}>
              {data.overdue.map(it => <FollowUpCard key={it.id} item={it} today={data.date} onChanged={load} />)}
            </Section>
          )}

          <Section label={`Today · ${data.today.length}`}>
            {data.today.length
              ? data.today.map(it => <FollowUpCard key={it.id} item={it} today={data.date} onChanged={load} />)
              : <div style={{ ...type.bodySub, padding: '4px 2px' }}>{data.overdue.length ? 'Nothing else due today.' : 'You’re all caught up for today. ✓'}</div>}
          </Section>

          <Section
            label={`Coming up this week · ${data.this_week.length}`}
            right={data.this_week.length > 0 && <button onClick={() => setShowWeek(v => !v)} style={btn.ghost}>{showWeek ? 'Hide' : 'Show'}</button>}
          >
            {data.this_week.length === 0
              ? <div style={{ ...type.bodySub, padding: '4px 2px' }}>Nothing scheduled for the next 7 days.</div>
              : showWeek && data.this_week.map(it => <FollowUpCard key={it.id} item={it} today={data.date} onChanged={load} compact />)}
          </Section>
        </>
      )}
    </div>
  )
}

const Stat = ({ label, value, sub, accent }) => (
  <div style={{ ...statTile, flex: '1 1 140px', minWidth: 140 }}>
    <span style={type.eyebrow}>{label}</span>
    <span style={{ ...type.metric, color: accent || c.text }}>{value}</span>
    {sub && <span style={type.meta}>{sub}</span>}
  </div>
)

const Section = ({ label, right, children }) => (
  <section style={{ marginBottom: 28 }}>
    <SectionLabel right={right}>{label}</SectionLabel>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
  </section>
)

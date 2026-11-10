'use client'
// One vertical timeline per household, oldest at the top, with "Today" marked.
// Data comes from GET /api/v1/households/:id/timeline.
import { c, type, chipFor } from '@/lib/design'
import { FollowUpCard } from '@/lib/ui'
import { shortDate, addDays } from '@/lib/core/dates'

const DOT = {
  policy_written: c.green,
  birthday: c.purple,
  activity: c.dim,
}

export function Timeline({ data, household, phone, onChanged }) {
  const items = data?.items || []
  const today = data?.today
  const firstFuture = items.findIndex(it => it.date >= today)
  const markerAt = firstFuture === -1 ? items.length : firstFuture

  const rows = []
  items.forEach((it, i) => {
    if (i === markerAt) rows.push(<TodayMarker key="today" date={today} />)
    rows.push(<Row key={`${it.type}-${i}`} it={it} today={today} household={household} phone={phone} onChanged={onChanged} />)
  })
  if (markerAt === items.length) rows.push(<TodayMarker key="today" date={today} />)

  if (!items.length) {
    return <div style={{ ...type.bodySub, padding: '6px 2px' }}>Nothing yet. Add a policy and the follow-ups will appear here.</div>
  }
  return <div style={{ position: 'relative', paddingLeft: 22 }}>
    <div aria-hidden style={{ position: 'absolute', left: 6, top: 4, bottom: 4, width: 2, background: c.border }} />
    {rows}
  </div>
}

function TodayMarker({ date }) {
  return (
    <div style={{ position: 'relative', margin: '14px 0' }}>
      <div aria-hidden style={{ position: 'absolute', left: -21, top: 5, width: 12, height: 12, borderRadius: 6, background: c.text }} />
      <span style={{ ...type.eyebrow, color: c.text }}>Today · {shortDate(date)}</span>
    </div>
  )
}

function Row({ it, today, household, phone, onChanged }) {
  const f = it.follow_up
  const isOpenFollowUp = it.type === 'follow_up' && (f.status === 'pending' || f.status === 'opened')
  const dotColor = it.type === 'follow_up'
    ? (f.status === 'done' ? c.green : f.status === 'skipped' ? c.faint : it.date < today ? c.red : c.amber)
    : DOT[it.type] || c.dim

  return (
    <div style={{ position: 'relative', margin: '0 0 12px' }}>
      <div aria-hidden style={{ position: 'absolute', left: -20, top: 6, width: 10, height: 10, borderRadius: 5, background: dotColor, border: `2px solid ${c.bg}` }} />
      {isOpenFollowUp && it.date <= addDays(today, 7) ? (
        <FollowUpCard
          item={{ ...f, phone, person: it.subtitle, household }}
          today={today}
          onChanged={onChanged}
          showHousehold={false}
        />
      ) : (
        <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', padding: '2px 0' }}>
          <span style={{ ...type.meta, minWidth: 54 }}>{shortDate(it.date)}{it.date.slice(0, 4) !== String(today).slice(0, 4) ? `, ${it.date.slice(0, 4)}` : ''}</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: f?.status === 'skipped' ? c.dim : c.text, textDecoration: f?.status === 'skipped' ? 'line-through' : 'none' }}>
            {it.title}
          </span>
          {it.subtitle && <span style={{ ...type.meta }}>{it.subtitle}</span>}
          {f && f.status === 'done' && <span style={chipFor('success')}>Done</span>}
          {f && f.status === 'skipped' && <span style={chipFor('neutral')}>Skipped</span>}
          {f && isOpenFollowUp && <span style={chipFor(it.date < today ? 'hot' : 'neutral')}>{it.date < today ? 'Overdue' : 'Scheduled'}</span>}
        </div>
      )}
    </div>
  )
}


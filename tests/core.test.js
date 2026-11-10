import { describe, it, expect } from 'vitest'
import { addDays, addMonths, daysBetween, isDateString, todayIn, shortDate } from '../lib/core/dates'
import { birthdayInYear, nextBirthday, ageOn, birthdaysInWindow } from '../lib/core/birthdays'
import { normalizePhone, smsHref } from '../lib/core/sms'
import { renderTemplate, buildVars } from '../lib/core/messages'
import { DEFAULT_TEMPLATES, buildPolicyFollowUps, nextOccurrence, occurrenceFromKey, describeTiming } from '../lib/core/schedule'
import { groupForToday } from '../lib/core/today'

const templates = DEFAULT_TEMPLATES.map((t, i) => ({ ...t, id: `t${i}` }))

describe('dates', () => {
  it('validates date strings', () => {
    expect(isDateString('2026-02-28')).toBe(true)
    expect(isDateString('2026-02-30')).toBe(false)
    expect(isDateString('2026-2-3')).toBe(false)
  })
  it('adds days across year end', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
    expect(addDays('2026-03-01', -2)).toBe('2026-02-27')
  })
  it('clamps months to month end', () => {
    expect(addMonths('2026-08-31', 6)).toBe('2027-02-28')
    expect(addMonths('2027-08-31', 6)).toBe('2028-02-29')
    expect(addMonths('2026-01-15', 12)).toBe('2027-01-15')
  })
  it('counts days between', () => {
    expect(daysBetween('2026-01-01', '2026-01-31')).toBe(30)
    expect(daysBetween('2026-01-31', '2026-01-01')).toBe(-30)
  })
  it('computes today in a time zone', () => {
    const now = new Date('2026-11-10T03:00:00Z')
    expect(todayIn('America/Los_Angeles', now)).toBe('2026-11-09')
    expect(todayIn('UTC', now)).toBe('2026-11-10')
    expect(todayIn('Not/AZone', now)).toBe('2026-11-10')
  })
  it('formats short dates', () => {
    expect(shortDate('2026-03-03')).toBe('Mar 3')
  })
})

describe('birthdays', () => {
  it('moves Feb 29 to Feb 28 in non-leap years', () => {
    expect(birthdayInYear('2000-02-29', 2027)).toBe('2027-02-28')
    expect(birthdayInYear('2000-02-29', 2028)).toBe('2028-02-29')
  })
  it('finds the next birthday', () => {
    expect(nextBirthday('1990-11-10', '2026-11-10')).toBe('2026-11-10')
    expect(nextBirthday('1990-11-09', '2026-11-10')).toBe('2027-11-09')
  })
  it('computes age', () => {
    expect(ageOn('1990-11-10', '2026-11-10')).toBe(36)
    expect(ageOn('1990-11-11', '2026-11-10')).toBe(35)
  })
  it('lists birthdays in a window across year end', () => {
    const members = [
      { id: 'a', birthday: '2015-01-02' },
      { id: 'b', birthday: '1980-12-30' },
      { id: 'c', birthday: null },
    ]
    const r = birthdaysInWindow(members, '2026-12-28', '2027-01-04', '2026-12-28')
    expect(r.map(x => [x.member.id, x.due_date, x.turning])).toEqual([
      ['b', '2026-12-30', 46],
      ['a', '2027-01-02', 12],
    ])
  })
})

describe('sms', () => {
  it('normalizes phones', () => {
    expect(normalizePhone('(555) 555-0123')).toBe('+15555550123')
    expect(normalizePhone('1-555-555-0123')).toBe('+15555550123')
    expect(normalizePhone('')).toBe(null)
  })
  it('builds platform-specific links', () => {
    expect(smsHref('5555550123', 'Hi there', 'ios')).toBe('sms:+15555550123&body=Hi%20there')
    expect(smsHref('5555550123', 'Hi there', 'android')).toBe('sms:+15555550123?body=Hi%20there')
    expect(smsHref(null, 'x')).toBe(null)
  })
})

describe('messages', () => {
  it('renders templates and blanks unknown placeholders', () => {
    const vars = buildVars({
      household: { display_name: 'John Smith' },
      member: { first_name: 'John' },
      policy: { carrier: 'Mutual', monthly_premium: 45.2, first_draft_date: '2026-03-03' },
      agent: { full_name: 'Henry D' },
    })
    expect(renderTemplate('Hi {first_name}, ${monthly_premium} on {first_draft_date} with {carrier}. {nope}– {agent_first_name}', vars))
      .toBe('Hi John, $45.20 on Mar 3 with Mutual. – Henry')
  })
})

describe('schedule', () => {
  const policy = { id: 'p1', status: 'pending', application_date: '2026-01-10', first_draft_date: '2026-02-01', effective_date: '2026-02-01' }

  it('generates the default schedule from the right anchors', () => {
    const rows = buildPolicyFollowUps({ policy, templates, today: '2026-01-10' })
    const byLabel = Object.fromEntries(rows.map(r => [r.label, r.due_date]))
    expect(byLabel).toEqual({
      'Thank-you text': '2026-01-11',
      'Before first draft': '2026-01-30',
      'Payment check': '2026-02-04',
      '30-day check-in': '2026-02-09',
      '60-day check-in': '2026-03-11',
      '90-day check-in': '2026-04-10',
      '6-month check-in': '2026-07-10',
      'Annual review': '2027-01-10',
    })
    expect(rows.every(r => r.status === 'pending')).toBe(true)
  })

  it('waits on steps whose anchor date is missing', () => {
    const rows = buildPolicyFollowUps({ policy: { ...policy, first_draft_date: null }, templates, today: '2026-01-10' })
    expect(rows.find(r => r.label === 'Payment check')).toBeUndefined()
    expect(rows).toHaveLength(6)
  })

  it('skips long-overdue steps on back-dated policies and rolls annual review forward', () => {
    const rows = buildPolicyFollowUps({ policy, templates, today: '2028-03-01' })
    const nonAnnual = rows.filter(r => r.kind === 'policy')
    expect(nonAnnual.every(r => r.status === 'skipped')).toBe(true)
    const annual = rows.find(r => r.kind === 'annual_review')
    expect(annual.due_date).toBe('2029-01-10')
    expect(annual.occurrence).toBe(3)
    expect(annual.status).toBe('pending')
  })

  it('keeps recently-due steps pending within the grace window', () => {
    const rows = buildPolicyFollowUps({ policy, templates, today: '2026-01-15' })
    expect(rows.find(r => r.label === 'Thank-you text').status).toBe('pending')
  })

  it('returns nothing for cancelled policies', () => {
    expect(buildPolicyFollowUps({ policy: { ...policy, status: 'cancelled' }, templates, today: '2026-01-10' })).toEqual([])
  })

  it('builds the next annual occurrence', () => {
    const annual = templates.find(t => t.repeat_yearly)
    const next = nextOccurrence({ policy, template: annual, occurrence: 1 })
    expect(next.due_date).toBe('2028-01-10')
    expect(occurrenceFromKey(next.dedupe_key)).toBe(2)
  })

  it('describes timing in words', () => {
    expect(describeTiming(templates[1])).toBe('2 days before first draft date')
    expect(describeTiming(templates[7])).toBe('12 months after application date, every year')
  })
})

describe('today grouping', () => {
  it('groups overdue / today / this week and drops stale birthdays', () => {
    const fu = [
      { id: 1, kind: 'policy', status: 'pending', due_date: '2026-11-01', label: 'a' },
      { id: 2, kind: 'birthday', status: 'pending', due_date: '2026-11-01', label: 'b' },
      { id: 3, kind: 'birthday', status: 'pending', due_date: '2026-11-08', label: 'c' },
      { id: 4, kind: 'policy', status: 'opened', due_date: '2026-11-10', label: 'd' },
      { id: 5, kind: 'policy', status: 'pending', due_date: '2026-11-17', label: 'e' },
      { id: 6, kind: 'policy', status: 'pending', due_date: '2026-11-18', label: 'f' },
      { id: 7, kind: 'policy', status: 'done', due_date: '2026-11-10', label: 'g' },
    ]
    const g = groupForToday(fu, '2026-11-10')
    expect(g.overdue.map(x => x.id)).toEqual([1, 3])
    expect(g.today.map(x => x.id)).toEqual([4])
    expect(g.this_week.map(x => x.id)).toEqual([5])
  })
})

// Date-only helpers. Every policy, birthday and follow-up date in this app is a
// plain calendar date string "YYYY-MM-DD" — no times, no time zones.
// "Today" depends on the agent's time zone, so callers pass it in.
//
// Pure module: no React, Next or Supabase imports. Shared by web, API and
// (in spirit) the mobile apps — see API.md for the same rules.

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

export function isDateString(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false
  const d = toUTC(s)
  return !Number.isNaN(d.getTime()) && fromUTC(d) === s
}

function toUTC(s) {
  const [, y, m, d] = s.match(DATE_RE) || []
  return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)))
}

function fromUTC(d) {
  return d.toISOString().slice(0, 10)
}

// Today's date in an IANA time zone ("America/Chicago"). Falls back to UTC
// if the zone is missing or invalid.
export function todayIn(timeZone, now = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(now)
  } catch {
    return fromUTC(now)
  }
}

export function isValidTimeZone(tz) {
  if (typeof tz !== 'string' || !tz) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

export function addDays(dateStr, days) {
  const d = toUTC(dateStr)
  d.setUTCDate(d.getUTCDate() + days)
  return fromUTC(d)
}

// Adds calendar months, clamping to the end of the month:
// 2026-08-31 + 6 months = 2027-02-28.
export function addMonths(dateStr, months) {
  const [, y, m, d] = dateStr.match(DATE_RE)
  const total = Number(y) * 12 + (Number(m) - 1) + months
  const year = Math.floor(total / 12)
  const month = total - year * 12
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const day = Math.min(Number(d), lastDay)
  return fromUTC(new Date(Date.UTC(year, month, day)))
}

// Whole days from a to b (positive when b is later).
export function daysBetween(a, b) {
  return Math.round((toUTC(b) - toUTC(a)) / 86400000)
}

// "Mar 3" — short display used inside text messages.
export function shortDate(dateStr) {
  if (!isDateString(dateStr)) return ''
  return toUTC(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

// "Tuesday, Mar 3"
export function longDate(dateStr) {
  if (!isDateString(dateStr)) return ''
  return toUTC(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

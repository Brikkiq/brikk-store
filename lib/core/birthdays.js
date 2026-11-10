// Birthday logic for every household member. Pure functions.
import { addDays, daysBetween, isDateString, isLeapYear } from './dates'

// The date this birthday falls on in a given year. Feb 29 birthdays are
// celebrated on Feb 28 in non-leap years.
export function birthdayInYear(birthday, year) {
  if (!isDateString(birthday)) return null
  const [, mm, dd] = birthday.split('-')
  if (mm === '02' && dd === '29' && !isLeapYear(year)) return `${year}-02-28`
  return `${year}-${mm}-${dd}`
}

// Next occurrence on or after `fromDate`.
export function nextBirthday(birthday, fromDate) {
  if (!isDateString(birthday) || !isDateString(fromDate)) return null
  const y = Number(fromDate.slice(0, 4))
  const thisYear = birthdayInYear(birthday, y)
  return thisYear >= fromDate ? thisYear : birthdayInYear(birthday, y + 1)
}

export function ageOn(birthday, date) {
  if (!isDateString(birthday) || !isDateString(date)) return null
  const by = Number(birthday.slice(0, 4))
  const y = Number(date.slice(0, 4))
  const passed = birthdayInYear(birthday, y) <= date
  return y - by - (passed ? 0 : 1)
}

// All member birthdays between start and end (inclusive), soonest first.
// Returns [{ member, due_date, turning, days_away }] where days_away is
// relative to `today` (negative = already passed).
export function birthdaysInWindow(members, start, end, today = start) {
  const out = []
  for (const m of members || []) {
    if (!isDateString(m?.birthday)) continue
    let d = nextBirthday(m.birthday, start)
    while (d && d <= end) {
      out.push({ member: m, due_date: d, turning: ageOn(m.birthday, d), days_away: daysBetween(today, d) })
      d = nextBirthday(m.birthday, addDays(d, 1))
    }
  }
  return out.sort((a, b) => (a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0))
}

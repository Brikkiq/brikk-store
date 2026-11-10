// Groups follow-ups for the Today screen. Pure function.
import { addDays, daysBetween } from './dates'

// Birthdays missed by more than this many days drop off Today.
export const BIRTHDAY_STALE_DAYS = 3

// followUps: rows with status pending|opened, each carrying due_date + kind.
// Returns { overdue, today, this_week } (each sorted by due date, then label).
export function groupForToday(followUps, today) {
  const weekEnd = addDays(today, 7)
  const out = { overdue: [], today: [], this_week: [] }
  for (const f of followUps || []) {
    if (f.status !== 'pending' && f.status !== 'opened') continue
    const diff = daysBetween(today, f.due_date) // negative = overdue
    if (diff < 0) {
      if (f.kind === 'birthday' && -diff > BIRTHDAY_STALE_DAYS) continue
      out.overdue.push(f)
    } else if (diff === 0) {
      out.today.push(f)
    } else if (f.due_date <= weekEnd) {
      out.this_week.push(f)
    }
  }
  const byDate = (a, b) => (a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : String(a.label).localeCompare(String(b.label)))
  out.overdue.sort(byDate)
  out.today.sort(byDate)
  out.this_week.sort(byDate)
  return out
}

// Small display helpers for the household page.
import { nextBirthday, ageOn } from '@/lib/core/birthdays'
import { daysBetween, shortDate } from '@/lib/core/dates'

export { shortDate }

export function nextBirthdayLabel(birthday, today) {
  if (!birthday || !today) return ''
  const next = nextBirthday(birthday, today)
  if (!next) return ''
  const d = daysBetween(today, next)
  const turning = ageOn(birthday, next)
  if (d === 0) return `turns ${turning} today 🎂`
  if (d === 1) return `turns ${turning} tomorrow`
  if (d <= 30) return `turns ${turning} in ${d} days`
  return `turns ${turning} on ${shortDate(next)}`
}

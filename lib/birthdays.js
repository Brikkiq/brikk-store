// Birthday utilities — used by the Today page and the morning brief cron.
// All functions are pure / synchronous; the caller does the DB query.

/**
 * Given a Date-of-birth string ("YYYY-MM-DD"), return:
 *   - daysUntil: number of days until this year's birthday (0 = today,
 *     negative if it already passed this year)
 *   - isToday: convenience boolean
 *   - turning: age they'll be on the birthday (or current age if isToday)
 *   - displayMonthDay: "May 24" formatted month/day
 *
 * Returns null if input is empty or unparseable.
 */
export function birthdayInfo(birthdayStr, now = new Date()) {
  if (!birthdayStr) return null
  const bday = new Date(birthdayStr)
  if (Number.isNaN(bday.getTime())) return null

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  // Build this year's birthday date (or next year's if it already passed this year)
  let nextBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
  if (nextBday < today) {
    nextBday = new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate())
  }

  const msPerDay = 24 * 60 * 60 * 1000
  const daysUntil = Math.round((nextBday - today) / msPerDay)
  const isToday   = daysUntil === 0

  // Age they'll turn on the upcoming birthday
  const turning = nextBday.getFullYear() - bday.getFullYear()

  const displayMonthDay = bday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  return { daysUntil, isToday, turning, displayMonthDay, bdayDate: bday }
}

/**
 * Filter a list of leads (each with a `birthday` field) down to those
 * whose birthday is today or within the next `windowDays` (default 7).
 * Returns an array enriched with birthday info, sorted soonest first.
 */
export function findUpcomingBirthdays(leads, windowDays = 7, now = new Date()) {
  if (!Array.isArray(leads)) return []
  return leads
    .map(lead => {
      const info = birthdayInfo(lead.birthday, now)
      return info ? { ...lead, ...info } : null
    })
    .filter(l => l && l.daysUntil >= 0 && l.daysUntil <= windowDays)
    .sort((a, b) => a.daysUntil - b.daysUntil)
}

/**
 * Friendly label for a birthday card. Returns:
 *   - "Turns 35 today" for daysUntil === 0
 *   - "Turns 35 tomorrow"
 *   - "Turns 35 on Friday" (for daysUntil 2-6)
 *   - "Turns 35 on May 24" (for daysUntil 7+)
 */
export function birthdayLabel(lead, now = new Date()) {
  if (lead.isToday) {
    return `Turns ${lead.turning} today`
  }
  if (lead.daysUntil === 1) {
    return `Turns ${lead.turning} tomorrow`
  }
  // Within the week → use weekday name
  if (lead.daysUntil >= 2 && lead.daysUntil <= 6) {
    const future = new Date(now.getTime() + lead.daysUntil * 86400000)
    const weekday = future.toLocaleDateString('en-US', { weekday: 'long' })
    return `Turns ${lead.turning} on ${weekday}`
  }
  return `Turns ${lead.turning} on ${lead.displayMonthDay}`
}

/**
 * Build a short suggested text message agents can send for a birthday.
 * Tone: warm but not effusive. Two variations to avoid sameness.
 */
export function birthdayMessageDraft(leadName, isToday) {
  const first = (leadName || '').split(' ')[0] || 'there'
  if (isToday) {
    return `Happy birthday, ${first}! Hope you have a great day.`
  }
  return `Hi ${first}, wanted to send an early happy birthday — hope it's a good one.`
}

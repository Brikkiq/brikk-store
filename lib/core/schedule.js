// Policy follow-up schedule. Pure functions — the server stores the results.
//
// Default schedule (agents can edit theirs in Settings):
//   thank-you            application date + 1 day
//   before first draft   first draft date − 2 days
//   payment check        first draft date + 3 days
//   30 / 60 / 90 days    application date + 30 / 60 / 90 days
//   6 months             application date + 6 months
//   annual review        application date + 12 months, repeating every year
import { addDays, addMonths, daysBetween, isDateString } from './dates'

export const ANCHORS = ['application_date', 'first_draft_date', 'effective_date']

export const ANCHOR_LABELS = {
  application_date: 'application date',
  first_draft_date: 'first draft date',
  effective_date: 'effective date',
}

// A follow-up more than this many days overdue when the policy is entered is
// created as "skipped" so back-dated policies don't flood Today.
export const OVERDUE_GRACE_DAYS = 7

export const DEFAULT_TEMPLATES = [
  {
    label: 'Thank-you text', anchor: 'application_date', offset_days: 1, offset_months: 0, repeat_yearly: false,
    message_template: 'Hi {first_name}, thank you for trusting me with your family’s coverage. Save my number — I’m here whenever you need me. – {agent_first_name}',
  },
  {
    label: 'Before first draft', anchor: 'first_draft_date', offset_days: -2, offset_months: 0, repeat_yearly: false,
    message_template: 'Hi {first_name}, quick heads-up: your first {carrier} payment of ${monthly_premium} drafts on {first_draft_date}. Any questions, just text me.',
  },
  {
    label: 'Payment check', anchor: 'first_draft_date', offset_days: 3, offset_months: 0, repeat_yearly: false,
    message_template: 'Hi {first_name}, checking that your first {carrier} payment went through OK. Let me know if anything looks off.',
  },
  {
    label: '30-day check-in', anchor: 'application_date', offset_days: 30, offset_months: 0, repeat_yearly: false,
    message_template: 'Hi {first_name}, one month in! Anything I can help with on your policy?',
  },
  {
    label: '60-day check-in', anchor: 'application_date', offset_days: 60, offset_months: 0, repeat_yearly: false,
    message_template: 'Hi {first_name}, checking in at the two-month mark. Everything good with your coverage?',
  },
  {
    label: '90-day check-in', anchor: 'application_date', offset_days: 90, offset_months: 0, repeat_yearly: false,
    message_template: 'Hi {first_name}, three months in — any changes in the family I should know about?',
  },
  {
    label: '6-month check-in', anchor: 'application_date', offset_days: 0, offset_months: 6, repeat_yearly: false,
    message_template: 'Hi {first_name}, it’s been six months since we set up your policy. Happy to answer any questions.',
  },
  {
    label: 'Annual review', anchor: 'application_date', offset_days: 0, offset_months: 12, repeat_yearly: true,
    message_template: 'Hi {first_name}, it’s been a year since we set up your coverage! Let’s find 10 minutes for a quick review to make sure it still fits your family.',
  },
].map((t, i) => ({ ...t, sort_order: i, active: true }))

// Due date of a template for a policy. For repeating templates, `occurrence`
// 1 is the first one (anchor + offset), 2 the next year, and so on.
export function dueDateFor(policy, template, occurrence = 1) {
  const anchor = policy?.[template.anchor]
  if (!isDateString(anchor)) return null
  const months = (template.offset_months || 0) * (template.repeat_yearly ? occurrence : 1)
  const extraYears = template.repeat_yearly && !template.offset_months ? (occurrence - 1) * 12 : 0
  return addDays(addMonths(anchor, months + extraYears), template.offset_days || 0)
}

export function dedupeKey(policyId, templateId, occurrence) {
  return occurrence ? `pol:${policyId}:tpl:${templateId}:${occurrence}` : `pol:${policyId}:tpl:${templateId}`
}

// Build the follow-ups for one policy.
// Returns [{ template_id, kind, label, due_date, status, dedupe_key, occurrence, message_template }]
// Templates without an id (not saved yet) are skipped.
export function buildPolicyFollowUps({ policy, templates, today, graceDays = OVERDUE_GRACE_DAYS }) {
  if (!policy || policy.status === 'cancelled') return []
  const out = []
  for (const t of templates || []) {
    if (!t?.id || t.active === false) continue
    if (t.repeat_yearly) {
      // Find the first occurrence that isn't long overdue.
      let n = 1
      let due = dueDateFor(policy, t, n)
      if (!due) continue
      while (daysBetween(due, today) > graceDays && n < 200) {
        n += 1
        due = dueDateFor(policy, t, n)
      }
      out.push(row(policy, t, due, n, 'pending'))
    } else {
      const due = dueDateFor(policy, t)
      if (!due) continue
      const status = daysBetween(due, today) > graceDays ? 'skipped' : 'pending'
      out.push(row(policy, t, due, null, status))
    }
  }
  return out.sort((a, b) => (a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0))
}

function row(policy, t, due, occurrence, status) {
  return {
    template_id: t.id,
    kind: t.repeat_yearly ? 'annual_review' : 'policy',
    label: occurrence && occurrence > 1 ? `${t.label} (year ${occurrence})` : t.label,
    due_date: due,
    status,
    occurrence,
    dedupe_key: dedupeKey(policy.id, t.id, occurrence),
    message_template: t.message_template,
  }
}

// After a repeating follow-up is done/skipped, the next year's occurrence.
export function nextOccurrence({ policy, template, occurrence }) {
  if (!template?.repeat_yearly || !policy || policy.status === 'cancelled') return null
  const n = (occurrence || 1) + 1
  const due = dueDateFor(policy, template, n)
  return due ? row(policy, template, due, n, 'pending') : null
}

// Parse the occurrence number back out of a dedupe key.
export function occurrenceFromKey(key) {
  const m = String(key || '').match(/^pol:[^:]+:tpl:[^:]+:(\d+)$/)
  return m ? Number(m[1]) : null
}

// Human description of a template's timing: "2 days before first draft date".
export function describeTiming(t) {
  const parts = []
  if (t.offset_months) parts.push(`${t.offset_months} month${t.offset_months === 1 ? '' : 's'}`)
  const d = Math.abs(t.offset_days || 0)
  if (d) parts.push(`${d} day${d === 1 ? '' : 's'}`)
  const anchor = ANCHOR_LABELS[t.anchor] || t.anchor
  if (!parts.length) return `On the ${anchor}${t.repeat_yearly ? ', every year' : ''}`
  const dir = (t.offset_days || 0) < 0 && !t.offset_months ? 'before' : 'after'
  return `${parts.join(' ')} ${dir} ${anchor}${t.repeat_yearly ? ', every year' : ''}`
}

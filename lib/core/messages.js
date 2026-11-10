// Text-message templates. Placeholders look like {first_name}.
// Unknown placeholders render as empty strings; this never throws.
import { shortDate } from './dates'

export const PLACEHOLDERS = [
  'first_name', 'agent_first_name', 'carrier', 'product',
  'monthly_premium', 'face_amount', 'first_draft_date', 'effective_date', 'turning',
]

export function renderTemplate(template, vars = {}) {
  return String(template || '')
    .replace(/\{(\w+)\}/g, (_, key) => {
      const v = vars[key]
      return v === undefined || v === null ? '' : String(v)
    })
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function money(n, decimals) {
  const v = Number(n)
  if (!Number.isFinite(v)) return ''
  return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

// Who a household's texts are addressed to: the policyholder, else the first member.
export function primaryMember(members) {
  const list = members || []
  return list.find(m => m.role === 'policyholder') || list[0] || null
}

export function firstNameOf(member, household) {
  if (member?.first_name) return member.first_name
  const n = String(household?.display_name || '').trim().split(/\s+/)[0]
  return n || 'there'
}

// Build template variables for a household / member / policy / agent.
export function buildVars({ household, member, policy, agent, turning } = {}) {
  return {
    first_name: firstNameOf(member, household),
    agent_first_name: String(agent?.full_name || '').trim().split(/\s+/)[0] || '',
    carrier: policy?.carrier || '',
    product: policy?.product || '',
    monthly_premium: policy?.monthly_premium != null ? money(policy.monthly_premium, 2) : '',
    face_amount: policy?.face_amount != null ? money(policy.face_amount, 0) : '',
    first_draft_date: shortDate(policy?.first_draft_date),
    effective_date: shortDate(policy?.effective_date),
    turning: turning != null ? String(turning) : '',
  }
}

export const BIRTHDAY_TEMPLATE = 'Happy birthday, {first_name}! Hope it’s a great one. – {agent_first_name}'
export const CHILD_BIRTHDAY_TEMPLATE = 'Hi {parent_first_name}! Wishing {first_name} a very happy birthday today. – {agent_first_name}'

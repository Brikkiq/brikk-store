// The agent's Book: households, members, policies, follow-ups, activity.
// Server-only. Every query is scoped by user_id AND runs through a client that
// carries the user's own token, so row-level security applies too.
import { badRequest, check, notFound } from './http'
import {
  rejectUnknown, str, date, num, int, bool, oneOf, uuid, email, compact,
} from './validate'
import { todayIn, addDays, isValidTimeZone } from '../core/dates'
import { birthdaysInWindow, nextBirthday, ageOn } from '../core/birthdays'
import {
  ANCHORS, DEFAULT_TEMPLATES, buildPolicyFollowUps, nextOccurrence, occurrenceFromKey,
} from '../core/schedule'
import {
  renderTemplate, buildVars, primaryMember, firstNameOf, BIRTHDAY_TEMPLATE, CHILD_BIRTHDAY_TEMPLATE,
} from '../core/messages'
import { groupForToday } from '../core/today'

const HOUSEHOLD_STATUSES = ['prospect', 'client', 'inactive']
const MEMBER_ROLES = ['policyholder', 'spouse', 'child', 'other']
const POLICY_STATUSES = ['pending', 'active', 'cancelled']
const OPEN = ['pending', 'opened']

export function agentToday(profile) {
  return todayIn(isValidTimeZone(profile?.timezone) ? profile.timezone : 'America/New_York')
}

// PostgREST caps responses (usually 1000 rows) — page through everything.
async function fetchAll(makeQuery, what) {
  const page = 1000
  const rows = []
  for (let from = 0; ; from += page) {
    const data = check(await makeQuery().range(from, from + page - 1), what)
    rows.push(...(data || []))
    if (!data || data.length < page) return rows
  }
}

async function ownHousehold(db, userId, id) {
  uuid(id, 'household id')
  const h = check(await db.from('households').select('*').eq('id', id).eq('user_id', userId).maybeSingle(), 'Could not load client')
  if (!h) throw notFound('Client not found')
  return h
}

// ---------------------------------------------------------------- validation
const HOUSEHOLD_FIELDS = ['display_name', 'phone', 'email', 'address_line', 'city', 'state', 'zip', 'source', 'status', 'notes']
function householdInput(body, { creating }) {
  return compact({
    display_name: str(body, 'display_name', { max: 200, required: creating }),
    phone: str(body, 'phone', { max: 40 }),
    email: email(body, 'email'),
    address_line: str(body, 'address_line', { max: 200 }),
    city: str(body, 'city', { max: 100 }),
    state: str(body, 'state', { max: 50 }),
    zip: str(body, 'zip', { max: 20 }),
    source: str(body, 'source', { max: 100 }),
    status: oneOf(body, 'status', HOUSEHOLD_STATUSES),
    notes: str(body, 'notes', { max: 5000 }),
  })
}

const MEMBER_FIELDS = ['role', 'first_name', 'last_name', 'birthday', 'phone', 'email', 'sort_order']
function memberInput(body, { creating }) {
  rejectUnknown(body, MEMBER_FIELDS)
  return compact({
    role: oneOf(body, 'role', MEMBER_ROLES),
    first_name: str(body, 'first_name', { max: 100, required: creating }),
    last_name: str(body, 'last_name', { max: 100 }),
    birthday: date(body, 'birthday'),
    phone: str(body, 'phone', { max: 40 }),
    email: email(body, 'email'),
    sort_order: int(body, 'sort_order', { min: 0, max: 1000 }),
  })
}

const POLICY_FIELDS = ['insured_member_id', 'carrier', 'product', 'policy_number', 'face_amount', 'monthly_premium',
  'application_date', 'effective_date', 'first_draft_date', 'status', 'beneficiaries']
function policyInput(body, { creating }) {
  rejectUnknown(body, POLICY_FIELDS)
  const out = compact({
    carrier: str(body, 'carrier', { max: 120, required: creating }),
    product: str(body, 'product', { max: 120 }),
    policy_number: str(body, 'policy_number', { max: 60 }),
    face_amount: num(body, 'face_amount', { min: 0, max: 1e11 }),
    monthly_premium: num(body, 'monthly_premium', { min: 0, max: 1e7 }),
    application_date: date(body, 'application_date'),
    effective_date: date(body, 'effective_date'),
    first_draft_date: date(body, 'first_draft_date'),
    status: oneOf(body, 'status', POLICY_STATUSES),
  })
  if (body.insured_member_id !== undefined) {
    out.insured_member_id = body.insured_member_id === null || body.insured_member_id === ''
      ? null : uuid(body.insured_member_id, 'insured_member_id')
  }
  if (body.beneficiaries !== undefined) out.beneficiaries = beneficiariesInput(body.beneficiaries)
  return out
}

function beneficiariesInput(v) {
  if (v === null) return []
  if (!Array.isArray(v) || v.length > 10) throw badRequest('beneficiaries must be a list of up to 10 people')
  return v.map((b, i) => {
    if (!b || typeof b !== 'object' || Array.isArray(b)) throw badRequest(`beneficiaries[${i}] must be an object`)
    rejectUnknown(b, ['name', 'relationship'])
    const name = str(b, 'name', { max: 120, required: true })
    const relationship = str(b, 'relationship', { max: 60 }) || null
    return { name, relationship }
  })
}

// ---------------------------------------------------------------- households
export async function listHouseholds(db, userId, { q, status } = {}) {
  const [households, members, policies, followUps] = await Promise.all([
    fetchAll(() => {
      let query = db.from('households').select('id, display_name, phone, email, status, last_contact_at, created_at')
        .eq('user_id', userId).order('display_name', { ascending: true })
      if (status && HOUSEHOLD_STATUSES.includes(status)) query = query.eq('status', status)
      return query
    }, 'Could not load your book'),
    fetchAll(() => db.from('household_members').select('id, household_id, role, first_name, last_name, birthday')
      .eq('user_id', userId).order('sort_order'), 'Could not load members'),
    fetchAll(() => db.from('policies').select('id, household_id, carrier, status, monthly_premium')
      .eq('user_id', userId), 'Could not load policies'),
    fetchAll(() => db.from('follow_ups').select('household_id, label, due_date, kind')
      .eq('user_id', userId).in('status', OPEN).order('due_date'), 'Could not load follow-ups'),
  ])

  const byHousehold = (rows) => rows.reduce((m, r) => ((m[r.household_id] ||= []).push(r), m), {})
  const mBy = byHousehold(members)
  const pBy = byHousehold(policies)
  const nextBy = {}
  for (const f of followUps) if (!nextBy[f.household_id]) nextBy[f.household_id] = f

  const needle = String(q || '').trim().toLowerCase()
  return households
    .map(h => ({
      ...h,
      members: mBy[h.id] || [],
      policy_count: (pBy[h.id] || []).filter(p => p.status !== 'cancelled').length,
      carriers: [...new Set((pBy[h.id] || []).filter(p => p.status !== 'cancelled').map(p => p.carrier))],
      next_follow_up: nextBy[h.id] || null,
    }))
    .filter(h => !needle || [h.display_name, h.phone, h.email, ...h.members.map(m => `${m.first_name} ${m.last_name || ''}`)]
      .some(v => String(v || '').toLowerCase().includes(needle)))
}

export async function getHousehold(db, userId, id) {
  const household = await ownHousehold(db, userId, id)
  const [members, policies, followUps, activity] = await Promise.all([
    db.from('household_members').select('*').eq('user_id', userId).eq('household_id', id).order('sort_order').order('created_at'),
    db.from('policies').select('*').eq('user_id', userId).eq('household_id', id).order('application_date', { ascending: false, nullsFirst: false }),
    db.from('follow_ups').select('*').eq('user_id', userId).eq('household_id', id).order('due_date'),
    db.from('activity').select('*').eq('user_id', userId).eq('household_id', id).order('created_at', { ascending: false }).limit(200),
  ])
  return {
    ...household,
    members: check(members, 'Could not load members') || [],
    policies: check(policies, 'Could not load policies') || [],
    follow_ups: check(followUps, 'Could not load follow-ups') || [],
    activity: check(activity, 'Could not load activity') || [],
  }
}

export async function createHousehold(db, userId, body) {
  rejectUnknown(body, [...HOUSEHOLD_FIELDS, 'members'])
  const fields = householdInput(body, { creating: true })
  const members = body.members === undefined ? [] : body.members
  if (!Array.isArray(members) || members.length > 20) throw badRequest('members must be a list of up to 20 people')
  const memberRows = members.map((m, i) => {
    if (!m || typeof m !== 'object' || Array.isArray(m)) throw badRequest(`members[${i}] must be an object`)
    return { sort_order: i, role: 'other', ...memberInput(m, { creating: true }) }
  })

  const household = check(await db.from('households').insert({ ...fields, user_id: userId }).select('*').single(), 'Could not save client')
  if (memberRows.length) {
    const res = await db.from('household_members').insert(memberRows.map(m => ({ ...m, user_id: userId, household_id: household.id })))
    if (res.error) {
      await db.from('households').delete().eq('id', household.id).eq('user_id', userId)
      check(res, 'Could not save household members')
    }
  }
  return getHousehold(db, userId, household.id)
}

export async function updateHousehold(db, userId, id, body) {
  await ownHousehold(db, userId, id)
  rejectUnknown(body, HOUSEHOLD_FIELDS)
  const fields = householdInput(body, { creating: false })
  if (Object.keys(fields).length) {
    check(await db.from('households').update(fields).eq('id', id).eq('user_id', userId), 'Could not update client')
  }
  return getHousehold(db, userId, id)
}

export async function deleteHousehold(db, userId, id) {
  await ownHousehold(db, userId, id)
  check(await db.from('households').delete().eq('id', id).eq('user_id', userId), 'Could not delete client')
  return { deleted: true }
}

// ---------------------------------------------------------------- members
async function ownMember(db, userId, id) {
  uuid(id, 'member id')
  const m = check(await db.from('household_members').select('*').eq('id', id).eq('user_id', userId).maybeSingle(), 'Could not load member')
  if (!m) throw notFound('Person not found')
  return m
}

export async function addMember(db, userId, householdId, body) {
  await ownHousehold(db, userId, householdId)
  const fields = { role: 'other', ...memberInput(body, { creating: true }) }
  return check(await db.from('household_members').insert({ ...fields, user_id: userId, household_id: householdId }).select('*').single(), 'Could not add person')
}

export async function updateMember(db, userId, id, body, profile) {
  const before = await ownMember(db, userId, id)
  const fields = memberInput(body, { creating: false })
  const updated = check(await db.from('household_members').update(fields).eq('id', id).eq('user_id', userId).select('*').single(), 'Could not update person')
  // Birthday changed → drop the open birthday reminder so it regenerates on the right day.
  if (fields.birthday !== undefined && fields.birthday !== before.birthday) {
    check(await db.from('follow_ups').delete().eq('user_id', userId).eq('member_id', id)
      .eq('kind', 'birthday').in('status', OPEN).gte('due_date', addDays(agentToday(profile), -7)), 'Could not refresh birthday')
  }
  return updated
}

export async function deleteMember(db, userId, id) {
  await ownMember(db, userId, id)
  check(await db.from('household_members').delete().eq('id', id).eq('user_id', userId), 'Could not remove person')
  return { deleted: true }
}

// ---------------------------------------------------------------- schedule
const TEMPLATE_FIELDS = ['id', 'label', 'anchor', 'offset_days', 'offset_months', 'repeat_yearly', 'message_template', 'active']

export async function getTemplates(db, userId) {
  let rows = check(await db.from('follow_up_templates').select('*').eq('user_id', userId).order('sort_order'), 'Could not load schedule')
  if (!rows?.length) {
    rows = check(await db.from('follow_up_templates')
      .insert(DEFAULT_TEMPLATES.map(t => ({ ...t, user_id: userId }))).select('*'), 'Could not create default schedule')
    rows.sort((a, b) => a.sort_order - b.sort_order)
  }
  return rows
}

export async function replaceTemplates(db, userId, body) {
  rejectUnknown(body, ['templates'])
  const list = body.templates
  if (!Array.isArray(list) || list.length > 30) throw badRequest('templates must be a list of up to 30 steps')
  const existing = await getTemplates(db, userId)
  const existingIds = new Set(existing.map(t => t.id))

  const clean = list.map((t, i) => {
    if (!t || typeof t !== 'object' || Array.isArray(t)) throw badRequest(`templates[${i}] must be an object`)
    rejectUnknown(t, TEMPLATE_FIELDS)
    const row = {
      label: str(t, 'label', { max: 80, required: true }),
      anchor: oneOf(t, 'anchor', ANCHORS, { required: true }),
      offset_days: int(t, 'offset_days', { min: -365, max: 3650 }) ?? 0,
      offset_months: int(t, 'offset_months', { min: 0, max: 120 }) ?? 0,
      repeat_yearly: bool(t, 'repeat_yearly') ?? false,
      message_template: str(t, 'message_template', { max: 1000, required: true }),
      active: bool(t, 'active') ?? true,
      sort_order: i,
    }
    if (row.repeat_yearly && !row.offset_months) throw badRequest(`"${row.label}" repeats yearly, so it needs a month offset (12 for once a year)`)
    if (t.id !== undefined && t.id !== null) {
      uuid(t.id, `templates[${i}].id`)
      if (!existingIds.has(t.id)) throw badRequest(`templates[${i}].id does not belong to your schedule`)
      row.id = t.id
    }
    return row
  })

  const keep = new Set(clean.filter(t => t.id).map(t => t.id))
  const removed = existing.filter(t => !keep.has(t.id)).map(t => t.id)
  if (removed.length) check(await db.from('follow_up_templates').delete().eq('user_id', userId).in('id', removed), 'Could not remove steps')
  for (const t of clean.filter(t => t.id)) {
    const { id, ...rest } = t
    check(await db.from('follow_up_templates').update(rest).eq('id', id).eq('user_id', userId), 'Could not update step')
  }
  const added = clean.filter(t => !t.id)
  if (added.length) check(await db.from('follow_up_templates').insert(added.map(t => ({ ...t, user_id: userId }))), 'Could not add steps')
  return getTemplates(db, userId)
}

export async function resetTemplates(db, userId) {
  check(await db.from('follow_up_templates').delete().eq('user_id', userId), 'Could not reset schedule')
  return getTemplates(db, userId)
}

// ---------------------------------------------------------------- policies
async function ownPolicy(db, userId, id) {
  uuid(id, 'policy id')
  const p = check(await db.from('policies').select('*').eq('id', id).eq('user_id', userId).maybeSingle(), 'Could not load policy')
  if (!p) throw notFound('Policy not found')
  return p
}

async function membersOf(db, userId, householdId) {
  return check(await db.from('household_members').select('*').eq('user_id', userId).eq('household_id', householdId).order('sort_order'), 'Could not load members') || []
}

function policyRecipient(policy, members) {
  return members.find(m => m.id === policy.insured_member_id) || primaryMember(members)
}

// Insert the schedule's follow-ups for a policy. Existing rows with the same
// dedupe key (e.g. already done) are left alone.
async function generatePolicyFollowUps(db, userId, profile, policy, household, members) {
  const templates = await getTemplates(db, userId)
  const rows = buildPolicyFollowUps({ policy, templates, today: agentToday(profile) })
  if (!rows.length) return
  const member = policyRecipient(policy, members)
  const vars = buildVars({ household, member, policy, agent: profile })
  const insert = rows.map(r => ({
    user_id: userId,
    household_id: policy.household_id,
    policy_id: policy.id,
    member_id: member?.id || null,
    template_id: r.template_id,
    kind: r.kind,
    label: r.label,
    due_date: r.due_date,
    status: r.status,
    message: renderTemplate(r.message_template, vars).slice(0, 1000),
    dedupe_key: r.dedupe_key,
  }))
  check(await db.from('follow_ups').upsert(insert, { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true }), 'Could not schedule follow-ups')
}

async function logActivity(db, userId, householdId, type, note, followUpId = null) {
  const res = await db.from('activity').insert({ user_id: userId, household_id: householdId, type, note: note ? String(note).slice(0, 2000) : null, follow_up_id: followUpId })
  if (res.error) console.warn('[activity] log failed:', res.error.message)
}

export async function createPolicy(db, userId, profile, householdId, body) {
  const household = await ownHousehold(db, userId, householdId)
  const fields = policyInput(body, { creating: true })
  const members = await membersOf(db, userId, householdId)
  if (fields.insured_member_id && !members.some(m => m.id === fields.insured_member_id)) {
    throw badRequest('insured_member_id must be a person in this household')
  }
  const policy = check(await db.from('policies').insert({ status: 'pending', ...fields, user_id: userId, household_id: householdId }).select('*').single(), 'Could not save policy')
  await generatePolicyFollowUps(db, userId, profile, policy, household, members)
  if (household.status !== 'client') {
    check(await db.from('households').update({ status: 'client' }).eq('id', householdId).eq('user_id', userId), 'Could not update client status')
  }
  await logActivity(db, userId, householdId, 'policy_added', `${policy.carrier}${policy.product ? ' ' + policy.product : ''} policy added`)
  return policy
}

export async function updatePolicy(db, userId, profile, id, body) {
  const before = await ownPolicy(db, userId, id)
  const fields = policyInput(body, { creating: false })
  const members = await membersOf(db, userId, before.household_id)
  if (fields.insured_member_id && !members.some(m => m.id === fields.insured_member_id)) {
    throw badRequest('insured_member_id must be a person in this household')
  }
  const policy = check(await db.from('policies').update(fields).eq('id', id).eq('user_id', userId).select('*').single(), 'Could not update policy')

  const scheduleChanged = ['application_date', 'effective_date', 'first_draft_date', 'status', 'carrier', 'monthly_premium', 'insured_member_id']
    .some(k => fields[k] !== undefined && fields[k] !== before[k])
  if (scheduleChanged) {
    if (policy.status === 'cancelled') {
      check(await db.from('follow_ups').update({ status: 'skipped', completed_at: new Date().toISOString() })
        .eq('user_id', userId).eq('policy_id', id).in('status', OPEN), 'Could not update follow-ups')
    } else {
      // Recalculate: drop still-open scheduled follow-ups, then regenerate.
      // Done / skipped ones stay as history.
      check(await db.from('follow_ups').delete().eq('user_id', userId).eq('policy_id', id)
        .in('status', OPEN).in('kind', ['policy', 'annual_review']), 'Could not update follow-ups')
      const household = await ownHousehold(db, userId, policy.household_id)
      await generatePolicyFollowUps(db, userId, profile, policy, household, members)
    }
  }
  return policy
}

export async function deletePolicy(db, userId, id) {
  await ownPolicy(db, userId, id)
  check(await db.from('policies').delete().eq('id', id).eq('user_id', userId), 'Could not delete policy')
  return { deleted: true }
}

// ---------------------------------------------------------------- follow-ups
async function ownFollowUp(db, userId, id) {
  uuid(id, 'follow-up id')
  const f = check(await db.from('follow_ups').select('*').eq('id', id).eq('user_id', userId).maybeSingle(), 'Could not load follow-up')
  if (!f) throw notFound('Follow-up not found')
  return f
}

export async function createManualFollowUp(db, userId, householdId, body) {
  await ownHousehold(db, userId, householdId)
  rejectUnknown(body, ['label', 'due_date', 'message', 'member_id'])
  const row = {
    user_id: userId,
    household_id: householdId,
    kind: 'manual',
    label: str(body, 'label', { max: 120, required: true }),
    due_date: date(body, 'due_date', { required: true }),
    message: str(body, 'message', { max: 1000 }),
    status: 'pending',
  }
  if (body.member_id) {
    const m = await ownMember(db, userId, body.member_id)
    if (m.household_id !== householdId) throw badRequest('member_id must be a person in this household')
    row.member_id = m.id
  }
  return check(await db.from('follow_ups').insert(row).select('*').single(), 'Could not add follow-up')
}

export async function updateFollowUp(db, userId, id, body) {
  await ownFollowUp(db, userId, id)
  rejectUnknown(body, ['label', 'due_date', 'message'])
  const fields = compact({
    label: str(body, 'label', { max: 120 }),
    due_date: date(body, 'due_date'),
    message: str(body, 'message', { max: 1000 }),
  })
  if (fields.label === null) throw badRequest('label cannot be empty')
  if (fields.due_date === null) throw badRequest('due_date cannot be empty')
  return check(await db.from('follow_ups').update(fields).eq('id', id).eq('user_id', userId).select('*').single(), 'Could not update follow-up')
}

export async function deleteFollowUp(db, userId, id) {
  const f = await ownFollowUp(db, userId, id)
  if (f.kind !== 'manual') throw badRequest('Only follow-ups you added yourself can be deleted. Skip it instead.')
  check(await db.from('follow_ups').delete().eq('id', id).eq('user_id', userId), 'Could not delete follow-up')
  return { deleted: true }
}

// After an annual review is closed, schedule next year's.
async function scheduleNextAnnual(db, userId, profile, f) {
  if (f.kind !== 'annual_review' || !f.policy_id || !f.template_id) return
  const [policy, template] = await Promise.all([
    db.from('policies').select('*').eq('id', f.policy_id).eq('user_id', userId).maybeSingle(),
    db.from('follow_up_templates').select('*').eq('id', f.template_id).eq('user_id', userId).maybeSingle(),
  ])
  if (!policy.data || !template.data) return
  const next = nextOccurrence({ policy: policy.data, template: template.data, occurrence: occurrenceFromKey(f.dedupe_key) || 1 })
  if (!next) return
  const household = await ownHousehold(db, userId, f.household_id)
  const members = await membersOf(db, userId, f.household_id)
  const member = policyRecipient(policy.data, members)
  const message = renderTemplate(next.message_template, buildVars({ household, member, policy: policy.data, agent: profile }))
  check(await db.from('follow_ups').upsert({
    user_id: userId, household_id: f.household_id, policy_id: f.policy_id, member_id: member?.id || null,
    template_id: f.template_id, kind: next.kind, label: next.label, due_date: next.due_date,
    status: 'pending', message: message.slice(0, 1000), dedupe_key: next.dedupe_key,
  }, { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true }), 'Could not schedule next review')
}

// action: opened | done | skip | reopen
export async function followUpAction(db, userId, profile, id, action, body = {}) {
  const f = await ownFollowUp(db, userId, id)
  const now = new Date().toISOString()
  let fields
  if (action === 'opened') {
    fields = { status: 'opened', opened_at: now }
    await logActivity(db, userId, f.household_id, 'text_opened', `Opened text: ${f.label}`, f.id)
  } else if (action === 'done') {
    rejectUnknown(body, ['via', 'note'])
    const via = oneOf(body, 'via', ['text', 'call', 'other']) || 'text'
    const note = str(body, 'note', { max: 500 })
    fields = { status: 'done', completed_at: now }
    await logActivity(db, userId, f.household_id, via === 'call' ? 'call' : 'text_sent', note || f.label, f.id)
    check(await db.from('households').update({ last_contact_at: now }).eq('id', f.household_id).eq('user_id', userId), 'Could not update client')
  } else if (action === 'skip') {
    fields = { status: 'skipped', completed_at: now }
    await logActivity(db, userId, f.household_id, 'follow_up_skipped', `Skipped: ${f.label}`, f.id)
  } else if (action === 'reopen') {
    fields = { status: 'pending', opened_at: null, completed_at: null }
  } else {
    throw notFound('Unknown action')
  }
  const updated = check(await db.from('follow_ups').update(fields).eq('id', id).eq('user_id', userId).select('*').single(), 'Could not update follow-up')
  if (action === 'done' || action === 'skip') await scheduleNextAnnual(db, userId, profile, f)
  return updated
}

export async function logHouseholdActivity(db, userId, householdId, body) {
  await ownHousehold(db, userId, householdId)
  rejectUnknown(body, ['type', 'note'])
  const type = oneOf(body, 'type', ['call', 'note', 'text_sent'], { required: true })
  const note = str(body, 'note', { max: 2000 })
  const row = check(await db.from('activity').insert({ user_id: userId, household_id: householdId, type, note }).select('*').single(), 'Could not save')
  if (type !== 'note') {
    check(await db.from('households').update({ last_contact_at: row.created_at }).eq('id', householdId).eq('user_id', userId), 'Could not update client')
  }
  return row
}

// ---------------------------------------------------------------- birthdays
// Creates birthday follow-ups for every member whose birthday falls in the
// window. Safe to call repeatedly (dedupe key per member per date).
export async function ensureBirthdayFollowUps(db, userId, profile, start, end) {
  const [members, households] = await Promise.all([
    fetchAll(() => db.from('household_members').select('id, household_id, role, first_name, last_name, birthday, phone')
      .eq('user_id', userId).not('birthday', 'is', null), 'Could not load birthdays'),
    fetchAll(() => db.from('households').select('id, display_name, phone, status').eq('user_id', userId), 'Could not load clients'),
  ])
  const hById = Object.fromEntries(households.map(h => [h.id, h]))
  const allMembers = await fetchAll(() => db.from('household_members').select('id, household_id, role, first_name').eq('user_id', userId), 'Could not load members')
  const primaryBy = {}
  for (const m of allMembers) {
    if (m.role === 'policyholder' && !primaryBy[m.household_id]) primaryBy[m.household_id] = m
  }

  const today = agentToday(profile)
  const rows = birthdaysInWindow(members, start, end, today)
    .filter(b => hById[b.member.household_id] && hById[b.member.household_id].status !== 'inactive')
    .map(b => {
      const m = b.member
      const h = hById[m.household_id]
      const toParent = m.role === 'child' && !m.phone
      const parent = primaryBy[m.household_id]
      const vars = {
        ...buildVars({ household: h, member: m, agent: profile, turning: b.turning }),
        parent_first_name: firstNameOf(parent, h),
      }
      return {
        user_id: userId,
        household_id: m.household_id,
        member_id: m.id,
        kind: 'birthday',
        label: `${m.first_name}'s birthday${b.turning ? ` (turns ${b.turning})` : ''}`,
        due_date: b.due_date,
        status: 'pending',
        message: renderTemplate(toParent ? CHILD_BIRTHDAY_TEMPLATE : BIRTHDAY_TEMPLATE, vars),
        dedupe_key: `bday:${m.id}:${b.due_date}`,
      }
    })
  if (rows.length) {
    check(await db.from('follow_ups').upsert(rows, { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true }), 'Could not schedule birthdays')
  }
}

// ---------------------------------------------------------------- today
export async function getToday(db, userId, profile) {
  const today = agentToday(profile)
  const weekEnd = addDays(today, 7)
  await ensureBirthdayFollowUps(db, userId, profile, addDays(today, -3), weekEnd)

  const [open, doneThisWeek, policies, households, members] = await Promise.all([
    fetchAll(() => db.from('follow_ups').select('*').eq('user_id', userId).in('status', OPEN).lte('due_date', weekEnd).order('due_date'), 'Could not load follow-ups'),
    db.from('follow_ups').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'done')
      .gte('completed_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    fetchAll(() => db.from('policies').select('status, monthly_premium').eq('user_id', userId).neq('status', 'cancelled'), 'Could not load policies'),
    fetchAll(() => db.from('households').select('id, display_name, phone, status').eq('user_id', userId), 'Could not load clients'),
    fetchAll(() => db.from('household_members').select('id, household_id, role, first_name, last_name, phone').eq('user_id', userId), 'Could not load members'),
  ])
  check(doneThisWeek, 'Could not load stats')

  const hById = Object.fromEntries(households.map(h => [h.id, h]))
  const mById = Object.fromEntries(members.map(m => [m.id, m]))
  const items = open.map(f => {
    const h = hById[f.household_id] || {}
    const m = f.member_id ? mById[f.member_id] : null
    const toParent = f.kind === 'birthday' && m?.role === 'child' && !m.phone
    return {
      id: f.id,
      kind: f.kind,
      label: f.label,
      due_date: f.due_date,
      status: f.status,
      message: f.message || '',
      household: { id: f.household_id, display_name: h.display_name || 'Client' },
      person: m ? `${m.first_name}${m.last_name ? ' ' + m.last_name : ''}` : h.display_name,
      phone: (!toParent && m?.phone) || h.phone || null,
    }
  })

  const groups = groupForToday(items, today)
  return {
    date: today, // the agent's local date; `today` below is the list of people due today
    timezone: profile?.timezone || 'America/New_York',
    overdue: groups.overdue,
    today: groups.today,
    this_week: groups.this_week,
    stats: {
      due_today: groups.today.length,
      overdue: groups.overdue.length,
      done_this_week: doneThisWeek.count || 0,
      active_policies: policies.filter(p => p.status === 'active').length,
      pending_policies: policies.filter(p => p.status === 'pending').length,
      monthly_premium: Math.round(policies.reduce((s, p) => s + Number(p.monthly_premium || 0), 0) * 100) / 100,
      clients: households.filter(h => h.status === 'client').length,
    },
  }
}

// ---------------------------------------------------------------- timeline
// One list, oldest first, of everything for a household: policies written,
// follow-ups (done, skipped, upcoming), activity, and the next birthday of
// every member. `is_today_marker` separates past from future.
export async function getTimeline(db, userId, profile, householdId) {
  const detail = await getHousehold(db, userId, householdId)
  const today = agentToday(profile)
  const tz = isValidTimeZone(profile?.timezone) ? profile.timezone : 'America/New_York'
  const memberById = Object.fromEntries(detail.members.map(m => [m.id, m]))
  const items = []

  for (const p of detail.policies) {
    if (p.application_date) {
      items.push({ type: 'policy_written', date: p.application_date, policy_id: p.id,
        title: `${p.carrier}${p.product ? ' ' + p.product : ''} policy written`,
        subtitle: [p.face_amount != null ? `$${Number(p.face_amount).toLocaleString('en-US')} coverage` : null,
          p.monthly_premium != null ? `$${Number(p.monthly_premium).toFixed(2)}/mo` : null].filter(Boolean).join(' · ') })
    }
  }

  const birthdayKeys = new Set()
  for (const f of detail.follow_ups) {
    if (f.kind === 'birthday') birthdayKeys.add(`${f.member_id}:${f.due_date}`)
    const m = f.member_id ? memberById[f.member_id] : null
    items.push({ type: 'follow_up', date: f.due_date, follow_up: f, title: f.label,
      subtitle: m ? `${m.first_name}${m.last_name ? ' ' + m.last_name : ''}` : null })
  }

  for (const m of detail.members) {
    const next = nextBirthday(m.birthday, today)
    if (next && !birthdayKeys.has(`${m.id}:${next}`)) {
      items.push({ type: 'birthday', date: next, member_id: m.id,
        title: `${m.first_name}'s birthday`, subtitle: `Turns ${ageOn(m.birthday, next)}` })
    }
  }

  for (const a of detail.activity) {
    if (a.follow_up_id && ['text_opened', 'follow_up_skipped'].includes(a.type)) continue // already shown on the follow-up
    items.push({ type: 'activity', date: todayIn(tz, new Date(a.created_at)), activity: a,
      title: ACTIVITY_TITLES[a.type] || 'Note', subtitle: a.note })
  }

  items.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  return { today, household: { id: detail.id, display_name: detail.display_name }, items }
}

const ACTIVITY_TITLES = {
  text_opened: 'Opened a text',
  text_sent: 'Texted',
  call: 'Called',
  note: 'Note',
  policy_added: 'Policy added',
  follow_up_skipped: 'Skipped a follow-up',
  imported: 'From old CRM history',
}

// ---------------------------------------------------------------- profile
const PROFILE_FIELDS = ['full_name', 'phone', 'agency_name', 'timezone']
export async function updateProfile(db, userId, body) {
  rejectUnknown(body, PROFILE_FIELDS)
  const fields = compact({
    full_name: str(body, 'full_name', { max: 120 }),
    phone: str(body, 'phone', { max: 40 }),
    agency_name: str(body, 'agency_name', { max: 120 }),
    timezone: str(body, 'timezone', { max: 64 }),
  })
  if (fields.timezone && !isValidTimeZone(fields.timezone)) throw badRequest('timezone must be a valid time zone like America/Chicago')
  return check(await db.from('profiles').update(fields).eq('id', userId).select('id, full_name, phone, agency_name, timezone, created_at, subscription_status, subscription_plan, team_id, team_role, referral_code').single(), 'Could not save profile')
}

export function publicProfile(profile) {
  const p = profile || {}
  return {
    id: p.id, full_name: p.full_name || '', phone: p.phone || '', agency_name: p.agency_name || p.brokerage || '',
    timezone: p.timezone || 'America/New_York', created_at: p.created_at,
    subscription_status: p.subscription_status || null, subscription_plan: p.subscription_plan || null,
    team_id: p.team_id || null, team_role: p.team_role || null, referral_code: p.referral_code || null,
  }
}

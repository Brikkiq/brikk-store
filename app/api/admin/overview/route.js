// Admin overview — server-side only. Who is an admin comes from the
// ADMIN_EMAILS env var (comma-separated), never from code shipped to browsers.
import { handle, ok, ApiError, check } from '@/lib/server/http'
import { adminClient, verifyToken } from '@/lib/server/auth'

function adminEmails() {
  return String(process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
}

export const GET = handle(async (request) => {
  const user = await verifyToken(request)
  if (!user) throw new ApiError(401, 'unauthorized', 'Sign in required')
  if (!user.email || !adminEmails().includes(user.email.toLowerCase())) {
    throw new ApiError(403, 'forbidden', 'Not an admin')
  }

  const admin = adminClient()
  const profiles = check(await admin.from('profiles')
    .select('id, full_name, agency_name, created_at, subscription_status, subscription_plan, team_id, team_role')
    .order('created_at', { ascending: false }).limit(1000), 'Could not load users')

  const count = async (table, extra) => {
    let q = admin.from(table).select('user_id')
    if (extra) q = extra(q)
    const rows = []
    for (let from = 0; ; from += 1000) {
      const { data, error } = await q.range(from, from + 999)
      if (error) return {}
      rows.push(...data)
      if (data.length < 1000) break
    }
    return rows.reduce((m, r) => ((m[r.user_id] = (m[r.user_id] || 0) + 1), m), {})
  }
  const [households, policies, done] = await Promise.all([
    count('households'),
    count('policies', q => q.neq('status', 'cancelled')),
    count('follow_ups', q => q.eq('status', 'done')),
  ])

  // Emails come from auth (paged).
  const emails = {}
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !data?.users?.length) break
    for (const u of data.users) emails[u.id] = u.email
    if (data.users.length < 1000) break
  }

  return ok(profiles.map(p => ({
    ...p,
    email: emails[p.id] || null,
    households: households[p.id] || 0,
    policies: policies[p.id] || 0,
    follow_ups_done: done[p.id] || 0,
  })))
})

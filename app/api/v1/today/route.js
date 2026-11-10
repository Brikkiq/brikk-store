import { handle, ok } from '@/lib/server/http'
import { requireUser } from '@/lib/server/auth'
import { getToday } from '@/lib/server/book'

// GET /api/v1/today — overdue, today, this week + stats, in the agent's time zone.
export const GET = handle(async (request) => {
  const { user, db, profile } = await requireUser(request)
  return ok(await getToday(db, user.id, profile))
})

import { handle, ok, readJson } from '@/lib/server/http'
import { requireUser } from '@/lib/server/auth'
import { logHouseholdActivity } from '@/lib/server/book'

// POST /api/v1/households/:id/activity — log a call or a note.
export const POST = handle(async (request, { params }) => {
  const { id } = await params
  const { user, db } = await requireUser(request)
  return ok(await logHouseholdActivity(db, user.id, id, await readJson(request)), 201)
})

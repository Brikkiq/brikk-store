import { handle, ok, readJson } from '@/lib/server/http'
import { requireUser } from '@/lib/server/auth'
import { createManualFollowUp } from '@/lib/server/book'

// POST /api/v1/households/:id/follow-ups — add a one-off reminder.
export const POST = handle(async (request, { params }) => {
  const { id } = await params
  const { user, db } = await requireUser(request)
  return ok(await createManualFollowUp(db, user.id, id, await readJson(request)), 201)
})

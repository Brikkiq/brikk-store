import { handle, ok, readJson } from '@/lib/server/http'
import { requireUser } from '@/lib/server/auth'
import { updateFollowUp, deleteFollowUp } from '@/lib/server/book'

// PATCH: change label, due_date or message of one follow-up.
export const PATCH = handle(async (request, { params }) => {
  const { id } = await params
  const { user, db } = await requireUser(request)
  return ok(await updateFollowUp(db, user.id, id, await readJson(request)))
})

export const DELETE = handle(async (request, { params }) => {
  const { id } = await params
  const { user, db } = await requireUser(request)
  return ok(await deleteFollowUp(db, user.id, id))
})

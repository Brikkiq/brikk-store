import { handle, ok, readJson } from '@/lib/server/http'
import { requireUser } from '@/lib/server/auth'
import { updatePolicy, deletePolicy } from '@/lib/server/book'

// Changing dates/status recalculates the policy's open follow-ups.
export const PATCH = handle(async (request, { params }) => {
  const { id } = await params
  const { user, db, profile } = await requireUser(request)
  return ok(await updatePolicy(db, user.id, profile, id, await readJson(request)))
})

export const DELETE = handle(async (request, { params }) => {
  const { id } = await params
  const { user, db } = await requireUser(request)
  return ok(await deletePolicy(db, user.id, id))
})

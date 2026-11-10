import { handle, ok, readJson } from '@/lib/server/http'
import { requireUser } from '@/lib/server/auth'
import { updateMember, deleteMember } from '@/lib/server/book'

export const PATCH = handle(async (request, { params }) => {
  const { id } = await params
  const { user, db, profile } = await requireUser(request)
  return ok(await updateMember(db, user.id, id, await readJson(request), profile))
})

export const DELETE = handle(async (request, { params }) => {
  const { id } = await params
  const { user, db } = await requireUser(request)
  return ok(await deleteMember(db, user.id, id))
})

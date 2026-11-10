import { handle, ok, readJson } from '@/lib/server/http'
import { requireUser } from '@/lib/server/auth'
import { getHousehold, updateHousehold, deleteHousehold } from '@/lib/server/book'

export const GET = handle(async (request, { params }) => {
  const { id } = await params
  const { user, db } = await requireUser(request)
  return ok(await getHousehold(db, user.id, id))
})

export const PATCH = handle(async (request, { params }) => {
  const { id } = await params
  const { user, db } = await requireUser(request)
  return ok(await updateHousehold(db, user.id, id, await readJson(request)))
})

export const DELETE = handle(async (request, { params }) => {
  const { id } = await params
  const { user, db } = await requireUser(request)
  return ok(await deleteHousehold(db, user.id, id))
})

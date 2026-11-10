import { handle, ok, readJson } from '@/lib/server/http'
import { requireUser } from '@/lib/server/auth'
import { addMember } from '@/lib/server/book'

export const POST = handle(async (request, { params }) => {
  const { id } = await params
  const { user, db } = await requireUser(request)
  return ok(await addMember(db, user.id, id, await readJson(request)), 201)
})

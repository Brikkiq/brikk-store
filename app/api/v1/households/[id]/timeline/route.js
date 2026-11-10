import { handle, ok } from '@/lib/server/http'
import { requireUser } from '@/lib/server/auth'
import { getTimeline } from '@/lib/server/book'

export const GET = handle(async (request, { params }) => {
  const { id } = await params
  const { user, db, profile } = await requireUser(request)
  return ok(await getTimeline(db, user.id, profile, id))
})

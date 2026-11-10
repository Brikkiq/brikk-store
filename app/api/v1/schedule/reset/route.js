import { handle, ok } from '@/lib/server/http'
import { requireUser } from '@/lib/server/auth'
import { resetTemplates } from '@/lib/server/book'

export const POST = handle(async (request) => {
  const { user, db } = await requireUser(request)
  return ok(await resetTemplates(db, user.id))
})

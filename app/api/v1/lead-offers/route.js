import { handle, ok } from '@/lib/server/http'
import { requireUser } from '@/lib/server/auth'

// Lead store — still in development. Always returns an empty list for now so
// the web and mobile apps can build against the final shape.
export const GET = handle(async (request) => {
  await requireUser(request)
  return ok({ status: 'in_development', offers: [] })
})

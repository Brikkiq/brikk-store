import { handle, ok, readJson } from '@/lib/server/http'
import { requireUser } from '@/lib/server/auth'
import { createPolicy } from '@/lib/server/book'

// Creating a policy also schedules its follow-ups from the agent's schedule.
export const POST = handle(async (request, { params }) => {
  const { id } = await params
  const { user, db, profile } = await requireUser(request)
  return ok(await createPolicy(db, user.id, profile, id, await readJson(request)), 201)
})

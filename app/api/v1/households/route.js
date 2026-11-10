import { handle, ok, readJson } from '@/lib/server/http'
import { requireUser } from '@/lib/server/auth'
import { listHouseholds, createHousehold } from '@/lib/server/book'

// GET /api/v1/households?q=smith&status=client — the agent's Book.
export const GET = handle(async (request) => {
  const { user, db } = await requireUser(request)
  const { searchParams } = new URL(request.url)
  return ok(await listHouseholds(db, user.id, { q: searchParams.get('q'), status: searchParams.get('status') }))
})

// POST /api/v1/households — create a household with its members.
export const POST = handle(async (request) => {
  const { user, db } = await requireUser(request)
  return ok(await createHousehold(db, user.id, await readJson(request)), 201)
})

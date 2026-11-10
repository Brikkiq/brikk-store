import { handle, ok, readJson } from '@/lib/server/http'
import { requireUser } from '@/lib/server/auth'
import { getTemplates, replaceTemplates } from '@/lib/server/book'

// GET: the agent's follow-up schedule (created from defaults on first call).
export const GET = handle(async (request) => {
  const { user, db } = await requireUser(request)
  return ok(await getTemplates(db, user.id))
})

// PUT { templates: [...] } — replaces the whole schedule. Applies to policies added afterwards.
export const PUT = handle(async (request) => {
  const { user, db } = await requireUser(request)
  return ok(await replaceTemplates(db, user.id, await readJson(request)))
})

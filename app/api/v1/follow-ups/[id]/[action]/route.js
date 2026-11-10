import { handle, ok, readJson } from '@/lib/server/http'
import { requireUser } from '@/lib/server/auth'
import { followUpAction } from '@/lib/server/book'

// POST /api/v1/follow-ups/:id/opened|done|skip|reopen
//   opened — the agent tapped Text (the Messages app opened). NOT "sent".
//   done   — the agent confirmed they sent it (body: { via: 'text'|'call'|'other', note? }).
export const POST = handle(async (request, { params }) => {
  const { id, action } = await params
  const { user, db, profile } = await requireUser(request)
  return ok(await followUpAction(db, user.id, profile, id, action, await readJson(request)))
})

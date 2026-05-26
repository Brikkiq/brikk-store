# Brikk — architecture guide

For developers, contractors, and freelancers joining the codebase. Read this before opening a PR.

---

## High-level shape

```
[Browser / iOS PWA / Android PWA]
            │
            │  HTTPS
            ▼
[ Vercel-hosted Next.js 14 (App Router) ]
            │
            ├──→ [ Supabase Postgres + Auth + Realtime ]   (user data)
            ├──→ [ Anthropic Claude Sonnet 4.5 ]            (AI features)
            ├──→ [ Stripe ]                                  (payments)
            ├──→ [ Resend ]                                  (email)
            └──→ [ Google Calendar API ]                     (calendar sync)
```

There's no separate backend service. Every server-side concern is a Next.js route handler at `app/api/.../route.js`. Every client-side concern is a `'use client'` page or component.

**Mobile**: there is no separate native codebase. iOS and Android apps are Capacitor wrappers that load `brikk.store` inside a WebView. Same code, same updates, no app-store resubmission per release. See `capacitor.config.ts` and `ios-handoff/`.

---

## Key directories

### `app/` — pages and routes (Next.js App Router)

Every folder under `app/` is a route. `page.js` files are pages. `layout.js` files are layouts. `route.js` files are API endpoints.

- `app/page.js` — marketing landing page (public)
- `app/layout.js` — root layout (metadata, viewport, icons)
- `app/app/...` — the logged-in product (protected by trial gate in `app/app/layout.js`)
- `app/api/...` — server-side endpoints

**Important client/server boundary:** anything with `'use client'` at the top runs in the browser. Anything in `app/api/` runs server-side only. Never put service-role keys or other secrets anywhere outside `app/api/` and `lib/` server-imports.

### `lib/` — shared utilities

Rule: if it's used in more than one place, it goes in `lib/`. If it's used in one place, it stays inline.

Notable files:

- `lib/design.js` — **all design tokens**. Colors (`c.text`, `c.green`, etc.), typography (`type.eyebrow`), shared style objects (`btn.primary`, `input`, `card`). Never use a hex color directly in a component — pull it from here. This is the only source of truth for visual consistency.
- `lib/supabase.js` — the browser-side Supabase client. Server code creates its own via `createClient(supabaseUrl, serviceKey)`.
- `lib/trial.js` — trial state machine. `getTrialState({profile, team})` returns `{ state, daysLeft, message }`. Used by the app layout to gate access.
- `lib/email.js` — `sendEmail(...)` wrapper around Resend + the `buildLeadConfirmationEmail` template.
- `lib/Voice.js` — the floating voice button, mounted globally in `app/app/layout.js`. Records, transcribes via Web Speech API, sends to `/api/copilot` mode `voice_extract`.
- `lib/integrations/` — calendar sync and other external integrations. Encryption + Google Calendar API wrapper + push-to-Google functions.

### `app/api/` — server routes

- **`copilot/route.js`** — multi-mode AI endpoint. Single handler that dispatches on `body.mode`: `draft` (default), `voice_extract`, `lead_summary`, `parse_chat_history`, `help_chat`, `sentiment`. Add new AI features as new modes — don't make new endpoints.
- **`refer/route.js`** — public lead-capture POST. Bypasses RLS via service-role key to insert leads on behalf of an agent.
- **`stripe/route.js`** — creates Stripe Checkout sessions. Reads price IDs from env vars.
- **`stripe/webhook/route.js`** — receives Stripe events, verifies HMAC, updates `profiles.subscription_status` and `teams.status` accordingly. Sends trial-ending emails via Resend.
- **`stripe/portal/route.js`** — opens Stripe Customer Portal for the authenticated user.
- **`integrations/google/*.js`** — OAuth flow + status + disconnect + sync trigger + poll cron.
- **`cron/morning-brief/route.js`** — Vercel daily cron at 14:00 UTC. Paginates all users, generates personalized briefing emails.
- **`team/route.js`** — team CRUD: create, join, leave, remove member, regenerate code, delete.

---

## Database schema

Source of truth: `supabase-migration.sql` (initial) + every file in `sql/` that's been run.

Top-level tables:

- **`profiles`** — one row per user. Pulls `id` from `auth.users(id)`. Stores full_name, brokerage, phone, referral_code, team_id, team_role, stripe_*, subscription_*, annual_commission_goal, conversion_rate_estimate.
- **`leads`** — agent's pipeline. `user_id` FK to auth.users. Temperature (hot/warm/cold), stage, source, price_range, notes, birthday, address, preferred_area, contact_preference, pre_approved, timeline, etc.
- **`deals`** — under-contract through closing. Has `client_token` (public tracker URL), `lead_id` FK (auto-syncs client_name via trigger), `stage`, `progress`, `commission`, `close_date`.
- **`messages`** — per-lead conversation history. Direction (`inbound`/`outbound`), channel (`text`/`email`/`manual`), content, `sentiment` (AI-classified for inbound).
- **`interactions`** — non-message events on a lead (call logged, voice note saved, etc.).
- **`teams`** — team/agency rows. `team_code`, `plan_tier` (`team`/`agency`), `owner_id`, `max_seats`, `stripe_*`, `status`.
- **`referrals`** — agent's referral ledger. `direction` (`received`/`given`), party + client info, `status`, `expected_commission`, `actual_commission`.
- **`offers`** — multi-offer comparison sheet rows per listing.
- **`checklist_items`** — listing-prep + transaction tasks tied to a deal or lead.
- **`integrations`** — per-user OAuth tokens for external services (Google Calendar today). Tokens encrypted at rest via `lib/integrations/encrypt.js`.
- **`calendar_event_sync`** — maps Brikk entities (leads, deals, birthdays, anniversaries) to Google event IDs. Lets us PATCH instead of POST on re-sync.

Every table has RLS enabled. The standard policy is `user_id = auth.uid()` on all operations.

Read `SCHEMA-REFERENCE.md` for column-by-column annotations.

---

## Conventions

### Styling
- All colors, fonts, spacing tokens come from `lib/design.js`. Don't write `#1A1A18` in a component — write `c.text`.
- Inline styles via the `style={{...}}` prop are the norm in this codebase (no Tailwind, no CSS-in-JS framework). It's simpler for solo-dev velocity.
- Media queries go in inline `<style>` blocks at the top of pages when needed.
- Mobile breakpoint: 700px. Tablet: 1024px. Desktop: 1200px+.
- Inputs must be >=16px font-size on mobile to prevent iOS Safari auto-zoom.

### React patterns
- Pages are mostly `'use client'`. Server-side data fetching happens in API routes, not page components. The pages do their own loading via Supabase client in `useEffect`.
- State is local component state via `useState`. No global state library (Redux/Zustand). Real-time updates come via Supabase Realtime subscriptions.
- Toast notifications use a local `toast` state with auto-dismiss timeout. Pattern is `const [toast, setToast] = useState(null)` + `showToast(msg, kind)`.

### API routes
- Always validate input. Even if the client just filtered it, the server should validate again (defense in depth).
- Always scope queries by `user_id` even though RLS will do the same. Belt + suspenders.
- Always use the service-role key inside `/api/` for admin queries, never expose it to the client.
- Error responses: `NextResponse.json({ error: 'message' }, { status: 400 })`. Don't throw stack traces back to clients.
- Stripe webhooks must verify HMAC signature before processing the event. See `app/api/stripe/webhook/route.js` for the pattern.

### AI calls (Anthropic)
- All AI calls go through `app/api/copilot/route.js`. Don't call Anthropic from the browser (key would leak).
- Model: `claude-sonnet-4-5` (or whatever's set in the route file). Keep `max_tokens` tight — most prompts need <500 output tokens.
- Mode dispatch: add new AI features as new `body.mode === '...'` branches in the same file. Don't create new endpoints for new AI features.
- Always wrap Anthropic calls in try/catch. On error, return a fallback response so the UX doesn't break.

### Email sending
- Use `lib/email.js → sendEmail({ ... })`. Always `await` the call — never fire-and-forget (Vercel may terminate the function before the request completes).
- Resend's free tier is 3,000 emails/month. Don't accidentally loop a send call.

### Supabase queries
- Browser-side: import `supabase` from `lib/supabase.js`. RLS policies enforce row ownership.
- Server-side: create a fresh client with `createClient(supabaseUrl, serviceKey)` inside the route handler. Don't reuse across requests (Supabase client is not thread-safe).
- Realtime subscriptions: clean up in `useEffect`'s return function. Otherwise you get duplicate listeners on hot reload.

### Stripe
- Use restricted API keys in production (`rk_live_…`), never the unrestricted `sk_live_`.
- Price IDs come from env vars `STRIPE_PRICE_PRO` and `STRIPE_PRICE_TEAM`. Don't hardcode them.
- Always verify webhook signatures. Always.
- Customer Portal handles cancellations — don't write your own cancel flow.

### Date/time
- Store all dates as ISO 8601 UTC strings. Display in user's local timezone.
- Use `fmt.relativeDate(d)`, `fmt.daysSince(d)`, `fmt.daysUntil(d)` from `lib/design.js` for display.
- For phones: `fmt.phone(rawDigits)` formats as `(555) 123-4567`.

---

## Adding a new feature — checklist

1. **Does it need new DB columns or tables?** Write a new SQL file in `sql/`. Make it idempotent (`IF NOT EXISTS`, `IF NOT EXISTS DROP THEN CREATE`). RLS policies for any new tables. Henry runs it in Supabase SQL Editor.
2. **Does it need new env vars?** Update `.env.example` with comments explaining what each is for and how to obtain the value.
3. **Does it need new server-side logic?** Add to `app/api/` or `lib/` (server functions). Use service-role key only inside `app/api/`.
4. **Does it need a new page?** Create `app/.../page.js`. Add `'use client'` if it has interactivity.
5. **Does it need UI in an existing page?** Pull from `lib/design.js` for styling. Match the inline-style pattern used elsewhere.
6. **Does it need real-time updates?** Use Supabase Realtime subscription. Add the table to the realtime publication via SQL.
7. **Does it surface to the user?** Add to `app/roadmap/page.js` SHIPPED section once live.
8. **Does it touch sensitive data?** Always `user_id = auth.uid()` scoped, RLS enabled, defense-in-depth filters in app code.
9. **Does it add a recurring task?** Update `vercel.json` cron config with the schedule. Add auth via `CRON_SECRET`.

---

## Anti-patterns to avoid

- **Don't add Tailwind/CSS modules/styled-components.** Inline styles + `lib/design.js` is the convention. Adding another styling system would fragment the codebase.
- **Don't add a state-management library.** Local state + Supabase Realtime is enough for the foreseeable future.
- **Don't add `localStorage` writes that could be useful for sync.** Use Supabase. localStorage is for UI preferences (dark mode toggle, etc.) only.
- **Don't import Twilio.** The codebase removed Twilio in favor of native `sms:` deep links. Re-introducing it requires TCPA compliance work (see `OPERATIONS-RUNBOOK.md`).
- **Don't write to the database from the marketing site (public pages outside `/app`).** All writes flow through `/api/` routes which validate.
- **Don't put real credentials in code.** Use env vars. Use `process.env.X || 'fallback'` only when the fallback is genuinely safe (e.g., default app URL).
- **Don't skip RLS.** Every new table gets RLS enabled + a policy scoping rows to `user_id = auth.uid()`.

---

## When something breaks

1. **First check**: Vercel deployment logs. Errors usually surface at the build or runtime layer.
2. **Then**: Supabase logs (Dashboard → Logs).
3. **Then**: Resend logs for any email-related issues.
4. **Then**: Stripe dashboard for any billing issues.

Full incident playbook in `OPERATIONS-RUNBOOK.md`.

---

## File creation rules

- All files use Unix LF line endings (Vercel runs on Linux).
- All filenames use lowercase + hyphens (e.g., `lead-detail.js`), except React component files which match the component name (`Logo.js`).
- Page files are always named `page.js`. Layout files are always `layout.js`. API routes are always `route.js`. This is Next.js App Router convention.

---

## Last updated

May 21, 2026. If you change the codebase in a way that contradicts this document, update this document in the same PR.

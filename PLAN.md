# PLAN.md — Converting Brikk (real estate) into a life insurance agent CRM

Written Nov 10, 2026. Rollback point: commit `5b18164` ("layout v.21") on `main`.
`git checkout 5b18164` (or `git reset --hard 5b18164` on a branch) returns to the real-estate app.

Each step is small, ends with `npm run build` passing, and is one commit. Do them in order:
later steps depend on earlier ones. Steps marked **[Henry]** need you (SQL Editor, env vars,
dashboards, approvals).

---

## Decisions already made

| Topic | Decision |
|---|---|
| Existing data | **Convert in place.** Same Supabase project, same users, same Stripe customers. Changes are additive first; old tables are dropped only at the very end, after an export and your approval. |
| Policies | A household can have **multiple policies**. Each policy has its own follow-up schedule. |
| Schedule anchor | Thank-you + 30/60/90/6-month + annual review count from the **application date**. The two draft checks count from the **first draft date**. |
| AI | **Cut for v1.** No voice assistant, no Copilot, no conversation parsing, no sentiment, no AI help chat. Follow-up texts come from editable templates. |
| Health info | Never stored. No health fields in any table, API validation rejects unknown fields, and the household notes field shows a "no health information" warning. |
| Texting | Native `sms:` links that open the agent's own Messages app. No Twilio or any SMS service. |
| UI shape | Keep it simple: the old Leads pages become the agent's **Book**; each household's page is one timeline of everything past and upcoming. Nav: Today, Book, Leads, Settings. |
| Name/brand | Still "Brikk" as a placeholder. Rename is its own step (6.8). |
| Mobile | iOS/Android apps will be built by someone else against a versioned REST API (`/api/v1`). The web UI must use the same API — no business logic in pages. |

---

## Target architecture

```
lib/core/      Pure logic. No React, no Next, no Supabase. Unit-tested.
               dates, schedule, birthdays, message templates, sms links, today feed.
lib/server/    Server-only data access. Auth helper, Supabase queries, services that
               combine core logic with the database. Imported only by app/api/.
app/api/v1/    The public, versioned JSON API. Web and mobile both call this.
lib/client/    Tiny browser helper: fetch /api/v1 with the user's bearer token.
app/app/       Web UI. Renders data from /api/v1. Never calls supabase.from() directly.
```

Rules:
- All writes go through `/api/v1`. Every route derives `userId` from the `Authorization: Bearer`
  token and uses a Supabase client carrying that token, so RLS still applies.
- "What's due today" is computed on the server (`GET /api/v1/today`), never in the page.
- Dates for policies, birthdays and follow-ups are **date-only** (`YYYY-MM-DD`). "Today" is
  computed in the **agent's time zone** (`profiles.timezone`).
- `API.md` documents every endpoint, so the mobile developer never has to read web code.

## Target data model

All tables: `user_id` + RLS policy `user_id = auth.uid()`, `created_at`, `updated_at`.

- **households** — one client household. `display_name`, `phone`, `email`, `address`,
  `source`, `status` (`prospect` | `client` | `inactive`), `notes` (UI warns: no health info),
  `last_contact_at`, `legacy_lead_id` (for the migration).
- **household_members** — `household_id`, `role` (`policyholder` | `spouse` | `child` | `other`),
  `first_name`, `last_name`, `birthday` (date), `phone`, `email`.
- **policies** — `household_id`, `insured_member_id` (optional), `carrier`, `product`,
  `face_amount` (numeric), `monthly_premium` (numeric), `application_date`, `effective_date`,
  `first_draft_date`, `status` (`pending` | `active` | `cancelled`), `policy_number` (optional).
  **No health, underwriting, medication or rate-class fields.**
- **follow_up_templates** — the agent's editable schedule. `label`, `anchor`
  (`application_date` | `first_draft_date` | `effective_date`), `offset_days`, `offset_months`,
  `repeat_yearly` (bool, for annual review), `message_template`, `sort_order`, `active`.
  Seeded with the defaults below the first time an agent opens their schedule.
- **follow_ups** — concrete tasks. `household_id`, `policy_id` (nullable), `member_id`
  (nullable, for birthdays), `template_id` (nullable), `kind` (`policy` | `annual_review` |
  `birthday` | `manual`), `due_date`, `message`, `status` (`pending` | `opened` | `done` |
  `skipped`), `completed_at`, `dedupe_key` (unique per user, e.g. `bday:<member>:<year>`).
- **activity** (rename of `interactions` use) — what the agent did: `household_id`, `type`
  (`text_opened`, `text_confirmed`, `call`, `note`), `follow_up_id`, `created_at`.
- **lead_offers** (shell only, step 5.8) — placeholder table for leads you will sell later.
  No payment columns yet.

### Default follow-up schedule

| Step | Anchor | Offset | Default text |
|---|---|---|---|
| Thank you | application date | +1 day | "Hi {first_name}, thank you for trusting me with your family's coverage. Save my number — I'm here whenever you need me. – {agent_first_name}" |
| Before first draft | first draft date | −2 days | "Hi {first_name}, quick heads-up: your first {carrier} payment of ${monthly_premium} drafts on {first_draft_date}. Any questions, just text me." |
| Payment check | first draft date | +3 days | "Hi {first_name}, checking that your first {carrier} payment went through OK. Let me know if anything looks off." |
| 30 days | application date | +30 days | "Hi {first_name}, one month in! Anything I can help with on your policy?" |
| 60 days | application date | +60 days | "Hi {first_name}, just checking in at the two-month mark. Everything good with your coverage?" |
| 90 days | application date | +90 days | "Hi {first_name}, three months in — any changes in the family I should know about?" |
| 6 months | application date | +6 months | "Hi {first_name}, it's been six months since we set up your policy. Happy to answer any questions." |
| Annual review | application date | +12 months, repeats yearly | "Hi {first_name}, it's been a year! Let's set up a quick review to make sure your coverage still fits." |
| Birthday (every member) | member birthday | yearly | "Happy birthday, {first_name}! Hope it's a great one. – {agent_first_name}" |

Scheduling rules:
- Month offsets clamp to month end (Aug 31 + 6 months = Feb 28/29).
- Missing anchor date → that step waits until the date is filled in.
- Changing a policy date recalculates **pending** follow-ups only; done/skipped ones stay.
- Cancelling a policy skips its pending follow-ups.
- Adding a policy with a past application date: steps more than 7 days overdue are created as
  `skipped`, so Today isn't flooded.
- Editing the schedule affects policies added afterwards. Existing pending follow-ups can be
  edited one by one (date, text, skip).
- Feb 29 birthdays show on Feb 28 in non-leap years.

### "Sent" handling (fixes the old "sent lie")
Tapping "Text" opens the `sms:` link and marks the follow-up `opened`. When the agent comes
back to the app, the card asks "Did you send it?" → **Yes** marks it `done`, **No** returns it
to `pending`. Nothing is ever marked sent automatically.

---

## Phase 0 — Clean-up and safety nets

**0.1 Update CLAUDE.md** — done alongside this plan.

**0.2 Remove Twilio.** Delete `app/api/sms/route.js` and `app/api/sms/webhook/route.js`, drop
`twilio` from `package.json`, fix the "SMS goes through Twilio" line in
`app/app/settings/page.js`, remove `TWILIO_*` from `.env.example`. Build.

**0.3 Remove the hardcoded Supabase fallback** in `lib/supabase.js`; throw a clear error if
`NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` are missing. Build.

**0.4 Add a test runner.** Add `vitest` as a dev dependency and an `npm test` script.
One sample test of `lib/birthdays.js` to prove it runs.

**0.5 [Henry] Back up the database.** Supabase → Database → Backups (or `pg_dump`) before any
migration runs. Export `deals`, `offers`, `checklist_items`, `referrals` to CSV too.

## Phase 1 — Backend foundation (goal 7)

**1.1 Server auth helper.** `lib/server/auth.js` → `requireUser(request)` returns
`{ user, db }` where `db` is a Supabase client using the caller's bearer token (RLS applies),
or throws a 401. Replace the copy-pasted versions in existing routes later as they're touched.

**1.2 API response helpers.** `lib/server/http.js`: `ok(data)`, `fail(status, code, message)`,
a `withErrors(handler)` wrapper, and a field whitelist helper `pick(body, allowed)` that
rejects unknown fields (this is the "no health info" guard at the API layer).

**1.3 Browser API client.** `lib/client/api.js`: `api.get/post/patch/del(path, body)` that
attaches the Supabase session token and unwraps errors.

**1.4 Write `API.md`** skeleton: base URL, auth, error format, date formats, versioning rule
(breaking changes → `/api/v2`). Fill in each endpoint as it's built.

## Phase 2 — Database schema (SQL files; additive only)

Each file goes in `sql/`, is idempotent, enables RLS on new tables, and is listed in
`SCHEMA-REFERENCE.md`.

**2.1 `sql/li-01-households.sql`** — `households`, `household_members`, indexes, RLS,
`touch_updated_at` triggers. Add `profiles.timezone` (default `'America/New_York'`) and
`profiles.agency_name`.

**2.2 `sql/li-02-policies.sql`** — `policies` with CHECK constraints (face amount ≥ 0,
premium ≥ 0, status values). Comment at the top: "Do not add health/medical columns."

**2.3 `sql/li-03-follow-ups.sql`** — `follow_up_templates`, `follow_ups` (unique
`(user_id, dedupe_key)`), add `household_id` + `follow_up_id` to `interactions`.

**2.4 `sql/li-04-backfill.sql`** — for every existing `leads` row create a household
(`status = 'prospect'`, `legacy_lead_id = leads.id`) and a `policyholder` member (name split
into first/last, birthday copied); if `spouse_name` is set, add a `spouse` member. Backfill
`interactions.household_id` and `messages` via `legacy_lead_id`. Old tables are untouched.

**2.5 [Henry] Run 2.1–2.4** in the Supabase SQL Editor, in order. Check the verify queries at
the bottom of each file.

## Phase 3 — Core logic (pure functions + tests)

**3.1 `lib/core/dates.js`** — `todayIn(timezone)`, `addDays`, `addMonths` (with clamping),
`daysBetween`, all on `YYYY-MM-DD` strings. Tests incl. month-end and DST.

**3.2 `lib/core/schedule.js`** — `DEFAULT_TEMPLATES` (table above) and
`buildPolicyFollowUps(policy, templates, today)` → list of `{ due_date, kind, template_id,
dedupe_key, status }`. Tests: each default step, missing first-draft date, past-dated policy,
annual repeat.

**3.3 `lib/core/birthdays.js`** — move the logic from `lib/birthdays.js`, work per member,
handle Feb 29, return `{ member, due_date, turning }` for a date window. Keep `lib/birthdays.js`
as a re-export until old pages are deleted.

**3.4 `lib/core/messages.js`** — `renderTemplate(template, vars)` with `{first_name}`,
`{agent_first_name}`, `{carrier}`, `{product}`, `{monthly_premium}`, `{first_draft_date}`
(formatted "Mar 3"). Unknown placeholders are left blank, never crash.

**3.5 `lib/core/sms.js`** — `normalizePhone`, `smsHref(phone, body, platform)` (iOS `&body=`,
others `?body=`). Mobile apps use the same rule.

**3.6 `lib/core/today.js`** — `buildTodayFeed({ followUps, birthdays, today })` → sorted items:
overdue first, then today, then birthdays in the next 3 days. Each item has `title`, `reason`,
`phone`, `message`, `sms_href`, `household_id`, `follow_up_id`.

## Phase 4 — API endpoints (`app/api/v1/`)

Each step: route + service in `lib/server/` + entry in `API.md`.

**4.1 Households** — `GET/POST /households`, `GET/PATCH/DELETE /households/:id`
(GET includes members, policies, upcoming follow-ups, recent activity), and
`GET /households/:id/timeline` — follow-ups + birthdays + activity merged in date order, with
`today` marked. This one endpoint powers the Book timeline on web and mobile.

**4.2 Members** — `POST /households/:id/members`, `PATCH/DELETE /members/:id`. Changing a
birthday refreshes that member's pending birthday follow-up.

**4.3 Policies** — `POST /households/:id/policies`, `PATCH/DELETE /policies/:id`. Create →
generate follow-ups; date change → recalculate pending; status `cancelled` → skip pending.
Creating the first policy flips the household from `prospect` to `client`.

**4.4 Follow-ups** — `GET /follow-ups?from&to&status`, `PATCH /follow-ups/:id`
(due_date, message), `POST /follow-ups/:id/opened | done | skip | reopen`. Each action writes
an `activity` row and updates `households.last_contact_at` on `done`.

**4.5 Schedule** — `GET /schedule` (seeds defaults on first call), `PUT /schedule` (full list),
`POST /schedule/reset`.

**4.6 Today** — `GET /today`: in the agent's time zone, upserts upcoming birthday follow-ups
(using `dedupe_key`, so it's safe to call repeatedly), then returns the feed from 3.6.

**4.7 Profile** — `GET/PATCH /me` (name, phone, agency name, timezone).

**4.8 Leads shell** — `GET /lead-offers` returns `[]` for now (shape documented in `API.md`).

## Phase 5 — Web UI on the new API

Keep it simple: the old Leads pages become the agent's **Book** (everyone they've written or
are working). We convert those existing pages rather than building new ones, and each person's
page is built around **one timeline**.

**5.1 Book list** — move `app/app/leads/page.js` to `app/app/book/page.js` and switch it to
`GET /households`. Strip the real-estate columns; show name, household members, policy count,
and the **next timeline item** ("6-month check-in · Mar 3"). Search + "Add to book" button.
Uses `lib/client/api.js` only.

**5.2 Add/edit household form** — reuse the existing lead form in that file: policyholder +
optional spouse + "add child" rows, each with name and birthday; phone, email, source, notes
with the no-health-info warning.

**5.3 Person page with timeline** — move `app/app/leads/[id]/page.js` to
`app/app/book/[id]/page.js`. Top: household members with birthdays, policy cards. Main area:
**one vertical timeline** for that household, oldest at the top, today marked:
policy written → thank-you → pre-draft check → payment check → 30/60/90 days → 6 months →
annual reviews, plus each member's birthdays and any calls/texts/notes logged. Past items show
done/skipped; upcoming items have **Text**, **Edit date/message**, **Skip**. Backed by a
`GET /households/:id/timeline` endpoint (add to 4.1) that merges follow-ups and activity, so
the mobile app gets the same timeline.

**5.4 Policy form** — carrier, product, face amount, monthly premium, three dates, status.
After saving, show the generated follow-up dates.

**5.5 Today page rewrite** — `app/app/page.js` calls `GET /today`. Each card: who, why
("6-month check-in", "Turns 8 tomorrow — Emma, daughter of John Smith"), message preview,
one big **Text** button (`sms:` link), Edit, Skip. Confirm-on-return flow described above.
Remove the old lead/deal/anniversary/risk logic from this page.

**5.6 Settings** — new "Follow-up schedule" tab (edit text, offset, anchor; add/remove steps;
reset to defaults) and a time zone picker on Profile. Relabel "Brokerage" → "Agency".

**5.7 Calendar page** — delete `app/app/calendar/` for v1 (Today + each person's timeline
cover it). An "Upcoming 30 days" list can come back later from `GET /follow-ups`.

**5.8 Leads shell** — `app/app/leads-store/page.js` (renamed to `/app/leads` in 6.2):
"Lead marketplace — coming soon" with an empty list from `GET /lead-offers`. Add
`sql/li-05-lead-offers.sql` (table only, RLS read-only for users). **[Henry]** runs it.

**5.9 Navigation** — desktop and mobile both: **Today, Book, Leads, Settings** (4 tabs,
≥44px tap targets).

**5.10 Onboarding rewrite** — `lib/Onboarding.js`: Welcome → add first household → add first
policy → see the generated schedule on Today. No voice step.

**5.11 CSV import** (optional) — adapt the old leads importer to create households +
policyholder members.

## Phase 6 — Remove real estate + AI, rebrand

**6.1 Remove AI.** Delete `lib/Voice.js`, `app/app/copilot/`, `app/api/copilot/route.js`,
the voice button in the layout, and AI drafting in the morning-brief cron. Remove
`ANTHROPIC_API_KEY` from `.env.example`. Replace the landing-page help chat with a static FAQ.
**[Henry]** remove the env var in Vercel.

**6.2 Remove real-estate pages.** Delete `app/app/deals/`, `app/track/`, `app/app/referrals/`,
`app/app/marketing/`, `app/app/messages/`, `app/app/calendar/`, `lib/listingTemplates.js`.
Move the leads shell from `/app/leads-store` to `/app/leads` (the old leads pages already
moved to `/app/book` in 5.1/5.3). Grep for `deal`, `listing`, `buyer`, `seller`,
`commission`, `anniversary` and clean leftovers.

**6.3 Public lead-capture link** — `/r/[code]` and `/api/refer` create a `prospect` household
+ policyholder member instead of a lead. Remove real-estate fields from the form.

**6.4 Morning brief email** — rewrite `app/api/cron/morning-brief` to send each agent their
Today list (from `lib/server` + `lib/core/today.js`), with time zone, batching/pagination, and
a hard fail when `CRON_SECRET` is missing.

**6.5 Google Calendar sync** — either point it at follow-ups/birthdays or hide it in Settings
for v1. (Recommendation: hide for v1.)

**6.6 Copy and legal** — landing page, demo page, roadmap, pricing text, onboarding, email
templates, privacy policy (state that no health information is collected), terms.

**6.7 Docs** — update `ARCHITECTURE.md`, `SCHEMA-REFERENCE.md`, `OPERATIONS-RUNBOOK.md`, `README.md`.
Move real-estate-only docs (`INVESTOR-FAQ.md`, launch/bot prompts, etc.) to `docs/archive/`.

**6.8 [Henry] Rename.** Pick the product name and domain. Then update `lib/Logo.js`,
`app/layout.js` metadata, `public/manifest.json`, `capacitor.config.ts`, email sender, Supabase
email templates, and Stripe product names.

**6.9 [Henry] Drop old schema** — only after 0.5's export and a week of the new app working:
`sql/li-99-drop-real-estate.sql` drops `deals`, `offers`, `checklist_items`, `referrals`,
`messages` (if unused), the real-estate columns, and finally `leads`. Requires your approval.

## Phase 7 — Mobile hand-off (goal 7)

**7.1 Finish `API.md`** — every endpoint, request/response examples, error codes, the
`sms:` rule, the confirm-on-return flow, time zone rules.

**7.2 Push notifications plan** — add a `devices` table + `POST /api/v1/devices` for push
tokens; the daily cron sends "You have N people to contact today". (Build when the mobile
developer is ready.)

**7.3 Update `ios-handoff/`** — replace with a `mobile-handoff/` guide for the iOS/Android
developer; decide whether to retire the Capacitor web-view shell.

---

## Not in v1 (on purpose)
AI features, payments for leads, Twilio/any texting service, two-way message history,
commission tracking, Google Calendar sync, health or underwriting data of any kind.

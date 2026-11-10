# CLAUDE.md — project memory for Claude Code

Read this first, then `PLAN.md`. This repo is mid-conversion.

## What this is

**Brikk is being rebuilt from a real estate CRM into an all-in-one CRM for life insurance agents.**
"Brikk" is a placeholder name until Henry picks the new brand (PLAN.md step 6.8).
The conversion happens **in place**: same Supabase project, same users, same Stripe customers.
The real-estate version is preserved at commit `5b18164` on `main`.

Stack: Next.js 14 (App Router, plain JS) on Vercel + Supabase (Postgres/auth/RLS/realtime) +
Stripe + Resend. No AI in v1.

## Product goals (the contract)

1. **Clients are households**: policyholder, spouse, kids — each person has their own birthday.
2. **Policy basics per policy** (a household can have several): carrier, product, face amount,
   monthly premium, application date, effective date, first draft date.
   **Never store medical or health information anywhere** — no health columns, no health
   fields in forms or API payloads; notes fields carry a "no health info" warning.
3. **Automatic follow-ups** generated from policy dates. Default schedule: thank-you (application
   +1 day), check-in before first draft (first draft −2), payment check (first draft +3), then
   30/60/90 days and 6 months after the application date, then an annual review every year.
   Agents can edit the schedule.
4. **Birthday reminders** for every household member.
5. **Today dashboard**: who to contact today, with a pre-written text the agent opens and sends
   from their own phone in one tap via a native `sms:` link. **No Twilio or any texting service.**
   Never mark a text "sent" automatically — mark it "opened", then ask "Did you send it?".
6. **Leads section**: a shell for a future lead store. No payments yet.
7. **iOS/Android apps will be built by someone else on the same backend.** Keep all data and
   business logic out of the web UI.

UI is deliberately simple: the agent's **Book** (formerly Leads) lists every household; each
household's page is one **timeline** of past and upcoming follow-ups, birthdays and activity.
Nav: **Today, Book, Leads, Settings**.

## Architecture rules

- `lib/core/` — pure logic (dates, schedule, birthdays, message templates, sms links, today feed).
  No React, Next or Supabase imports. Unit-tested with `npm test`.
- `lib/server/` — server-only data access and services. Imported only from `app/api/`.
- `app/api/v1/` — the versioned JSON API used by **both** web and mobile. Document every endpoint
  in `API.md`. Breaking changes go to `/api/v2`.
- `lib/client/api.js` — the browser's only way to read/write data.
- Pages in `app/app/` must not call `supabase.from(...)` directly or compute business rules.
  (Old real-estate pages still do; they get replaced or deleted per PLAN.md.)
- Policy/birthday/follow-up dates are date-only `YYYY-MM-DD`. "Today" is computed in the agent's
  time zone (`profiles.timezone`). Timestamps are ISO 8601 UTC.

## Conventions (carried over)

- **Styling:** colors/fonts/spacing from `lib/design.js`; inline `style={{}}`. No raw hex in
  components, no Tailwind/CSS modules/state libraries.
- **Mobile web:** breakpoint 700px; inputs ≥16px font; tap targets ≥44px.
- **Auth on API routes:** verify the Supabase session from `Authorization: Bearer`; derive
  `userId` from it. Never trust a `userId` in the body. Whitelist accepted fields.
- **Supabase:** scope every query by `user_id` even with RLS. Every new table: RLS enabled +
  `user_id = auth.uid()` policy.
- **SQL migrations:** new idempotent file in `sql/` (`IF NOT EXISTS`). Additive first; drops only
  in the final step with Henry's approval. Henry runs them — you can't.
- **Stripe:** restricted keys only; price IDs from env vars; verify webhook signatures.
- **Email:** `lib/email.js → sendEmail()`, always `await`.
- **Secrets:** `process.env.X` only; document new vars in `.env.example`.

## Do NOT

- Add Twilio, any SMS provider, or AI/LLM calls (AI is cut for v1).
- Add any health, medical, medication, underwriting or rate-class field.
- Put business logic or direct DB writes in pages.
- Write to the DB from public pages outside `/app` except through validated `/api/` routes.
- Mark messages "sent" optimistically.
- List a feature as shipped on the roadmap until its UI exists.

## Verification before calling something done

- `npm run build` compiles; `npm test` passes once tests exist.
- Re-read edited files: the repo lives in OneDrive, which can truncate file tails on sync.
- Verify commits with `git log` (known quirk: commits reported but not persisted).

## Needs Henry

Credentials/env vars in Vercel, 2FA, running SQL migrations, destructive DB actions, the new
product name/domain, and Apple/Google/Stripe dashboard config. Leave `// TODO(henry):` and
mention it in your summary.

## Last updated

Nov 10, 2026 — start of the life insurance conversion. Next step: PLAN.md Phase 0.

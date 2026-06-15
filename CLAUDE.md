# CLAUDE.md — project memory for Claude Code

This file is loaded into every Claude Code session. Read it first. It's the contract for how to work in this repo.

## What this is

**Brikk** — AI CRM + transaction coordinator for solo real estate agents. $69.99/month. Next.js 14 (App Router) on Vercel + Supabase (Postgres/auth/realtime) + Anthropic Claude + Stripe + Resend. Live at brikk.store.

Full architecture: read `ARCHITECTURE.md`. Database: read `SCHEMA-REFERENCE.md`. When something breaks: `OPERATIONS-RUNBOOK.md`.

## How to work here (non-negotiable conventions)

- **Styling:** ALL colors/fonts/spacing come from `lib/design.js` (`c.text`, `type.eyebrow`, `btn.primary`, `input`, etc.). Never write a raw hex code in a component. Inline `style={{}}` is the pattern — no Tailwind, no CSS modules.
- **Mobile:** breakpoint 700px. Inputs must be ≥16px font (iOS auto-zoom). Bottom tab bar tap targets ≥44px.
- **Client/server boundary:** `'use client'` pages run in the browser. `app/api/.../route.js` runs server-only. Service-role keys and secrets NEVER leave `app/api/` or server-imported `lib/`.
- **Auth on API routes:** every authenticated endpoint must verify the Supabase session from the `Authorization: Bearer` header and derive `userId` from it. NEVER trust a `userId` from the request body. (This was a real vuln — see git history.)
- **AI calls:** all go through `app/api/copilot/route.js`, dispatched on `body.mode`. Add new AI features as new modes, not new endpoints. Every mode except `help_chat` (public landing chat) requires auth. Browser never calls Anthropic directly.
- **Supabase queries:** always scope by `user_id` even though RLS enforces it (defense in depth). Every new table gets RLS enabled + a `user_id = auth.uid()` policy.
- **Stripe:** restricted keys only (`rk_live_`). Price IDs from env vars (`STRIPE_PRICE_PRO/_TEAM`), never hardcoded. Always verify webhook HMAC signatures.
- **Email:** `lib/email.js → sendEmail()`, always `await` (Vercel kills the function on response).
- **Dates:** store ISO 8601 UTC. Display via `fmt.relativeDate/daysSince/daysUntil/phone` from `lib/design.js`.
- **SQL migrations:** new file in `sql/`, idempotent (`IF NOT EXISTS`), RLS for new tables. Henry runs them in Supabase SQL Editor — you can't run them.

## Anti-patterns — do NOT do these

- Don't add Tailwind / styled-components / a state library. Inline styles + local `useState` + Supabase Realtime is the convention.
- Don't import Twilio. It was removed for TCPA reasons; native `sms:` deep links are intentional.
- Don't put real credentials in code. Use `process.env.X`; document new vars in `.env.example`.
- Don't write to the DB from public pages (outside `/app`). All writes go through validated `/api/` routes.
- Don't mark a message as "sent" optimistically — the review flagged this. Log as drafted/opened or confirm on return.
- Don't claim a git commit succeeded without verifying `git log` — there's a known quirk where commits are reported but don't persist.

## Verification before you call something done

- Run `npm run build` and confirm it compiles. (A duplicate `const` once shipped a build-breaker — always build-check.)
- Re-read files you edited; this repo lives in OneDrive which can truncate file tails on sync. If a file looks cut off, it probably is — rewrite the tail.
- For new features, add to `app/roadmap/page.js` SHIPPED only when the UI actually exists. Don't list schema-only features as shipped (two were caught doing this).

## Current priorities (from BRIKK-DEEP-REVIEW.md — read it)

The deep review found the product is feature-rich but activation-poor. Priority order:

**Retention-critical (do first):**
1. ✅ Onboarding flow — DONE (`lib/Onboarding.js`, voice-first first-run)
2. ✅ Label the voice button — DONE ("Talk to Brikk" pill)
3. Fix the "sent" lie — Copilot + Messages auto-log as sent 300ms after opening sms: even if the agent backs out. Change to confirm-on-return or log as "opened".
4. Cut mobile bottom bar from 8 tabs to 5; make labels consistent with desktop (ROI=Marketing, Chats=Conversations).
5. Build the UI for the two schema-only features (listing checklist via `lib/listingTemplates.js` + `checklist_items` table; offer comparison via `offers` table) OR remove them from roadmap SHIPPED.

**Before scaling (open code issues):**
6. Hard-fail if `STRIPE_PRICE_PRO/_TEAM` or `CRON_SECRET` env vars are missing (currently silent fallbacks / public cron).
7. Webhook idempotency — add a `processed_events` table keyed on Stripe `event.id`.
8. Rate-limit `/api/refer` and `/api/copilot` per user/IP.
9. Morning-brief cron pagination — won't scale past ~100-200 users (serial loop + 55s abort).

**The real product gaps (next month):**
10. Comps/CMA tool — the #1 daily reason agents leave Brikk for MLS/Zillow.
11. Per-deal document storage (Supabase Storage already in stack) + DocuSign status.
12. Auto-generate per-contingency deadline checklist on contract date (inspection/appraisal/financing/title).

## What you still need a human (Henry) for

- Entering credentials / secrets (set them in Vercel env vars)
- 2FA on any service
- Running SQL migrations in Supabase
- Approving destructive actions (DROP, prod data changes)
- Apple/Google/Stripe dashboard config

When you need one of these, leave a clear `// TODO(henry):` comment + note it in your summary. Keep coding everything else.

## Last updated

May 21, 2026.

# Brikk

**AI transaction coordinator in your pocket — for solo real estate agents.**

[brikk.store](https://brikk.store) · $69.99/month · 14-day free trial · No setup fee

---

## What Brikk is

A web app + native mobile wrapper that gives solo real estate agents the same operational leverage a full-stack brokerage would. AI Copilot drafts every follow-up message. Voice-to-CRM lets agents log activity by talking to their phone. Smart calendar auto-builds from the pipeline. Lead capture links replace expensive lead-gen tools. Public client-facing deal trackers eliminate "where are we?" calls. And it costs less than 1/4 of legacy CRMs like Lofty or Follow Up Boss.

Brikk replaces: a $300-500/month CRM + a $300-400/deal transaction coordinator + Calendly + BombBomb + half a dozen scattered apps. For $69.99/month.

## Tech stack

- **Framework:** Next.js 14 (App Router) on Vercel
- **Database + auth + realtime:** Supabase (Postgres + Row-Level Security)
- **AI:** Anthropic Claude Sonnet 4.5 — drafts, voice extraction, sentiment, summaries
- **Payments:** Stripe Checkout + Customer Portal (live mode, restricted API keys)
- **Email:** Resend (transactional) + Supabase Auth SMTP (auth flows)
- **Calendar:** Google Calendar API two-way sync (Microsoft Graph planned)
- **Native mobile:** Capacitor wrapper → iOS + Android shells around the same Next.js app
- **Hosting:** Vercel (web), Resend SMTP relay, Supabase managed Postgres

## Repo layout

```
brikk-store/
├── app/                              Next.js App Router pages + API routes
│   ├── page.js                       Marketing landing (brikk.store)
│   ├── layout.js                     Root layout, metadata, viewport, icons
│   ├── login/                        Auth (Supabase email/password)
│   ├── app/                          Logged-in product
│   │   ├── layout.js                 App shell — sidebar, bottom tab bar, voice button
│   │   ├── page.js                   Today dashboard (action list, KPIs)
│   │   ├── copilot/                  AI follow-up draft cards
│   │   ├── leads/                    Pipeline + lead detail + CSV import
│   │   ├── deals/                    Deal tracker, share-link button, lead linker
│   │   ├── messages/                 Conversation history per lead
│   │   ├── calendar/                 Smart calendar
│   │   ├── marketing/                Source ROI + commission goal pacing
│   │   ├── referrals/                Referral ledger
│   │   ├── settings/                 Profile, team, billing, integrations, etc.
│   │   └── upgrade/                  Paywall (trial-expired users)
│   ├── refer/, r/[code]/             Public lead-capture forms
│   ├── track/[token]/                Public client-facing deal tracker
│   ├── roadmap/                      Public product roadmap
│   ├── privacy/, terms/              Legal pages
│   ├── admin/                        Internal admin (owner-email gated)
│   └── api/                          Server-side routes
│       ├── copilot/                  AI mode router (drafts, voice extract, sentiment, etc.)
│       ├── refer/                    Public lead-capture endpoint
│       ├── stripe/                   Checkout, webhook, customer portal, sync
│       ├── integrations/google/      OAuth + sync + poll
│       ├── cron/morning-brief/       Daily 7am Pacific email digest
│       ├── team/                     Team CRUD (create, join, leave, remove)
│       └── sms/                      LEGACY — Twilio routes (not used)
├── lib/                              Reusable utilities
│   ├── design.js                     Centralized design tokens
│   ├── supabase.js                   Supabase client
│   ├── email.js                      Resend wrapper + lead-confirm template
│   ├── trial.js                      Trial enforcement state machine
│   ├── Voice.js                      Floating voice button (used app-wide)
│   ├── Logo.js                       Brand mark component
│   ├── birthdays.js                  Birthday detection utilities
│   ├── listingTemplates.js           Listing-prep + under-contract checklist templates
│   ├── referralCode.js               Short-code generator for agent referral links
│   └── integrations/
│       ├── encrypt.js                AES-256-GCM token storage
│       ├── google.js                 Token refresh + Calendar API wrapper
│       └── syncToGoogle.js           Push functions for birthdays, deals, etc.
├── sql/                              SQL migrations (paste into Supabase SQL Editor)
├── docs/                             Setup + integration guides
├── ios-handoff/                      Everything an iOS freelancer needs
├── public/                           Static assets (icons, manifest, native-bridge)
├── brand/                            Brand assets (logo, wordmark, splash sources)
├── marketing/                        Marketing PDFs (door-to-door script, etc.)
├── pitch/                            Investor/brokerage pitch deck
├── supabase-email-templates/         Auth email HTML to paste into Supabase Dashboard
└── capacitor.config.ts               iOS/Android wrapper configuration
```

## Required environment variables

See `.env.example` for the full annotated list. Critical ones:

| Variable | Purpose | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase → Project Settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | same |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only RLS bypass key | same |
| `ANTHROPIC_API_KEY` | AI Copilot, voice, sentiment | console.anthropic.com |
| `RESEND_API_KEY` | Transactional emails | resend.com |
| `STRIPE_SECRET_KEY` | Payment processing (use restricted `rk_live_…`) | Stripe → API keys |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | Stripe → Webhooks |
| `STRIPE_PRICE_PRO` / `STRIPE_PRICE_TEAM` | Plan price IDs | Stripe → Products |
| `CRON_SECRET` | Vercel cron auth for /api/cron/morning-brief | Random 32+ char string |
| `NEXT_PUBLIC_APP_URL` | Used in callbacks + emails | Always `https://brikk.store` |
| `GOOGLE_OAUTH_CLIENT_ID` / `_SECRET` | Calendar integration | Google Cloud Console |
| `INTEGRATIONS_ENCRYPTION_KEY` | AES key for storing OAuth tokens | `openssl rand -base64 32` |
| `STATE_SIGNING_SECRET` | OAuth CSRF protection | `openssl rand -base64 32` |
| `APPLE_PAY_DOMAIN_ASSOCIATION` | Apple Pay verification file | Stripe Dashboard |

## Local development

```bash
git clone <repo>
cd brikk-store
cp .env.example .env.local   # then fill in real values
npm install
npm run dev                  # http://localhost:3000
```

## Deploy

`git push` to the `main` branch — Vercel auto-deploys.

For manual deploys: Vercel Dashboard → Deployments → ⋯ → Create deployment → Production → uncheck Build Cache.

## Documentation index

Operational + architectural docs in the repo:

- **`ARCHITECTURE.md`** — codebase guide for new developers
- **`SCHEMA-REFERENCE.md`** — annotated database schema
- **`OPERATIONS-RUNBOOK.md`** — what to do when X breaks
- **`SUPPORT-TEMPLATES.md`** — customer-response templates
- **`BRAND-GUIDELINES.md`** — voice, color, typography rules
- **`INVESTOR-FAQ.md`** — Q&A beyond the pitch deck
- **`LAUNCH-DAY.md`** + **`FINALIZE.md`** — launch checklists
- **`STRIPE-PRODUCTION-SETUP.md`** — Stripe Dashboard playbook
- **`PRICING-CHANGE.md`** — how to migrate prices in Stripe
- **`docs/google-calendar-integration.md`** — Google OAuth setup
- **`ios-handoff/README.md`** — iOS app handoff for freelancer
- **`AUDIT-RESPONSE.md`** — response to the partner audit

## Contributing / hiring

Hiring a developer? Send them `ARCHITECTURE.md` first. The conventions are documented there. Avoid surprises like adding a new dependency without checking the existing patterns.

Hiring a designer? Send them `BRAND-GUIDELINES.md`. Don't let visual drift creep in.

Outsourcing customer support? Send them `SUPPORT-TEMPLATES.md`. Keeps voice consistent.

## License

Proprietary. © 2026 Brikk. All rights reserved.

## Contact

- Product / partnerships: hello@brikk.store
- Press: hello@brikk.store
- Founder: Henry Desrosier (Southern California)

---

Brikk is built by realtors, for realtors. Less stuff. More closings.

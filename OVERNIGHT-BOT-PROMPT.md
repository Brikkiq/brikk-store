# Overnight bot prompt — Google Calendar two-way sync

Paste this entire document into a fresh Claude in Chrome session (or Claude Code session) with **write access to the brikk-store repo**. The bot will work through it autonomously over several hours, committing as it goes.

Tell the bot at the start: **"You have full write access to the brikk-store repo. MAXIMUM AUTONOMY. Work continuously for 6-8 hours without stopping. Never ask permission for code changes — just commit them. Never ask for clarification — make a decision, document it in a TODO comment, keep moving. Never wait for input — you have everything you need below. The ONLY safety constraint: do not use, read, or store Henry's personal passwords, API secret values, or live credentials. Code referencing those uses `process.env.X` placeholders that Henry pastes into Vercel tomorrow. Everything else: ship it. Commit every 15-30 minutes. Push to GitHub constantly. Do not stop until you've shipped Part 1, Part 2, Part 3, and at least 2 stretch goals from Part 4."**

## Operating mode — AGGRESSIVE

- **Zero permission gates.** Do not stop to ask "should I do X?" — do X, commit it, move on. If it turns out wrong, Henry will revert and tell you in the morning. That's fine.
- **Zero blocking on ambiguity.** Pick a reasonable interpretation, leave `// TODO(henry-review): chose X because Y, alternative was Z` and keep moving. Speed > perfection.
- **Commit every 15-30 minutes minimum.** Tiny commits beat one giant one. Push to GitHub after each commit so Henry sees progress.
- **Never put real credentials in code.** Use `process.env.VARIABLE_NAME` everywhere. Document the var name + how to obtain the value in the relevant doc. This is the ONLY hard line.
- **If a phase stalls for >20 minutes**, switch to the next part. Don't burn the whole night on one stuck problem. Come back if time allows.
- **Work for 6-8 continuous hours.** When you finish Part 1, immediately start Part 2. When you finish Part 2, immediately start Part 3. After Part 3, work through Part 4 stretch goals in order until ~6am.
- **Honest reporting only.** In commits and the final report, say what you actually did. Don't claim phases done when they're partial.

---

## Mission

Implement two-way Google Calendar sync for Brikk. Real estate agents live in Google Calendar — a separate calendar in Brikk doesn't stick. Brikk events (showings, follow-ups, deal milestones, birthdays, anniversaries) should appear in the agent's Google Calendar. Edits in Google Calendar should sync back to Brikk.

This is a real ~4-6 hour implementation. Don't shortcut it. The output should be production-ready code that Henry could deploy without further engineering.

---

## Architecture

**OAuth 2.0 flow** for connection:
1. Agent clicks "Connect Google Calendar" in Settings → Integrations
2. Redirect to Google's OAuth consent screen with scope `https://www.googleapis.com/auth/calendar.events`
3. Google redirects back to `/api/integrations/google/callback` with auth code
4. Server exchanges code for access + refresh token
5. Store tokens in a new `integrations` table (encrypted at rest)

**Two-way sync logic**:
- Brikk → Google: on create/update of calendar events in Brikk, immediately push to Google
- Google → Brikk: periodic poll (every 15 min) for events the agent edited in Google
- Conflict resolution: last-write-wins, with the side that has a newer `updated_at` taking precedence

**Token refresh**: access tokens expire in 1 hour. Implement refresh-on-expiry using the refresh token, with retry-once logic on 401.

---

## Files to create

### 1. Schema migration (`sql/google-calendar-integration.sql`)

```sql
CREATE TABLE IF NOT EXISTS public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,                    -- 'google_calendar' | 'microsoft_calendar' | future
  access_token text,                          -- encrypted
  refresh_token text,                         -- encrypted
  expires_at timestamptz,
  account_email text,                         -- their Google account email
  calendar_id text,                           -- which calendar to sync to (default: 'primary')
  sync_token text,                            -- for incremental sync via Google's syncToken
  last_synced_at timestamptz,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_integrations_user ON public.integrations(user_id);
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Integrations own" ON public.integrations FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add external event ID tracking so we can map Brikk events to Google events
CREATE TABLE IF NOT EXISTS public.calendar_event_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brikk_source_type text NOT NULL,           -- 'lead' | 'deal' | 'birthday' | 'anniversary' | 'manual'
  brikk_source_id uuid,                       -- the lead.id or deal.id this came from
  google_event_id text,                       -- the Google Calendar event ID
  google_calendar_id text,
  last_synced_at timestamptz DEFAULT now(),
  UNIQUE(user_id, google_event_id),
  UNIQUE(user_id, brikk_source_type, brikk_source_id)
);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_user ON public.calendar_event_sync(user_id);
ALTER TABLE public.calendar_event_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Calendar sync own" ON public.calendar_event_sync FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 2. Encryption helper (`lib/integrations/encrypt.js`)

Use Node's `crypto.createCipheriv` with AES-256-GCM. Pull the master key from a new env var `INTEGRATIONS_ENCRYPTION_KEY` (32 random bytes, base64-encoded). If the env var is missing, the lib should throw a clear error so we don't silently store plaintext tokens.

Functions:
- `encrypt(plaintext) → string` — returns `iv:ciphertext:authTag` base64 concatenated
- `decrypt(encrypted) → string` — reverses the above

### 3. OAuth start route (`app/api/integrations/google/start/route.js`)

`GET /api/integrations/google/start` → redirects the user to Google's OAuth consent screen.

URL params to include:
- `client_id` from `GOOGLE_OAUTH_CLIENT_ID` env var
- `redirect_uri` = `${NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`
- `scope` = `https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email`
- `access_type` = `offline`  (gets refresh token)
- `prompt` = `consent`  (forces refresh token on every connect)
- `state` = the user's Supabase auth ID, signed with HMAC-SHA256 using `STATE_SIGNING_SECRET` env var

Reject if the user isn't authenticated (return 401, no redirect).

### 4. OAuth callback (`app/api/integrations/google/callback/route.js`)

`GET /api/integrations/google/callback?code=...&state=...`

1. Verify the `state` HMAC matches the current user — reject if mismatched (CSRF protection)
2. Exchange the `code` for tokens at `https://oauth2.googleapis.com/token` with the standard POST body
3. Decode the access token to get the account email (use the `id_token` if scope `openid email` was added, OR call `https://www.googleapis.com/oauth2/v2/userinfo`)
4. Encrypt tokens via `lib/integrations/encrypt.js`
5. Upsert into `integrations` table for this user + `provider='google_calendar'`
6. Redirect back to `/app/settings?tab=integrations&google=connected`

### 5. Token refresh helper (`lib/integrations/google.js`)

Functions:
- `getValidAccessToken(userId)` — fetches integration row, decrypts access token, checks expiry. If expired, calls `refreshAccessToken()` and returns the new one.
- `refreshAccessToken(integration)` — POSTs to `https://oauth2.googleapis.com/token` with `grant_type=refresh_token`, updates `integrations` row with the new access token + expiry.
- `googleCalendarFetch(userId, path, options)` — wrapper around `fetch('https://www.googleapis.com/calendar/v3' + path)` that automatically handles auth + 401-retry-after-refresh.

### 6. Push to Google (`lib/integrations/syncToGoogle.js`)

Functions:
- `syncBirthdayToGoogle(userId, lead)` — creates a recurring annual event on the lead's birthday with title `🎂 [lead name] turns X` and a 1-day reminder.
- `syncAnniversaryToGoogle(userId, deal)` — recurring annual event on the deal's close_date.
- `syncDealMilestonesToGoogle(userId, deal)` — events for inspection deadline, appraisal deadline, closing date.
- `syncFollowUpToGoogle(userId, lead, dueDate, label)` — single event reminding agent to follow up.

Each function:
1. Looks up `calendar_event_sync` row to see if event already exists
2. If yes, PATCH the Google event. If no, POST to create.
3. Save the returned Google event ID in `calendar_event_sync`.

Use idempotent operations — running the sync twice shouldn't duplicate events.

### 7. Pull from Google (`app/api/integrations/google/poll/route.js`)

Vercel cron-driven. Runs every 15 minutes per `vercel.json`.

For each user with an enabled Google integration:
1. Call `https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events` with the saved `syncToken` (incremental sync — only changed events come back)
2. For each changed event, check if Brikk knows about it (`calendar_event_sync` row)
3. If yes and the event was updated in Google AFTER Brikk's last update → update the matching Brikk row
4. Save the new `syncToken` returned by Google
5. Handle 410 Gone responses (token expired) by doing a full re-sync

Lock the cron to `Authorization: Bearer ${CRON_SECRET}` like the existing morning brief.

### 8. UI: Settings → Integrations tab

Add a new "Integrations" tab to `app/app/settings/page.js`:

- Section title: "Connected accounts"
- Card per integration:
  - Google Calendar: shows status (Connected/Not connected), account email if connected, last synced timestamp
  - Big button: "Connect Google Calendar" (links to `/api/integrations/google/start`) OR "Disconnect" if connected
  - Toggle: "Sync birthdays / anniversaries / follow-ups / deal milestones" (4 separate checkboxes, stored as JSONB on the integration row)
- Status badge showing real-time sync state ("Syncing now…" / "Last sync 4 min ago" / "Failed: see logs")
- Help text: "Brikk will create events in your Google Calendar for every birthday, anniversary, follow-up, and deal milestone. Edit them in Google or Brikk — changes sync both ways within 15 minutes."

### 9. Cron config (`vercel.json` update)

Add:
```json
{
  "crons": [
    { "path": "/api/cron/morning-brief", "schedule": "0 14 * * *" },
    { "path": "/api/integrations/google/poll", "schedule": "*/15 * * * *" }
  ]
}
```

### 10. Trigger sync on Brikk events

Hook `syncToGoogle` functions into the existing code paths:
- When a lead is added/updated → sync birthday if present
- When a deal is added/updated → sync milestones
- When a deal closes → sync anniversary

Important: fire-and-forget pattern (don't block the user's save on the sync). Use `Promise.resolve().then(() => syncFn(...).catch(console.error))`.

### 11. Documentation

Create `docs/google-calendar-integration.md`:
- How to register the OAuth app in Google Cloud Console (step-by-step screenshots-friendly)
- What env vars to set (`GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `INTEGRATIONS_ENCRYPTION_KEY`, `STATE_SIGNING_SECRET`)
- How to test locally with ngrok
- Common errors and fixes

---

## Order of work (commit after each)

1. **Schema migration** (10 min) — write the SQL file. Don't run it; Henry runs it tomorrow.
2. **Encryption helper** (20 min) — `lib/integrations/encrypt.js` with unit-style sanity test in a comment.
3. **OAuth start + callback routes** (45 min) — both work end-to-end with state-signing CSRF protection.
4. **Token helper** (30 min) — `lib/integrations/google.js` with refresh + retry logic.
5. **Push to Google** (60 min) — all four sync functions, idempotent.
6. **Pull from Google** (45 min) — the cron route.
7. **Settings UI** (30 min) — Integrations tab in settings.
8. **Hook sync into Brikk events** (30 min) — lead/deal save hooks.
9. **vercel.json cron config** (5 min).
10. **Documentation** (30 min).
11. **Final commit** with summary of what's done + what Henry needs to configure.

**Total estimate: 4.5-5.5 hours.**

---

## Safety rules

- **Never commit secrets.** Use env vars for all keys. The encryption key, OAuth client ID/secret, and state signing secret all come from env, never hardcoded.
- **Encrypt tokens at rest.** Don't write plaintext access/refresh tokens to the database. If the encryption lib isn't done yet, leave a `TODO: encrypt before storing` comment and DO NOT proceed.
- **CSRF-protect the OAuth flow.** The `state` parameter must be HMAC-signed with the user's ID and verified on callback. Without this, an attacker can hijack the OAuth flow.
- **Rate limit the poll.** Google's free tier has quotas (~1M requests/day per project). Don't poll faster than every 15 minutes per user.
- **Soft-fail integrations.** If the user's token is revoked, log it and disable the integration row (set `enabled=false`). Don't crash other code paths.
- **No destructive Google operations without confirmation.** Brikk should never DELETE Google events the user didn't ask Brikk to manage — only update events Brikk originally created (tracked via `calendar_event_sync`).

---

## What to skip if you run out of time

In priority order (cut from the bottom):

1. ✅ MUST DO: Schema + encryption + OAuth flow + push birthdays/anniversaries
2. 🟢 STRONG: Pull-back sync (cron)
3. 🟡 NICE: Deal milestone push (close date, inspection, appraisal)
4. 🟠 SKIP: Microsoft Calendar (same architecture, future bot job)

Even if you only get through #1, that's massive — agents can see Brikk birthdays in their Google Calendar tomorrow morning.

---

## Reporting back

At the end (or when you stop), update `OVERNIGHT-BOT-REPORT.md` in the repo root with:

- ✅ Sections fully implemented
- 🟡 Sections partially implemented (with what's done and what's left)
- ❌ Sections not started
- 🐛 Any TODOs left in code, with file paths and line numbers
- 📋 What Henry needs to do manually:
  - Register OAuth app in Google Cloud Console
  - Set env vars (list exact key names)
  - Run schema migration
  - Push + redeploy

Keep that report under 400 words. Henry reads it first thing tomorrow morning.

---

---

# PART TWO: Pitch deck

After Google Calendar sync ships (or if you finish early), build a complete investor / brokerage-sales pitch deck for Brikk. Save as `pitch/brikk-pitch-deck.md` so Henry can convert to PDF or slides tomorrow.

The deck has to be detailed, accurate, and ready to send to investors or brokerage partners. No fluff, no generic startup language.

## Required sections (in this order)

### 1. Title + one-line value proposition
- "Brikk — the AI transaction coordinator in your pocket for solo real estate agents"
- One-sentence pitch
- Founder name (Henry Desrosier), location (Southern California), launch date

### 2. The problem (2 slides)
- Solo agents pay $300-500/month for legacy CRMs (Lofty, Follow Up Boss, KvCore, Real Geeks) and still need a transaction coordinator at $300-400/deal
- Most agents lose 30-40% of leads to slow response time (cite the WAV Group 15hr response stat)
- The market is consolidating around big brokerages with full-stack tech — solo agents are getting squeezed

### 3. The solution
- Brikk = AI CRM + AI transaction coordinator + AI lead capture + AI marketing analytics in one product
- $69.99/month (vs $300-500 for competitors)
- Voice-to-CRM, AI follow-up drafts, smart calendar, sentiment analysis, deal risk scoring, anniversary reminders, referral tracking, hyperlocal market reports
- Built for solo agents but scales to teams via Team plan

### 4. Product overview — feature inventory
Pull from `app/roadmap/page.js` (shipped section). For each feature:
- Name
- One-sentence description
- Why it matters (which time-suck or revenue-loss it kills)
- How it gets smarter over time (see section 5)

Group features:
- **Pipeline & lead management:** Lead pipeline, capture link, CSV import, sources analytics
- **AI Copilot:** Drafts, best-time-to-contact, sentiment, reply-with-AI, parse-chat-history
- **Voice-to-CRM:** Multi-action voice notes parsed into structured updates
- **Transaction coordination:** Deal tracker, public client tracker link, risk scoring, cold deal detection, listing prep checklist
- **Relationship glue:** Birthdays, anniversaries, referral ledger, morning briefing email
- **Marketing & analytics:** Source ROI, commission goal pacing, AI insights
- **Calendar:** Smart calendar, Google sync (if shipped tonight)

### 5. The "AI gets smarter" story — compounding intelligence
Explain how Brikk's AI improves with use, per agent:
- Day 1: writes generic-but-decent drafts
- Day 30: knows the agent's voice from approved/edited drafts
- Day 60: knows each lead's response patterns (best time to text, preferred channel)
- Day 90: predicts which leads will close based on the agent's historical conversion patterns
- Day 180: drafts feel indistinguishable from the agent's writing

Frame as a **data moat that doesn't transfer to competitors** — switching cost grows monthly.

### 6. API + infrastructure cost analysis

Honest unit economics per active user per month. Include actual current API pricing as of May 2026:

**Per-user monthly cost breakdown:**
- **Supabase** (database, auth, realtime): ~$0.50/user at scale (Pro plan amortized)
- **Anthropic Claude Sonnet 4.5** (Copilot drafts, sentiment, summaries, voice extract): ~$3.00/user — biggest variable cost
  - Roughly: 25 drafts/mo at 600 input + 250 output tokens = 22k tokens. At $3/M input + $15/M output = $0.07/draft. Sentiment classification at 200 tokens × 30 inbounds = $0.005/mo. Voice extract heavier. Total: $2-4/user.
- **Resend** (transactional email): ~$0.10/user (10k sends free, then $1/10k after)
- **Stripe** (payment processing): 2.9% + $0.30 per transaction = ~$2.30/user/mo on $69.99
- **Vercel** (hosting): ~$0.10/user at scale
- **DNS, monitoring, misc**: ~$0.20/user

Total variable cost: **~$6.20/user/month**. Gross margin at $69.99: **91%**.

Compare favorably to:
- Lofty: $449/mo with claimed 30% gross margin
- Follow Up Boss: $99-499/mo with claimed 70% margin

### 7. Expected returns model (Year 1)

**Conservative scenario:**
- Month 1-3: door-knock + organic = 25 paying customers
- Month 4-6: referrals + content = 75 customers (3x growth)
- Month 7-9: word-of-mouth compounds = 200 customers
- Month 10-12: 400 customers
- Year 1 ARR: ~$280k recurring at end of year ($69.99 × 400 × 12)
- Year 1 total revenue: ~$130k actual (ramp-up curve)

**Aggressive scenario:**
- Month 12: 1000 customers, $830k ARR

**Unit economics:**
- CAC (customer acquisition cost): $50 in year 1 (mostly organic + referral)
- LTV (12-month average subscription): ~$840
- LTV/CAC ratio: 16:1 (excellent SaaS metric)
- Payback period: <1 month
- Gross margin: 91%

**By year 3 (aggressive but plausible):**
- 5000 paying customers
- $4.2M ARR
- Add Team/Agency plans at $160-custom: +30% blended ARPU
- Add 1-2 brokerage partnerships at 100+ seats: floor revenue

### 8. Competitive comparison — feature matrix

Build a comparison table. Brikk vs:
- **Lofty (formerly Chime):** $449/mo, large brokerage focus, complex onboarding
- **Follow Up Boss:** $99-499/mo, established but no native AI, no voice
- **KvCore:** $399/mo, IDX-focused, dated UI
- **Real Geeks:** $299/mo, lead-gen-focused
- **LionDesk:** $39/mo (cheap competitor) — but limited features

For each, list 8-12 dimensions:
- Monthly price
- Setup fee
- Onboarding time
- AI follow-up drafts
- Voice-to-CRM
- Sentiment analysis
- Client-facing deal tracker
- Birthday/anniversary automation
- Referral ledger
- Lead capture link
- Mobile app
- Google Calendar sync

Show Brikk as the only product with all of these at <$100/mo.

### 9. Go-to-market strategy
- **Phase 1 (months 1-3):** Henry's network — door-knock 50 local agencies in Southern California. Lead capture link is the trojan horse.
- **Phase 2 (months 4-6):** Referrals + Instagram content. Every paying agent gets a referral link with a free month for both sides.
- **Phase 3 (months 7-12):** Content marketing — blog posts on Reddit r/realestate, YouTube tutorials, partnerships with real estate coaches.
- **Phase 4 (year 2):** Brokerage sales — pitch the Team/Agency plan to mid-size brokerages.

### 10. The moat (why this can't just be cloned)
- **Data moat:** Each agent's AI gets smarter with their use — switching costs compound. Section 5 details this.
- **Compound features:** Birthday reminders + anniversary automation + referral ledger together = relationship loyalty. Each individually is small; together they create habits.
- **Pricing moat:** 91% margin at $69.99 means competitors at $300+ can't match price without rebuilding their cost structure.
- **Voice-to-CRM moat:** Most CRMs have NO voice interface. This is the killer feature for agents who are constantly in the car.

### 11. The team / founder slide
- Founder bio (Henry Desrosier)
- Why now (AI infrastructure is finally cheap enough)
- Why you (real-estate-adjacent context, building for self originally)

### 12. The ask
- If pitching investors: $X seed round at $Y valuation, runway to Z customers
- If pitching brokerages: deal terms (per-seat pricing, white-label option, revenue share)
- If pitching partnerships: specifically what integration / data flow

Leave this as a placeholder for Henry to fill in based on context.

### 13. Risks + mitigations
Be honest. Real risks include:
- **Apple/Google could clone:** mitigation = move fast, build relationships before they care
- **A big competitor could match price:** mitigation = network effects via referral marketplace
- **TCPA/legal liability:** mitigation = native phone sending pattern, not server SMS
- **AI cost spike:** mitigation = own the prompt-engineering, switch models freely

### 14. Closing slide
- Demo URL (brikk.store)
- Contact (hello@brikk.store)
- "Built by realtors, for realtors."

## Format

Write `pitch/brikk-pitch-deck.md` as a polished markdown document. Henry can render to PDF via pandoc or copy-paste into Google Slides / Pitch / Beautiful.ai.

Include:
- Real numbers (not placeholders) for API costs, drawn from current Anthropic / Supabase / Stripe pricing pages
- Real customer-facing language (no startup speak like "10x" or "synergize")
- Specific feature lists, not vague "AI-powered" claims
- Comparison data that's actually accurate (research current competitor pricing)

Target length: ~3000 words / would be 14-18 slides if formatted visually.

---

# PART THREE: This week's checklist

After the pitch deck is done, build `THIS-WEEK.md` in the repo root. It's the master operational checklist for Henry's next 7 days. Not aspirational, not "maybe" — actionable items he can knock out one by one.

## Required sections (in this order)

### Today (Monday)
- Push everything overnight bot shipped
- Run new SQL migrations in Supabase (v2-feature-pack.sql, google-calendar-integration.sql, link-deals-to-leads.sql if not yet)
- Update Stripe prices per PRICING-CHANGE.md
- Test signup flow end-to-end
- Reply to iOS freelancer

### Tuesday — Outreach + Operations
- Door-knock 10 local agencies in Southern California (script: `marketing/door-to-door-script.pdf`)
- Send 20 cold emails using the script in `marketing/cold-outreach.pdf`
- Post first Instagram reel about Brikk
- Onboard any signups from yesterday — personal welcome call
- Set up Google Cloud Console OAuth registration per `docs/google-calendar-integration.md`
- Add Google Calendar env vars to Vercel + redeploy

### Wednesday — Product polish
- Wire sentiment chip on lead detail page (5 lines of code — surface the `sentiment` column visually)
- Wire listing prep checklist UI per `lib/listingTemplates.js`
- Build offer comparison sheet UI on lead detail (schema already in `offers` table)
- Wire missed-call quick action button (sms: deep-link)
- Hand-test all v2 features as a real user

### Thursday — Marketing push
- 10 more cold emails
- LinkedIn post with Brikk demo screen recording
- Reach out to 3 real-estate YouTubers / podcasters offering free Pro accounts for honest reviews
- Update Brikk Instagram bio with brikk.store/r/HENRY-CODE
- Apply to be on 1 real-estate podcast

### Friday — Sales + customer support
- Customer-success outreach to every paying signup so far (text or call each)
- Ask the 1-week paid users for their first testimonial — replace one placeholder on landing page
- Reply to every hello@brikk.store email within 4 hours
- Review Resend Logs for any failed sends
- Review Stripe Dashboard for any disputes (should be zero with all-sales-final policy)

### Saturday — Build day
- Pick ONE stretch goal from Part 4 below + ship it
- Update `app/roadmap/page.js` to reflect newly shipped feature
- Tweet/Instagram about the new feature with screen recording

### Sunday — Weekly review + plan
- How many signups this week? Conversion rate?
- What did customers ask for most? Update priority list.
- What broke? Fix it Monday.
- Set 3 specific goals for next week.

## Format

Plain markdown checklist with `[ ]` checkboxes. Date each section. Time estimates per task where relevant. Link to relevant docs in the repo where appropriate.

---

# PART FOUR: Stretch goals (do these after Parts 1-3)

If you finish Parts 1-3 with time to spare (or stall on any of them), work through these in order. They're all real product improvements Henry needs. Each is roughly 30-90 min for a competent coder.

## Stretch 1: Sentiment chip visible on lead detail page
File: `app/app/leads/[id]/page.js`
Inbound messages already get `sentiment` classification. Surface it as a colored badge next to the message text:
- warm = green
- cool = amber
- frustrated = red
- neutral = no badge
The sentiment column on `messages` is populated automatically — you just need to read it and render.

## Stretch 2: Listing prep checklist UI
Files: `app/app/leads/[id]/page.js` (or new `app/app/deals/[id]/page.js`)
Schema already exists (`checklist_items`). Templates already exist (`lib/listingTemplates.js`). Build:
1. When a new deal is created in seller mode → API call seeds checklist items from `LISTING_PREP_TEMPLATE`
2. On the lead detail page, render the checklist with checkboxes
3. Tap to toggle done. Editable labels. Add custom items.
4. Show progress (X of Y items done)
5. Show overdue items in red

## Stretch 3: Offer comparison sheet builder
File: new `app/app/listings/[deal_id]/offers/page.js` + new entry point on lead/deal detail
Schema already exists (`offers` table). Build:
1. Page with table of all offers for a listing — price, earnest money, contingencies, close date, status
2. + Add offer button → form
3. AI-generated commentary: "Offer A is highest price but has financing contingency expiring soon — Offer B is $10k less but cash, faster close"
4. Mark one as Accepted, others as Rejected
5. Generate a PDF/shareable summary

## Stretch 4: Open house sign-in page
File: new `app/openhouse/[code]/page.js`
Public form like `/r/[code]` but for open house attendees. Captures name + phone + email + "rate this house 1-5". Auto-creates lead with source = "Open House", sends agent a real-time notification, sends visitor a thank-you text 30 minutes after the open house ends. Agent generates the code per open house from their settings.

## Stretch 5: Missed-call quick action
File: `app/app/leads/[id]/page.js` (lead detail)
Add a "Log missed call → text back" button. Opens `sms:phone?&body=Hey%20${first_name}%2C%20just%20missed%20you%20%E2%80%94%20I%27ll%20call%20back%20within%20the%20hour.` deep link. Logs as `interaction_type='text_sent_after_miss'`. 30 seconds of code, hours of value.

## Stretch 6: Hyperlocal market report PDF generator
File: new `app/api/reports/market/route.js` + new entry point on Marketing page
Build a server-side PDF generator that takes a zip code + the agent's branding and produces a 1-page market summary PDF: median sale price, days on market, inventory level, AI-written commentary. Use mocked data initially with TODO to wire RentCast or Realty Mole API later. The point is the workflow — agents click a button, get a branded PDF they can send to their sphere.

## Stretch 7: Showings booking page
File: new `app/book/[code]/page.js`
Public Calendly-style page where buyers self-schedule showings. Agent sets their available windows in Settings → Schedule. Each booking auto-creates an event in Brikk's calendar (will sync to Google once Part 1 ships) and creates a lead if the email is new. Replaces Calendly entirely.

## Stretch 8: AI tour notes after showings
File: extend `lib/Voice.js` (the floating voice button)
Add a "Tour mode" toggle. When in tour mode, recordings get a different AI prompt: "Structure this as buyer-facing pros and cons of the property they just toured." Output is a clean Markdown summary that opens in a mailto link to send the buyer.

## Stretch 9: Property tour AI notes (mobile)
Same as Stretch 8 but optimized for mobile-recorded notes during a showing. Add a "Just toured" prompt option in the voice modal that pre-formats the output as a "Recap from our showing at [address]" email draft.

## Stretch 10: Brokerage compliance scanner
File: new `app/api/copilot/route.js` mode `'compliance_check'`
Before any outbound message is logged as sent, optionally run it through Anthropic with a prompt that checks for TILA, RESPA, Fair Housing red flags. Flag any potential issues to the agent BEFORE they send. This is the B2B/brokerage hook — sells Brikk to compliance officers at $$$ per seat.

---

## Final deliverables when you stop

You should have committed and pushed:

1. **Part 1** — Google Calendar integration to at least Phase 3 (OAuth flow shipped + ability to connect/disconnect)
2. **Part 2** — `pitch/brikk-pitch-deck.md` complete, ~3000 words
3. **Part 3** — `THIS-WEEK.md` complete, 7-day operational plan
4. **Part 4** — at least 2 stretch goals fully shipped
5. **`OVERNIGHT-BOT-REPORT.md`** — under 500 words, honest accounting:
   - ✅ What's fully shipped
   - 🟡 What's partial (with status %)
   - ❌ What's not started
   - 🐛 All TODOs you left in code (file:line references)
   - 📋 What Henry must configure manually:
     - Env vars to set (list var names + how to obtain values)
     - SQL migrations to run (list files)
     - Apple Developer / Google Cloud Console / Resend dashboard tasks
   - 🚦 Recommended order for Henry to tackle the above

## Start now

You have everything. Open `OVERNIGHT-BOT-REPORT.md` first and write a single line: "Started [timestamp]. Working." Then go.

Don't reread this prompt. Just work. Henry will see your commits.

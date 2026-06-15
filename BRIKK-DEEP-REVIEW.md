# Brikk — Combined Deep Review

Synthesis of five independent reviews (feature necessity, agent-workflow gaps, UX/friction, code quality/security, monetization/retention), each conducted against the actual codebase. Plus the critical fixes already applied.

---

## EXECUTIVE VERDICT

**Brikk is a genuinely good product that's spread too thin and shipped without an on-ramp.** Two reviewers independently — UX and monetization — landed on the same #1 problem from completely different angles: **a new agent signs up, lands on an empty dashboard, and the single feature that would hook them (Voice-to-CRM) is a hidden, unlabeled button.** The product never shows its value before asking the agent to do work.

The biggest thing standing between Brikk and indispensability is not more features — it's an **onboarding flow that gets a new agent to a populated dashboard + one AI follow-up sent by voice, inside the first session.** Fix that and trial-to-paid and churn both move without touching the price or adding a feature.

Secondary: the product markets ~29 features but ~6 carry it, several are misleadingly named or don't have UI at all, and there are real workflow gaps (comps, documents/e-sign, contingency deadlines) that keep Brikk a *complement* to the MLS rather than the agent's home base.

---

## CRITICAL ISSUES — already fixed tonight

The code review found these. All four are now patched:

1. **[FIXED] Stripe checkout trusted client-supplied `userId`/`email`** — an attacker could attach a paid subscription or trial to someone else's account. Now derives identity from the verified Supabase session.
2. **[FIXED] Google Calendar `start` route had a duplicate `const url`** — a SyntaxError that would have **broken the entire build on deploy.** Reworked into a POST that returns the URL.
3. **[FIXED] `access_token` was passed in the OAuth URL** — leaked the full Supabase session into browser history, server logs, and Google's Referer header. Now the token only travels in the Authorization header.
4. **[FIXED] `/api/copilot` had zero auth** — anyone could spam unlimited Anthropic calls (denial-of-wallet). Now every mode except the public landing-page chat requires a signed-in session. All six internal callers updated to send the token.

---

## STILL OPEN — should fix before scaling (from code review)

- **Stripe price→plan fallback can mischarge.** If `STRIPE_PRICE_PRO`/`_TEAM` env vars aren't set, code silently falls back to legacy $75/$200 prices while the UI shows $69.99/$160. Fix: hard-fail if the env vars are missing. (Already documented in PRICING-CHANGE.md — just don't deploy without setting them.)
- **Webhook isn't truly idempotent.** No event-ID dedupe table; Stripe retries can re-run profile updates and re-send trial-ending emails. Fix: record `event.id` in a `processed_events` table, short-circuit duplicates.
- **Morning-brief cron won't scale past ~100-200 users.** Serial loop + 55s self-abort means most agents silently get no brief at scale. Fix: queue/batch per-user jobs or paginate with a persisted cursor.
- **Cron auth bypassable if `CRON_SECRET` unset.** Both cron routes use `if (CRON_SECRET)` — an unset secret makes them fully public. Fix: hard-fail if missing.
- **`/api/refer` has no rate limiting** — public lead form is a spam/injection vector. Fix: per-IP throttle or captcha.
- **Team join has a check-then-act race** — two simultaneous joins can exceed max_seats. Fix: DB constraint.

(Encryption code for Google tokens was reviewed and is correct — no issues.)

---

## THE 6 FEATURES THAT MATTER (the center of gravity)

Everything an agent touches daily lives here. The whole product should orbit these:

1. **Lead pipeline** — the spine
2. **AI Copilot drafts** (including reply-with-AI) — the actual reason to pay $70 vs. a spreadsheet
3. **Today dashboard / morning action list** — the "open one screen, know what to do" promise
4. **Deal tracker + public client tracker link** — the closing half + the one feature competitors don't have
5. **Conversation history + native send** — log once, never lose context
6. **Real-time new-lead alerts + CSV import** — get leads in, respond first

Plus a 7th the reviews crowned as the *strategic* center: **Voice-to-CRM** — it's both the daily-habit moat AND the cure for the data-entry problem that kills activation. It just needs to stop being hidden.

---

## DEAD WEIGHT — cut, merge, or hide

**Cut (misleading or non-existent):**
- **Missed-call auto-text** — there's no missed-call detection; it's a manual `sms:` link dressed up as automation. Rename or remove.
- **Best-time-to-contact** — one derived sentence based on message volume solo agents won't have. Fake precision.
- **Listing prep checklist** — DB table exists, **no UI.** Remove from "shipped" until built.
- **Offer comparison sheet** — same: `offers` table, **no UI.** Vaporware until built.

**Merge:**
- Reply-with-AI → it's literally Copilot drafts + a `replyingTo` param. One engine, stop selling it as separate.
- Cold-deal detection + deal risk scoring → one "Deals needing attention" surface, not two features.
- Parse-chat-history → fold into the import flow.

**Demote/hide (useful to someone, but don't headline):**
- Google Calendar sync (heavy infra, niche need for a 1-30-deal agent), referral ledger, sentiment analysis, birthday + anniversary reminders, lead capture link, commission goal pacing, voice-to-CRM's *visibility* should go UP not down — but its menu position is currently wrong.

**Brutal stat:** ~29 marketed features, ~6 carry the product, at least 4 are misleadingly named or have no UI.

---

## THE GAPS — what makes agents leave Brikk (ranked by frequency)

The workflow review walked an agent's actual day. Every time they open another app is a gap:

1. **Comps / pricing / "what's it worth" — multiple times daily.** Brikk has price *fields* but zero market data. Every listing appointment, every offer-price conversation, the agent opens MLS/Zillow. The single most frequent exit. Build: a manual CMA tool — "enter 3-5 comps → suggested range + printable one-pager."
2. **Listing search to send buyers — several times/week.** No IDX data. Agent lives in the portal, texts links manually, replies never make it back to the lead record. Build: saved-search + link-share log tied to a lead.
3. **Documents & e-signature — every active deal.** No document storage (only CSV + profile-pic upload), no DocuSign status. Biggest credibility gap for a "transaction coordinator." Build: per-deal document storage (Supabase Storage already in stack), then a DocuSign/Dotloop status link.
4. **Showing scheduling & buyer tour day — 2-4x/week.** No itinerary/showing feature. Build: buyer tour itinerary with ordered stops, access notes, per-property quick-notes that log to the lead.
5. **Under-contract deadline tracking — every deal, high stakes.** Brikk tracks stage + one close_date but NOT per-contingency deadlines (inspection/appraisal/financing/title) — the dates that actually blow up deals. `checklist_items` has a due_date column but nothing auto-generates the critical-date set. Build: auto-generate contingency-deadline checklist on contract date with countdown alerts.
6. **Open-house attendee capture — weekly for listing agents.** The /r/CODE link exists but isn't framed for kiosk use, and there's no "work the list afterward" flow. Build: kiosk-mode sign-in (QR + big touch fields, auto-tag "Open House") + "draft follow-up to all attendees" action.

**Pattern:** Brikk owns the *relationship + tracking* layer well. The gaps cluster on **market data (comps, listings)** and **transaction execution (documents, e-sign, deadlines)** — exactly the recurring, credibility-defining moments. Comps (#1) and documents (#3) are the two that keep Brikk a complement to the MLS rather than the agent's home base.

---

## UX & FRICTION — top issues

**Critical:**
1. **Voice-to-CRM is invisible.** The #1 feature is an unlabeled black circle stacked awkwardly over the tab bar. A non-tech agent reads it as a generic button and never taps it. Fix: label it ("Talk to Brikk"), first-run coachmark, surface a "Capture by voice" card on Today.
2. **Eight tabs in the mobile bottom bar at 375px** = ~43px each, below the 44px tap-target minimum, with labels that *rename* sections vs. desktop ("ROI" vs "Marketing", "Chats" vs "Conversations"). One-handed in a car = guaranteed mis-taps. Fix: 5 tabs max, consistent labels.
3. **No onboarding.** New agent lands on an empty dashboard of zeros and one "Add lead" button. No tour, no sample data, no explanation. Fix: 3-step first-run (import/add a lead → try voice → see first AI draft).

**Important:**
4. Trial gate hard-redirects expired users to /app/upgrade before they've seen value — let them view read-only, gate only actions.
5. The lead form is a 20-field wall — collapse to Name/Phone/Temp with a "More details" expander.
6. **"Sent" is a polite lie** — Copilot and Messages auto-log a message as "sent" 300ms after opening the `sms:` link, even if the agent backs out without sending. History fills with un-sent messages. Fix: log as "drafted/opened" or confirm-on-return.
7. Lead-capture link (a top growth feature) is buried in Settings tab 6 of 8.

**Top 3 reasons a new agent gives up:** (1) "what do I do now?" — empty dashboard, no path; (2) the mystery mic button — the hero feature is hidden; (3) friction wall — 20-field form one-handed, then find Copilot, then Generate, all while a non-dismissable trial banner counts down.

---

## MONETIZATION & RETENTION

- **Activation aha-moment is buried behind manual data entry.** Realistically only ~15-25% of trial signups hit it in 48 hours — only the disciplined ones who hand-enter 5+ leads. The INVESTOR-FAQ even names "5 leads in week 1" as the activation threshold, but the product does nothing to drive it. **#1 fixable problem.**
- **Week-1 subscribe trigger:** "Brikk caught a deal/lead I'd have dropped." That exists and is good — but it's diluted across 23 features and a 9-item landing grid. The agent can't tell what Brikk is *for*.
- **Week-2 cancel risk:** the dashboard stayed empty → no value → "just another CRM I have to feed."
- **The un-cancelable feature: Voice-to-CRM.** Talk after a showing, pipeline updates itself. Daily physical habit competitors can't copy, AND it solves the activation/data-entry problem. **Center the entire onboarding + landing page on it: "Talk to your CRM. It updates itself."**
- **Pricing verdict:** $69.99 is fine; the *funnel* is the leak. No-card-required + empty product = tire-kickers who never activate. Either force activation in session one, OR test card-required trials (convert 2-3x better). Consider a **$34/mo "Solo Lite"** (capped AI drafts) for the 1-3-deal agent who balks at $70 — the codebase already contemplates draft quotas.
- **Price-to-value honesty:** "replaces a $400 CRM + $400/deal coordinator" is a screaming bargain for a 30-deal agent. For the stated target (8-deal, $40-60k agent who was using a free spreadsheet) the honest value is "$70 to never drop a lead again" — and you must *prove* it in week 1 or the price reads as "$70 for a spreadsheet with AI."

---

## WHAT WOULD MAKE BRIKK UN-CANCELABLE

Center the product on **Voice-to-CRM as the onboarding AND the daily habit.** First thing a new agent does: tap a labeled button, talk about their leads, watch the pipeline populate itself. That single change:
- Solves activation (no more empty dashboard / 20-field form)
- Creates a daily physical habit (in the car after every showing)
- Is the one thing competitors structurally can't copy

Right now it's tab 4 of 8 and an unlabeled FAB. It should be the hero of the landing page, the first onboarding step, and the most prominent button in the app.

---

## THE HONEST RISK (the thing you don't want to hear)

**You've been adding features when the product's problem is the opposite — it needs fewer, sharper, better-onboarded features.** Tonight's session added 9 more (deal tracker, sentiment, anniversaries, referrals, commission pacing, etc.) and two of them (listing checklist, offer comparison) shipped as schema-only vaporware on the roadmap. Every new feature dilutes the "what is this for" answer and adds menu clutter for a non-tech agent using the app one-handed in a car.

**Stop building. Spend the next week on ONE thing: an onboarding flow that gets a new agent to a populated dashboard + one voice-captured lead + one sent AI follow-up, in their first session.** That moves trial-to-paid and churn more than any feature on the roadmap. Then go back and either build the 4 vaporware/misleading features for real, or cut them from the marketing.

---

## RECOMMENDED PRIORITY ORDER

**This week (retention-critical):**
1. Build the onboarding flow (voice-first activation)
2. Label + surface the voice button; move it off the tab-bar collision
3. Fix the "sent" lie (confirm-on-return logging)
4. Cut the bottom bar to 5 tabs, consistent labels
5. Remove the 2 vaporware features from "shipped" OR build their UI

**Before scaling (the still-open code issues above):**
6. Hard-fail on missing Stripe price + CRON env vars
7. Webhook idempotency (event dedupe table)
8. Rate-limit /api/refer and /api/copilot per-user
9. Morning-brief cron pagination

**Next month (the real gaps):**
10. Comps / CMA tool (#1 daily exit)
11. Per-deal document storage (#3 credibility gap)
12. Contingency deadline auto-generation (#5 deal-saver)

---

*Reviews conducted May 21, 2026 against the live codebase. Five independent agents, one synthesis.*

# Brikk · Launch Day Master Checklist

Single document for finishing Brikk's pre-launch work. Three sections:

1. **MANUAL TASKS** — you must do these yourself (dashboards, DNS, credentials)
2. **BOT TASKS** — copy-paste prompts into Claude in Chrome to run hands-free
3. **GO/NO-GO GATES** — final verifications before announcing

Work top-down. Each task has a checkbox, an estimated time, and a clear "done when" criterion.

---

# 🖐️ SECTION 1: MANUAL TASKS (do these yourself)

These require credentials, dashboard access, or judgment calls a bot can't make. Total time: ~75-90 min spread across pauses for verification.

## Block A — Push & deploy (5 min)

### [ ] A1. Push the current branch to GitHub
Open Terminal, navigate to `C:\Users\Henry\OneDrive\Documents\GitHub\brikk-store`, run:
```
git add .
git commit -m "Pre-launch: Stripe v2, audit fixes, sticky nav, responsive fixes, viewport relax"
git push
```
**Done when:** GitHub shows the latest commit on the main branch and Vercel starts a fresh build.

## Block B — Vercel environment variables (15 min)

All go in Vercel → Brikk project → Settings → Environment Variables. Add or edit, never delete.

### [ ] B1. `CRON_SECRET`
- Generate 32+ char random string at https://1password.com/password-generator
- Key: `CRON_SECRET`, Value: paste, Environments: Production + Preview
- **Save the value in your password manager.**

### [ ] B2. `STRIPE_WEBHOOK_SECRET`
- Source: Stripe Dashboard → Developers → Webhooks → "Brikk production webhook" → Reveal signing secret
- Format: `whsec_…`
- Environment: Production only

### [ ] B3. `STRIPE_SECRET_KEY` (restricted)
- Stripe → Developers → API keys → **+ Create restricted key**
- Name: `brikk-vercel-prod`
- Scopes: Checkout Sessions Write · Customers Write · Subscriptions Write · Customer Portal Write · Prices Read · Products Read · Invoices Read · Setup Intents Write · everything else None
- Copy the `rk_live_…` value
- Vercel → Add `STRIPE_SECRET_KEY` → Production

### [ ] B4. `NEXT_PUBLIC_APP_URL`
- Value: `https://brikk.store`
- Environments: Production + Preview + Development

### [ ] B5. `APPLE_PAY_DOMAIN_ASSOCIATION` (waits for Nathan)
- Source: Nathan sends after he completes Stripe Apple Pay setup
- Value: paste the entire single-line string exactly, no whitespace
- Environment: Production only

### [ ] B6. Redeploy
- Vercel → Deployments → most recent → ⋯ → **Redeploy**
- Uncheck "Use existing Build Cache"
- Wait for green build

**Done when:** Build is green. Visit brikk.store and confirm sticky nav + 14 Days CTA appear.

## Block C — Supabase configuration (10 min)

### [ ] C1. Run the realtime SQL
Open Supabase → SQL Editor → New Query. Paste:
```sql
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
SELECT schemaname, tablename FROM pg_publication_tables
WHERE pubname='supabase_realtime' ORDER BY tablename;
```
Click Run. Results table at bottom should show `leads` and `messages`.

### [ ] C2. Set Site URL
- Supabase → Authentication → URL Configuration
- Site URL: `https://brikk.store`
- Additional Redirect URLs: include `https://brikk.store/auth/callback`

### [ ] C3. Update SMTP Sender email
- Supabase → Authentication → Emails → SMTP Settings
- Sender email: `hello@brikk.store` (was `noreply@brikk.store`)
- Sender name: `Brikk`

## Block D — Resend cleanup (10 min)

### [ ] D1. Generate a fresh Sending-scope key
- Resend → API Keys → Create API Key
- Name: `Brikk Supabase SMTP v2`
- Scope: **Sending access** (NOT Full)
- Copy the value (only shown once)

### [ ] D2. Paste into Supabase SMTP password
- Supabase → Auth → Emails → SMTP Settings → Password field → paste → Save

### [ ] D3. Test signup
- Incognito → brikk.store/login → Sign up with `henry+launchtest@gmail.com`
- Confirmation email should arrive within 30s from `Brikk <hello@brikk.store>`
- Resend → Logs → confirm `Brikk Supabase SMTP v2` is what fired

### [ ] D4. Tell the bot to clean up old keys
Open the Claude in Chrome bot session that's still waiting on your "approved" reply, type:
```
approved 2026-05-20 — verified new SMTP key is live, also revoke old Brikk Supabase SMTP
```

### [ ] D5. Fix the misspelling
Resend → API Keys → `Brikk Vercel Transacrtional` → rename → `Brikk Vercel Transactional`

### [ ] D6. End state check
Exactly 2 Resend keys, both Sending-scope:
- `Brikk Supabase SMTP v2` → wired into Supabase Auth SMTP password
- `Brikk Vercel Transactional` → wired into Vercel `RESEND_API_KEY`

## Block E — DNS (10 min)

### [ ] E1. Publish DMARC TXT record
Log into your DNS provider (wherever brikk.store is registered), add a TXT record:
- Type: TXT
- Name/Host: `_dmarc`
- Value: `v=DMARC1; p=none; rua=mailto:dmarc@brikk.store`
- TTL: 1 hour or auto

### [ ] E2. Verify DMARC
- Wait 30 minutes for DNS propagation
- Test at https://dmarcian.com/dmarc-inspector/ — enter `brikk.store`
- Should return a valid DMARC record

### [ ] E3. Set up `hello@brikk.store` inbound forwarding
- Free option: https://improvmx.com → add brikk.store → forward `hello@brikk.store` → `hmdesrosier@gmail.com`
- Test: from your phone, email hello@brikk.store. Should arrive in Gmail.

## Block F — Stripe key rotation (5 min)

### [ ] F1. Roll the old unrestricted Stripe key
- Stripe → Developers → API keys
- Find the OLD `sk_live_…wmZB` (created Apr 13)
- ⋯ → **Roll key**
- Confirm. This invalidates the old unrestricted key permanently.

**Done when:** the old `sk_live_` is no longer usable. Only your new restricted `rk_live_brikk-vercel-prod` remains active.

## Block G — Real-device tests (10 min)

These can't be done in DevTools — you need actual hardware.

### [ ] G1. iPhone Apple Pay button check
- Open `brikk.store` in Safari on a real iPhone (not simulator, not Chrome)
- Sign in to a throwaway account, go to `/app/upgrade`
- Apple Pay button should appear above credit card form
- If missing: re-check Stripe Apple Pay domain verification + `APPLE_PAY_DOMAIN_ASSOCIATION` env var

### [ ] G2. Android Chrome smoke test
- Open brikk.store on Android Chrome
- Add to home screen — confirm Brikk icon appears (new two-brick mark, not old "B")
- Tap icon, app opens full-screen
- 8-tab bottom bar visible, voice button visible, scrolling smooth

---

# 🤖 SECTION 2: BOT TASKS

Copy-paste each prompt below into a Claude in Chrome session. The bot runs each task while you do something else. **Don't paste passwords into the bot — it has safety rules to refuse them.** Run these in order — later bots assume earlier ones succeeded.

---

## Bot Task 1: Verify all Vercel env vars are present (10 min)

Run this AFTER Block B is complete. The bot reads the Vercel env vars list and confirms each required key exists.

```
Mission: Audit Vercel environment variables for Brikk and confirm each required key exists in Production. Read-only — don't modify anything.

Safety rules:
- Don't click "Reveal" on any value. Only confirm presence, not contents.
- Don't add, edit, or delete anything.
- If a login screen appears, stop and tell Henry to sign in manually.

Open vercel.com → Brikk project → Settings → Environment Variables. Manually scroll the entire list (don't use search — it had a stale toast in a prior audit). For each key below, mark as PRESENT / MISSING. If present, note the environments it's applied to (Prod / Preview / Dev) and whether it's a "Shared" var or project-scoped.

Required keys:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- ANTHROPIC_API_KEY
- RESEND_API_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- NEXT_PUBLIC_APP_URL
- CRON_SECRET
- APPLE_PAY_DOMAIN_ASSOCIATION

Optional (don't fail if missing):
- STRIPE_ENABLE_TAX
- RESEND_FROM_DOMAIN

Report in this format:

VERCEL ENV VAR AUDIT — [timestamp]
PRESENT (Production):
- KEY_NAME — Prod/Preview/Dev — Shared or Project
MISSING:
- KEY_NAME — [criticality: blocks launch / degrades feature X]
NOTES:
- Anything unusual (extra variables, stale ones, naming inconsistencies)

Keep report under 250 words.
```

---

## Bot Task 2: Full pre-launch verification sweep (60 min)

Run this AFTER Block A (deploy) is green. This is the master verification — runs all the audit re-checks, LiveDemo tests, responsive checks, perf checks, DMARC check, and produces a single readable report.

```
Mission: Pre-launch verification sweep for brikk.store. ~60 minutes. Produce one consolidated report.

Safety rules:
- Read-only. Don't sign up new accounts (burns inbox slots), don't enter payment info, don't type passwords.
- Stay on brikk.store, dmarcian.com, mxtoolbox.com.
- Take screenshots only of public pages.

Phase 1 — Deploy freshness (5 min): Open brikk.store. View source. Confirm: hero CTA says "Get 14 Days Free", middle nav says "Get started", nav is sticky on scroll, pricing has 3-across at desktop width, pricing footer says "All sales final. No refunds". If any are missing, STOP and report "stale deploy".

Phase 2 — Audit re-verify (15 min): Run all 14 items from the AUDIT-RESPONSE.md verification table. Mark each PASS/FAIL with a one-line note.

Phase 3 — LiveDemo (10 min): Scroll to the demo embed. Click all 8 tabs in order. Confirm each renders without blank states and that:
- Today: pulsing green "1 new lead · 12 min ago" pill
- Copilot: cards show "Send via Messages" + "Send via Email" + "Edit"
- Leads: at least one row has red "YOUR TURN" badge
- Voice: recording indicator + 3 action cards + "Approve all"
- Chats: "Reply with AI ✨" pill + 3 quick-reply chips
- ROI: 4 metric cards + AI Insight callout

Phase 4 — Responsive (10 min): DevTools → device toolbar. Test at 375px, 768px, 1316px. Scroll top to bottom at each. Note: no overflow, no element overlap, pricing renders 3-across at 1316 and at 768 (the 768 case was just fixed — verify), nav stays sticky at top.

Phase 5 — Perf (5 min): Hard reload (Cmd+Shift+R / Ctrl+Shift+R). Network tab → note DOMContentLoaded, Load time. Console tab → list any errors. Should be 0 errors.

Phase 6 — DMARC/DNS (5 min): Visit dmarcian.com/dmarc-inspector with brikk.store. Note DMARC presence + policy. Also check that the site loads cleanly over HTTPS.

Phase 7 — Final report. Format:

=== BRIKK PRE-LAUNCH VERIFICATION REPORT ===
Run date:
Verified by: Claude in Chrome bot

DEPLOY STATUS: [Fresh / Stale / Failed]
AUDIT (14 items): [N passed / N failed — list any failures]
LIVEDEMO (8 tabs): [N pass / list issues]
RESPONSIVE: 375px [pass/issues], 768px [pass/issues], 1316px [pass/issues]
PERFORMANCE: load [Xms], errors [N + list]
DMARC: [present, policy / missing]
NEW ISSUES (not in audit):
1. ...
LAUNCH READINESS: [Ready / Block on X / Polish needed]

Keep report under 600 words. Don't keep working after the report — stop.
```

---

## Bot Task 3: Test the signup → confirm email flow (10 min)

Run this AFTER Block C and D are complete.

```
Mission: Test the brikk.store signup confirmation email flow end-to-end. Verify the email arrives, links to the right domain, and is from hello@brikk.store.

Safety rules:
- Use email `henry+botsignup-[timestamp]@gmail.com` (Gmail aliases — they all forward to henry@gmail.com).
- Don't type Henry's real password if a sign-in screen blocks you. Stop and ask.
- Don't complete a paid checkout.

Steps:
1. Open incognito tab → brikk.store/login → click Sign Up
2. Enter email above, generate a random throwaway password, submit
3. Open Henry's Gmail (he should have it open already in another tab). Find the confirm-account email.
4. Verify the email:
   - From: should be exactly "Brikk <hello@brikk.store>" (NOT noreply@, NOT supabase.co)
   - Subject: "Confirm your Brikk account"
   - The "Confirm" link href: should start with "https://brikk.store/auth/callback" (NOT supabase.co)
   - The email body uses Brikk's branded HTML template (dark text, white card, monogram)
5. Click the confirm link. Should land on brikk.store/app or /login with a success state.
6. Don't proceed further — sign out.

Report:

SIGNUP EMAIL TEST — [timestamp]
Test email: henry+botsignup-XXX@gmail.com
Email arrived: [yes/no, latency in seconds]
From header: [exact value]
Subject: [exact value]
Confirm link target: [domain only, not full URL with token]
Body branding: [matches/old plain template/missing]
Confirm click result: [landed on brikk.store/X | error message]
Overall: [PASS / FAIL with reason]

Keep under 200 words.
```

---

## Bot Task 4: Stripe webhook smoke test (5 min)

Run this AFTER Block B is complete (env vars + redeploy).

```
Mission: Send a test event to the Brikk production Stripe webhook and confirm 200 OK response.

Safety rules:
- Live mode. Don't modify the webhook endpoint config.
- Don't trigger real charges.

Steps:
1. Open Stripe Dashboard. Confirm Live Mode (top-left, not orange "Test mode").
2. Developers → Webhooks → click "Brikk production webhook".
3. Click ⋯ menu (top right) → Send test webhook.
4. Pick event type "checkout.session.completed". Click Send test webhook.
5. Wait 5-10 seconds.
6. Scroll to "Recent attempts" section. Find the test event you just sent.
7. Report the HTTP status code returned by brikk.store/api/stripe/webhook.

Report:

WEBHOOK SMOKE TEST — [timestamp]
Event sent: checkout.session.completed
HTTP status: [200 / 4xx / 5xx]
Response time: [ms if visible]
Other recent attempts in last hour: [count, any failures]
Verdict: [PASS — webhook is wired / FAIL — code [signing secret wrong, route returning error, etc.]]

If FAIL, recommend: check that STRIPE_WEBHOOK_SECRET in Vercel matches the signing secret shown on the webhook detail page.

Keep under 150 words.
```

---

## Bot Task 5: Resend deliverability check (10 min)

Run this AFTER Block C, D, E are complete.

```
Mission: Confirm Resend deliverability metadata is healthy: DKIM, SPF, DMARC all verified, no failed sends in the last 24h.

Safety rules:
- Read-only. Don't rotate keys.
- Don't reveal key values.

Steps:
1. Open resend.com → Domains → click brikk.store. Verify:
   - DKIM: ✓
   - SPF: ✓
   - DMARC: ✓ (this only appears after DNS propagation, may be pending)
   - Region/Click tracking: as configured
2. Resend → Logs (last 24 hours). Note:
   - Total sends count
   - Failed/Bounced count and reasons
   - Any unusual From addresses or recipient domains
3. Visit dmarcian.com/dmarc-inspector → enter brikk.store → screenshot result.

Report:

RESEND DELIVERABILITY — [timestamp]
Domain status:
- DKIM: [✓ / pending / ✗]
- SPF: [✓ / pending / ✗]
- DMARC: [✓ / pending / ✗]
- From sending allowed: [yes / no]
24h activity:
- Sends: [N]
- Failed/Bounced: [N, top reason]
- Any unusual patterns: [list]
DMARC public check:
- Policy: [p=none / quarantine / reject]
- rua address: [present/missing]
Recommendation: [ship as is / wait X for DNS / fix issue Y]

Keep under 200 words.
```

---

## Bot Task 6: Customer Portal smoke test (after subscription) (10 min)

⚠️ This requires Henry to have ALREADY completed a live subscription (Block G or a manual test). Otherwise the bot has nothing to manage.

```
Mission: Verify the Stripe Customer Portal opens and shows Brikk branding when a subscribed user clicks "Open billing portal" in Settings → Billing.

Safety rules:
- DON'T cancel the subscription. DON'T modify payment method.
- Just verify the portal loads with correct branding.

Steps:
1. Sign in to brikk.store/login as Henry's test subscribed account.
2. Navigate to /app/settings → click Billing tab.
3. Confirm the page shows "Pro plan · Trialing" (or active) — NOT the plan picker.
4. Click "Open billing portal".
5. Verify:
   - Stripe-hosted portal loads at billing.stripe.com (subdomain)
   - Brikk logo visible
   - Brand colors match (#1A1A18 text, #16803C accent)
   - "Update payment method", "Invoice history", "Cancel subscription" options all visible
   - Return URL link/button works (back to brikk.store/app/settings)
6. Click the return link. Confirm you land back on brikk.store/app/settings.

Report:

CUSTOMER PORTAL TEST — [timestamp]
Settings billing state: [Trialing / Active / Past due / Plan picker (wrong)]
Portal opened: [yes / no]
Brikk branding present: [logo / colors / both / neither]
Available actions: [list]
Return link works: [yes / no]
Verdict: [PASS / FAIL with reason]

Keep under 150 words.
```

---

## Bot Task 7: Cross-browser visual smoke test (15 min)

```
Mission: Visit key brikk.store pages in Chrome, Safari (or Firefox if Safari unavailable), and the bot's browser. Look for visual differences or rendering bugs.

Safety rules:
- Read-only. Don't click destructive things.
- If a page requires sign-in and Henry isn't logged in, mark as "needs Henry's session" and skip.

Pages to check:
1. brikk.store/ (homepage)
2. brikk.store/#features
3. brikk.store/#pricing
4. brikk.store/login
5. brikk.store/privacy
6. brikk.store/terms
7. brikk.store/r/INVALID (branded missing-code error)
8. brikk.store/this-does-not-exist (custom 404)

For each, capture a screenshot at 1316px viewport. Look for:
- Font rendering issues
- Color shifts
- Layout shifts
- Missing images or icons
- Broken animations

Report any differences. If a page renders identically across browsers, just mark "same as Chrome".

Report:

CROSS-BROWSER SMOKE TEST — [timestamp]
Tested: Chrome [version], [other browser + version]
Pages with consistent rendering: [list]
Pages with differences:
- /path — [Chrome: thing] vs [Browser X: thing]
Critical issues (would block users): [list, none if blank]

Keep under 300 words.
```

---

## Bot Task 8: Lighthouse audit (10 min)

```
Mission: Run a Lighthouse audit on brikk.store and brikk.store/#pricing. Report Performance, Accessibility, Best Practices, SEO scores. Flag anything below 90.

Safety rules:
- Read-only.
- Don't try to fix issues, just report them.

Steps:
1. Open Chrome DevTools (F12) → Lighthouse tab.
2. Set: Device = Mobile, Categories = all (Performance + Accessibility + Best Practices + SEO).
3. Run audit on brikk.store. Record the four scores.
4. Repeat on brikk.store/#pricing.

Report:

LIGHTHOUSE AUDIT — [timestamp]
brikk.store (mobile):
- Performance: [0-100]
- Accessibility: [0-100]
- Best Practices: [0-100]
- SEO: [0-100]
brikk.store/#pricing (mobile):
- Performance: [0-100]
- Accessibility: [0-100]
- Best Practices: [0-100]
- SEO: [0-100]

Issues flagged below 90 (top 5):
1. Category: Issue — Recommendation
2. ...

Verdict: [Ready / Issues to address before launch]

Keep under 250 words.
```

---

## Bot Task 9: Final go/no-go report (5 min)

Run this LAST, after all other bots have reported.

```
Mission: Compile a single Go/No-Go report based on the results of all prior bot tasks. Henry needs a one-screen answer to "can I launch today?"

You have access to the previous bot reports in this conversation (from Tasks 1-8). Synthesize them into ONE final verdict.

Report format:

=== BRIKK GO/NO-GO — [timestamp] ===

✅ READY:
- [list each thing that passed cleanly]

⚠️ WARNINGS (ship-able but track):
- [list each minor issue]

🛑 BLOCKERS (must fix before launch):
- [list each must-fix]

VERDICT: [GO — launch when ready / WAIT — N blocker(s) / NO — system not ready]

NEXT ACTION FOR HENRY:
[Single sentence: what to do RIGHT NOW]

Keep under 150 words. Be honest. If there's a blocker, say so clearly. Don't soften the assessment.
```

---

# 🚦 SECTION 3: GO/NO-GO GATES (you do these personally)

Last-mile checks before announcement. These take 30 minutes total.

## Block H — Full happy path (15 min)

Run through Brikk as a brand-new realtor. Use a fresh throwaway email.

### [ ] H1. Sign up → confirm → land in app
- Use `henry+launchday-1@gmail.com`
- Confirmation email arrives from `Brikk <hello@brikk.store>` within 30s
- Click confirm → land on `/app` or `/login` (depending on Supabase flow)
- Sign in, dashboard shows "Trial — 14 days left" banner

### [ ] H2. Add a lead
- Click "Add Lead" on Leads page
- Fill in Sarah Test, phone 555-0123, email sarah@example.com
- Save. Lead appears in pipeline.

### [ ] H3. Draft an AI message
- Go to Copilot
- See at least one suggested draft
- Click "Send via Messages" — should open your phone's native Messages app (if on phone) or show a deep-link (if on computer)
- Click "Edit" → modify the message → save

### [ ] H4. Voice-to-CRM
- Tap the floating voice button (bottom right of any app page)
- Speak: "Sarah loved the kitchen, schedule a tour for Saturday"
- Stop. Multi-action modal shows parsed actions.
- Approve all. Lead should update.

### [ ] H5. Subscribe via Stripe
- Settings → Billing → click Subscribe to Pro
- Stripe checkout opens. Confirm:
  - 14-day trial mentioned
  - "I agree to Brikk's Terms of Service" checkbox visible
  - Apple Pay button on iOS (if on iPhone)
- Use a REAL card (you can refund yourself in H6)
- Complete checkout
- Land back on /app/settings with green toast "🎉 Subscription started"
- Billing tab now shows "Pro plan · Trialing"
- Receipt email arrives within 30s

### [ ] H6. Refund the test charge
- Stripe Dashboard → Payments → find the test charge → Refund → full refund
- Subscription stays active (trial isn't tied to the immediate charge)

### [ ] H7. Customer Portal
- Settings → Billing → "Open billing portal"
- Stripe portal loads with Brikk branding
- Try updating card (don't actually save)
- Click back to Brikk

## Block I — Marketing readiness (10 min)

### [ ] I1. Confirm marketing PDFs are current
- Open `marketing/brikk-launch-checklist.pdf` — date should be recent
- Open `marketing/door-to-door-script.pdf` — confirm it says 14 days, not 45
- Spot-check 2-3 other PDFs

### [ ] I2. Social media assets exported
- `brand/brikk-icon-1024.png` ready for Instagram/LinkedIn profile photo
- `brand/brikk-wordmark-dark-3200.png` ready for email signatures + slide decks
- Both files in repo

### [ ] I3. First-prospect list
- 10 names + phones + emails in a doc somewhere
- Draft text message ready ("Hey [name], built a tool agents are using to close more deals — brikk.store/r/YOUR-CODE if you want to check it out")
- First three prospects identified (door-knock targets)

## Block J — Final sign-off (5 min)

### [ ] J1. Run Bot Task 9 (Go/No-Go) one more time
Read the bot's verdict. If GO → proceed. If WAIT → fix the blocker.

### [ ] J2. Take screen recording of happy path
- Loom (free) or QuickTime
- Capture H1-H5 above as one continuous recording
- Useful for marketing AND for troubleshooting when a customer reports an issue

### [ ] J3. Pull the trigger
- [ ] Post on Instagram
- [ ] Send the cold-text to first 3 prospects
- [ ] Plan tomorrow's door-knock route
- [ ] Eat a real dinner
- [ ] Sleep

---

# 📋 Post-launch tracking (week 1)

After launch, watch for:

- **Resend → Logs**: any spike in bounces or failures
- **Stripe → Disputes**: any chargebacks (you have all-sales-final everywhere, but watch anyway)
- **Vercel → Analytics**: traffic to /r/YOUR-CODE links (referral conversions)
- **Supabase → Database**: any tables hitting size limits or slow queries
- **Email replies to hello@**: support inbox should have inquiries — respond within 4h to set the tone

When you have 10 active users, do a quick check-in survey. Three questions:
1. What feature do you use most?
2. What's the most frustrating thing?
3. Would you recommend Brikk to another agent? (NPS)

That tells you what to build next.

---

# 🆘 If something breaks at launch

1. **Signups not arriving:** Resend → Logs to see send status. If 0 sends, Supabase SMTP password is wrong. If 0 deliveries, DNS or DMARC issue.
2. **Stripe checkout 500:** Vercel logs → check for missing env var error. Most common: `STRIPE_SECRET_KEY` typo or rk_live_ key missing required scope.
3. **Lead capture form broken:** Vercel logs for `/api/refer` → usually `SUPABASE_SERVICE_ROLE_KEY` not set.
4. **Morning brief not sending:** Vercel cron logs at 14:00 UTC. 401 = CRON_SECRET missing. 500 = Anthropic key issue.
5. **Voice not transcribing:** browser permission. User has to grant mic access.

When in doubt, check Vercel logs first, then Resend logs, then Supabase logs. Most issues surface in one of those three.

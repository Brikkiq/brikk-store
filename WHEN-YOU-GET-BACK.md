# Brikk · pickup checklist

What's actually outstanding, in the order to do it. Each block has an estimated time so you can pick a chunk that fits.

---

## ⚡ 5-minute knockouts (do first)

### [ ] Reply to the Resend bot
Type back exactly: **`approved final only`**
This revokes the clearly-stale "Brikk Supabase final" key (0 uses, zero risk). Don't approve the second key yet — the verification dance below has to happen first.

### [ ] Run the realtime SQL in Supabase
Open Supabase → SQL Editor → New Query → paste the SQL block I gave you earlier (it's in `sql/enable-realtime.sql` if you need it again) → Run. Results table at the bottom should show `leads` and `messages`. Done.

### [ ] Add `NEXT_PUBLIC_APP_URL` to Vercel
Vercel → Brikk → Settings → Environment Variables → Add New
- Key: `NEXT_PUBLIC_APP_URL`
- Value: `https://brikk.store`
- Environment: Production + Preview + Development
- Save

### [ ] Push the current branch to GitHub
Latest commit has 30+ fixes (audit response, Stripe v2 with consent, friendly errors, trial-ending email, settings banner). Until you push, none of it reaches production.
```
git add .
git commit -m "Pre-launch hardening: Stripe v2, audit fixes, no-refunds, settings banner"
git push
```

---

## 🔐 The Resend verification dance (10 min)

Has to happen before you revoke the active SMTP key — otherwise signup confirmations die.

### [ ] Generate a fresh sending-scope key
Resend → API Keys → Create API Key
- Name: `Brikk Supabase SMTP v2`
- Scope: **Sending access** (NOT Full access)
- Copy the key

### [ ] Paste it into Supabase Auth SMTP
Supabase → Authentication → Emails → SMTP Settings → Password field → paste the new key → Save

### [ ] Verify with a fresh test signup
- Incognito window → brikk.store/login → Sign up with `henry+test1@gmail.com`
- Check that email arrives within 30s
- Resend → Logs → confirm the send fired through `Brikk Supabase SMTP v2`, NOT through `Brikk Supabase 2026-05-20`

### [ ] Tell the bot to revoke the rest
Once the test passes, message the bot:
**`approved 2026-05-20 — verified new SMTP key is live, also revoke old Brikk Supabase SMTP`**

### [ ] Fix the misspelling
Resend → API Keys → `Brikk Vercel Transacrtional` → rename → `Brikk Vercel Transactional`

### [ ] End state check
You should have exactly 2 Resend keys, both Sending-scope:
- `Brikk Supabase SMTP v2` → wired into Supabase Auth SMTP password
- `Brikk Vercel Transactional` → wired into Vercel `RESEND_API_KEY` env var

Zero Full-access keys. Clean inventory.

---

## 💳 Stripe Vercel wiring (10-15 min)

Nathan finished the Dashboard side. You wire up Vercel.

### [ ] Get `STRIPE_WEBHOOK_SECRET` from Nathan or grab it yourself
Stripe Dashboard → Developers → Webhooks → "Brikk production webhook" → Reveal signing secret → copy.
Vercel → Environment Variables → add `STRIPE_WEBHOOK_SECRET` → Production only.

### [ ] Create a restricted `STRIPE_SECRET_KEY` and add it
Stripe → Developers → API keys → Create restricted key → name `brikk-vercel-prod` → scopes:
- Checkout Sessions: Write
- Customers: Write
- Subscriptions: Write
- Customer portal: Write
- Prices: Read
- Products: Read
- Invoices: Read
- Setup Intents: Write
- Everything else: None

Copy the `rk_live_…` → Vercel → add as `STRIPE_SECRET_KEY` → Production.

### [ ] Add `APPLE_PAY_DOMAIN_ASSOCIATION` (when Nathan sends it)
Single long string from Stripe → Settings → Payment Methods → Apple Pay → Download verification file.
Vercel → add as `APPLE_PAY_DOMAIN_ASSOCIATION` → Production.

### [ ] Redeploy
Vercel → Deployments → most recent → ⋯ → **Redeploy** → uncheck "Use existing Build Cache" → Redeploy.

### [ ] After deploy: roll the old unrestricted key
Stripe → Developers → API keys → find the OLD `sk_live_…wmZB` → ⋯ → **Roll key**. This invalidates the unrestricted one.

---

## 🧪 Stripe verification (15 min — section C of Nathan's handoff)

### [ ] C1. Webhook receives test event
Stripe → Developers → Webhooks → click "Brikk production webhook" → ⋯ → Send test webhook → pick `checkout.session.completed` → Send. Should show 200 OK in Recent attempts.

### [ ] C2. Live checkout actually charges
Incognito window → brikk.store/app/upgrade → sign in with throwaway → Subscribe to Pro → use a real card. Within 2s of completing, settings page should show "Pro plan · Trialing." Receipt email arrives.

### [ ] C3. Refund the test charge
Stripe → Payments → find the test charge → Refund → full refund.

### [ ] C4. Customer Portal works
In the test session → Settings → Billing → Open billing portal → confirm Brikk branding (logo + colors) → try updating payment method → close.

### [ ] C5. Apple Pay button on iOS
Real iPhone in Safari (not Chrome, not simulator) → brikk.store → sign in → /app/upgrade → Apple Pay button should appear. If not, check that:
- Stripe → Settings → Payment Methods → Apple Pay → brikk.store shows "Verified"
- `APPLE_PAY_DOMAIN_ASSOCIATION` env var is set
- Last deploy completed

### [ ] C6. Smart Retries on
Stripe → Settings → Billing → Subscription and emails → confirm Smart Retries + "Automatically email customers about failed payments" both ON.

---

## 📧 Email deliverability hygiene (10 min)

### [ ] Set Supabase Site URL to brikk.store
Supabase → Authentication → URL Configuration → Site URL = `https://brikk.store`. Also add `https://brikk.store/auth/callback` to Additional Redirect URLs.

### [ ] Change SMTP Sender email noreply → hello
Supabase → Authentication → Emails → SMTP Settings → Sender email = `hello@brikk.store`. Sender name = `Brikk`.

### [ ] Publish DMARC TXT record at your DNS provider
- Type: TXT
- Host/Name: `_dmarc`
- Value: `v=DMARC1; p=none; rua=mailto:dmarc@brikk.store`
- TTL: auto / 1 hour

Verify at https://dmarcian.com/dmarc-inspector/ by entering `brikk.store`.

### [ ] Set up hello@brikk.store inbound forwarding
Free option: improvmx.com → add brikk.store → forward `hello@` → `hmdesrosier@gmail.com`. Test by emailing hello@brikk.store from your phone — should land in your Gmail.

### [ ] Add `CRON_SECRET` to Vercel
- Generate a 32+ char random string (1Password generator works)
- Vercel → Environment Variables → add `CRON_SECRET` → Production + Preview
- Save the value in your password manager
- Redeploy

---

## 🔎 Post-deploy re-audit (15 min)

After everything above is done and Vercel has redeployed:

### [ ] Hard-refresh brikk.store
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows). Bust any cached version.

### [ ] Run the bot prompt I wrote earlier
The "Pre-launch verification sweep" prompt. It runs Phases 1-7 — deploy freshness check, 14-item audit re-verification, LiveDemo check, responsive sweep, perf check, DMARC check, final report. ~60 min of bot work, single report at the end.

### [ ] Read the bot's report
Should see:
- Deploy status: Fresh
- 13-14 of 14 audit items passing
- 8/8 LiveDemo tabs render
- All three viewport widths clean
- Zero unexpected console errors

### [ ] If anything regressed
Open the specific page, view-source, see if the issue is real or stale-cache. Fix in code, push, redeploy.

---

## 📋 Pre-launch dress rehearsal (the day before)

### [ ] Full happy-path test as a brand-new user
- Sign up with a fresh email
- Confirm email arrives within 30s, from Brikk <hello@brikk.store>
- Click confirm link → lands on /app (or /login)
- Get to dashboard
- Add a lead manually
- Draft an AI message in Copilot
- Click Send via Messages — phone messaging app should open
- Add a deal
- Open Voice button, record 10 seconds, verify multi-action modal works
- Go to Settings → Billing → Subscribe to Pro
- Complete Stripe checkout with a real card
- Verify trial banner appears
- Open billing portal → cancel subscription
- Verify settings shows the plan picker again

### [ ] Capture a screen recording
Loom or QuickTime — full happy path. Useful for marketing later and for your own debugging if a customer reports an issue.

### [ ] Final visual sweep on mobile
Real iPhone + real Android. Check that:
- Bottom tab bar shows 8 tabs cleanly
- No horizontal scroll anywhere
- Voice button doesn't overlap the tab bar
- Pricing page doesn't stack weird
- 404 page is branded

---

## ✅ Launch readiness final check

Once everything above is checked, you're cleared to:

- [ ] Announce on Instagram
- [ ] Cold-email your first 10 prospects
- [ ] Door-knock the first agency
- [ ] Sleep

---

## Quick reference: env vars Vercel should have

| Key | Value | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | https://YOUR.supabase.co | YES |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJ… | YES |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJ… | YES |
| `ANTHROPIC_API_KEY` | sk-ant-… | YES |
| `RESEND_API_KEY` | re_… (Brikk Vercel Transactional) | YES |
| `STRIPE_SECRET_KEY` | rk_live_… | YES |
| `STRIPE_WEBHOOK_SECRET` | whsec_… | YES |
| `NEXT_PUBLIC_APP_URL` | https://brikk.store | YES |
| `CRON_SECRET` | random 32+ char | YES (or morning brief breaks) |
| `APPLE_PAY_DOMAIN_ASSOCIATION` | long single-line string from Stripe | for Apple Pay |
| `STRIPE_ENABLE_TAX` | unset for now | only when tax registered |

11 vars total. If any are missing post-deploy, the corresponding feature is silently broken.

---

## When in doubt

Open `LAUNCH-CHECKLIST.md` (the original 7-item one) and `STRIPE-PRODUCTION-SETUP.md` and `AUDIT-RESPONSE.md` — they have the long-form explanation of each item if you forget what something does.

Good luck.

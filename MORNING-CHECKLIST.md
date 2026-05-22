# Tomorrow morning — Brikk pickup

Coffee, then this. Estimated 45-60 min total.

---

## ☀️ First thing — read the overnight bot's report

Open `OVERNIGHT-BOT-REPORT.md` in the repo root. The bot will have left a summary of what shipped, what's partial, and what needs your hands. Skim that first to know how much Google Calendar work is done.

---

## 🔧 Track A — Deploy everything from last night

### [ ] A1. Push everything to GitHub (~30 sec)

```
cd "C:\Users\Henry\OneDrive\Documents\GitHub\brikk-store"
git add . ; git commit -m "v2 feature pack: deal tracker, sentiment, risk, anniversaries, referrals, commission goal + overnight Google Calendar"
git push
```

### [ ] A2. Run the v2 schema migration (~2 min)

Open Supabase → SQL Editor → New Query. Paste the contents of `sql/v2-feature-pack.sql` from the repo (or copy the whole block from this conversation history).

Click **Run**. Should see verification rows at the bottom confirming:
- `checklist_items`, `referrals`, `offers` tables exist
- `deals.client_token` populated for existing deals
- `messages.sentiment` column exists
- `profiles.annual_commission_goal` column exists

### [ ] A3. Run the Google Calendar migration (if overnight bot finished it) (~1 min)

Open `sql/google-calendar-integration.sql`. Same process: SQL Editor → paste → Run. Creates `integrations` and `calendar_event_sync` tables.

### [ ] A4. Redeploy Vercel (~30 sec)

Vercel → Deployments → ⋯ → Create deployment → Production → uncheck Build Cache → Deploy. Wait for green.

---

## 💳 Track B — Stripe pricing migration

Pricing copy in the app says $69.99 and $160 now. But Stripe is still billing $75 and $200 because the new Price objects don't exist yet in Stripe.

### [ ] B1. Follow `PRICING-CHANGE.md` (~10 min)

8 steps in Stripe Dashboard. Create new Pro Price ($69.99), new Team Price ($160), archive old prices + setup fees, set `STRIPE_PRICE_PRO` and `STRIPE_PRICE_TEAM` in Vercel env vars, redeploy.

If you skip this, customers still get charged the old amounts after their trial. The UI copy will say $69.99 but the actual charge will be $75.

---

## 🤖 Track C — Google Calendar setup (depends on overnight bot)

If the overnight bot finished phases 1-3 (schema + encryption + OAuth flow), do this:

### [ ] C1. Register the OAuth app in Google Cloud Console (~10 min)

1. Open https://console.cloud.google.com → create a new project called "Brikk" if you don't have one
2. APIs & Services → Enable APIs → enable **Google Calendar API**
3. APIs & Services → OAuth consent screen → External → fill in:
   - App name: Brikk
   - User support email: hello@brikk.store
   - Authorized domains: brikk.store
   - Developer contact: hello@brikk.store
   - Scopes: add `.../auth/calendar.events` and `.../auth/userinfo.email`
4. Save through all the steps
5. APIs & Services → Credentials → + Create Credentials → OAuth client ID:
   - Type: Web application
   - Name: Brikk Production
   - Authorized redirect URIs: `https://brikk.store/api/integrations/google/callback`
6. Save → Google shows you a Client ID and Client Secret. Copy both.

### [ ] C2. Set the env vars in Vercel (~3 min)

Vercel → Settings → Environment Variables → add each:

- `GOOGLE_OAUTH_CLIENT_ID` = the client ID from step C1
- `GOOGLE_OAUTH_CLIENT_SECRET` = the client secret from step C1
- `INTEGRATIONS_ENCRYPTION_KEY` = generate via `openssl rand -base64 32` in PowerShell (or use 1Password generator)
- `STATE_SIGNING_SECRET` = same generation, different value

All Production. Redeploy.

### [ ] C3. Test the OAuth flow (~5 min)

Sign into Brikk → /app/settings → Integrations tab → click "Connect Google Calendar" → consent screen → redirect back → should show "Connected as your@email.com".

Add a lead with today's date as their birthday. Check Google Calendar — within 1-2 minutes, you should see an event titled `🎂 [lead name] turns X` on today's date.

---

## 📧 Track D — Email forwarding for Zillow leads (optional polish, ~15 min)

This wasn't built tonight but it's high impact and ImprovMX is already set up if you finished that earlier.

### [ ] D1. Add a Brikk inbox address in ImprovMX

ImprovMX → brikk.store → Aliases → add:
- Source: `leads@brikk.store`
- Destination: a webhook URL — let's say `https://brikk.store/api/inbound/lead-email` (this route doesn't exist yet, but you can scaffold it later)

For now, point it at your Gmail. Just so you can forward Zillow lead emails to `leads@brikk.store` and they land in your inbox.

### [ ] D2. (Later) Build the parser

A Vercel API route at `/api/inbound/lead-email` that:
- Receives the forwarded email via webhook (Mailgun, SendGrid Inbound Parse, or ImprovMX webhook)
- Parses the body for name/phone/email patterns
- Inserts a lead with `source = 'Zillow Email'`

Add to v3 roadmap — not blocking launch.

---

## 🚦 Track E — Verification

### [ ] E1. Run the pre-launch bot sweep (~60 min, bot working)

Use Bot Task 2 from `LAUNCH-DAY.md` — full audit re-verification. Walk away while it runs.

### [ ] E2. Smoke test the new features yourself (~15 min)

- **Today page** — should show new "Deal cooling", "Deal at risk", "Anniversary" action cards when applicable
- **Marketing page** — Commission goal card at the top. Click "Set goal", enter $100,000, save. See pacing breakdown.
- **Referrals page** — `/app/referrals` should load. Click "Log referral", create one received from "Jane Smith with $2500 commission". See it in the list.
- **Deal tracker** — open a deal, click "Share tracker link with client" → button copies a URL like `brikk.store/track/abc123...`. Paste in incognito → public deal status page loads.
- **Roadmap** — `brikk.store/roadmap` should load with all 4 sections rendering.
- **Sentiment** — go to /app/messages → pick a lead → log an inbound reply like "this is great, can't wait!" — the sentiment auto-classifier should tag it `warm` in the database. (Doesn't visibly show in UI yet — that's a follow-up to wire the chip.)
- **CSV import** — /app/leads → click "Import CSV" → upload a test CSV with name/phone columns → preview → import. Verify the leads appear.

---

## 📝 Quick wins to add today (if time)

If everything verifies and you've got energy:

1. **Sentiment chip on lead detail** — show a colored badge next to the most recent inbound message (~20 min)
2. **Listing prep checklist UI** — wire the checklist render on the lead detail page (~30 min). Schema and templates are ready in `lib/listingTemplates.js`.
3. **Offer comparison sheet UI** — full page at `/app/listings/[id]/offers` (~45 min). Schema (`offers` table) is ready.

If you don't have time, these go on the v3 roadmap.

---

## 🤝 Track F — Freelancer follow-up

If the iOS app freelancer responded overnight, reply to them with their access:

1. GitHub → brikk-store → Settings → Collaborators → Add their username → Read role
2. Apple Developer team invite per `ios-handoff/APPLE-DEV-ACCESS.md`
3. Tell them: "You're in. Start with `/ios-handoff/README.md` in the repo root. Everything you need is pre-prepared."

---

## End-of-day check-in

By end of today you should have:

- ✅ All v2 features deployed
- ✅ v2 schema migration run in Supabase
- ✅ Stripe pricing migrated to new amounts
- ✅ Google Calendar OAuth working (or scoped to next session if overnight bot didn't finish)
- ✅ iOS freelancer kicked off with full handoff
- ✅ Verification bot has confirmed everything works in production

If you hit any blocker, ping me with the error and I'll help debug.

You're so close. After today: feature-complete v2, ready to start onboarding paying customers.

— Good morning.

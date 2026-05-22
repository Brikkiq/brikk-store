# Brikk · Finalize checklist

What's left between now and a clean public launch. Everything already completed has been struck. Estimated total remaining time: **~75-90 minutes** of your hands-on work, plus 3-7 days waiting on Apple App Store review (parallel track).

Two parallel tracks below. Web/email cleanup is the critical-path launch blocker. iOS app submission can run in the background.

---

## ✅ Already done (skip these)

- Code: all bug fixes deployed (sticky nav, email validation, settings tab linking, Edit button, phone formatting, Copilot batch, iOS keyboard fix)
- Code: birthday notifications + lead-to-deal linking shipped
- Code: full Stripe v2 (consent_collection, phone collection, friendly errors, trial-ending email, settings banners)
- Code: iOS keyboard fix (16px font)
- Vercel: all 8 critical env vars present (CRON_SECRET typo renamed, STRIPE_*, NEXT_PUBLIC_*, RESEND_*, ANTHROPIC_*, SUPABASE_*)
- Supabase: Site URL = brikk.store, Sender email = hello@brikk.store, Confirm Signup template branded
- Supabase: realtime SQL run (leads + messages live broadcasting)
- Supabase: lead-to-deal SQL migration run (FK + sync trigger active)
- Stripe: Apple Pay domain "Enabled" for brikk.store
- Stripe: restricted live API key created (`brikk-vercel-prod`)
- Resend: 1 stale key revoked ("Brikk Supabase final"), new "Brikk Supabase SMTP v2" created and wired
- iOS handoff package prepared (capacitor.config.ts + ios-handoff/ folder + assets)

---

## 🌐 TRACK A: Web/email finalization (critical path, ~75 min)

These directly affect customer signup quality and email deliverability. Do these before announcing.

### [ ] A1. Finish Resend key cleanup (10 min)

You verified the new SMTP v2 key is firing. Two old Full-access keys are still sitting in Resend, unused but live. Need to revoke them.

- Open the Resend audit bot session (the one waiting for your reply)
- Type: `approved 2026-05-20 — verified new SMTP key is live, also revoke old Brikk Supabase SMTP`
- Bot revokes both old keys
- Manually rename `Brikk Vercel Transacrtional` → `Brikk Vercel Transactional` (typo fix)

**End state:** exactly 2 Sending-scope keys remaining, zero Full-access keys.

### [ ] A2. Publish DMARC TXT record at Namecheap (10 min)

Doesn't block users, but slowly degrades email deliverability over weeks if missing. Gmail and Outlook increasingly distrust domains without DMARC.

- Namecheap → Domain List → brikk.store → Manage → Advanced DNS
- Add record:
  - **Type:** TXT
  - **Host:** `_dmarc`
  - **Value:** `v=DMARC1; p=none; rua=mailto:dmarc@brikk.store`
  - **TTL:** Automatic
- Save
- Wait 30 min, verify at https://dmarcian.com/dmarc-inspector/ by entering `brikk.store`

### [ ] A3. ImprovMX inbound forwarding for hello@brikk.store (10 min)

Without this, replies to your branded `hello@` emails vanish — defeats the point of using a real address over noreply@.

- https://improvmx.com → confirm logged in
- If brikk.store isn't listed: + Add Domain → enter `brikk.store`
- Improvmx shows MX records to add. Note them exactly (priority + hostname).
- In a new tab: Namecheap → DNS → Advanced DNS
- Add the MX records exactly as ImprovMX specified (usually `mx1.improvmx.com` priority 10 + `mx2.improvmx.com` priority 20)
- **Important:** if Namecheap already has MX records, screenshot them first before replacing
- Back in ImprovMX → Aliases → add `hello@brikk.store` → forward to `hmdesrosier@gmail.com`
- Save
- Wait 30 min for DNS, then test: email hello@brikk.store from your phone → should arrive in Gmail within a minute

### [ ] A4. Roll the old unrestricted Stripe key (30 sec)

Now that your restricted `rk_live_brikk-vercel-prod` key is working in production, roll the old `sk_live_…wmZB` so a leak can't be exploited.

- Stripe Dashboard → Developers → API keys
- Find `sk_live_…wmZB` (created Apr 13)
- ⋯ menu → **Roll key**
- Confirm

### [ ] A5. Update remaining 2 Supabase email templates (5 min)

You did Confirm Signup. Two others use the default plain template still:

- Supabase → Authentication → Email Templates → **Reset Password**
  - Subject: `Reset your Brikk password`
  - Paste branded HTML from `supabase-email-templates/reset-password.html` in your repo
- Same page → **Magic Link**
  - Subject: `Your Brikk sign-in link`
  - Paste from `supabase-email-templates/magic-link.html`

If those files in the repo don't exist, ping me and I'll generate them.

### [ ] A6. Bot verification sweep (60 min, mostly bot working)

After A1-A5 are done, run **Bot Task 2 from LAUNCH-DAY.md** in Claude in Chrome — it does a full pre-launch sweep across deploy freshness, all 14 audit items, the LiveDemo, responsive widths, performance, DMARC. Single readable report at the end.

You don't have to babysit it. Start the bot, walk away, come back to a Go/No-Go verdict.

---

## 📱 TRACK B: iOS app submission (parallel track, runs in background)

### [ ] B1. Compare freelancer quotes (this week)

You've messaged at least 3 freelancers. Wait for them to all reply with:
- Quote (iOS only, and iOS + Android)
- Timeline
- 2-3 clickable App Store / Play Store links
- Confirmation app will be under your Apple account

Pick the one with the strongest portfolio + clearest confirmation on account ownership. Lowest price isn't necessarily best.

### [ ] B2. Grant the chosen freelancer access

Once picked:
- GitHub → brikk-store → Settings → Collaborators → Add their GitHub username → Read role
- Apple Developer → People → + Invite People → Developer role
- App Store Connect → Users and Access → Add their email → App Manager → Brikk only

Step-by-step in `ios-handoff/APPLE-DEV-ACCESS.md`.

### [ ] B3. Capture App Store screenshots

5 screens from your phone or simulator, sized 1290×2796 (6.7" iPhone Pro Max):
1. Today dashboard
2. AI Copilot with drafts
3. Leads pipeline with YOUR TURN badges
4. Voice-to-CRM mid-recording
5. Deal tracker

Hand to the freelancer. They paste into App Store Connect.

### [ ] B4. Wait for Apple review (3-4 business days)

Once submitted, Apple reviews. Freelancer handles any responses. If approved, app goes live in the App Store.

### [ ] B5. Revoke freelancer access after approval

- Apple Developer → People → freelancer → Remove from Team
- App Store Connect → Users → freelancer → Remove User
- GitHub → Collaborators → remove

---

## 🚀 Launch readiness gates (after Track A is complete)

Once Track A items A1-A6 are done and the bot Go/No-Go says READY:

### [ ] L1. Full happy-path test (15 min)

Use a brand-new throwaway email:
- Sign up → confirm email arrives from `Brikk <hello@brikk.store>` with branded HTML
- Confirm link works, lands on /app
- Add a lead, log a contact
- Generate a Copilot draft, tap "Send via Messages"
- Try Voice-to-CRM (grants mic permission, parses actions)
- Settings → Billing → Subscribe to Pro → use real card
- Verify "Pro plan · Trialing" appears after checkout
- Refund the test charge in Stripe Dashboard
- Settings → Billing → Open Billing Portal → confirm Brikk branding

If any step fails, fix before launching.

### [ ] L2. Capture demo screen recording (5 min)

Loom or QuickTime — record steps L1.1-L1.7 as one continuous video. Used for:
- Marketing reel material
- Customer support troubleshooting reference
- Investor / partner demos

### [ ] L3. Pull the launch trigger

- Post on Instagram with the screen recording
- Cold-text/email your first 10 prospects
- Door-knock the first agency tomorrow morning
- Brief your partner on go-live

---

## 📊 Post-launch week 1 watch list

Once live, monitor daily:

- **Resend → Logs** → any bounces or failed sends
- **Stripe → Disputes** → no chargebacks expected with all-sales-final policy + consent collection at checkout, but watch anyway
- **Vercel → Analytics** → traffic to `/r/YOUR-CODE` links (referral conversions)
- **Supabase → Database** → table size, slow queries
- **hello@brikk.store inbox** → respond to customer inquiries within 4h

When you have ~10 active users:
- Send a 3-question survey: most-used feature, biggest frustration, NPS (would recommend?)
- Use feedback to prioritize v2 features (likely candidates: listings module, native iOS push, team chat)

---

## 🆘 If something breaks at launch

1. **Signups not arriving:** Resend → Logs to see send status. Zero sends = Supabase SMTP password wrong. Zero deliveries = DNS / DMARC issue.
2. **Stripe checkout errors:** Vercel logs → check for missing env var. Common: `STRIPE_SECRET_KEY` typo or rk_live_ key missing required scope (Customer Portal Write is the one most often forgotten).
3. **Lead capture broken:** Vercel logs for `/api/refer` → usually `SUPABASE_SERVICE_ROLE_KEY` not set.
4. **Morning brief not sending:** Vercel cron logs at 14:00 UTC. 401 = CRON_SECRET wrong/missing. 500 = Anthropic key issue.
5. **Voice not transcribing:** browser permission. User has to grant mic access.

Check Vercel logs first, then Resend logs, then Supabase logs. Most issues surface in one of those three.

---

## Summary: what's actually outstanding right now

**Critical path (do this week, ~75 min):**
1. Resend key cleanup (A1)
2. DMARC at Namecheap (A2)
3. ImprovMX forwarding (A3)
4. Roll old Stripe key (A4)
5. 2 Supabase email templates (A5)
6. Bot verification sweep (A6 — bot does the work)

**Parallel (no blocking, ongoing):**
- iOS freelancer selection + handoff (B1-B5)

**Launch ritual (after Track A):**
- Happy-path test (L1)
- Screen recording (L2)
- Pull the trigger (L3)

That's it. Everything else is done.

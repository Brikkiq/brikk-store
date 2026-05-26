# Brikk operations runbook

What to do when things break. Read this BEFORE the panic starts, because once production is broken your prefrontal cortex stops working.

---

## Where to look when something's wrong (in order)

1. **Vercel deployment logs.** Most issues show up at build or runtime. Vercel → Brikk project → Deployments → click the latest one → Build Logs or Runtime Logs.
2. **Supabase logs.** Supabase Dashboard → Logs → API Logs / Postgres Logs. Database errors, RLS denials, slow queries.
3. **Resend logs.** Resend → Logs. Email failures, bounces, status codes.
4. **Stripe events.** Stripe → Developers → Events. Payment failures, webhook delivery issues.
5. **Anthropic dashboard.** console.anthropic.com → Usage. Rate limits, error spikes.
6. **Google Cloud Console.** OAuth + Calendar API quotas (if anything Google-Calendar-related is broken).

If you don't see anything obvious in any of those, the issue is probably in the code itself — check the most recent commits.

---

## Common incidents and fixes

### Signups stopped working

**Symptom:** users complete signup form, never get confirmation email, can't sign in.

**Diagnose:**
1. Open `brikk.store/login` in incognito → sign up with throwaway email
2. Did the email arrive within 30 seconds? Check Spam folder too.
3. If no: Resend → Logs → did any email even attempt to send?

**Possible causes + fixes:**
- **Resend logs show 0 sends:** Supabase Auth → SMTP Settings has wrong password. Generate a new Resend Sending-scope key, paste into the SMTP password field, save.
- **Resend logs show 4xx errors:** likely `Domain not verified` — confirm brikk.store DKIM + SPF are verified at Resend → Domains → brikk.store.
- **Resend logs show 200 OK but no email arrives:** check Spam. If still nothing, the DMARC record might be too strict — temporarily change `p=quarantine` or `p=reject` back to `p=none` while you investigate.
- **Confirmation link 404s or errors:** Supabase Site URL is wrong. Supabase → Authentication → URL Configuration → Site URL must be `https://brikk.store`.

### Stripe checkout fails / customers can't subscribe

**Symptom:** clicking Subscribe shows error toast, or hosted Stripe page shows error.

**Diagnose:**
1. Vercel → Logs → look for `Stripe error:` lines around the time of the failure
2. Stripe → Events → filter for failed events

**Possible causes + fixes:**
- **`No such price: 'price_XXX'`** — the env var `STRIPE_PRICE_PRO` or `STRIPE_PRICE_TEAM` points to an archived/wrong Price ID. Verify in Stripe Dashboard → Products that the Price ID exists and is active. Update env var in Vercel, redeploy.
- **`Cannot use a restricted key with operation X`** — your restricted key is missing a required permission. See `STRIPE-PRODUCTION-SETUP.md` for the exact scopes Brikk needs. Re-create the key with all scopes.
- **Webhook events failing (4xx in Stripe Events):** `STRIPE_WEBHOOK_SECRET` is wrong. Stripe → Webhooks → click the endpoint → Reveal signing secret → update Vercel env var, redeploy.
- **All checkouts failing with `automatic_tax requires...`:** you turned on `STRIPE_ENABLE_TAX=true` before completing Tax registration in Stripe Dashboard. Set env var to `false` (or remove it) and redeploy until Stripe Tax is fully set up.

### AI Copilot drafts stopped generating / generating nonsense

**Symptom:** clicking Generate in Copilot returns errors or hangs.

**Diagnose:**
1. Anthropic console → Usage → did rate limits hit? Did spending pause?
2. Vercel → Logs → look for `Copilot API error:` lines

**Possible causes + fixes:**
- **Anthropic quota exhausted:** you hit a monthly budget cap. Anthropic console → Plans & Billing → top up credits or raise budget.
- **Anthropic 401 / 403:** API key got rotated / revoked. Generate a new one at console.anthropic.com → API Keys, update `ANTHROPIC_API_KEY` in Vercel, redeploy.
- **Slow response (>30s):** Anthropic might be experiencing a backend issue. Check anthropic.statuspage.io. Brikk falls back to a basic template after timeout, but UX feels broken.
- **Drafts feel "off" / generic:** the prompt in `app/api/copilot/route.js` may have drifted. Read the system prompt — it should reference the lead's actual history. If history isn't being passed, check the request body.

### Cron job not firing (no morning briefs)

**Symptom:** users don't get the daily 7am Pacific morning brief email.

**Diagnose:**
1. Vercel → Crons tab → check execution history. Did `/api/cron/morning-brief` fire?
2. If yes but failed: click the failed run → see logs
3. If no: cron config in `vercel.json` may be wrong

**Possible causes + fixes:**
- **401 Unauthorized:** `CRON_SECRET` env var typo or missing. The Vercel cron passes it; if the env var doesn't match what the route expects, every fire returns 401.
- **500 Server Error:** Anthropic / Supabase / Resend issue. See logs.
- **Cron didn't fire at all:** check `vercel.json` schedule string. Should be `0 14 * * *` for 14:00 UTC (7am Pacific in standard time, 6am during daylight saving — Pacific does DST). Vercel cron supports up to 1-minute granularity but free tier is daily only.

### Lead capture form not working

**Symptom:** prospects submit `brikk.store/r/CODE` form, no lead appears in pipeline.

**Diagnose:**
1. Open the form in incognito, submit with a fake name + your phone
2. Did the response show "Thanks, [name]"?
3. Vercel → Logs → find the `/api/refer` POST around that timestamp

**Possible causes + fixes:**
- **503 Server not configured:** `SUPABASE_SERVICE_ROLE_KEY` is missing in Vercel. Add it, redeploy.
- **400 Invalid referral link:** the agent's referral code doesn't match anyone in `profiles`. Either the code is wrong, or the agent's profile was deleted.
- **Submissions succeed but no email goes out:** Resend `RESEND_API_KEY` not set. The lead still saves to DB; only the confirmation email fails.

### Real-time updates not firing

**Symptom:** the "new lead just came in" toast doesn't appear when a referral form is submitted in another tab.

**Fix:**
- Supabase → Database → Publications → `supabase_realtime` → ensure `leads` and `messages` tables are added. If not, run `sql/enable-realtime.sql` again.

### Voice-to-CRM not working

**Symptom:** mic button doesn't record, or recording but nothing happens after stopping.

**Possible causes + fixes:**
- **Browser permission denied:** user has to grant microphone permission. Settings → Safari/Chrome → Site Settings → brikk.store → Microphone = Allow.
- **iOS Safari Web Speech API issue:** older iOS versions have flaky speech recognition. Test on iOS 16+.
- **Stops mid-recording:** `recordingRef` (in `lib/Voice.js`) handles this — there was a stale-closure bug fixed earlier. If it returns, check that `recording` state is being used via the ref pattern, not directly.

### Google Calendar sync stopped working

**Symptom:** events not appearing in Google Calendar after lead/deal saves.

**Diagnose:**
1. Settings → Integrations tab → does it show "Connected" or "Not connected"?
2. If Not connected: user needs to re-connect. Walk through the OAuth flow.
3. If Connected but old timestamp: check Vercel logs for `/api/integrations/google/sync` errors.

**Possible causes + fixes:**
- **User revoked at Google's end:** myaccount.google.com → permissions → Brikk removed. The integration auto-disables (`enabled=false`). User needs to re-connect.
- **Token refresh failing:** logs will show `invalid_grant` from Google. Same as above — user re-connects.
- **Sync trigger 503:** `INTEGRATIONS_ENCRYPTION_KEY` or `STATE_SIGNING_SECRET` not set in Vercel. Add them, redeploy.
- **Cron pull failing:** Vercel → Crons → `/api/integrations/google/poll` → check error. Common: `CRON_SECRET` wrong.

### iOS PWA cache showing old version

**Symptom:** Henry pushed an update, web works, but installed PWA still shows old UI.

**Fix:**
- Delete PWA from home screen, re-add from Safari. PWAs cache aggressively on iOS.
- For users: tell them to pull-to-refresh inside the PWA. Some versions of iOS Safari accept this; others don't.
- Long-term mitigation: bump cache-busting query params on key static assets (icons, manifest) when shipping major UI changes. We already do this for icons (`?v=2`).

### Site goes down entirely

**Diagnose:**
1. Is brikk.store loading? If no — Vercel deployment issue.
2. Vercel → Deployments → is the latest deploy Ready or Failed?
3. If Failed: click → Build Logs → fix the build error → redeploy.
4. If Ready but site is down: check status.vercel.com (rare but possible).
5. If site loads but data doesn't appear: check status.supabase.com.

**Emergency fallback:**
- Vercel → Deployments → find the last known-good deploy → ⋯ → **Promote to Production**. Rolls back instantly without re-deploying broken code.

---

## Apple App Store rejections

If Apple rejects the iOS app:

1. Open `ios-handoff/README.md` → "If Apple rejects under 4.2" section
2. Most common rejection: "app provides limited value beyond Safari." Response: reply via Resolution Center listing the native capabilities (haptics, splash, push notifications scaffold, microphone for voice-to-CRM, status bar).
3. If still rejected: add a small native-only feature (Capacitor Share or Camera plugin), resubmit.

---

## Security incidents

### "I think someone has my Apple Developer account / Stripe / Supabase password"

1. Change the password immediately on the affected service.
2. Enable 2FA if it wasn't on.
3. Review recent activity in the affected service for unauthorized changes.
4. Rotate any API keys that could have been exposed.

### "An API key got leaked publicly"

1. Identify which key (Stripe, Anthropic, Resend, Supabase service-role, Google OAuth, etc.)
2. Generate a new key on the relevant service
3. Update the Vercel env var with the new key
4. Redeploy
5. Revoke the old key on the relevant service
6. Audit recent usage of the old key for unauthorized activity
7. If a service-role or admin key was leaked: review database for unauthorized writes, restore from backup if needed

### "A customer reports unauthorized access to their account"

1. Get details: what did they see, when, from where (IP if possible)
2. Supabase → Authentication → Users → find the user → check sign-in history (if visible)
3. Force a password reset by deleting their auth session
4. Tell them to enable 2FA (Brikk doesn't currently enforce 2FA — v3 roadmap item)
5. Document the incident in a security log

---

## Backup + recovery

- **Supabase Pro plan** = daily automatic backups, retained 7 days. Supabase → Database → Backups → can download or restore.
- **Vercel** doesn't store user data — code is in GitHub.
- **Stripe** stores all payment history forever — no backup needed on your side.
- **For peace of mind**, set a calendar reminder to manually download a Supabase backup once a month. Save in 1Password or encrypted storage.

### Restoring from a backup

1. Supabase → Database → Backups
2. Pick a backup point
3. Click Restore — Supabase walks you through a clone-and-verify flow before swapping

Test the restore flow at least once before you need it. The first time you do it during an emergency is the worst time.

---

## Communication during an incident

If something is broken AND it affects users:

1. Post a brief status update somewhere visible. Options:
   - Tweet from `@brikkrealestate` (if/when you have it)
   - Email to subscribed users (use Resend bulk send)
   - Banner at top of brikk.store (`app/page.js` — add a temporary `<div>` at the top)
2. Be honest about what's broken and ETA to fix
3. Don't say "soon" — give a real time estimate
4. Follow up when fixed

Example status post:
> "Voice-to-CRM is currently down — investigating a third-party issue with our transcription provider. ETA: <1 hour. Everything else is working. Will update here. — Henry, Brikk"

---

## Last updated

May 21, 2026. Add new incidents to this runbook as they happen. Future-you (or future-hire) will thank you.

# Brikk Launch Readiness Checklist

Generated from Session A test report (2026-05-20). Work top-down — items are ordered by blocking severity. Each item has a clear "done when" test so you can verify.

---

## Critical — block public launch

### [ ] 1. Set `CRON_SECRET` in Vercel
Without this, the morning briefing email cron will return 401 every day at 14:00 UTC and zero users will get briefs.

1. Open Vercel → Brikk project → **Settings** → **Environment Variables**
2. Click **Add New**
3. Key: `CRON_SECRET`
4. Value: generate a 32+ character random string. Easiest way: open Terminal and run:
   ```
   openssl rand -base64 32
   ```
   Or use any password manager's generator. Save the value in 1Password / Bitwarden — you may need it later if you wire an external trigger.
5. Environment: check **Production** and **Preview**
6. Click **Save**
7. Trigger a redeploy: Deployments → most recent → ⋯ → **Redeploy**

**Done when:** Tomorrow at 14:00 UTC, Resend dashboard shows morning-brief emails delivered. Or run a smoke test now:
```
curl -X GET 'https://brikk.store/api/cron/morning-brief' \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```
Should return JSON with `ok: true` (or `processed: N` if there are users).

---

### [ ] 2. Add `leads` + `messages` to Supabase Realtime publication
Without this, the live "new lead just came in" toast never fires — the lead-capture link feature feels broken even when DB insert succeeds.

1. Open Supabase → Brikk project → **SQL Editor**
2. Click **+ New Query**
3. Paste the contents of `sql/enable-realtime.sql` (already in this repo)
4. Click **Run**

**Done when:** the verification query at the bottom of the SQL returns rows for both `leads` and `messages`. Then test in the app: have someone submit your `brikk.store/r/YOUR-CODE` form while you're staring at `/app/leads` — the new lead row appears without you refreshing.

---

### [ ] 3. Confirm where `RESEND_API_KEY` actually lives
Emails ARE sending (Phase 19 confirmed 1 delivered email), but Vercel env vars show no `RESEND_API_KEY`. That means the working pipeline lives somewhere else — likely Supabase Edge Function secrets via the auth hook pattern. If you don't know which place owns it, the next deploy or rotation could silently break it.

1. Check **Supabase → Project Settings → Edge Functions → Secrets**. Look for `RESEND_API_KEY`.
2. Also check **Supabase → Authentication → SMTP Settings**. Resend SMTP credentials might live there instead (username `resend`, password = your Resend API key).
3. Document which place owns it. Write it on a sticky note. Or add it to your password manager under "Brikk infra".
4. If it lives in Vercel and the listing was just hidden / search broken, that's fine — verify by going Vercel → Settings → Environment Variables and **scrolling the full list** instead of using the search box (which had a stale "Removed Environment Variable successfully" toast).

**Done when:** you can answer the question "if I have to rotate the Resend key tomorrow, where do I update it?" in one location.

---

## Important — fix in week 1 post-launch

### [ ] 4. Check Vercel env var history
A stale "Removed Environment Variable successfully" toast appeared on the Vercel env vars page that I (Henry) did not trigger. Could be:
- Leftover from your previous session
- Something else that cleaned up a variable
- A keystroke during page load

1. Vercel → Settings → Environment Variables → for each of: `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL` — click ⋯ → **View History**.
2. Confirm no recent deletions.
3. If a key was deleted, re-add it from your password manager.

---

### [ ] 5. Investigate the 3 failed deploys
Three deployments failed in the past 2 hours: `n5Wa2UEuN`, `7u2XuPw53`, `4AhbFW97D`. Production is fine, but the pattern suggests active iteration breaking things.

1. Vercel → Deployments → filter by **Failed**
2. Click each failed deploy → **View Build Logs**
3. Look for the actual error line (usually red, near the bottom of the log)
4. If the same error appears in all three, that's what to fix before your next push

---

### [ ] 6. Configure Supabase Site URL to brikk.store
Spam filters notice when an email from `brikk.store` contains confirmation links pointing to `*.supabase.co`. Fix: route auth links through your own domain.

1. Supabase → **Authentication** → **URL Configuration**
2. **Site URL**: `https://brikk.store`
3. **Additional Redirect URLs**: add `https://brikk.store/auth/callback` if not already there
4. Save

**Done when:** sign up a fresh throwaway email. The "Confirm my account" link in the inbox is `https://brikk.store/auth/callback?...`, NOT `https://yourproject.supabase.co/...`.

---

### [ ] 7. Publish DMARC TXT record
Missing DMARC will hurt inbox placement at Gmail/Outlook over time.

1. Go to your DNS provider (wherever brikk.store is registered: Namecheap, Cloudflare, GoDaddy, etc.)
2. Add a **TXT record**:
   - **Name / Host**: `_dmarc`
   - **Value**: `v=DMARC1; p=none; rua=mailto:dmarc@brikk.store`
   - **TTL**: 1 hour (or auto)
3. Save and wait ~30 minutes for propagation

**Note:** `p=none` is monitor-only — you get DMARC reports but no email is rejected. After 2 weeks of clean reports, upgrade to `p=quarantine` then `p=reject` for stronger protection.

**Done when:** `dig TXT _dmarc.brikk.store +short` returns your record. Or check at https://dmarcian.com/dmarc-inspector/

---

### [ ] 8. From-address now hello@ — verify the address is set up
I changed `lib/email.js` to default to `hello@brikk.store` instead of `noreply@brikk.store`. This affects emails sent via `/api/refer` (lead confirmation). Resend's deliverability recommendation is to **not** use noreply.

Two things needed for this to work:

1. **Verify `hello@brikk.store` in Resend.** Resend → Domains → brikk.store → ensure DKIM/SPF are verified. The address `hello@` on a verified domain works automatically.
2. **Make sure replies actually reach you.** Since you set up ImprovMX (or planning to), confirm `hello@brikk.store` forwards to a mailbox you read. Test: send an email to `hello@brikk.store` from a personal account and confirm you get it.
3. **Update Supabase Auth SMTP "Sender email"** from `noreply@brikk.store` → `hello@brikk.store` so confirm/reset/magic-link emails also come from `hello@`. This is in Supabase → Authentication → SMTP Settings → **Sender email**.

**Done when:** new signup confirmation lands from `Brikk <hello@brikk.store>` AND a reply to that email reaches a mailbox you check.

---

## Polish — schedule for week 2+

### [ ] 9. Pricing grid — already fixed
I changed the pricing section so all three cards render 3-across at desktop sizes. Should be live on next deploy.

**Done when:** load `brikk.store/#pricing` at 1316px viewport — Pro, Team, Agency all on one row with no whitespace gap.

### [ ] 10. "Get started" scroll — already fixed
Replaced the anchor `<a href="#how">` click behavior with an explicit smooth-scroll handler and added `scrollMarginTop` to each anchored section. Should be live on next deploy.

**Done when:** click "Get started" in the nav — page lands on the "Set up in 5 minutes" section heading, not 700px above it.

### [ ] 11. `teams` table RLS sanity check
Phase 2 found `teams` has only 2 RLS policies vs 4–6 on other tables. Worth a one-time sanity check — not necessarily wrong.

1. Supabase → Authentication → Policies → `teams`
2. Verify these scenarios:
   - **Team owner** can SELECT, UPDATE, DELETE their own team
   - **Team member** can SELECT their team (read-only)
   - Any other user can NOT SELECT/UPDATE that team
3. Test by signing in as a member account and querying `select * from teams`

---

## Code changes made this session (in this commit)

- `app/page.js` — fixed "Get started" smooth-scroll, restructured pricing section to use a wider container so all 3 plan cards fit on one row at lg breakpoint
- `lib/email.js` — default From address now `hello@brikk.store` instead of `noreply@brikk.store`
- `sql/enable-realtime.sql` — new file, paste into Supabase to enable realtime on leads + messages
- `LAUNCH-CHECKLIST.md` — this file

Push these to Vercel before working through the dashboard items above.

---

## Launch readiness verdict

**Not ready** until items 1, 2, 3 are done. Everything else can ship and be fixed in week 1.

Foundation is strong: schema solid, Anthropic AI working, branded email rendering correctly, marketing site performant, edge-case error pages clean and non-leaky.

You just have integration gaps to close — not architecture problems.

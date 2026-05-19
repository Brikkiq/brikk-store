# Brikk — Audit Findings & Changes

This document covers the code review and the design refresh that ships in this commit.

---

## Critical security issues you need to fix outside this commit

These are credentials baked into source code. They are in your Git history and need to be rotated *and* moved to environment variables.

1. **Anthropic API key** — `app/api/copilot/route.js` had `sk-ant-api03-...` hardcoded on line 3. **Rotate this key immediately** in the Anthropic Console. Anyone with read access to your repo (or anyone who scraped your GitHub before it went private) has it.
2. **Twilio Account SID + Auth Token** — `app/api/sms/route.js` had both `AC126d...` and the auth token hardcoded. **Rotate the auth token in the Twilio Console immediately**. With these two values, anyone can send SMS that bills to your Twilio account.
3. **Supabase URL and anon key** — hardcoded in three places. The anon key is *designed* to be public (Supabase RLS protects rows), so this is lower-risk, but still: moving to env vars means you can swap projects without code changes.

After rotating, set these as Vercel environment variables and redeploy:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
STRIPE_SECRET_KEY=
```

The code in this commit reads from these env vars. See `.env.example`.

---

## Bugs fixed in this commit

### High severity

- **`app/app/copilot/page.js`** was loading leads with `supabase.from('leads').select('*').order(...)` — no `.eq('user_id', user.id)` filter. If your Supabase RLS policy is missing or misconfigured, this would surface every user's leads to every signed-in user. Fixed by scoping to `user.id`.
- **`app/api/sms/webhook/route.js`** had no Twilio signature verification. Anyone could POST a forged form payload to inject fake "received" messages into any lead's conversation. Now validates the `X-Twilio-Signature` header against `TWILIO_AUTH_TOKEN` before doing anything.
- **`app/api/sms/route.js`** had no auth at all. Any anonymous visitor could hit it and send SMS that bills to your account. Now requires a Supabase access-token bearer header and verifies the calling user before sending.
- **`app/api/refer/route.js`** fell back to "first agent in the database" if no `agent_id` was provided. That meant a malformed referral link could deposit leads on someone else's pipeline. Now requires a valid `agent_id`.

### Medium

- **`app/app/messages/page.js`** had a dead `getLastMessage` helper that referenced the wrong state and never worked. Removed.
- **`app/app/layout.js`** `checkNotifications` had no error handling — a query failure would throw silently. Now logs and degrades gracefully.
- **`app/login/page.js`** silently swallowed `profiles` update errors during signup. Now reports them.
- **`app/app/settings/page.js`** verified the old password by calling `signInWithPassword`, which mutates the session and can sign other tabs out. Switched to Supabase's `reauthenticate` flow / direct verification, with a fallback.
- **Duplicate font loading.** Every page included a `<link href="...Instrument+Sans...">` inline even though `app/layout.js` already loads it. Removed the duplicates — saves bandwidth on every page load.

### Low

- The `15-second timeout requestPushPermission` call in `app/app/layout.js` fires on web where `window.brikk` doesn't exist. Already guarded; left as-is.
- Several pages declared their own color object (`const c = {bg, white, ...}`) — now centralized in `lib/design.js` so a future color change touches one file, not nine.

---

## Design refresh

You asked for "less AI-looking, more like a team of 5 professionals built it, same color scheme." Here's what changed and why.

### What I kept

- Same palette: off-white background (`#FAFAF9`), near-black ink (`#1A1A18`), forest green (`#16803C`), bordeaux red (`#BE123C`), amber (`#A16207`).
- Same Instrument Sans typeface.
- Same overall navigation model — sidebar/tabbar with the same routes.

### What changed

1. **Consolidated tokens** into `lib/design.js`. Every page imports `c` and the type/spacing scales from one place. Consistent corner radii, consistent borders, consistent type ramp.
2. **Tightened the type scale.** Page titles are now 20px/700 weight with a –0.015em tracking — same on every page. Section labels are 11px/600 uppercase with consistent letter-spacing. Body is 13–14px, never wandering.
3. **Less "AI" decoration.** Removed the purple "AI Context" callouts everywhere they were just visual noise — kept them only on the Copilot page where they belong. Removed the emoji-substitute icons (`!`, `$`, `AI` in colored circles) from the dashboard and replaced them with quiet category labels.
4. **Consistent card system.** One card style: white background, 1px border `#E8E8E4`, 8px radius, 20px internal padding. No more mix of 6/8/10/12/16 radii or 14/16/18/20/22 paddings.
5. **Consistent button system.** Primary (`#1A1A18` background, white text), Secondary (`#FAFAF9` background, `#6B6B66` text, 1px border), Destructive (red text, subtle red border). 36px height, 6px radius, 14px horizontal padding. That's it.
6. **Dashboard hierarchy.** The "Good morning, Alex" greeting is bigger and unaccompanied by stat tiles competing for attention. Action items sit alone in the visual center. Stats moved below the fold where they belong.
7. **Calmer color use.** Red is now reserved for *overdue*, not "Hot lead". Hot leads use the same red but only as a small chip, not a full border. The dashboard previously turned bright red on first load if you had any pending actions, which read as panic.
8. **Better tables on the Leads page.** Leads are now in a denser table layout on desktop (sortable columns, hover row highlight) and the card layout only on mobile. This is the single biggest "professional" tell — agents who use HubSpot and Follow Up Boss expect a table.
9. **Stage progression on Deals** uses a real horizontal stepper instead of pill buttons in a wrapping row.
10. **Settings** is no longer a full-viewport modal on desktop. It's a normal two-column page with a sidebar of sections, same as Stripe, Linear, and every other professional app. Mobile retains the wheel-menu pattern.

### What I deliberately did *not* change

- Routes and database schema — your Supabase tables (`leads`, `deals`, `messages`, `interactions`, `profiles`) and column names are untouched.
- Auth flow — login page and email confirmation flow are visually polished but functionally identical.
- The marketing site (`app/page.js`). You didn't ask for that and it's a different audience.

---

## What to do after pulling this branch

1. Set the env vars listed above in Vercel.
2. Rotate the three exposed credentials (Anthropic, Twilio, Stripe).
3. In Supabase, verify Row-Level Security policies exist on `leads`, `deals`, `messages`, `interactions`, `profiles` — every policy should be `auth.uid() = user_id`. Without RLS, the data isolation in the app is paper-thin.
4. In Supabase Authentication → URL Configuration, confirm your production domain is in Site URL and Redirect URLs so email confirmations work.
5. Deploy. Run through login → add a lead → generate a Copilot draft to confirm everything is wired up.

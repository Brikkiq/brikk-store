# Google Calendar integration — setup guide

Brikk's Google Calendar integration syncs birthdays, anniversaries, follow-ups, and deal milestones to each agent's personal Google Calendar. Tokens are encrypted at rest. Two-way sync via incremental pulls every 15 minutes.

This doc covers what you (Henry) need to do once to make the integration work for everyone.

---

## Step 1 — Register the OAuth app in Google Cloud Console

**~10 minutes.** Done once per environment (production).

1. Open https://console.cloud.google.com → top bar → **Select a project** → **New Project**
   - Name: `Brikk`
   - Click **Create**
2. Once created, make sure Brikk is the active project (top bar)
3. **APIs & Services → Library** → search "Calendar" → click **Google Calendar API** → **Enable**
4. Wait for it to enable (~30 sec)
5. **APIs & Services → OAuth consent screen**:
   - User Type: **External** → Create
   - App information:
     - App name: `Brikk`
     - User support email: `hello@brikk.store`
     - App logo (optional): upload `public/icon-512.png` from the repo
   - App domain:
     - Application home page: `https://brikk.store`
     - Application privacy policy: `https://brikk.store/privacy`
     - Application terms of service: `https://brikk.store/terms`
   - Authorized domains: `brikk.store`
   - Developer contact email: `hello@brikk.store`
   - Save and continue
6. **Scopes** screen → Add or remove scopes → check:
   - `.../auth/userinfo.email`
   - `.../auth/calendar.events`
   - Save and continue
7. **Test users** (if app is in testing mode): add your own Gmail. You can submit for verification later.
8. Save through the rest of the flow.

## Step 2 — Create OAuth credentials

1. **APIs & Services → Credentials → + Create Credentials → OAuth client ID**
2. Application type: **Web application**
3. Name: `Brikk Production`
4. Authorized redirect URIs: add EXACTLY this (no trailing slash):
   ```
   https://brikk.store/api/integrations/google/callback
   ```
5. Click **Create**
6. A modal appears with **Client ID** and **Client Secret**. Copy both, save them in your password manager.

## Step 3 — Set env vars in Vercel

Vercel → Brikk project → Settings → Environment Variables. Add each (Production environment):

| Key | Value | Source |
|---|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | the `....apps.googleusercontent.com` value from Step 2 | Google Console |
| `GOOGLE_OAUTH_CLIENT_SECRET` | the secret from Step 2 | Google Console |
| `INTEGRATIONS_ENCRYPTION_KEY` | generated value (see below) | You generate |
| `STATE_SIGNING_SECRET` | generated value (see below) | You generate |

To generate the two secrets, run in PowerShell or Terminal:
```
openssl rand -base64 32
```
Run it once, save as `INTEGRATIONS_ENCRYPTION_KEY`. Run again (different value), save as `STATE_SIGNING_SECRET`.

If you don't have `openssl` locally, use any password manager's 32-character random generator (e.g., 1Password) and base64-encode the result, or use Vercel's "Generate" button if your version of the dashboard has one.

## Step 4 — Run the SQL migration

Supabase Dashboard → SQL Editor → New Query → paste the contents of `sql/google-calendar-integration.sql` from the repo → Run.

Verify the three rows at the bottom say `present: true`.

## Step 5 — Redeploy Vercel

After env vars are added, you must redeploy so the routes can read them.

Vercel → Deployments → ⋯ → Create deployment → Production → uncheck Build Cache → Deploy. Wait for green build.

## Step 6 — Test the flow yourself

1. Sign into Brikk
2. Settings → Integrations tab
3. Click **Connect Google Calendar**
4. You're redirected to Google's consent screen showing the requested scopes
5. Click Allow / Continue
6. You're redirected back to Brikk Settings with "Google Calendar connected" banner
7. The page shows your Google email + 4 toggle checkboxes for what to sync

Add a lead with today's date as their birthday. Within 5-15 minutes, that birthday should appear in your Google Calendar.

## Step 7 — Submit for OAuth verification (later, only when you need >100 users)

If you stay in "Testing" mode in the OAuth consent screen, Google limits you to 100 unique users per OAuth app. Most launches stay under that for the first few months.

When you cross 100 users:
1. Google Cloud Console → OAuth consent screen → **Publish App** → Submit for verification
2. Provide a privacy policy URL (`https://brikk.store/privacy`)
3. Provide a homepage URL (`https://brikk.store`)
4. Justify why you need the calendar.events scope (write a short paragraph: "Brikk creates and updates events in users' calendars to sync birthdays, follow-up reminders, and deal milestones from their CRM activity. We do not read calendar events not created by Brikk.")
5. Submit. Google reviews in 2-6 weeks.

Without verification, users see a "Google hasn't verified this app" warning — they can still proceed but the friction reduces conversion.

---

## How the integration works (developer overview)

```
User clicks Connect → /api/integrations/google/start (signs state, redirects to Google)
                              ↓
                      Google consent screen
                              ↓
                      /api/integrations/google/callback (verifies state, exchanges code for tokens, encrypts, stores)
                              ↓
                      User lands back in Brikk Settings, connected.

Every time Brikk needs to sync (lead saved, deal updated, cron):
    lib/integrations/google.js:getValidAccessToken(userId)
        → refresh if expired
        → returns fresh access token
    lib/integrations/syncToGoogle.js
        → looks up calendar_event_sync row
        → POST or PATCH to Google Calendar API
        → upserts the mapping row
```

## Files

| File | What it does |
|---|---|
| `sql/google-calendar-integration.sql` | Database schema (integrations + calendar_event_sync tables) |
| `lib/integrations/encrypt.js` | AES-256-GCM for token storage |
| `lib/integrations/google.js` | OAuth token refresh + Calendar API wrapper |
| `lib/integrations/syncToGoogle.js` | Push functions: birthdays, anniversaries, deal milestones, follow-ups |
| `app/api/integrations/google/start/route.js` | OAuth redirect-out |
| `app/api/integrations/google/callback/route.js` | OAuth redirect-back |
| `app/api/integrations/google/status/route.js` | GET status + POST sync_settings |
| `app/api/integrations/google/disconnect/route.js` | Disconnect |
| `app/api/integrations/google/poll/route.js` | Cron (every 15 min) for incremental pull-back |
| `app/app/settings/page.js` → `IntegrationsTab` | UI |
| `vercel.json` | Cron config |

## Troubleshooting

**"Google OAuth not configured" on connect button**: `GOOGLE_OAUTH_CLIENT_ID` or `GOOGLE_OAUTH_CLIENT_SECRET` not set in Vercel. Add them, redeploy.

**"State signing secret missing"**: `STATE_SIGNING_SECRET` env var not set.

**Stuck on Google consent → never redirects back**: redirect URI in Google Cloud Console doesn't match. It must be EXACTLY `https://brikk.store/api/integrations/google/callback` — no `www.`, no trailing slash.

**"bad_state" on callback**: clock skew between server and user device, or user took >10 min between clicking Connect and reaching the consent screen. Just try again.

**Events not appearing in Google Calendar after connecting**: events are created when leads/deals are saved or updated, not immediately on connect. Edit any lead's birthday to force a save. Within ~30 seconds the event should appear.

**Bot accidentally creates duplicate events**: indicates the `calendar_event_sync` table wasn't created properly. Re-run the schema migration.

**Want to revoke Brikk's access from Google's side**: user goes to https://myaccount.google.com/permissions → finds Brikk → Remove access. Next API call from Brikk returns `invalid_grant`, the integration auto-disables.

## What's NOT included in v1

Honest scope notes for future v2 work:

- **Full Google → Brikk write-back** (you edit an event in Google, it updates the underlying lead/deal). Today the cron pulls changes but doesn't reconcile them.
- **Multi-calendar support** (sync to a non-primary calendar). Today everything goes to "primary".
- **Microsoft Outlook Calendar** — same architecture, future migration.
- **Selective sync by category** (e.g., "only sync hot leads' birthdays"). Today it's all-or-nothing per category toggle.

These are tracked in `app/roadmap/page.js`.

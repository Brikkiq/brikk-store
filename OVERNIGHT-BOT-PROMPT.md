# Overnight bot prompt — Google Calendar two-way sync

Paste this entire document into a fresh Claude in Chrome session (or Claude Code session) with **write access to the brikk-store repo**. The bot will work through it autonomously over several hours, committing as it goes.

Tell the bot at the start: **"You have full write access to the brikk-store repo. Work continuously through this spec without asking permission for non-destructive changes. Commit after each completed phase with a clear message. If you hit an actual ambiguity, leave a TODO comment and continue rather than blocking. Goal: ship as much as possible before Henry wakes up."**

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

## Start now

The above is a complete spec. Begin with section 1 (schema) and work down. Commit after each section. Don't ask permission for non-destructive changes. If you hit something genuinely ambiguous, leave a TODO and move on.

You have until ~7am to ship as much as possible. Go.

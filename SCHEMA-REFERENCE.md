# Brikk database schema reference

Annotated reference for every table and column. Read this when joining the team, debugging weird data states, or planning a schema migration.

Source of truth: `supabase-migration.sql` (initial) + every file in `sql/`.

---

## profiles

One row per registered user. Created automatically by the `handle_new_user` trigger on `auth.users INSERT`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK, FK auth.users.id) | Matches Supabase auth user ID |
| `full_name` | text | Display name shown across app + emails |
| `phone` | text | Agent's business phone (free-form, not strict format) |
| `brokerage` | text | Agent's brokerage name |
| `referral_code` | text (UNIQUE) | Short code for `brikk.store/r/CODE` lead capture link. Auto-generated via `lib/referralCode.js`. |
| `team_id` | uuid (FK teams.id) | NULL if solo agent. Set when they join or create a team. |
| `team_role` | text | `owner` or `member`. Only meaningful when `team_id` is set. |
| `stripe_customer_id` | text | Set by webhook on first checkout |
| `stripe_subscription_id` | text | Set by webhook on subscription creation |
| `subscription_plan` | text | `pro`, `team`, `agency`, or NULL |
| `subscription_status` | text | `trialing`, `active`, `past_due`, `canceled`, `trial_ending`, `paused`, NULL |
| `annual_commission_goal` | numeric | Dollar amount the agent wants to hit this year |
| `goal_year` | integer | Which year the goal is for (defaults to current year) |
| `conversion_rate_estimate` | numeric | Default 0.15 (15%). Used in commission pacing math. |
| `created_at` / `updated_at` | timestamptz | Standard |

**RLS:** `auth.uid() = id` (you can only read/update your own profile).

---

## leads

The agent's pipeline. Each row is one prospect/client. The most-used table in the app.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK auth.users.id) | Owner of the lead |
| `name` | text (NOT NULL) | Lead's full name |
| `phone` | text | Free-form; displayed via `fmt.phone()` |
| `email` | text | Validated server-side via regex when added through /api/refer |
| `source` | text | `Zillow`, `Referral`, `Open House`, `Social Media`, `Website`, `Cold Call`, `Referral Link`, `CSV Import`, `Voice Note`, `Other` |
| `temperature` | text | `hot`, `warm`, `cold` |
| `stage` | text | `New Lead`, `Contacted`, `Showing Scheduled`, `Offer Submitted`, `Under Contract`, `Closed Won`, `Closed Lost` |
| `lead_type` | text | `Buyer` or `Seller` |
| `price_range` | text | Free-form ("$275K – $350K") |
| `notes` | text | Free-form |
| `address` | text | Property of interest (buyer) or property being sold (seller) |
| `preferred_area` | text | For buyers — neighborhoods/zips they're looking at |
| `bedrooms` | text | Buyer preference, free-form |
| `pre_approved` | boolean | Buyer financing status |
| `pre_approved_amount` | text | Free-form amount string |
| `timeline` | text | "0-30 days", "3-6 months", etc. Free-form. |
| `birthday` | date | Drives birthday reminder cards + Google Calendar sync |
| `contact_preference` | text | `text`, `call`, `email` |
| `spouse_name` | text | For client relationship continuity |
| `last_contact_date` | timestamptz | Updated on every message send, voice note, etc. |
| `created_at` / `updated_at` | timestamptz | |

**RLS:** `auth.uid() = user_id`.

**Realtime:** YES — INSERT events broadcast (powers the "new lead came in" toast).

---

## deals

Under-contract through closing. One row per transaction (not per lead — a lead can have multiple deals over time, and a deal isn't required to have a linked lead).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK auth.users.id) | |
| `lead_id` | uuid (FK leads.id, ON DELETE SET NULL) | Optional link to a lead. Trigger syncs `client_name` when the lead's name changes. |
| `client_token` | text (UNIQUE) | Public URL token for `brikk.store/track/TOKEN`. Auto-generated on insert via trigger. |
| `address` | text (NOT NULL) | Property address |
| `client_name` | text | Denormalized from lead (or freely entered) |
| `price` | numeric | Sale price |
| `commission` | numeric | Agent's commission |
| `close_date` | date | Expected or actual close date |
| `stage` | text | `Contract`, `Inspection`, `Appraisal`, `Financing`, `Title`, `Closing`, `Closed` |
| `progress` | integer | 10/25/40/60/80/90/100 — derived from stage |
| `notes` | text | Free-form. Visible to client on the public tracker. |
| `created_at` / `updated_at` | timestamptz | |

**RLS:** `auth.uid() = user_id`.

**Important note on `client_token`:** the public tracker page reads this via the anon key. Anyone with the token can see the deal — keep it secret like a password. Auto-rotation isn't implemented yet (v3 roadmap).

---

## messages

Per-lead conversation history. Both inbound (lead replied) and outbound (agent sent).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK auth.users.id) | Owner (the agent) |
| `lead_id` | uuid (FK leads.id, ON DELETE CASCADE) | |
| `direction` | text | `inbound` or `outbound` |
| `channel` | text | `text`, `email`, `manual` |
| `content` | text | Message body |
| `status` | text | `sent_via_phone`, `sent_via_email`, `copied`, `approved`, `logged` |
| `sentiment` | text | AI-classified for inbound: `warm`, `cool`, `frustrated`, `neutral`. NULL for outbound. |
| `created_at` | timestamptz | |

**RLS:** `auth.uid() = user_id`.

**Realtime:** YES.

---

## interactions

Non-message events: calls logged, voice notes, in-person meetings, etc.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK auth.users.id) | |
| `lead_id` | uuid (FK leads.id, ON DELETE CASCADE) | |
| `interaction_type` | text | `call`, `text`, `email`, `meeting`, `voice_note`, `text_received`, `text_sent_after_miss`, `manual` |
| `notes` | text | What happened, free-form |
| `created_at` | timestamptz | |

**RLS:** `auth.uid() = user_id`.

---

## teams

Team/Agency plan rows. One row per team. The team `owner_id` pays.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `name` | text | Team display name |
| `team_code` | text (UNIQUE) | `TEAM-XXXX-YYYY` format. Members join by entering this code at signup. |
| `plan_tier` | text | `team` or `agency` |
| `owner_id` | uuid (FK auth.users.id) | Whoever pays |
| `max_seats` | integer | 5 for team, 999 for agency |
| `stripe_subscription_id` | text | |
| `stripe_customer_id` | text | |
| `status` | text | `active`, `past_due`, `cancelled` |
| `created_at` / `updated_at` | timestamptz | |

**RLS:** Members can SELECT their team. Only owner can UPDATE/DELETE.

---

## referrals

Agent's referral ledger.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK auth.users.id) | The agent tracking the referral |
| `direction` | text | `received` (someone sent me a lead) or `given` (I sent a lead to someone) |
| `party_name` | text (NOT NULL) | The other agent / referrer |
| `party_phone` / `party_email` / `party_brokerage` | text | Optional contact info for the other party |
| `client_name` | text | The lead being referred |
| `lead_id` | uuid (FK leads.id) | Optional link to the Brikk lead row, if it was added |
| `status` | text | `open`, `closed`, `lost` |
| `expected_commission` / `actual_commission` | numeric | |
| `notes` | text | |
| `referred_at` / `closed_at` | date | |
| `created_at` / `updated_at` | timestamptz | |

**RLS:** `auth.uid() = user_id`.

---

## offers

Multi-offer comparison sheet rows. Used when a listing has multiple buyer offers.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK auth.users.id) | |
| `listing_address` | text (NOT NULL) | The property |
| `deal_id` | uuid (FK deals.id, ON DELETE CASCADE) | Optional link to a Deal row |
| `buyer_name` / `buyer_agent` | text | |
| `price` / `earnest_money` / `down_payment` | numeric | |
| `financing_type` | text | `cash`, `conventional`, `FHA`, `VA`, etc. |
| `contingencies` | text[] | Array: `['inspection', 'appraisal', 'financing']` |
| `close_date` | date | |
| `expiration` | date | When the offer expires |
| `status` | text | `pending`, `accepted`, `rejected`, `countered`, `expired` |
| `notes` | text | |
| `created_at` / `updated_at` | timestamptz | |

**RLS:** `auth.uid() = user_id`.

---

## checklist_items

Listing-prep + transaction tasks tied to a deal or lead.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK auth.users.id) | |
| `deal_id` | uuid (FK deals.id, ON DELETE CASCADE) | Optional |
| `lead_id` | uuid (FK leads.id, ON DELETE CASCADE) | Optional (at least one of deal_id or lead_id should be set) |
| `label` | text (NOT NULL) | Task description |
| `category` | text | `listing_prep`, `inspection`, `closing`, `custom` |
| `done` | boolean | |
| `due_date` | date | |
| `order_index` | integer | For ordering within a category |
| `created_at` / `updated_at` | timestamptz | |

**RLS:** `auth.uid() = user_id`.

---

## integrations

Per-user OAuth tokens for external services. Tokens are encrypted at rest via AES-256-GCM (`lib/integrations/encrypt.js`).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK auth.users.id) | |
| `provider` | text (NOT NULL) | `google_calendar`, `microsoft_calendar` (future) |
| `access_token` | text | Encrypted |
| `refresh_token` | text | Encrypted |
| `expires_at` | timestamptz | When the access token expires |
| `account_email` | text | Display only (e.g., "user@gmail.com") |
| `calendar_id` | text | Default `primary` |
| `sync_token` | text | Google's incremental sync token |
| `last_synced_at` | timestamptz | When the poll cron last ran for this user |
| `enabled` | boolean | Soft-disable on token revocation |
| `sync_settings` | jsonb | `{birthdays, anniversaries, follow_ups, deal_milestones}` booleans |
| `created_at` / `updated_at` | timestamptz | |

UNIQUE on (user_id, provider).

**RLS:** `auth.uid() = user_id`. CRITICAL — these tokens are sensitive.

---

## calendar_event_sync

Maps Brikk entities to Google Calendar event IDs. Lets us PATCH instead of POST on re-sync (idempotency).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK auth.users.id) | |
| `brikk_source_type` | text (NOT NULL) | `lead`, `deal`, `birthday`, `anniversary`, `manual`, `follow_up` |
| `brikk_source_id` | uuid | The lead.id, deal.id, etc. NULL for `manual` |
| `google_event_id` | text | The Google event ID |
| `google_calendar_id` | text | Default `primary` |
| `last_pushed_at` | timestamptz | When Brikk last pushed to Google |
| `last_pulled_at` | timestamptz | When the cron last pulled from Google |
| `created_at` / `updated_at` | timestamptz | |

UNIQUE on (user_id, google_event_id) AND (user_id, brikk_source_type, brikk_source_id).

**RLS:** `auth.uid() = user_id`.

---

## Triggers + functions

- `handle_new_user()` — INSERT trigger on `auth.users` → creates the corresponding `profiles` row with a default referral_code
- `touch_updated_at()` — BEFORE UPDATE trigger on most tables → sets `updated_at = now()`
- `sync_deal_client_name_from_lead()` — AFTER UPDATE trigger on `leads` → propagates name change to all linked deals
- `set_deal_client_token()` — BEFORE INSERT trigger on `deals` → auto-generates `client_token` if missing

---

## Realtime publication

The `supabase_realtime` publication includes:
- `leads` (drives the new-lead toast)
- `messages` (drives live conversation updates)
- `checklist_items`, `referrals`, `offers` (so the UI updates without a manual reload)

If a new table needs realtime, add it via `ALTER PUBLICATION supabase_realtime ADD TABLE public.foo;`.

---

## Common queries

### Today's birthdays for a user

```sql
SELECT name, birthday
FROM leads
WHERE user_id = $1
  AND EXTRACT(MONTH FROM birthday) = EXTRACT(MONTH FROM now())
  AND EXTRACT(DAY FROM birthday) = EXTRACT(DAY FROM now())
```

### Hot leads cold

```sql
SELECT *
FROM leads
WHERE user_id = $1
  AND temperature = 'hot'
  AND last_contact_date < now() - interval '2 days'
ORDER BY last_contact_date ASC
LIMIT 5
```

### Deals closing this week

```sql
SELECT *
FROM deals
WHERE user_id = $1
  AND stage != 'Closed'
  AND close_date BETWEEN now() AND now() + interval '7 days'
ORDER BY close_date ASC
```

### Closed commission for the year (for goal pacing)

```sql
SELECT COALESCE(SUM(commission), 0) AS earned
FROM deals
WHERE user_id = $1
  AND stage = 'Closed'
  AND EXTRACT(YEAR FROM COALESCE(close_date, updated_at)) = EXTRACT(YEAR FROM now())
```

---

## Last updated

May 21, 2026. Update this doc when you add a column or table — don't let it drift.

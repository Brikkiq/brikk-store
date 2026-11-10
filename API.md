# Brikk API v1 — for the web app and the iOS / Android apps

Every screen in the web app is built only on these endpoints, so the mobile apps can do
everything the web app does. Business rules (scheduling, birthdays, what's due today) live
on the server — apps only display results and send actions.

## Basics

- **Base URL:** `https://brikk.store/api/v1`
- **Auth:** sign in with Supabase Auth (`@supabase/supabase-js`, or the Swift / Kotlin
  Supabase SDKs) using the project's URL and anon key. Send the access token on every call:
  `Authorization: Bearer <access_token>`. Refresh it with the Supabase SDK.
- **Format:** JSON in, JSON out. Success: `{ "data": ... }`.
  Error: `{ "error": { "code": "bad_request", "message": "carrier is required" } }`.
- **Status codes:** `400` invalid input · `401` not signed in / expired token · `402` free trial
  over, no subscription (show the upgrade screen) · `404` not found · `429` rate limited ·
  `500` server error.
- **Unknown fields are rejected** (400). This is deliberate: it is how we guarantee no health
  or medical information can be stored. Never add health fields to the apps.
- **Dates:** policy, birthday and follow-up dates are calendar dates `YYYY-MM-DD` (no time
  zone). Timestamps (`created_at`, `completed_at`…) are ISO 8601 UTC. "Today" is decided by
  the server in the agent's time zone (`profile.timezone`).
- **Versioning:** breaking changes go to `/api/v2`; v1 keeps working.

## Texting rule (important)

Brikk never sends texts. Apps open the phone's own Messages app with the text pre-filled:

- iOS: `sms:+15555550123&body=<url-encoded text>`
- Android: `sms:+15555550123?body=<url-encoded text>`

(See `lib/core/sms.js`.) Flow for a follow-up:

1. Agent taps **Text** → call `POST /follow-ups/:id/opened`, then open the `sms:` link.
2. When the app comes back to the foreground, show **"Did you send it?"** for any follow-up
   with `status: "opened"`.
3. **Yes** → `POST /follow-ups/:id/done` `{ "via": "text" }`. **Not yet** → `POST /follow-ups/:id/reopen`.

Never mark a follow-up done automatically.

## Endpoints

### Profile
| Method | Path | Body / notes |
|---|---|---|
| GET | `/me` | `{ email, profile, trial }`. Works even after the trial ends. `trial.state`: `trialing` · `subscribed` · `team_member` · `past_due` · `expired`. |
| PATCH | `/me` | `{ full_name?, phone?, agency_name?, timezone? }` — timezone is an IANA name like `America/Chicago`. |

### Today
| GET | `/today` | Response below. Also creates birthday follow-ups for the next week. |
|---|---|---|

```json
{
  "date": "2026-11-10",
  "timezone": "America/New_York",
  "overdue":   [FollowUpItem],
  "today":     [FollowUpItem],
  "this_week": [FollowUpItem],
  "stats": { "due_today": 2, "overdue": 1, "done_this_week": 4, "active_policies": 12,
             "pending_policies": 2, "monthly_premium": 812.4, "clients": 14 }
}
```

`FollowUpItem`: `{ id, kind, label, due_date, status, message, household: { id, display_name }, person, phone }`
— `kind`: `policy` · `annual_review` · `birthday` · `manual`; `status`: `pending` · `opened`.
`phone` is the number to text (null → prompt the agent to add one). Birthdays missed by more
than 3 days drop off.

### Book (households)
| Method | Path | Body / notes |
|---|---|---|
| GET | `/households?q=&status=` | List: `{ id, display_name, phone, email, status, last_contact_at, members[], policy_count, carriers[], next_follow_up }`. |
| POST | `/households` | `{ display_name*, phone, email, address_line, city, state, zip, source, status, notes, members: [Member] }` → household detail. |
| GET | `/households/:id` | Detail: household + `members`, `policies`, `follow_ups`, `activity`. |
| PATCH | `/households/:id` | Any household field above (not `members`). |
| DELETE | `/households/:id` | Deletes everything for that household. |
| GET | `/households/:id/timeline` | `{ today, household, items[] }` — oldest first. Item `type`: `policy_written` · `follow_up` (has `follow_up`) · `birthday` (next upcoming) · `activity` (has `activity`). Each has `date`, `title`, `subtitle`. |
| POST | `/households/:id/activity` | `{ type: "call"|"note"|"text_sent", note? }` — log something on the timeline. |
| POST | `/households/:id/follow-ups` | `{ label*, due_date*, message?, member_id? }` — a one-off reminder. |

`status`: `prospect` · `client` · `inactive`. Adding the first policy makes the household a `client`.

### People (household members)
`Member`: `{ role: "policyholder"|"spouse"|"child"|"other", first_name*, last_name, birthday, phone, email, sort_order }`

| POST | `/households/:id/members` | Member |
|---|---|---|
| PATCH | `/members/:id` | Any member field. Changing a birthday reschedules that person's birthday reminder. |
| DELETE | `/members/:id` | |

A child's birthday text goes to the parent's phone unless the child has their own number.

### Policies
`Policy`: `{ carrier*, product, policy_number, face_amount, monthly_premium, application_date,
effective_date, first_draft_date, status: "pending"|"active"|"cancelled", insured_member_id,
beneficiaries: [{ name*, relationship }] }` — no health fields exist, by design.

| POST | `/households/:id/policies` | Policy → creates the policy **and schedules its follow-ups**. |
|---|---|---|
| PATCH | `/policies/:id` | Changing dates/status/carrier/premium recalculates its open follow-ups (done/skipped ones stay). `cancelled` skips them. |
| DELETE | `/policies/:id` | Also deletes its follow-ups. |

### Follow-ups
| PATCH | `/follow-ups/:id` | `{ label?, due_date?, message? }` |
|---|---|---|
| DELETE | `/follow-ups/:id` | Only `manual` ones — skip the others. |
| POST | `/follow-ups/:id/opened` | Agent opened the text in Messages (not "sent"). |
| POST | `/follow-ups/:id/done` | `{ via?: "text"|"call"|"other", note? }` — agent confirmed. Annual reviews schedule next year's. |
| POST | `/follow-ups/:id/skip` | |
| POST | `/follow-ups/:id/reopen` | Back to `pending`. |

### Follow-up schedule (agent-editable)
| GET | `/schedule` | The agent's steps (defaults created on first call). |
|---|---|---|
| PUT | `/schedule` | `{ templates: [{ id?, label, anchor, offset_days, offset_months, repeat_yearly, message_template, active }] }` replaces the list. Applies to policies added afterwards. |
| POST | `/schedule/reset` | Back to defaults. |

`anchor`: `application_date` · `first_draft_date` · `effective_date`. Default schedule:
thank-you (application +1 day), before first draft (draft −2), payment check (draft +3),
30/60/90 days, 6 months (application + 6 months), annual review (application + 12 months,
repeats yearly). Placeholders: `{first_name} {agent_first_name} {carrier} {product}
{monthly_premium} {face_amount} {first_draft_date} {effective_date}`.

### Leads (in development)
| GET | `/lead-offers` | `{ status: "in_development", offers: [] }` |
|---|---|---|

### Not under /v1
- `POST /api/stripe` `{ plan: "pro" }` → `{ url }` (Stripe Checkout). `POST /api/stripe/portal` → `{ url }`.
- `POST /api/team` — team create/join/leave (existing team plans).
- `GET/POST /api/refer` — public lead capture form (no auth, rate limited).

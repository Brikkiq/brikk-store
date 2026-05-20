# Pre-demo checklist — Brikk

Follow this end to end before showing the app to a realtor. Each step has a verification — don't skip the verifications.

---

## 1. Run the Supabase migration

The new code expects every column the leads/deals/messages forms reference, plus the new `teams` table and `referral_code` / `team_id` columns on profiles. Run this once:

1. Open Supabase → your project → **SQL Editor**.
2. Click **New query**.
3. Open `supabase-migration.sql` in this repo, copy the entire file.
4. Paste into the SQL Editor.
5. Click **Run**. It should complete with no errors (you may see "policy already exists" warnings — those are fine).

**Verification:** in Supabase → **Table Editor**:
- Confirm `teams` table exists with columns `id`, `name`, `team_code`, `plan_tier`, `owner_id`, `max_seats`, `status`.
- Click `profiles`. Confirm columns `referral_code`, `team_id`, `team_role` exist.
- Click `leads`. Confirm all 18 fields exist.

---

## 2. Enable Supabase Realtime for the leads table

Real-time alerts (when a referral lead lands) use Supabase Realtime. You need to flip it on:

1. Supabase → **Database** → **Replication**.
2. Find the `leads` table in the list.
3. Enable replication for **INSERT** events.
4. Save.

**Verification:** the `leads` row in the Replication list shows INSERT enabled.

---

## 3. Set environment variables in Vercel

You collected these into Notepad earlier. Confirm all 9 are set in Vercel → Settings → Environment Variables, with Production/Preview/Development checked:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL`

**Minimum for the demo:** the first 4 plus the Anthropic key. The Twilio/Stripe vars only matter if you'll demo live SMS or Stripe checkout.

---

## 4. Deploy

```
git add .
git commit -m "Teams + referral codes + mobile polish"
git push
```

Vercel auto-deploys. Watch **Deployments** for the green Ready check.

---

## 5. Desktop smoke test

Open the deployed site in a fresh browser window.

1. **Landing page** — confirm the new logo (two-brick mark + "Brikk") appears top-left. Pricing section shows three tiers: Pro, Team, Agency.
2. **Login** — sign in. Land at `/app` within 2 seconds.
3. **Today** — greeting, action items, KPIs, Jump-to quick links.
4. **Settings → Lead capture link** — should show a friendly `brikk.store/r/XXXX-YYYY` URL. Copy it.
5. **Open the friendly URL in a new tab.** Fill out the form with a test lead. Submit.
6. **Back in the main app**, watch for a green toast in the top-right: "New lead: [name] just filled out your link". This is the Supabase Realtime alert.
7. **Check Leads tab.** The test lead should be there, source = "Referral Link".

---

## 6. Mobile smoke test

Open on your phone.

1. **Login** — same flow.
2. **Bottom tab bar** — should show 7 tabs: Today, Copilot, Leads, Deals, Messages, Marketing, Settings.
3. **Pinch-zoom** — try to pinch and double-tap zoom. Should not zoom.
4. **Deals page** — click into a deal. The stage stepper should appear stacked vertically with full labels, not the cramped horizontal version.
5. **Messages page** — pick a lead. The conversation should take over the screen with a slim back-arrow header (no Brikk top bar, no bottom tabs while the conversation is open).
6. **Press the back arrow.** Returns to the lead list.

---

## 7. Team plan walkthrough (NEW — test before pitching)

This is the new feature you wanted to be able to demo. Walk through it once before showing the realtor.

1. **As your owner account** — Settings → **Team** tab.
2. Type a team name, e.g. "Acme Realty Group". Click **Create team**.
3. The page now shows your team code, e.g. `TEAM-XXXX-YYYY`. **Copy it.**
4. Sign out. Open an incognito window. Go to `brikk.store/login` → Sign Up.
5. Fill in a fake test account. Click "+ I have a team code". Paste the code.
6. Complete signup, confirm email, sign in.
7. **Settings → Team** — should show "Member of Acme Realty Group" and "Plan covered by team."
8. Back as the owner account → **Settings → Team** → Members. The test agent should appear.
9. (Optional) Click Remove next to the test member. Confirm they're removed.

---

## 8. SMS deliverability test (only if Twilio is needed)

1. In Brikk, Messages tab. Pick a lead whose phone is **your own phone**.
2. Type "Test from Brikk" and send.
3. **Verify the text actually arrives on your phone.** The app saying "Sent" is not enough.
4. If it doesn't arrive, check Twilio Console → Monitor → Logs → Messaging.

---

## 9. Copilot test

1. Leads → manually backdate a lead's `last_contact_date` (in Supabase Table Editor) to 3 days ago.
2. Copilot page → **Generate drafts**.
3. Drafts should appear within 10-15s.
4. Click **Approve & log** on one. The card should stay in place with a green success state — "Approved · contact logged" — not disappear.

---

## 10. Demo storyboard (10 minutes)

A revised flow that incorporates the new features.

1. **Sign in** (10s). "This is what you open every morning."
2. **Today screen** (60s). Walk through action items. "Brikk reads your pipeline and tells you exactly who to call before the day starts."
3. **Copilot** (90s). Generate drafts. While running: "Brikk doesn't just remind you — it writes the message for you, using everything it knows about that lead." Show one. Show "Why now" reasoning. Click Approve & Log. **Point out**: "It stays right here so you can copy and send manually — it doesn't auto-send."
4. **Leads table** (60s). Sort, filter, search.
5. **Deals stepper** (45s). Click through stages. Visual progress.
6. **Marketing** (45s). Source ROI, hot rate by channel. "Stop paying Zillow if Referrals close 7x better."
7. **Lead Capture Link** (60s). Settings → Lead capture. **Show the friendly URL** `brikk.store/r/XXXX-YYYY`. "Put this in your Instagram bio. Anyone who fills it out lands directly in your pipeline." → Demo: open the URL in a new tab on your phone, submit a fake lead. Show the **live alert** appear in real time on the desktop. This is the wow moment.
8. **Team plans** (75s). Settings → Team. "If you have a small team, one of you pays the Team plan. You generate a team code. Your other agents enter it at signup — no individual billing. Everyone gets access. We have an Agency tier for full brokerages."
9. **Voice-to-CRM** (45s). Floating mic. Speak a quick note. Show AI extraction.
10. **Mobile view** (30s). Show on your phone. Bottom bar, conversation takeover.
11. **Pricing** (close). "Pro $75. Team $200. Agency, contact us. 45 days free, no card."

---

## 11. Risk register — what could blow up the demo

| Risk | Mitigation |
|------|-----------|
| Supabase project pauses mid-demo | Open the Supabase dashboard before the meeting; that keeps it warm |
| SMS doesn't deliver | Skip the SMS demo, show the in-app conversation log instead |
| Copilot returns nothing | Backdate a lead's `last_contact_date` so there's eligible work |
| Realtime alert doesn't fire | Skip the real-time wow moment; reload the page to show the lead landed |
| Team code rejected | Most likely cause is the migration didn't run — re-run `supabase-migration.sql` |

---

## 12. After the demo

If the realtor expresses interest:

- Send them their own referral link as a "thank you for the chat" gesture.
- Offer to set up a team for them on the spot — generate their team code and email it to them.
- 45 days free. No card.

Good luck.

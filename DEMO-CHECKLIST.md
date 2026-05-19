# Pre-demo checklist — Brikk

Follow this end to end before showing the app to a realtor. Each step has a verification — don't skip the verifications.

---

## 1. Run the Supabase migration

The new code expects every column the leads/deals/messages forms reference. Run this once:

1. Open Supabase → your project → **SQL Editor**.
2. Click **New query**.
3. Open `supabase-migration.sql` in this repo, copy the entire file.
4. Paste into the SQL Editor.
5. Click **Run**. It should complete with no errors (you may see "policy already exists" warnings — those are fine).

**Verification:** in Supabase → **Table Editor**, click `leads`. Confirm you see columns: `name`, `phone`, `email`, `source`, `temperature`, `stage`, `lead_type`, `price_range`, `notes`, `address`, `preferred_area`, `bedrooms`, `pre_approved`, `pre_approved_amount`, `timeline`, `birthday`, `contact_preference`, `spouse_name`, `last_contact_date`, `created_at`, `updated_at`.

---

## 2. Set environment variables in Vercel

You collected all 9 into your Notepad earlier. If you haven't yet, follow `CHANGES.md` Mission 5.

**Verification:** Vercel → Settings → Environment Variables. Confirm exactly these 9 are set with all three environments (Production, Preview, Development) checked:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL`

---

## 3. Deploy

If you already pushed to GitHub, Vercel auto-deployed. If not:

```
git add .
git commit -m "Mobile polish, logo, schema migration, admin redesign"
git push
```

Then in Vercel → Deployments → wait for **Ready**.

**Verification:** the latest deployment shows the current commit hash and a green check.

---

## 4. Smoke test on desktop

Open `https://brikk.store` in a normal browser window.

1. **Landing page** — confirm the new logo (two staggered bricks + "Brikk") appears top-left.
2. **Login** — click **Start Free**. Sign in with your account. You should land on `/app` within 2 seconds. If it sticks on "Please wait…" — check Supabase project is not paused.
3. **Today screen** — should show greeting, action items (if any), four KPI tiles, and "Jump to" quick links.
4. **Add a lead** — Leads tab → **+ Add lead**. Fill in name + phone. Save. Confirm it appears in the table.
5. **Edit a lead** — click **Edit** on the row. Change something. Save. Confirm it updates.
6. **Log contact** — click **Log** on a row. Confirm "Last contact" column updates to "today".
7. **Add a deal** — Deals tab → **+ Add deal**. Fill in address + close date. Save. Confirm it appears.
8. **Click a stage** on the deal stepper. Confirm the green track fills up to that point.
9. **Calendar** — should auto-populate with follow-up reminders and closing deadlines.
10. **Copilot** — click **Generate drafts**. If you have any lead that needs follow-up, drafts return in 10-15 seconds. If you get an empty list, that means no leads need follow-up (which is normal for a fresh test account — manually set a lead's `last_contact_date` back a few days in Supabase to test).
11. **Marketing** — should show source distribution pie + funnel + AI insight.
12. **Settings** — Profile, Appearance, Billing, Lead capture, Privacy, Legal. All tabs render.
13. **Sign out** — top right area or Settings → Sign out. Should return to landing page.

---

## 5. Smoke test on mobile

Open `https://brikk.store` on your phone (Safari on iPhone, Chrome on Android).

1. **Login** — same flow.
2. **Logo at top** — the Brikk logo should appear centered at the top of every screen.
3. **Bottom tab bar** — should show six tabs in this order: **Today · Copilot · Leads · Deals · Messages · Settings**.
4. **Pinch-zoom test** — try to pinch-zoom on the dashboard. It should not zoom. Try double-tapping. Also should not zoom.
5. **Horizontal scroll** — swipe left or right. The page should not scroll horizontally. Nothing should be cut off the right edge.
6. **Add a lead on mobile** — confirm the form is usable, inputs are 16px (no iOS focus zoom), buttons are tappable.

---

## 6. SMS deliverability test (only if Twilio is needed for the demo)

This is the most likely thing to embarrass you on demo day — if the realtor sends a test text and it never arrives, the moment is lost.

1. In Brikk, Messages tab. Pick a lead whose phone is **your own phone**.
2. Type "Test from Brikk" and send.
3. **Verify the text actually arrives on your phone.** The app saying "Sent" is not enough.

If it doesn't arrive:

- Check Twilio Console → **Monitor → Logs → Messaging**. Click the most recent send. The `Status` field tells you why (most likely "undelivered" with an error code for A2P 10DLC).
- For demo purposes, you can fall back to telling the realtor "SMS delivery requires carrier registration that takes 2-3 business days — for this demo, watch the message land in the conversation history" and demo the in-app message log instead.

---

## 7. Demo storyboard

A 7-minute demo flow that lands the value. Practice it once before the realtor arrives.

1. **Sign in** (10 seconds). "This is what you open every morning."
2. **Today screen** (60 seconds). Walk through the action items. "Brikk reads your pipeline and tells you exactly who to call, in what order, before the day starts. It's the answer to 'What should I be doing right now?'"
3. **Copilot** (90 seconds). Click Generate drafts. While it works, narrate: "Most CRMs remind you to follow up. Brikk writes the message for you, using everything it knows about that lead — their temperature, your conversation history, their timeline." When drafts appear, walk through one. Show the "Why now" reasoning.
4. **Leads table** (60 seconds). Sort by Last Contact. "Your whole pipeline, sortable and searchable. Eighteen realtor-specific fields — pre-approval, timeline, bedrooms, preferred area, contact preference."
5. **Deals stepper** (45 seconds). Pick a deal, click through the stages. "Visual progress from contract to close. The system flags risks automatically when a deal is approaching deadline."
6. **Marketing ROI** (45 seconds). "Most agents don't know which lead source actually closes. Brikk tells you, by hot rate and conversion. Stop paying Zillow if Referrals close 7x better."
7. **Voice-to-CRM** (60 seconds). Show the floating mic. Speak something like "Sarah Mitchell is interested in the property on Elm, said she'd come look this Friday at 3." Show the AI extract and save it to her lead record.
8. **Mobile view** (30 seconds). Open on your phone. "Same thing, in your pocket. Add to Home Screen and it works like a native app."
9. **Pricing** (close). "$75 a month. First 45 days free. No credit card to start. Compared to $300-500 for Lofty or Follow Up Boss."

---

## 8. Things NOT to do on demo day

- Don't show `/admin` (it's not what the realtor cares about).
- Don't open the `/demo` route — show the actual product, not the marketing showcase.
- Don't promise SMS delivery until you've confirmed it works end-to-end on your account.
- Don't promise per-agent phone numbers — that feature isn't built yet (see CHANGES.md "Per-account phone numbers" section).
- Don't say "AI does X" without showing X happen live. Live demos beat claims.

---

## 9. If something goes wrong mid-demo

- **Page won't load** → check the deployment is still ready in Vercel. If a build is in progress, the previous version is still live.
- **Copilot generates nothing** → manually backdate a lead in Supabase (`last_contact_date` to a date 3+ days ago) and regenerate.
- **SMS fails** → fall back to showing the in-app conversation log without sending real SMS.
- **Anything else** → pivot to the Today screen — that one screen is the single most compelling thing about Brikk. Spend more time there.

Good luck.

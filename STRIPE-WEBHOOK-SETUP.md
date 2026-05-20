# Stripe webhook — 6-step setup

Wires Stripe checkout completion to your `teams` table. After this, anyone who subscribes to the Team plan via Stripe Checkout gets their team auto-created with the right seat count and a fresh team code — no manual SQL.

**Total time:** about 5 minutes.

---

## What you need open

- Stripe Dashboard → `https://dashboard.stripe.com`
- Vercel Dashboard → `https://vercel.com/dashboard`

---

## Step 1 — Run the updated migration (if you haven't)

If you've already run `supabase-migration.sql` once, run it again. Idempotent — won't change anything that's already there, just adds the new Stripe-related columns to `profiles` and `teams`.

1. Supabase → SQL Editor → New query.
2. Paste the file. Run.
3. Verify: open `Table Editor → profiles`. You should see new columns `stripe_customer_id`, `stripe_subscription_id`, `subscription_plan`, `subscription_status`.

---

## Step 2 — Create the webhook endpoint in Stripe

1. Stripe Dashboard → top right, confirm you're in the right mode (**Live** for production, **Test** for testing). For initial setup, use **Test mode** first.
2. Left sidebar → **Developers** → **Webhooks**.
3. Click **Add endpoint** (top right).
4. **Endpoint URL:** `https://brikk.store/api/stripe/webhook`
   (Replace with your actual domain if different.)
5. **Description:** "Brikk team subscription sync" (this is just a label for you).

---

## Step 3 — Pick the events to listen for

In the **Select events to listen to** picker, search and add these four:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`  *(optional — flags teams as past_due when a card fails)*

Click **Add events**, then **Add endpoint**.

---

## Step 4 — Copy the signing secret

After the endpoint is created, you land on its detail page.

1. Find the **Signing secret** section (right side).
2. Click **Reveal** (or **Click to reveal**).
3. Copy the value. It starts with `whsec_...`.

**Don't paste this anywhere except Vercel.** Don't put it in chat, don't put it in code.

---

## Step 5 — Add the secret to Vercel

1. Vercel Dashboard → your Brikk project → **Settings** → **Environment Variables**.
2. Click **Add New**.
3. **Key:** `STRIPE_WEBHOOK_SECRET`
4. **Value:** paste the `whsec_...` value.
5. Check **Production**, **Preview**, **Development**.
6. **Save.**

---

## Step 6 — Redeploy

Vercel won't pick up new env vars until the next deploy.

1. Vercel → **Deployments** → latest deployment → `⋯` menu → **Redeploy**.
2. **Uncheck** "Use existing Build Cache".
3. **Redeploy**.
4. Wait for green check.

---

## Verify it works

In Stripe Dashboard:

1. Go back to your webhook endpoint.
2. Click **Send test event** (top right).
3. Pick `checkout.session.completed`.
4. Click **Send test event**.
5. Look at the **Webhook attempts** log on the same page. The most recent attempt should show status **200**.

If it shows a 4xx or 5xx, click the row and read the response body — it'll tell you what failed (most common: missing env var, wrong URL, migration not run).

---

## Full end-to-end test (10 min)

1. Open a private/incognito browser window.
2. Go to `brikk.store/login`. Sign up as a brand new test agent.
3. Confirm email, sign in.
4. Settings → **Billing** → click **Subscribe — Team — $200/mo**.
5. In Stripe Checkout, use the test card **4242 4242 4242 4242**, any future expiry, any CVC, any zip.
6. Complete checkout. You'll be redirected to `/app/settings?payment=success`.
7. Click **Team** tab. **A team should already exist** with your test user as owner, a fresh team code, status active, plan_tier "team", max_seats 5.

If the team isn't there:
- Stripe Dashboard → Developers → Webhooks → your endpoint → check the **Webhook attempts** log. The relevant event will show whether it succeeded or what error came back.
- If the webhook attempt returned 400 with "Invalid signature", the secret in Vercel doesn't match — re-copy it.
- If it returned 503 "Not configured", you forgot one of the env vars or didn't redeploy.

---

## When you go to production

Repeat Step 2–6, but in **Live mode** in Stripe Dashboard. You'll have two webhook endpoints (one for Test, one for Live) and two signing secrets. Vercel only supports one `STRIPE_WEBHOOK_SECRET` env var per environment — so for production, use the Live signing secret in Production, and the Test signing secret in Preview/Development.

To do that on Vercel:

1. Add `STRIPE_WEBHOOK_SECRET` with the **Test** value, scope to Preview + Development only.
2. Add a second `STRIPE_WEBHOOK_SECRET` with the **Live** value, scope to Production only.

---

## What the webhook actually does

In one paragraph for your future-self:

When a user finishes a Team-plan checkout, Stripe sends `checkout.session.completed` to `/api/stripe/webhook`. The handler verifies the signature, reads the user ID from `client_reference_id`, fetches the subscription detail from Stripe, identifies the plan (team vs pro vs agency) from metadata, and either creates a new team row (with a fresh team code) or updates an existing team to attach the Stripe subscription ID. The team is now "official" — visible in Settings → Team, with members able to join via the team code.

If the subscription is later cancelled or the card fails, follow-up webhooks update the team's `status` field to `cancelled` or `past_due`. Members still have access until you decide what to do — there's no automatic kick-out, by design.

---

## Roll-back plan

If anything goes wrong post-deploy:

- Delete `STRIPE_WEBHOOK_SECRET` from Vercel and redeploy. The webhook will return 503 for all incoming events. Stripe will retry for ~3 days, then mark them as failed. No data loss; you can re-enable later.
- Teams created before this change still work — the new code only adds behavior, doesn't remove any.

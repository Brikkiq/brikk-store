# Pricing migration — May 2026

Old → New:

| Plan | Old monthly | New monthly | Old setup fee | New setup fee |
|------|-------------|-------------|---------------|---------------|
| Pro  | $75         | **$69.99**  | $125          | **$0**        |
| Team | $200        | **$160**    | $125          | **$0**        |

All copy across the app + emails has been updated. The Stripe checkout code has been updated to:
1. Remove the setup-fee line item entirely
2. Read monthly Price IDs from env vars (so you can swap without a redeploy)

But Stripe Price objects themselves are immutable — you must create NEW Price objects in the Stripe Dashboard at the new prices, then set the env vars in Vercel.

---

## Step 1 — Create new Pro Price in Stripe (~2 min)

1. Stripe Dashboard → **Products** → find "Pro – Monthly" (or whatever Nathan named it)
2. Click the product → **+ Add another price**
3. Set:
   - **Amount:** `69.99 USD`
   - **Billing period:** Monthly
   - **Currency:** USD
4. Click **Save**
5. Copy the new Price ID — looks like `price_1XXXXXXXxXxXxXxXxXxXxXxX`. Save it in your notes as **STRIPE_PRICE_PRO**.

## Step 2 — Create new Team Price (~2 min)

Same flow for the Team product:
1. Products → "Team – Monthly"
2. + Add another price
3. **Amount:** `160.00 USD`, **Monthly**
4. Save → copy Price ID as **STRIPE_PRICE_TEAM**.

## Step 3 — Archive the setup fee products (~1 min)

The setup-fee line items are no longer used.

1. Products → "Pro – Setup Fee" → ⋯ menu → **Archive**. Confirm.
2. Same for "Team – Setup Fee".

(Archive, not delete — archive preserves historical invoices.)

## Step 4 — Archive the old monthly prices (~1 min)

Don't delete them — existing subscribed customers still need their old Price objects to renew. But archive them so they're not accidentally used for new sign-ups.

1. Inside "Pro – Monthly" product, the old $75 Price → ⋯ → **Archive**.
2. Inside "Team – Monthly", the old $200 Price → ⋯ → **Archive**.

This is reversible — you can unarchive any time.

## Step 5 — Add the new Price IDs as Vercel env vars (~2 min)

1. Vercel → Brikk project → Settings → Environment Variables
2. **+ Add New** — Key: `STRIPE_PRICE_PRO`, Value: `price_…` (the new Pro Price ID), Environments: Production + Preview
3. **+ Add New** — Key: `STRIPE_PRICE_TEAM`, Value: the new Team Price ID, same environments
4. Save

## Step 6 — Redeploy (~30 sec)

Vercel → Deployments → ⋯ → **Create deployment** → Production. Wait for green.

## Step 7 — Smoke test (~3 min)

1. Open `brikk.store/app/upgrade` in incognito
2. Sign up with a throwaway email, then sign in
3. Click **Subscribe to Pro**
4. Hosted Stripe checkout should show: **$69.99/month**, no setup fee
5. If you see $75 or a $125 setup line, your env vars didn't take — re-verify Step 5 and redeploy

## Step 8 — Existing customers (if any)

Active subscribers on the old prices stay on those prices automatically. Stripe doesn't migrate them. Two options:

**Option A: Leave them alone (recommended for now).** Their charge stays at $75 / $200 forever. You only notice the new pricing on net-new signups. Simplest. Most SaaS does this.

**Option B: Manually migrate everyone.** Go to each subscriber in Stripe → Update Subscription → switch the line-item price from old to new. They keep their position in the billing cycle; next renewal goes through at the new rate. Tedious but fair to existing customers.

If you're pre-launch with no real subscribers yet, this doesn't matter.

---

## Verification table

After all 8 steps:

| Check | How to verify |
|-------|---------------|
| Pro checkout shows $69.99 | Incognito → /app/upgrade → Subscribe to Pro |
| Team checkout shows $160 | Same, choose Team |
| No setup-fee line in checkout | Look at the order summary in Stripe Checkout |
| Settings billing tab matches | /app/settings → Billing tab → cards show new prices |
| Landing page matches | brikk.store/#pricing |
| Terms page matches | brikk.store/terms |
| Trial-ending email matches | Wait for one to fire, OR manually trigger via Stripe webhook tester |

If anything still shows the old prices after the env vars are set and you've redeployed, hard-refresh (Ctrl+Shift+R) and try again. If still wrong, ping me with the page that's stale.

---

## Why env-var-driven prices (vs hardcoded)

Now that you've done this once, future price changes are 4 clicks:
1. Create new Price in Stripe (Step 1)
2. Update the env var value in Vercel (Step 5)
3. Redeploy
4. Verify

No code changes needed. If you ever do a flash sale, holiday discount, or testing different price points, you can swap env vars without touching the codebase.

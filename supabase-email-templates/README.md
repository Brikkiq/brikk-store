# Brikk email templates for Supabase

Three branded HTML templates that replace Supabase's default plain-text auth emails. They match the look of the lead-confirmation email sent from `/api/refer`.

These files don't ship anywhere automatically — Supabase stores email templates in its own dashboard, not in your codebase. You paste the HTML into the Supabase dashboard once and it's saved on Supabase's side.

## How to install (5 minutes total)

For each of the three files below, do the same routine:

1. Open `supabase.com/dashboard` → your Brikk project.
2. Left sidebar → **Authentication** → **Email Templates**.
3. Click the template name listed below.
4. Set the **Subject** field exactly as listed.
5. Open the matching `.html` file from this folder, copy the **entire** contents, paste into the **Body (HTML)** field, replacing whatever's there.
6. Click **Save**.

| Template in Supabase | File to paste              | Subject line                    |
|----------------------|----------------------------|---------------------------------|
| Confirm signup       | `confirm-signup.html`      | `Confirm your Brikk account`    |
| Reset Password       | `reset-password.html`      | `Reset your Brikk password`     |
| Magic Link           | `magic-link.html`          | `Your Brikk sign-in link`       |

## How to verify it worked

1. Go to `brikk.store/login` in an incognito window.
2. Click **Sign Up**. Use a throwaway email address.
3. Check the inbox.

The email should:
- Come **from** `Brikk <noreply@brikk.store>` (not `noreply@mail.app.supabase.io`).
- Have the **subject** `Confirm your Brikk account`.
- Show a clean Brikk-branded design with a dark "Confirm my account" button.
- Link to `brikk.store/auth/callback?...` — your domain, not Supabase's.

If the From address is wrong, the SMTP setting in Supabase isn't right (Authentication → SMTP Settings).
If the body looks plain, the template wasn't saved — repeat the steps above.

## Variables Supabase substitutes inside the HTML

- `{{ .ConfirmationURL }}` — the secure link the user taps. Each template uses this for the button and the fallback URL.
- `{{ .Email }}` — the email address being verified. Shown in the body so the user knows which account.
- `{{ .Token }}` — six-digit code if you ever enable OTP. Not used in these templates.
- `{{ .SiteURL }}` — your configured Site URL (Authentication → URL Configuration). Set to `https://brikk.store`.

Leave these variables exactly as written — Supabase renders them server-side before sending.

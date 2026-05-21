# Brikk audit response — partner findings

Generated in response to the 14-item website audit. For each finding, this document records the current state of the code in the repo, what action was taken, and what your partner should verify after the next deploy.

**Important:** the audit was run against the production deploy. The repo has since been updated with fixes for nearly all items, but those fixes only become visible after Vercel rebuilds. After you push and the deploy completes, ask your partner to re-audit — most findings should disappear.

---

## High severity

### 1. Anchor links cause blank pages on direct URL load
**Status:** Strengthened in `app/page.js`. Already had a scroll-to-hash handler in `useEffect`; this commit upgrades it to use `requestAnimationFrame` (two frames deep) plus three setTimeout fallbacks (immediate, 150ms, 600ms) to survive slow font-loading and hydration timing. Direct loads of `brikk.store/#features`, `/#how`, `/#pricing` should now reliably scroll to the section.

**Verify after deploy:** open an incognito window, paste each of the three hash URLs as fresh navigation (no prior history), confirm each lands on the correct section heading.

### 2. "Features" nav link doesn't scroll when already on homepage
**Status:** Fixed in `app/page.js`. The nav now uses an explicit `onClick={(e)=>navLinkClick(e,'#features')}` handler that calls `preventDefault()`, updates the URL hash via `history.replaceState`, then manually triggers `scrollIntoView`. Combined with `scrollMarginTop: 80` on each section, the click lands at the heading correctly regardless of current scroll position.

**Verify after deploy:** scroll to the bottom of the homepage, click "Features" in the nav — page smoothly scrolls back to the "What you get today" heading.

### 3. "How It Works" nav label mismatch
**Status:** Fixed. Nav label is now "Get started" (not "How It Works"). It still targets the "Set up in 5 minutes" section, which matches the new label semantically.

**Verify after deploy:** open homepage, hover the middle nav item — tooltip and text should say "Get started", not "How It Works".

### 4. Hero email form — no empty-state validation
**Status:** Fixed in `app/page.js`. `handleSubmit` validates: empty input → error "Enter your email to start the free trial." Invalid format → "That doesn't look like a valid email." Errors render in red below the form. Clearing input or typing dismisses the error. Also: button label changed from "Get 45 Days Free" to "Get 14 Days Free" (the audit's reference to "45 Days" reflects the old trial length, which has since been changed to 14 days everywhere in the codebase).

**Verify after deploy:** click "Get 14 Days Free" with empty field — error message appears. Click again with "foo" — different error appears. Type a valid email — error clears, submission succeeds.

---

## Medium severity — liability & legal

### 5. "Terms" not a link on login/signup page
**Status:** Fixed in `app/login/page.js`. The disclosure now reads: *"By signing up you agree to Brikk's [Terms](/terms) and [Privacy Policy](/privacy)."* Both are clickable links to the actual policy pages.

**Verify after deploy:** open `/login`, click the Terms text below the sign-up button — opens the terms page.

### 6. /refer page has no privacy notice or TCPA consent
**Status:** Fixed in both `app/refer/page.js` AND `app/r/[code]/page.js`. Both lead-capture flows now include the full TCPA + privacy disclosure: *"By submitting this form, you consent to be contacted by [agent name] by phone, text message, or email about real estate services. Standard messaging rates may apply. Consent is not a condition of purchase. Reply STOP to opt out. See our [Privacy Policy](/privacy) for details on how we handle your information."*

**Verify after deploy:** visit `/r/SOMECODE` (any active referral code), confirm the disclosure block appears above or below the submit button with a clickable Privacy Policy link.

### 7. Privacy Policy uses a Gmail contact address
**Status:** Fixed. Both `app/privacy/page.js` and `app/terms/page.js` use `hello@brikk.store` exclusively. The Gmail address (`brikkiq@gmail.com`) only remains in `app/admin/page.js` as part of the OWNER_EMAILS allowlist for admin gate access — that is NOT user-facing and not advertised as a contact. Can be replaced with `hmdesrosier@gmail.com` only (already in the array) for cleanliness if desired.

**Verify after deploy:** load `/privacy` and `/terms`, search the page for `gmail` — should find zero matches.

### 8. Privacy Policy has no GDPR/CCPA mention
**Status:** Fixed in `app/privacy/page.js`. Section 9 is now titled "Regional Privacy Rights (GDPR, CCPA, and Others)" and covers EU residents' rights under GDPR, California residents' rights under CCPA, and a fallback clause for other jurisdictions. All point to `hello@brikk.store` to exercise rights.

**Verify after deploy:** load `/privacy`, scroll to section 9 — heading "Regional Privacy Rights" should appear.

---

## Low/medium severity

### 9. "Mobile App" listed as pricing feature with no app store links
**Status:** Fixed. The pricing tiers now list **"Web + mobile (PWA)"** instead of "Mobile App". This is technically accurate — Brikk is a Progressive Web App that installs on iOS and Android home screens from a browser, not from app stores. No misleading marketing.

**Verify after deploy:** load `/#pricing`, look at the Pro card's feature list — should say "Web + mobile (PWA)", not "Mobile App".

### 10. Voice feature in demo but not marketing
**Status:** Fixed. Voice-to-CRM is now prominently surfaced in three places on the marketing site:
- Features grid card titled "Voice-to-CRM"
- Pricing Pro feature list includes "Voice-to-CRM"
- LiveDemo embed has a dedicated "Voice" tab showing the multi-action modal in action

**Verify after deploy:** load homepage, scroll to "What you get today" — Voice-to-CRM card should be visible. Click the Voice tab in the LiveDemo block — shows the recording UI + parsed action cards.

### 11. No custom 404 page
**Status:** Fixed. `app/not-found.js` is a fully branded 404 with the Brikk logo, a large "404" numeral, friendly copy, two CTAs ("Back to brikk.store" and "Sign in"), and a `hello@brikk.store` support link.

**Verify after deploy:** navigate to `brikk.store/this-page-does-not-exist` — branded 404 should render.

---

## Low severity — polish

### 12. Duplicate viewport meta tags
**Status:** Fixed in `app/layout.js`. Uses Next.js 14's `export const viewport` API rather than a manual meta tag in `<head>`. Next.js renders exactly one viewport meta automatically. The previous setup had one manual tag + one auto-injected tag, hence the duplicate.

**Note on `userScalable: false`:** the partner audit didn't flag this, but worth knowing — this setting is intentional per Henry's request ("lack of zoom"). Accessibility advocates generally discourage it because users with low vision may need to pinch-zoom. Keep as-is unless you reverse the decision.

**Verify after deploy:** view-source on homepage — search for `viewport` — should find exactly ONE meta tag.

### 13. /refer page hardcoded "Nathan Mueller" default
**Status:** Fixed in `app/refer/page.js`. Now requires a valid `?agent=AGENT_ID` query parameter. If missing or invalid, shows a branded "Link missing agent" error page rather than defaulting to any agent's data. The newer `/r/[code]` route also requires a valid code or shows a similar branded error.

**Verify after deploy:** load `brikk.store/refer` (no params) — should show a "Link missing agent" page, NOT pre-fill any agent name.

### 14. No social proof / unsourced statistics
**Status:** Partially fixed. The four stat blocks ("78% of buyers pick first agent who responds" etc.) now have a sources citation line directly below them: *"Sources: NAR Profile of Home Buyers (2024); WAV Group lead-response study; Marketing Donut sales-cadence research."*

**What's NOT done:** the citations are listed as plain text, not clickable hyperlinks. Adding hyperlinks would strengthen credibility further but requires you to confirm the exact NAR / WAV Group / Marketing Donut URLs are current. Recommend doing this once before launch — pick a stable URL for each and link them.

**Verify after deploy:** scroll past the hero — sources line should appear below the four stat numbers.

---

## What's still pending (your action, not code action)

These two items from the partner audit can't be resolved with code alone:

**Item 9 — app store listings:** if you do eventually publish Brikk to the App Store / Google Play (rather than only as a PWA), update the pricing feature label and add download badges in the footer.

**Item 14 — source URLs:** decide on the canonical URLs for each statistic citation and convert the plain text to hyperlinks. Can be a 5-minute edit once you've chosen them.

---

## Deploy & re-audit instructions for the partner

1. Push the current `main` branch to GitHub if not already pushed.
2. Confirm Vercel picks up the push and builds successfully.
3. Wait for the deploy to go live (typically 30-60 seconds after push).
4. Hard refresh `brikk.store` in the browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows) to bust any cached version.
5. Re-run the audit. Items 1-13 should be fully resolved. Item 14 will be partial until source URLs are linked.

---

## Summary table

| # | Item | Code state | Action required |
|---|------|------------|-----------------|
| 1 | Blank page on hash URL | Fixed + strengthened this commit | Deploy |
| 2 | "Features" doesn't scroll | Fixed | Deploy |
| 3 | "How It Works" label mismatch | Fixed (now "Get started") | Deploy |
| 4 | Empty form validation | Fixed | Deploy |
| 5 | Terms not a link on login | Fixed | Deploy |
| 6 | /refer no TCPA/privacy disclosure | Fixed | Deploy |
| 7 | Gmail in legal pages | Fixed | Deploy |
| 8 | No GDPR/CCPA section | Fixed | Deploy |
| 9 | "Mobile App" misleading label | Fixed (now PWA) | Deploy |
| 10 | Voice not in marketing | Fixed | Deploy |
| 11 | No custom 404 | Fixed | Deploy |
| 12 | Duplicate viewport meta | Fixed | Deploy |
| 13 | /refer hardcoded agent default | Fixed | Deploy |
| 14 | Unsourced stats | Citations added (not hyperlinked) | Deploy + link URLs later |

13 fixed, ready to deploy. 1 partial — non-blocking polish.

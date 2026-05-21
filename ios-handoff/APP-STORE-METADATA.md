# Brikk — App Store Connect metadata

Paste each field below into the corresponding section in App Store Connect when submitting. All copy is pre-written and final unless Henry wants to revise.

---

## App information

**App Name:** `Brikk`
**Subtitle:** `Built to close. AI CRM for realtors.`
**Bundle ID:** `store.brikk.app`
**SKU:** `brikk-ios-001`
**Primary Language:** `English (U.S.)`
**Primary Category:** `Business`
**Secondary Category:** `Productivity`

---

## Pricing & availability

**Price:** `Free` (the app is free to download; subscription required after 14-day trial — set up as in-app subscription OR direct-to-web via Stripe, see "In-app purchase decision" below)
**Availability:** All territories
**Pre-orders:** No

### In-app purchase decision

Brikk currently charges via Stripe Checkout on the web. Apple's rules ([App Store Review Guidelines 3.1.1](https://developer.apple.com/app-store/review/guidelines/#payments)) generally require digital subscriptions consumed in-app to go through Apple In-App Purchase (and pay Apple 15-30%).

**However**, since Brikk is a B2B SaaS for real estate professionals and the purchase is made on the web before the user even installs the app, this falls under the "Reader app" exception (3.1.3(a)). Other SaaS apps in the same category (Salesforce, HubSpot, ActiveCampaign) all use this approach successfully.

**To safely use Stripe-on-web instead of IAP:**

1. Do NOT show a "Subscribe" button inside the iOS app
2. Do NOT link directly from the iOS app to the Stripe Checkout page (Apple 3.1.5 — anti-steering)
3. DO say "Manage your subscription at brikk.store/app/settings" in plain text inside the app
4. The user opens Safari themselves and subscribes

If Apple still pushes back, we have two fallbacks:
- Add Apple IAP as an additional option alongside Stripe (Apple takes their cut, but app is approved)
- Apply for the "Reader app" external link entitlement (Apple-approved exception)

**This is a known-but-manageable risk.** Many SaaS apps ship without IAP and pass review. If you've shipped a B2B SaaS app before, you've seen this dance.

---

## App description (4000 char max)

```
Brikk is the command center real estate agents actually open every morning.

One screen. Every lead. AI that acts.

While other CRMs cost $300-500/month and take weeks to learn, Brikk is $75/month and works in 5 minutes. Built for solo agents and small teams who are tired of juggling Zillow, follow-up apps, spreadsheets, and a calendar that doesn't know what's happening.

WHAT BRIKK DOES

• AI Copilot drafts personalized follow-up messages based on each lead's history. Tap approve, edit, or skip — never write another generic "just checking in" again.

• Lead Pipeline color-coded by temperature. See who's going cold, who needs a call, and who's about to ghost. One tap to log every interaction.

• Deal Tracker from contract to closing. Visual stage progression, commission tracking toward your annual goal, deadline alerts.

• Smart Calendar auto-populated from your pipeline. Follow-up reminders, closing milestones, all with AI context for every event.

• Voice-to-CRM. Tap the mic after a showing. Speak naturally. AI structures it into approved updates: status changes, notes, scheduled follow-ups.

• Conversations. Draft a message in Brikk, send it from your own phone with one tap. AI suggests replies based on the lead's history. Every exchange logged.

• Lead Capture Link. Your own brikk.store/r/YOUR-CODE link for business cards and Instagram. Submissions land in your pipeline with a live notification — you respond before competitors even know about the lead.

• Marketing ROI. See which lead sources actually produce closings, not just leads. Pie charts, conversion rates, AI insights on where to shift your budget.

• Morning Brief Email. Every morning, a personalized digest of what needs your attention — hot leads cooling off, deals closing this week, AI drafts waiting for approval, birthdays today.

PRICING

• 14-day free trial. No credit card to start.
• Pro: $75/month — solo agents
• Team: $200/month — up to 5 agents with team management
• Agency: Custom — for brokerages

Manage your subscription at brikk.store.

PRIVACY

Your leads, deals, messages, and notes are yours. We don't sell data. Full privacy policy: brikk.store/privacy.

SUPPORT

Real humans at hello@brikk.store. Reply to any Brikk email — it reaches us.

---

Brikk is built by realtors, for realtors. If you're tired of pretending Zillow's CRM is enough, give us 14 days.
```

---

## Promotional text (170 char max) — editable after launch without review

```
$75/month real estate CRM with AI follow-ups, voice-to-CRM, smart calendar, and lead capture link. 14-day trial, no credit card. Built to close.
```

---

## Keywords (100 char max, comma-separated)

```
real estate,realtor,crm,leads,follow up,buyer,seller,broker,agent,zillow,deals,pipeline,ai
```

---

## What's New (release notes, 4000 char max)

For the **initial submission**:

```
Welcome to Brikk — the command center real estate agents actually use.

This is our first release. Features included:

• AI-drafted follow-ups
• Lead pipeline with temperature tracking
• Deal tracker from contract to closing
• Voice-to-CRM dictation
• Lead capture link
• Smart calendar with AI context
• Marketing ROI analytics
• Morning brief email
• Birthday reminders

Questions, bugs, feature requests? hello@brikk.store. Real humans, fast replies.

— The Brikk team
```

---

## Support information

**Support URL:** `https://brikk.store`
**Marketing URL:** `https://brikk.store`
**Privacy Policy URL:** `https://brikk.store/privacy`
**Copyright:** `© 2026 Brikk. All rights reserved.`

---

## Age rating

Walk through the age questionnaire as follows — Brikk has no objectionable content:

- Cartoon or fantasy violence: **None**
- Realistic violence: **None**
- Profanity or crude humor: **None**
- Mature/suggestive themes: **None**
- Horror/fear themes: **None**
- Medical/treatment information: **None**
- Alcohol, tobacco, drug use: **None**
- Sexual content/nudity: **None**
- Gambling/contests: **None**
- Unrestricted web access: **No** (the WebView is restricted to brikk.store and approved subdomains)
- Gambling and contests: **No**

Resulting rating: **4+**

---

## App privacy (data collection disclosure)

This is the trickiest section. Apple wants every data type the app collects. Here's the truth for Brikk:

### Data Linked to User (used to identify the user)

- **Contact Info:** Email address, phone number, name
- **User Content:** Other user content (lead notes, messages drafted, voice transcripts)
- **Identifiers:** User ID

Purpose for all: **App Functionality**, **Personalization**, **Analytics**

### Data Not Linked to User

- **Diagnostics:** Crash data, performance data (via Vercel Analytics if enabled)

### Tracking

- **Does the app track users across other apps/websites owned by other companies?** No

### Third-party data shared

- **Supabase** (database & auth, processor) — receives all user content
- **Anthropic** (AI processing, processor) — receives lead context for draft generation, ephemeral
- **Stripe** (payment, processor) — receives payment + billing details
- **Resend** (email delivery, processor) — receives email addresses + names for transactional sends

All of these are processors operating under Brikk's instructions. None receive data for their own marketing purposes.

---

## Screenshots required

Apple requires screenshots for **at least** the 6.7" iPhone (1290x2796) — Pro Max sizes. Optional but recommended: 6.1" iPhone (iPhone 15 / 15 Pro) at 1179x2556.

**Screenshots to capture** (Henry will provide, or you capture from the live app on a real iPhone):

1. **Today dashboard** — showing the green "1 new lead" pill, action cards, KPI tiles
2. **AI Copilot** — draft cards with "Send via Messages" buttons
3. **Leads pipeline** — list with YOUR TURN badges and temperature chips
4. **Voice-to-CRM** — recording modal with 3 parsed action cards
5. **Deal tracker** — pipeline view with progress bars

Each screenshot can have caption text overlaid (1-2 sentences). Examples:
1. "Every morning, see exactly what needs your attention"
2. "AI drafts every follow-up. You approve, edit, or skip."
3. "Color-coded pipeline. Know who's going cold."
4. "Speak naturally. AI structures it into approved updates."
5. "Track every deal from contract to closing."

---

## App Review Information (for Apple's reviewer)

**Sign-in required:** Yes — Apple needs a test account to review.

**Demo account credentials:**

- Email: `apple-reviewer@brikk.store` (Henry: create this account on production, give it 25+ sample leads + a couple deals so the reviewer sees a functioning app)
- Password: provide a temporary password and note it should be rotated after submission

**Contact information for reviewer questions:**
- First name: Henry
- Last name: Desrosier
- Phone: (Henry's number)
- Email: hello@brikk.store

**Notes for reviewer:**

```
Hi Apple,

Brikk is a B2B SaaS CRM for real estate agents. The app loads our production web app at https://brikk.store inside a Capacitor native shell.

Native capabilities provided by the app:
- Haptic feedback on action confirmations
- Native splash screen and status bar styling
- Microphone access for voice-to-CRM dictation
- Push notifications for new leads (scaffold in place; will be activated post-launch)
- Status bar style management for proper light/dark mode handling

Demo account credentials are above. Once signed in, the user lands on the Today dashboard. Voice-to-CRM is accessed via the floating microphone button (bottom right of any in-app page). Pricing is managed via brikk.store in the user's preferred web browser — this app does not transact in-app per our reading of the Reader app guidelines (3.1.3(a)).

If anything is unclear, reach me at hello@brikk.store and I'll respond same-day.

Thanks for reviewing.
— Henry, Brikk
```

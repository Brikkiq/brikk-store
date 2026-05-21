# Brikk iOS app — freelancer handoff

This is a fully prepared Capacitor-based iOS wrapper for the Brikk web app at `https://brikk.store`. Everything you need to compile and submit to the App Store is already in place. Your job is to do the macOS-side work: generate the iOS project, configure signing under the owner's Apple Developer account, build the IPA, and submit via App Store Connect.

**Time estimate to first submission:** 3-5 hours of focused work, assuming no Apple-side surprises.

---

## Architecture decision (read first)

Brikk's iOS app uses Capacitor's **server URL mode**, not bundled-build mode. The native shell loads `https://brikk.store` over the network. This was a deliberate choice — please don't change it without discussing first.

**Why server URL:**
- Every Vercel deploy is instantly live in the app (no resubmission required for content/feature updates)
- Server-side API routes (Stripe, Anthropic, Supabase webhooks) work normally
- Supabase real-time subscriptions function out of the box
- Authentication via Supabase Auth shares cookies naturally
- Updates ship at web speed, not App Store review speed

**Risk:**
- Apple may scrutinize this approach under guideline 4.2 ("apps must be more than a minimum amount of substance"). To mitigate, the app provides several native capabilities via Capacitor plugins: haptic feedback on action confirmations, splash screen, native status bar, push notification scaffolding, and the keyboard plugin for input handling. Reference these in your submission notes if asked. See "If Apple rejects under 4.2" below.

---

## Repo layout

```
brikk-store/
├── capacitor.config.ts          # Capacitor configuration (server URL, plugins)
├── package.json                 # Has all Capacitor deps under devDependencies
├── public/
│   ├── native-bridge.js         # JS-side Capacitor integration (haptics, push, etc.)
│   ├── manifest.json            # PWA manifest (also used as Capacitor fallback)
│   ├── icon-180.png             # Apple touch icon (already correct size)
│   ├── icon-192.png             # PWA icon
│   ├── icon-512.png             # PWA + maskable icon
│   └── favicon.svg              # Vector logo
├── ios-handoff/
│   ├── README.md                # This file
│   ├── APP-STORE-METADATA.md    # Description, keywords, etc. to paste into Connect
│   ├── APPLE-DEV-ACCESS.md      # How Henry adds you to his developer team
│   ├── PRIVACY-PERMISSIONS.md   # Info.plist usage strings (microphone, etc.)
│   └── assets/
│       ├── icon-1024.png        # App Store icon (1024x1024)
│       └── splash-source.png    # 2732x2732 splash source — use cap-assets to generate sizes
└── (rest of the Next.js app — you don't need to touch any of it)
```

---

## Step-by-step build process

### 1. Clone and install (5 min)

```bash
git clone <repo-url>
cd brikk-store
npm install
```

This pulls in Capacitor CLI + iOS platform deps under devDependencies.

### 2. Generate the iOS project (2 min)

```bash
npx cap add ios
```

This creates an `ios/` folder containing the Xcode project. **Do not commit this folder by default** — it's regeneratable. If you do commit it, add it to a separate branch or document why.

### 3. Sync the Capacitor config + web assets (1 min)

```bash
npx cap sync ios
```

Run this any time `capacitor.config.ts` or `public/` changes.

### 4. Open in Xcode (1 min)

```bash
npx cap open ios
```

Opens `ios/App/App.xcworkspace` in Xcode.

### 5. Configure signing (10 min)

1. In Xcode, click the **App** project in the left sidebar
2. Select the **App** target
3. Go to **Signing & Capabilities**
4. **Team:** select Henry's Apple Developer account (he'll add you as a Developer role — see `APPLE-DEV-ACCESS.md`)
5. **Bundle Identifier:** confirm it's `store.brikk.app`
6. Set **Provisioning Profile** to "Automatically manage signing" — Xcode generates everything else

### 6. Add Info.plist permission strings (5 min)

Open `ios/App/App/Info.plist` and add the keys from `ios-handoff/PRIVACY-PERMISSIONS.md`. Without these, calls to microphone (for voice-to-CRM) and push notifications will crash.

### 7. Replace app icons (10 min)

Use Capacitor's icon generator. Source icon is `ios-handoff/assets/icon-1024.png` (already provided, 1024x1024):

```bash
npm install --save-dev @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor "#1A1A18"
```

This regenerates all required iOS icon sizes from the 1024 source and drops them into `ios/App/App/Assets.xcassets/AppIcon.appiconset/`.

### 8. (Optional) Add splash screen (5 min)

Same `@capacitor/assets` tool also generates splash screens from `ios-handoff/assets/splash-source.png`. The image is dark `#1A1A18` background with the Brikk wordmark centered.

### 9. Test on simulator (15 min)

In Xcode: select an iPhone simulator (15 Pro recommended) from the device dropdown → press the play button. The app should launch, show the splash for ~1.2s, then load brikk.store.

Verify:
- Login page renders correctly
- Email field shows keyboard when tapped (regression test for our 16px font fix)
- Status bar is dark text on light background
- Pinch-to-zoom works on marketing site (accessibility)
- Tapping "Sign in" actually signs in (Supabase Auth via web)
- Tapping the floating voice button asks for microphone permission

### 10. Test on physical device (10 min)

Connect Henry's iPhone or your test device → trust the cert → run from Xcode. Verify:
- Haptic feedback works on button taps
- Apple Pay shows in the Stripe Checkout flow (open `/app/upgrade` and try subscribing — Apple Pay button should appear on iOS Safari WebView)
- Push notification permission can be requested without crashing

### 11. Archive + upload (15 min)

In Xcode: Product menu → Archive → wait for build → Distribute App → App Store Connect → Upload. Choose "Automatically manage signing." Xcode handles the rest.

### 12. App Store Connect submission (30 min)

1. Go to https://appstoreconnect.apple.com
2. My Apps → + → New App
3. Bundle ID: `store.brikk.app`
4. SKU: `brikk-ios-001` (arbitrary, just unique within your account)
5. Paste in metadata from `ios-handoff/APP-STORE-METADATA.md`
6. Upload screenshots (Henry will provide — capture from the live site at iPhone 15 Pro dimensions: 1290x2796)
7. Upload the build that was just archived (it'll appear in the "Build" section after Apple processes it, usually 10-30 minutes)
8. Submit for review

### 13. Apple review (3-4 business days)

Apple reviews. You may get questions; respond promptly. If approved, the app goes live.

---

## If Apple rejects under 4.2 (web wrapper)

This is the most likely rejection reason. Apple's response template usually says: "Your app provides limited value beyond what users can access in Safari."

**Response strategy (in order):**

1. **Reply via Resolution Center first.** Explain the native capabilities the app provides that aren't available in Safari:
   - Haptic feedback on action approvals
   - Native push notifications for new leads + birthdays + trial-end reminders
   - Home-screen install with launch screen branding
   - Microphone access for voice-to-CRM dictation
   - Status bar style customization
   - Background fetch for real-time updates (if we add this)

2. **If still rejected**, add a small but visible native-only feature:
   - Native share sheet for sharing the agent's `/r/CODE` referral link (Capacitor's Share plugin)
   - Native camera capture for lead profile photos (Capacitor's Camera plugin)
   - Both are 30-minute additions that demonstrate native API use

3. **Last resort:** convert to bundled-build mode (next export + static webview). This is significantly more work and degrades the live-update benefit, so don't go here unless Apple gives no other path.

Henry will compensate you for additional rounds beyond the initial submission as discussed in the original quote.

---

## Live updates after launch

Because the app uses server URL mode, **every Vercel deploy is automatically reflected in the live iOS app on next open.** No re-submission needed for content, copy, feature changes, or bug fixes. The only times you need to do another Xcode build + App Store submission are:

- Native plugin changes (adding push, camera, etc.)
- Splash/icon updates
- Info.plist permission additions
- Capacitor version upgrades
- Bundle ID or app name changes

For everything else: Henry pushes to GitHub → Vercel deploys → app updates on next open.

---

## Handoff checklist

Confirm Henry has shared with you:

- [ ] GitHub repo access (read-only is fine for initial review; write only if you want to commit the `ios/` folder)
- [ ] Apple Developer team invitation (Developer role)
- [ ] App Store Connect access — Henry will add you under Users & Access with App Manager role
- [ ] App icon (1024x1024) — already in `ios-handoff/assets/icon-1024.png`
- [ ] App Store screenshots (Henry provides — 6.7" iPhone size 1290x2796, 3-5 screens)
- [ ] Privacy policy URL: `https://brikk.store/privacy`
- [ ] Terms of service URL: `https://brikk.store/terms`
- [ ] Support URL: `https://brikk.store/contact` (or use `mailto:hello@brikk.store`)

---

## Questions Henry may ask after submission

- **"How long until users see updates?"** — Code changes: instant on next app open (server URL mode). Native changes (plugins, icons, splash): ~24 hours via App Store review for minor things, 3-5 days for first submission.
- **"What if I need to push an emergency fix?"** — For web bugs: push to GitHub, deploys in 60s, fix is live everywhere instantly. For native bugs: 24h expedited review available from Apple for critical issues.
- **"How do I get more users to install the iOS app vs the web?"** — Add an "Open in Brikk app" banner on brikk.store for iOS Safari visitors. Smart App Banners. Smart link redirects.
- **"Can I add Android later?"** — Yes, run `npx cap add android` in the same repo. Same wrapper approach, ships to Google Play.

---

## Tech contact

For questions about the codebase itself (Next.js side, API routes, Supabase schema), Henry can answer or refer to the docs in repo root: `LAUNCH-DAY.md`, `STRIPE-PRODUCTION-SETUP.md`, `AUDIT-RESPONSE.md`.

For Capacitor questions: official docs at https://capacitorjs.com/docs/ios — the project uses Capacitor 6.x.

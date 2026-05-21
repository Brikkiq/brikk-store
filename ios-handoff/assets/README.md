# iOS handoff assets

These are the brand assets needed for the iOS app submission.

## `icon-1024.png`

The required App Store icon at 1024×1024px. Dark square with the two-brick mark in cream.

**To use:** install `@capacitor/assets` and run the generator:
```bash
npm install --save-dev @capacitor/assets
npx capacitor-assets generate \
  --iconPath ios-handoff/assets/icon-1024.png \
  --iconBackgroundColor "#1A1A18"
```

This produces every required iOS icon size (20pt @1x/@2x/@3x, 29pt, 40pt, 60pt, 76pt, 83.5pt) into the Xcode AppIcon catalog at `ios/App/App/Assets.xcassets/AppIcon.appiconset/`.

## `splash-source.png`

The 2732×2732px source for the iOS launch screen. Dark background `#1A1A18` with the centered brick mark.

**To use:** same `@capacitor/assets` command also handles splash:
```bash
npx capacitor-assets generate \
  --splashPath ios-handoff/assets/splash-source.png \
  --splashBackgroundColor "#1A1A18"
```

This produces both light-mode and dark-mode splash assets sized for all iOS device classes.

Or combine in one command:
```bash
npx capacitor-assets generate \
  --iconPath ios-handoff/assets/icon-1024.png \
  --splashPath ios-handoff/assets/splash-source.png \
  --iconBackgroundColor "#1A1A18" \
  --splashBackgroundColor "#1A1A18"
```

## App Store screenshots

You'll need to capture these from a real iPhone running the deployed Brikk app:

- 6.7" display (iPhone 15 Pro Max, 14 Pro Max, etc.): **1290×2796** — required
- 6.1" display (iPhone 15, 15 Pro): **1179×2556** — recommended

Screens to capture (5 total):
1. Today dashboard with action cards visible
2. AI Copilot with 2 draft cards
3. Leads pipeline with YOUR TURN badges
4. Voice-to-CRM modal mid-recording
5. Deal tracker with progress bars

If Henry hasn't sent these yet, capture from a TestFlight build or the live web at `brikk.store/app/*` using the iPhone Simulator (Window → Save Screenshot in Simulator). Crop to remove the status bar.

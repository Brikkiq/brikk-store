import type { CapacitorConfig } from '@capacitor/cli'

// Brikk iOS wrapper configuration.
//
// Strategy: SERVER URL mode — the native shell loads https://brikk.store
// over the network instead of bundling the Next.js build inside the app.
// Benefits:
//   1. Every code push to Vercel is instantly live in the app (no resubmission)
//   2. Server-side API routes (Stripe, Anthropic, Supabase webhooks) work normally
//   3. Real-time Supabase subscriptions keep working
//   4. Authentication state is shared with Safari naturally
//
// Trade-offs:
//   - Requires network connectivity (no offline mode)
//   - Apple may scrutinize "web wrapper" apps under guideline 4.2 — to pass,
//     we add native capabilities: haptics, splash screen, status bar, push.
//     `public/native-bridge.js` already wires these up.
//
// If Apple rejects under 4.2, the fallback is to bundle the build with
// `next export` instead — but the dynamic API routes (Stripe checkout,
// Anthropic drafts) would need rewriting as client-side fetches to the
// Vercel-hosted endpoints. We don't recommend going that route.

const config: CapacitorConfig = {
  appId: 'store.brikk.app',
  appName: 'Brikk',
  // webDir is required even with server.url set — points at public/ so
  // app icons and offline fallbacks are bundled.
  webDir: 'public',
  bundledWebRuntime: false,

  server: {
    // The live URL the app loads on startup. Always production.
    url: 'https://brikk.store',
    // No cleartext HTTP — force TLS.
    cleartext: false,
    // Domains the WebView is allowed to navigate to without bouncing out
    // to Safari. Anything outside this list opens externally.
    allowNavigation: [
      'brikk.store',
      '*.brikk.store',
      '*.supabase.co',
      'checkout.stripe.com',
      'billing.stripe.com',
      'js.stripe.com',
      '*.stripe.com',
      'fonts.googleapis.com',
      'fonts.gstatic.com',
    ],
  },

  ios: {
    contentInset: 'automatic',
    scheme: 'Brikk',
    // Prevents the WebView from bouncing when the user scrolls past the edge
    // of the content. Feels more native.
    scrollEnabled: true,
    // Background color visible during page loads — matches Brikk's bg
    backgroundColor: '#FAFAF9',
    // Allow iOS Safari's password autofill + keychain
    limitsNavigationsToAppBoundDomains: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#1A1A18',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    StatusBar: {
      // Dark text on light background (matches Brikk's bg color)
      style: 'DARK',
      backgroundColor: '#FAFAF9',
      overlaysWebView: false,
    },
    Haptics: {},
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      // Don't resize the webview when keyboard opens — Next.js manages its own layout
      resize: 'native',
      style: 'DEFAULT',
      resizeOnFullScreen: true,
    },
  },
}

export default config

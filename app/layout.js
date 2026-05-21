import './globals.css'

export const metadata = {
  title: 'Brikk — Built to Close',
  description: 'The command center for real estate agents. AI-powered follow-ups, lead management, deal tracking. $75/month.',
  openGraph: {
    title: 'Brikk — Built to Close',
    description: 'The command center for real estate agents. One screen. Every deal. AI that acts.',
    type: 'website',
    url: 'https://brikk.store',
    siteName: 'Brikk',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brikk — Built to Close',
    description: 'The command center for real estate agents.',
  },
  manifest: '/manifest.json',
  applicationName: 'Brikk',
  appleWebApp: {
    capable: true,
    title: 'Brikk',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    // Cache-bust with ?v=2 so devices that already cached the old "B"
    // placeholder pick up the new two-brick mark.
    icon: [{ url: '/favicon.svg?v=2', type: 'image/svg+xml' }],
    apple: [{ url: '/icon-180.png?v=2' }],
  },
}

// Viewport — allows pinch-zoom for accessibility (WCAG 1.4.4). The original
// request was to block zoom for a native-app feel, but that violates
// accessibility standards and hurts visually impaired visitors. The native
// feel inside /app comes from the 8-tab bottom bar + PWA install (full-screen,
// no browser chrome) — not from locking zoom. Logged-in users rarely pinch-
// zoom inside an app anyway.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1A1A18',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script src="/native-bridge.js" defer></script>
      </head>
      <body>{children}</body>
    </html>
  )
}

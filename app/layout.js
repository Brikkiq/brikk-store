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
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon-180.png' }],
  },
}

// Use Next.js 14's viewport export so we don't ship two <meta name="viewport">
// tags. The previous setup had one tag here and one auto-injected by Next.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
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

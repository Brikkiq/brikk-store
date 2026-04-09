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
  themeColor: '#1A1A18',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Brikk" />
        <link rel="apple-touch-icon" href="/icon-180.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}

// Custom 404 — replaces Next.js's plain "This page could not be found" with a
// branded Brikk landing that gives users somewhere to go.

import { Logo } from '@/lib/Logo'

const c = {
  bg: '#FAFAF9', text: '#1A1A18', sub: '#6B6B66', dim: '#9C9C96',
  border: '#E8E8E4', white: '#FFFFFF',
}

export default function NotFound() {
  return (
    <div style={{
      background: c.bg,
      minHeight: '100vh',
      fontFamily: "'Instrument Sans',-apple-system,BlinkMacSystemFont,sans-serif",
      color: c.text,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <Logo size={22} />

        <div style={{
          fontSize: 72,
          fontWeight: 700,
          letterSpacing: '-0.04em',
          color: c.text,
          marginTop: 40,
          lineHeight: 1,
        }}>404</div>

        <h1 style={{
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: '-0.015em',
          margin: '12px 0 8px',
          color: c.text,
        }}>This page doesn't exist</h1>

        <p style={{
          fontSize: 14,
          color: c.sub,
          lineHeight: 1.65,
          margin: '0 0 28px',
        }}>
          The link you followed might be broken, or the page may have moved. Try heading back to brikk.store, or sign in to continue working.
        </p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/" style={{
            display: 'inline-block',
            background: c.text,
            color: c.white,
            textDecoration: 'none',
            padding: '10px 20px',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
          }}>Back to brikk.store</a>
          <a href="/login" style={{
            display: 'inline-block',
            background: c.white,
            color: c.text,
            textDecoration: 'none',
            border: `1px solid ${c.border}`,
            padding: '10px 20px',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
          }}>Sign in</a>
        </div>

        <p style={{
          fontSize: 12,
          color: c.dim,
          marginTop: 28,
        }}>
          Need help? Email <a href="mailto:hello@brikk.store" style={{ color: c.dim, textDecoration: 'underline' }}>hello@brikk.store</a>.
        </p>
      </div>
    </div>
  )
}

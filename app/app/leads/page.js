'use client'
// Leads — the future lead store. Still in development: no purchasing yet.
import { c, type, card, chipFor } from '@/lib/design'
import { PageHeader } from '@/lib/ui'

export default function LeadsPage() {
  return (
    <div>
      <PageHeader title="Leads" subtitle="Buy fresh life insurance leads right inside the app." />
      <div style={{ ...card, padding: '32px 24px', textAlign: 'center' }}>
        <span style={chipFor('info')}>Still in development</span>
        <h2 style={{ ...type.pageTitle, fontSize: 19, margin: '14px 0 8px' }}>The lead store is coming soon</h2>
        <p style={{ ...type.bodySub, maxWidth: 440, margin: '0 auto' }}>
          You’ll be able to browse and buy leads here, and they’ll drop straight into your Book with follow-ups ready to go.
          Nothing to do yet — we’ll let you know when it opens.
        </p>
        <div style={{ ...type.meta, marginTop: 18, color: c.dim }}>
          In the meantime, add the people you’re working with to your <a href="/app/book" style={{ color: c.text }}>Book</a>.
        </div>
      </div>
    </div>
  )
}

'use client'

import { Logo } from '@/lib/Logo'

const c = {
  bg:"#FAFAF9", white:"#FFFFFF", border:"#E8E8E4", borderLight:"#F0F0EC",
  text:"#1A1A18", sub:"#6B6B66", dim:"#9C9C96",
  green:"#16803C", greenSoft:"rgba(22,128,60,0.06)", greenBorder:"rgba(22,128,60,0.15)",
  amber:"#A16207", amberSoft:"rgba(161,98,7,0.06)", amberBorder:"rgba(161,98,7,0.15)",
  indigo:"#4338CA", indigoSoft:"rgba(67,56,202,0.05)", indigoBorder:"rgba(67,56,202,0.12)",
  dim2:"rgba(26,26,24,0.04)",
}

// Brikk public roadmap.
// Update this file as items move between sections — and add new items based on
// customer feedback. Public roadmap = strong trust signal that the product is
// actively developed.

// Only list something as shipped when its UI actually exists.
const SHIPPED = [
  { title: 'Household Book', detail: 'Policyholder, spouse and kids in one record, each with their own birthday.' },
  { title: 'Policy basics', detail: 'Carrier, product, face amount, premium, application / effective / first draft dates and beneficiary names. No health info.' },
  { title: 'Automatic follow-up schedule', detail: 'Thank-you, pre-draft, payment check, 30/60/90-day and 6-month follow-ups generated from each policy’s dates.' },
  { title: 'Annual reviews', detail: 'A review reminder on every policy anniversary, every year.' },
  { title: 'Family birthday reminders', detail: 'For every member of every household.' },
  { title: 'Today dashboard', detail: 'Overdue, today and this week — with one-tap texts from your own phone and a “Did you send it?” check.' },
  { title: 'Client timeline', detail: 'Everything done and coming up for a household, in one list.' },
  { title: 'Editable schedule', detail: 'Change timing and wording of every step, add your own, or switch steps off.' },
  { title: 'Lead capture link', detail: 'Share a link; submissions land in your Book as prospects.' },
  { title: 'Morning email', detail: 'A daily email listing who to contact today.' },
]

const IN_PROGRESS = [
  { title: 'iPhone and Android apps', detail: 'Native apps built on the same backend as the web app.', eta: 'Next' },
  { title: 'Lead store', detail: 'Buy life insurance leads inside Brikk; they drop into your Book with follow-ups ready.', eta: 'Next' },
]

const PLANNED = [
  { title: 'Push notifications', detail: 'A morning nudge with how many people to contact today.' },
  { title: 'CSV import', detail: 'Bring your existing book in from a spreadsheet.' },
  { title: 'Upcoming 30 days view', detail: 'A look-ahead list of every follow-up and birthday in the next month.' },
  { title: 'Calendar sync', detail: 'Follow-ups and birthdays in Google or Outlook Calendar.' },
]

const REQUESTED = [
  { title: 'Carrier commission tracking', detail: 'Track advances and chargeback windows per policy.' },
  { title: 'Team / agency view', detail: 'Agency owners see follow-up activity across their agents.' },
]

const Section = ({ label, color, bg, border, items, showEta }) => (
  <section style={{ marginBottom: 48 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: bg, border: `1px solid ${border}`,
        padding: '4px 12px', borderRadius: 20,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
        <span style={{ fontSize: 11, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <span style={{ fontSize: 12, color: c.dim }}>{items.length} item{items.length === 1 ? '' : 's'}</span>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
      {items.map((item, i) => (
        <div key={i} style={{
          background: c.white,
          border: `1px solid ${c.border}`,
          borderRadius: 8,
          padding: '16px 18px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{item.title}</div>
            {showEta && item.eta && (
              <span style={{
                fontSize: 10, fontWeight: 600, color,
                background: bg, padding: '2px 8px', borderRadius: 4,
                whiteSpace: 'nowrap',
              }}>{item.eta}</span>
            )}
          </div>
          <div style={{ fontSize: 12.5, color: c.sub, lineHeight: 1.55 }}>{item.detail}</div>
        </div>
      ))}
    </div>
  </section>
)

export default function RoadmapPage() {
  return (
    <div style={{
      background: c.bg, minHeight: '100vh', color: c.text,
      fontFamily: "'Instrument Sans',-apple-system,BlinkMacSystemFont,sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', maxWidth: 1120, margin: '0 auto', borderBottom: `1px solid ${c.borderLight}` }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <Logo size={18} />
        </a>
        <div style={{ display: 'flex', gap: 18 }}>
          <a href="/" style={{ fontSize: 13, color: c.sub }}>Home</a>
          <a href="/login" style={{ fontSize: 13, fontWeight: 600, color: c.bg, background: c.text, padding: '8px 18px', borderRadius: 6, textDecoration: 'none' }}>Start free</a>
        </div>
      </nav>

      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '48px 20px 80px' }}>
        <header style={{ textAlign: 'center', marginBottom: 48, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 16px', lineHeight: 1.1 }}>
            Public roadmap
          </h1>
          <p style={{ fontSize: 16, color: c.sub, lineHeight: 1.7, margin: '0 0 8px' }}>
            What's shipped, what we're building, what's planned, and what agents are asking for. Updated weekly.
          </p>
          <p style={{ fontSize: 13, color: c.dim, lineHeight: 1.6, margin: 0 }}>
            Have a feature request? Email <a href="mailto:hello@brikk.store" style={{ color: c.sub, textDecoration: 'underline' }}>hello@brikk.store</a> or reply to any Brikk email — every request gets read.
          </p>
        </header>

        <Section
          label="Shipped"
          color={c.green}
          bg={c.greenSoft}
          border={c.greenBorder}
          items={SHIPPED}
          showEta={false}
        />

        <Section
          label="In progress"
          color={c.indigo}
          bg={c.indigoSoft}
          border={c.indigoBorder}
          items={IN_PROGRESS}
          showEta={true}
        />

        <Section
          label="Planned"
          color={c.amber}
          bg={c.amberSoft}
          border={c.amberBorder}
          items={PLANNED}
          showEta={false}
        />

        <Section
          label="Requested by agents"
          color={c.dim}
          bg={c.dim2}
          border={c.borderLight}
          items={REQUESTED}
          showEta={false}
        />

        <footer style={{ marginTop: 60, padding: '24px 20px', borderTop: `1px solid ${c.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: c.sub, marginBottom: 8 }}>
            Want something built? Tell us.
          </div>
          <a href="mailto:hello@brikk.store?subject=Brikk%20feature%20request" style={{
            display: 'inline-block',
            background: c.text, color: c.white,
            padding: '10px 22px', borderRadius: 6,
            textDecoration: 'none',
            fontSize: 14, fontWeight: 600,
          }}>
            Request a feature
          </a>
        </footer>
      </main>
    </div>
  )
}

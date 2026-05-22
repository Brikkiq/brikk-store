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

const SHIPPED = [
  { title: 'AI Copilot drafts', detail: 'Claude-powered follow-up message generation with context per lead.' },
  { title: 'Voice-to-CRM', detail: 'Tap mic, talk naturally — AI parses voice notes into structured updates.' },
  { title: 'Lead pipeline', detail: 'Temperature tracking, custom fields, source attribution.' },
  { title: 'Deal tracker', detail: 'Contract to closing with progress stages and commission tracking.' },
  { title: 'Smart calendar', detail: 'Auto-populated from leads and deals with AI context per event.' },
  { title: 'Lead capture link', detail: 'Personal /r/CODE URL for business cards and Instagram.' },
  { title: 'CSV lead import', detail: 'Upload CSV from Zillow, Realtor.com, or any spreadsheet. AI guesses column mapping.' },
  { title: 'Marketing ROI', detail: 'Which sources actually produce closings, with AI insight callouts.' },
  { title: 'Morning brief email', detail: 'Personalized daily digest of what needs attention today.' },
  { title: 'Birthday reminders', detail: 'High-touch low-effort relationship moments surfaced automatically.' },
  { title: 'Home anniversary reminders', detail: 'Closing-anniversary action cards for closed clients — relationship glue most CRMs ignore.' },
  { title: 'Cold deal detection', detail: 'Proactive alerts when a deal stalls or passes its expected close date.' },
  { title: 'Deal risk scoring', detail: 'Heuristic flags for deals at higher risk of falling apart.' },
  { title: 'Sentiment analysis', detail: 'AI tags inbound messages as warm / cool / frustrated so you know who\'s cooling off.' },
  { title: 'Best-time-to-contact', detail: 'AI suggests when each lead is most likely to reply based on their message history.' },
  { title: 'Lead-to-deal linking', detail: 'Auto-sync deal client info when the underlying lead is updated.' },
  { title: 'Client deal tracker', detail: 'Public link your buyer/seller can check anytime — eliminates "where are we?" calls.' },
  { title: 'Referral ledger', detail: 'Track every referral given and received with commission outcomes.' },
  { title: 'Commission goal pacing', detail: 'Set annual target. See "X leads needed at your conversion rate" to hit it.' },
  { title: 'Missed-call auto-text', detail: 'One-tap "just missed you, calling back" follow-up from any lead detail.' },
  { title: 'Google Calendar sync', detail: 'Two-way sync of birthdays, anniversaries, follow-ups, and deal milestones.' },
  { title: 'Customer Portal', detail: 'Self-serve subscription management — update card, cancel, view invoices.' },
  { title: 'Stripe Checkout + Apple Pay', detail: '14-day trial, Apple Pay / Google Pay / Link / Cards.' },
]

const IN_PROGRESS = [
  { title: 'iOS native app', detail: 'App Store submission via Capacitor wrapper. Same web codebase, native shell.', eta: 'Q2 2026' },
  { title: 'Android native app', detail: 'Google Play submission to follow iOS launch.', eta: 'Q2 2026' },
  { title: 'Listing prep checklist UI', detail: 'Auto-generated tasks for each seller deal (photos, staging, MLS input, disclosures).', eta: 'This week' },
  { title: 'Offer comparison sheet', detail: 'Multi-offer entry + visual comparison + AI commentary for sellers.', eta: 'This week' },
]

const PLANNED = [
  { title: 'Two-way Google Calendar sync', detail: 'Brikk events show up in your Google Calendar and vice versa. OAuth + background sync.' },
  { title: 'Two-way Outlook Calendar sync', detail: 'Same as Google sync but for Microsoft 365 / Outlook users.' },
  { title: 'Email-forwarding lead import', detail: 'Forward your Zillow / Realtor.com lead emails to a Brikk inbox. AI parses + auto-creates leads.' },
  { title: 'Buying intent signals', detail: 'Detect when a lead reopens a listing link, asks a price question, or shows urgency — alert agent in real time.' },
  { title: 'Listings module', detail: 'First-class Property entity with multi-buyer tracking, showing schedule, and offer tracking per listing.' },
  { title: 'Team chat', detail: 'Internal messaging between team members — share leads, deals, notes without leaving Brikk.' },
  { title: 'Push notifications (iOS + Android)', detail: 'Real-time alerts for new leads, replies, hot signals — even when the app is closed.' },
  { title: 'Document storage per lead', detail: 'Attach contracts, pre-approvals, inspection reports to a lead or deal.' },
  { title: 'Commission goal tracker', detail: 'Set annual goal, track progress, see what closing rate you need to hit it.' },
]

const REQUESTED = [
  { title: 'Zillow Tech Connect integration', detail: 'Direct API connection to Zillow leads — requires partner program approval. Watching status.' },
  { title: 'MLS direct integration', detail: 'IDX / RETS feeds for live listing data inside Brikk. Requires per-MLS membership and credentials.' },
  { title: 'DocuSign / Dotloop integration', detail: 'Send and track e-signatures directly from a deal page.' },
  { title: 'AI cold-call coaching', detail: 'Record a call, AI gives feedback on objection handling and next-step suggestions.' },
  { title: 'Brokerage-level analytics', detail: 'For Agency plan: aggregate stats across all team members, leaderboard, conversion rates.' },
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

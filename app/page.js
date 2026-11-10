'use client'
// Public launch page — Brikk for life insurance agents.
// Styling comes only from lib/design.js tokens (no raw hex codes).
import { useEffect, useRef, useState } from 'react'
import { c, type, card, btn, shadow, chipFor } from '@/lib/design'
import { Logo } from '@/lib/Logo'
import { DEFAULT_TEMPLATES, describeTiming } from '@/lib/core/schedule'

const SIGNUP = '/login?mode=signup'

// Fades children in on scroll; respects prefers-reduced-motion.
function Reveal({ children, delay = 0, style = {} }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setShown(true); return }
    const ob = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { setShown(true); ob.disconnect() } })
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
    ob.observe(el)
    return () => ob.disconnect()
  }, [])
  return (
    <div ref={ref} style={{
      ...style,
      opacity: shown ? 1 : 0,
      transform: shown ? 'none' : 'translateY(14px)',
      transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>{children}</div>
  )
}

const FEATURES = [
  { t: 'Whole households, not just names', d: 'Policyholder, spouse and kids in one place — each with their own birthday, so nobody in the family gets forgotten.' },
  { t: 'Follow-ups that schedule themselves', d: 'Enter the application, effective and first draft dates. Thank-you, draft-day, payment check, 30/60/90-day and 6-month check-ins appear on the right days.' },
  { t: 'Annual reviews, every year', d: 'A review reminder on each policy anniversary — the easiest way to write the next policy and get referrals.' },
  { t: 'One tap to text, from your number', d: 'Every reminder comes with the text already written. Tap once and it opens in your phone’s Messages app. Clients see your number, not a robot’s.' },
  { t: 'A timeline for every client', d: 'Everything you’ve done and everything coming up for a household, top to bottom. Open a client and you know exactly where things stand.' },
  { t: 'No health information. Ever.', d: 'Brikk stores policy basics only — carrier, product, face amount, premium and dates. No medical questions, no underwriting notes.' },
]

const FAQ = [
  ['How much does it cost?', '$7.99 a week after a 7-day free trial. One plan with everything in it. Cancel anytime from Settings.'],
  ['Does Brikk send texts for me?', 'No — and that’s on purpose. Brikk writes the text and opens it in your own Messages app. You hit send from your own number, so there are no texting services, no extra fees, and clients reply straight to you.'],
  ['Can I change the follow-up schedule?', 'Yes. Edit the timing and the wording of every step in Settings → Follow-up schedule, add your own steps, or turn steps off. You can also change any single follow-up on a client’s timeline.'],
  ['What if a policy was written months ago?', 'Add it with the real dates. Steps that are long past are marked skipped so your Today list isn’t flooded, and the annual review rolls forward to the next anniversary.'],
  ['Do you store health or medical information?', 'No. There are no health fields anywhere in Brikk, and notes remind you not to type any in.'],
  ['Is there a phone app?', 'Brikk works in your phone’s browser today — add it to your home screen for a full-screen app. Native iPhone and Android apps are on the way.'],
]

export default function Landing() {
  const [open, setOpen] = useState(0)

  return (
    <div style={{ background: c.bg, color: c.text, minHeight: '100vh', fontFamily: "'Instrument Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        .lp-wrap { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
        .lp-hero { display: flex; gap: 48px; align-items: center; flex-wrap: wrap; padding: 72px 0 56px; }
        .lp-nav-links { display: flex; gap: 22px; align-items: center; }
        @media (max-width: 700px) {
          .lp-wrap { padding: 0 16px; }
          .lp-hero { padding: 40px 0 36px; gap: 32px; }
          .lp-nav-links .lp-hide-sm { display: none; }
        }
      `}</style>

      {/* Nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: c.bg, borderBottom: `1px solid ${c.border}` }}>
        <div className="lp-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 60 }}>
          <a href="/" aria-label="Brikk home" style={{ textDecoration: 'none', color: c.text }}><Logo size={18} /></a>
          <nav className="lp-nav-links">
            <a href="#how" className="lp-hide-sm" style={{ fontSize: 13, color: c.sub, textDecoration: 'none' }}>How it works</a>
            <a href="#pricing" className="lp-hide-sm" style={{ fontSize: 13, color: c.sub, textDecoration: 'none' }}>Pricing</a>
            <a href="/login" style={{ fontSize: 13, color: c.sub, textDecoration: 'none' }}>Sign in</a>
            <a href={SIGNUP} style={{ ...btn.primary, textDecoration: 'none' }}>Start free trial</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="lp-wrap">
        <div className="lp-hero">
          <Reveal style={{ flex: '1 1 340px', maxWidth: 500 }}>
            <span style={{ ...chipFor('success'), fontSize: 12, padding: '5px 12px', borderRadius: 999 }}>7 days free · then $7.99/week</span>
            <h1 style={{ ...type.display, margin: '18px 0 18px' }}>
              Every client follow-up.<br />Written for you.<br />Sent in one tap.
            </h1>
            <p style={{ ...type.displaySub, margin: '0 0 26px', maxWidth: 460 }}>
              Brikk is the simple CRM for life insurance agents. Add a household and their policy — Brikk schedules the
              thank-you, draft-day and check-in texts, annual reviews and every family birthday. Each morning you just open
              Today and tap send.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href={SIGNUP} style={{ ...btn.primary, textDecoration: 'none', height: 48, padding: '0 26px', fontSize: 15 }}>Start your free week</a>
              <a href="#how" style={{ ...btn.secondary, textDecoration: 'none', height: 48, padding: '0 22px', fontSize: 15 }}>See how it works</a>
            </div>
            <div style={{ ...type.meta, marginTop: 12 }}>Cancel anytime. Texts go out from your own phone number.</div>
          </Reveal>
          <Reveal delay={120} style={{ flex: '1 1 340px', maxWidth: 440, width: '100%' }}>
            <PhoneMock />
          </Reveal>
        </div>
      </section>

      {/* Problem */}
      <section style={{ borderTop: `1px solid ${c.border}`, background: c.white }}>
        <div className="lp-wrap" style={{ padding: '44px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {[
            ['Chargebacks start with silence', 'The first months after a policy is written are when clients drift. A quick text on draft day and a check-in after keeps them on the books.'],
            ['Birthdays are free referrals', 'Remembering the spouse’s and kids’ birthdays is what makes a family call you first — and tell their friends about you.'],
            ['Spreadsheets don’t remind you', 'Brikk turns each policy’s dates into a to-do list, so the follow-up happens even on your busiest week.'],
          ].map(([t, d]) => (
            <div key={t}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{t}</div>
              <div style={type.bodySub}>{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ borderTop: `1px solid ${c.border}`, scrollMarginTop: 70 }}>
        <div className="lp-wrap" style={{ padding: '60px 24px' }}>
          <Reveal>
            <div style={type.eyebrow}>How it works</div>
            <h2 style={{ ...type.pageTitle, fontSize: 28, margin: '8px 0 28px' }}>Three steps. Then it runs itself.</h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {[
              ['1', 'Add the household', 'Policyholder, spouse and kids — names, phone and birthdays.'],
              ['2', 'Add the policy', 'Carrier, product, face amount, premium, and the application, effective and first draft dates.'],
              ['3', 'Open Today and tap send', 'Each morning Brikk lists who to contact with the text already written. One tap opens it in Messages.'],
            ].map(([n, t, d], i) => (
              <Reveal key={n} delay={i * 80}>
                <div style={{ ...card, height: '100%', boxSizing: 'border-box' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 14, background: c.text, color: c.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{n}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{t}</div>
                  <div style={type.bodySub}>{d}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section style={{ borderTop: `1px solid ${c.border}`, background: c.white }}>
        <div className="lp-wrap" style={{ padding: '60px 24px', display: 'flex', gap: 40, flexWrap: 'wrap' }}>
          <Reveal style={{ flex: '1 1 300px', maxWidth: 420 }}>
            <div style={type.eyebrow}>The first six months, handled</div>
            <h2 style={{ ...type.pageTitle, fontSize: 28, margin: '8px 0 12px' }}>A follow-up plan for every policy you write.</h2>
            <p style={type.bodySub}>
              This is the default schedule. Change the timing or wording of any step, add your own, or switch steps off —
              it’s your book.
            </p>
          </Reveal>
          <Reveal delay={100} style={{ flex: '1 1 380px' }}>
            <div style={{ position: 'relative', paddingLeft: 22 }}>
              <div aria-hidden style={{ position: 'absolute', left: 6, top: 6, bottom: 6, width: 2, background: c.border }} />
              {DEFAULT_TEMPLATES.map(t => (
                <div key={t.label} style={{ position: 'relative', marginBottom: 14 }}>
                  <div aria-hidden style={{ position: 'absolute', left: -20, top: 5, width: 10, height: 10, borderRadius: 5, background: t.repeat_yearly ? c.green : c.amber }} />
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{t.label}</div>
                  <div style={type.meta}>{describeTiming(t)}</div>
                </div>
              ))}
              <div style={{ position: 'relative' }}>
                <div aria-hidden style={{ position: 'absolute', left: -20, top: 5, width: 10, height: 10, borderRadius: 5, background: c.purple }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>Birthdays</div>
                <div style={type.meta}>For everyone in the household, every year</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Features */}
      <section style={{ borderTop: `1px solid ${c.border}` }}>
        <div className="lp-wrap" style={{ padding: '60px 24px' }}>
          <h2 style={{ ...type.pageTitle, fontSize: 28, margin: '0 0 24px' }}>Built for how life insurance agents actually work.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            {FEATURES.map((f, i) => (
              <Reveal key={f.t} delay={(i % 3) * 60}>
                <div style={{ ...card, height: '100%', boxSizing: 'border-box' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{f.t}</div>
                  <div style={type.bodySub}>{f.d}</div>
                </div>
              </Reveal>
            ))}
            <Reveal>
              <div style={{ ...card, height: '100%', boxSizing: 'border-box', background: c.bgInset }}>
                <span style={chipFor('info')}>Coming soon</span>
                <div style={{ fontSize: 15, fontWeight: 600, margin: '8px 0 6px' }}>Lead store</div>
                <div style={type.bodySub}>Buy fresh leads right inside Brikk — they’ll land in your Book with follow-ups ready.</div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ borderTop: `1px solid ${c.border}`, background: c.white, scrollMarginTop: 70 }}>
        <div className="lp-wrap" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={type.eyebrow}>Pricing</div>
          <h2 style={{ ...type.pageTitle, fontSize: 28, margin: '8px 0 24px' }}>One plan. Less than a coffee a week.</h2>
          <div style={{ ...card, maxWidth: 380, margin: '0 auto', textAlign: 'left', border: `2px solid ${c.text}`, boxShadow: shadow.md, padding: '26px 24px' }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Brikk Pro</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '10px 0 4px' }}>
              <span style={{ fontSize: 42, fontWeight: 700, letterSpacing: '-0.03em' }}>$7.99</span>
              <span style={{ fontSize: 15, color: c.dim }}>/week</span>
            </div>
            <div style={{ ...type.meta, marginBottom: 16 }}>First 7 days free · Cancel anytime</div>
            <ul style={{ ...type.bodySub, paddingLeft: 18, margin: '0 0 20px', lineHeight: 1.9 }}>
              <li>Unlimited clients and households</li>
              <li>Automatic policy follow-ups + annual reviews</li>
              <li>Birthday reminders for the whole family</li>
              <li>Today dashboard with one-tap texting</li>
              <li>A timeline for every client</li>
            </ul>
            <a href={SIGNUP} style={{ ...btn.primary, textDecoration: 'none', width: '100%', height: 48, fontSize: 15, boxSizing: 'border-box' }}>Start your free week</a>
          </div>
          <div style={{ ...type.meta, marginTop: 14 }}>Billed weekly through Stripe after your trial. All sales final; cancel anytime to stop future charges.</div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ borderTop: `1px solid ${c.border}` }}>
        <div className="lp-wrap" style={{ padding: '60px 24px', maxWidth: 760 }}>
          <h2 style={{ ...type.pageTitle, fontSize: 28, margin: '0 0 20px' }}>Questions</h2>
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            {FAQ.map(([q, a], i) => (
              <div key={q} style={{ borderTop: i ? `1px solid ${c.borderLight}` : 'none' }}>
                <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '16px 18px', minHeight: 52, fontSize: 15, fontWeight: 600, color: c.text, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  {q}<span aria-hidden style={{ color: c.dim }}>{open === i ? '–' : '+'}</span>
                </button>
                {open === i && <div style={{ ...type.bodySub, padding: '0 18px 16px' }}>{a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ borderTop: `1px solid ${c.border}`, background: c.white }}>
        <div className="lp-wrap" style={{ padding: '56px 24px', textAlign: 'center' }}>
          <h2 style={{ ...type.pageTitle, fontSize: 26, margin: '0 0 10px' }}>Never let a client go quiet again.</h2>
          <p style={{ ...type.bodySub, margin: '0 0 20px' }}>Set up your first household in two minutes.</p>
          <a href={SIGNUP} style={{ ...btn.primary, textDecoration: 'none', height: 48, padding: '0 28px', fontSize: 15 }}>Start your free week</a>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${c.border}` }}>
        <div className="lp-wrap" style={{ padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <Logo size={16} />
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {[['/login', 'Sign in'], ['/roadmap', 'Roadmap'], ['/privacy', 'Privacy'], ['/terms', 'Terms'], ['mailto:hello@brikk.store', 'Contact']].map(([h, l]) => (
              <a key={h} href={h} style={{ fontSize: 12, color: c.sub }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

// Static picture of the Today screen (example data — not real clients).
function PhoneMock() {
  const items = [
    { k: 'Policy follow-up · Today', who: 'Maria Lopez', what: 'Before first draft', msg: 'Hi Maria, quick heads-up: your first payment of $48.20 drafts on Mar 3. Any questions, just text me.', tone: c.amber },
    { k: 'Birthday · Today', who: 'Ethan Carter', what: 'Turns 9', msg: 'Hi Dana! Wishing Ethan a very happy birthday today.', tone: c.purple },
    { k: 'Annual review · Tomorrow', who: 'Tom & Linda Reed', what: 'Annual review', msg: '', tone: c.green },
  ]
  return (
    <div style={{ background: c.white, border: `1px solid ${c.border}`, borderRadius: 28, padding: 14, boxShadow: shadow.lg, maxWidth: 380, margin: '0 auto' }}>
      <div style={{ background: c.bg, borderRadius: 18, padding: '18px 14px', minHeight: 420 }}>
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>Good morning, Sam.</div>
        <div style={{ ...type.meta, marginBottom: 14 }}>3 people to contact today</div>
        <div style={{ display: 'grid', gap: 10 }}>
          {items.map(it => (
            <div key={it.who} style={{ ...card, padding: '12px 14px', borderLeft: `3px solid ${it.tone}` }}>
              <div style={{ ...type.eyebrow, color: it.tone, fontSize: 10 }}>{it.k}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{it.who} <span style={{ fontWeight: 400, color: c.sub }}>— {it.what}</span></div>
              {it.msg && <div style={{ marginTop: 8, background: c.bgInset, border: `1px solid ${c.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 12.5, lineHeight: 1.5 }}>{it.msg}</div>}
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <span style={{ ...btn.primary, height: 30, fontSize: 12, padding: '0 14px' }}>Text</span>
                <span style={{ ...btn.ghost, height: 30, fontSize: 12 }}>Skip</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

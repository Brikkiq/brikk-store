// Brikk design tokens — single source of truth.
// Every page imports from here. Never inline new tokens; extend this file instead.
//
// Aesthetic: refined light. Hairline borders, warm-neutral surfaces, whisper-soft
// layered shadows, tight heading letter-spacing, restrained spring motion. Inspired
// by the "quiet, expensive" school of UI — nothing shouts, everything sits right.

export const c = {
  // Surfaces — warm neutrals, a hair softer than pure gray.
  bg:          '#FAFAF9',
  bgInset:     '#F4F4F1',
  white:       '#FFFFFF',
  border:      '#EAEAE5',   // hairline — lighter, less assertive
  borderLight: '#F1F1ED',
  divider:     '#EEEEEA',

  // Ink — near-black with a touch of warmth, never #000.
  text:        '#191917',
  sub:         '#696964',
  dim:         '#9A9A94',
  faint:       '#C2C2BC',

  // Status — same hues, kept consistent across the app.
  green:       '#15803C',
  greenSoft:   'rgba(21,128,60,0.06)',
  greenBorder: 'rgba(21,128,60,0.16)',
  red:         '#BE123C',
  redSoft:     'rgba(190,18,60,0.06)',
  redBorder:   'rgba(190,18,60,0.16)',
  amber:       '#A16207',
  amberSoft:   'rgba(161,98,7,0.06)',
  amberBorder: 'rgba(161,98,7,0.16)',
  purple:      '#5B21B6',
  purpleSoft:  'rgba(91,33,182,0.05)',
  purpleBorder:'rgba(91,33,182,0.15)',
  indigo:      '#3730A3',
  indigoSoft:  'rgba(55,48,163,0.05)',
  indigoBorder:'rgba(55,48,163,0.15)',
}

// Whisper-soft layered shadows. Use these instead of inventing box-shadows.
// Each is a stack of low-opacity layers so elevation reads as light, not gray.
export const shadow = {
  none: 'none',
  xs:   '0 1px 2px rgba(24,24,22,0.04)',
  sm:   '0 1px 2px rgba(24,24,22,0.04), 0 2px 6px rgba(24,24,22,0.04)',
  md:   '0 2px 4px rgba(24,24,22,0.04), 0 6px 16px rgba(24,24,22,0.06)',
  lg:   '0 4px 8px rgba(24,24,22,0.05), 0 16px 40px rgba(24,24,22,0.08)',
  // For inputs/buttons on focus — a soft ring in ink, not blue.
  focus:'0 0 0 3px rgba(24,24,22,0.07)',
}

// Motion — restrained spring + ease curves. Reference these so timing is consistent.
// `spring` reads as a confident settle; `ease` is the default for color/opacity.
export const motion = {
  spring:    'cubic-bezier(0.22, 1, 0.36, 1)',   // gentle overshoot-free settle
  springOut: 'cubic-bezier(0.16, 1, 0.3, 1)',    // decisive exit
  ease:      'cubic-bezier(0.4, 0, 0.2, 1)',
  fast:      '0.12s',
  base:      '0.2s',
  slow:      '0.32s',
  // Ready-made transitions
  hover:     'transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s cubic-bezier(0.22, 1, 0.36, 1), background 0.12s ease',
  fade:      'opacity 0.32s cubic-bezier(0.16, 1, 0.3, 1), transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
}

// Typography ramp. Use these — don't invent new sizes per page.
// Headings carry tighter tracking the larger they get (optical correction).
export const type = {
  pageTitle:    { fontSize: 21, fontWeight: 600, letterSpacing: '-0.021em', lineHeight: 1.2 },
  sectionTitle: { fontSize: 14, fontWeight: 600, letterSpacing: '-0.011em' },
  eyebrow:      { fontSize: 11, fontWeight: 600, color: c.dim, letterSpacing: '0.09em', textTransform: 'uppercase' },
  body:         { fontSize: 14, fontWeight: 400, lineHeight: 1.6, color: c.text },
  bodySub:      { fontSize: 13, fontWeight: 400, lineHeight: 1.62, color: c.sub },
  meta:         { fontSize: 12, fontWeight: 400, color: c.dim, lineHeight: 1.45 },
  metric:       { fontSize: 23, fontWeight: 600, letterSpacing: '-0.027em', lineHeight: 1.08 },
  label:        { fontSize: 12, fontWeight: 500, color: c.sub, letterSpacing: 0 },
  mono:         { fontFamily: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace' },
  // Display sizes for marketing/hero use — very tight tracking.
  display:      { fontSize: 'clamp(2.4rem, 6vw, 4rem)', fontWeight: 600, letterSpacing: '-0.035em', lineHeight: 1.02 },
  displaySub:   { fontSize: 'clamp(1.05rem, 2.2vw, 1.25rem)', fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1.5, color: c.sub },
}

// Reusable card surface — hairline border + whisper shadow for soft lift.
export const card = {
  background: c.white,
  border: `1px solid ${c.border}`,
  borderRadius: 12,
  padding: '20px 22px',
  boxShadow: shadow.xs,
}

export const cardTight = {
  ...card,
  padding: '14px 16px',
  borderRadius: 10,
}

// Buttons.
export const btn = {
  primary: {
    background: c.text,
    color: c.white,
    border: '1px solid ' + c.text,
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '-0.006em',
    cursor: 'pointer',
    fontFamily: 'inherit',
    height: 36,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    boxShadow: shadow.xs,
    transition: motion.hover,
  },
  secondary: {
    background: c.white,
    color: c.text,
    border: '1px solid ' + c.border,
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '-0.006em',
    cursor: 'pointer',
    fontFamily: 'inherit',
    height: 36,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    boxShadow: shadow.xs,
    transition: motion.hover,
  },
  ghost: {
    background: 'transparent',
    color: c.sub,
    border: '1px solid transparent',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    height: 36,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    transition: 'background 0.12s ease, color 0.12s ease',
  },
  danger: {
    background: c.white,
    color: c.red,
    border: `1px solid ${c.redBorder}`,
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    height: 36,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.12s ease, box-shadow 0.12s ease',
  },
}

// Inputs.
export const input = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: `1px solid ${c.border}`,
  // Must be >= 16px or iOS Safari auto-zooms on focus, which (combined with
  // PWA wrappers) can prevent the keyboard from appearing at all. Apple's
  // own developer docs recommend 16px as the minimum for text inputs.
  fontSize: 16,
  color: c.text,
  background: c.white,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  height: 40,
  transition: 'border-color 0.14s ease, box-shadow 0.14s ease',
}

// Apply on :focus in components that support it (e.g. spread when focused).
export const inputFocus = {
  borderColor: c.dim,
  boxShadow: shadow.focus,
}

export const inputLabel = {
  fontSize: 12,
  fontWeight: 500,
  color: c.sub,
  display: 'block',
  marginBottom: 6,
  letterSpacing: '-0.005em',
}

// Chip — tiny categorical tag.
export const chipBase = {
  fontSize: 11,
  fontWeight: 500,
  padding: '2px 8px',
  borderRadius: 6,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  letterSpacing: '0.01em',
  lineHeight: 1.4,
}

export const chipFor = (tone) => {
  const t = {
    neutral: { background: c.bgInset, color: c.sub, border: '1px solid transparent' },
    hot:     { background: c.redSoft, color: c.red, border: `1px solid ${c.redBorder}` },
    warm:    { background: c.amberSoft, color: c.amber, border: `1px solid ${c.amberBorder}` },
    cold:    { background: c.bgInset, color: c.dim, border: `1px solid ${c.border}` },
    success: { background: c.greenSoft, color: c.green, border: `1px solid ${c.greenBorder}` },
    info:    { background: c.indigoSoft, color: c.indigo, border: `1px solid ${c.indigoBorder}` },
    ai:      { background: c.purpleSoft, color: c.purple, border: `1px solid ${c.purpleBorder}` },
  }[tone] || t.neutral
  return { ...chipBase, ...t }
}

// Layout
export const pageMaxWidth = 1200
export const sidebarWidth = 220

// Stat KPI tile
export const statTile = {
  background: c.white,
  border: `1px solid ${c.border}`,
  borderRadius: 10,
  padding: '14px 16px',
  flex: '1 1 160px',
  minWidth: 160,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  boxShadow: shadow.xs,
}

// Helpers
export const fmt = {
  money: (n) => '$' + (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }),
  moneyK: (n) => '$' + ((Number(n) || 0) / 1000).toFixed(1) + 'K',
  daysSince: (date) => {
    if (!date) return null
    return Math.floor((new Date() - new Date(date)) / 86400000)
  },
  daysUntil: (date) => {
    if (!date) return null
    return Math.ceil((new Date(date) - new Date()) / 86400000)
  },
  initials: (name) => (name || '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase(),
  relativeDate: (date) => {
    if (!date) return '—'
    const d = new Date(date)
    const now = new Date()
    const days = Math.floor((now - d) / 86400000)
    if (days === 0) return 'today'
    if (days === 1) return 'yesterday'
    if (days < 7) return `${days}d ago`
    if (days < 30) return `${Math.floor(days / 7)}w ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  },
  // Display US phone numbers consistently as (XXX) XXX-XXXX.
  // Strips everything but digits, then formats. Returns input unchanged if it
  // doesn't look like a 10/11-digit US number (international, extension, etc.).
  phone: (raw) => {
    if (!raw) return ''
    const digits = String(raw).replace(/\D/g, '')
    if (digits.length === 10) {
      return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+1 (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`
    }
    return raw // fall back to raw if not a recognized US format
  },
}

export const temperatureChip = (t) => chipFor(t === 'hot' ? 'hot' : t === 'warm' ? 'warm' : 'cold')

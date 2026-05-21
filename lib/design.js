// Brikk design tokens — single source of truth.
// Every page imports from here. Never inline new tokens; extend this file instead.

export const c = {
  // Surfaces
  bg:          '#FAFAF9',
  bgInset:     '#F5F5F2',
  white:       '#FFFFFF',
  border:      '#E8E8E4',
  borderLight: '#F0F0EC',
  divider:     '#EDEDE9',

  // Ink
  text:        '#1A1A18',
  sub:         '#6B6B66',
  dim:         '#9C9C96',
  faint:       '#BFBFB9',

  // Status
  green:       '#16803C',
  greenSoft:   'rgba(22,128,60,0.06)',
  greenBorder: 'rgba(22,128,60,0.18)',
  red:         '#BE123C',
  redSoft:     'rgba(190,18,60,0.06)',
  redBorder:   'rgba(190,18,60,0.18)',
  amber:       '#A16207',
  amberSoft:   'rgba(161,98,7,0.06)',
  amberBorder: 'rgba(161,98,7,0.18)',
  purple:      '#5B21B6',
  purpleSoft:  'rgba(91,33,182,0.05)',
  purpleBorder:'rgba(91,33,182,0.16)',
  indigo:      '#3730A3',
  indigoSoft:  'rgba(55,48,163,0.05)',
  indigoBorder:'rgba(55,48,163,0.16)',
}

// Typography ramp. Use these — don't invent new sizes per page.
export const type = {
  pageTitle:    { fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.25 },
  sectionTitle: { fontSize: 14, fontWeight: 600, letterSpacing: '-0.005em' },
  eyebrow:      { fontSize: 11, fontWeight: 600, color: c.dim, letterSpacing: '0.08em', textTransform: 'uppercase' },
  body:         { fontSize: 14, fontWeight: 400, lineHeight: 1.55, color: c.text },
  bodySub:      { fontSize: 13, fontWeight: 400, lineHeight: 1.6, color: c.sub },
  meta:         { fontSize: 12, fontWeight: 400, color: c.dim, lineHeight: 1.45 },
  metric:       { fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1 },
  label:        { fontSize: 12, fontWeight: 500, color: c.sub, letterSpacing: 0 },
  mono:         { fontFamily: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace' },
}

// Reusable card surface.
export const card = {
  background: c.white,
  border: `1px solid ${c.border}`,
  borderRadius: 8,
  padding: '20px 22px',
}

export const cardTight = {
  ...card,
  padding: '14px 16px',
}

// Buttons.
export const btn = {
  primary: {
    background: c.text,
    color: c.white,
    border: '1px solid ' + c.text,
    borderRadius: 6,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '-0.005em',
    cursor: 'pointer',
    fontFamily: 'inherit',
    height: 34,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'background 0.12s ease, transform 0.08s ease',
  },
  secondary: {
    background: c.white,
    color: c.text,
    border: '1px solid ' + c.border,
    borderRadius: 6,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '-0.005em',
    cursor: 'pointer',
    fontFamily: 'inherit',
    height: 34,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'background 0.12s ease',
  },
  ghost: {
    background: 'transparent',
    color: c.sub,
    border: '1px solid transparent',
    borderRadius: 6,
    padding: '8px 12px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    height: 34,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  danger: {
    background: c.white,
    color: c.red,
    border: `1px solid ${c.redBorder}`,
    borderRadius: 6,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    height: 34,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}

// Inputs.
export const input = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 6,
  border: `1px solid ${c.border}`,
  fontSize: 13.5,
  color: c.text,
  background: c.white,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  height: 36,
  transition: 'border-color 0.12s ease, box-shadow 0.12s ease',
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
  borderRadius: 4,
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
  borderRadius: 8,
  padding: '14px 16px',
  flex: '1 1 160px',
  minWidth: 160,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
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

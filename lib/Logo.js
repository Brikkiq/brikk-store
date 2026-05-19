// Brikk logo — single source for mark + wordmark.
// The mark is two staggered "bricks" in running-bond pattern.
// Wordmark stays as live HTML text so it inherits the Instrument Sans font.

import { c } from './design'

export const LogoMark = ({ size = 22, color }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="4"  y="9"  width="16" height="6" rx="1.5" fill={color || 'currentColor'} />
    <rect x="12" y="17" width="16" height="6" rx="1.5" fill={color || 'currentColor'} />
  </svg>
)

export const Logo = ({ size = 18, color, gap = 8 }) => {
  const fill = color || c.text
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap, color: fill, lineHeight: 1 }}>
      <LogoMark size={size + 4} color={fill} />
      <span style={{
        fontSize: size,
        fontWeight: 700,
        letterSpacing: '-0.025em',
        color: fill,
      }}>Brikk</span>
    </span>
  )
}

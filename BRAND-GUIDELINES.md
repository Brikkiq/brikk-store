# Brikk brand guidelines

The rules so designers, contractors, marketers, and future-you don't drift the brand into mush.

---

## Brand essence

**Brikk is the AI transaction coordinator in your pocket for solo real estate agents.**

- **Built for:** solo agents and small teams (1-10 people)
- **NOT built for:** large brokerages, lender networks, or non-real-estate use cases (we'll get there in v3)
- **Voice:** founder-direct. Confident, specific, low-pressure. Like a peer who's been in the trenches, not a vendor.
- **Origin:** Built by realtors, for realtors. Built in Southern California. Launching May 2026.

---

## Visual identity

### The mark

Two staggered bricks in a running-bond masonry pattern. Stable, solid, simple. Conveys "building blocks" + literal "Brikk."

**Variants** (all in `brand/` folder of the repo):
- `brikk-icon.svg` — dark square background, white bricks. Use as favicon, app icon, profile pic.
- `brikk-mark.svg` — bricks only with `currentColor`. Use as inline brand glyph.
- `brikk-mark-dark-1024.png` — dark bricks on transparent. For light backgrounds.
- `brikk-mark-white-1024.png` — white bricks on transparent. For dark backgrounds.
- `brikk-wordmark-dark.svg` / `-white.svg` — mark + "Brikk" text. Use for letterheads, email signatures.

**Sizes available** in PNG: 32, 64, 180 (iOS app icon), 192 (Android), 400 (social profile photos), 512 (PWA icon, App Store), 1024 (maximum), 1600 and 3200 widths for wordmark (business cards, slide headers).

### Clear space

Minimum 1× the mark's height of clear space on all sides. Never put text or other elements closer.

### Do

✓ Use the dark square icon (`brikk-icon-*.png`) for app icons, social profile photos, favicon
✓ Use the white-bricks-transparent mark on dark backgrounds
✓ Use the dark-bricks-transparent mark on light backgrounds
✓ Pair the wordmark with the mark when introducing the brand somewhere new
✓ Maintain the 8:1 ratio between mark and wordmark text height

### Don't

✗ Recolor the bricks to gradients or non-brand colors
✗ Add a tagline directly inside the mark
✗ Rotate or tilt the mark
✗ Place the mark on busy / patterned backgrounds without padding or a backing shape
✗ Stretch or distort the proportions
✗ Add drop shadows or other 3D effects
✗ Use the "B" letter as a substitute for the mark

---

## Color palette

All defined in `lib/design.js` — never use raw hex codes elsewhere in code.

| Token | Hex | When to use |
|---|---|---|
| `c.text` (ink) | `#1A1A18` | Primary text, primary button backgrounds, brand mark |
| `c.bg` | `#FAFAF9` | Page background (warm off-white) |
| `c.white` | `#FFFFFF` | Card backgrounds, modal backgrounds |
| `c.border` | `#E8E8E4` | Card borders, table dividers (primary) |
| `c.borderLight` | `#F0F0EC` | Inner dividers, subtle separations |
| `c.sub` | `#6B6B66` | Secondary text, body copy |
| `c.dim` | `#9C9C96` | Tertiary text, helper labels, placeholders |
| `c.green` | `#16803C` | Success states, "go" actions, on-pace indicators |
| `c.greenSoft` | `rgba(22,128,60,0.06)` | Success background fills |
| `c.amber` | `#A16207` | Warning states, "caution" alerts, urgent-but-not-critical |
| `c.amberSoft` | `rgba(161,98,7,0.06)` | Warning background fills |
| `c.red` | `#BE123C` | Critical alerts, destructive actions, hot leads |
| `c.redSoft` | `rgba(190,18,60,0.06)` | Error background fills |
| `c.indigo` | `#4338CA` | AI Copilot accent, secondary informational |
| `c.indigoSoft` | `rgba(67,56,202,0.05)` | Indigo background fills |

**Color philosophy:** mostly neutral grays and warm off-white. Color is reserved for status (success/warn/error) and one accent (indigo for AI). Avoid rainbow chrome — Brikk feels professional, not toy-like.

### Approved color combinations

- Dark text on cream background (default body)
- Cream text on dark background (CTAs, brand mark)
- Green on green-soft (success state)
- Amber on amber-soft (warning state)
- Red on red-soft (error state, hot lead chips)

### Forbidden color usage

- Pure black (`#000000`) — use `c.text` instead
- Pure white text on cream background — too low contrast
- More than 3 accent colors in a single view — visual noise
- Rainbow gradients on anything ever

---

## Typography

### Primary font: Instrument Sans

Loaded from Google Fonts in `app/layout.js`. Used for everything.

```
fontFamily: "'Instrument Sans',-apple-system,BlinkMacSystemFont,sans-serif"
```

If Instrument Sans fails to load, the cascade falls to system fonts gracefully.

### Type scale

Defined in `lib/design.js → type`. Pull from there.

| Token | Use case | Approx size |
|---|---|---|
| `type.pageTitle` | h1 page titles | 28px, 700 weight, -0.025em letterspacing |
| `type.sectionTitle` | h2 / card titles | 16px, 600 weight |
| `type.metric` | KPI numbers | 22-32px depending on context |
| `type.eyebrow` | Above-title category labels | 11px, 600 weight, uppercase, 0.06em letter spacing |
| `type.body` | Standard body text | 14px |
| `type.bodySub` | Subtitle / muted body | 13px, `c.sub` |
| `type.meta` | Helper text, timestamps | 12px, `c.dim` |

### Type rules

- Minimum 16px font-size on inputs (iOS Safari auto-zoom prevention)
- Line height: 1.5-1.7 for body, 1.1-1.3 for headings
- Letter spacing: tighter on headings (`-0.02em` to `-0.025em`), looser on eyebrows (`+0.06em`)
- Bold (700) for titles + emphasis. Medium (500) for buttons + nav. Regular (400) for body. Avoid using 300/light weights.

---

## Voice + tone

Brikk speaks like a smart founder who's been a realtor — direct, helpful, never salesy.

### Always

✓ Specific over generic. "Closed 3 deals in 90 days" beats "great results."
✓ Confident but not boastful. State what's true; let it stand.
✓ Honest about limitations. "Not built for X yet — here's our workaround" beats "We do everything!"
✓ Action-oriented. "Tap mic, talk naturally" beats "Voice-to-CRM capabilities."
✓ Numbers when they help. "$69.99/month" not "affordable." "14 days" not "weeks."
✓ Lowercase casual on social / SMS. Formal-but-warm in email.

### Never

✗ "Synergize", "leverage" (as a verb), "10x", "best-in-class", "world-class", "cutting-edge", "revolutionary", "game-changing"
✗ "Happy to help!" (write what you're going to do instead)
✗ "Just checking in", "just following up" — these are explicitly banned in Brikk's own AI copy
✗ Em-dash overuse. One per paragraph max.
✗ Walls of corporate text. Bullets and short paragraphs.
✗ Marketing-speak from 2015 ("disrupting", "reimagining")
✗ Comparing to specific competitors by name in marketing copy. (In sales conversations: fine. In writing: avoid public swipes.)

### Tone by surface

| Surface | Tone |
|---|---|
| Landing page | Confident, specific, no fluff |
| App UI | Direct, instructional, warm |
| Email (transactional) | Warm but quick — get to the point in 1-2 sentences |
| Email (founder) | Personal, specific to the recipient. Sign "— Henry" |
| Social media | Lowercase casual, real, behind-the-scenes |
| Customer support | See `SUPPORT-TEMPLATES.md` — direct, action-oriented |
| Investor / press | Confident, factual, specific numbers |

---

## Punctuation + writing rules

- Em dash: `—` (not `--` or `-`). One per sentence max.
- Numbers: use numerals for anything over 9 (`10 deals`, `5 leads`), spell out below (`three offers`, `seven referrals`). Always use numerals for prices, percentages, durations.
- Currency: `$69.99` (always include cents on prices, no spaces). For approximations: `~$70/month`.
- Time: `14-day trial` (hyphenated when used as adjective), `14 days` (no hyphen as noun).
- Brand name: always `Brikk` (capital B, two K's). Never "BRIKK" or "brikk" in body text. Lowercase only in URL contexts.
- Apostrophes: curly quotes `'` `'` not straight `'` (your editor should handle this).
- Avoid Oxford comma in marketing copy ("AI follow-ups, lead pipeline and deal tracker"). Use Oxford comma in legal/technical copy.

---

## Imagery + iconography

### Photography style (when adding photos)

- Real agents in real environments. Never stock-photo-perfect smiles.
- Natural lighting. Avoid corporate-office boardrooms.
- Diverse representation. Real estate is a diverse industry; the photos should reflect that.

### Iconography

- Use emoji sparingly and intentionally. Real-estate-related emoji (🏡 🎂 🔑) are fine for delight moments. Avoid generic UX emoji (🚀 ✨ 💪).
- For UI icons: simple line icons. Inline SVG, not icon fonts.

### Screenshots

- Real data, never lorem ipsum. Use plausible realtor names ("Sarah Mitchell", "James Chen") and addresses ("742 Oak Avenue").
- Show the actual Brikk UI, not mockups. We don't fake the product.
- Include a recognizable feature in each screenshot — voice button, AI draft, anniversary card, etc.

---

## Email signatures

For all external email from `hello@brikk.store`, founder accounts, etc.:

```
— Henry

Henry Desrosier
Brikk · brikk.store
Built to close.
```

For Brikk-as-a-company emails (transactional, marketing):

```
Brikk
brikk.store
Built to close.
```

---

## Logo + asset checklist before any new surface

Before posting to Instagram, sending press, or going on any new platform, check:

- [ ] Using the correct mark for the background (dark on light, white on dark)
- [ ] At least 1× mark-height of clear space around it
- [ ] Brand color palette only
- [ ] Voice and tone match the surface (lowercase casual on social, professional in press)
- [ ] No raw `#hex` colors in code — pull from `lib/design.js`
- [ ] No banned words in copy

---

## Last updated

May 21, 2026. If the brand evolves, update this doc — don't let it drift in practice without updating the rules.

# Chrome bot prompt — 2+ hours of work (browser-only capabilities)

Paste this into a fresh Claude in Chrome session. The prompt is sized to the bot's actual capabilities: long-form writing in chat + browser navigation + research. No file-write or git assumptions.

---

## Start message to send the bot

```
You have browser tools only — no filesystem, no shell, no git. Treat every deliverable as a long message you write into chat that Henry will paste into his repo manually.

Work continuously for 2+ hours through Parts 1, 2, 3, and 4 below in order. Do not stop between parts. Do not ask permission to move to the next part — finish one, immediately start the next.

You may use WebFetch/web search freely to research competitor pricing, validate API costs, and check accuracy of claims. Use only public information.

Output format for each part: one self-contained message I can paste directly into a file. No commentary at the start of the message. No "let me know if you want changes" at the end. Just the artifact. Each artifact gets its own message in chat.

Safety: don't navigate to credential-entry pages. Don't try to log in anywhere. You're researching public info and writing documents only.

Start with Part 1 immediately. Go.
```

---

## PART 1 — Pitch deck (~75 min of writing + research)

Build `pitch/brikk-pitch-deck.md` — investor + brokerage-sales ready, ~3000 words.

### Required sections in order

**1. Title + one-liner**
- Brikk — the AI transaction coordinator in your pocket for solo real estate agents
- One-sentence pitch (you write it)
- Founder: Henry Desrosier · Southern California · launching May 2026

**2. The problem (2 sub-sections)**
- Solo agents pay $300-500/mo for legacy CRMs AND $300-400/deal for a transaction coordinator. That's $5-10k/year minimum, often more.
- 78% of buyers pick the first agent who responds (NAR Profile of Home Buyers 2024). Average agent response time is 15 hours (WAV Group). Solo agents lose 30-40% of leads to slow response because they can't be on top of everything alone.

**3. The solution**
- Brikk = AI CRM + AI transaction coordinator + lead capture + marketing analytics in ONE product at $69.99/month
- Replaces: their CRM ($75-499/mo), their TC ($300-400/deal), Calendly ($12/mo), BombBomb ($29/mo), separate lead-gen tools ($50-200/mo). Total replaced value: $5k-12k/year.

**4. Product overview — full feature inventory**
Visit https://brikk.store/roadmap and list every feature from the "Shipped" section. For each:
- Name
- One-sentence description
- The time-suck or revenue-loss it kills

Group by:
- Pipeline & lead management
- AI Copilot
- Voice-to-CRM
- Transaction coordination
- Relationship glue
- Marketing & analytics
- Calendar

**5. The "AI gets smarter" story (the data moat)**
Frame Brikk's AI as compounding intelligence — switching costs grow monthly.
- Day 1: Brikk writes generic-but-good drafts using lead context
- Day 30: knows the agent's voice from their approve/edit patterns
- Day 60: knows each lead's response timing + preferred channel
- Day 90: predicts which leads will close based on the agent's conversion patterns
- Day 180: drafts feel indistinguishable from the agent's writing

Switching to a competitor = restart from Day 1. This is a real moat.

**6. Honest unit economics — per-user monthly cost breakdown**

Research current pricing pages (link to each):
- **Anthropic Claude Sonnet 4.5:** check anthropic.com/pricing — find current per-million-token rate. Brikk uses ~25 drafts/mo at 600 input + 250 output tokens = ~$0.07/draft, plus sentiment classification on inbounds, plus voice-to-CRM extracts. Estimate ~$3.00/user variable.
- **Supabase:** check supabase.com/pricing — Pro plan $25/mo base + per-user storage/bandwidth. At 100 users, amortizes to ~$0.50/user.
- **Resend:** check resend.com/pricing — 3000 emails/mo free, then $20 for 50k. At normal volume, ~$0.10/user.
- **Stripe:** 2.9% + $0.30 per transaction. On $69.99 monthly charge = ~$2.33/transaction.
- **Vercel:** check vercel.com/pricing — Pro plan, ~$0.10/user amortized.
- **Misc (DNS, monitoring):** ~$0.20/user.

Total variable cost: ~$6.20/user/month.
Gross margin at $69.99: **91%**.

Compare to industry: SaaS averages 70-80% gross margin. Brikk's 91% is above average due to lean stack + AI cost efficiency.

**7. Year 1 revenue projection — show your work**
Two scenarios:

*Conservative:*
- Month 1-3: 25 customers via door-to-door
- Month 4-6: 75 via referrals + content
- Month 7-9: 200
- Month 10-12: 400
- End of year 1 ARR: $69.99 × 400 × 12 = $336k

*Aggressive:*
- Same curve but 2.5x — 1,000 customers by month 12
- ARR: $840k

Unit economics:
- CAC (year 1, mostly organic + referral): ~$50
- LTV (12-month rolling, with churn): ~$840
- LTV/CAC: 16:1 (industry benchmark: 3:1 is good, 5:1 is great)
- Payback period: <1 month
- Gross margin: 91%

By year 3 (conservative): 5,000 customers, $4.2M ARR, plus Team/Agency plan upgrades.

**8. Competitive comparison table**

Research current pricing for each competitor. Visit their pricing pages directly:
- **Lofty** (formerly Chime): lofty.com
- **Follow Up Boss:** followupboss.com
- **KvCore:** insiderealestate.com/kvcore
- **Real Geeks:** realgeeks.com
- **LionDesk:** liondesk.com

Build a markdown table. Rows are products. Columns are features Brikk has that competitors mostly don't:

| Feature | Brikk | Lofty | FUB | KvCore | Real Geeks | LionDesk |
|---|---|---|---|---|---|---|
| Monthly price | $69.99 | $449+ | $99-499 | $399+ | $299+ | $39 |
| Setup fee | $0 | $0-2000 | $0 | $0 | $0 | $0 |
| AI follow-up drafts | ✓ | partial | no | partial | no | no |
| Voice-to-CRM | ✓ | no | no | no | no | no |
| Sentiment analysis | ✓ | no | no | no | no | no |
| Client-facing deal tracker | ✓ | no | no | no | no | no |
| Anniversary automation | ✓ | partial | no | no | no | no |
| Referral ledger | ✓ | no | no | no | no | no |
| Lead capture link | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Commission goal pacing | ✓ | no | no | no | no | no |
| Native phone send (TCPA-safe) | ✓ | no | no | no | no | no |
| Google Calendar sync | ✓ | ✓ | ✓ | ✓ | partial | partial |
| Best-time-to-contact AI | ✓ | no | no | no | no | no |
| Deal risk scoring | ✓ | no | no | no | no | no |

(Verify each cell — don't fabricate. If unsure about a competitor feature, mark `?`.)

Then write a paragraph: "Brikk is the only product with all twelve of these capabilities under $100/month."

**9. Go-to-market strategy — 4 phases**

*Phase 1 (months 1-3): Henry's network*
- Door-knock 50 local agencies in Southern California (script in `marketing/door-to-door-script.pdf`)
- Cold-email 100 agents from his existing network
- Lead capture link is the trojan horse — agents try the free signup, see value, upgrade

*Phase 2 (months 4-6): Referral flywheel + Instagram*
- Every paying agent gets a referral link with free month for both sides
- Daily Brikk-feature Instagram reels (one feature per day)
- Reach out to 5 real-estate YouTubers + podcasters for honest-review trades

*Phase 3 (months 7-12): Content + partnerships*
- Blog posts ranking for "real estate CRM" SEO keywords
- Reddit r/realestate community engagement
- Partnership with 2 real-estate coaches who recommend Brikk to their students

*Phase 4 (year 2): Brokerage sales*
- Pitch Team/Agency plan to 100 mid-size brokerages
- White-label option for tier-3 brokerages at premium price

**10. The moat (why this can't be cloned in a quarter)**
- **Data moat:** AI improves with use — switching = restart
- **Compound features:** birthday + anniversary + referral ledger together create habit loops competitors can't replicate without all three
- **Pricing moat:** 91% gross margin at $69.99 means competitors at $300+ can't match without rebuilding their cost structure (and they have legacy contracts)
- **Voice-to-CRM moat:** no competitor has voice. Agents are constantly in their cars. This is the killer differentiator for the actual customer's day.
- **Native phone send pattern:** competitors who use Twilio carry TCPA risk + A2P 10DLC paperwork. Brikk's deep-link approach has zero of that liability.

**11. The team / founder**
- Henry Desrosier: real-estate-adjacent context, founder operating from Southern California
- Why now: AI infrastructure costs collapsed in 2024-25. Same agent CRM build was economically impossible 2 years ago.

**12. The ask**
Leave as `[CUSTOMIZE BASED ON CONTEXT]`. Henry will fill in:
- If pitching investors: $X seed, valuation $Y, runway to Z customers
- If pitching brokerages: deal terms, white-label option, revenue share
- If pitching partnerships: integration scope

**13. Risks + mitigations (be honest)**
- **Apple/Google could clone:** mitigation = move fast, build relationships before they care; voice + anniversary + referral patterns are tactical features they won't bother with
- **A bigger competitor matches our price:** mitigation = network effects via referral network feature on roadmap; data moat keeps existing users
- **TCPA legal liability scales with usage:** mitigation = native phone deep-link pattern (no server SMS) sidesteps the registration regime entirely
- **AI cost spikes:** mitigation = prompt engineering owns the cost curve; can swap Claude → cheaper model anytime
- **Real-estate market downturn:** mitigation = agents need Brikk MORE during downturns when leads are scarce

**14. Closing**
- brikk.store
- hello@brikk.store
- "Built by realtors, for realtors."

### Format

Output as one continuous markdown document. ~3000 words. No placeholder dollar amounts — use the real research. No marketing buzz like "10x" or "synergize". Write like a smart founder, not a copywriter.

Paste the entire deck as one message in chat when done. Henry will save it as `pitch/brikk-pitch-deck.md`.

---

## PART 2 — `THIS-WEEK.md` (~30 min)

Build a day-by-day operational checklist for Henry's next 7 days. Pure markdown checkboxes. Reference existing repo docs by path where relevant.

### Required sections

**Today (Monday)**
- Push all code from overnight session to GitHub
- Run SQL migrations: `sql/v2-feature-pack.sql`, `sql/link-deals-to-leads.sql`, `sql/enable-realtime.sql` (if not already), `sql/google-calendar-integration.sql` (if Henry ships that today)
- Update Stripe prices per `PRICING-CHANGE.md`
- Test signup flow end-to-end on the live site
- Reply to iOS freelancer with GitHub access + Apple Developer team invite

**Tuesday — Outreach + integrations**
- Door-knock 10 SoCal agencies using `marketing/door-to-door-script.pdf`
- Send 20 cold emails using template in `marketing/cold-outreach.pdf`
- Post first Instagram reel
- Register Google OAuth app per `docs/google-calendar-integration.md`
- Add Google Calendar env vars in Vercel + redeploy
- Personal welcome call to any new signups from Monday

**Wednesday — Product polish**
- Wire sentiment chip on lead detail page (5 lines — surface `sentiment` column visually)
- Wire listing prep checklist UI on lead detail (`lib/listingTemplates.js` ready)
- Build offer comparison sheet UI (schema in `offers` table)
- Add missed-call quick action button (sms: deep-link)
- Hand-test all v2 features as a real user

**Thursday — Marketing push**
- 10 more cold emails
- LinkedIn post with Brikk demo screen recording
- Reach out to 3 real-estate YouTubers/podcasters
- Update Instagram bio with brikk.store/r/HENRY-CODE
- Apply to be on 1 real-estate podcast

**Friday — Sales + customer support**
- Text or call every paying signup
- Ask 1-week paid users for first real testimonial — replace placeholder on landing
- Reply to every hello@brikk.store email within 4h
- Review Resend Logs for failures
- Review Stripe disputes (should be 0)

**Saturday — Build day**
- Pick ONE stretch goal from the list below
- Ship it
- Update `app/roadmap/page.js` to reflect newly shipped feature
- Tweet/Instagram with screen recording

**Sunday — Weekly review + plan**
- Signups this week? Conversion?
- Most-requested feature?
- What broke?
- Three goals for next week

### Stretch goals list (Saturday's pick from):
1. Sentiment chip visible on lead detail
2. Listing prep checklist UI
3. Offer comparison sheet builder
4. Open house sign-in page
5. Missed-call quick action
6. Hyperlocal market report PDF generator
7. Showings booking page
8. AI property-tour notes mode
9. Brokerage compliance scanner
10. Property finder for buyers

### Format

One markdown message with `[ ]` checkboxes throughout. Time estimates in parens per task. Link to docs in repo by path. Output as one message in chat — Henry pastes into `THIS-WEEK.md` in repo root.

---

## PART 3 — Live brikk.store audit (~30 min)

Navigate to https://brikk.store and exercise it like a brand-new realtor would. Capture every bug, copy inconsistency, layout glitch, dead link, or UX confusion you find. Don't be polite — be specific.

### Walkthrough

1. Homepage at brikk.store
   - Sticky nav working? Scroll down — does nav follow?
   - Click "Get started" nav link — does it land on the right section?
   - Hero email field — type invalid email, click button. Right error?
   - LiveDemo: click all 8 tabs (Today, Copilot, Leads, Voice, Deals, Calendar, Chats, ROI). Each render correctly?
   - Pricing section: 3-across at desktop width? Verify prices show $69.99 and $160 with "No setup fee"
   - Testimonials section visible with placeholder content?
   - Footer: all links work? Roadmap, Privacy, Terms, Sign in?

2. /roadmap — does the page render? Sections populated?

3. /privacy — Section 9 about GDPR/CCPA visible?

4. /terms — section 4 says "No refunds" + $69.99 / $160?

5. /login — Terms link works? Sign Up tab vs Sign In tab visible?

6. /r/INVALID — clean branded "link not found" page (no leaked data)?

7. /nonexistent-page — branded 404 with logo + back link?

8. /track/INVALID — clean branded "transaction not found" page?

9. Mobile responsive check at 375px viewport (DevTools):
   - Anything overflowing?
   - LiveDemo tabs all visible or do they scroll?
   - Pricing stacks correctly?

10. View source on homepage — search for "$75", "$200", "$125" — should find ZERO matches (all should now be $69.99 / $160 / no setup). If you find any, list them with line numbers.

### Output

Write a critical audit report. Format:

```
BRIKK.STORE AUDIT — [timestamp]

WHAT WORKS:
- [list]

NEW BUGS FOUND:
1. [page] — [what's wrong] — [severity: critical / important / polish]
2. ...

COPY INCONSISTENCIES:
1. ...

UX CONFUSION POINTS:
1. ...

DEAD LINKS / 404s:
1. ...

MOBILE ISSUES (375px):
1. ...

RECOMMENDATIONS:
1. ...
```

Output as one message in chat. Henry will paste somewhere obvious.

---

## PART 4 — Competitive pricing research (~25 min)

Build a fresh, accurate competitor pricing intelligence doc. Henry's pitch deck claims certain prices but those need verifying on actual sales pages.

### Visit and verify

For each, find their CURRENT public pricing as of today:

- Lofty (lofty.com) — what plans, what monthly cost, what's included, what's "contact sales" only?
- Follow Up Boss (followupboss.com) — Grow / Pro / Platform plans, exact prices
- KvCore by Inside Real Estate (insiderealestate.com/kvcore) — base + seat pricing
- Real Geeks (realgeeks.com) — current plans
- LionDesk (liondesk.com) — current pricing
- Top Producer (topproducercrm.com) — verify if still active
- BoomTown (boomtownroi.com) — enterprise tier, get any public info

For each: list the lowest publicly-advertised monthly price, the highest, what's included at the low tier vs high tier, and whether they have a free trial.

Also research a few adjacent tools Brikk replaces:
- Calendly base plan
- BombBomb base plan
- DocuSign Real Estate plan
- Mojo Dialer

### Output

```
COMPETITIVE INTELLIGENCE — [timestamp]

DIRECT CRM COMPETITORS:

Lofty: 
- Pricing: [...]
- What's included low tier: [...]
- What's locked behind contact-sales: [...]
- Free trial: [...]
- Page URL: [...]

[repeat for each]

ADJACENT TOOLS BRIKK REPLACES:

Calendly:
- Cheapest paid: [$X/mo]
- Real estate use case angle: ...
- How Brikk replaces it: showings booking page (in roadmap)

[repeat]

PRICING ANCHOR POINTS:
- Cheapest competitor: [name + price]
- Average competitor: [calculate]
- Brikk vs average: [diff + percentage]
- "Replace 4 tools" calculation: sum of cheapest paid plan of Calendly + BombBomb + a CRM + DocuSign = $X. Brikk replaces all 4 at $69.99. Saves $Y/month.

KEY INSIGHT FOR PITCH DECK:
[One paragraph identifying the most exploitable pricing weakness in the competitive landscape — e.g., "Lofty's $449 minimum and 12-month contract is the biggest weakness; we attack that directly with monthly + no commitment."]
```

---

## When you finish all four parts

Send one final summary message:

```
ALL FOUR PARTS COMPLETE

Pitch deck: ~[N] words, ready to paste at pitch/brikk-pitch-deck.md
This-Week: ready to paste at THIS-WEEK.md (repo root)
Audit: [N] new bugs found, [N] copy issues, [N] mobile issues
Competitive: [N] competitors researched, [N] adjacent tools

Total time spent: [N hours]

Henry's recommended next actions:
1. [based on what you found]
2. [...]
```

Then stop. Don't keep working. Don't suggest more.

---

## Reminder for the bot

You can't write to Henry's filesystem. Every deliverable is a chat message he pastes into his repo manually. Don't try to commit — you'll fail. Just write excellent documents. The pitch deck is the most leveraged thing you produce tonight.

Begin Part 1 now.

# Investor + brokerage-partner FAQ

The questions investors and brokerage partners actually ask. Brief, honest, specific. Pair with `pitch/brikk-pitch-deck.md` for the slide deck.

---

## 1. What is Brikk in one sentence?

The AI transaction coordinator for solo real estate agents — replaces a $300-500/month CRM plus a $300-400/deal coordinator with one app at $69.99/month.

## 2. Who is this for?

Solo real estate agents (1-3 deals/year up to 30+) and small teams (1-10 agents). Not built for large brokerages, lender networks, or non-real-estate use cases — those would dilute the focus that makes Brikk useful for the actual buyer.

## 3. What's the market size?

US: ~1.5M licensed real estate agents (NAR data). Of those, ~600k are active full-time. Median income $51k/year. Most pay $200-500/month for one or more CRM/lead-gen tools. Brikk's addressable opportunity (assuming 5% capture of active full-time agents at $69.99/month): $25M ARR. That's a real business, not a venture-scale one — but the brokerage Team/Agency plan opens 10x that.

## 4. Who's the competition?

The legacy CRMs (Lofty/$449+, Follow Up Boss/$99-499, KvCore/$399, Real Geeks/$299, BoomTown/enterprise) and the cheap alternatives (LionDesk/$39, Wise Agent/$32). None are AI-native. Brikk's wedge is AI + price, in that order. The 12-row feature comparison is in the pitch deck — Brikk is the only product with all 12 capabilities under $100/month.

## 5. What's the moat?

Four overlapping moats, in order of strength:

1. **Data moat** — the AI improves with each agent's use (drafts learn their voice, sentiment improves, response-time patterns get sharper). After 90 days of use, switching to a competitor restarts from zero. After 180 days, the model knows the agent better than the agent knows themselves.
2. **Compound feature moat** — birthdays + anniversaries + referral ledger + voice-to-CRM together form habit loops competitors don't have the focus to replicate. Each individual feature is small; together they create daily-use stickiness.
3. **Pricing moat** — Brikk's 91% gross margin at $69.99 (real numbers, see pitch deck section 6) means legacy competitors at $300+ can't price-match without rebuilding their cost structure. Their AI integration costs are higher because they don't own the prompt engineering.
4. **TCPA / compliance moat** — Brikk uses native phone `sms:` deep-link sending, which sidesteps A2P 10DLC carrier registration entirely. Competitors with server-side SMS (Twilio) carry that liability + paperwork burden. As TCPA enforcement tightens, this gap widens.

## 6. What's the business model?

SaaS subscription. Three tiers:
- **Pro** ($69.99/month) — solo agents
- **Team** ($160/month) — up to 5 agents
- **Agency** (custom) — brokerages, 25+ seats, white-label option

All include 14-day free trial. No setup fee (removed May 2026). Payments via Stripe.

Future revenue lines (not in v1):
- Closing-gift partnership commissions (~10-20% per gift sent)
- Lead marketplace (agents sell each other referrals through Brikk's network)
- Brokerage white-label licensing fees ($1k-5k/year per brokerage on top of per-seat)

## 7. What are the unit economics?

(All figures from real measured costs at current pricing pages, see pitch deck section 6.)

- **Variable cost per user per month:** ~$6.20 (Anthropic AI + Supabase + Stripe + Resend + Vercel + misc)
- **Gross margin at $69.99:** ~91%
- **CAC** (year 1, mostly organic + referral): ~$50
- **LTV** (12-month rolling at expected churn): ~$840
- **LTV/CAC ratio:** 16:1 (industry benchmark: 3:1 good, 5:1 great)
- **Payback period:** <1 month

Industry SaaS average gross margin is 70-80%. Brikk's 91% is above average due to lean stack + AI cost discipline (prompt engineering keeps token usage tight).

## 8. What's the year-1 plan?

Three phases:

- **Q2 2026 (months 1-3):** Door-knock SoCal agencies (Henry's geographic base). Lead capture link is the trojan horse — agents try the free signup, see value, convert.
- **Q3 2026 (months 4-6):** Referral flywheel + Instagram content. Every paying agent gets a referral link.
- **Q4 2026 (months 7-12):** Content marketing + brokerage outreach for Team/Agency plans.

Conservative target: 400 paying customers by month 12 = $336k ARR. Aggressive: 1,000 customers = $840k ARR.

## 9. Why now?

Anthropic Claude Sonnet 4.5 hit a price/quality threshold in late 2024 that makes per-agent AI cost economically viable below $10/user/month. The same build was impossible 2 years ago — token costs would have eaten the margin. This is a real "infrastructure made this possible" moment.

Separately, real estate agents are in a margin squeeze (commission compression from 2024 settlement) and looking for tools to replace assistants they can't afford. Brikk hits the moment.

## 10. Why you?

Founder Henry Desrosier — Southern California, real-estate-adjacent context. The product was originally built to solve his own observed problem. Founder-product-fit > founder-market-fit on day one of a product company.

(For deeper bio, see `pitch/brikk-pitch-deck.md` section 11.)

## 11. What if a big competitor (Lofty, Compass, eXp) clones this?

Likely they'll try. Mitigations:
1. **Speed** — solo founder can ship faster than a 50-engineer org. By the time they clone v1, we're on v3.
2. **Voice-to-CRM is the killer** — agents in cars need this. Competitors don't have the focus to ship it well.
3. **Network effects** — once referral network is built (v3 roadmap), Brikk users have a captive ecosystem.
4. **Brand equity** — "built by realtors for realtors" + concrete results (testimonials with deal numbers) build trust competitors can't manufacture.

Apple/Google could clone the AI features but won't bother — real estate CRM isn't their TAM.

## 12. What if AI costs spike?

Mitigation in priority order:
1. Brikk owns the prompts. Tightening token counts cuts API spend by 30-50% without UX impact. We're not at that ceiling yet.
2. Switching to a cheaper model (Claude Haiku for sentiment, GPT-4o-mini for non-creative tasks) is a config change, not a rebuild.
3. Hard usage limits per user. Pro plan today is uncapped; we can introduce daily draft quotas without breaking the value proposition.

We model variable cost at $6.20/user. Even 2x AI cost increase still leaves 82% gross margin.

## 13. What about TCPA / legal liability?

Brikk uses native `sms:` deep-link sending — outbound texts open the user's phone Messages app and send from their own number. No server-side SMS sending. This sidesteps:
- A2P 10DLC carrier registration
- Per-lead opt-in tracking (the user manages their own consent)
- Brand verification requirements

Inbound consent is captured at the lead capture form (`/r/CODE`) with full TCPA disclosure language. Agents see what consents were collected with each lead.

Worst-case scenario for liability: an agent uses Brikk to send promotional messages without consent. That's their liability, not Brikk's — same as if they sent it from a vanilla phone. Brikk's Terms of Service makes this explicit.

## 14. What about GDPR / CCPA?

Brikk has GDPR + CCPA section in the Privacy Policy. User can request data export or deletion via `hello@brikk.store`. Compliance is straightforward because:
- Brikk is primarily a US product (target market)
- Data lives in Supabase (US-East by default; EU region available if needed)
- No tracking, no data resale, no third-party sharing beyond processors (Anthropic, Stripe, Resend) who are themselves SCC-compliant

For EU agents (rare given target market): can be served from Supabase's EU region with minimal config change.

## 15. What about iOS / Android apps?

iOS app: in progress (Q2 2026 target). Capacitor wrapper around the same web codebase — same updates, same features. Submission via App Store handled by a contracted iOS dev under Henry's Apple Developer account.

Android app: same approach, Q2 2026 follow-up.

Why not native? Cost-benefit. Native would take 6+ months and require maintaining two parallel codebases. Capacitor ships in 2 weeks with 95% of the native feel.

## 16. What's the exit strategy?

Honest answer: not focused on it yet. Right buyer would be a real estate technology aggregator (e.g., Inside Real Estate, Anywhere Real Estate) that wants AI-native product + small but growing customer base. Realistic exit at year 3-5: $50-200M depending on growth.

Not interested in early acquisition by a non-strategic. Brikk is meant to be the dominant solo-agent CRM, not a feature inside someone else's suite.

## 17. What does fundraising look like?

To be determined based on conversation:
- **Bootstrapping** through month 12 if revenue ramp matches conservative scenario
- **Seed round** ($500k-1M) if aggressive ramp needs more marketing + hires (1 designer, 1 customer success)
- **Series A** at month 18-24 if Team/Agency plan starts pulling brokerages (need account managers + sales reps)

For now, Brikk is solo-founder + revenue-funded. Open to talking with seed investors who actually understand real estate technology.

## 18. What does a brokerage partnership look like?

Three shapes:

**Shape 1 — Custom Agency plan (per-seat).** Brokerage pays $X per agent per month. Agents get all features. Brikk handles support. Best for 25-100 seat brokerages.

**Shape 2 — White-label.** Brokerage gets the Brikk product under their brand. We provide infrastructure, they provide brand + sales. Best for 100+ seat brokerages with strong identity.

**Shape 3 — Revenue share / co-marketing.** Brokerage promotes Brikk to their agents; Brikk gives the brokerage X% of every paid signup. Best for tier-3 brokerages exploring AI without commitment.

Henry handles partnership conversations directly. Lead time from intro to signed deal: ~30 days.

## 19. What does Brikk NOT do?

Honest list of things explicitly out of scope:

- ❌ Replace your phone provider / phone number
- ❌ Server-side SMS sending (TCPA reasons)
- ❌ MLS integration (no public API, requires per-MLS broker credentials — on roadmap with email-parsing workaround)
- ❌ Listing syndication to Zillow/Realtor.com (those are MLS jobs)
- ❌ E-signature (DocuSign integration on roadmap)
- ❌ Showing service / lockbox integration (would require partner relationships)
- ❌ Commercial real estate (residential focus only for v1)

Saying no to these is what makes Brikk a tight product.

## 20. What about churn?

Expected churn at year 1: ~5%/month (industry SaaS average for SMB is 5-7%). Higher in the first 3 months (users who didn't fit), lower after that as the data moat compounds.

Mitigations:
- 14-day trial filters bad-fit signups before they pay
- Onboarding focus on "added 5 leads in week 1" — that's the activation threshold
- Customer success outreach within 48h of every paid signup
- Public roadmap shows responsiveness to feature requests, building loyalty

## 21. What about international expansion?

Year 2-3 question. Real estate is highly localized — MLS systems, regulations, broker structures all differ by country. Initial expansion targets if we go international: Canada (similar regulations), UK (different but English-speaking), Australia.

Each expansion is a 3-6 month project to localize legal/regulatory copy, payment processing, and tax handling. Not worth doing before $1M ARR in the US.

## 22. What if you can't get to 400 customers in year 1?

Honest answer: Brikk is profitable at much lower customer counts because of the 91% gross margin and Henry's bootstrap model (no payroll yet). 100 customers at $69.99 = $7k/month MRR = enough to keep building and pay one part-time customer success person.

The risk isn't running out of money — it's running out of patience. As long as growth is monotonic (each month > previous month), the long-term wins.

## 23. Due diligence checklist — what's available

For serious investors, the following materials are available under NDA:

- Full pitch deck (`pitch/brikk-pitch-deck.md`)
- Financial model spreadsheet (annual projection, unit economics)
- Customer interviews (3-5 early customers — happy to set up calls)
- Live product demo (Henry walks through every feature in 30 min)
- Source code review (architecture overview in `ARCHITECTURE.md`)
- Database schema (`SCHEMA-REFERENCE.md`)
- Compliance + security overview (`OPERATIONS-RUNBOOK.md`)
- Competitor research (in pitch deck section 8 + research notes)
- Marketing materials (`marketing/` folder PDFs)

## 24. What about ethics around AI in real estate?

Reasonable question. Brikk's AI:
1. **Drafts messages** — agent approves/edits before sending. Never auto-sends. Human in the loop.
2. **Reads conversation history** — passes data to Anthropic's API. Anthropic doesn't train on this data (we use the API, not the consumer Claude product). Privacy Policy discloses this.
3. **Flags risk + sentiment** — these are aids, not decisions. Agent retains all judgment.

What Brikk's AI never does:
- Discriminate by protected class (no facial recognition, no demographic inference)
- Suggest exclusionary messages (Fair Housing guardrails in the prompt)
- Auto-execute on financial decisions

If Apple/Google/Anthropic introduce features that change this (e.g., automatic personalization based on inferred demographics), Brikk would not implement them.

---

## Last updated

May 21, 2026. Add new questions here as they come up in investor / brokerage conversations.

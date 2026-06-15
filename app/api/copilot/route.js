import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const MODEL = 'claude-sonnet-4-5'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verify the caller is a signed-in user. Returns the user, or null.
// Used to gate the expensive AI modes (everything except the public help_chat).
async function verifyUser(request) {
  if (!supabaseUrl || !anonKey) return null
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  try {
    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user } } = await client.auth.getUser(token)
    return user || null
  } catch {
    return null
  }
}

async function callClaude(body) {
  if (!ANTHROPIC_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Anthropic ${res.status}: ${text}`)
  }
  return res.json()
}

function safeJson(s) {
  try {
    return JSON.parse(String(s || '').replace(/```json|```/g, '').trim())
  } catch {
    return null
  }
}

export async function POST(request) {
  try {
    const body = await request.json()

    // Auth gate: every mode EXCEPT help_chat (the public landing-page chat)
    // requires a signed-in user. Without this, anyone could spam our Anthropic
    // budget with unlimited requests (denial-of-wallet).
    if (body.mode !== 'help_chat') {
      const user = await verifyUser(request)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // --- Multi-action voice extraction ---
    // One voice note can produce multiple actions: log an outbound message you sent, log an
    // inbound reply you got, update profile fields on the lead, add a generic interaction note.
    // The agent reviews each action in the UI and applies what's correct.
    if (body.mode === 'voice_extract') {
      const { transcript } = body
      if (!transcript) return NextResponse.json({ extraction: null })

      try {
        const data = await callClaude({
          model: MODEL,
          max_tokens: 900,
          messages: [
            {
              role: 'user',
              content: `You are an AI assistant for a real estate agent's CRM. The agent is recording a quick voice note about what just happened or what's going on with a lead. Your job is to parse the voice note into a structured list of distinct actions.

Voice transcript:
"""
${transcript}
"""

Listen for these signals and produce one or more actions:

1. OUTBOUND_MESSAGE — phrases like "I texted [name]", "I messaged her", "I sent him", "I told her", "I emailed", "I called and said", "let her know" all mean the agent is reporting a message THEY sent. The content is what they sent.

2. INBOUND_MESSAGE — phrases like "she replied", "he responded", "she said", "he told me", "she texted back", "I just got a message from", "her response was" all mean the LEAD said something to the agent.

3. PROFILE_UPDATE — phrases like "she's pre-approved at X", "budget is Y", "looking for 3 bedrooms in Z", "their timeline shifted", "her phone is", "his email is" mean specific fields on the lead's profile should be updated.

4. INTERACTION — generic activity that isn't a message: a showing, a call, an in-person meeting, an offer event. Use this when no message content is involved.

5. NEW_LEAD — only if the agent explicitly says this is a brand-new contact (e.g., "new lead Jane Smith" or "just met someone named John, never talked before").

CRITICAL:
- The same voice note can produce multiple actions. A note like "Texted Sarah we have 3 new listings — she replied she's free Thursday at 2pm — her budget is now $475K" produces THREE actions: outbound_message, inbound_message, profile_update.
- The lead_name should be repeated on each action (so each action stays attached to the right person if the voice note mentions multiple people).
- For outbound/inbound messages, quote what was actually said as the content. Clean it up to proper sentences but don't paraphrase.
- For profile_update, only include fields you're confident about. Valid fields: price_range, temperature, stage, lead_type, phone, email, preferred_area, bedrooms, pre_approved, pre_approved_amount, timeline, contact_preference, notes.
- For temperature: hot | warm | cold.
- For stage: New Lead | Contacted | Showing Scheduled | Offer Submitted | Under Contract | Closed Won | Closed Lost.
- For lead_type: Buyer | Seller.

Return ONLY valid JSON in this exact shape:
{
  "lead_name": "best-guess full name (first + last if available, else first only). null if no name detected.",
  "is_new_lead": true | false,
  "actions": [
    {
      "type": "outbound_message",
      "lead_name": "Sarah Mitchell",
      "content": "Hi Sarah, just wanted to share 3 new listings...",
      "channel": "text" | "email" | "phone" | "in_person"
    },
    {
      "type": "inbound_message",
      "lead_name": "Sarah Mitchell",
      "content": "I'm free Thursday at 2pm",
      "channel": "text" | "email" | "phone" | "in_person"
    },
    {
      "type": "profile_update",
      "lead_name": "Sarah Mitchell",
      "fields": { "price_range": "$475K", "timeline": "ASAP" }
    },
    {
      "type": "interaction",
      "lead_name": "Sarah Mitchell",
      "kind": "showing" | "call" | "meeting" | "offer" | "other",
      "notes": "Brief description"
    }
  ],
  "raw": "cleaned-up transcript"
}

If you can't extract anything structured, return:
{ "lead_name": null, "is_new_lead": false, "actions": [], "raw": "transcript cleaned up" }

Return ONLY the JSON object, no markdown, no commentary.`,
            },
          ],
        })
        const text = data.content?.[0]?.text || '{}'
        const parsed = safeJson(text)
        if (!parsed || !Array.isArray(parsed.actions)) {
          // Fall back: at least save the raw transcript as a generic interaction
          return NextResponse.json({
            extraction: {
              lead_name: parsed?.lead_name || null,
              is_new_lead: false,
              actions: [],
              raw: transcript,
              note: 'Could not extract structured actions.',
            },
          })
        }
        // Ensure each action has lead_name (default to top-level lead_name)
        parsed.actions = parsed.actions.map(a => ({
          ...a,
          lead_name: a.lead_name || parsed.lead_name || null,
        }))
        return NextResponse.json({ extraction: parsed })
      } catch (err) {
        console.error('voice_extract error:', err.message)
        return NextResponse.json({
          extraction: {
            lead_name: null,
            is_new_lead: false,
            actions: [],
            raw: transcript,
            note: 'AI temporarily unavailable — saved as raw note.',
          },
        })
      }
    }

    // --- Lead summary mode — 2-3 sentence "where this lead is at" digest ---
    if (body.mode === 'lead_summary') {
      const { lead } = body
      if (!lead) return NextResponse.json({ summary: null })

      const msgs = (lead.recent_messages || []).map(m => `${m.direction === 'outbound' ? 'You' : 'They'}: "${m.content}"`).join('\n')
      const acts = (lead.recent_interactions || []).map(i => `- ${i.interaction_type}: ${i.notes || ''}`).join('\n')
      const profileLines = [
        `Type: ${lead.lead_type || 'Buyer'}`,
        `Source: ${lead.source || 'Unknown'}`,
        `Temperature: ${lead.temperature || 'warm'}`,
        `Stage: ${lead.stage || 'New Lead'}`,
        `Price range: ${lead.price_range || 'Not specified'}`,
        `Preferred area: ${lead.preferred_area || 'Not specified'}`,
        `Bedrooms: ${lead.bedrooms || 'Not specified'}`,
        `Pre-approved: ${lead.pre_approved ? 'Yes' + (lead.pre_approved_amount ? ' at ' + lead.pre_approved_amount : '') : 'No'}`,
        `Timeline: ${lead.timeline || 'Not specified'}`,
      ].join('\n')

      try {
        const data = await callClaude({
          model: MODEL,
          max_tokens: 250,
          messages: [
            {
              role: 'user',
              content: `Summarize where this real estate lead is at, in 2–3 sentences. Be concrete and useful — name what they want, where the relationship stands, and what the next move should be. No fluff, no "this client appears to be." Write like a colleague briefing the agent in the car.

Lead: ${lead.name}
Days since last contact: ${lead.last_contact_date ? Math.floor((Date.now() - new Date(lead.last_contact_date).getTime()) / 86400000) : 'unknown'}

Profile:
${profileLines}

Notes: ${lead.notes || 'None'}

Recent messages (oldest → newest):
${msgs || 'None'}

Recent activity:
${acts || 'None'}

Respond with ONLY the summary text. No preamble, no headers, no JSON.`,
            },
          ],
        })
        const text = data.content?.[0]?.text?.trim() || ''
        return NextResponse.json({ summary: text })
      } catch (err) {
        console.error('lead_summary error:', err.message)
        return NextResponse.json({ summary: null, error: 'ai_unavailable' })
      }
    }

    // --- Chat-history paste parser ---
    // Agent pastes raw text from an iMessage / WhatsApp export. We parse out direction + content per line.
    if (body.mode === 'parse_chat_history') {
      const { transcript, agentName } = body
      if (!transcript) return NextResponse.json({ messages: [] })

      try {
        const data = await callClaude({
          model: MODEL,
          max_tokens: 1500,
          messages: [
            {
              role: 'user',
              content: `You're an AI assistant for a real estate CRM. The agent is pasting in an existing text-message conversation with a lead. Your job is to parse it into a structured chronological list of messages, classified as outbound (agent → lead) or inbound (lead → agent).

The agent's name is: ${agentName || 'the agent'}.

Pasted conversation:
"""
${transcript}
"""

Rules:
- A line that looks like an outbound message (the agent's tone, agent's name, "me:" prefix, right-aligned in iMessage exports) → direction "outbound".
- A line that looks like an inbound message (the lead's name, "them:" prefix, left-aligned) → direction "inbound".
- Skip timestamp lines, "Delivered" / "Read" indicators, and other chat-export metadata.
- Combine multi-line messages from the same sender into a single message.
- Preserve order — output in the order the messages were sent.

Return ONLY valid JSON:
{
  "messages": [
    { "direction": "outbound" | "inbound", "content": "the message text" },
    ...
  ]
}

Return ONLY the JSON.`,
            },
          ],
        })
        const text = data.content?.[0]?.text || '{}'
        const parsed = safeJson(text)
        if (!parsed || !Array.isArray(parsed.messages)) {
          return NextResponse.json({ messages: [], error: 'parse_failed' })
        }
        // Sanitize each item
        const messages = parsed.messages
          .filter(m => m && (m.direction === 'inbound' || m.direction === 'outbound') && typeof m.content === 'string' && m.content.trim())
          .map(m => ({ direction: m.direction, content: m.content.trim().slice(0, 2000) }))
        return NextResponse.json({ messages })
      } catch (err) {
        console.error('parse_chat_history error:', err.message)
        return NextResponse.json({ messages: [], error: 'ai_unavailable' })
      }
    }

    // --- Landing-page help chat ---
    // ---------- Sentiment analysis ----------
    // Given a message body, classify the tone as warm / cool / frustrated / neutral.
    // Used to auto-tag inbound messages so the agent knows when a relationship
    // is cooling before reading the full thread.
    if (body.mode === 'sentiment') {
      const { text } = body
      if (!text || String(text).trim().length < 3) {
        return NextResponse.json({ sentiment: 'neutral' })
      }
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-5',
            max_tokens: 30,
            messages: [{
              role: 'user',
              content: `Classify this short message's tone from a real estate buyer/seller writing to their agent.

Message: "${String(text).slice(0, 800)}"

Return ONE word, lowercase, no punctuation, one of:
warm        — engaged, positive, moving forward
cool        — short, transactional, possibly disengaging
frustrated  — irritated, complaints, confused, urgent
neutral     — informational, no clear signal

Reply with ONLY the single word.`
            }],
          }),
        })
        const data = await res.json()
        const raw = (data.content?.[0]?.text || '').trim().toLowerCase()
        const allowed = ['warm', 'cool', 'frustrated', 'neutral']
        const sentiment = allowed.find(s => raw.startsWith(s)) || 'neutral'
        return NextResponse.json({ sentiment })
      } catch (err) {
        console.error('sentiment classification failed:', err?.message)
        return NextResponse.json({ sentiment: 'neutral' })
      }
    }

    if (body.mode === 'help_chat') {
      const { question } = body
      if (!question) return NextResponse.json({ answer: 'Ask me anything about Brikk.' })

      const q = String(question).toLowerCase()
      const fallbacks = {
        'price|cost|how much|pricing|expensive|cheap|afford':
          `Brikk Pro is $69.99/month for solo agents, Teams is $160/month for up to 5 agents. No setup fee. Your first 14 days are completely free — no credit card needed.`,
        'what is brikk|what does brikk do|point of this|purpose':
          `Brikk is the one screen you open every morning that tells you exactly what to do. It tracks your leads, drafts your follow-up messages with AI, manages your deals to closing, and shows you which marketing channels actually work.`,
        'feature|what can it do|capabilities|tools':
          `Brikk includes: AI Copilot for drafted follow-ups, Lead Pipeline with 18 realtor-specific fields, Deal Tracker with stage progression, Smart Calendar auto-populated from your pipeline, Marketing ROI analytics, in-app SMS Messages, Voice-to-CRM, and a Lead Capture Link for your business card.`,
        'trial|free|try it|test|demo':
          `Yes — 14 days completely free with full access to every feature. No credit card required. Sign up at brikk.store/login.`,
        'safe|security|data|privacy|secure':
          `Your data is protected by Supabase row-level security — each agent only sees their own data. Everything is encrypted in transit. We never sell your data.`,
        'cancel|contract|commitment':
          `No contracts, cancel anytime in Settings → Billing. Your data is preserved for 30 days after cancellation.`,
        'how.*(start|begin|sign|set)|get started|setup':
          `Sign up at brikk.store/login, add your first few leads, then open AI Copilot to see your first drafted follow-ups. Setup takes about five minutes.`,
        'install|download|home screen|add to home|web app|pwa|native|app store':
          `On iPhone: open brikk.store in Safari → Share button → "Add to Home Screen". On Android: open brikk.store in Chrome → menu → "Install App". The icon installs like a native app.`,
      }

      for (const [pattern, answer] of Object.entries(fallbacks)) {
        if (new RegExp(pattern, 'i').test(q)) return NextResponse.json({ answer })
      }

      try {
        const data = await callClaude({
          model: MODEL,
          max_tokens: 300,
          system: `You are the AI assistant on Brikk's website (brikk.store), an AI-powered command center for real estate agents.

Key facts:
- Price: $69.99/mo Pro, $160/mo Teams (up to 5 seats), no setup fee, 14-day free trial.
- Features: AI Copilot, Lead Pipeline (18 fields), Deal Tracker, Smart Calendar, Marketing ROI, in-app SMS, Voice-to-CRM, Lead Capture Link.
- Competitors charge $300-500/mo.
- Works on iPhone, Android, desktop.
- Data secured with row-level security. Never sold.

Tone: warm, concise, honest. 2-3 sentences max unless they ask for detail. If unsure, say "Reach out to hello@brikk.store and we'll help you out."`,
          messages: [{ role: 'user', content: question }],
        })
        const text = data.content?.[0]?.text
        if (text) return NextResponse.json({ answer: text })
      } catch (err) {
        console.error('help_chat error:', err.message)
      }
      return NextResponse.json({
        answer:
          "Brikk is the AI command center for real estate agents — $69.99/mo with a 14-day free trial, no setup fee. What would you like to know — features, pricing, or how to get started?",
      })
    }

    // --- Draft generation mode (default) ---
    const { leads, agentName } = body
    if (!leads || leads.length === 0) return NextResponse.json({ drafts: [] })

    const drafts = []

    // Cap at 20 to keep one request from running too long or burning too many
    // tokens. If more leads need follow-ups, the UI surfaces a "x more leads
    // pending — generate again" message based on the returned `truncated` flag.
    const MAX_DRAFTS_PER_CALL = 20
    const truncated = leads.length > MAX_DRAFTS_PER_CALL
    for (const lead of leads.slice(0, MAX_DRAFTS_PER_CALL)) {
      const daysSinceContact = lead.days_since_contact || 0

      let historyContext = ''
      if (lead.recent_messages?.length) {
        historyContext =
          '\n\nPrevious messages (most recent first, includes hour-of-day for response pattern analysis):\n' +
          lead.recent_messages
            .map(m => {
              const dir = m.direction === 'outbound' ? 'You sent' : 'They replied'
              const d = new Date(m.created_at)
              const date = d.toLocaleDateString()
              const hour = d.getHours()
              const hourLabel = `${hour % 12 || 12}${hour < 12 ? 'am' : 'pm'}`
              return `- ${dir} ${date} @${hourLabel}: "${m.content}"`
            })
            .join('\n')
      }

      // Analyze the lead's reply timing — what hours have they historically responded?
      // We surface this as a "best time" hint in the draft so the agent knows when to send.
      let bestTimeHint = null
      if (lead.recent_messages?.length >= 2) {
        const inboundHours = lead.recent_messages
          .filter(m => m.direction === 'inbound')
          .map(m => new Date(m.created_at).getHours())
        if (inboundHours.length >= 2) {
          const avg = Math.round(inboundHours.reduce((a, b) => a + b, 0) / inboundHours.length)
          const label = `${avg % 12 || 12}${avg < 12 ? 'am' : 'pm'}`
          bestTimeHint = `This lead typically replies around ${label} — consider sending near that window.`
        }
      }
      let interactionContext = ''
      if (lead.recent_interactions?.length) {
        interactionContext =
          '\n\nRecent interactions:\n' +
          lead.recent_interactions
            .map(i => {
              const date = new Date(i.created_at).toLocaleDateString()
              return `- ${i.interaction_type} (${date}): ${i.notes || 'No notes'}`
            })
            .join('\n')
      }
      const hasHistory = !!(lead.recent_messages?.length || lead.recent_interactions?.length)
      const replyingTo = lead.replying_to ? String(lead.replying_to).slice(0, 500) : null

      // Find the most recent inbound message — useful even when not explicitly replying.
      const lastInbound = (lead.recent_messages || []).find(m => m.direction === 'inbound')
      const lastInboundText = lastInbound?.content || null

      const prompt = `You are an AI assistant for a real estate agent named ${agentName || 'Alex'}, writing on their behalf to one of their leads.

Goal: produce ONE short follow-up message (SMS-ready, max 40 words) that moves this relationship forward.

VOICE RULES — non-negotiable:
- Sound like a real human agent who knows this person. Warm, specific, low-pressure.
- Use the lead's first name once, naturally.
- NEVER use: "just checking in", "just following up", "touching base", "circling back", "hope this finds you well", "wanted to reach out".
- NEVER re-introduce yourself if there's prior history.
- Reference something specific from their context (price range, area, timeline, pre-approval status, a thing they said in a prior message) so it doesn't feel templated.
- If they asked a question in a prior message, answer it or commit to answering it.
- End with a soft next step — a question, a time, a yes/no the lead can reply to quickly.

${replyingTo
  ? `CRITICAL — DIRECT REPLY MODE:
You are writing the next message in an active back-and-forth. The lead's most recent message was:
"${replyingTo}"
Your response MUST address what they said. Do not pivot to a generic check-in. If they asked a question, answer it. If they suggested a time, confirm or counter. If they expressed hesitation, acknowledge it.`
  : hasHistory
    ? `CRITICAL — CONTINUATION MODE:
This is NOT a first contact. Read the conversation history below carefully. Your message must continue naturally from the most recent exchange. Do not repeat what's already been said. ${lastInboundText ? `The lead's last message to you was: "${lastInboundText}". If that message contained a question or commitment, this draft must respond to it.` : ''}`
    : `FIRST CONTACT MODE:
You're reaching out for the first time, or there's no logged history yet. Introduce yourself briefly. State one specific reason you're reaching out (their source, their stated need, your local expertise). Make the ask small.`
}

LEAD CONTEXT:
- Name: ${lead.name}
- Buyer or Seller: ${lead.lead_type || 'Buyer'}
- How they came in: ${lead.source || 'Unknown source'}
- Temperature: ${lead.temperature || 'warm'}
- Pipeline stage: ${lead.stage || 'New Lead'}
- Price range: ${lead.price_range || 'Not specified'}
- Days since you last contacted them: ${daysSinceContact}
- Preferred area: ${lead.preferred_area || 'Not specified'}
- Bedrooms wanted: ${lead.bedrooms || 'Not specified'}
- Pre-approved: ${lead.pre_approved ? 'Yes' + (lead.pre_approved_amount ? ' at ' + lead.pre_approved_amount : '') : 'Not on file'}
- Timeline: ${lead.timeline || 'Not specified'}
- Contact preference: ${lead.contact_preference || 'text'}
- Notes: ${lead.notes || 'None'}${historyContext}${interactionContext}

URGENCY HINT:
${lead.temperature === 'hot' && daysSinceContact >= 2 ? '⚠ Hot lead, gone cold for several days. Create urgency without being pushy.' : ''}
${daysSinceContact >= 7 ? '⚠ Long gap since contact. Acknowledge the time gap honestly or offer a clear reason for reaching out now (new listings, market shift, an answer to a question they asked).' : ''}
${(lead.recent_messages || []).filter(m => m.direction === 'inbound').length >= 2 ? '📈 They\'ve been actively engaging. Match their energy — be more direct, suggest a concrete next step like a showing time.' : ''}

Respond with ONLY a valid JSON object. No markdown, no commentary.
{
  "message": "the SMS-ready draft",
  "reason": "one sentence on why this message, why now, and what signal from their history shaped it"
}`

      const fallback = () => ({
        lead_id: lead.id,
        lead_name: lead.name,
        lead_type: lead.lead_type,
        temperature: lead.temperature,
        source: lead.source,
        stage: lead.stage,
        days_since_contact: daysSinceContact,
        channel: daysSinceContact > 7 ? 'Email' : 'Text',
        urgency: 'medium',
        draft: `Hi ${lead.name}, this is ${agentName || 'Alex'}. Wanted to reach out${lead.price_range ? ' about properties in the ' + lead.price_range + ' range' : ''} — I have a few options I think you'd want to see. Got a few minutes this week?`,
        reason: `${daysSinceContact} days without contact. Auto-generated fallback — please edit before sending.`,
      })

      try {
        const data = await callClaude({
          model: MODEL,
          max_tokens: 220,
          messages: [{ role: 'user', content: prompt }],
        })
        const text = data.content?.[0]?.text || ''
        const parsed = safeJson(text)
        const draftMessage = parsed?.message || ''
        const draftReason = parsed?.reason || `${daysSinceContact} days since contact.`

        if (!draftMessage) {
          drafts.push(fallback())
          continue
        }

        drafts.push({
          lead_id: lead.id,
          lead_name: lead.name,
          lead_type: lead.lead_type,
          temperature: lead.temperature,
          source: lead.source,
          stage: lead.stage,
          days_since_contact: daysSinceContact,
          channel: daysSinceContact > 7 ? 'Email' : 'Text',
          urgency:
            lead.temperature === 'hot' && daysSinceContact >= 2 ? 'high'
            : daysSinceContact >= 5 ? 'high'
            : daysSinceContact >= 3 ? 'medium'
            : 'low',
          draft: draftMessage,
          reason: draftReason,
          best_time_hint: bestTimeHint,
        })
      } catch (err) {
        console.error('Draft generation failed for', lead.name, err.message)
        drafts.push(fallback())
      }
    }

    return NextResponse.json({
      drafts,
      truncated,
      totalCandidates: leads.length,
      generatedCount: drafts.length,
    })
  } catch (error) {
    console.error('Copilot API error:', error)
    return NextResponse.json({ error: 'Failed to generate drafts' }, { status: 500 })
  }
}

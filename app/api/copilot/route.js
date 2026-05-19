import { NextResponse } from 'next/server'

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const MODEL = 'claude-sonnet-4-5'

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

    // --- Voice-to-CRM extraction ---
    if (body.mode === 'voice_extract') {
      const { transcript } = body
      if (!transcript) return NextResponse.json({ extraction: null })

      try {
        const data = await callClaude({
          model: MODEL,
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: `You are an AI assistant for a real estate agent's CRM. Extract structured data from this voice note. The agent is talking about their leads, showings, offers, or general real estate business.

Voice transcript: "${transcript}"

Instructions:
- If a person's name is mentioned, always put it in "lead_name" (assume they're an existing lead unless clearly new)
- Extract what happened or needs to happen as the "action"
- Look for prices, addresses, property details
- Determine if the lead is a Buyer or Seller
- Detect urgency and suggest a temperature (hot/warm/cold)
- Detect what stage they're in (New Lead, Contacted, Showing, Offer Sent, Under Contract, Closing)
- Clean up the transcript into proper sentences for "raw"

Return ONLY valid JSON:
{
  "lead_name": "full name of the person mentioned (first and last if available)",
  "new_lead_name": "only if explicitly stated as a new/unknown contact, otherwise null",
  "action": "what was done or needs to be done",
  "price": "any price or budget mentioned",
  "notes": "clean 1-2 sentence CRM summary",
  "lead_type": "Buyer or Seller",
  "phone": "phone number if mentioned",
  "stage": "detected stage or null",
  "temperature": "hot, warm, or cold based on urgency",
  "raw": "cleaned up transcript"
}

Return ONLY the JSON, no other text.`,
            },
          ],
        })
        const text = data.content?.[0]?.text || '{}'
        const extraction = safeJson(text) || { raw: transcript, note: 'Could not extract structured data.' }
        return NextResponse.json({ extraction })
      } catch (err) {
        console.error('voice_extract error:', err.message)
        return NextResponse.json({
          extraction: { raw: transcript, note: 'AI temporarily unavailable — saved as raw note.' },
        })
      }
    }

    // --- Landing-page help chat ---
    if (body.mode === 'help_chat') {
      const { question } = body
      if (!question) return NextResponse.json({ answer: 'Ask me anything about Brikk.' })

      const q = String(question).toLowerCase()
      const fallbacks = {
        'price|cost|how much|pricing|expensive|cheap|afford':
          `Brikk Pro is $75/month for solo agents, Teams is $200/month for up to 5 agents, plus a one-time $125 setup fee. Your first 45 days are completely free — no credit card needed.`,
        'what is brikk|what does brikk do|point of this|purpose':
          `Brikk is the one screen you open every morning that tells you exactly what to do. It tracks your leads, drafts your follow-up messages with AI, manages your deals to closing, and shows you which marketing channels actually work.`,
        'feature|what can it do|capabilities|tools':
          `Brikk includes: AI Copilot for drafted follow-ups, Lead Pipeline with 18 realtor-specific fields, Deal Tracker with stage progression, Smart Calendar auto-populated from your pipeline, Marketing ROI analytics, in-app SMS Messages, Voice-to-CRM, and a Lead Capture Link for your business card.`,
        'trial|free|try it|test|demo':
          `Yes — 45 days completely free with full access to every feature. No credit card required. Sign up at brikk.store/login.`,
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
- Price: $75/mo Pro, $200/mo Teams (up to 5 seats), $125 one-time setup, 45-day free trial.
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
          "Brikk is the AI command center for real estate agents — $75/mo with a 45-day free trial. What would you like to know — features, pricing, or how to get started?",
      })
    }

    // --- Draft generation mode (default) ---
    const { leads, agentName } = body
    if (!leads || leads.length === 0) return NextResponse.json({ drafts: [] })

    const drafts = []

    for (const lead of leads.slice(0, 5)) {
      const daysSinceContact = lead.days_since_contact || 0

      let historyContext = ''
      if (lead.recent_messages?.length) {
        historyContext =
          '\n\nPrevious messages (most recent first):\n' +
          lead.recent_messages
            .map(m => {
              const dir = m.direction === 'outbound' ? 'You sent' : 'They replied'
              const date = new Date(m.created_at).toLocaleDateString()
              return `- ${dir} (${date}): "${m.content}"`
            })
            .join('\n')
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

      const prompt = `You are an AI assistant for a real estate agent named ${agentName || 'Alex'}.

Write a short, personalized follow-up message for this lead, sent as an SMS. Keep it under 40 words. Be warm and professional. Do NOT use phrases like "just checking in" or "just following up." Make it specific and actionable.

${hasHistory ? 'CRITICAL: This is NOT a first contact. Read the conversation history below carefully. Your message MUST continue the existing conversation naturally. Do NOT repeat anything already said. Do NOT re-introduce yourself.' : 'This is likely a first contact. Introduce yourself briefly and offer specific value.'}

Lead info:
- Name: ${lead.name}
- Type: ${lead.lead_type || 'Buyer'}
- Source: ${lead.source || 'Unknown'}
- Temperature: ${lead.temperature || 'warm'}
- Stage: ${lead.stage || 'New Lead'}
- Price Range: ${lead.price_range || 'Not specified'}
- Days Since Contact: ${daysSinceContact}
- Notes: ${lead.notes || 'None'}
- Preferred Area: ${lead.preferred_area || 'Not specified'}
- Bedrooms: ${lead.bedrooms || 'Not specified'}
- Pre-approved: ${lead.pre_approved ? 'Yes' + (lead.pre_approved_amount ? ' at ' + lead.pre_approved_amount : '') : 'Unknown'}
- Timeline: ${lead.timeline || 'Not specified'}
- Contact Preference: ${lead.contact_preference || 'text'}${historyContext}${interactionContext}

Respond with ONLY a JSON object, no markdown:
{"message":"...","reason":"one sentence why now"}`

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
          max_tokens: 200,
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
            lead.temperature === 'hot' && daysSinceContact >= 2
              ? 'high'
              : daysSinceContact >= 5
              ? 'high'
              : daysSinceContact >= 3
              ? 'medium'
              : 'low',
          draft: draftMessage,
          reason: draftReason,
        })
      } catch (err) {
        console.error('Draft generation failed for', lead.name, err.message)
        drafts.push(fallback())
      }
    }

    return NextResponse.json({ drafts })
  } catch (error) {
    console.error('Copilot API error:', error)
    return NextResponse.json({ error: 'Failed to generate drafts' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'

const ANTHROPIC_KEY = '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'

export async function POST(request) {
  try {
    const body = await request.json()

    // Voice-to-CRM extraction mode
    if (body.mode === 'voice_extract') {
      const { transcript } = body
      if (!transcript) return NextResponse.json({ extraction: null })

      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 500,
            messages: [{
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

Return ONLY the JSON, no other text.`
            }]
          })
        })
        const data = await res.json()
        const text = data.content?.[0]?.text || '{}'
        const clean = text.replace(/```json|```/g, '').trim()
        const extraction = JSON.parse(clean)
        return NextResponse.json({ extraction })
      } catch (err) {
        return NextResponse.json({ extraction: { raw: transcript, note: 'Could not extract structured data.' } })
      }
    }

    // Help chat mode — landing page AI assistant
    if (body.mode === 'help_chat') {
      const { question } = body
      if (!question) return NextResponse.json({ answer: "Ask me anything about Brikk!" })

      // Local fallback answers for common questions (works even if API fails)
      const q = question.toLowerCase()
      const fallbacks = {
        'price|cost|how much|pricing|expensive|cheap|afford': `Brikk Pro is $75/month for solo agents, and Teams is $200/month for up to 5 agents. There's a one-time $125 setup fee. Your first 45 days are completely free — no credit card needed.`,
        'what is brikk|what does brikk do|point of this|what.s the point|purpose|what is this': `Brikk is the one screen you open every morning that tells you exactly what to do. It tracks your leads, drafts your follow-up messages with AI, manages your deals to closing, and shows you which marketing channels actually work. Think of it as your personal assistant that never forgets a lead.`,
        'benefit|why should i|what will i get|help me|worth it|value': `Agents using a CRM close 26% more deals. Brikk goes further — it doesn't just store data, it tells you who to call and drafts the message for you. You stop losing leads to forgotten follow-ups, and you see exactly which marketing dollars are working. At $75/month, one extra closing pays for years of Brikk.`,
        'feature|what can it do|capabilities|tools': `Brikk includes: AI Copilot that drafts personalized follow-ups, Lead Pipeline with 18 realtor-specific fields, Deal Tracker with stage progression, Smart Calendar auto-populated from your pipeline, Marketing ROI analytics, Messages with SMS delivery, Voice-to-CRM (speak and AI extracts lead info), and a Lead Capture Link you can put on your business card.`,
        'trial|free|try it|test|demo': `Yes! You get 45 days completely free with full access to every feature. No credit card required. Just sign up at brikk.store/login and start adding your leads.`,
        'different|competitor|lofty|follow up boss|boldtrail|compare': `Platforms like Lofty cost $300-500/month, require hours of training, and are built for large brokerages. Brikk is $75/month, takes 5 minutes to set up, and is built for solo agents. The biggest difference: Brikk's AI actually drafts your messages. It doesn't just remind you to follow up — it writes the follow-up for you.`,
        'safe|security|data|privacy|secure': `Your data is fully secured. We use Supabase with row-level security — every agent can only see their own leads, deals, and messages. All data is encrypted in transit via HTTPS. We never sell your data. Full details at brikk.store/privacy.`,
        'phone|mobile|app|iphone|android': `Brikk works on any device — iPhone, Android, tablet, or desktop. On your phone, go to brikk.store, tap "Add to Home Screen" and it works just like a native app with its own icon and full-screen experience. We're also submitting to the Apple App Store soon.`,
        'cancel|contract|commitment|quit|stop': `No contracts, cancel anytime. You can stop your subscription with one click. Your data stays available for 30 days after cancellation in case you change your mind.`,
        'text|sms|message|twilio': `Yes, you can text leads directly from Brikk. Type a message or let AI draft one for you, then send it. Messages are delivered via SMS to your lead's phone number. Full conversation history is saved per lead.`,
        'ai|copilot|artificial intelligence|smart': `Brikk's AI Copilot reads each lead's full context — their temperature, how long since contact, their stage, their notes, and your entire conversation history. It drafts a personalized follow-up message that builds on previous conversations. You just tap approve, edit, or skip. It gets smarter the longer you use it.`,
        'how.*(start|begin|sign|set)|get started|setup': `Just go to brikk.store/login and create your account. Add your first few leads, then click "AI Copilot" to see your first AI-drafted follow-ups. The whole setup takes about 5 minutes.`,
        'install|download|home screen|add to home|web app|pwa|native|app store': `Great question! You can install Brikk as an app on your phone in seconds. On iPhone: Open brikk.store in Safari, tap the Share button (the square with arrow), scroll down and tap "Add to Home Screen", then tap "Add". On Android: Open brikk.store in Chrome, tap the three dots menu, then tap "Add to Home Screen" or "Install App". It'll show up as a real app on your phone with its own icon — no app store needed! We're also submitting to the Apple App Store soon.`,
        'how.*install|how.*download|how.*add.*home|how.*get.*app': `Here's how to install Brikk on your phone:\n\niPhone (Safari):\n1. Open brikk.store in Safari\n2. Tap the Share button (square with arrow at the bottom)\n3. Scroll down and tap "Add to Home Screen"\n4. Tap "Add" in the top right\n\nAndroid (Chrome):\n1. Open brikk.store in Chrome\n2. Tap the three dots menu (top right)\n3. Tap "Add to Home Screen" or "Install App"\n4. Tap "Add"\n\nThat's it! Brikk will appear as an app on your home screen with its own icon.`,
      }

      // Check fallbacks first
      for (const [pattern, answer] of Object.entries(fallbacks)) {
        if (new RegExp(pattern, 'i').test(q)) {
          return NextResponse.json({ answer })
        }
      }

      // Try AI for questions not in fallbacks
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 300,
            system: `You are the AI assistant on Brikk's website (brikk.store). Brikk is an AI-powered command center for real estate agents. 

Key facts:
- Price: $75/month Pro (solo agents), $200/month Teams (up to 5). $125 one-time setup fee. 45-day free trial, no credit card.
- Features: AI Copilot (drafts follow-ups using conversation history), Lead Pipeline (18 fields including pre-approval, timeline, bedrooms, contact preference), Deal Tracker (stage progression, close date countdown), Smart Calendar (auto-populated), Marketing ROI (source analytics), Messages (SMS via Twilio), Voice-to-CRM (speak and AI extracts lead info), Lead Capture Link (/refer)
- Competitors charge $300-500/month. Brikk is simpler, cheaper, and the AI actually acts.
- Works on iPhone, Android, desktop. iOS app coming to App Store.
- HOW TO INSTALL AS APP: iPhone — open brikk.store in Safari, tap Share button (square with arrow), tap "Add to Home Screen", tap Add. Android — open brikk.store in Chrome, tap three dots menu, tap "Add to Home Screen" or "Install App". It appears as a real app with its own icon.
- Data secured with row-level security. Never sold. Privacy policy at brikk.store/privacy.
- No contracts, cancel anytime.
- Built by a small team passionate about helping agents close more deals.

Be warm, concise, honest. 2-3 sentences max unless they ask for detail. Sound human, not corporate. If unsure, say "Great question — reach out to hello@brikk.store and we'll help you out."`,
            messages: [{ role: 'user', content: question }]
          })
        })
        const data = await res.json()
        if (data.content && data.content[0] && data.content[0].text) {
          return NextResponse.json({ answer: data.content[0].text })
        }
        // API returned but no text — use generic helpful response
        return NextResponse.json({ answer: "Brikk is an AI command center for real estate agents — it drafts your follow-ups, tracks your leads, and tells you exactly who to call every morning. Try it free for 45 days at brikk.store/login. What specific questions do you have?" })
      } catch (err) {
        console.error('Help chat API error:', err)
        return NextResponse.json({ answer: "Brikk is an AI-powered command center for real estate agents. It costs $75/month with a 45-day free trial. What would you like to know more about — features, pricing, or how to get started?" })
      }
    }

    // Original copilot draft mode
    const { leads, agentName } = body

    if (!leads || leads.length === 0) {
      return NextResponse.json({ drafts: [] })
    }

    const drafts = []

    for (const lead of leads.slice(0, 5)) {
      const daysSinceContact = lead.days_since_contact || 0
      
      // Build conversation history context
      let historyContext = ''
      if (lead.recent_messages && lead.recent_messages.length > 0) {
        historyContext = '\n\nPrevious messages (most recent first):\n' + lead.recent_messages.map(m => {
          const dir = m.direction === 'outbound' ? 'You sent' : 'They replied'
          const date = new Date(m.created_at).toLocaleDateString()
          return `- ${dir} (${date}): "${m.content}"`
        }).join('\n')
      }
      
      let interactionContext = ''
      if (lead.recent_interactions && lead.recent_interactions.length > 0) {
        interactionContext = '\n\nRecent interactions:\n' + lead.recent_interactions.map(i => {
          const date = new Date(i.created_at).toLocaleDateString()
          return `- ${i.interaction_type} (${date}): ${i.notes || 'No notes'}`
        }).join('\n')
      }

      const hasHistory = (lead.recent_messages && lead.recent_messages.length > 0) || (lead.recent_interactions && lead.recent_interactions.length > 0)

      const prompt = `You are an AI assistant for a real estate agent named ${agentName || 'Alex'}. 

Write a short, personalized follow-up message for this lead. The message should be sent as a text message. Keep it under 40 words. Be warm and professional. Do NOT use phrases like "just checking in" or "just following up." Make it specific and actionable.

${hasHistory ? 'CRITICAL: This is NOT a first contact. Read the conversation history below carefully. Your message MUST continue the existing conversation naturally. Do NOT repeat anything already said. Do NOT re-introduce yourself. Escalate the relationship — offer new value, create urgency, or move toward next steps.' : 'This is likely a first contact or there is no message history. Introduce yourself briefly and offer specific value.'}

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

Respond with ONLY a JSON object, nothing else. No markdown, no code blocks. Just the raw JSON:
{"message": "your draft message here", "reason": "one sentence explaining why to send this now and how it builds on previous contact"}`

      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 200,
            messages: [{ role: 'user', content: prompt }]
          })
        })

        if (!response.ok) {
          const errText = await response.text()
          console.error('Anthropic API error:', response.status, errText)
          drafts.push({
            lead_id: lead.id,
            lead_name: lead.name,
            lead_type: lead.lead_type,
            temperature: lead.temperature,
            source: lead.source,
            stage: lead.stage,
            days_since_contact: daysSinceContact,
            channel: daysSinceContact > 7 ? 'Email' : 'Text',
            urgency: 'high',
            draft: `Hi ${lead.name}, this is ${agentName || 'Alex'}. I wanted to reach out — are you still looking at properties${lead.price_range ? ' in the ' + lead.price_range + ' range' : ''}? I have some new listings that might be a great fit. Would love to chat when you have a minute.`,
            reason: `${daysSinceContact} days without contact. Automatic fallback draft generated.`
          })
          continue
        }

        const data = await response.json()
        const text = data.content?.[0]?.text || ''
        
        let draftMessage = ''
        let draftReason = ''

        if (text) {
          try {
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            const parsed = JSON.parse(cleaned)
            draftMessage = parsed.message || ''
            draftReason = parsed.reason || ''
          } catch {
            draftMessage = text.replace(/[{}"]/g, '').replace(/message:|reason:/gi, '').trim()
            draftReason = `Follow-up needed — ${daysSinceContact} days since last contact.`
          }
        }

        if (!draftMessage) {
          draftMessage = `Hi ${lead.name}, this is ${agentName || 'Alex'}. I wanted to reach out — are you still looking at properties${lead.price_range ? ' in the ' + lead.price_range + ' range' : ''}? I have some updates I think you would find helpful. Let me know when you have a few minutes.`
          draftReason = `${daysSinceContact} days without contact. Fallback draft generated.`
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
          urgency: lead.temperature === 'hot' && daysSinceContact >= 2 ? 'high' : 
                   daysSinceContact >= 5 ? 'high' : 
                   daysSinceContact >= 3 ? 'medium' : 'low',
          draft: draftMessage,
          reason: draftReason
        })
      } catch (err) {
        console.error('Error generating draft for', lead.name, err)
        drafts.push({
          lead_id: lead.id,
          lead_name: lead.name,
          lead_type: lead.lead_type,
          temperature: lead.temperature,
          source: lead.source,
          stage: lead.stage,
          days_since_contact: daysSinceContact,
          channel: 'Text',
          urgency: 'high',
          draft: `Hi ${lead.name}, this is ${agentName || 'Alex'}. Wanted to touch base — I have some new properties that might interest you. When works best for a quick call?`,
          reason: `${daysSinceContact} days since contact. Fallback draft — please edit before sending.`
        })
      }
    }

    return NextResponse.json({ drafts })
  } catch (error) {
    console.error('Copilot API error:', error)
    return NextResponse.json({ error: 'Failed to generate drafts' }, { status: 500 })
  }
}

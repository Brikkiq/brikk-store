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
              content: `You are an AI assistant for a real estate CRM. Extract structured data from this voice note by a real estate agent.

Voice transcript: "${transcript}"

Return ONLY valid JSON with these fields (use null for anything not mentioned):
{
  "new_lead_name": "name if a new person is mentioned",
  "lead_name": "name if referring to an existing lead",
  "action": "what was done or needs to be done",
  "price": "any price mentioned",
  "notes": "summary of the note for CRM",
  "lead_type": "Buyer or Seller if clear",
  "phone": "phone number if mentioned",
  "raw": "the original transcript cleaned up"
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

    // Original copilot draft mode
    const { leads, agentName } = body

    if (!leads || leads.length === 0) {
      return NextResponse.json({ drafts: [] })
    }

    const drafts = []

    for (const lead of leads.slice(0, 5)) {
      const daysSinceContact = lead.days_since_contact || 0
      const prompt = `You are an AI assistant for a real estate agent named ${agentName || 'Alex'}. 

Write a short, personalized follow-up message for this lead. The message should be sent as a text message. Keep it under 40 words. Be warm and professional. Do NOT use phrases like "just checking in" or "just following up." Make it specific and actionable.

Lead info:
- Name: ${lead.name}
- Type: ${lead.lead_type || 'Buyer'} 
- Source: ${lead.source || 'Unknown'}
- Temperature: ${lead.temperature || 'warm'}
- Stage: ${lead.stage || 'New Lead'}
- Price Range: ${lead.price_range || 'Not specified'}
- Days Since Contact: ${daysSinceContact}
- Notes: ${lead.notes || 'None'}

Respond with ONLY a JSON object, nothing else. No markdown, no code blocks. Just the raw JSON:
{"message": "your draft message here", "reason": "one sentence explaining why to send this now"}`

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

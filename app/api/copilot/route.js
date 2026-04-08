import { NextResponse } from 'next/server'

const ANTHROPIC_KEY = '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'

export async function POST(request) {
  try {
    const { leads, agentName } = await request.json()

    if (!leads || leads.length === 0) {
      return NextResponse.json({ drafts: [] })
    }

    const drafts = []

    for (const lead of leads.slice(0, 5)) {
      const daysSinceContact = lead.days_since_contact || 0
      const prompt = `You are an AI assistant for a real estate agent named ${agentName || 'Alex'}. 

Write a short, personalized follow-up message for this lead. The message should be sent as a text message or short email. Keep it under 50 words. Be warm, professional, and specific to their situation. Do NOT use generic language like "just checking in." Include something specific and actionable.

Lead details:
- Name: ${lead.name}
- Type: ${lead.lead_type || 'Buyer'}
- Source: ${lead.source || 'Unknown'}
- Temperature: ${lead.temperature || 'warm'}
- Stage: ${lead.stage || 'New Lead'}
- Price Range: ${lead.price_range || 'Not specified'}
- Days Since Last Contact: ${daysSinceContact}
- Notes: ${lead.notes || 'None'}

Also provide a one-sentence explanation of why this message should be sent now. Format your response as JSON with two fields: "message" and "reason". Return ONLY the JSON, no other text.`

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
            max_tokens: 300,
            messages: [{ role: 'user', content: prompt }]
          })
        })

        const data = await response.json()
        const text = data.content?.[0]?.text || ''
        
        let parsed
        try {
          const cleaned = text.replace(/```json\n?/g, '').replace(/```/g, '').trim()
          parsed = JSON.parse(cleaned)
        } catch {
          parsed = { message: text, reason: 'Follow-up recommended based on contact gap.' }
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
          draft: parsed.message,
          reason: parsed.reason
        })
      } catch (err) {
        console.error('Error generating draft for', lead.name, err)
      }
    }

    return NextResponse.json({ drafts })
  } catch (error) {
    console.error('Copilot API error:', error)
    return NextResponse.json({ error: 'Failed to generate drafts' }, { status: 500 })
  }
}

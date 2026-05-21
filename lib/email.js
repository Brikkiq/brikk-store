// Resend transactional email helper. Server-only.
// Used by /api/refer to send agent-branded confirmation emails.

const RESEND_API_KEY = process.env.RESEND_API_KEY
const DEFAULT_FROM_DOMAIN = process.env.RESEND_FROM_DOMAIN || 'brikk.store'

// Escape just enough to keep an agent's name safe inside an RFC 5322 display name.
// Drops anything that could break the header. Agents control their full_name input,
// so we treat it as untrusted.
function safeDisplayName(name, fallback = 'Brikk') {
  if (!name) return fallback
  const stripped = String(name).replace(/[\r\n\\"<>]/g, '').trim()
  if (!stripped) return fallback
  // Wrap in quotes if it has commas or other punctuation that need quoting
  return /[,;:@()\[\]]/.test(stripped) ? `"${stripped}"` : stripped
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Send an email via Resend.
 *
 * @param {Object} opts
 * @param {string} opts.fromName        Display name shown in inbox (agent's name, e.g. "Henry Desrosier")
 * @param {string} [opts.fromAddress]   Verified address to send from. Defaults to hello@brikk.store.
 * @param {string} [opts.replyTo]       Replies go here (agent's auth email).
 * @param {string|string[]} opts.to     Recipient email(s).
 * @param {string} opts.subject
 * @param {string} opts.html
 * @param {string} [opts.text]
 */
export async function sendEmail({
  fromName,
  fromAddress,
  replyTo,
  to,
  subject,
  html,
  text,
}) {
  if (!RESEND_API_KEY) {
    console.warn('sendEmail: RESEND_API_KEY not set; skipping')
    return { ok: false, error: 'not_configured' }
  }
  if (!to || !subject || !html) {
    return { ok: false, error: 'missing_required_fields' }
  }

  const displayName = safeDisplayName(fromName)
  // Default to hello@ rather than noreply@: it's a real, monitored mailbox
  // (forwards via ImprovMX to support inbox), it improves deliverability,
  // and it's what Resend specifically recommends.
  const sender = fromAddress || `hello@${DEFAULT_FROM_DOMAIN}`
  const fromHeader = `${displayName} <${sender}>`

  const payload = {
    from: fromHeader,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  }
  if (text) payload.text = text
  if (replyTo) payload.reply_to = replyTo

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const text = await res.text()
      console.error('Resend send failed:', res.status, text.slice(0, 200))
      return { ok: false, error: `resend_${res.status}` }
    }
    const data = await res.json()
    return { ok: true, id: data?.id }
  } catch (err) {
    console.error('Resend send threw:', err?.message)
    return { ok: false, error: 'network' }
  }
}

/**
 * Lead-capture confirmation email — sent to a prospect after they submit
 * an agent's referral form. The "from" name is the agent's name so the
 * email lands in the prospect's inbox looking personal.
 */
export function buildLeadConfirmationEmail({ leadFirstName, agentName, agentBrokerage }) {
  const safeAgentName  = escapeHtml(agentName || 'Your agent')
  const safeBrokerage  = escapeHtml(agentBrokerage || '')
  const safeFirst      = escapeHtml(leadFirstName || 'there')
  const subject = `Thanks for reaching out — ${safeAgentName}`

  const html = `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#FAFAF9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;color:#1A1A18;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FAFAF9;">
      <tr>
        <td align="center" style="padding:40px 20px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;background:#FFFFFF;border:1px solid #E8E8E4;border-radius:8px;">
            <tr>
              <td style="padding:32px 32px 12px 32px;">
                <span style="font-size:18px;font-weight:700;letter-spacing:-0.025em;color:#1A1A18;">Brikk</span>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 32px 24px 32px;">
                <h1 style="font-size:20px;font-weight:600;letter-spacing:-0.015em;margin:0 0 12px 0;color:#1A1A18;">
                  Thanks, ${safeFirst}.
                </h1>
                <p style="font-size:14px;line-height:1.65;color:#1A1A18;margin:0 0 16px 0;">
                  ${safeAgentName}${safeBrokerage ? ` at ${safeBrokerage}` : ''} just received your details and will reach out shortly — usually within an hour during business hours.
                </p>
                <p style="font-size:14px;line-height:1.65;color:#6B6B66;margin:0 0 20px 0;">
                  If you need to follow up sooner or remembered something to add, just reply to this email. It goes straight to ${safeAgentName}.
                </p>
                <p style="font-size:12px;line-height:1.6;color:#9C9C96;margin:24px 0 0 0;">
                  This message was sent because you filled out a contact form for ${safeAgentName}. If you didn't mean to submit that form, you can ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;border-top:1px solid #F0F0EC;">
                <p style="font-size:11px;line-height:1.5;color:#9C9C96;margin:0;">
                  Powered by <a href="https://brikk.store" style="color:#6B6B66;text-decoration:none;">brikk.store</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim()

  const text =
    `Thanks, ${leadFirstName || 'there'}.\n\n` +
    `${agentName || 'Your agent'}${agentBrokerage ? ` at ${agentBrokerage}` : ''} just received your details and will reach out shortly — usually within an hour during business hours.\n\n` +
    `Reply to this email to reach ${agentName || 'them'} directly.\n\n` +
    `Powered by brikk.store`

  return { subject, html, text }
}

// Native texting links. The agent sends from their OWN phone number through the
// Messages app — the app never sends texts itself (no Twilio, no SMS service).

// Digits-only US-friendly normalization. Returns "+15555550123" or null.
export function normalizePhone(raw) {
  const s = String(raw || '').trim()
  if (!s) return null
  const hasPlus = s.startsWith('+')
  const digits = s.replace(/\D/g, '')
  if (!digits) return null
  if (hasPlus) return '+' + digits
  if (digits.length === 10) return '+1' + digits
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits
  return digits.length >= 7 ? '+' + digits : null
}

// iOS wants "sms:NUMBER&body=..."; Android and others want "sms:NUMBER?body=...".
export function smsHref(phone, body, platform = 'other') {
  const n = normalizePhone(phone)
  if (!n) return null
  const sep = platform === 'ios' ? '&' : '?'
  return body ? `sms:${n}${sep}body=${encodeURIComponent(body)}` : `sms:${n}`
}

export function platformFromUserAgent(ua) {
  const s = String(ua || '')
  if (/iPhone|iPad|iPod/i.test(s)) return 'ios'
  if (/Android/i.test(s)) return 'android'
  return 'other'
}

export function telHref(phone) {
  const n = normalizePhone(phone)
  return n ? `tel:${n}` : null
}

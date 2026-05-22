// Google Calendar API helpers.
//
// Functions:
//   getValidAccessToken(adminClient, userId) — returns a valid access token,
//     refreshing it via the refresh token if expired.
//   googleCalendarFetch(adminClient, userId, path, options) — fetch wrapper
//     that handles auth + 401-retry-after-refresh automatically.

import { encrypt, decrypt } from './encrypt'

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET

const CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

// Lifetime buffer: refresh tokens that expire within the next 60s, treat as expired.
const EXPIRY_BUFFER_MS = 60 * 1000

async function refreshAccessToken(adminClient, integration) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Google OAuth env vars not configured')
  }
  if (!integration.refresh_token) {
    throw new Error('No refresh token stored — reconnect Google Calendar')
  }
  const refreshTokenPlain = decrypt(integration.refresh_token)
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshTokenPlain,
      grant_type: 'refresh_token',
    }).toString(),
  })
  const data = await res.json()
  if (data.error || !data.access_token) {
    // 'invalid_grant' = user revoked Brikk's access in their Google account.
    // Soft-disable so we don't keep retrying.
    if (data.error === 'invalid_grant') {
      await adminClient.from('integrations').update({
        enabled: false,
        updated_at: new Date().toISOString(),
      }).eq('id', integration.id)
      throw new Error('User revoked Google access — integration disabled')
    }
    throw new Error(`Token refresh failed: ${data.error_description || data.error || 'unknown'}`)
  }
  const newExpiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString()
  const encryptedAccess = encrypt(data.access_token)
  await adminClient.from('integrations').update({
    access_token: encryptedAccess,
    expires_at: newExpiresAt,
    updated_at: new Date().toISOString(),
  }).eq('id', integration.id)
  return data.access_token
}

export async function getValidAccessToken(adminClient, userId) {
  const { data: integration } = await adminClient
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google_calendar')
    .eq('enabled', true)
    .maybeSingle()
  if (!integration) {
    throw new Error('No active Google Calendar integration for user')
  }
  // Is the access token still fresh?
  const expiresAt = integration.expires_at ? new Date(integration.expires_at).getTime() : 0
  if (expiresAt > Date.now() + EXPIRY_BUFFER_MS && integration.access_token) {
    return { token: decrypt(integration.access_token), integration }
  }
  // Refresh
  const newToken = await refreshAccessToken(adminClient, integration)
  // Re-fetch the updated row so we have the new expires_at
  const { data: refreshed } = await adminClient
    .from('integrations').select('*').eq('id', integration.id).single()
  return { token: newToken, integration: refreshed }
}

export async function googleCalendarFetch(adminClient, userId, path, options = {}) {
  let { token } = await getValidAccessToken(adminClient, userId)
  const fullUrl = path.startsWith('http') ? path : `${CALENDAR_BASE}${path}`

  const doFetch = (authToken) => fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      ...(options.headers || {}),
    },
  })

  let res = await doFetch(token)
  if (res.status === 401) {
    // Force refresh once, retry once. If it still 401s, give up.
    const { data: integration } = await adminClient
      .from('integrations').select('*').eq('user_id', userId).eq('provider', 'google_calendar').single()
    token = await refreshAccessToken(adminClient, integration)
    res = await doFetch(token)
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google Calendar API ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.status === 204 ? null : res.json()
}

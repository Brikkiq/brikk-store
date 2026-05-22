import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { encrypt } from '@/lib/integrations/encrypt'

// Google redirects here after the user grants consent.
// 1. Verify the state HMAC matches what we signed (CSRF protection)
// 2. Exchange the auth code for access + refresh tokens
// 3. Fetch the user's email so we can show it in the UI
// 4. Encrypt tokens + upsert into integrations table
// 5. Redirect back to settings → integrations tab

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://brikk.store'
const STATE_SECRET = process.env.STATE_SIGNING_SECRET
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

const STATE_MAX_AGE_MS = 10 * 60 * 1000  // 10 minutes

function verifyState(encoded) {
  if (!STATE_SECRET) throw new Error('STATE_SIGNING_SECRET not set')
  try {
    const decoded = Buffer.from(encoded, 'base64url').toString('utf8')
    const parts = decoded.split('|')
    if (parts.length !== 3) return null
    const [userId, ts, sig] = parts
    // Verify signature
    const payload = `${userId}|${ts}`
    const expected = crypto.createHmac('sha256', STATE_SECRET).update(payload).digest('hex')
    if (sig.length !== expected.length) return null
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
    // Verify age
    const age = Date.now() - Number(ts)
    if (!Number.isFinite(age) || age < 0 || age > STATE_MAX_AGE_MS) return null
    return userId
  } catch {
    return null
  }
}

async function fetchUserinfo(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  return res.json()
}

export async function GET(request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  // Build a redirect helper so error states all land on settings/integrations
  // with a clear status param.
  const redirectBack = (status) =>
    NextResponse.redirect(`${APP_URL}/app/settings?tab=integrations&google=${status}`, 302)

  if (error) return redirectBack(`denied`)
  if (!code || !state) return redirectBack(`missing_params`)

  const userId = verifyState(state)
  if (!userId) return redirectBack(`bad_state`)

  if (!CLIENT_ID || !CLIENT_SECRET) return redirectBack(`not_configured`)
  if (!supabaseUrl || !serviceKey) return redirectBack(`server_error`)

  // Exchange code for tokens
  let tokenData
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: `${APP_URL}/api/integrations/google/callback`,
        grant_type: 'authorization_code',
      }).toString(),
    })
    tokenData = await tokenRes.json()
    if (tokenData.error || !tokenData.access_token) {
      console.error('Google token exchange failed:', tokenData)
      return redirectBack(`token_exchange_failed`)
    }
  } catch (err) {
    console.error('Google token exchange threw:', err?.message)
    return redirectBack(`token_exchange_threw`)
  }

  // Fetch the user's Google email for display
  const userinfo = await fetchUserinfo(tokenData.access_token)
  const accountEmail = userinfo?.email || null

  // Compute the expiry timestamp (access tokens last 1 hour by default)
  const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString()

  // Encrypt + upsert into integrations table
  const supabase = createClient(supabaseUrl, serviceKey)
  let encryptedAccess, encryptedRefresh
  try {
    encryptedAccess = encrypt(tokenData.access_token)
    encryptedRefresh = tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null
  } catch (err) {
    console.error('Token encryption failed:', err?.message)
    return redirectBack(`encryption_failed`)
  }

  const { error: upsertErr } = await supabase
    .from('integrations')
    .upsert({
      user_id: userId,
      provider: 'google_calendar',
      access_token: encryptedAccess,
      // Only overwrite refresh_token if Google gave us a new one (they sometimes don't).
      ...(encryptedRefresh ? { refresh_token: encryptedRefresh } : {}),
      expires_at: expiresAt,
      account_email: accountEmail,
      enabled: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' })

  if (upsertErr) {
    console.error('Integration upsert failed:', upsertErr)
    return redirectBack(`db_error`)
  }

  return redirectBack(`connected`)
}

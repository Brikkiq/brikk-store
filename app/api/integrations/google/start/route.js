import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Start the Google OAuth flow.
// The user clicks "Connect Google Calendar" → hits this route → we redirect
// them to Google's consent screen with the proper scopes + a signed state
// parameter for CSRF protection.

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://brikk.store'
const STATE_SECRET = process.env.STATE_SIGNING_SECRET
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Scopes Brikk needs: read/write calendar events + the user's email for
// display purposes. We do NOT request full Drive or contacts access.
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

function signState(userId) {
  // HMAC-SHA256(userId || timestamp). Embed timestamp so we can reject
  // stale callbacks (>10 min) — protects against replay.
  if (!STATE_SECRET) throw new Error('STATE_SIGNING_SECRET not set')
  const ts = Date.now().toString()
  const payload = `${userId}|${ts}`
  const sig = crypto.createHmac('sha256', STATE_SECRET).update(payload).digest('hex')
  // Encode as base64url so it's safe in URLs
  return Buffer.from(`${payload}|${sig}`).toString('base64url')
}

export async function GET(request) {
  if (!CLIENT_ID) {
    return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 503 })
  }
  if (!STATE_SECRET) {
    return NextResponse.json({ error: 'State signing secret missing' }, { status: 503 })
  }
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  // Pull the user's session from the cookie/header — we need to know who
  // we're connecting on behalf of.
  const authHeader = request.headers.get('authorization') || ''
  const cookieToken = request.cookies.get('sb-access-token')?.value
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized — please sign in first' }, { status: 401 })
  }

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user } } = await client.auth.getUser(token)
  if (!user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  // Build the Google OAuth URL
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: `${APP_URL}/api/integrations/google/callback`,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',     // gets refresh token
    prompt: 'consent',           // forces refresh token even if user has connected before
    state: signState(user.id),
    include_granted_scopes: 'true',
  })

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  return NextResponse.redirect(url, 302)
}

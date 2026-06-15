import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Start the Google OAuth flow.
// The client (Settings → Integrations) POSTs here with its Supabase bearer
// token in the Authorization header. We verify the session, sign a state
// parameter for CSRF protection, and RETURN the Google consent URL as JSON.
// The client then does window.location.href = url to redirect.
//
// Why POST-returns-URL instead of GET-redirect: a top-level browser navigation
// can't send an Authorization header, and putting the Supabase JWT in the URL
// query string leaks it into browser history, server logs, and the Referer
// header sent to Google. POST keeps the token in the header where it belongs.

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://brikk.store'
const STATE_SECRET = process.env.STATE_SIGNING_SECRET
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

function signState(userId) {
  if (!STATE_SECRET) throw new Error('STATE_SIGNING_SECRET not set')
  const ts = Date.now().toString()
  const payload = `${userId}|${ts}`
  const sig = crypto.createHmac('sha256', STATE_SECRET).update(payload).digest('hex')
  return Buffer.from(`${payload}|${sig}`).toString('base64url')
}

export async function POST(request) {
  if (!CLIENT_ID) {
    return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 503 })
  }
  if (!STATE_SECRET) {
    return NextResponse.json({ error: 'State signing secret missing' }, { status: 503 })
  }
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  // Token ONLY from the Authorization header — never from the URL.
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
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

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: `${APP_URL}/api/integrations/google/callback`,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state: signState(user.id),
    include_granted_scopes: 'true',
  })

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  return NextResponse.json({ url: googleAuthUrl })
}

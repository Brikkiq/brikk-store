// Authentication for /api/v1. Server-only.
//
// Every request must send `Authorization: Bearer <supabase access token>`.
// We verify it with Supabase, then return a database client that carries the
// same token, so row-level security still applies to every query — the server
// never uses the service-role key for normal user requests.
import { createClient } from '@supabase/supabase-js'
import { ApiError } from './http'
import { getTrialState, shouldGate } from '../trial'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function userClient(token) {
  if (!url || !anonKey) throw new ApiError(503, 'not_configured', 'Server is not configured')
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function adminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new ApiError(503, 'not_configured', 'Server is not configured')
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

// Returns { user, db, profile }. Throws 401 when signed out and 402 when the
// free trial is over with no subscription (unless allowExpired is set — used
// by /me so the app can still show the upgrade screen).
export async function requireUser(request, { allowExpired = false } = {}) {
  const header = request.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) throw new ApiError(401, 'unauthorized', 'Sign in required')

  const db = userClient(token)
  const { data, error } = await db.auth.getUser(token)
  if (error || !data?.user) throw new ApiError(401, 'unauthorized', 'Your session has expired. Please sign in again.')
  const user = data.user

  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle()

  if (!allowExpired) {
    let team = null
    if (profile?.team_id) {
      const { data: t } = await db.from('teams').select('status, plan_tier').eq('id', profile.team_id).maybeSingle()
      team = t || null
    }
    const trial = getTrialState({ profile, team })
    if (shouldGate(trial.state)) {
      throw new ApiError(402, 'subscription_required', trial.message || 'Your free trial has ended.')
    }
  }

  return { user, db, profile: profile || { id: user.id } }
}

// Verifies the Bearer token only (no profile / trial checks).
export async function verifyToken(request) {
  const header = request.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) return null
  try {
    const { data } = await userClient(token).auth.getUser(token)
    return data?.user || null
  } catch {
    return null
  }
}

// Cron endpoints: hard-fail when CRON_SECRET is missing (never run unprotected).
export function requireCron(request) {
  const secret = process.env.CRON_SECRET
  if (!secret) throw new ApiError(503, 'not_configured', 'CRON_SECRET is not set')
  if ((request.headers.get('authorization') || '') !== `Bearer ${secret}`) {
    throw new ApiError(401, 'unauthorized', 'Unauthorized')
  }
}

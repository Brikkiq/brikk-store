import { handle, ok, readJson } from '@/lib/server/http'
import { requireUser } from '@/lib/server/auth'
import { updateProfile, publicProfile } from '@/lib/server/book'
import { getTrialState } from '@/lib/trial'
import { randomInt } from 'crypto'

// Short lead-capture code like "K7QM-3XRP" (no 0/O/1/I/L).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const newCode = () => {
  const seg = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
  return `${seg()}-${seg()}`
}

async function ensureReferralCode(db, profile) {
  if (!profile?.id || profile.referral_code) return profile
  for (let i = 0; i < 5; i++) {
    const { data, error } = await db.from('profiles').update({ referral_code: newCode() })
      .eq('id', profile.id).is('referral_code', null).select('*').maybeSingle()
    if (!error && data) return data
    if (!error && !data) break // someone else set it first
  }
  const { data } = await db.from('profiles').select('*').eq('id', profile.id).maybeSingle()
  return data || profile
}

// GET works even after the trial ends, so apps can show the upgrade screen.
export const GET = handle(async (request) => {
  const { user, db, profile: loaded } = await requireUser(request, { allowExpired: true })
  const profile = await ensureReferralCode(db, loaded)
  let team = null
  if (profile?.team_id) {
    const { data } = await db.from('teams').select('id, name, status, plan_tier').eq('id', profile.team_id).maybeSingle()
    team = data || null
  }
  return ok({ email: user.email, profile: publicProfile(profile), trial: getTrialState({ profile, team }) })
})

// PATCH { full_name?, phone?, agency_name?, timezone? }
export const PATCH = handle(async (request) => {
  const { user, db } = await requireUser(request, { allowExpired: true })
  return ok(publicProfile(await updateProfile(db, user.id, await readJson(request))))
})

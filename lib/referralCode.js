// Generate and ensure a referral_code on a profile.
// Codes are 6 characters from an unambiguous alphabet — no 0/O/1/I/L confusion.
// Format: 3 letters + dash + 3 chars (e.g. "BRK-7H2K" → 6 chars + dash).

import { supabase } from './supabase'

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // 31 chars, unambiguous
const SEGMENT  = 4
const LENGTH   = 8 // 4 + dash + 4 — short, memorable, ~31^8 = 8.5 billion combos

function rand() {
  return ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
}

function generate() {
  let s = ''
  for (let i = 0; i < SEGMENT; i++) s += rand()
  s += '-'
  for (let i = 0; i < SEGMENT; i++) s += rand()
  return s
}

// Ensures the user has a referral_code; returns the code.
// Safe to call multiple times — only writes if missing.
export async function ensureReferralCode(userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.referral_code) return profile.referral_code

  // Try up to 5 times — collisions are vanishingly rare but possible
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generate()
    const { error } = await supabase
      .from('profiles')
      .update({ referral_code: candidate })
      .eq('id', userId)
      .is('referral_code', null)
    if (!error) {
      // Re-read to confirm it stuck (someone else might have raced us)
      const { data: refreshed } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', userId)
        .maybeSingle()
      if (refreshed?.referral_code) return refreshed.referral_code
    }
  }
  return null
}

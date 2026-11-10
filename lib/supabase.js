import { createClient } from '@supabase/supabase-js'

// Browser Supabase client — used ONLY for sign-in/sign-out and the session
// token. All data reads and writes go through /api/v1 (see lib/client/api.js).
// Env-driven: set these in Vercel and in .env.local — see .env.example.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly instead of silently pointing at a hardcoded project.
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set (see .env.example)')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

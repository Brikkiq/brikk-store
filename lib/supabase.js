import { createClient } from '@supabase/supabase-js'

// Env-driven. Set these in Vercel and locally in .env.local — see .env.example.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://jfxihdmtwlpocpmzeeft.supabase.co'

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmeGloZG10d2xwb2NwbXplZWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2Mzc3NjMsImV4cCI6MjA5MTIxMzc2M30.2TZILOqucNQwDWFRAL9McLNjI8yvWrVJfvS4eF0Lnyg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

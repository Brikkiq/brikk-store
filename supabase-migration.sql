-- Brikk schema migration — safe to run multiple times.
-- Run this in your Supabase SQL Editor BEFORE deploying the new code.
-- Every statement is idempotent (IF NOT EXISTS / IF EXISTS) so re-running it is harmless.

-- =====================================================================
-- PROFILES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  brokerage text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure all expected columns exist on existing tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS brokerage text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Auto-create a profile row whenever a new auth user is created.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =====================================================================
-- LEADS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  source text DEFAULT 'Other',
  temperature text DEFAULT 'warm',
  stage text DEFAULT 'New Lead',
  lead_type text DEFAULT 'Buyer',
  price_range text,
  notes text,
  address text,
  preferred_area text,
  bedrooms text,
  pre_approved boolean DEFAULT false,
  pre_approved_amount text,
  timeline text,
  birthday date,
  contact_preference text DEFAULT 'text',
  spouse_name text,
  last_contact_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source text DEFAULT 'Other';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS temperature text DEFAULT 'warm';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS stage text DEFAULT 'New Lead';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_type text DEFAULT 'Buyer';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS price_range text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS preferred_area text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS bedrooms text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS pre_approved boolean DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS pre_approved_amount text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS timeline text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS birthday date;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS contact_preference text DEFAULT 'text';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS spouse_name text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_contact_date timestamptz DEFAULT now();
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_last_contact ON public.leads(user_id, last_contact_date DESC);

-- =====================================================================
-- DEALS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address text NOT NULL,
  client_name text,
  price numeric DEFAULT 0,
  commission numeric DEFAULT 0,
  close_date date,
  stage text DEFAULT 'Contract',
  progress integer DEFAULT 10,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS commission numeric DEFAULT 0;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS close_date date;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS stage text DEFAULT 'Contract';
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS progress integer DEFAULT 10;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_deals_user_id ON public.deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_close_date ON public.deals(user_id, close_date);

-- =====================================================================
-- MESSAGES (per-lead text history)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  direction text NOT NULL,         -- 'inbound' | 'outbound'
  channel text DEFAULT 'text',     -- 'text' | 'email'
  content text NOT NULL,
  status text DEFAULT 'logged',    -- 'sent' | 'received' | 'failed' | 'logged'
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS lead_id uuid;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS direction text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS channel text DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS status text DEFAULT 'logged';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON public.messages(lead_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);

-- =====================================================================
-- INTERACTIONS (the catch-all activity log per lead)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  interaction_type text NOT NULL,  -- 'contact' | 'text' | 'email' | 'voice_note' | 'text_received'
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS lead_id uuid;
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS interaction_type text;
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_interactions_lead_id ON public.interactions(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.interactions(user_id);

-- =====================================================================
-- ROW LEVEL SECURITY (the most important part — protects user isolation)
-- =====================================================================
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions  ENABLE ROW LEVEL SECURITY;

-- Drop and recreate so we know exactly what policies are live
DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "leads_own_all" ON public.leads;
CREATE POLICY "leads_own_all" ON public.leads
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "deals_own_all" ON public.deals;
CREATE POLICY "deals_own_all" ON public.deals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "messages_own_all" ON public.messages;
CREATE POLICY "messages_own_all" ON public.messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "interactions_own_all" ON public.interactions;
CREATE POLICY "interactions_own_all" ON public.interactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- updated_at auto-touch trigger
-- =====================================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS touch_leads_updated_at ON public.leads;
CREATE TRIGGER touch_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

DROP TRIGGER IF EXISTS touch_deals_updated_at ON public.deals;
CREATE TRIGGER touch_deals_updated_at BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

DROP TRIGGER IF EXISTS touch_profiles_updated_at ON public.profiles;
CREATE TRIGGER touch_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

-- =========================================================================
-- Life insurance conversion — step 1 of 4: households + household members.
-- Run AFTER sql/sec-01-lock-down-profiles.sql. Safe to run multiple times.
--
-- NEVER add medical / health / underwriting columns to any table.
-- =========================================================================

-- ----- Agent profile additions --------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/New_York';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agency_name text;
-- Date the last morning-brief email was sent (stops duplicates if the cron re-runs).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_brief_date date;
UPDATE public.profiles SET agency_name = brokerage WHERE agency_name IS NULL AND brokerage IS NOT NULL;

-- New sign-ups: copy name, phone and agency from the signup form onto the profile.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, agency_name)
  VALUES (
    new.id,
    left(COALESCE(new.raw_user_meta_data->>'full_name', ''), 120),
    left(new.raw_user_meta_data->>'phone', 40),
    left(new.raw_user_meta_data->>'agency_name', 120)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ----- households ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.households (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 200),
  phone           text CHECK (char_length(phone) <= 40),
  email           text CHECK (char_length(email) <= 254),
  address_line    text CHECK (char_length(address_line) <= 200),
  city            text CHECK (char_length(city) <= 100),
  state           text CHECK (char_length(state) <= 50),
  zip             text CHECK (char_length(zip) <= 20),
  source          text CHECK (char_length(source) <= 100),
  status          text NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect', 'client', 'inactive')),
  notes           text CHECK (char_length(notes) <= 5000),  -- UI warns: no health information
  last_contact_at timestamptz,
  legacy_lead_id  uuid UNIQUE,                               -- set by the li-04 backfill
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, user_id)                                       -- lets child tables enforce same owner
);

CREATE INDEX IF NOT EXISTS idx_households_user ON public.households(user_id, display_name);

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "households_own_all" ON public.households;
CREATE POLICY "households_own_all" ON public.households
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ----- household_members --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.household_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid NOT NULL,
  role         text NOT NULL DEFAULT 'other' CHECK (role IN ('policyholder', 'spouse', 'child', 'other')),
  first_name   text NOT NULL CHECK (char_length(first_name) BETWEEN 1 AND 100),
  last_name    text CHECK (char_length(last_name) <= 100),
  birthday     date,
  phone        text CHECK (char_length(phone) <= 40),
  email        text CHECK (char_length(email) <= 254),
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, user_id),
  -- Composite FK: a member can only belong to a household with the SAME owner.
  FOREIGN KEY (household_id, user_id) REFERENCES public.households(id, user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_members_household ON public.household_members(household_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_members_user ON public.household_members(user_id);

ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_own_all" ON public.household_members;
CREATE POLICY "members_own_all" ON public.household_members
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ----- updated_at triggers (function created by supabase-migration.sql) ----
DROP TRIGGER IF EXISTS touch_households_updated_at ON public.households;
CREATE TRIGGER touch_households_updated_at BEFORE UPDATE ON public.households
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS touch_members_updated_at ON public.household_members;
CREATE TRIGGER touch_members_updated_at BEFORE UPDATE ON public.household_members
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ----- Verify ---------------------------------------------------------------
SELECT table_name,
       (SELECT count(*) FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = t.table_name) AS columns
FROM (VALUES ('households'), ('household_members')) AS t(table_name);

-- =========================================================================
-- Brikk v2 feature pack — schema migration
--
-- Adds tables + columns for: client-facing deal tracker, listing checklists,
-- referral ledger, message sentiment, multi-offer comparison, commission goal,
-- and home-anniversary derivation from existing deals.
--
-- Paste into: Supabase Dashboard -> SQL Editor -> New Query -> Run.
-- Safe to run multiple times. ~3 seconds to execute.
-- =========================================================================

-- ===== 1. Client-facing deal tracker tokens ===============================
-- Public links like brikk.store/track/{token} let buyers/sellers see status
-- without authentication. Token is 24 hex chars (12 random bytes).
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS client_token text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_deals_client_token ON public.deals(client_token);

-- Backfill tokens for existing deals
UPDATE public.deals
  SET client_token = encode(gen_random_bytes(12), 'hex')
  WHERE client_token IS NULL;

-- Trigger: auto-generate token when a new deal is created
CREATE OR REPLACE FUNCTION public.set_deal_client_token()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.client_token IS NULL THEN
    NEW.client_token := encode(gen_random_bytes(12), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS deals_set_client_token ON public.deals;
CREATE TRIGGER deals_set_client_token
  BEFORE INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_deal_client_token();

-- ===== 2. Listing prep + transaction checklists ===========================
CREATE TABLE IF NOT EXISTS public.checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  label text NOT NULL,
  category text,                 -- 'listing_prep' | 'inspection' | 'closing' | 'custom'
  done boolean DEFAULT false,
  due_date date,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checklist_user ON public.checklist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_deal ON public.checklist_items(deal_id);

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Checklist items own" ON public.checklist_items;
CREATE POLICY "Checklist items own"
  ON public.checklist_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== 3. Referral ledger =================================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction text CHECK (direction IN ('received', 'given')) NOT NULL,
  party_name text NOT NULL,         -- the other agent or referrer/referee
  party_phone text,
  party_email text,
  party_brokerage text,
  client_name text,                  -- the actual lead being referred
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  status text DEFAULT 'open',        -- 'open' | 'closed' | 'lost'
  expected_commission numeric,
  actual_commission numeric,
  notes text,
  referred_at date DEFAULT current_date,
  closed_at date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_user ON public.referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(user_id, status);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Referrals own" ON public.referrals;
CREATE POLICY "Referrals own"
  ON public.referrals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== 4. Annual commission goal on profile ===============================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS annual_commission_goal numeric;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS goal_year integer DEFAULT EXTRACT(year FROM now());

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS conversion_rate_estimate numeric DEFAULT 0.15;  -- 15% baseline lead→close

-- ===== 5. Message sentiment ===============================================
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS sentiment text;
-- Values used by the app: 'warm' | 'cool' | 'frustrated' | 'neutral' | NULL

CREATE INDEX IF NOT EXISTS idx_messages_sentiment ON public.messages(lead_id, sentiment)
  WHERE sentiment IS NOT NULL;

-- ===== 6. Multi-offer comparison sheets ===================================
CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Either tie to a specific listing/deal, or just an address string if you
  -- don't have the deal record yet.
  listing_address text NOT NULL,
  deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
  buyer_name text,
  buyer_agent text,
  price numeric,
  earnest_money numeric,
  down_payment numeric,
  financing_type text,               -- 'cash' | 'conventional' | 'FHA' | 'VA' | etc.
  contingencies text[],              -- array: ['inspection', 'appraisal', 'financing']
  close_date date,
  expiration date,
  status text DEFAULT 'pending',     -- 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired'
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offers_user_address ON public.offers(user_id, listing_address);
CREATE INDEX IF NOT EXISTS idx_offers_deal ON public.offers(deal_id);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Offers own" ON public.offers;
CREATE POLICY "Offers own"
  ON public.offers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== 7. updated_at touch trigger for new tables =========================
-- Reuse the existing touch_updated_at function from the initial migration.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'touch_updated_at') THEN
    -- Apply touch trigger to all new tables that have updated_at
    DROP TRIGGER IF EXISTS touch_checklist_items_updated_at ON public.checklist_items;
    CREATE TRIGGER touch_checklist_items_updated_at BEFORE UPDATE ON public.checklist_items
      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

    DROP TRIGGER IF EXISTS touch_referrals_updated_at ON public.referrals;
    CREATE TRIGGER touch_referrals_updated_at BEFORE UPDATE ON public.referrals
      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

    DROP TRIGGER IF EXISTS touch_offers_updated_at ON public.offers;
    CREATE TRIGGER touch_offers_updated_at BEFORE UPDATE ON public.offers
      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END $$;

-- ===== 8. Realtime publication updates ====================================
-- Add new tables to realtime so the in-app UI updates live.
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_items;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.referrals;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- ===== Verify =============================================================
SELECT
  table_name,
  (SELECT count(*) FROM information_schema.columns
   WHERE table_schema='public' AND table_name = t.table_name) AS column_count
FROM (VALUES
  ('checklist_items'::text),
  ('referrals'),
  ('offers')
) AS t(table_name);

SELECT
  'deals.client_token populated' AS check,
  (SELECT count(*) FROM public.deals WHERE client_token IS NOT NULL) AS row_count;

SELECT
  'messages.sentiment column exists' AS check,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='messages' AND column_name='sentiment'
  ) AS present;

SELECT
  'profiles.annual_commission_goal column exists' AS check,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='annual_commission_goal'
  ) AS present;

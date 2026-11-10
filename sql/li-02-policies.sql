-- =========================================================================
-- Life insurance conversion — step 2 of 4: policies.
-- Run AFTER li-01. Safe to run multiple times.
--
-- DO NOT ADD health, medical, medication, height/weight, tobacco,
-- underwriting class or rate-class columns. The product promise is that no
-- health information is ever stored.
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.policies (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id      uuid NOT NULL,
  insured_member_id uuid REFERENCES public.household_members(id) ON DELETE SET NULL,
  carrier           text NOT NULL CHECK (char_length(carrier) BETWEEN 1 AND 120),
  product           text CHECK (char_length(product) <= 120),
  policy_number     text CHECK (char_length(policy_number) <= 60),
  face_amount       numeric(14,2) CHECK (face_amount >= 0),
  monthly_premium   numeric(10,2) CHECK (monthly_premium >= 0),
  application_date  date,
  effective_date    date,
  first_draft_date  date,
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled')),
  -- [{ "name": "Jane Smith", "relationship": "Spouse" }, ...] — names only.
  beneficiaries     jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(beneficiaries) = 'array'),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, user_id),
  FOREIGN KEY (household_id, user_id) REFERENCES public.households(id, user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_policies_household ON public.policies(household_id);
CREATE INDEX IF NOT EXISTS idx_policies_user_status ON public.policies(user_id, status);

ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "policies_own_all" ON public.policies;
CREATE POLICY "policies_own_all" ON public.policies
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS touch_policies_updated_at ON public.policies;
CREATE TRIGGER touch_policies_updated_at BEFORE UPDATE ON public.policies
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

SELECT 'policies table' AS check,
       EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'policies') AS present;

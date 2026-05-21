-- =========================================================================
-- Link deals to leads with a foreign key + auto-sync trigger.
--
-- Effect:
--   1. Deals can now reference a lead via deals.lead_id
--   2. When that lead's name, phone, or email changes, the deal's
--      client_name updates automatically
--   3. Lead detail page can query "attached deals" via the proper FK instead
--      of fuzzy-matching client_name
--
-- Paste into: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- Safe to run multiple times.
-- =========================================================================

-- 1. Add the foreign key column. ON DELETE SET NULL means deleting a lead
--    doesn't cascade-delete the deal (a closed deal should outlive the lead
--    record for accounting purposes).
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON public.deals(lead_id);

-- 2. Backfill: for existing deals without a lead_id, try to match by
--    client_name. This is fuzzy and may not catch all cases; agents can
--    manually link any that miss via the deal edit form.
UPDATE public.deals d
SET lead_id = l.id
FROM public.leads l
WHERE d.lead_id IS NULL
  AND d.user_id = l.user_id
  AND lower(trim(d.client_name)) = lower(trim(l.name))
  AND d.client_name IS NOT NULL;

-- 3. Trigger function: when a lead's name changes, push the new value to all
--    deals linked to it. Keeps the denormalized client_name field in sync.
CREATE OR REPLACE FUNCTION public.sync_deal_client_name_from_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only run if the name actually changed
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE public.deals
      SET client_name = NEW.name,
          updated_at = now()
      WHERE lead_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger to make this re-runnable
DROP TRIGGER IF EXISTS leads_sync_deal_client_name ON public.leads;

CREATE TRIGGER leads_sync_deal_client_name
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_deal_client_name_from_lead();

-- 4. Verify
SELECT
  'deals.lead_id column'::text AS check,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'deals'
      AND column_name = 'lead_id'
  ) AS present
UNION ALL
SELECT
  'sync trigger'::text,
  EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'leads_sync_deal_client_name'
  )
UNION ALL
SELECT
  'deals with lead_id linked'::text,
  (SELECT count(*) > 0 FROM public.deals WHERE lead_id IS NOT NULL);

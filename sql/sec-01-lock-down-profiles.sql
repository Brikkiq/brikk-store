-- =========================================================================
-- SECURITY FIX — run this FIRST, before any li-*.sql file.
--
-- Problem: the "profiles_self_update" policy lets every signed-in user update
-- their whole profile row from the browser, including billing/team columns:
--   supabase.from('profiles').update({ subscription_status: 'active' })
-- gave anyone a free paid plan, and changing stripe_customer_id could open
-- another customer's Stripe billing portal. created_at drives the free trial,
-- so it could also be pushed forward to extend the trial forever.
--
-- Fix: a trigger that silently keeps those columns unchanged unless the write
-- comes from the server (service role) or the database owner (SQL editor,
-- the signup trigger). Users can still edit name / phone / agency / timezone.
--
-- Also adds:
--   * processed_stripe_events — Stripe webhook idempotency (no double-processing).
--   * rate_limits — a tiny table the public lead form uses for rate limiting.
--
-- Paste into Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Safe to run multiple times.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Server-side writes (service role key) and the DB owner may change anything.
  IF coalesce(auth.role(), '') = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.subscription_status    := NULL;
    NEW.subscription_plan      := NULL;
    NEW.stripe_customer_id     := NULL;
    NEW.stripe_subscription_id := NULL;
    NEW.team_id                := NULL;
    NEW.team_role              := NULL;
    NEW.created_at             := now();
  ELSE
    NEW.id                     := OLD.id;
    NEW.subscription_status    := OLD.subscription_status;
    NEW.subscription_plan      := OLD.subscription_plan;
    NEW.stripe_customer_id     := OLD.stripe_customer_id;
    NEW.stripe_subscription_id := OLD.stripe_subscription_id;
    NEW.team_id                := OLD.team_id;
    NEW.team_role              := OLD.team_role;
    NEW.created_at             := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_columns ON public.profiles;
CREATE TRIGGER profiles_protect_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();

-- Stripe webhook idempotency. Only the server (service role) touches this table:
-- RLS is on with no policies, so browser clients can neither read nor write it.
CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
  event_id    text PRIMARY KEY,
  event_type  text,
  received_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY;

-- Fixed-window rate limiting for public endpoints. Server-only, like above.
CREATE TABLE IF NOT EXISTS public.rate_limits (
  bucket       text NOT NULL,
  window_start timestamptz NOT NULL,
  hits         integer NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window_start)
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Atomic "increment and return the new count" used by lib/server/rateLimit.js.
CREATE OR REPLACE FUNCTION public.hit_rate_limit(p_bucket text, p_window_seconds integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w timestamptz := to_timestamp(floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds);
  n integer;
BEGIN
  INSERT INTO public.rate_limits (bucket, window_start, hits)
  VALUES (p_bucket, w, 1)
  ON CONFLICT (bucket, window_start) DO UPDATE SET hits = rate_limits.hits + 1
  RETURNING hits INTO n;
  -- Opportunistic cleanup of old windows.
  DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 day';
  RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION public.hit_rate_limit(text, integer) FROM PUBLIC, anon, authenticated;

-- ===== Verify ==============================================================
-- 1. The trigger exists:
SELECT 'profiles_protect_columns trigger' AS check,
       EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_protect_columns') AS present;

-- 2. IMPORTANT — list every RLS policy in the project. Look for any policy that
--    was added in the dashboard and is wider than "own rows only", e.g. one with
--    roles = {anon} or {public} and qual = true on profiles, deals or leads.
--    The old public pages (/track, /r/CODE, /admin) only work if such a policy
--    exists. Those pages no longer read the database directly, so any such
--    policy should be dropped. Send Claude the output if unsure.
SELECT tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

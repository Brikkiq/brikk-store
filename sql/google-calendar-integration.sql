-- =========================================================================
-- Brikk Google Calendar integration — schema migration
--
-- Tables:
--   integrations          — per-user OAuth tokens for external services
--   calendar_event_sync   — maps Brikk-side entities to Google event IDs
--
-- Paste into: Supabase Dashboard -> SQL Editor -> New Query -> Run.
-- Safe to run multiple times.
-- =========================================================================

-- ===== 1. integrations table ==============================================
-- Generic provider table — used for google_calendar today, microsoft_calendar
-- tomorrow, anything else with the same pattern after that.
CREATE TABLE IF NOT EXISTS public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  -- Tokens are encrypted at rest. Stored as base64-encoded
  -- iv:ciphertext:authTag tuples. See lib/integrations/encrypt.js
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  account_email text,
  calendar_id text DEFAULT 'primary',
  sync_token text,                                    -- for incremental Google sync
  last_synced_at timestamptz,
  enabled boolean DEFAULT true,
  -- What to sync. JSONB so we can add new toggles without migrations.
  -- Default: sync everything once OAuth completes.
  sync_settings jsonb DEFAULT '{"birthdays":true,"anniversaries":true,"follow_ups":true,"deal_milestones":true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_integrations_user ON public.integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_enabled ON public.integrations(provider, enabled)
  WHERE enabled = true;

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Integrations own" ON public.integrations;
CREATE POLICY "Integrations own"
  ON public.integrations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== 2. calendar_event_sync — maps Brikk entities to Google event IDs ===
-- Lets us idempotently update events instead of creating duplicates on
-- every sync. Also lets us pull back changes from Google to the right Brikk row.
CREATE TABLE IF NOT EXISTS public.calendar_event_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 'lead' | 'deal' | 'birthday' | 'anniversary' | 'manual' | 'follow_up'
  brikk_source_type text NOT NULL,
  -- The lead.id, deal.id, etc. NULL for 'manual' events created from Brikk.
  brikk_source_id uuid,
  -- The Google Calendar event ID (e.g., "abc123def456@google.com")
  google_event_id text,
  google_calendar_id text DEFAULT 'primary',
  -- Snapshot of when we last pushed to Google — used in conflict resolution.
  -- If Google has a newer updated time, we accept Google's edit.
  last_pushed_at timestamptz,
  last_pulled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- A given Google event maps to at most one Brikk source
  UNIQUE(user_id, google_event_id),
  -- A given Brikk source maps to at most one Google event
  UNIQUE(user_id, brikk_source_type, brikk_source_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_sync_user ON public.calendar_event_sync(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_brikk ON public.calendar_event_sync(user_id, brikk_source_type, brikk_source_id);

ALTER TABLE public.calendar_event_sync ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Calendar sync own" ON public.calendar_event_sync;
CREATE POLICY "Calendar sync own"
  ON public.calendar_event_sync FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== 3. updated_at touch triggers =======================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'touch_updated_at') THEN
    DROP TRIGGER IF EXISTS touch_integrations_updated_at ON public.integrations;
    CREATE TRIGGER touch_integrations_updated_at BEFORE UPDATE ON public.integrations
      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

    DROP TRIGGER IF EXISTS touch_calendar_sync_updated_at ON public.calendar_event_sync;
    CREATE TRIGGER touch_calendar_sync_updated_at BEFORE UPDATE ON public.calendar_event_sync
      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END $$;

-- ===== 4. Verify ==========================================================
SELECT
  'integrations table' AS check,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='integrations') AS present
UNION ALL
SELECT
  'calendar_event_sync table',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='calendar_event_sync')
UNION ALL
SELECT
  'RLS on integrations',
  (SELECT relrowsecurity FROM pg_class WHERE relname='integrations');

-- =========================================================================
-- Enable Supabase Realtime for tables that drive live UI updates.
-- Paste into Supabase Dashboard → SQL Editor → New Query → Run.
-- Safe to run multiple times — uses ALTER PUBLICATION ... ADD which errors
-- if the table is already a member, so we use a DO block to ignore that.
-- =========================================================================

DO $$
BEGIN
  -- leads: powers the "new lead just came in" toast on /app/* pages.
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'leads already in supabase_realtime — skipping';
  END;

  -- messages: powers live message updates on /app/messages and the
  -- conversation indicators on /app/leads.
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'messages already in supabase_realtime — skipping';
  END;
END $$;

-- Verify: this should return both tables.
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

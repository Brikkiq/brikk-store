-- =========================================================================
-- Life insurance conversion — step 3 of 4: follow-up schedule, follow-ups,
-- and the activity log. Run AFTER li-02. Safe to run multiple times.
-- =========================================================================

-- ----- follow_up_templates: each agent's editable schedule -----------------
-- Seeded with defaults by the API the first time an agent opens it
-- (see lib/core/schedule.js DEFAULT_TEMPLATES).
CREATE TABLE IF NOT EXISTS public.follow_up_templates (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label            text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 80),
  anchor           text NOT NULL CHECK (anchor IN ('application_date', 'first_draft_date', 'effective_date')),
  offset_days      integer NOT NULL DEFAULT 0 CHECK (offset_days BETWEEN -365 AND 3650),
  offset_months    integer NOT NULL DEFAULT 0 CHECK (offset_months BETWEEN 0 AND 120),
  repeat_yearly    boolean NOT NULL DEFAULT false,
  message_template text NOT NULL CHECK (char_length(message_template) BETWEEN 1 AND 1000),
  sort_order       integer NOT NULL DEFAULT 0,
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_templates_user ON public.follow_up_templates(user_id, sort_order);

ALTER TABLE public.follow_up_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "templates_own_all" ON public.follow_up_templates;
CREATE POLICY "templates_own_all" ON public.follow_up_templates
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ----- follow_ups: the concrete tasks shown on Today and the timeline ------
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid NOT NULL,
  policy_id    uuid REFERENCES public.policies(id) ON DELETE CASCADE,
  member_id    uuid REFERENCES public.household_members(id) ON DELETE CASCADE,
  template_id  uuid REFERENCES public.follow_up_templates(id) ON DELETE SET NULL,
  kind         text NOT NULL CHECK (kind IN ('policy', 'annual_review', 'birthday', 'manual')),
  label        text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 120),
  due_date     date NOT NULL,
  message      text CHECK (char_length(message) <= 1000),
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'opened', 'done', 'skipped')),
  opened_at    timestamptz,
  completed_at timestamptz,
  dedupe_key   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (household_id, user_id) REFERENCES public.households(id, user_id) ON DELETE CASCADE
);

-- One follow-up per (agent, dedupe key): makes generation safe to repeat.
-- NULL keys (manual follow-ups) never collide. Plain constraint (not a partial
-- index) so the API can upsert with ON CONFLICT (user_id, dedupe_key).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'follow_ups_user_dedupe_key') THEN
    ALTER TABLE public.follow_ups
      ADD CONSTRAINT follow_ups_user_dedupe_key UNIQUE (user_id, dedupe_key);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_follow_ups_due ON public.follow_ups(user_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_follow_ups_household ON public.follow_ups(household_id, due_date);
CREATE INDEX IF NOT EXISTS idx_follow_ups_policy ON public.follow_ups(policy_id);

ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "follow_ups_own_all" ON public.follow_ups;
CREATE POLICY "follow_ups_own_all" ON public.follow_ups
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ----- activity: what the agent actually did -------------------------------
CREATE TABLE IF NOT EXISTS public.activity (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid NOT NULL,
  follow_up_id uuid REFERENCES public.follow_ups(id) ON DELETE SET NULL,
  type         text NOT NULL CHECK (type IN ('text_opened', 'text_sent', 'call', 'note',
                                             'policy_added', 'follow_up_skipped', 'imported')),
  note         text CHECK (char_length(note) <= 2000),
  created_at   timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (household_id, user_id) REFERENCES public.households(id, user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activity_household ON public.activity(household_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_user ON public.activity(user_id, created_at DESC);

ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_own_all" ON public.activity;
CREATE POLICY "activity_own_all" ON public.activity
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ----- updated_at triggers --------------------------------------------------
DROP TRIGGER IF EXISTS touch_templates_updated_at ON public.follow_up_templates;
CREATE TRIGGER touch_templates_updated_at BEFORE UPDATE ON public.follow_up_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS touch_follow_ups_updated_at ON public.follow_ups;
CREATE TRIGGER touch_follow_ups_updated_at BEFORE UPDATE ON public.follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

SELECT table_name,
       EXISTS (SELECT 1 FROM information_schema.tables x
               WHERE x.table_schema = 'public' AND x.table_name = t.table_name) AS present
FROM (VALUES ('follow_up_templates'), ('follow_ups'), ('activity')) AS t(table_name);

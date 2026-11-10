-- =========================================================================
-- Life insurance conversion — step 4 of 4: copy existing leads into the Book.
-- Run AFTER li-03. Safe to run multiple times (skips leads already copied).
--
-- Every existing lead becomes a household with status 'prospect' and one
-- 'policyholder' member (name split into first/last, birthday copied).
-- If the lead had spouse_name, a 'spouse' member is added too.
-- The old leads/deals tables are NOT changed or deleted here.
-- =========================================================================

-- 1. Households
INSERT INTO public.households
  (user_id, display_name, phone, email, address_line, source, status, notes,
   last_contact_at, legacy_lead_id, created_at)
SELECT l.user_id,
       left(coalesce(nullif(trim(l.name), ''), 'Unnamed client'), 200),
       left(l.phone, 40),
       left(l.email, 254),
       left(l.address, 200),
       left(l.source, 100),
       'prospect',
       left(l.notes, 5000),
       l.last_contact_date,
       l.id,
       coalesce(l.created_at, now())
FROM public.leads l
WHERE NOT EXISTS (SELECT 1 FROM public.households h WHERE h.legacy_lead_id = l.id);

-- 2. Policyholder member for each copied household that has no members yet
INSERT INTO public.household_members
  (user_id, household_id, role, first_name, last_name, birthday, phone, email, sort_order)
SELECT h.user_id,
       h.id,
       'policyholder',
       left(split_part(trim(h.display_name), ' ', 1), 100),
       nullif(left(trim(substr(trim(h.display_name), length(split_part(trim(h.display_name), ' ', 1)) + 1)), 100), ''),
       l.birthday,
       h.phone,
       h.email,
       0
FROM public.households h
JOIN public.leads l ON l.id = h.legacy_lead_id
WHERE NOT EXISTS (SELECT 1 FROM public.household_members m WHERE m.household_id = h.id);

-- 3. Spouse member where the lead had a spouse_name
INSERT INTO public.household_members
  (user_id, household_id, role, first_name, last_name, sort_order)
SELECT h.user_id,
       h.id,
       'spouse',
       left(split_part(trim(l.spouse_name), ' ', 1), 100),
       nullif(left(trim(substr(trim(l.spouse_name), length(split_part(trim(l.spouse_name), ' ', 1)) + 1)), 100), ''),
       1
FROM public.households h
JOIN public.leads l ON l.id = h.legacy_lead_id
WHERE nullif(trim(l.spouse_name), '') IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.household_members m
                  WHERE m.household_id = h.id AND m.role = 'spouse');

-- 4. Carry the old activity log over as notes on the timeline
INSERT INTO public.activity (user_id, household_id, type, note, created_at)
SELECT i.user_id,
       h.id,
       'imported',
       left(coalesce(i.interaction_type, 'note') || coalesce(': ' || i.notes, ''), 2000),
       i.created_at
FROM public.interactions i
JOIN public.households h ON h.legacy_lead_id = i.lead_id AND h.user_id = i.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.activity a
  WHERE a.household_id = h.id AND a.type = 'imported' AND a.created_at = i.created_at
);

-- Verify: leads vs. copied households per agent (numbers should match)
SELECT l.user_id,
       count(DISTINCT l.id) AS leads,
       count(DISTINCT h.id) AS households
FROM public.leads l
LEFT JOIN public.households h ON h.legacy_lead_id = l.id
GROUP BY l.user_id;

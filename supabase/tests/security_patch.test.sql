BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT extensions.plan(69);

INSERT INTO auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'authenticated', 'authenticated',
   'security-attacker@example.invalid', '', pg_catalog.now(), '{}'::jsonb,
   '{"name":"Attacker","role":"admin"}'::jsonb, pg_catalog.now(), pg_catalog.now()),
  ('00000000-0000-0000-0000-000000000102', 'authenticated', 'authenticated',
   'security-owner@example.invalid', '', pg_catalog.now(), '{}'::jsonb,
   '{"name":"Owner","role":"creator"}'::jsonb, pg_catalog.now(), pg_catalog.now()),
  ('00000000-0000-0000-0000-000000000103', 'authenticated', 'authenticated',
   'security-stranger@example.invalid', '', pg_catalog.now(), '{}'::jsonb,
   '{"name":"Stranger","role":"creator"}'::jsonb, pg_catalog.now(), pg_catalog.now()),
  ('00000000-0000-0000-0000-000000000104', 'authenticated', 'authenticated',
   'security-legacy-admin@example.invalid', '', pg_catalog.now(), '{}'::jsonb,
   '{"name":"Legacy admin","role":"creator"}'::jsonb, pg_catalog.now(), pg_catalog.now()),
  ('00000000-0000-0000-0000-000000000105', 'authenticated', 'authenticated',
   'security-receiver@example.invalid', '', pg_catalog.now(), '{}'::jsonb,
   '{"name":"Receiver","role":"creator"}'::jsonb, pg_catalog.now(), pg_catalog.now()),
  ('00000000-0000-0000-0000-000000000106', 'authenticated', 'authenticated',
   'security-sender@example.invalid', '', pg_catalog.now(), '{}'::jsonb,
   '{"name":"Sender","role":"brand"}'::jsonb, pg_catalog.now(), pg_catalog.now()),
  ('00000000-0000-0000-0000-000000000107', 'authenticated', 'authenticated',
   'security-outsider@example.invalid', '', pg_catalog.now(), '{}'::jsonb,
   '{"name":"Outsider","role":"creator"}'::jsonb, pg_catalog.now(), pg_catalog.now()),
  ('00000000-0000-0000-0000-000000000108', 'authenticated', 'authenticated',
   'security-missing-profile@example.invalid', '', pg_catalog.now(), '{}'::jsonb,
   '{"name":"Missing profile","role":"creator"}'::jsonb, pg_catalog.now(), pg_catalog.now()),
  ('00000000-0000-0000-0000-000000000109', 'authenticated', 'authenticated',
   'security-blocked-admin@example.invalid', '', pg_catalog.now(), '{}'::jsonb,
   '{"name":"Blocked admin","role":"creator"}'::jsonb, pg_catalog.now(), pg_catalog.now()),
  ('00000000-0000-0000-0000-000000000110', 'authenticated', 'authenticated',
   'security-suspended-admin@example.invalid', '', pg_catalog.now(), '{}'::jsonb,
   '{"name":"Suspended admin","role":"creator"}'::jsonb, pg_catalog.now(), pg_catalog.now());

UPDATE public.creator_profiles
SET bio = 'private bio sentinel',
    cover_image = 'private cover sentinel',
    location = 'private location sentinel',
    social_links = '{"instagram":"private social sentinel"}'::jsonb,
    followers = 987654,
    engagement_rate = 98.76,
    growth_score = 987654
WHERE user_id = '00000000-0000-0000-0000-000000000102';

SELECT pg_catalog.set_config('request.jwt.claim.role', 'service_role', true);
SELECT pg_catalog.set_config('request.jwt.claims', '{"role":"service_role"}', true);
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  '00000000-0000-0000-0000-000000000104',
  '00000000-0000-0000-0000-000000000109',
  '00000000-0000-0000-0000-000000000110'
);
UPDATE public.profiles
SET is_blocked = true
WHERE id = '00000000-0000-0000-0000-000000000109';
UPDATE public.profiles
SET is_suspended = true
WHERE id = '00000000-0000-0000-0000-000000000110';
DELETE FROM public.profiles
WHERE id = '00000000-0000-0000-0000-000000000108';

INSERT INTO public.collaborations (id, sender_id, receiver_id, status)
VALUES
  ('10000000-0000-0000-0000-000000000101',
   '00000000-0000-0000-0000-000000000106',
   '00000000-0000-0000-0000-000000000105', 'pending'),
  ('10000000-0000-0000-0000-000000000102',
   '00000000-0000-0000-0000-000000000106',
   '00000000-0000-0000-0000-000000000105', 'pending'),
  ('10000000-0000-0000-0000-000000000103',
   '00000000-0000-0000-0000-000000000106',
   '00000000-0000-0000-0000-000000000105', 'accepted'),
  ('10000000-0000-0000-0000-000000000104',
   '00000000-0000-0000-0000-000000000106',
   '00000000-0000-0000-0000-000000000105', 'pending'),
  ('10000000-0000-0000-0000-000000000105',
   '00000000-0000-0000-0000-000000000106',
   '00000000-0000-0000-0000-000000000105', 'pending'),
  ('10000000-0000-0000-0000-000000000106',
   '00000000-0000-0000-0000-000000000106',
   '00000000-0000-0000-0000-000000000105', 'accepted');

SELECT extensions.is(
  (
    SELECT pg_catalog.array_agg(column_name::text ORDER BY ordinal_position)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'public_creator_profiles'
  ),
  ARRAY['user_id', 'username', 'avatar', 'niche']::text[],
  'public creator view exposes only the approved identity and niche fields'
);
SELECT extensions.ok(
  EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class AS c
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'public_creator_profiles'
      AND c.relkind = 'v'
      AND c.relowner = 'postgres'::pg_catalog.regrole
      AND c.reloptions @> ARRAY[
        'security_barrier=true',
        'security_invoker=true'
      ]
  ),
  'public creator view has a trusted owner and security-invoker options'
);
SELECT extensions.ok(
  pg_catalog.has_column_privilege(
    'anon', 'public.creator_profiles', 'user_id', 'SELECT'
  )
  AND pg_catalog.has_column_privilege(
    'anon', 'public.creator_profiles', 'niche', 'SELECT'
  )
  AND NOT pg_catalog.has_column_privilege(
    'anon', 'public.creator_profiles', 'bio', 'SELECT'
  )
  AND pg_catalog.has_column_privilege(
    'authenticated', 'public.creator_profiles', 'social_links', 'SELECT'
  ),
  'anonymous grants are column-limited while authenticated access remains RLS-scoped'
);

SET LOCAL ROLE anon;
SELECT pg_catalog.set_config('request.jwt.claim.role', 'anon', true);
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"anon"}',
  true
);
SELECT pg_catalog.set_config('request.jwt.claim.sub', '', true);
SELECT extensions.is(
  (
    SELECT pg_catalog.count(*)
    FROM public.public_creator_profiles
    WHERE user_id = '00000000-0000-0000-0000-000000000102'
  ),
  1::bigint,
  'anonymous users can read a creator through the minimal public view'
);
SELECT extensions.is(
  (
    SELECT pg_catalog.to_jsonb(v)
      ?| ARRAY[
        'bio', 'cover_image', 'location', 'social_links',
        'followers', 'engagement_rate', 'growth_score'
      ]::text[]
    FROM public.public_creator_profiles AS v
    WHERE v.user_id = '00000000-0000-0000-0000-000000000102'
  ),
  false,
  'public creator view does not contain private-field keys'
);
SELECT extensions.is(
  (
    SELECT pg_catalog.to_jsonb(v)::text LIKE '%private%sentinel%'
    FROM public.public_creator_profiles AS v
    WHERE v.user_id = '00000000-0000-0000-0000-000000000102'
  ),
  false,
  'private creator sentinel values are absent from public view results'
);
SELECT extensions.is(
  (
    SELECT pg_catalog.count(*)
    FROM public.creator_profiles
    WHERE user_id = '00000000-0000-0000-0000-000000000102'
  ),
  1::bigint,
  'anonymous users can query only granted public creator columns'
);
SELECT extensions.throws_ok(
  $$SELECT * FROM public.profiles$$,
  '42501',
  NULL,
  'anonymous users cannot read profiles'
);

SELECT extensions.throws_ok(
  $$SELECT * FROM public.creator_profiles$$,
  '42501',
  NULL,
  'anonymous users cannot read creator profile base rows'
);

SELECT extensions.throws_ok(
  $$SELECT bio FROM public.creator_profiles
    WHERE user_id = '00000000-0000-0000-0000-000000000102'$$,
  '42501',
  NULL,
  'anonymous users cannot read a private creator field directly'
);

-- Switch to authenticated user 108, who has no profile.
RESET ROLE;
SET LOCAL ROLE authenticated;

SELECT pg_catalog.set_config(
  'request.jwt.claim.role',
  'authenticated',
  true
);

SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000108"}',
  true
);

SELECT pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000108',
  true
);

-- The authenticated user cannot insert an admin profile.
SELECT extensions.throws_ok(
  $$INSERT INTO public.profiles (id, email, name, role)
    VALUES (
      '00000000-0000-0000-0000-000000000108',
      'security-missing-profile@example.invalid',
      'Missing profile',
      'admin'
    )$$,
  '42501',
  NULL,
  'an authenticated user cannot insert an admin profile'
);

SELECT extensions.is(
  public.is_admin(),
  false,
  'a user without a profile is not an administrator'
);

RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config('request.jwt.claim.role', 'authenticated', true);
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000102"}',
  true
);
SELECT pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000102',
  true
);
SELECT extensions.is(
  (SELECT pg_catalog.count(*) FROM public.profiles
   WHERE id = '00000000-0000-0000-0000-000000000102'),
  1::bigint,
  'an authenticated owner can read their own profile'
);
SELECT extensions.is(
  (SELECT pg_catalog.count(*) FROM public.creator_profiles
   WHERE user_id = '00000000-0000-0000-0000-000000000102'),
  1::bigint,
  'an authenticated owner can read their own creator profile'
);
SELECT extensions.is(
  (SELECT pg_catalog.count(*) FROM public.profiles
   WHERE id = '00000000-0000-0000-0000-000000000103'),
  0::bigint,
  'an authenticated owner cannot read another user profile'
);
SELECT extensions.is(
  (SELECT pg_catalog.count(*) FROM public.creator_profiles
   WHERE user_id = '00000000-0000-0000-0000-000000000103'),
  0::bigint,
  'an authenticated owner cannot read another creator base row'
);
SELECT extensions.is(
  (
    SELECT pg_catalog.count(*)
    FROM public.creator_profiles
    WHERE user_id = '00000000-0000-0000-0000-000000000103'
      AND bio = 'private bio sentinel'
  ),
  0::bigint,
  'an authenticated owner cannot obtain another creator private fields'
);
SELECT extensions.is(
  (
    SELECT bio
    FROM public.creator_profiles
    WHERE user_id = '00000000-0000-0000-0000-000000000102'
  ),
  'private bio sentinel',
  'an authenticated owner retains access to their private creator fields'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config('request.jwt.claim.role', 'authenticated', true);
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000101","user_metadata":{"role":"admin"}}',
  true
);
SELECT pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000101',
  true
);
SELECT extensions.is(
  (SELECT role FROM public.profiles
   WHERE id = '00000000-0000-0000-0000-000000000101'),
  'creator',
  'signup metadata role admin is stored as creator'
);
SELECT extensions.is(
  public.is_admin(),
  false,
  'user_metadata role admin does not authorize an administrator'
);
SELECT extensions.is(
  (SELECT pg_catalog.count(*) FROM public.profiles
   WHERE id = '00000000-0000-0000-0000-000000000102'),
  0::bigint,
  'user_metadata role admin does not grant profile reads'
);
SELECT extensions.throws_ok(
  $$UPDATE public.profiles SET role = 'admin'
    WHERE id = '00000000-0000-0000-0000-000000000101'$$,
  'P0001',
  'Privileged profile role changes require an explicit service-role operation',
  'an authenticated user cannot promote their own profile'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config('request.jwt.claim.role', 'authenticated', true);
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000104","app_metadata":{"role":"admin"}}',
  true
);
SELECT pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000104',
  true
);
SELECT extensions.is(
  public.is_admin(),
  true,
  'a server-issued admin claim agrees with the active profile role'
);
SELECT extensions.is(
  (SELECT pg_catalog.count(*) FROM public.profiles
   WHERE id = '00000000-0000-0000-0000-000000000102'),
  1::bigint,
  'a trusted app_metadata admin can read another profile'
);
SELECT extensions.is(
  (
    SELECT pg_catalog.count(*)
    FROM public.creator_profiles
    WHERE user_id = '00000000-0000-0000-0000-000000000102'
      AND bio = 'private bio sentinel'
  ),
  1::bigint,
  'a trusted app_metadata admin can read private creator fields'
);
SELECT extensions.lives_ok(
  $$UPDATE public.profiles
    SET is_verified = true
    WHERE id = '00000000-0000-0000-0000-000000000103'$$,
  'a trusted app_metadata admin can update a protected profile field'
);
SELECT extensions.is(
  (SELECT is_verified FROM public.profiles
   WHERE id = '00000000-0000-0000-0000-000000000103'),
  true,
  'the authorized admin profile update is persisted'
);
SELECT extensions.throws_ok(
  $$UPDATE public.profiles
    SET role = 'admin'
    WHERE id = '00000000-0000-0000-0000-000000000103'$$,
  'P0001',
  'Privileged profile role changes require an explicit service-role operation',
  'an authenticated admin cannot assign the administrator role'
);
RESET ROLE;

SET LOCAL ROLE service_role;
SELECT pg_catalog.set_config('request.jwt.claim.role', 'service_role', true);
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"service_role"}',
  true
);
UPDATE public.profiles
SET role = 'creator'
WHERE id = '00000000-0000-0000-0000-000000000104';
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config('request.jwt.claim.role', 'authenticated', true);
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000104","app_metadata":{"role":"admin"}}',
  true
);
SELECT pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000104',
  true
);
SELECT extensions.is(
  public.is_admin(),
  false,
  'a stale app_metadata admin claim does not survive profile demotion'
);
SELECT extensions.is(
  (SELECT pg_catalog.count(*) FROM public.profiles
   WHERE id = '00000000-0000-0000-0000-000000000102'),
  0::bigint,
  'a demoted admin claim cannot read another profile'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config('request.jwt.claim.role', 'authenticated', true);
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000108","app_metadata":{"role":"admin"}}',
  true
);
SELECT pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000108',
  true
);
SELECT extensions.is(
  public.is_admin(),
  false,
  'a trusted admin claim without a profile is not authorized'
);
SELECT extensions.is(
  (SELECT pg_catalog.count(*) FROM public.profiles
   WHERE id = '00000000-0000-0000-0000-000000000102'),
  0::bigint,
  'an admin claim without a profile cannot read another profile'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config('request.jwt.claim.role', 'authenticated', true);
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000109","app_metadata":{"role":"admin"}}',
  true
);
SELECT pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000109',
  true
);
SELECT extensions.is(
  public.is_admin(),
  false,
  'a blocked trusted admin is not authorized'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config('request.jwt.claim.role', 'authenticated', true);
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000110","app_metadata":{"role":"admin"}}',
  true
);
SELECT pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000110',
  true
);
SELECT extensions.is(
  public.is_admin(),
  false,
  'a suspended trusted admin is not authorized'
);
RESET ROLE;

SET LOCAL ROLE service_role;
SELECT pg_catalog.set_config('request.jwt.claim.role', 'service_role', true);
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"service_role"}',
  true
);
SELECT pg_catalog.set_config('request.jwt.claim.sub', '', true);
SELECT extensions.is(
  (SELECT auth.role()),
  'service_role',
  'the service-role JWT context is reported explicitly by auth.role()'
);
SELECT extensions.ok(
  (SELECT auth.uid()) IS NULL,
  'this service-role test context has no user UID'
);
SELECT extensions.lives_ok(
  $$UPDATE public.profiles SET role = 'admin'
    WHERE id = '00000000-0000-0000-0000-000000000101'$$,
  'a service-role operation can assign an administrator'
);
SELECT extensions.is(
  (SELECT role FROM public.profiles
   WHERE id = '00000000-0000-0000-0000-000000000101'),
  'admin',
  'the trusted service-role assignment is persisted'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config('request.jwt.claim.role', 'authenticated', true);
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000101"}',
  true
);
SELECT pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000101',
  true
);
SELECT extensions.is(
  public.is_admin(),
  true,
  'a service-promoted profile role authorizes the administrator'
);
SELECT extensions.is(
  (SELECT pg_catalog.count(*) FROM public.profiles
   WHERE id = '00000000-0000-0000-0000-000000000102'),
  1::bigint,
  'a profile-role admin can read another profile'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config('request.jwt.claim.role', 'authenticated', true);
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000105"}',
  true
);
SELECT pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000105',
  true
);
WITH changed AS (
  UPDATE public.collaborations
  SET status = 'accepted'
  WHERE id = '10000000-0000-0000-0000-000000000101'
  RETURNING 1
)
SELECT extensions.is(
  (SELECT pg_catalog.count(*) FROM changed),
  1::bigint,
  'the receiver can accept a pending collaboration'
);

WITH changed AS (
  UPDATE public.collaborations
  SET status = 'rejected'
  WHERE id = '10000000-0000-0000-0000-000000000105'
  RETURNING 1
)
SELECT extensions.is(
  (SELECT pg_catalog.count(*) FROM changed),
  1::bigint,
  'the receiver can reject a pending collaboration'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config('request.jwt.claim.role', 'authenticated', true);
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000106"}',
  true
);
SELECT pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000106',
  true
);
WITH changed AS (
  UPDATE public.collaborations
  SET status = 'accepted'
  WHERE id = '10000000-0000-0000-0000-000000000102'
  RETURNING 1
)
SELECT extensions.is(
  (SELECT pg_catalog.count(*) FROM changed),
  0::bigint,
  'the sender cannot accept a pending collaboration'
);

WITH changed AS (
  UPDATE public.collaborations
  SET status = 'accepted'
  WHERE id = '10000000-0000-0000-0000-000000000104'
  RETURNING 1
)
SELECT extensions.is(
  (SELECT pg_catalog.count(*) FROM changed),
  0::bigint,
  'the sender cannot change an unrelated collaboration'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config('request.jwt.claim.role', 'authenticated', true);
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000107"}',
  true
);
SELECT pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000107',
  true
);
WITH changed AS (
  UPDATE public.collaborations
  SET status = 'accepted'
  WHERE id = '10000000-0000-0000-0000-000000000104'
  RETURNING 1
)
SELECT extensions.is(
  (SELECT pg_catalog.count(*) FROM changed),
  0::bigint,
  'an unrelated user cannot transition another collaboration'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config('request.jwt.claim.role', 'authenticated', true);
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000106"}',
  true
);
SELECT pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000106',
  true
);
WITH changed AS (
  UPDATE public.collaborations
  SET status = 'completed'
  WHERE id = '10000000-0000-0000-0000-000000000103'
  RETURNING 1
)
SELECT extensions.is(
  (SELECT pg_catalog.count(*) FROM changed),
  1::bigint,
  'a participant can complete an accepted collaboration'
);
WITH changed AS (
  UPDATE public.collaborations
  SET status = 'pending'
  WHERE id = '10000000-0000-0000-0000-000000000103'
  RETURNING 1
)
SELECT extensions.is(
  (SELECT pg_catalog.count(*) FROM changed),
  0::bigint,
  'a terminal collaboration cannot be reopened by a participant'
);
RESET ROLE;

-- Run invalid transitions as the table owner so RLS cannot hide the row before
-- the trigger raises the expected error. The test connection must own the table.
SELECT extensions.ok(
  EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class AS c
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    JOIN pg_catalog.pg_roles AS r ON r.rolname = CURRENT_USER
    WHERE n.nspname = 'public'
      AND c.relname = 'collaborations'
      AND (r.rolsuper OR c.relowner = r.oid)
  ),
  'test connection can bypass collaboration RLS to exercise the trigger'
);
SELECT pg_catalog.set_config(
  'request.jwt.claim.role',
  'authenticated',
  true
);
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000106"}',
  true
);
SELECT pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000106',
  true
);
SELECT extensions.throws_ok(
  $$UPDATE public.collaborations
    SET status = 'accepted'
    WHERE id = '10000000-0000-0000-0000-000000000102'$$,
  'P0001',
  'Unauthorized: only the receiver may accept or reject a pending collaboration',
  'the trigger rejects a sender accepting a pending collaboration'
);
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000105"}',
  true
);
SELECT pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000105',
  true
);
SELECT extensions.throws_ok(
  $$UPDATE public.collaborations
    SET status = 'completed'
    WHERE id = '10000000-0000-0000-0000-000000000104'$$,
  'P0001',
  'Invalid transition: pending collaborations can only be accepted or rejected',
  'the trigger rejects pending-to-completed'
);
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000106"}',
  true
);
SELECT pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000106',
  true
);
SELECT extensions.throws_ok(
  $$UPDATE public.collaborations
    SET status = 'pending'
    WHERE id = '10000000-0000-0000-0000-000000000106'$$,
  'P0001',
  'Invalid transition: accepted collaborations can only be completed',
  'the trigger rejects accepted-to-pending'
);
SELECT extensions.throws_ok(
  $$UPDATE public.collaborations
    SET status = 'rejected'
    WHERE id = '10000000-0000-0000-0000-000000000106'$$,
  'P0001',
  'Invalid transition: accepted collaborations can only be completed',
  'the trigger rejects accepted-to-rejected'
);
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000107"}',
  true
);
SELECT pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000107',
  true
);
SELECT extensions.throws_ok(
  $$UPDATE public.collaborations
    SET status = 'completed'
    WHERE id = '10000000-0000-0000-0000-000000000106'$$,
  'P0001',
  'Unauthorized: only participants may complete a collaboration',
  'the trigger rejects a non-participant completing an accepted collaboration'
);
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000106"}',
  true
);
SELECT pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000106',
  true
);
SELECT extensions.throws_ok(
  $$UPDATE public.collaborations
    SET status = 'pending'
    WHERE id = '10000000-0000-0000-0000-000000000103'$$,
  'P0001',
  'Invalid transition: Collaboration 10000000-0000-0000-0000-000000000103 is in terminal status "completed"',
  'the trigger rejects reopening a completed collaboration'
);
SELECT extensions.throws_ok(
  $$UPDATE public.collaborations
    SET status = 'pending'
    WHERE id = '10000000-0000-0000-0000-000000000105'$$,
  'P0001',
  'Invalid transition: Collaboration 10000000-0000-0000-0000-000000000105 is in terminal status "rejected"',
  'the trigger rejects reopening a rejected collaboration'
);

-- Execute as the table owner to reach the trigger while presenting an anon
-- non-service JWT with no subject. This specifically proves NULL UID is not a
-- trigger bypass; it does not substitute for an actual anon API request.
SELECT pg_catalog.set_config('request.jwt.claim.role', 'anon', true);
SELECT pg_catalog.set_config('request.jwt.claims', '{"role":"anon"}', true);
SELECT pg_catalog.set_config('request.jwt.claim.sub', '', true);
SELECT extensions.throws_ok(
  $$UPDATE public.collaborations
    SET status = 'accepted'
    WHERE id = '10000000-0000-0000-0000-000000000104'$$,
  'P0001',
  'Unauthorized: only the receiver may accept or reject a pending collaboration',
  'a NULL UID without the service-role claim is not authorized'
);

SET LOCAL ROLE service_role;
SELECT pg_catalog.set_config('request.jwt.claim.role', 'service_role', true);
SELECT pg_catalog.set_config('request.jwt.claims', '{"role":"service_role"}', true);
SELECT pg_catalog.set_config('request.jwt.claim.sub', '', true);
WITH changed AS (
  UPDATE public.collaborations
  SET status = 'accepted'
  WHERE id = '10000000-0000-0000-0000-000000000104'
  RETURNING 1
)
SELECT extensions.is(
  (SELECT pg_catalog.count(*) FROM changed),
  1::bigint,
  'an explicit service-role context can perform a validated backend transition'
);
SELECT extensions.throws_ok(
  $$UPDATE public.collaborations
    SET sender_id = '00000000-0000-0000-0000-000000000107'
    WHERE id = '10000000-0000-0000-0000-000000000104'$$,
  'P0001',
  'Unauthorized: sender_id is immutable on collaborations (id=10000000-0000-0000-0000-000000000104)',
  'service role cannot change immutable collaboration participants'
);
SELECT extensions.throws_ok(
  $$UPDATE public.collaborations
    SET receiver_id = '00000000-0000-0000-0000-000000000107'
    WHERE id = '10000000-0000-0000-0000-000000000104'$$,
  'P0001',
  'Unauthorized: receiver_id is immutable on collaborations (id=10000000-0000-0000-0000-000000000104)',
  'service role cannot change the immutable receiver'
);
RESET ROLE;

SELECT extensions.ok(
  EXISTS (
    SELECT 1
    FROM pg_catalog.pg_trigger AS t
    JOIN pg_catalog.pg_class AS c ON c.oid = t.tgrelid
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'profiles'
      AND t.tgname = 'set_profiles_updated_at'
      AND NOT t.tgisinternal
      AND t.tgenabled <> 'D'
  ),
  'profile updated_at trigger remains enabled'
);
SELECT extensions.ok(
  EXISTS (
    SELECT 1
    FROM pg_catalog.pg_trigger AS t
    JOIN pg_catalog.pg_class AS c ON c.oid = t.tgrelid
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'creator_profiles'
      AND t.tgname = 'set_creator_profiles_updated_at'
      AND NOT t.tgisinternal
      AND t.tgenabled <> 'D'
  ),
  'creator profile updated_at trigger remains enabled'
);
SELECT extensions.ok(
  EXISTS (
    SELECT 1
    FROM pg_catalog.pg_trigger AS t
    JOIN pg_catalog.pg_class AS c ON c.oid = t.tgrelid
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'collaborations'
      AND t.tgname = 'set_collaborations_updated_at'
      AND NOT t.tgisinternal
      AND t.tgenabled <> 'D'
  ),
  'collaboration updated_at trigger remains enabled'
);
SELECT extensions.ok(
  EXISTS (
    SELECT 1
    FROM pg_catalog.pg_trigger AS t
    JOIN pg_catalog.pg_class AS c ON c.oid = t.tgrelid
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    JOIN pg_catalog.pg_proc AS p ON p.oid = t.tgfoid
    JOIN pg_catalog.pg_namespace AS pn ON pn.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'collaborations'
      AND t.tgname = 'trg_protect_collaboration_status_transitions'
      AND pn.nspname = 'public'
      AND p.proname = 'protect_collaboration_status_transitions'
      AND NOT t.tgisinternal
      AND t.tgenabled <> 'D'
  ),
  'collaboration transition guard remains enabled'
);
SELECT extensions.ok(
  EXISTS (
    SELECT 1
    FROM pg_catalog.pg_trigger AS t
    JOIN pg_catalog.pg_class AS c ON c.oid = t.tgrelid
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    JOIN pg_catalog.pg_proc AS p ON p.oid = t.tgfoid
    JOIN pg_catalog.pg_namespace AS pn ON pn.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'profiles'
      AND t.tgname = 'trg_protect_profile_privileged_fields'
      AND pn.nspname = 'public'
      AND p.proname = 'protect_profile_privileged_fields'
      AND NOT t.tgisinternal
      AND t.tgenabled <> 'D'
  ),
  'profile privileged-field guard is attached and enabled'
);
SELECT extensions.ok(
  EXISTS (
    SELECT 1
    FROM pg_catalog.pg_trigger AS t
    JOIN pg_catalog.pg_class AS c ON c.oid = t.tgrelid
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    JOIN pg_catalog.pg_proc AS p ON p.oid = t.tgfoid
    JOIN pg_catalog.pg_namespace AS pn ON pn.oid = p.pronamespace
    WHERE n.nspname = 'auth'
      AND c.relname = 'users'
      AND t.tgname = 'on_auth_user_created'
      AND pn.nspname = 'public'
      AND p.proname = 'handle_new_auth_user'
      AND NOT t.tgisinternal
      AND t.tgenabled <> 'D'
  ),
  'auth user creation trigger is attached and enabled'
);
SELECT extensions.ok(
  EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc AS p
    JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'is_admin'
      AND p.prosecdef
      AND p.proconfig @> ARRAY['search_path=pg_catalog']
  )
  AND EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc AS p
    JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'handle_new_auth_user'
      AND p.prosecdef
      AND p.proconfig @> ARRAY['search_path=pg_catalog']
  )
  AND EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc AS p
    JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'protect_profile_privileged_fields'
      AND p.prosecdef
      AND p.proconfig @> ARRAY['search_path=pg_catalog']
  )
  AND EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc AS p
    JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'protect_collaboration_status_transitions'
      AND p.prosecdef
      AND p.proconfig @> ARRAY['search_path=pg_catalog']
  ),
  'security definer functions have a controlled search_path'
);
SELECT extensions.ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc AS p
    JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'is_admin',
        'handle_new_auth_user',
        'protect_profile_privileged_fields',
        'protect_collaboration_status_transitions'
      )
      AND pg_catalog.pg_get_userbyid(p.proowner) <> 'postgres'
  ),
  'security definer functions are owned by the trusted postgres role'
);
SELECT extensions.ok(
  pg_catalog.has_function_privilege(
    'authenticated',
    'public.is_admin()',
    'EXECUTE'
  ),
  'authenticated role retains execute access required by admin policies'
);
SELECT extensions.ok(
  NOT EXISTS (
    SELECT 1
    FROM (
      VALUES
        ('anon', 'public.is_admin()', false),
        ('authenticated', 'public.is_admin()', true),
        ('anon', 'public.handle_new_auth_user()', false),
        ('authenticated', 'public.handle_new_auth_user()', false),
        ('service_role', 'public.handle_new_auth_user()', false),
        ('anon', 'public.protect_profile_privileged_fields()', false),
        ('authenticated', 'public.protect_profile_privileged_fields()', false),
        ('service_role', 'public.protect_profile_privileged_fields()', false),
        ('anon', 'public.protect_collaboration_status_transitions()', false),
        ('authenticated', 'public.protect_collaboration_status_transitions()', false),
        ('service_role', 'public.protect_collaboration_status_transitions()', false)
    ) AS expected(role_name, function_name, can_execute)
    WHERE pg_catalog.has_function_privilege(
      expected.role_name,
      expected.function_name,
      'EXECUTE'
    ) IS DISTINCT FROM expected.can_execute
  ),
  'function EXECUTE grants match the intended least-privilege matrix'
);

SELECT * FROM extensions.finish();
ROLLBACK;

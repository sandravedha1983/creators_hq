BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT extensions.plan(14);

INSERT INTO auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES
  ('00000000-0000-0000-0000-000000000221', 'authenticated', 'authenticated',
   'verification-creator@example.invalid', '', pg_catalog.now(), '{}'::jsonb,
   '{"name":"Verification Creator","role":"creator"}'::jsonb, pg_catalog.now(), pg_catalog.now()),
  ('00000000-0000-0000-0000-000000000222', 'authenticated', 'authenticated',
   'verification-brand@example.invalid', '', pg_catalog.now(), '{}'::jsonb,
   '{"name":"Verification Brand","role":"brand"}'::jsonb, pg_catalog.now(), pg_catalog.now()),
  ('00000000-0000-0000-0000-000000000223', 'authenticated', 'authenticated',
   'verification-admin@example.invalid', '', pg_catalog.now(), '{}'::jsonb,
   '{"name":"Verification Admin","role":"creator"}'::jsonb, pg_catalog.now(), pg_catalog.now());

SELECT pg_catalog.set_config('request.jwt.claim.role', 'service_role', true);
SELECT pg_catalog.set_config('request.jwt.claims', '{"role":"service_role"}', true);
UPDATE public.profiles SET role = 'admin'
WHERE id = '00000000-0000-0000-0000-000000000223';
INSERT INTO public.verification_requests (id, user_id, account_role, status, application_data)
VALUES (
  '20000000-0000-0000-0000-000000000221',
  '00000000-0000-0000-0000-000000000221',
  'creator',
  'pending',
  '{"full_name":"Verification Creator","niche":"Art","location":"Toronto"}'::jsonb
);
INSERT INTO public.campaigns (id, brand_id, title, description, budget)
VALUES (
  '30000000-0000-0000-0000-000000000221',
  '00000000-0000-0000-0000-000000000222',
  'Verification test campaign',
  'RLS test record',
  '1000'
);

SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config('request.jwt.claim.role', 'authenticated', true);
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000221"}',
  true
);
SELECT pg_catalog.set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000221', true);
SELECT extensions.throws_ok(
  $$UPDATE public.profiles SET verification_status = 'verified'
    WHERE id = '00000000-0000-0000-0000-000000000221'$$,
  'P0001',
  'Privileged verification and account status changes require an explicit service-role operation',
  'Creator cannot self-approve by changing verification_status'
);
SELECT extensions.throws_ok(
  $$UPDATE public.profiles SET is_verified = true
    WHERE id = '00000000-0000-0000-0000-000000000221'$$,
  'P0001',
  'Privileged verification and account status changes require an explicit service-role operation',
  'Creator cannot self-approve by changing is_verified'
);
SELECT extensions.throws_ok(
  $$INSERT INTO public.verification_requests(user_id, account_role, application_data)
    VALUES ('00000000-0000-0000-0000-000000000221', 'creator', '{}'::jsonb)$$,
  '42501',
  'permission denied for table verification_requests',
  'Creator cannot write verification requests directly'
);
SELECT extensions.is(
  public.is_verified_account('creator'),
  false,
  'pending Creator is not considered verified by database policy helpers'
);
SELECT extensions.throws_ok(
  $$INSERT INTO public.campaign_applications(campaign_id, creator_id)
    VALUES (
      '30000000-0000-0000-0000-000000000221',
      '00000000-0000-0000-0000-000000000221'
    )$$,
  '42501',
  'new row violates row-level security policy for table "campaign_applications"',
  'pending Creator cannot apply to a campaign through direct database access'
);
SELECT extensions.throws_ok(
  $$INSERT INTO public.collaborations(sender_id, receiver_id)
    VALUES (
      '00000000-0000-0000-0000-000000000221',
      '00000000-0000-0000-0000-000000000222'
    )$$,
  '42501',
  'new row violates row-level security policy for table "collaborations"',
  'pending Creator cannot create a collaboration through direct database access'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config('request.jwt.claim.role', 'authenticated', true);
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000222"}',
  true
);
SELECT pg_catalog.set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000222', true);
SELECT extensions.throws_ok(
  $$UPDATE public.profiles SET verification_status = 'verified'
    WHERE id = '00000000-0000-0000-0000-000000000222'$$,
  'P0001',
  'Privileged verification and account status changes require an explicit service-role operation',
  'Brand cannot self-approve by changing verification_status'
);
SELECT extensions.throws_ok(
  $$UPDATE public.profiles SET is_verified = true
    WHERE id = '00000000-0000-0000-0000-000000000222'$$,
  'P0001',
  'Privileged verification and account status changes require an explicit service-role operation',
  'Brand cannot self-approve by changing is_verified'
);
SELECT extensions.throws_ok(
  $$SELECT public.apply_verification_decision(
    '20000000-0000-0000-0000-000000000221',
    'verified', NULL, NULL,
    '00000000-0000-0000-0000-000000000222'
  )$$,
  '42501',
  'permission denied for function apply_verification_decision',
  'Brand cannot call the Admin decision function'
);
SELECT extensions.throws_ok(
  $$INSERT INTO public.campaigns(brand_id, title, description, budget)
    VALUES (
      '00000000-0000-0000-0000-000000000222',
      'Unverified Brand campaign',
      'RLS test record',
      '1000'
    )$$,
  '42501',
  'new row violates row-level security policy for table "campaigns"',
  'pending Brand cannot launch a campaign through direct database access'
);
SELECT extensions.throws_ok(
  $$INSERT INTO public.audit_logs(actor_id, action, entity_type)
    VALUES ('00000000-0000-0000-0000-000000000222', 'forged', 'verification_request')$$,
  '42501',
  'permission denied for table audit_logs',
  'ordinary authenticated users cannot write trusted audit records'
);
RESET ROLE;

SET LOCAL ROLE service_role;
SELECT pg_catalog.set_config('request.jwt.claim.role', 'service_role', true);
SELECT pg_catalog.set_config('request.jwt.claims', '{"role":"service_role"}', true);
SELECT extensions.lives_ok(
  $$SELECT public.apply_verification_decision(
    '20000000-0000-0000-0000-000000000221',
    'verified', NULL, NULL,
    '00000000-0000-0000-0000-000000000223'
  )$$,
  'trusted Admin decision succeeds through the server-only function'
);
SELECT extensions.is(
  (SELECT verification_status FROM public.profiles
   WHERE id = '00000000-0000-0000-0000-000000000221'),
  'verified',
  'Admin decision synchronizes the canonical profile status'
);
SELECT extensions.is(
  (SELECT pg_catalog.count(*) FROM public.audit_logs
   WHERE actor_id = '00000000-0000-0000-0000-000000000223'
     AND entity_id = '20000000-0000-0000-0000-000000000221'
     AND action = 'verification_approved'),
  1::bigint,
  'Admin approval is written to the existing audit log'
);

SELECT * FROM extensions.finish();
ROLLBACK;

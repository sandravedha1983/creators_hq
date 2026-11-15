BEGIN;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_verification_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_verification_status_check
  CHECK (verification_status IN (
    'not_submitted',
    'pending',
    'under_review',
    'additional_information_required',
    'verified',
    'rejected',
    'suspended'
  ));

CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_role TEXT NOT NULL CHECK (account_role IN ('creator', 'brand')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'under_review',
    'additional_information_required',
    'verified',
    'rejected',
    'suspended'
  )),
  application_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  screening_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  decision_reason TEXT,
  admin_notes TEXT,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_status_submitted
  ON public.verification_requests(status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_submitted
  ON public.verification_requests(user_id, submitted_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_requests_one_active_per_user
  ON public.verification_requests(user_id)
  WHERE status IN ('pending', 'under_review', 'additional_information_required');

CREATE TABLE IF NOT EXISTS public.verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.verification_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE,
  document_name TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('application/pdf', 'image/jpeg', 'image/png')),
  file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 10485760),
  document_type TEXT NOT NULL DEFAULT 'supporting_evidence',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_documents_request
  ON public.verification_documents(request_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('verification_docs', 'verification_docs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

CREATE TABLE IF NOT EXISTS public.oauth_signup_role_intents (
  code_hash TEXT PRIMARY KEY CHECK (code_hash ~ '^[a-f0-9]{64}$'),
  role TEXT NOT NULL CHECK (role IN ('creator', 'brand')),
  binding_hash TEXT NOT NULL CHECK (binding_hash ~ '^[a-f0-9]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_oauth_signup_role_intents_expires
  ON public.oauth_signup_role_intents(expires_at);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_signup_role_intents ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.verification_requests FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.verification_documents FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.oauth_signup_role_intents FROM PUBLIC, anon, authenticated;

-- Verification submissions, review reads and decisions are performed only by
-- the trusted backend, which scopes every request by the verified Supabase UUID.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.verification_requests TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.verification_documents TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.oauth_signup_role_intents TO service_role;

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF (SELECT auth.role()) IS DISTINCT FROM 'service_role' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION
        'Privileged profile role changes require an explicit service-role operation';
    END IF;

    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
       OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
       OR NEW.is_blocked IS DISTINCT FROM OLD.is_blocked
       OR NEW.is_suspended IS DISTINCT FROM OLD.is_suspended THEN
      RAISE EXCEPTION
        'Privileged verification and account status changes require an explicit service-role operation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.protect_profile_privileged_fields() OWNER TO postgres;
REVOKE ALL PRIVILEGES ON FUNCTION public.protect_profile_privileged_fields()
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_role TEXT;
  v_name TEXT;
BEGIN
  v_role := CASE
    WHEN NEW.raw_user_meta_data ->> 'role' = 'brand' THEN 'brand'
    ELSE 'creator'
  END;
  v_name := COALESCE(
    NEW.raw_user_meta_data ->> 'name',
    pg_catalog.split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles AS existing_profile (id, email, name, role)
  VALUES (NEW.id, NEW.email, v_name, v_role)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name = CASE
        WHEN existing_profile.name = '' THEN EXCLUDED.name
        ELSE existing_profile.name
      END;

  IF v_role = 'brand' THEN
    INSERT INTO public.brand_profiles (user_id, company_name)
    VALUES (NEW.id, v_name)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO public.creator_profiles (user_id, username)
    VALUES (NEW.id, pg_catalog.split_part(NEW.email, '@', 1))
    ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO public.analytics (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
ALTER FUNCTION public.handle_new_auth_user() OWNER TO postgres;
REVOKE ALL PRIVILEGES ON FUNCTION public.handle_new_auth_user()
  FROM PUBLIC, anon, authenticated, service_role;

-- Trusted audit events are written only by backend service-role operations.
DROP POLICY IF EXISTS "Authenticated users or service can insert audit logs"
  ON public.audit_logs;
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT INSERT, SELECT ON public.audit_logs TO service_role;

-- Verification evidence is served only through short-lived backend-signed URLs.
DROP POLICY IF EXISTS "Owner or admin can view verification documents"
  ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their verification docs"
  ON storage.objects;
DROP POLICY IF EXISTS "Verification documents require backend delivery"
  ON storage.objects;
CREATE POLICY "Verification documents require backend delivery"
  ON storage.objects
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (bucket_id <> 'verification_docs')
  WITH CHECK (bucket_id <> 'verification_docs');

-- Authenticated users cannot bypass the backend lifecycle by writing directly.
DROP FUNCTION IF EXISTS public.is_verified_account();
CREATE OR REPLACE FUNCTION public.is_verified_account(p_expected_role TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.id = (SELECT auth.uid())
      AND p.verification_status = 'verified'
      AND p.is_verified
      AND NOT p.is_blocked
      AND NOT p.is_suspended
      AND (p_expected_role IS NULL OR p.role = p_expected_role)
  );
$$;

ALTER FUNCTION public.is_verified_account(TEXT) OWNER TO postgres;
REVOKE ALL PRIVILEGES ON FUNCTION public.is_verified_account(TEXT)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_verified_account(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.apply_verification_decision(
  p_request_id UUID,
  p_status TEXT,
  p_reason TEXT,
  p_admin_notes TEXT,
  p_reviewer_id UUID
)
RETURNS public.verification_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_request public.verification_requests;
  v_reviewer public.profiles;
  v_before_status TEXT;
  v_now TIMESTAMPTZ := pg_catalog.now();
  v_action TEXT;
BEGIN
  IF (SELECT auth.role()) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Verification decisions require a trusted server operation';
  END IF;

  SELECT * INTO v_reviewer
  FROM public.profiles
  WHERE id = p_reviewer_id;
  IF NOT FOUND OR v_reviewer.role <> 'admin'
     OR v_reviewer.is_blocked OR v_reviewer.is_suspended THEN
    RAISE EXCEPTION 'An active Admin reviewer is required';
  END IF;

  SELECT * INTO v_request
  FROM public.verification_requests
  WHERE id = p_request_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification request not found';
  END IF;
  v_before_status := v_request.status;
  IF NOT (
    (v_request.status = 'pending' AND p_status IN (
      'under_review', 'additional_information_required', 'verified', 'rejected', 'suspended'
    ))
    OR (v_request.status = 'under_review' AND p_status IN (
      'additional_information_required', 'verified', 'rejected', 'suspended'
    ))
    OR (v_request.status = 'additional_information_required' AND p_status IN (
      'under_review', 'verified', 'rejected', 'suspended'
    ))
    OR (v_request.status = 'verified' AND p_status = 'suspended')
  ) THEN
    RAISE EXCEPTION 'Invalid verification transition from % to %', v_request.status, p_status;
  END IF;
  IF p_status IN ('rejected', 'additional_information_required', 'suspended')
     AND pg_catalog.length(pg_catalog.btrim(COALESCE(p_reason, ''))) = 0 THEN
    RAISE EXCEPTION 'A reason is required for this decision';
  END IF;

  UPDATE public.verification_requests
  SET status = p_status,
      decision_reason = NULLIF(pg_catalog.btrim(COALESCE(p_reason, '')), ''),
      admin_notes = NULLIF(pg_catalog.btrim(COALESCE(p_admin_notes, '')), ''),
      reviewer_id = p_reviewer_id,
      reviewed_at = v_now,
      updated_at = v_now
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  UPDATE public.profiles
  SET verification_status = p_status,
      is_verified = (p_status = 'verified'),
      is_suspended = CASE
        WHEN p_status = 'suspended' THEN true
        WHEN p_status = 'verified' THEN false
        ELSE is_suspended
      END
  WHERE id = v_request.user_id;

  v_action := CASE p_status
    WHEN 'verified' THEN 'verification_approved'
    WHEN 'rejected' THEN 'verification_rejected'
    WHEN 'additional_information_required' THEN 'verification_more_information_requested'
    WHEN 'suspended' THEN 'account_suspended'
    ELSE 'verification_review_started'
  END;

  INSERT INTO public.audit_logs (
    actor_id, action, entity_type, entity_id, details
  ) VALUES (
    p_reviewer_id,
    v_action,
    'verification_request',
    v_request.id::TEXT,
    pg_catalog.jsonb_build_object(
      'target_user_id', v_request.user_id,
      'account_role', v_request.account_role,
      'reason', NULLIF(pg_catalog.btrim(COALESCE(p_reason, '')), ''),
      'before_status', v_before_status,
      'after_status', p_status
    )
  );

  RETURN v_request;
END;
$$;

ALTER FUNCTION public.apply_verification_decision(UUID, TEXT, TEXT, TEXT, UUID)
  OWNER TO postgres;
REVOKE ALL PRIVILEGES ON FUNCTION public.apply_verification_decision(UUID, TEXT, TEXT, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_verification_decision(UUID, TEXT, TEXT, TEXT, UUID)
  TO service_role;

CREATE OR REPLACE FUNCTION public.record_verification_submission(
  p_request_id UUID,
  p_user_id UUID,
  p_role TEXT,
  p_application_data JSONB,
  p_screening_result JSONB
)
RETURNS public.verification_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_profile public.profiles;
  v_request public.verification_requests;
  v_previous_status TEXT;
  v_action TEXT;
BEGIN
  IF (SELECT auth.role()) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Verification submissions require a trusted server operation';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_profile.role IS DISTINCT FROM p_role
     OR v_profile.is_blocked OR v_profile.is_suspended
     OR v_profile.verification_status = 'suspended' THEN
    RAISE EXCEPTION 'This account cannot submit verification';
  END IF;
  IF v_profile.verification_status = 'verified' OR v_profile.is_verified THEN
    RAISE EXCEPTION 'A verified account cannot submit another verification application';
  END IF;

  SELECT * INTO v_request
  FROM public.verification_requests
  WHERE id = p_request_id AND user_id = p_user_id AND account_role = p_role
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification request not found';
  END IF;
  v_previous_status := v_request.status;

  IF v_previous_status = 'additional_information_required' THEN
    UPDATE public.verification_requests
    SET status = 'pending',
        application_data = p_application_data,
        screening_result = p_screening_result,
        decision_reason = NULL,
        admin_notes = NULL,
        reviewer_id = NULL,
        reviewed_at = NULL,
        submitted_at = pg_catalog.now(),
        updated_at = pg_catalog.now()
    WHERE id = p_request_id
    RETURNING * INTO v_request;
    v_action := 'verification_resubmitted';
  ELSIF v_previous_status = 'pending' THEN
    UPDATE public.verification_requests
    SET application_data = p_application_data,
        screening_result = p_screening_result
    WHERE id = p_request_id
    RETURNING * INTO v_request;
    v_action := 'verification_submitted';
  ELSE
    RAISE EXCEPTION 'This verification request cannot be submitted from status %', v_previous_status;
  END IF;

  UPDATE public.profiles
  SET verification_status = 'pending', is_verified = false
  WHERE id = p_user_id;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (
    p_user_id,
    v_action,
    'verification_request',
    p_request_id::TEXT,
    pg_catalog.jsonb_build_object(
      'target_user_id', p_user_id,
      'account_role', p_role,
      'before_status', v_previous_status,
      'after_status', 'pending',
      'screening_outcome', p_screening_result ->> 'outcome'
    )
  );
  RETURN v_request;
END;
$$;

ALTER FUNCTION public.record_verification_submission(UUID, UUID, TEXT, JSONB, JSONB)
  OWNER TO postgres;
REVOKE ALL PRIVILEGES ON FUNCTION public.record_verification_submission(UUID, UUID, TEXT, JSONB, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_verification_submission(UUID, UUID, TEXT, JSONB, JSONB)
  TO service_role;

CREATE OR REPLACE FUNCTION public.provision_admin_role(
  p_user_id UUID,
  p_reason TEXT,
  p_operator TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_old_role TEXT;
  v_confirmed_at TIMESTAMPTZ;
BEGIN
  IF (SELECT auth.role()) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Admin provisioning requires a trusted server operation';
  END IF;
  IF pg_catalog.length(pg_catalog.btrim(COALESCE(p_reason, ''))) = 0 THEN
    RAISE EXCEPTION 'A provisioning reason is required';
  END IF;

  SELECT p.role INTO v_old_role
  FROM public.profiles AS p
  WHERE p.id = p_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The target account profile does not exist';
  END IF;
  IF v_old_role = 'admin' THEN
    RAISE EXCEPTION 'The target account is already an Admin';
  END IF;

  SELECT u.email_confirmed_at INTO v_confirmed_at
  FROM auth.users AS u
  WHERE u.id = p_user_id;
  IF v_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'The target Supabase Auth account must have a confirmed email';
  END IF;

  UPDATE public.profiles SET role = 'admin' WHERE id = p_user_id;
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (
    NULL,
    'platform_admin_provisioned',
    'profile',
    p_user_id::TEXT,
    pg_catalog.jsonb_build_object(
      'target_user_id', p_user_id,
      'previous_role', v_old_role,
      'new_role', 'admin',
      'reason', pg_catalog.btrim(p_reason),
      'operator', NULLIF(pg_catalog.btrim(COALESCE(p_operator, '')), ''),
      'provisioning_method', 'trusted_service_role_cli'
    )
  );
END;
$$;

ALTER FUNCTION public.provision_admin_role(UUID, TEXT, TEXT) OWNER TO postgres;
REVOKE ALL PRIVILEGES ON FUNCTION public.provision_admin_role(UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.provision_admin_role(UUID, TEXT, TEXT)
  TO service_role;

CREATE OR REPLACE FUNCTION public.revoke_admin_role(
  p_user_id UUID,
  p_restore_role TEXT,
  p_reason TEXT,
  p_operator TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_old_role TEXT;
  v_admin_count BIGINT;
BEGIN
  IF (SELECT auth.role()) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Admin role changes require a trusted server operation';
  END IF;
  IF p_restore_role NOT IN ('creator', 'brand')
     OR pg_catalog.length(pg_catalog.btrim(COALESCE(p_reason, ''))) = 0 THEN
    RAISE EXCEPTION 'A valid restore role and reason are required';
  END IF;

  SELECT p.role INTO v_old_role
  FROM public.profiles AS p
  WHERE p.id = p_user_id
  FOR UPDATE;
  IF NOT FOUND OR v_old_role <> 'admin' THEN
    RAISE EXCEPTION 'The target account is not an Admin';
  END IF;

  SELECT pg_catalog.count(*) INTO v_admin_count
  FROM public.profiles
  WHERE role = 'admin' AND NOT is_blocked AND NOT is_suspended;
  IF v_admin_count <= 1 THEN
    RAISE EXCEPTION 'Cannot remove the last active Admin account';
  END IF;

  UPDATE public.profiles SET role = p_restore_role WHERE id = p_user_id;
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (
    NULL,
    'platform_admin_role_revoked',
    'profile',
    p_user_id::TEXT,
    pg_catalog.jsonb_build_object(
      'target_user_id', p_user_id,
      'previous_role', v_old_role,
      'new_role', p_restore_role,
      'reason', pg_catalog.btrim(p_reason),
      'operator', NULLIF(pg_catalog.btrim(COALESCE(p_operator, '')), ''),
      'provisioning_method', 'trusted_service_role_cli'
    )
  );
END;
$$;

ALTER FUNCTION public.revoke_admin_role(UUID, TEXT, TEXT, TEXT) OWNER TO postgres;
REVOKE ALL PRIVILEGES ON FUNCTION public.revoke_admin_role(UUID, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_admin_role(UUID, TEXT, TEXT, TEXT)
  TO service_role;

CREATE OR REPLACE FUNCTION public.consume_oauth_signup_role_intent(
  p_code_hash TEXT,
  p_binding_hash TEXT,
  p_user_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_intent public.oauth_signup_role_intents;
  v_auth_created_at TIMESTAMPTZ;
  v_profile_role TEXT;
  v_profile_created_at TIMESTAMPTZ;
BEGIN
  IF (SELECT auth.role()) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'OAuth signup role assignment requires a trusted server operation';
  END IF;

  SELECT * INTO v_intent
  FROM public.oauth_signup_role_intents
  WHERE code_hash = p_code_hash
    AND binding_hash = p_binding_hash
    AND expires_at > pg_catalog.now()
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  DELETE FROM public.oauth_signup_role_intents WHERE code_hash = p_code_hash;

  SELECT u.created_at INTO v_auth_created_at
  FROM auth.users AS u
  WHERE u.id = p_user_id;
  SELECT p.role, p.created_at INTO v_profile_role, v_profile_created_at
  FROM public.profiles AS p
  WHERE p.id = p_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Only an account created after this one-time browser-bound intent may use
  -- its selected public role. Older/existing accounts retain their role.
  IF v_auth_created_at < v_intent.created_at
     OR v_auth_created_at > v_intent.expires_at
     OR v_profile_created_at < v_intent.created_at
     OR v_profile_created_at > v_intent.expires_at THEN
    RETURN v_profile_role;
  END IF;

  IF v_intent.role = 'brand' THEN
    UPDATE public.profiles SET role = 'brand' WHERE id = p_user_id;
    INSERT INTO public.brand_profiles(user_id, company_name)
    SELECT p_user_id, p.name FROM public.profiles AS p WHERE p.id = p_user_id
    ON CONFLICT (user_id) DO NOTHING;
    DELETE FROM public.creator_profiles WHERE user_id = p_user_id;
    DELETE FROM public.analytics WHERE user_id = p_user_id;
    RETURN 'brand';
  END IF;

  UPDATE public.profiles SET role = 'creator' WHERE id = p_user_id;
  INSERT INTO public.creator_profiles(user_id, username)
  SELECT p_user_id, pg_catalog.split_part(p.email, '@', 1)
  FROM public.profiles AS p
  WHERE p.id = p_user_id
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.analytics(user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  DELETE FROM public.brand_profiles WHERE user_id = p_user_id;
  RETURN 'creator';
END;
$$;

ALTER FUNCTION public.consume_oauth_signup_role_intent(TEXT, TEXT, UUID)
  OWNER TO postgres;
REVOKE ALL PRIVILEGES ON FUNCTION public.consume_oauth_signup_role_intent(TEXT, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_oauth_signup_role_intent(TEXT, TEXT, UUID)
  TO service_role;

CREATE OR REPLACE FUNCTION public.set_account_block_status(
  p_actor_id UUID,
  p_target_id UUID
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_actor public.profiles;
  v_target public.profiles;
  v_old_blocked BOOLEAN;
  v_old_suspended BOOLEAN;
  v_new_blocked BOOLEAN;
BEGIN
  IF (SELECT auth.role()) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Account status changes require a trusted server operation';
  END IF;
  IF p_actor_id = p_target_id THEN
    RAISE EXCEPTION 'An Admin cannot block their own account';
  END IF;

  SELECT * INTO v_actor FROM public.profiles WHERE id = p_actor_id;
  IF NOT FOUND OR v_actor.role <> 'admin' OR v_actor.is_blocked OR v_actor.is_suspended THEN
    RAISE EXCEPTION 'An active Admin is required';
  END IF;

  SELECT * INTO v_target FROM public.profiles WHERE id = p_target_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  IF v_target.role = 'admin' THEN
    RAISE EXCEPTION 'Admin accounts cannot be blocked from user management';
  END IF;

  v_old_blocked := v_target.is_blocked;
  v_old_suspended := v_target.is_suspended;
  v_new_blocked := NOT v_old_blocked;
  UPDATE public.profiles
  SET is_blocked = v_new_blocked
  WHERE id = p_target_id
  RETURNING * INTO v_target;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (
    p_actor_id,
    CASE WHEN v_new_blocked THEN 'admin_user_blocked' ELSE 'admin_user_unblocked' END,
    'profile',
    p_target_id::TEXT,
    pg_catalog.jsonb_build_object(
      'target_user_id', p_target_id,
      'target_role', v_target.role,
      'before_blocked', v_old_blocked,
      'before_suspended', v_old_suspended,
      'after_blocked', v_new_blocked,
      'after_suspended', v_old_suspended
    )
  );
  RETURN v_target;
END;
$$;

ALTER FUNCTION public.set_account_block_status(UUID, UUID) OWNER TO postgres;
REVOKE ALL PRIVILEGES ON FUNCTION public.set_account_block_status(UUID, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_account_block_status(UUID, UUID)
  TO service_role;

DROP POLICY IF EXISTS "Verified accounts can create campaigns"
  ON public.campaigns;
CREATE POLICY "Verified accounts can create campaigns"
  ON public.campaigns
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    brand_id = (SELECT auth.uid())
    AND (public.is_admin() OR public.is_verified_account('brand'))
  );

DROP POLICY IF EXISTS "Verified accounts can update campaigns"
  ON public.campaigns;
CREATE POLICY "Verified accounts can update campaigns"
  ON public.campaigns
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR (brand_id = (SELECT auth.uid()) AND public.is_verified_account('brand'))
  )
  WITH CHECK (
    public.is_admin()
    OR (brand_id = (SELECT auth.uid()) AND public.is_verified_account('brand'))
  );

DROP POLICY IF EXISTS "Verified accounts can delete campaigns"
  ON public.campaigns;
CREATE POLICY "Verified accounts can delete campaigns"
  ON public.campaigns
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR (brand_id = (SELECT auth.uid()) AND public.is_verified_account('brand'))
  );

DROP POLICY IF EXISTS "Verified creators can apply to campaigns"
  ON public.campaign_applications;
CREATE POLICY "Verified creators can apply to campaigns"
  ON public.campaign_applications
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    creator_id = (SELECT auth.uid())
    AND public.is_verified_account('creator')
  );

DROP POLICY IF EXISTS "Verified brands can review campaign applications"
  ON public.campaign_applications;
CREATE POLICY "Verified brands can review campaign applications"
  ON public.campaign_applications
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR public.is_verified_account('brand'))
  WITH CHECK (public.is_admin() OR public.is_verified_account('brand'));

DROP POLICY IF EXISTS "Verified accounts can create collaboration requests"
  ON public.collaborations;
CREATE POLICY "Verified accounts can create collaboration requests"
  ON public.collaborations
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND (public.is_admin() OR public.is_verified_account(NULL))
  );

DROP POLICY IF EXISTS "Verified accounts can update collaborations"
  ON public.collaborations;
CREATE POLICY "Verified accounts can update collaborations"
  ON public.collaborations
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR public.is_verified_account(NULL))
  WITH CHECK (public.is_admin() OR public.is_verified_account(NULL));

COMMIT;

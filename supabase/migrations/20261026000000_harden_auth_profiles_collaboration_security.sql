BEGIN;

-- The profile is authoritative for admin status. JWT role metadata may be
-- stale after demotion, so neither app_metadata nor user_metadata grants admin.
-- Reconcile any legacy app_metadata-only admins to profiles.role='admin'
-- through a trusted service-role operation before deploying this migration.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_blocked BOOLEAN;
  v_suspended BOOLEAN;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT p.role, p.is_blocked, p.is_suspended
  INTO v_role, v_blocked, v_suspended
  FROM public.profiles AS p
  WHERE p.id = v_user_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  RETURN v_role = 'admin'
    AND COALESCE(v_blocked, false) = false
    AND COALESCE(v_suspended, false) = false;
END;
$$;

-- Preserve brand signup. Any other client-supplied role, including admin,
-- receives the safe creator role. Only a service-role operation may assign an
-- administrator profile role.
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

-- Role assignment requires service role. Other privileged profile flags may
-- also be changed by an active administrator. A missing UID grants no access.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND (SELECT auth.role()) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION
      'Privileged profile role changes require an explicit service-role operation';
  END IF;

  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
     OR NEW.is_blocked IS DISTINCT FROM OLD.is_blocked
     OR NEW.is_suspended IS DISTINCT FROM OLD.is_suspended THEN
    IF (SELECT auth.role()) IS DISTINCT FROM 'service_role'
       AND NOT public.is_admin() THEN
      RAISE EXCEPTION
        'Privileged profile fields require an admin or service-role operation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Remove broad profile visibility and require owner/admin access even if
-- another permissive SELECT policy exists. Preserve the other profile policies.
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users"
  ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by owner or admin"
  ON public.profiles;
DROP POLICY IF EXISTS "Profiles read access is owner or admin"
  ON public.profiles;
CREATE POLICY "Profiles are viewable by owner or admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id OR public.is_admin());
CREATE POLICY "Profiles read access is owner or admin"
  ON public.profiles
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id OR public.is_admin());
DROP POLICY IF EXISTS "Profiles insert is owner and non-admin"
  ON public.profiles;
CREATE POLICY "Profiles insert is owner and non-admin"
  ON public.profiles
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id AND role <> 'admin');

REVOKE SELECT ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE SELECT (
  id, name, email, role, is_verified, is_blocked, is_suspended, social_handle,
  avatar, plan, is_onboarded, verification_status, verification_screenshot,
  verification_code, integrations, socials, created_at, updated_at
) ON TABLE public.profiles
  FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.profiles TO authenticated;

-- Public discovery is limited to the fields used for identity, presentation,
-- and niche filtering. Metrics, location, bio, social links, and verification
-- data are not exposed.
DROP POLICY IF EXISTS "Creator profiles are publicly viewable"
  ON public.creator_profiles;
DROP POLICY IF EXISTS "Creator profiles are viewable by owner or admin"
  ON public.creator_profiles;
DROP POLICY IF EXISTS "Creator profiles read access is owner or admin"
  ON public.creator_profiles;
CREATE POLICY "Creator profiles are viewable by owner or admin"
  ON public.creator_profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id OR public.is_admin());
CREATE POLICY "Creator profiles read access is owner or admin"
  ON public.creator_profiles
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id OR public.is_admin());

REVOKE SELECT ON TABLE public.creator_profiles
  FROM PUBLIC, anon, authenticated;
REVOKE SELECT (
  id, cover_image, bio, sub_categories, languages, content_types, location,
  website, goals, collaboration_preferences, preferred_brand_categories,
  portfolio, followers, engagement_rate, growth_score, social_links,
  created_at, updated_at
) ON TABLE public.creator_profiles
  FROM PUBLIC, anon;
GRANT SELECT (user_id, username, avatar, niche)
  ON TABLE public.creator_profiles
  TO anon, service_role;
GRANT SELECT ON TABLE public.creator_profiles TO authenticated;

DROP POLICY IF EXISTS "Creator profiles are publicly discoverable"
  ON public.creator_profiles;
CREATE POLICY "Creator profiles are publicly discoverable"
  ON public.creator_profiles
  FOR SELECT
  TO anon
  USING (true);

-- PostgreSQL 15+ supports security_invoker; local config targets PostgreSQL 17.
DO $view_compatibility$
DECLARE
  existing_view_oid oid;
  existing_relation_kind "char";
  existing_columns text[];
  existing_types text[];
  expected_columns CONSTANT text[] :=
    ARRAY['user_id', 'username', 'avatar', 'niche'];
  expected_types CONSTANT text[] :=
    ARRAY['uuid', 'text', 'text', 'text'];
BEGIN
  SELECT c.oid, c.relkind
  INTO existing_view_oid, existing_relation_kind
  FROM pg_catalog.pg_class AS c
  JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'public_creator_profiles';

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF existing_relation_kind <> 'v' THEN
    RAISE EXCEPTION
      'Cannot replace public.public_creator_profiles: existing relation is not a view';
  END IF;

  SELECT
    pg_catalog.array_agg(a.attname::text ORDER BY a.attnum),
    pg_catalog.array_agg(
      pg_catalog.format_type(a.atttypid, a.atttypmod)
      ORDER BY a.attnum
    )
  INTO existing_columns, existing_types
  FROM pg_catalog.pg_attribute AS a
  WHERE a.attrelid = existing_view_oid
    AND a.attnum > 0
    AND NOT a.attisdropped;

  IF existing_columns IS DISTINCT FROM expected_columns
     OR existing_types IS DISTINCT FROM expected_types THEN
    RAISE EXCEPTION
      'Cannot replace public.public_creator_profiles: expected columns (%) with types (%), found columns (%) with types (%). Inspect dependent objects before replacing it.',
      expected_columns, expected_types, existing_columns, existing_types;
  END IF;
END;
$view_compatibility$;

CREATE OR REPLACE VIEW public.public_creator_profiles
  WITH (security_barrier = true, security_invoker = true)
AS
SELECT user_id, username, avatar, niche
FROM public.creator_profiles;
ALTER VIEW public.public_creator_profiles OWNER TO postgres;
GRANT SELECT ON TABLE public.public_creator_profiles
  TO anon, authenticated, service_role;

-- Retain the existing collaboration trigger and its participant transition
-- checks. Only an explicit service-role JWT claim bypasses those checks;
-- auth.uid() being NULL is never treated as proof of service role.
CREATE OR REPLACE FUNCTION public.protect_collaboration_status_transitions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF NEW.sender_id IS DISTINCT FROM OLD.sender_id THEN
    RAISE EXCEPTION
      'Unauthorized: sender_id is immutable on collaborations (id=%)', OLD.id;
  END IF;

  IF NEW.receiver_id IS DISTINCT FROM OLD.receiver_id THEN
    RAISE EXCEPTION
      'Unauthorized: receiver_id is immutable on collaborations (id=%)', OLD.id;
  END IF;

  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  IF (SELECT auth.role()) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF OLD.status IN ('rejected', 'completed') THEN
    RAISE EXCEPTION
      'Invalid transition: Collaboration % is in terminal status "%"',
      OLD.id, OLD.status;
  END IF;

  IF OLD.status = 'pending' THEN
    IF NEW.status NOT IN ('accepted', 'rejected') THEN
      RAISE EXCEPTION
        'Invalid transition: pending collaborations can only be accepted or rejected';
    END IF;
    IF (SELECT auth.uid()) IS DISTINCT FROM OLD.receiver_id THEN
      RAISE EXCEPTION
        'Unauthorized: only the receiver may accept or reject a pending collaboration';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'accepted' THEN
    IF NEW.status IS DISTINCT FROM 'completed' THEN
      RAISE EXCEPTION
        'Invalid transition: accepted collaborations can only be completed';
    END IF;
    IF (SELECT auth.uid()) IS DISTINCT FROM OLD.sender_id
       AND (SELECT auth.uid()) IS DISTINCT FROM OLD.receiver_id THEN
      RAISE EXCEPTION
        'Unauthorized: only participants may complete a collaboration';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
    'Unhandled collaboration transition: "%" to "%"',
    OLD.status, NEW.status;
END;
$$;

-- Preserve the existing permissive transition policy while adding a restrictive
-- guard, so any other permissive policy cannot widen authenticated updates.
DROP POLICY IF EXISTS "Collaboration status transitions are participant or admin"
  ON public.collaborations;
CREATE POLICY "Collaboration status transitions are participant or admin"
  ON public.collaborations
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR (auth.uid() = receiver_id AND status = 'pending')
    OR ((auth.uid() = sender_id OR auth.uid() = receiver_id) AND status = 'accepted')
  )
  WITH CHECK (
    public.is_admin()
    OR (
      (sender_id = auth.uid() OR receiver_id = auth.uid())
      AND (
        (auth.uid() = receiver_id AND status IN ('accepted', 'rejected'))
        OR ((auth.uid() = sender_id OR auth.uid() = receiver_id) AND status = 'completed')
      )
    )
  );

-- Pin SECURITY DEFINER execution to the trusted database owner. Trigger
-- execution itself does not require client EXECUTE grants.
ALTER FUNCTION public.is_admin() OWNER TO postgres;
ALTER FUNCTION public.handle_new_auth_user() OWNER TO postgres;
ALTER FUNCTION public.protect_profile_privileged_fields() OWNER TO postgres;
ALTER FUNCTION public.protect_collaboration_status_transitions() OWNER TO postgres;

REVOKE ALL PRIVILEGES ON FUNCTION public.is_admin()
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

REVOKE ALL PRIVILEGES ON FUNCTION public.handle_new_auth_user()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL PRIVILEGES ON FUNCTION public.protect_profile_privileged_fields()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL PRIVILEGES ON FUNCTION public.protect_collaboration_status_transitions()
  FROM PUBLIC, anon, authenticated, service_role;

COMMIT;

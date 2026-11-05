-- ----------------------------------------------------------------------------
-- Creator Beta Waitlist
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_active_waitlist_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND NOT COALESCE(p.is_blocked, false)
      AND NOT COALESCE(p.is_suspended, false)
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_waitlist_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_waitlist_admin() TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.creator_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  instagram_url TEXT NOT NULL DEFAULT '',
  youtube_url TEXT NOT NULL DEFAULT '',
  other_social_url TEXT NOT NULL DEFAULT '',
  creator_niche TEXT NOT NULL,
  follower_count TEXT NOT NULL DEFAULT '',
  introduction TEXT NOT NULL,
  reason_for_testing TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'selected', 'rejected', 'invited', 'accepted', 'declined')),
  invitation_token_hash TEXT DEFAULT NULL,
  invitation_expires_at TIMESTAMPTZ DEFAULT NULL,
  invited_at TIMESTAMPTZ DEFAULT NULL,
  accepted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_waitlist_email_active
  ON public.creator_waitlist (LOWER(email))
  WHERE status NOT IN ('rejected', 'declined');

CREATE INDEX IF NOT EXISTS idx_creator_waitlist_status ON public.creator_waitlist(status);
CREATE INDEX IF NOT EXISTS idx_creator_waitlist_created_at ON public.creator_waitlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_waitlist_invitation_token_hash
  ON public.creator_waitlist(invitation_token_hash)
  WHERE invitation_token_hash IS NOT NULL;

ALTER TABLE public.creator_waitlist ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.creator_waitlist FROM PUBLIC, anon, authenticated;
GRANT INSERT ON TABLE public.creator_waitlist TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.creator_waitlist TO authenticated;
GRANT ALL ON TABLE public.creator_waitlist TO service_role;

DROP POLICY IF EXISTS "creator_waitlist_insert_public" ON public.creator_waitlist;
CREATE POLICY "creator_waitlist_insert_public"
  ON public.creator_waitlist
  FOR INSERT
  WITH CHECK (
    length(btrim(full_name)) > 0 AND
    email = lower(btrim(email)) AND
    length(email) > 0 AND
    length(btrim(creator_niche)) > 0 AND
    length(btrim(introduction)) > 0 AND
    length(btrim(reason_for_testing)) > 0 AND
    status = 'pending' AND
    invitation_token_hash IS NULL AND
    invitation_expires_at IS NULL AND
    invited_at IS NULL AND
    accepted_at IS NULL
  );

DROP POLICY IF EXISTS "creator_waitlist_admin_select" ON public.creator_waitlist;
CREATE POLICY "creator_waitlist_admin_select"
  ON public.creator_waitlist
  FOR SELECT
  USING (public.is_active_waitlist_admin());

DROP POLICY IF EXISTS "creator_waitlist_admin_update" ON public.creator_waitlist;
CREATE POLICY "creator_waitlist_admin_update"
  ON public.creator_waitlist
  FOR UPDATE
  USING (public.is_active_waitlist_admin())
  WITH CHECK (public.is_active_waitlist_admin());

DROP POLICY IF EXISTS "creator_waitlist_admin_insert" ON public.creator_waitlist;
CREATE POLICY "creator_waitlist_admin_insert"
  ON public.creator_waitlist
  FOR INSERT
  WITH CHECK (public.is_active_waitlist_admin());

DROP TRIGGER IF EXISTS set_creator_waitlist_updated_at ON public.creator_waitlist;
CREATE TRIGGER set_creator_waitlist_updated_at
  BEFORE UPDATE ON public.creator_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

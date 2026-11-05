-- =============================================================================
-- CreatorsHQ Supabase PostgreSQL Migration V1 Init (Corrected & Idempotent)
-- Version: 20261014000000
-- Generated: 2026-10-14
--
-- Fixes applied:
--   1. Ordered DDL: Extensions and handle_updated_at() created first.
--   2. Created public.profiles BEFORE public.is_admin() to prevent ERROR 42P01
--      (relation "public.profiles" does not exist during SQL function analysis).
--   3. Implemented public.is_admin() in PL/pgSQL with JWT fast-path and direct
--      SECURITY DEFINER lookup to structurally prevent RLS recursion.
--   4. Added DROP POLICY IF EXISTS and DROP TRIGGER IF EXISTS for full idempotence.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Extensions & Base Helper Functions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 1. Profiles Table (1-to-1 extension of auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'creator' CHECK (role IN ('creator', 'brand', 'admin')),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  social_handle TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  is_onboarded BOOLEAN NOT NULL DEFAULT false,
  verification_status TEXT NOT NULL DEFAULT 'not_submitted' CHECK (verification_status IN ('not_submitted', 'pending', 'verified', 'rejected')),
  verification_screenshot TEXT DEFAULT '',
  verification_code TEXT DEFAULT '',
  integrations JSONB NOT NULL DEFAULT '{}'::jsonb,
  socials JSONB NOT NULL DEFAULT '{
    "instagram": {"url": "", "username": "", "verified": false},
    "twitter": {"url": "", "username": "", "verified": false},
    "linkedin": {"url": "", "username": "", "verified": false},
    "youtube": {"url": "", "username": "", "verified": false}
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 2. Admin Role Checker Function (Defended Against RLS Recursion)
--    Created AFTER public.profiles exists to resolve 42P01 error.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_role TEXT;
  v_blocked BOOLEAN;
  v_suspended BOOLEAN;
BEGIN
  -- 1. Fast path: check protected app_metadata in JWT (avoids table queries during RLS evaluation)
  -- Note: user_metadata is intentionally omitted because it is user-editable.
  IF (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' THEN
    RETURN true;
  END IF;

  -- 2. If unauthenticated, cannot be an admin
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- 3. Query public.profiles directly (SECURITY DEFINER runs with owner permissions, bypassing RLS)
  SELECT p.role, p.is_blocked, p.is_suspended
  INTO v_role, v_blocked, v_suspended
  FROM public.profiles p
  WHERE p.id = auth.uid();

  RETURN (v_role = 'admin' AND COALESCE(v_blocked, false) = false AND COALESCE(v_suspended, false) = false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. Profile Privileged-Fields Protection Trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If not an admin and not service role (auth.uid() is not null)
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Unauthorized: Users cannot alter their own account role';
    END IF;
    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
      RAISE EXCEPTION 'Unauthorized: Users cannot alter their own verification status';
    END IF;
    IF NEW.is_blocked IS DISTINCT FROM OLD.is_blocked OR NEW.is_suspended IS DISTINCT FROM OLD.is_suspended THEN
      RAISE EXCEPTION 'Unauthorized: Users cannot alter suspension or block status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- -----------------------------------------------------------------------------
-- 4. Creator Profiles Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  username TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  niche TEXT DEFAULT '',
  sub_categories TEXT[] DEFAULT '{}'::text[],
  languages TEXT[] DEFAULT '{}'::text[],
  content_types TEXT[] DEFAULT '{}'::text[],
  location TEXT DEFAULT '',
  website TEXT DEFAULT '',
  goals TEXT DEFAULT '',
  collaboration_preferences TEXT DEFAULT '',
  preferred_brand_categories TEXT[] DEFAULT '{}'::text[],
  portfolio JSONB NOT NULL DEFAULT '[]'::jsonb,
  followers INTEGER NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  growth_score INTEGER NOT NULL DEFAULT 0,
  social_links JSONB NOT NULL DEFAULT '{
    "instagram": "",
    "youtube": "",
    "twitter": "",
    "linkedin": "",
    "tiktok": ""
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creator_profiles_user_id ON public.creator_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_niche ON public.creator_profiles(niche);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_growth_score ON public.creator_profiles(growth_score DESC);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_followers ON public.creator_profiles(followers DESC);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_niche_score ON public.creator_profiles(niche, growth_score DESC);

DROP TRIGGER IF EXISTS set_creator_profiles_updated_at ON public.creator_profiles;
CREATE TRIGGER set_creator_profiles_updated_at
  BEFORE UPDATE ON public.creator_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 5. Brand Profiles Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT DEFAULT '',
  logo TEXT DEFAULT '',
  website TEXT DEFAULT '',
  industry TEXT DEFAULT '',
  location TEXT DEFAULT '',
  description TEXT DEFAULT '',
  objectives TEXT DEFAULT '',
  budget TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_profiles_user_id ON public.brand_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_profiles_industry ON public.brand_profiles(industry);

DROP TRIGGER IF EXISTS set_brand_profiles_updated_at ON public.brand_profiles;
CREATE TRIGGER set_brand_profiles_updated_at
  BEFORE UPDATE ON public.brand_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 6. Campaigns Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget TEXT NOT NULL,
  niche TEXT DEFAULT '',
  image TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'active', 'completed', 'paused', 'cancelled')),
  deliverables TEXT[] DEFAULT '{}'::text[],
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_brand_id ON public.campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_niche ON public.campaigns(niche);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.campaigns(created_at DESC);

DROP TRIGGER IF EXISTS set_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER set_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 7. Campaign Applications Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaign_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_campaign_application UNIQUE (campaign_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_applications_campaign_id ON public.campaign_applications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_creator_id ON public.campaign_applications(creator_id);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_status ON public.campaign_applications(status);

DROP TRIGGER IF EXISTS set_campaign_applications_updated_at ON public.campaign_applications;
CREATE TRIGGER set_campaign_applications_updated_at
  BEFORE UPDATE ON public.campaign_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 8. Collaborations Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collaborations_sender_id ON public.collaborations(sender_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_receiver_id ON public.collaborations(receiver_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_status ON public.collaborations(status);
CREATE INDEX IF NOT EXISTS idx_collaborations_created_at ON public.collaborations(created_at DESC);

DROP TRIGGER IF EXISTS set_collaborations_updated_at ON public.collaborations;
CREATE TRIGGER set_collaborations_updated_at
  BEFORE UPDATE ON public.collaborations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to enforce immutable participant IDs and valid status transitions at database level
CREATE OR REPLACE FUNCTION public.protect_collaboration_status_transitions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Disallow changing sender_id or receiver_id (immutable participants)
  IF NEW.sender_id IS DISTINCT FROM OLD.sender_id THEN
    RAISE EXCEPTION 'Unauthorized: Collaboration sender_id is immutable';
  END IF;

  IF NEW.receiver_id IS DISTINCT FROM OLD.receiver_id THEN
    RAISE EXCEPTION 'Unauthorized: Collaboration receiver_id is immutable';
  END IF;

  -- 2. If status is unchanged, allow update (e.g. updated_at timestamp)
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- 3. If admin or service role, allow authorized status change
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- 4. Participant-specific transition rules
  -- From 'pending': only receiver may transition to 'accepted' or 'rejected'
  IF OLD.status = 'pending' THEN
    IF NEW.status IN ('accepted', 'rejected') THEN
      IF auth.uid() != OLD.receiver_id THEN
        RAISE EXCEPTION 'Unauthorized: Only the receiver may accept or reject a pending collaboration';
      END IF;
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'Invalid transition: Pending collaborations can only transition to accepted or rejected';
    END IF;
  END IF;

  -- From 'accepted': either participant may transition to 'completed'
  IF OLD.status = 'accepted' THEN
    IF NEW.status = 'completed' THEN
      IF auth.uid() != OLD.sender_id AND auth.uid() != OLD.receiver_id THEN
        RAISE EXCEPTION 'Unauthorized: Only collaboration participants may mark an accepted collaboration as completed';
      END IF;
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'Invalid transition: Accepted collaborations can only transition to completed';
    END IF;
  END IF;

  -- From 'rejected' or 'completed': terminal states, no further transitions
  IF OLD.status IN ('rejected', 'completed') THEN
    RAISE EXCEPTION 'Invalid transition: Collaboration is in terminal status "%" and cannot be modified', OLD.status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_collaboration_status_transitions ON public.collaborations;
CREATE TRIGGER trg_protect_collaboration_status_transitions
  BEFORE UPDATE ON public.collaborations
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_collaboration_status_transitions();

-- -----------------------------------------------------------------------------
-- 9. Leads (CRM) Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  company TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Warm' CHECK (status IN ('Hot', 'Warm', 'Cold')),
  value TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

DROP TRIGGER IF EXISTS set_leads_updated_at ON public.leads;
CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 10. Notifications Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('system', 'collaboration', 'campaign', 'application', 'lead', 'ai')),
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- -----------------------------------------------------------------------------
-- 11. AI Generations History & Usage Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'idea' CHECK (type IN ('caption', 'bio', 'pitch', 'hashtags', 'script', 'email', 'idea', 'ideas', 'default')),
  prompt TEXT NOT NULL,
  output TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_generations_user_id ON public.ai_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_created_at ON public.ai_generations(user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 12. Analytics Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  followers INTEGER NOT NULL DEFAULT 0,
  engagement NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  earnings NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  growth_score INTEGER NOT NULL DEFAULT 0,
  historical_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  instagram_data JSONB NOT NULL DEFAULT '{"username":"","followers":0,"engagement":0,"connected":false}'::jsonb,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics(user_id);

DROP TRIGGER IF EXISTS set_analytics_updated_at ON public.analytics;
CREATE TRIGGER set_analytics_updated_at
  BEFORE UPDATE ON public.analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 13. Transactions (Billing Ledger) Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_sender_id ON public.transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_transactions_recipient_id ON public.transactions(recipient_id);

-- -----------------------------------------------------------------------------
-- 14. Feedback Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('bug', 'feature', 'general', 'support')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);

-- -----------------------------------------------------------------------------
-- 15. Audit Logs Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- -----------------------------------------------------------------------------
-- 16. Auth User Creation Sync Trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_name TEXT;
BEGIN
  -- Extract user role and name from user_metadata or default to creator
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'creator');
  IF v_role NOT IN ('creator', 'brand', 'admin') THEN
    v_role := 'creator';
  END IF;

  v_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

  -- Insert profile
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (NEW.id, NEW.email, v_name, v_role)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name = CASE WHEN profiles.name = '' THEN EXCLUDED.name ELSE profiles.name END;

  -- Create sub-profile based on role
  IF v_role = 'brand' THEN
    INSERT INTO public.brand_profiles (user_id, company_name)
    VALUES (NEW.id, v_name)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO public.creator_profiles (user_id, username)
    VALUES (NEW.id, split_part(NEW.email, '@', 1))
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

-- -----------------------------------------------------------------------------
-- 17. Row Level Security (RLS) Enablement & Policies
-- -----------------------------------------------------------------------------

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ─── PROFILES POLICIES ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    OR is_blocked = false 
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile or Admin can update all" ON public.profiles;
CREATE POLICY "Users can update own profile or Admin can update all"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;
CREATE POLICY "Only admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ─── CREATOR PROFILES POLICIES ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Creator profiles are publicly viewable" ON public.creator_profiles;
CREATE POLICY "Creator profiles are publicly viewable"
  ON public.creator_profiles FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Creators can insert own profile" ON public.creator_profiles;
CREATE POLICY "Creators can insert own profile"
  ON public.creator_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Creators can update own profile or Admin" ON public.creator_profiles;
CREATE POLICY "Creators can update own profile or Admin"
  ON public.creator_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Creators or admin can delete creator profile" ON public.creator_profiles;
CREATE POLICY "Creators or admin can delete creator profile"
  ON public.creator_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ─── BRAND PROFILES POLICIES ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Brand profiles are viewable by authenticated users" ON public.brand_profiles;
CREATE POLICY "Brand profiles are viewable by authenticated users"
  ON public.brand_profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Brands can insert own profile" ON public.brand_profiles;
CREATE POLICY "Brands can insert own profile"
  ON public.brand_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Brands can update own profile or Admin" ON public.brand_profiles;
CREATE POLICY "Brands can update own profile or Admin"
  ON public.brand_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- ─── CAMPAIGNS POLICIES ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Open campaigns are viewable by all authenticated users" ON public.campaigns;
CREATE POLICY "Open campaigns are viewable by all authenticated users"
  ON public.campaigns FOR SELECT
  TO authenticated
  USING (status = 'open' OR brand_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Brands can create campaigns" ON public.campaigns;
CREATE POLICY "Brands can create campaigns"
  ON public.campaigns FOR INSERT
  TO authenticated
  WITH CHECK (brand_id = auth.uid());

DROP POLICY IF EXISTS "Campaign owners or admins can update campaigns" ON public.campaigns;
CREATE POLICY "Campaign owners or admins can update campaigns"
  ON public.campaigns FOR UPDATE
  TO authenticated
  USING (brand_id = auth.uid() OR public.is_admin())
  WITH CHECK (brand_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Campaign owners or admins can delete campaigns" ON public.campaigns;
CREATE POLICY "Campaign owners or admins can delete campaigns"
  ON public.campaigns FOR DELETE
  TO authenticated
  USING (brand_id = auth.uid() OR public.is_admin());

-- ─── CAMPAIGN APPLICATIONS POLICIES ──────────────────────────────────────────
DROP POLICY IF EXISTS "Creators see own applications, brands see applications for their campaigns" ON public.campaign_applications;
CREATE POLICY "Creators see own applications, brands see applications for their campaigns"
  ON public.campaign_applications FOR SELECT
  TO authenticated
  USING (
    creator_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = campaign_applications.campaign_id 
        AND campaigns.brand_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Creators can apply to campaigns" ON public.campaign_applications;
CREATE POLICY "Creators can apply to campaigns"
  ON public.campaign_applications FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "Brands or admins can update application status" ON public.campaign_applications;
CREATE POLICY "Brands or admins can update application status"
  ON public.campaign_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = campaign_applications.campaign_id 
        AND campaigns.brand_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Creators can withdraw own application or admin" ON public.campaign_applications;
CREATE POLICY "Creators can withdraw own application or admin"
  ON public.campaign_applications FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid() OR public.is_admin());

-- ─── COLLABORATIONS POLICIES ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Participants or admins can view collaborations" ON public.collaborations;
CREATE POLICY "Participants or admins can view collaborations"
  ON public.collaborations FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can create collaboration requests" ON public.collaborations;
CREATE POLICY "Authenticated users can create collaboration requests"
  ON public.collaborations FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Participants or admins can update collaboration status" ON public.collaborations;
CREATE POLICY "Participants or admins can update collaboration status"
  ON public.collaborations FOR UPDATE
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

DROP POLICY IF EXISTS "Participants or admins can delete collaboration" ON public.collaborations;
CREATE POLICY "Participants or admins can delete collaboration"
  ON public.collaborations FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid() OR public.is_admin());

-- ─── LEADS (CRM) POLICIES ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can only view their own leads, or admin" ON public.leads;
CREATE POLICY "Users can only view their own leads, or admin"
  ON public.leads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can create their own leads" ON public.leads;
CREATE POLICY "Users can create their own leads"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
CREATE POLICY "Users can update their own leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
CREATE POLICY "Users can delete their own leads"
  ON public.leads FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- ─── NOTIFICATIONS POLICIES ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can only view their own notifications" ON public.notifications;
CREATE POLICY "Users can only view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users or services can insert notifications" ON public.notifications;
CREATE POLICY "Users or services can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can mark their own notifications as read" ON public.notifications;
CREATE POLICY "Users can mark their own notifications as read"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ─── AI GENERATIONS POLICIES ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can only view their own AI generations" ON public.ai_generations;
CREATE POLICY "Users can only view their own AI generations"
  ON public.ai_generations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert their own AI generation records" ON public.ai_generations;
CREATE POLICY "Users can insert their own AI generation records"
  ON public.ai_generations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ─── ANALYTICS POLICIES ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own analytics or admin" ON public.analytics;
CREATE POLICY "Users can view their own analytics or admin"
  ON public.analytics FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert their own analytics" ON public.analytics;
CREATE POLICY "Users can insert their own analytics"
  ON public.analytics FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users or admin can update analytics" ON public.analytics;
CREATE POLICY "Users or admin can update analytics"
  ON public.analytics FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ─── TRANSACTIONS POLICIES ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Participants or admins can view transactions" ON public.transactions;
CREATE POLICY "Participants or admins can view transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Authenticated users or admin can record transactions" ON public.transactions;
CREATE POLICY "Authenticated users or admin can record transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid() OR public.is_admin());

-- ─── FEEDBACK POLICIES ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own feedback, Admins can view all" ON public.feedback;
CREATE POLICY "Users can view own feedback, Admins can view all"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can submit feedback" ON public.feedback;
CREATE POLICY "Authenticated users can submit feedback"
  ON public.feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Only admins can update feedback status" ON public.feedback;
CREATE POLICY "Only admins can update feedback status"
  ON public.feedback FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- ─── AUDIT LOGS POLICIES ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users or service can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users or service can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL OR public.is_admin());

-- -----------------------------------------------------------------------------
-- 18. Supabase Storage Buckets & Policies
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('campaign_assets', 'campaign_assets', true),
  ('verification_docs', 'verification_docs', false)
ON CONFLICT (id) DO NOTHING;

-- Avatars: public read, owner write
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Campaign assets: public read, authenticated brand upload
DROP POLICY IF EXISTS "Campaign assets are publicly readable" ON storage.objects;
CREATE POLICY "Campaign assets are publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'campaign_assets');

DROP POLICY IF EXISTS "Brands can upload campaign assets" ON storage.objects;
CREATE POLICY "Brands can upload campaign assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'campaign_assets');

-- Verification docs: private to owner and admin
DROP POLICY IF EXISTS "Owner or admin can view verification documents" ON storage.objects;
CREATE POLICY "Owner or admin can view verification documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'verification_docs' 
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

DROP POLICY IF EXISTS "Users can upload their verification docs" ON storage.objects;
CREATE POLICY "Users can upload their verification docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'verification_docs' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

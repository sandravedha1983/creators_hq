BEGIN;

ALTER TABLE public.oauth_login_handoffs
  ADD COLUMN IF NOT EXISTS binding_hash TEXT;

-- Invalidate any codes created before browser binding was enforced.
DELETE FROM public.oauth_login_handoffs;

DO $$
DECLARE
  user_id_type TEXT;
BEGIN
  SELECT data_type
  INTO user_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'oauth_login_handoffs'
    AND column_name = 'user_id';

  IF user_id_type <> 'uuid' THEN
    ALTER TABLE public.oauth_login_handoffs
      DROP CONSTRAINT IF EXISTS oauth_login_handoffs_user_id_fkey;
    ALTER TABLE public.oauth_login_handoffs
      ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
  END IF;
END;
$$;

ALTER TABLE public.oauth_login_handoffs
  ALTER COLUMN binding_hash SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'oauth_login_handoffs_binding_hash_check'
      AND conrelid = 'public.oauth_login_handoffs'::regclass
  ) THEN
    ALTER TABLE public.oauth_login_handoffs
      ADD CONSTRAINT oauth_login_handoffs_binding_hash_check
      CHECK (binding_hash ~ '^[a-f0-9]{64}$');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'oauth_login_handoffs_user_id_fkey'
      AND conrelid = 'public.oauth_login_handoffs'::regclass
  ) THEN
    ALTER TABLE public.oauth_login_handoffs
      ADD CONSTRAINT oauth_login_handoffs_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_oauth_login_handoffs_user_id
  ON public.oauth_login_handoffs (user_id);

COMMIT;

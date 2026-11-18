BEGIN;

CREATE TABLE IF NOT EXISTS public.instagram_oauth_states (
  state_hash TEXT PRIMARY KEY CHECK (state_hash ~ '^[a-f0-9]{64}$'),
  binding_hash TEXT NOT NULL CHECK (binding_hash ~ '^[a-f0-9]{64}$'),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instagram_oauth_states_user_expires
  ON public.instagram_oauth_states (user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_instagram_oauth_states_expires
  ON public.instagram_oauth_states (expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_instagram_oauth_states_one_per_user
  ON public.instagram_oauth_states (user_id);

CREATE TABLE IF NOT EXISTS public.social_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider = 'instagram'),
  account_id TEXT,
  username TEXT,
  connection_status TEXT NOT NULL DEFAULT 'disconnected'
    CHECK (connection_status IN ('disconnected', 'connecting', 'connected', 'expired', 'reconnect_required', 'error')),
  granted_permissions TEXT[] NOT NULL DEFAULT '{}',
  followers_count BIGINT,
  media_count BIGINT,
  token_ciphertext TEXT,
  token_iv TEXT,
  token_auth_tag TEXT,
  token_expires_at TIMESTAMPTZ,
  token_issued_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT social_integrations_token_parts_check CHECK (
    (token_ciphertext IS NULL AND token_iv IS NULL AND token_auth_tag IS NULL)
    OR
    (token_ciphertext IS NOT NULL AND token_iv IS NOT NULL AND token_auth_tag IS NOT NULL)
  ),
  CONSTRAINT social_integrations_provider_account_unique UNIQUE (provider, account_id),
  CONSTRAINT social_integrations_user_provider_unique UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_social_integrations_user_provider
  ON public.social_integrations (user_id, provider);

ALTER TABLE public.instagram_oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_integrations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.instagram_oauth_states FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.social_integrations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.instagram_oauth_states TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.social_integrations TO service_role;

COMMIT;

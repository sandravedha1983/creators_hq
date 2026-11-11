BEGIN;

CREATE TABLE IF NOT EXISTS public.oauth_login_handoffs (
  code_hash TEXT PRIMARY KEY CHECK (code_hash ~ '^[a-f0-9]{64}$'),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('creator', 'brand', 'admin')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oauth_login_handoffs_expires_at
  ON public.oauth_login_handoffs (expires_at);

CREATE INDEX IF NOT EXISTS idx_oauth_login_handoffs_user_id
  ON public.oauth_login_handoffs (user_id);

ALTER TABLE public.oauth_login_handoffs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.oauth_login_handoffs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.oauth_login_handoffs TO service_role;

COMMIT;

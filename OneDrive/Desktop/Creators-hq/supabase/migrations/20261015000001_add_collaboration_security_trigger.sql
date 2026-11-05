-- =============================================================================
-- CreatorsHQ  ·  Follow-up security migration
-- Version : 20261015000001
-- Purpose : Install the missing trg_protect_collaboration_status_transitions
--           trigger that was defined in the V1 init migration but was never
--           applied to the live production database.
--
-- Safety guarantees
--   • Idempotent – safe to run more than once; existing objects are replaced,
--     not duplicated.
--   • Non-destructive – no table drops, no data modifications, no removal of
--     the existing set_collaborations_updated_at trigger.
--   • Wrapped in a transaction so the entire migration rolls back on any error.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- STEP 1 — Trigger function: protect_collaboration_status_transitions
--
-- Authorization model (read carefully before changing):
--
--   ┌─ auth.uid() IS NULL  ─────────────────────────────────────────────────┐
--   │  In Supabase, auth.uid() returns NULL when the executing session holds │
--   │  a service-role key (not a user JWT).  The Node.js backend uses the   │
--   │  service-role client to write to Supabase on behalf of users.          │
--   │                                                                        │
--   │  DECISION: allow the bypass only when auth.uid() IS NULL — meaning the │
--   │  call originates from a server-side service-role session, NOT from any  │
--   │  browser-reachable path.  This is safe because:                        │
--   │    1. The service-role key is server-side only; no browser client can  │
--   │       obtain it.                                                        │
--   │    2. The backend controller already validates transitions and          │
--   │       participant identity before issuing the UPDATE.                  │
--   │    3. The collaborations table RLS UPDATE policy (Step 2) is NOT       │
--   │       evaluated for service-role sessions at all, so the trigger is    │
--   │       the ONLY enforcement layer for server-side updates — and the     │
--   │       backend is the trusted caller.                                    │
--   │                                                                        │
--   │  Authenticated users (anon key + user JWT) always have a non-null      │
--   │  auth.uid() and therefore CANNOT exploit this path.                    │
--   └────────────────────────────────────────────────────────────────────────┘
--
--   ┌─ public.is_admin() ───────────────────────────────────────────────────┐
--   │  is_admin() is SECURITY DEFINER and checks app_metadata.role first    │
--   │  (server-set, user-uneditable) then falls back to the profiles table.  │
--   │  It is safe for use inside this trigger.                               │
--   └────────────────────────────────────────────────────────────────────────┘
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_collaboration_status_transitions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ── Guard 1: Immutable participant IDs ────────────────────────────────────
  IF NEW.sender_id IS DISTINCT FROM OLD.sender_id THEN
    RAISE EXCEPTION
      'Unauthorized: sender_id is immutable on collaborations (id=%)', OLD.id;
  END IF;

  IF NEW.receiver_id IS DISTINCT FROM OLD.receiver_id THEN
    RAISE EXCEPTION
      'Unauthorized: receiver_id is immutable on collaborations (id=%)', OLD.id;
  END IF;

  -- ── Guard 2: No-op update (status unchanged, e.g. only updated_at) ───────
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- ── Guard 3: Service-role bypass (auth.uid() IS NULL) ────────────────────
  -- auth.uid() is NULL only for service-role sessions (server-side backend).
  -- Authenticated browser clients always carry a user JWT → non-null uid.
  -- This branch is intentionally NOT reachable by end users; RLS blocks
  -- unauthorized authenticated updates before the trigger fires.
  IF auth.uid() IS NULL THEN
    -- Allow: the backend has already validated the transition.
    RETURN NEW;
  END IF;

  -- ── Guard 4: Admin bypass ─────────────────────────────────────────────────
  -- is_admin() reads app_metadata (server-controlled) first, then profiles.
  -- Cannot be spoofed via user_metadata.
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- ── Guard 5: Participant transition rules (authenticated non-admin) ────────

  -- Terminal states: no further transitions allowed.
  IF OLD.status IN ('rejected', 'completed') THEN
    RAISE EXCEPTION
      'Invalid transition: Collaboration % is in terminal state "%" and cannot be modified.',
      OLD.id, OLD.status;
  END IF;

  -- From 'pending': only the receiver may accept or reject.
  IF OLD.status = 'pending' THEN
    IF NEW.status NOT IN ('accepted', 'rejected') THEN
      RAISE EXCEPTION
        'Invalid transition: Pending collaboration % can only move to "accepted" or "rejected", not "%".',
        OLD.id, NEW.status;
    END IF;
    IF auth.uid() IS DISTINCT FROM OLD.receiver_id THEN
      RAISE EXCEPTION
        'Unauthorized: Only the receiver may accept or reject collaboration % (receiver=%).',
        OLD.id, OLD.receiver_id;
    END IF;
    RETURN NEW;
  END IF;

  -- From 'accepted': either participant may mark as completed.
  IF OLD.status = 'accepted' THEN
    IF NEW.status != 'completed' THEN
      RAISE EXCEPTION
        'Invalid transition: Accepted collaboration % can only move to "completed", not "%".',
        OLD.id, NEW.status;
    END IF;
    IF auth.uid() IS DISTINCT FROM OLD.sender_id
       AND auth.uid() IS DISTINCT FROM OLD.receiver_id THEN
      RAISE EXCEPTION
        'Unauthorized: Only participants may complete collaboration % (sender=%, receiver=%).',
        OLD.id, OLD.sender_id, OLD.receiver_id;
    END IF;
    RETURN NEW;
  END IF;

  -- Catch-all for future status values added to the CHECK constraint
  -- before this trigger is updated.
  RAISE EXCEPTION
    'Unhandled status transition on collaboration %: "%" to "%". Update the trigger function.',
    OLD.id, OLD.status, NEW.status;
END;
$$;

-- ---------------------------------------------------------------------------
-- STEP 2 — Install the trigger on public.collaborations
--
-- The existing set_collaborations_updated_at trigger is NOT touched.
-- BEFORE UPDATE, FOR EACH ROW fires before the row is written, so
-- RAISE EXCEPTION aborts the statement cleanly with no partial writes.
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_protect_collaboration_status_transitions
  ON public.collaborations;

CREATE TRIGGER trg_protect_collaboration_status_transitions
  BEFORE UPDATE ON public.collaborations
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_collaboration_status_transitions();

-- ---------------------------------------------------------------------------
-- STEP 3 — Harden the existing RLS UPDATE policy
--
-- The V1 init policy had a gap: the WITH CHECK clause evaluated the new
-- `status` value but only after the USING clause had already admitted the
-- row based on current status — meaning a determined authenticated user who
-- passed USING could supply a forbidden new status.
--
-- The replacement below makes both clauses jointly sufficient:
--   • USING  — caller is a participant or admin AND current status permits a
--               transition to start.
--   • WITH CHECK — the new status is the specifically permitted target for
--                  this caller's role and the current state.
--
-- Together with the trigger, this is defence-in-depth: neither alone is
-- sufficient against all attack vectors.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Participants or admins can update collaboration status"
  ON public.collaborations;

CREATE POLICY "Participants or admins can update collaboration status"
  ON public.collaborations
  FOR UPDATE
  TO authenticated
  USING (
    -- Admin may update any row regardless of current state.
    public.is_admin()
    -- Receiver may start a transition from pending.
    OR (auth.uid() = receiver_id AND status = 'pending')
    -- Either participant may start a transition from accepted.
    OR ((auth.uid() = sender_id OR auth.uid() = receiver_id) AND status = 'accepted')
  )
  WITH CHECK (
    -- Admin: any valid new status (CHECK constraint guards the value).
    public.is_admin()
    OR (
      -- Non-admin: new status must be the specifically permitted target.
      (sender_id = auth.uid() OR receiver_id = auth.uid())
      AND (
        -- Receiver completing a pending request (accept or reject).
        (auth.uid() = receiver_id AND status IN ('accepted', 'rejected'))
        -- Either participant completing an accepted collaboration.
        OR ((auth.uid() = sender_id OR auth.uid() = receiver_id) AND status = 'completed')
      )
    )
  );

COMMIT;

-- =============================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- Run each block separately in the Supabase SQL Editor after the migration.
-- =============================================================================

-- V1: Confirm both triggers exist and are enabled on public.collaborations.
--     Expected rows: set_collaborations_updated_at  AND
--                    trg_protect_collaboration_status_transitions
--     tgenabled = 'O' means "fires in origin mode" (normal).
SELECT
  tgname        AS trigger_name,
  tgenabled     AS enabled
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'collaborations'
  AND NOT tgisinternal
ORDER BY tgname;

-- V2: Confirm the trigger function exists with SECURITY DEFINER.
--     Expected: one row with security_definer = true.
SELECT
  p.proname   AS function_name,
  p.prosecdef AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'protect_collaboration_status_transitions';

-- V3: Confirm exactly one RLS UPDATE policy is in place on collaborations.
--     polcmd = 'w' means UPDATE.
SELECT
  polname  AS policy_name,
  polcmd   AS command
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'collaborations'
  AND polcmd = 'w';

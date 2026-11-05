# CreatorsHQ Waitlist Supabase Verification Report

Date: 2026-11-01

## A. Migration

- Read-only reconciliation refreshed: 2026-11-01.
- Migration reviewed: `supabase/migrations/20261102000000_create_creator_waitlist.sql`.
- Supabase CLI: version `2.122.0`; linked to project ref `ifwnsbvqbdrxviwlxyjr`.
- `supabase migration list --linked`: confirmed all four local versions have blank remote entries.
- Dry-run: not run as part of this read-only audit. The user-provided dry-run reported that all four migrations would be pushed.
- Remote ledger: `to_regclass('supabase_migrations.schema_migrations')` returned `NULL`; catalog search found no `supabase_migrations` history relation. This accounts for the blank remote migration versions.
- Production approval: **not obtained**.
- Deployment: **not performed**. No production schema or data was changed.
- Static compatibility review: the migration depends on `public.profiles` (`id`, `role`, `is_blocked`, `is_suspended`), `auth.uid()`, `gen_random_uuid()`, and `public.handle_updated_at()`. The preceding local migrations define the profile fields and trigger function; the waitlist-specific admin helper checks the profile directly and does not rely on the shared `is_admin()` helper's JWT metadata behavior.

The migration defines a UUID primary key, required application fields, constrained statuses, normalized active-email uniqueness, status/date/token indexes, invitation hash and expiry fields, timestamps, RLS, and admin-only select/update policies. Anonymous inserts are restricted to normalized-email pending applications with required fields and no invitation metadata. There is no public select policy. Authenticated table updates are granted at the SQL level but RLS limits them to active admins.

## B. Database

- Configured Supabase project connectivity: a server-side, read-only Supabase client connected to the configured project.
- The 13 base public tables from the initial migration are present with their expected column names, constraints/index names, and RLS enabled. The three expected storage buckets and seven initial storage policies are also present.
- The user's Supabase Table Editor screenshot independently shows the same 13 public tables; it corroborates the PostgreSQL catalog inventory.
- Required `profiles` columns (`id`, `role`, `is_blocked`, `is_suspended`) exist.
- Direct PostgreSQL catalog query confirms `public.creator_waitlist` does **not** exist. Its indexes, RLS policies, trigger, and `public.is_active_waitlist_admin()` helper are consequently absent.
- `public.public_creator_profiles` is also absent; the migration 3 restrictive profile/collaboration policies are absent.
- Migration ledger: `supabase_migrations.schema_migrations` is absent. Separate internal `auth.schema_migrations` and `realtime.schema_migrations` relations exist but are not the Supabase CLI project migration ledger.
- Remote `public.is_admin()` is SECURITY DEFINER but its body grants admin on `auth.jwt()->'user_metadata'->>'role'='admin'`; user metadata is user-editable. This is a material security drift from the local migration definitions and migration 3's profile-authoritative implementation.
- No applicant personal information was returned or included in this report.

## C. Frontend and Backend

- The waitlist form calls `submitWaitlistApplication()` in `frontend/src/services/waitlistService.ts`, which posts to `/api/waitlist/apply`.
- The backend uses the configured Supabase service-role client for database reads and writes. It validates required fields and URLs, normalizes email to lowercase, handles duplicate-email unique-index races, and returns a safe confirmation (`id`, `status`, `created_at`) only after the database insert returns successfully.
- Removed the in-memory waitlist fallback. If storage is unconfigured or PostgREST reports a missing relation/function, the backend now returns an explicit 503 instead of reporting a false success or serving mock data.
- Controller-level valid-payload persistence probe: returned `503`, “Waitlist storage is temporarily unavailable.” The initial database lookup failed on `PGRST205`, before any insert was attempted.
- Invalid application controller probe: returned `400`, “Validation failed.”
- The browser form correctly shows success only when the backend returns `success: true`, and disables its submit button while the request is in flight.

## D. Admin

- Admin routes use authentication followed by `authorize('admin')`; the auth middleware resolves the authoritative profile role and rejects blocked/suspended profiles.
- Static migration policy review: active admin profile role and account status are checked for waitlist reads and updates. Applicants have neither a select policy nor a status-update policy.
- Admin retrieval, search/filter, status changes, and invite/reinvite UI are implemented against the backend API.
- Local waitlist router request without authentication: `GET /api/waitlist/admin` returned `401`.
- Non-admin authorization guard probe: returned `403`.
- Admin retrieval and authenticated role tests: **not performed**, because migration state is unresolved and no suitable admin account credentials were supplied. No applicant rows were accessed.

## E. Invitation

- Static code review confirms a 32-byte cryptographically random token, SHA-256 hash persistence, seven-day expiration, indexed hash lookup, conditional one-time acceptance, token clearing after acceptance, and rollback to `selected` when the email provider reports failure.
- SMTP and Resend are separate backend invitation providers; Supabase Auth email is not used by this mailer.
- Actual invitation email delivery and acceptance: **not tested**. There is no waitlist row to invite, and no mass or test email was sent.

## F. Actual Test Evidence

| Check | Result |
|---|---|
| Live read-only query of required `profiles` column names | Accepted by PostgREST |
| Live read-only query of waitlist columns | `PGRST205`; table not found in schema cache |
| Live read-only lookup of waitlist admin helper | `PGRST202`; function not found in schema cache |
| Invalid application validation | 400; rejected |
| Valid synthetic application attempt | 503; rejected before insert |
| Unauthenticated admin-list request | 401 |
| Non-admin authorization guard | 403 |
| Supabase record for a test application | None created or verified |
| Migration deployment / production changes | None |

The valid attempt was deliberately not retried as a successful production submission: the schema-cache error prevented proving persistence at that time, and the subsequent catalog audit confirmed the relation is absent. The production approval gate remains in effect.

Validation commands:

```text
npm test -- --runInBand                       # backend: 1 suite, 48 tests passed
npm run build                                  # frontend: TypeScript + Vite build passed
node --check src/modules/waitlist/controllers.js
node --check src/modules/waitlist/routes.js
```

The backend tests cover the existing collaboration suite; there is no dedicated waitlist integration suite in the current test command.

## G. Remaining Blockers

1. The remote migration ledger is absent, and the initial schema is reflected with material function drift. Do not blindly push or mark all four migrations applied; a project owner/DBA must approve a deliberate history-reconciliation plan.
2. The live `is_admin()` and auth-profile trigger definitions trust user-editable metadata. Prioritize a separately approved security remediation; migration 3 appears intended to harden these paths but was not applied in this audit.
3. Migration 4 remains unapplied. After migration history and dependencies are reconciled and explicit production approval is obtained, deploy only the reviewed outstanding changes.
4. After deployment, verify table existence, columns, RLS, policies, and indexes using SQL/catalog access (not only the PostgREST schema cache).
5. Submit one clearly identified test application with a dedicated test email, verify the stored row without exposing personal data, and then clean up only that test row as authorized.
6. With an authorized admin test account, verify retrieval/status management and 401/403 access controls. Test one invitation and acceptance only after the database is available and a test mailbox is supplied.

Commands previously used for read-only inspection (no database mutation):

```powershell
cd C:\Users\sandr\OneDrive\Desktop\Creators-hq
supabase migration list --linked
```

No `db push`, `db reset`, `migration repair`, or migration SQL was executed. No production changes were made.

Read-only SQL to run in the linked project's SQL editor after migration status is established:

```sql
SELECT to_regclass('public.creator_waitlist');

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'creator_waitlist'
ORDER BY ordinal_position;

SELECT relrowsecurity
FROM pg_class
WHERE oid = 'public.creator_waitlist'::regclass;

SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'creator_waitlist';

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'creator_waitlist';
```

## H. Final Verdict

**MIGRATION READY, NOT DEPLOYED**

The waitlist migration is statically reviewed but absent from the live catalog. Application persistence and admin management are not verified. The migration-history gap and existing schema drift mean the four local migrations must not be blindly pushed; production approval remains required.

## I. Production Migration Reconciliation (Read-Only)

The following classifications compare all four local migrations with the linked PostgreSQL catalogs. No migration SQL was run and no production object or data was changed.

| Migration | Classification | Catalog evidence and disposition |
|---|---|---|
| `20261014000000_creatorshq_v1_init.sql` | **Base schema reflected; function/security drift remains; not safely replayable as-is** | Its 13 base public tables, columns, constraints/indexes, RLS, initial storage buckets/policies, helper functions, and auth/profile triggers are present. Live `is_admin()` trusts `user_metadata.role='admin'`, unlike the local initial migration, and `handle_new_auth_user()` still derives the role from user-supplied metadata. The migration uses `CREATE TABLE IF NOT EXISTS` (which would not reconcile changed columns/constraints), while `CREATE OR REPLACE FUNCTION`, trigger replacement, and policy replacement can overwrite existing definitions. Replaying the full initial migration could therefore leave schema drift in place and restore weaker behavior. |
| `20261015000001_add_collaboration_security_trigger.sql` | **Already reflected but not recorded in migration history** | The collaboration transition function, trigger, and corresponding update policy exist and match the migration's expected objects. The remote CLI migration ledger is absent, so the version is not recorded there. Do not replay without resolving the ledger gap. |
| `20261026000000_harden_auth_profiles_collaboration_security.sql` | **Completely missing; requires review and manual reconciliation** | The hardened helper/function definitions, restrictive profile/collaboration policies, and `public.public_creator_profiles` view are absent. Older same-name helper/trigger definitions remain. The migration is the intended security correction, but must be applied through an approved history-reconciliation plan rather than as part of a blind four-migration push. |
| `20261102000000_create_creator_waitlist.sql` | **Completely missing; SQL dependencies are present; deployment still requires migration-history reconciliation and explicit approval** | PostgreSQL catalogs show no `public.creator_waitlist` relation, waitlist indexes/policies/trigger, or `public.is_active_waitlist_admin()` function. Required dependencies (`profiles` with the four referenced columns, `handle_updated_at()`, `auth.uid()`, and UUID generation) exist. No same-named waitlist objects were found that would conflict. The waitlist SQL is self-contained relative to those dependencies and can be considered independently at the SQL/object level, but the linked CLI currently considers all four local migrations pending; a normal `db push` would include all four, not just waitlist. Do not deploy independently until the absent ledger is reconciled and an approved single-migration procedure is established. This migration is timestamped one day after the report date. |

### Migration history and dependencies

- `supabase migration list --linked` showed blank remote entries for all four local versions. A direct `to_regclass('supabase_migrations.schema_migrations')` check returned `NULL`, and the catalog search found no project migration-ledger relation. This explains the blank remote versions; `auth.schema_migrations` and `realtime.schema_migrations` are separate system ledgers and do not establish project migration history.
- Dependency order is 1 → 2 and 3; migration 4 depends on the base profiles table and `handle_updated_at()` from migration 1. Migration 3 additionally replaces the older profile/admin security logic. Migration 2's collaboration objects already exist.
- The migration 1 indexes and expected relation-column inventories were checked in `pg_catalog`/`information_schema`; the migration 2 collaboration trigger and update policy were checked directly. The image is consistent with those catalog results but cannot establish migration history.
- A read-only count found zero accounts with admin role in app metadata or user metadata and zero metadata-only/profile mismatch cases. This does not make the user-metadata trust path safe; it only reports the current count.
- Recommended sequence: **do not push all four**. First have the project owner/DBA reconcile why the project ledger is absent and document the existing schema/function drift. Then, after explicit approval, establish accurate history for already-reflected migrations without reapplying them; review and apply the security-hardening migration; finally apply the waitlist migration. Verify each stage in PostgreSQL catalogs before proceeding. No ledger repair or deployment is authorized or performed by this report.

### Security note

The live `public.is_admin()` security-definer function accepts `user_metadata.role='admin'`, and the live auth-user profile trigger also derives a profile role from user-supplied metadata. This is a material privilege-escalation risk because user metadata is user-editable. No signup or privilege-escalation test was attempted. Restrict changes to a separately approved remediation; do not weaken existing policies to make a migration pass.

# Secure Admin provisioning

CreatorsHQ uses the existing Supabase Auth account and `public.profiles.role`.
There is no public Admin signup, separate Admin identity provider, or frontend
role selector for Admin.

## One-time owner bootstrap / later provisioning

1. Apply `supabase/migrations/20261111000000_secure_verification_lifecycle.sql`
   to the intended Supabase project through the reviewed deployment process.
   The migration is additive and does not reset or delete application data.
2. Create the operator's ordinary Supabase Auth account through the normal
   Creator/Brand signup flow and confirm its email.
3. Run the provisioning command only from a trusted backend/deployment
   workstation that has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in its
   server-side environment. Never place the service-role key in the Admin or
   frontend environment.

   ```powershell
   cd backend
   npm run admin:provision -- --user-id <SUPABASE_AUTH_UUID> --reason "Platform owner authorization" --operator "operator@example.com"
   ```

4. Confirm the command reports success, then sign in through the existing Admin
   login. The provisioning RPC requires a confirmed Supabase Auth account,
   updates only the matching profile role, and atomically records the action in
   `public.audit_logs`. First-owner provisioning has a null `actor_id` because
   no Admin actor exists yet; the supplied operator and reason are retained in
   the audit details.
5. To revoke an Admin, use the same trusted environment and specify that
   account's prior Creator/Brand role. The operation refuses to demote the last
   active Admin and writes an audit event:

   ```powershell
   npm run admin:revoke -- --user-id <SUPABASE_AUTH_UUID> --restore-role <creator-or-brand> --reason "Access no longer required" --operator "operator@example.com"
   ```

   Do not edit JWT metadata; the profile row is the authoritative Admin role.

The migration can harden the database only after it has actually been applied.
Verify the target project's migration history and run the security tests against
that project before deployment; repository migration files alone do not prove
the production project has applied them.

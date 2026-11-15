const { supabase } = require('../config/supabase');

const parseArgs = (args) => {
  const parsed = {};
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (!key.startsWith('--')) continue;
    parsed[key.slice(2)] = args[index + 1];
    index += 1;
  }
  return parsed;
};

const main = async () => {
  const { 'user-id': userId, 'restore-role': restoreRole, reason, operator } =
    parseArgs(process.argv.slice(2));
  if (!userId || !['creator', 'brand'].includes(restoreRole) || !reason?.trim()) {
    throw new Error('Usage: npm run admin:revoke -- --user-id <Supabase-UUID> --restore-role <creator|brand> --reason "<reason>" [--operator "<name/email>"]');
  }

  const { error } = await supabase.rpc('revoke_admin_role', {
    p_user_id: userId,
    p_restore_role: restoreRole,
    p_reason: reason.trim(),
    p_operator: operator?.trim() || null
  });
  if (error) throw error;

  console.log(`Admin role revoked for ${userId}; the role change was written to audit_logs.`);
};

main().catch(error => {
  console.error(`[ADMIN ROLE REVOCATION FAILED] ${error.message || error}`);
  process.exitCode = 1;
});

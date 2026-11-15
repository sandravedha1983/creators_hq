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
  const { 'user-id': userId, reason, operator } = parseArgs(process.argv.slice(2));
  if (!userId || !reason?.trim()) {
    throw new Error('Usage: npm run admin:provision -- --user-id <Supabase-UUID> --reason "<approval reason>" [--operator "<name/email>"]');
  }

  const { data: authResult, error: authError } = await supabase.auth.admin.getUserById(userId);
  if (authError) throw authError;
  if (!authResult.user?.email_confirmed_at) {
    throw new Error('The target Supabase Auth account must exist and have a confirmed email.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, is_blocked, is_suspended')
    .eq('id', userId)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) throw new Error('The target account profile does not exist.');
  if (profile.role === 'admin') {
    console.log('The account is already an Admin; no changes were made.');
    return;
  }

  const { error: provisioningError } = await supabase.rpc('provision_admin_role', {
    p_user_id: userId,
    p_reason: reason.trim(),
    p_operator: operator?.trim() || null
  });
  if (provisioningError) throw provisioningError;

  console.log(`Admin role provisioned for ${userId}; the provisioning event was written to audit_logs.`);
};

main().catch(error => {
  console.error(`[ADMIN PROVISIONING FAILED] ${error.message || error}`);
  process.exitCode = 1;
});

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('[SUPABASE CONFIG WARNING] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. Operations requiring Supabase will fail.');
}

// Privileged server-side client (bypasses RLS using Service Role Key for server-side management)
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceRoleKey || 'placeholder_key', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

// Helper to create a user-scoped client that respects Row Level Security using the user's JWT access token
const createUserClient = (accessToken) => {
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is required to create a user-scoped Supabase client.');
  }
  if (!supabaseAnonKey) {
    throw new Error('SUPABASE_ANON_KEY is required to create a user-scoped Supabase client.');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });
};

const createPublicClient = () => {
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is required to create a public Supabase client.');
  }
  if (!supabaseAnonKey) {
    throw new Error('SUPABASE_ANON_KEY is required to create a public Supabase client.');
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
};

module.exports = { supabase, createUserClient, createPublicClient };

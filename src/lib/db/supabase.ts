import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo-placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-anon-key-placeholder';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export function getSupabaseAdminClient() {
  if (!supabaseServiceRoleKey) {
    // Return standard client if service role key not provided in demo
    return supabaseClient;
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

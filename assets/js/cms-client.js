import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Public browser key. Database and Storage access are enforced by RLS.
export const supabase = createClient(
  'https://htohcymnsegllofqkgvr.supabase.co',
  'sb_publishable_c_v_qehck_Q1RbkaXo2Y_A_c71bDBS2',
  { auth: { storageKey: 'wujha-content-auth', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

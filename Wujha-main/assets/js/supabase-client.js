import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = localStorage.getItem('wujha_supabase_url') || 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = localStorage.getItem('wujha_supabase_anon_key') || 'YOUR_ANON_KEY';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function signIn(phone, password) {
  return supabase.auth.signInWithPassword({ phone, password });
}

export async function signUp({ name, phone, email, password, userType, commercialRegister }) {
  const result = await supabase.auth.signUp({
    phone, email: email || undefined, password,
    options: { data: { name, user_type: userType, commercial_register: commercialRegister || null } }
  });
  if (result.error || !result.data.user) return result;
  const { error } = await supabase.from('users').upsert({
    id: result.data.user.id, name, phone, email: email || null,
    user_type: userType, commercial_register: commercialRegister || null
  });
  return { data: result.data, error };
}

export const db = {
  products: () => supabase.from('products').select('*, seller:users!seller_id(name, phone)').eq('status', 'active').order('created_at', { ascending: false }),
  deal: (id) => supabase.from('deals').select('*, product:products(*), buyer:users!buyer_id(*), seller:users!seller_id(*)').eq('id', id).single(),
  createDeal: (payload) => supabase.from('deals').insert(payload).select().single(),
  disputes: (dealId) => supabase.from('disputes').select('*').eq('deal_id', dealId).order('created_at', { ascending: false }),
  notifications: () => supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20)
};

export function requireRole(roles) {
  return supabase.auth.getSession().then(({ data }) => {
    const role = data.session?.user?.user_metadata?.user_type;
    if (!data.session || (roles.length && !roles.includes(role))) location.href = 'login.html';
    return data.session;
  });
}

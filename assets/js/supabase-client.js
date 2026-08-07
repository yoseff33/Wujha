import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = localStorage.getItem('wujha_supabase_url') || 'https://blnwohxbrundwiachkon.supabase.co';
const SUPABASE_ANON_KEY = localStorage.getItem('wujha_supabase_anon_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsbndvaHhicnVuZHdpYWNoa29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxODc5ODUsImV4cCI6MjA5ODc2Mzk4NX0.4ffpJ_GcV51Znrt0mVz2VBWFI46HgxDcRE4SlAvk10Q';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// دالة مساعدة لتأكيد تنسيق الرقم بالصيغة الدولية E.164
function formatSAPhone(phone) {
  if (!phone) return '';
  let cleaned = phone.trim().replace(/[^\d+]/g, '');
  if (cleaned.startsWith('05')) {
    return '+966' + cleaned.substring(1);
  } else if (cleaned.startsWith('5')) {
    return '+966' + cleaned;
  } else if (cleaned.startsWith('966')) {
    return '+' + cleaned;
  } else if (!cleaned.startsWith('+')) {
    return '+' + cleaned;
  }
  return cleaned;
}

export async function signIn(phone, password) {
  const formattedPhone = formatSAPhone(phone);
  return await supabase.auth.signInWithPassword({ 
    phone: formattedPhone, 
    password 
  });
}

export async function signUp({ name, phone, email, password, userType, commercialRegister }) {
  const formattedPhone = formatSAPhone(phone);
  
  // التسجيل يتكفل به التريجر handle_new_auth_user بقاعدة البيانات تلقائياً
  return await supabase.auth.signUp({
    phone: formattedPhone,
    email: email || undefined,
    password,
    options: { 
      data: { 
        name, 
        user_type: userType, 
        commercial_register: commercialRegister || null 
      } 
    }
  });
}

export const db = {
  products: () => supabase.from('products').select('*, seller:users!seller_id(name, phone)').eq('status', 'active').order('created_at', { ascending: false }),
  deal: (id) => supabase.from('deals').select('*, product:products(*), buyer:users!buyer_id(*), seller:users!seller_id(*)').eq('id', id).single(),
  createDeal: (payload) => supabase.from('deals').insert(payload).select().single(),
  disputes: (dealId) => supabase.from('disputes').select('*').eq('deal_id', dealId).order('created_at', { ascending: false }),
  notifications: () => supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20)
};

export async function requireRole(roles = []) {
  const { data: { session } } = await supabase.auth.getSession();
  const role = session?.user?.user_metadata?.user_type;
  
  if (!session || (roles.length && !roles.includes(role))) {
    window.location.href = 'login.html';
  }
  return session;
}

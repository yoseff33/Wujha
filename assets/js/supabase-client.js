import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const DEFAULT_URL = 'https://blnwohxbrundwiachkon.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsbndvaHhicnVuZHdpYWNoa29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxODc5ODUsImV4cCI6MjA5ODc2Mzk4NX0.4ffpJ_GcV51Znrt0mVz2VBWFI46HgxDcRE4SlAvk10Q';
const url = localStorage.getItem('wujha_supabase_url') || DEFAULT_URL;
const anonKey = localStorage.getItem('wujha_supabase_anon_key') || DEFAULT_ANON_KEY;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

export const auth = {
  session: () => supabase.auth.getSession(),
  signIn: (phone, password) => supabase.auth.signInWithPassword({ phone, password }),
  signUp: ({ name, phone, email, password, userType, commercialRegister }) => supabase.auth.signUp({
    phone,
    email: email || undefined,
    password,
    options: { data: { name, phone, user_type: userType, commercial_register: commercialRegister || null } }
  }),
  signOut: () => supabase.auth.signOut(),
  resetPassword: email => supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}${location.pathname.replace(/login\/$/, 'profile/')}` }),
  updatePassword: password => supabase.auth.updateUser({ password }),
  onChange: callback => supabase.auth.onAuthStateChange(callback)
};

export const profiles = {
  mine: () => supabase.from('users').select('*').single(),
  update: (id, payload) => supabase.from('users').update(payload).eq('id', id).select().single(),
  requestDeletion: (userId, reason) => supabase.from('account_deletion_requests').insert({ user_id: userId, reason }).select().single()
};

export const products = {
  list: () => supabase.from('products').select('id,seller_id,title,description,price,category,condition,main_image,vin,location,is_guaranteed,status,created_at,seller:users!seller_id(name)').eq('status', 'active').order('created_at', { ascending: false }),
  mine: userId => supabase.from('products').select('*').eq('seller_id', userId).order('created_at', { ascending: false }),
  create: payload => supabase.from('products').insert(payload).select().single(),
  update: (id, payload) => supabase.from('products').update(payload).eq('id', id).select().single(),
  remove: id => supabase.from('products').delete().eq('id', id),
  images: productId => supabase.from('product_images').select('*').eq('product_id',productId).order('sort_order'),
  uploadImage: async (userId,productId,file,index) => { const path=`${userId}/${productId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'')}`; const uploaded=await supabase.storage.from('product-images').upload(path,file,{contentType:file.type}); if(uploaded.error)return uploaded; const {data:url}=supabase.storage.from('product-images').getPublicUrl(path); return supabase.from('product_images').insert({product_id:productId,storage_path:path,public_url:url.publicUrl,sort_order:index}); },
  reviews: productId => supabase.from('product_reviews').select('*,reviewer:users!reviewer_id(name)').eq('product_id',productId).order('created_at',{ascending:false}),
  addReview: payload => supabase.from('product_reviews').insert(payload).select().single(),
  favorites: userId => supabase.from('product_favorites').select('product_id').eq('user_id',userId),
  favorite: (userId,productId) => supabase.from('product_favorites').insert({user_id:userId,product_id:productId}),
  unfavorite: (userId,productId) => supabase.from('product_favorites').delete().eq('user_id',userId).eq('product_id',productId)
};

export const deals = {
  listMine: (userId, role) => {
    let query = supabase.from('deals').select('id,buyer_id,seller_id,status,deal_price,escrow_fee,vat,total_amount_paid,created_at,product:products(title)').order('created_at', { ascending: false });
    if (role === 'buyer') query = query.eq('buyer_id', userId);
    if (role === 'seller') query = query.eq('seller_id', userId);
    return query;
  },
  get: id => supabase.from('deals').select('*,product:products(*),buyer:users!buyer_id(id,name),seller:users!seller_id(id,name)').eq('id', id).single(),
  findCounterparty: phone => supabase.rpc('find_deal_counterparty', { requested_phone: phone }),
  create: payload => supabase.from('deals').insert(payload).select().single(),
  transition: (dealId, nextStatus) => supabase.rpc('transition_deal', { requested_deal_id: dealId, requested_status: nextStatus })
};

export const invitations = {
  create: payload => supabase.rpc('create_deal_invitation', {
    invitee_phone: payload.inviteePhone,
    invitee_name: payload.inviteeName,
    creator_role: payload.creatorRole,
    external_ad_url: payload.externalUrl || '',
    category: payload.category,
    fee_bearer: payload.feeBearer,
    installment_enabled: payload.installments,
    deal_price: payload.dealPrice,
    inspection_hours: payload.inspectionHours
  })
};

export const disputes = {
  list: dealId => supabase.from('disputes').select('*,opener:users!opened_by(name)').eq('deal_id', dealId).order('created_at', { ascending: false }),
  open: payload => supabase.from('disputes').insert(payload).select().single(),
  resolve: (disputeId, resolution, response) => supabase.rpc('resolve_dispute', { requested_dispute_id: disputeId, requested_resolution: resolution, requested_response: response })
};

export const invoices = {
  getByDeal: dealId => supabase.from('invoices').select('*,deal:deals(deal_price,total_amount_paid,status)').eq('deal_id', dealId).single()
};

export const notifications = {
  list: () => supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(30),
  markRead: id => supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
};

export const admin = {
  deletionRequests: () => supabase.from('account_deletion_requests').select('*,user:users(name,phone,email)').order('requested_at', { ascending: false }),
  reviewDeletion: (id, status) => supabase.from('account_deletion_requests').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id).select().single(),
  settings: () => supabase.from('platform_settings').select('*').single(),
  updateSettings: payload => supabase.from('platform_settings').update(payload).eq('id', true).select().single()
};

// Backward-compatible exports used by older pages.
export const getSession = auth.session;
export const signIn = auth.signIn;
export const signOut = auth.signOut;
export const signUp = auth.signUp;
export const getMyProfile = profiles.mine;
export const updateMyProfile = profiles.update;
export const requestAccountDeletion = profiles.requestDeletion;
export const findDealCounterparty = deals.findCounterparty;
export const db = { products: products.list, deal: deals.get, createDeal: deals.create, disputes: disputes.list, notifications: notifications.list };

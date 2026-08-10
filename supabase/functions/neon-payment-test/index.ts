import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const siteUrl = (Deno.env.get('SITE_URL') || 'https://wujha.shop').replace(/\/$/, '');
const allowedOrigin = Deno.env.get('SITE_ORIGIN') || 'https://wujha.shop';
const cors = { 'Access-Control-Allow-Origin': allowedOrigin, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json; charset=utf-8' };

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  try {
    const key = Deno.env.get('NEON_PAY_TEST_KEY') || '';
    if (!key.startsWith('NPay_test_')) return reply({ error: 'مفتاح Neon Pay التجريبي غير مضبوط في Supabase Secrets.' }, 500);
    const authorization = request.headers.get('Authorization') || '';
    const auth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
    const { data: { user }, error: authError } = await auth.auth.getUser();
    if (authError || !user) return reply({ error: 'سجّل الدخول أولاً لإجراء اختبار الدفع.' }, 401);
    const amount = Number((await request.json()).amount);
    if (!Number.isFinite(amount) || amount < 1 || amount > 10000) return reply({ error: 'قيمة الاختبار يجب أن تكون بين 1 و10,000 ر.س.' }, 400);
    const orderId = `WJH-TEST-${Date.now()}-${user.id.slice(0, 8)}`;
    const providerResponse = await fetch('https://neon-pay.io/api/v1/payments/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Ebik-Key': key },
      body: JSON.stringify({ amount: amount.toFixed(2), currency: 'SAR', order_id: orderId, callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/neon-payment-callback`, success_url: `${siteUrl}/payment-success/?order_id=${encodeURIComponent(orderId)}`, error_url: `${siteUrl}/payment-failed/?order_id=${encodeURIComponent(orderId)}` })
    });
    const result = await providerResponse.json().catch(() => ({}));
    if (!providerResponse.ok) return reply({ error: result.message || result.error || 'رفض مزود الدفع طلب الاختبار.' }, providerResponse.status);
    return reply({ payment_url: result.payment_url || result.checkout_url || result.url, payment_token: result.payment_token || result.token, order_id: orderId });
  } catch (error) {
    return reply({ error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع.' }, 500);
  }
});

function reply(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: cors }); }

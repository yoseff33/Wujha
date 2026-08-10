const headers = { 'Content-Type': 'application/json; charset=utf-8' };
Deno.serve(async request => {
  if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  try {
    const key = Deno.env.get('NEON_PAY_TEST_KEY') || '';
    if (!key.startsWith('NPay_test_')) return reply({ error: 'Missing test key' }, 500);
    const payload = await request.json();
    const token = payload.payment_token || payload.token;
    if (!token) return reply({ error: 'Missing payment token' }, 400);
    const verification = await fetch(`https://neon-pay.io/api/v1/payments/${encodeURIComponent(token)}`, { headers: { 'X-Ebik-Key': key } });
    const payment = await verification.json().catch(() => ({}));
    if (!verification.ok) return reply({ error: 'Payment verification failed' }, 502);
    console.log(JSON.stringify({ event: 'neon_pay_test_callback', payment_token: token, order_id: payment.order_id, status: payment.status }));
    return reply({ received: true });
  } catch (error) {
    return reply({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});
function reply(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers }); }

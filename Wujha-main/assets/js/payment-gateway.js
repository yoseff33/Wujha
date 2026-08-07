import { supabase } from './supabase-client.js';

export async function createMockPayment({ dealId, amount, gateway = 'Mada' }) {
  const transactionId = `WJH-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const { data, error } = await supabase.from('payments').insert({
    deal_id: dealId, amount, transaction_id: transactionId,
    payment_gateway: gateway, status: 'pending'
  }).select().single();
  if (!error) localStorage.setItem(`payment:${dealId}`, JSON.stringify(data));
  return { data, error, checkoutUrl: `deal-view.html?id=${dealId}&payment=${transactionId}` };
}

export async function confirmMockPayment(paymentId, dealId) {
  const payment = await supabase.from('payments').update({ status: 'paid' }).eq('id', paymentId);
  if (!payment.error) await supabase.from('deals').update({ status: 'paid_held' }).eq('id', dealId);
  return payment;
}

export const supportedGateways = ['Mada', 'Tabby', 'Tamara'];

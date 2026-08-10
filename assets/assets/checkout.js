import { supabase } from './supabase-client.js';

const money = value => new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(Number(value) || 0);
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
const cart = JSON.parse(localStorage.getItem('wujha_cart') || '[]');
const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
const itemsElement = document.getElementById('checkoutItems');
const totalElement = document.getElementById('checkoutTotal');
const form = document.getElementById('checkoutForm');
const message = document.getElementById('checkoutMessage');

itemsElement.innerHTML = cart.map(item => `<div class="rank-item"><img src="${escapeHtml(item.image || 'assets/favicon.svg')}" alt=""><span><h3>${escapeHtml(item.title)}</h3><small>الكمية: ${Number(item.quantity || 1)}</small></span><b>${money(Number(item.price || 0) * Number(item.quantity || 1))}</b></div>`).join('') || '<p>السلة فارغة.</p>';
totalElement.textContent = money(total);

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!cart.length) return showMessage('السلة فارغة.', true);
  const submitButton = form.querySelector('button');
  submitButton.disabled = true;
  showMessage('جارٍ فتح بوابة الدفع التجريبية...');
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      location.href = `login/?next=${encodeURIComponent(location.href)}`;
      return;
    }
    sessionStorage.setItem('wujha_checkout', JSON.stringify({ customer: Object.fromEntries(new FormData(form)), cart, total }));
    const { data, error } = await supabase.functions.invoke('neon-payment-test', { body: { amount: Number(total.toFixed(2)) } });
    if (error) throw error;
    if (!data?.payment_url) throw new Error(data?.error || 'لم يُرجع مزود الدفع رابط الدفع.');
    location.href = data.payment_url;
  } catch (error) {
    showMessage(error.message || 'تعذر بدء عملية الدفع التجريبية.', true);
    submitButton.disabled = false;
  }
});

function showMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? '#b91c1c' : '#075f4d';
}

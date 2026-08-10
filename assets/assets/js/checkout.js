import { supabase, profiles } from './supabase-client.js';

const money = value => new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(Number(value) || 0);
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
const cart = JSON.parse(localStorage.getItem('wujha_cart') || '[]');
const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
const itemsElement = document.getElementById('checkoutItems');
const totalElement = document.getElementById('checkoutTotal');
const form = document.getElementById('checkoutForm');
const message = document.getElementById('checkoutMessage');
const accountDataStatus = document.getElementById('accountDataStatus');
const editCustomerData = document.getElementById('editCustomerData');
const customerFields = ['name', 'phone', 'email'];

itemsElement.innerHTML = cart.map(item => `<div class="rank-item"><img src="${escapeHtml(item.image || 'assets/favicon.svg')}" alt=""><span><h3>${escapeHtml(item.title)}</h3><small>الكمية: ${Number(item.quantity || 1)}</small></span><b>${money(Number(item.price || 0) * Number(item.quantity || 1))}</b></div>`).join('') || '<p>السلة فارغة.</p>';
totalElement.textContent = money(total);

await fillCustomerData();

editCustomerData.addEventListener('click', () => {
  const editing = editCustomerData.dataset.editing !== 'true';
  editCustomerData.dataset.editing = String(editing);
  customerFields.forEach(name => { form.elements[name].readOnly = !editing; });
  editCustomerData.textContent = editing ? 'حفظ التعديل' : 'تعديل البيانات';
  accountDataStatus.textContent = editing ? 'يمكنك تعديل بيانات هذا الطلب الآن.' : 'تم اعتماد البيانات المعدلة لهذا الطلب.';
  if (editing) form.elements.name.focus();
});

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
    const customer = Object.fromEntries(new FormData(form));
    sessionStorage.setItem('wujha_checkout', JSON.stringify({ customer, cart, total }));
    const { data, error } = await supabase.functions.invoke('neon-payment-test', {
      body: {
        amount: Number(total.toFixed(2)),
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone
      }
    });
    if (error) {
      let details = '';
      try {
        const responseBody = await error.context?.clone().json();
        details = responseBody?.error || responseBody?.message || '';
      } catch { details = ''; }
      throw new Error(details || error.message || 'فشل استدعاء بوابة الدفع.');
    }
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

async function fillCustomerData() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    location.href = `login/?next=${encodeURIComponent(location.href)}`;
    return;
  }
  const user = session.user;
  let profile = null;
  try {
    const result = await profiles.mine();
    if (!result.error) profile = result.data;
  } catch { profile = null; }
  const saved = readSavedCheckout();
  const metadata = user.user_metadata || {};
  form.elements.name.value = profile?.name || metadata.name || saved?.customer?.name || '';
  form.elements.phone.value = profile?.phone || metadata.phone || user.phone || saved?.customer?.phone || '';
  form.elements.email.value = profile?.email || user.email || metadata.email || saved?.customer?.email || '';
  form.elements.city.value = saved?.customer?.city || '';
  form.elements.address.value = saved?.customer?.address || '';
  const missing = customerFields.filter(name => !String(form.elements[name].value).trim());
  if (missing.length) {
    customerFields.forEach(name => { form.elements[name].readOnly = false; });
    editCustomerData.dataset.editing = 'true';
    editCustomerData.textContent = 'حفظ التعديل';
    accountDataStatus.textContent = 'أكمل البيانات الناقصة مرة واحدة للمتابعة.';
  } else {
    accountDataStatus.textContent = 'تمت تعبئة بيانات الحساب تلقائيًا.';
  }
}

function readSavedCheckout() {
  try { return JSON.parse(sessionStorage.getItem('wujha_checkout') || 'null'); }
  catch { return null; }
}

'use strict';

// Standalone interactions for the supplied server-rendered Wujha page.
// Uses the same calculation factors and rounding as the supplied route bundle.
(() => {
  const factors = { 4: 0.626, 6: 0.606, 9: 0.58, 12: 0.55, 24: 0.48 };
  const state = { amount: 5500, payments: 4, firstPayment: 'customer' };
  const byId = id => document.getElementById(id);
  const format = value => value.toLocaleString('en-US');
  const money = value => `${format(value)} ر.س`;
  const amountInput = byId('amount');
  const amountDisplay = byId('amount-display');
  const transferDisplay = byId('transfer');
  const calculator = byId('calculator');
  const paymentButtons = [...calculator.querySelectorAll('[data-payments]')];
  const firstPaymentButtons = [...calculator.querySelectorAll('[data-first-payment]')];
  const common = 'h-12 rounded-full border-2 font-display text-base font-semibold transition-all ';
  const firstCommon = 'h-12 rounded-full border-2 text-sm font-semibold transition-all ';

  function update() {
    const unroundedPurchase = state.amount / factors[state.payments];
    const purchase = Math.round(unroundedPurchase);
    const installment = Math.round(unroundedPurchase / state.payments);
    const firstPayment = state.firstPayment === 'us' ? 0 : installment;
    const transfer = state.firstPayment === 'us' ? state.amount - installment : state.amount;
    amountDisplay.firstChild.textContent = format(state.amount);
    transferDisplay.firstChild.textContent = format(transfer);
    amountInput.setAttribute('aria-valuetext', money(state.amount));
    byId('purchase').textContent = money(purchase);
    byId('first-payment').textContent = money(firstPayment);
    byId('remaining').textContent = String(state.payments - 1);
    byId('installment').textContent = money(installment);
    byId('first-payment-label').textContent = `(${money(firstPayment)})`;
    byId('first-payment-description').textContent = state.firstPayment === 'us'
      ? 'نتحمّل نحن الدفعة الأولى' : 'تدفع أنت الدفعة الأولى';
    paymentButtons.forEach(button => {
      const selected = Number(button.dataset.payments) === state.payments;
      button.setAttribute('aria-pressed', String(selected));
      button.className = common + (selected
        ? 'border-primary bg-primary text-primary-foreground'
        : 'border-border bg-card text-foreground hover:border-primary/50');
    });
    firstPaymentButtons.forEach(button => {
      const selected = button.dataset.firstPayment === state.firstPayment;
      button.setAttribute('aria-pressed', String(selected));
      button.className = firstCommon + (selected
        ? 'border-mint bg-mint text-ink-foreground'
        : 'border-border text-muted-foreground hover:text-foreground');
    });
  }
  amountInput.addEventListener('input', () => {
    state.amount = Math.min(30000, Math.max(200, Number(amountInput.value)));
    update();
  });
  paymentButtons.forEach(button => button.addEventListener('click', () => {
    state.payments = Number(button.dataset.payments);
    update();
  }));
  firstPaymentButtons.forEach(button => button.addEventListener('click', () => {
    state.firstPayment = button.dataset.firstPayment;
    update();
  }));

  const faqButtons = [...document.querySelectorAll('#faq button[aria-controls]')];
  function toggleFaq(button, open) {
    const region = byId(button.getAttribute('aria-controls'));
    button.setAttribute('aria-expanded', String(open));
    region.hidden = !open;
    [button, button.parentElement, region, button.parentElement.parentElement].forEach(element => {
      element.dataset.state = open ? 'open' : 'closed';
    });
  }
  faqButtons.forEach(button => {
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      faqButtons.forEach(other => toggleFaq(other, other === button && open));
    });
  });
  update();
})();

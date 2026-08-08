// لا توجد بوابة دفع مفعلة في هذا الإصدار.
// يجب إنشاء جلسة الدفع والتحقق من Webhook داخل Supabase Edge Function أو خادم موثوق.
export async function createPayment() {
  throw new Error('الدفع والتقسيط غير متاحين حاليًا. سيظهر الخيار بعد اعتماد مزود مرخص وربطه من الخادم.');
}

export const supportedGateways = [];
export const providerStatus = 'not_connected';

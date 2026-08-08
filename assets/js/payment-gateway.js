// لا توجد بوابة دفع مفعلة في هذا الإصدار.
// يجب إنشاء جلسة الدفع والتحقق من Webhook داخل Supabase Edge Function أو خادم موثوق.
export async function createPayment() {
  throw new Error('الدفع الإلكتروني غير متاح حتى يتم ربط مزود دفع مرخص من الخادم.');
}

export const supportedGateways = [];

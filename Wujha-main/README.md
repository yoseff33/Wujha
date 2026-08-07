# وجهة — Wujha

منصة واجهات ثابتة عربية للوساطة والضمان التجاري والسوق المفتوح، تعمل مع Supabase فقط.

## التشغيل

شغّل المجلد عبر خادم ملفات ثابت (مثل GitHub Pages أو `npx serve`). أدخل رابط مشروع Supabase ومفتاح `anon` العام في `assets/js/supabase-client.js` أو خزّنهما مؤقتاً في `localStorage` بالمفتاحين `wujha_supabase_url` و`wujha_supabase_anon_key`.

نفّذ `supabase/schema.sql` مرة واحدة من SQL Editor. لا تضع مفتاح `service_role` في المتصفح.

## الدفع والإشعارات

`assets/js/payment-gateway.js` محاكاة تطويرية فقط وليس بوابة تحصيل حقيقية. قبل الإطلاق، يجب ربط مزود دفع مرخص عبر Edge Function آمنة والتحقق من Webhooks في الخادم. للإيميلات، اربط Database Webhook على إدراج `notifications` بـ Edge Function ومزود بريد.

لا توجد ملفات CSS خارجية؛ جميع صفحات النظام تستخدم Tailwind CDN. `index.html` محفوظ كما ورد في المصدر ولم يُعدّل.

// ============================================================
//  supabase-config.js
//  تهيئة عميل Supabase للمشروع
// ============================================================

// ===== بيانات مشروع Supabase (تم تحديثها) =====
const SUPABASE_URL = 'https://blnwohxbrundwiachkon.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsbndvaHhicnVuZHdpYWNoa29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxODc5ODUsImV4cCI6MjA5ODc2Mzk4NX0.4ffpJ_GcV51Znrt0mVz2VBWFI46HgxDcRE4SlAvk10Q';

// ===== التأكد من تحميل مكتبة Supabase =====
if (typeof window.supabase === 'undefined') {
    console.error('❌ مكتبة Supabase لم يتم تحميلها. تأكد من تضمين <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> قبل هذا الملف.');
}

// ===== إنشاء عميل Supabase =====
// نستخدم `window` لتجنب التعارض مع المتغيرات الأخرى
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== (اختياري) نسخة مختصرة للاستخدام السهل =====
// يمكنك استخدام `supabase` مباشرة إذا أردت، لكننا نفضل `window.supabaseClient` لتجنب التكرار
// window.supabase = window.supabaseClient; // أزل التعليق إذا أردت اختصاراً

console.log('✅ تم تهيئة Supabase بنجاح! (مشروع: blnwohxbrundwiachkon)');

// ===== تصدير العميل للاستخدام في الملفات الأخرى (في حالة استخدام ES modules) =====
// إذا كنت تستخدم `<script type="module">`، يمكنك إضافة السطر التالي:
// export { supabaseClient };
// لكن بما أننا نستخدم `<script>` عادي، فلا حاجة للتصدير.

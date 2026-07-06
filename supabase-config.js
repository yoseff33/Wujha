// ============================================================
//  supabase-config.js
//  تهيئة عميل Supabase للمشروع
// ============================================================

// ===== قم بتعديل القيمتين التاليتين حسب مشروعك =====
const SUPABASE_URL = 'https://your-project-id.supabase.co';   // استبدل برابط مشروعك
const SUPABASE_ANON_KEY = 'Sb_publishable_2EelYQXGS1MHv6Qyp7rhug_aEJj454B'; // المفتاح العام

// ===== التحقق من وجود المكتبة =====
if (typeof window.supabase === 'undefined') {
    console.error('مكتبة Supabase لم يتم تحميلها. تأكد من تضمين <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
}

// ===== إنشاء عميل Supabase =====
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== تصدير العميل للاستخدام في الملفات الأخرى =====
// (ملاحظة: في بيئة المتصفح، المتغير العام `supabase` متاح الآن)
// يمكنك أيضاً تعريضه على window للوصول الشامل
window.supabaseClient = supabase;

console.log('✅ تم تهيئة Supabase بنجاح!');

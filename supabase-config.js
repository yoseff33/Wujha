// ============================================================
//  supabase-config.js
//  تهيئة عميل Supabase للمشروع
// ============================================================

// ===== قم بتعديل القيمتين التاليتين حسب مشروعك =====
const SUPABASE_URL = 'https://blnwohxbrundwiachkon.supabase.co';   // استبدل برابط مشروعك
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsbndvaHhicnVuZHdpYWNoa29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxODc5ODUsImV4cCI6MjA5ODc2Mzk4NX0.4ffpJ_GcV51Znrt0mVz2VBWFI46HgxDcRE4SlAvk10Q'; // المفتاح العام

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

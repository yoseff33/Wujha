const A = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const money = n => new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(n || 0);
const base = document.body.dataset.base || '';

// دالة تنظيف وتنسيق رقم الجوال للصيغة الدولية +966 عند التسجيل
const formatSAPhone = (phone) => {
  if (!phone) return '';
  let cleaned = phone.trim().replace(/[^\d+]/g, '');
  if (cleaned.startsWith('05')) {
    return '+966' + cleaned.substring(1);
  } else if (cleaned.startsWith('5')) {
    return '+966' + cleaned;
  } else if (cleaned.startsWith('966')) {
    return '+' + cleaned;
  } else if (!cleaned.startsWith('+')) {
    return '+' + cleaned;
  }
  return cleaned;
};

const pages = {
login: `<section class="mx-auto max-w-md ${A} p-7"><p class="text-sm font-bold text-emerald-700">مرحباً بعودتك</p><h1 class="mt-2 text-3xl font-black">تسجيل الدخول</h1><form id="loginForm" class="mt-7 space-y-4"><label class="block text-sm font-bold">البريد الإلكتروني<input name="email" type="email" dir="ltr" required placeholder="example@domain.com" class="mt-2 w-full rounded-xl border p-3"></label><label class="block text-sm font-bold">كلمة المرور<input name="password" type="password" required class="mt-2 w-full rounded-xl border p-3"></label><button type="submit" class="w-full rounded-xl bg-emerald-700 p-3 font-bold text-white">دخول آمن</button><p id="formMessage" class="text-sm font-bold"></p></form><p class="mt-5 text-center text-sm">ليس لديك حساب؟ <a class="font-bold text-emerald-700" href="${base}register/">أنشئ حساباً</a></p></section>`,

register: `<section class="mx-auto max-w-xl ${A} p-7"><p class="text-sm font-bold text-emerald-700">انضم إلى وجهة</p><h1 class="mt-2 text-3xl font-black">إنشاء حساب موثّق</h1><form id="registerForm" class="mt-7 grid gap-4 sm:grid-cols-2"><label class="text-sm font-bold">الاسم الكامل<input name="name" required class="mt-2 w-full rounded-xl border p-3"></label><label class="text-sm font-bold">البريد الإلكتروني<input name="email" type="email" dir="ltr" required placeholder="example@domain.com" class="mt-2 w-full rounded-xl border p-3"></label><label class="text-sm font-bold">الجوال<input name="phone" dir="ltr" required placeholder="+9665xxxxxxxx" class="mt-2 w-full rounded-xl border p-3"></label><label class="text-sm font-bold">نوع الحساب<select name="userType" id="userType" class="mt-2 w-full rounded-xl border p-3"><option value="buyer">مشتري</option><option value="seller">بائع / تاجر</option><option value="admin">أدمن (بدعوة فقط)</option></select></label><label id="crField" class="hidden text-sm font-bold sm:col-span-2">رقم السجل التجاري<input name="commercialRegister" class="mt-2 w-full rounded-xl border p-3"></label><label class="text-sm font-bold sm:col-span-2">كلمة المرور<input name="password" type="password" minlength="8" required class="mt-2 w-full rounded-xl border p-3"></label><button type="submit" class="rounded-xl bg-emerald-700 p-3 font-bold text-white sm:col-span-2">إنشاء الحساب</button><p id="formMessage" class="text-sm font-bold sm:col-span-2"></p></form></section>`,

marketplace: `<div class="flex flex-wrap items-end justify-between gap-4"><div><p class="font-bold text-emerald-700">سوق وجهة المفتوح</p><h1 class="text-3xl font-black">تسوّق بثقة، وادفع بضمان</h1></div><a href="${base}create-deal/" class="rounded-xl bg-amber-400 px-5 py-3 font-black">+ أضف إعلانك في السوق</a></div><section class="mt-6 ${A} p-4"><div class="grid gap-3 md:grid-cols-[1fr_auto]"><input id="marketSearch" placeholder="ابحث بكلمة أو رقم الهيكل VIN" class="rounded-xl border p-3"><div id="filters" class="flex flex-wrap gap-2">${['الكل','قطع غيار','أجهزة وإلكترونيات','أثاث منزلي','خدمات تقنية وتسويق'].map((x,i)=>`<button data-filter="${x}" class="rounded-full px-4 py-2 text-sm font-bold ${i?'bg-slate-100':'bg-emerald-700 text-white'}">${x}</button>`).join('')}</div></div></section><div id="productGrid" class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"></div>`,

createDeal: `<div class="mx-auto max-w-3xl"><p class="font-bold text-emerald-700">صفقة جديدة</p><h1 class="text-3xl font-black">أنشئ معاملتك الآمنة</h1><div class="mt-5 flex gap-2">${[1,2,3,4,5,6].map(n=>`<span class="step-dot h-2 flex-1 rounded-full ${n===1?'bg-emerald-700':'bg-slate-200'}"></span>`).join('')}</div><form id="dealWizard" class="mt-6 ${A} p-7"><div data-step="1"><h2 class="text-xl font-black">ما دورك في الصفقة؟</h2><div class="mt-4 grid gap-3 sm:grid-cols-2"><label class="cursor-pointer rounded-xl border p-4"><input type="radio" name="role" value="seller" required> بائع / مقدم خدمة</label><label class="cursor-pointer rounded-xl border p-4"><input type="radio" name="role" value="buyer"> مشتري</label></div></div><div data-step="2" class="hidden"><h2 class="text-xl font-black">رابط الإعلان الخارجي (اختياري)</h2><input name="external_url" type="url" placeholder="https://haraj.com.sa/..." class="mt-4 w-full rounded-xl border p-3"><p class="mt-2 text-xs text-slate-500">سيُستخدم لجلب التفاصيل بعد ربط خدمة الاستخراج المصرّح بها.</p></div><div data-step="3" class="hidden"><h2 class="text-xl font-black">التصنيف المعتمد</h2><select name="category" class="mt-4 w-full rounded-xl border p-3"><option value="قطع غيار السيارات والنقل الثقيل">قطع غيار السيارات والنقل الثقيل</option><option value="أجهزة وإلكترونيات وهواتف">أجهزة وإلكترونيات وهواتف</option><option value="أثاث منزلي">أثاث منزلي</option><option value="خدمات تقنية وتسويقية نيابة عن الغير">خدمات تقنية وتسويقية نيابة عن الغير</option></select></div><div data-step="4" class="hidden space-y-4"><h2 class="text-xl font-black">القيمة وشروط المعاينة</h2><input name="deal_price" type="number" min="1" required placeholder="قيمة المعاملة ر.س" class="w-full rounded-xl border p-3"><select name="fee_bearer" class="w-full rounded-xl border p-3"><option value="buyer">المشتري يتحمل الرسوم</option><option value="seller">البائع يتحمل الرسوم</option><option value="split">مناصفة</option></select><select name="inspection_days" class="w-full rounded-xl border p-3"><option value="1">24 ساعة</option><option value="2">48 ساعة</option><option value="3">3 أيام</option><option value="7">7 أيام</option></select></div><div data-step="5" class="hidden"><h2 class="text-xl font-black">خيارات التقسيط</h2><label class="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-4"><span>إتاحة تابي وتمارا</span><input name="installments" type="checkbox" class="h-6 w-6 accent-emerald-700"></label></div><div data-step="6" class="hidden text-center"><div class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-700">✓</div><h2 class="mt-4 text-2xl font-black">صفقتك جاهزة للمشاركة</h2><p id="dealSummary" class="mt-2 text-slate-600"></p><div class="mt-5 flex flex-wrap justify-center gap-3"><a id="waShare" target="_blank" class="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white">مشاركة عبر WhatsApp</a><button id="copyDeal" type="button" class="rounded-xl border px-5 py-3 font-bold">نسخ الرابط</button></div></div><div id="wizardActions" class="mt-7 flex justify-between"><button type="button" id="prevStep" class="invisible rounded-xl border px-5 py-2">السابق</button><button type="button" id="nextStep" class="rounded-xl bg-emerald-700 px-5 py-2 font-bold text-white">التالي</button></div></form></div>`,

dealView: `<div class="flex flex-wrap items-end justify-between gap-3"><div><p class="font-bold text-emerald-700">الصفقة #WJH-24081</p><h1 class="text-3xl font-black">مراجعة واعتماد المعاملة</h1></div><span class="rounded-full bg-amber-100 px-4 py-2 font-bold text-amber-800">بانتظار الإيداع</span></div><div class="mt-6 grid gap-5 lg:grid-cols-[1.4fr_.6fr]"><section class="${A} p-6"><h2 class="text-xl font-black">مسار حماية المبلغ</h2><div class="mt-5 grid gap-3 sm:grid-cols-5">${['بانتظار الإيداع','تم حجز المبلغ','قيد المعاينة والفحص','تم تحويل المبلغ للبائع','يوجد اعتراض'].map((x,i)=>`<div class="rounded-xl ${i?'bg-slate-50':'bg-emerald-50 text-emerald-800'} p-3 text-center text-xs font-bold">${x}</div>`).join('')}</div><h2 class="mt-7 text-xl font-black">التفاصيل المالية</h2><dl class="mt-4 divide-y rounded-xl border px-4"><div class="flex justify-between py-3"><dt>قيمة السلعة</dt><dd>${money(1000)}</dd></div><div class="flex justify-between py-3"><dt>رسوم وجهة (2.5%، حد أدنى 50)</dt><dd>${money(50)}</dd></div><div class="flex justify-between py-3"><dt>ضريبة 15% على الرسوم</dt><dd>${money(7.5)}</dd></div><div class="flex justify-between py-3 text-lg font-black"><dt>الإجمالي</dt><dd>${money(1057.5)}</dd></div></dl></section><aside class="${A} p-6"><p class="text-sm text-slate-500">مهلة المعاينة المتبقية</p><div id="countdown" data-deadline="${new Date(Date.now()+86400000).toISOString()}" class="my-4 text-center text-3xl font-black text-emerald-700">--:--:--</div><p class="text-xs text-slate-500">لا يتاح تحرير المبلغ قبل مرور 24 ساعة على الأقل من التأكيد.</p><div class="mt-5 space-y-3"><button class="w-full rounded-xl bg-emerald-700 p-3 font-bold text-white">سداد المبلغ لحساب الضمان</button><button disabled class="w-full rounded-xl bg-slate-200 p-3 font-bold text-slate-500">تأكيد الاستلام وتحرير المبلغ</button><a href="${base}dispute-center/" class="block w-full rounded-xl border border-red-200 p-3 text-center font-bold text-red-700">فتح نزاع / اعتراض</a></div></aside></div>`,

buyer: dashboard('لوحة المشتري','صفقاتك وطلباتك المحمية',[['الصفقات النشطة','3'],['الطلبات','7'],['الفواتير','12'],['مبالغ تحت الضمان','8,420 ر.س']],['صفقة قطع غيار #WJH-24081','طلب هاتف #WJH-24072']),
seller: dashboard('لوحة البائع','أدر عروضك وتحصيلاتك',[['العروض النشطة','18'],['طلبات البيع','6'],['جاهز للتحويل','12,650 ر.س'],['التقييم','4.9 / 5']],['طلب جديد: شاشة سيارة','طلب تحرير أموال إلى حساب IBAN']),
admin: dashboard('لوحة الإدارة','رقابة تشغيلية وصلاحيات حصرية',[['إجمالي الصفقات','1,284'],['قيمة الضمان','2.4 م ر.س'],['نزاعات مفتوحة','9'],['مستخدمون موثقون','3,610']],['إدارة الصفقات','مركز النزاعات','إدارة المستخدمين','إعداد الرسوم: 2.5% / حد أدنى 50 ر.س']),

dispute: `<div><p class="font-bold text-red-700">مركز النزاعات</p><h1 class="text-3xl font-black">اعتراض الصفقة #WJH-24081</h1></div><div class="mt-6 grid gap-5 lg:grid-cols-2"><section class="${A} p-6"><h2 class="text-xl font-black">رفع الأدلة خلال 48 ساعة</h2><label class="mt-4 grid min-h-40 cursor-pointer place-items-center rounded-xl border-2 border-dashed p-5 text-center"><span>صور أو PDF — بحد أقصى 10MB</span><input type="file" multiple accept="image/*,.pdf" class="hidden"></label><textarea class="mt-4 w-full rounded-xl border p-3" rows="4" placeholder="اشرح سبب الاعتراض بوضوح"></textarea><button class="mt-3 rounded-xl bg-red-700 px-5 py-3 font-bold text-white">إرسال الاعتراض</button></section><section class="${A} p-6"><h2 class="text-xl font-black">قرار التحكيم</h2><div class="mt-4 rounded-xl bg-amber-50 p-5"><p class="font-bold text-amber-800">قيد المراجعة</p><p class="mt-2 text-sm text-slate-600">سيراجع فريق وجهة أدلة الطرفين ويصدر القرار النهائي الموثق هنا.</p></div><ol class="mt-5 space-y-4 text-sm"><li>✓ فُتح النزاع</li><li>○ استلام أدلة الطرف الآخر</li><li>○ قرار الأدمن النهائي</li></ol></section></div>`,

invoice: `<section class="mx-auto max-w-3xl ${A} p-8 print:border-0 print:shadow-none"><div class="flex justify-between gap-5 border-b pb-6"><div><p class="text-2xl font-black text-emerald-800">وجهة</p><p class="mt-2 max-w-md text-sm">مؤسسة يوسف عيد المطيري لقطع غيار السيارات والخدمات التجارية</p><p class="text-sm">السجل التجاري: 7054534024</p></div><div class="text-left"><h1 class="text-2xl font-black">فاتورة ضريبية</h1><p>INV-2026-000184</p><p>الحالة: مكتملة</p></div></div><div class="my-6 grid gap-4 sm:grid-cols-2"><div><p class="text-sm text-slate-500">المشتري</p><p class="font-bold">اسم العميل</p></div><div><p class="text-sm text-slate-500">تاريخ الإصدار</p><p class="font-bold">07/08/2026</p></div></div><table class="w-full text-right"><thead class="bg-slate-50"><tr><th class="p-3">البيان</th><th class="p-3">المبلغ</th></tr></thead><tbody class="divide-y"><tr><td class="p-3">قيمة السلعة</td><td class="p-3">1,000.00 ر.س</td></tr><tr><td class="p-3">رسوم الوساطة والضمان 2.5%</td><td class="p-3">25.00 ر.س</td></tr><tr><td class="p-3">ضريبة القيمة المضافة 15% على الرسوم</td><td class="p-3">3.75 ر.س</td></tr><tr class="text-lg font-black"><td class="p-3">الإجمالي المدفوع</td><td class="p-3">1,028.75 ر.س</td></tr></tbody></table><p class="mt-6 text-xs text-slate-500">هذه الفاتورة تخص رسوم الوساطة والضمان، ولا تعني أن المؤسسة بائع السلعة. للتصديق: +966555264930</p><button onclick="window.print()" class="mt-6 rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white print:hidden">طباعة الفاتورة</button></section>`,

profile: `<div><p class="font-bold text-emerald-700">الحساب</p><h1 class="text-3xl font-black">الملف الشخصي والتوثيق</h1></div><form class="mt-6 grid gap-5 ${A} p-6 sm:grid-cols-2">${['الاسم الكامل','رقم الجوال','البريد الإلكتروني','رقم الهوية الوطنية','رقم السجل التجاري','الحساب البنكي IBAN'].map((x,i)=>`<label class="text-sm font-bold ${i===5?'sm:col-span-2':''}">${x}<input ${i===5?'dir="ltr"':''} class="mt-2 w-full rounded-xl border p-3"></label>`).join('')}<button type="submit" class="rounded-xl bg-emerald-700 p-3 font-bold text-white sm:col-span-2">حفظ البيانات</button></form>`,

privacy: legal('سياسة الخصوصية',[['البيانات التي نجمعها','بيانات الهوية والتواصل والتوثيق والسجل التجاري والحساب البنكي وبيانات المعاملات والمرفقات اللازمة لتقديم الخدمة.'],['أغراض المعالجة','إنشاء الحساب، تنفيذ الوساطة والضمان، مكافحة الاحتيال، الامتثال، وإرسال الإشعارات التشغيلية.'],['المشاركة والحفظ','لا نشارك البيانات إلا مع مزودي الدفع والجهات النظامية ومقدمي الخدمة بالقدر اللازم، ونحتفظ بها وفق الالتزامات النظامية.'],['حقوقك','يمكنك طلب الوصول أو التصحيح أو الاستفسار عبر الرقم الرسمي +966555264930.']]),

terms: legal('شروط الاستخدام',[['نطاق المنصة','وجهة وسيط تقني وتجاري وليست مالكة للسلع المعروضة، ويتحمل المعلن مسؤولية صحة وصفه وملكيته.'],['الحسابات','يلتزم المستخدم بتقديم بيانات صحيحة وحماية بيانات الدخول، ويخضع حساب الأدمن لصلاحية داخلية فقط.'],['الرسوم','رسوم الوساطة 2.5% بحد أدنى 50 ر.س ما لم تظهر شروط خاصة قبل اعتماد الصفقة، وتطبق الضريبة على الرسوم فقط.'],['الممنوعات','يحظر عرض السلع غير النظامية أو التحايل على الضمان أو تقديم مستندات مضللة.']]),

escrow: legal('اتفاقية الوساطة والضمان',[['حجز المبلغ','يودع المشتري المبلغ لدى مسار الدفع المخصص للصفقة ويبقى محجوزاً حتى تحقق شروط التحرير.'],['المعاينة والاستلام','تبدأ المهلة بعد تأكيد التسليم، ولا يتاح تأكيد الاستلام قبل مرور 24 ساعة، وتمتد المهلة المتفق عليها حتى 7 أيام.'],['النزاعات','يجوز فتح اعتراض وإرفاق الأدلة خلال 48 ساعة، ويجوز للأدمن رد المبلغ أو تحريره أو تقسيمه وفق الأدلة.'],['الإخلاء والاعتماد','اعتماد الصفقة إلكترونياً موافقة على هذه الاتفاقية وعلى احتساب الرسوم والضريبة المبينة قبل الدفع.']])
};

function dashboard(title, sub, stats, items){return `<div class="flex flex-wrap justify-between gap-3"><div><p class="font-bold text-emerald-700">${sub}</p><h1 class="text-3xl font-black">${title}</h1></div><a href="${base}create-deal/" class="rounded-xl bg-amber-400 px-5 py-3 font-black">+ إنشاء صفقة</a></div><div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">${stats.map(s=>`<div class="${A} p-5"><p class="text-sm text-slate-500">${s[0]}</p><p class="mt-2 text-2xl font-black">${s[1]}</p></div>`).join('')}</div><section class="mt-6 ${A} p-6"><h2 class="text-xl font-black">آخر النشاطات</h2><div class="mt-4 divide-y">${items.map(x=>`<div class="flex items-center justify-between py-4"><span>${x}</span><button class="font-bold text-emerald-700">عرض</button></div>`).join('')}</div></section>`}
function legal(title, sections){return `<article class="mx-auto max-w-4xl ${A} p-8"><p class="font-bold text-emerald-700">آخر تحديث: 07 أغسطس 2026</p><h1 class="mt-2 text-3xl font-black">${title}</h1><div class="mt-7 space-y-7">${sections.map((s,i)=>`<section><h2 class="text-xl font-black">${i+1}. ${s[0]}</h2><p class="mt-2 leading-8 text-slate-600">${s[1]}</p></section>`).join('')}</div><div class="mt-8 rounded-xl bg-slate-50 p-4 text-sm">الجهة المشغلة: مؤسسة يوسف عيد المطيري لقطع غيار السيارات والخدمات التجارية — س.ت 7054534024</div></article>`}

function shell(content){return `<header class="border-b bg-white"><nav class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4"><a href="${base}" class="text-2xl font-black text-emerald-800">وجهة<span class="text-amber-500">.</span></a><div class="hidden items-center gap-5 text-sm font-bold md:flex"><a href="${base}marketplace/">السوق</a><a href="${base}create-deal/">إنشاء صفقة</a><a href="${base}dashboard-buyer/">صفقاتي</a><a href="${base}profile/">حسابي</a></div><a href="${base}login/" class="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white">دخول</a></nav></header><main class="mx-auto min-h-[75vh] max-w-7xl px-5 py-10">${content}</main><footer class="mt-10 bg-slate-950 text-slate-300"><div class="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:grid-cols-3"><div><p class="text-xl font-black text-white">وجهة</p><p class="mt-2 text-sm">وساطة وضمان تجاري وسوق مفتوح سعودي.</p></div><div class="text-sm"><p>مؤسسة يوسف عيد المطيري لقطع غيار السيارات والخدمات التجارية</p><p>س.ت: 7054534024</p><a dir="ltr" href="https://wa.me/966555264930">+966555264930</a></div><div class="flex flex-col text-sm"><a href="${base}privacy-policy/">سياسة الخصوصية</a><a href="${base}terms-of-use/">شروط الاستخدام</a><a href="${base}escrow-agreement/">اتفاقية الوساطة والضمان</a></div></div></footer>`}

const page = document.body.dataset.page;
const appEl = document.getElementById('app');
if (appEl) {
  appEl.innerHTML = shell(pages[page] || '<h1 class="text-center text-2xl font-bold">الصفحة غير موجودة</h1>');
}

if(page==='marketplace') initMarket();
if(page==='createDeal') initWizard();
if(page==='dealView') initCountdown();
if(page==='register') {
  const userTypeEl = document.getElementById('userType');
  if (userTypeEl) {
    userTypeEl.addEventListener('change', e => {
      document.getElementById('crField').classList.toggle('hidden', e.target.value !== 'seller');
    });
  }
}

function initMarket(){
  const products=[
    ['كمبروسر مكيف تويوتا أصلي','قطع غيار','1,850','الرياض','https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=900'],
    ['هاتف ذكي بحالة ممتازة','أجهزة وإلكترونيات','2,400','جدة','https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900'],
    ['طقم كنب مودرن','أثاث منزلي','3,200','الدمام','https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900'],
    ['تصميم متجر إلكتروني','خدمات تقنية وتسويق','4,500','عن بُعد','https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900']
  ];
  const grid=document.getElementById('productGrid');
  let filter='الكل';
  
  const render=()=>{
    const searchEl = document.getElementById('marketSearch');
    const q = searchEl ? searchEl.value.trim() : '';
    grid.innerHTML = products.filter(p=>(filter==='الكل'||p[1]===filter)&&(!q||p.join(' ').includes(q))).map(p=>`<article class="overflow-hidden ${A}"><img class="h-48 w-full object-cover" src="${p[4]}" alt="${p[0]}"><div class="p-5"><span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">✓ مشمول بضمان وجهة</span><h2 class="mt-3 text-lg font-black">${p[0]}</h2><p class="mt-1 text-sm text-slate-500">${p[1]} · ${p[3]}</p><p class="mt-3 text-xl font-black">${p[2]} ر.س</p><a href="${base}create-deal/" class="mt-4 block rounded-xl bg-emerald-700 p-3 text-center font-bold text-white">شراء بضمان المنصة</a></div></article>`).join('')||'<p class="col-span-full text-center text-slate-500">لا توجد نتائج مطابقة.</p>';
  };
  
  render();
  document.getElementById('marketSearch').oninput=render;
  document.getElementById('filters').onclick=e=>{
    if(!e.target.dataset.filter)return;
    filter=e.target.dataset.filter;
    [...e.currentTarget.children].forEach(b=>b.className='rounded-full bg-slate-100 px-4 py-2 text-sm font-bold');
    e.target.className='rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white';
    render();
  };
}

function initWizard(){
  let step=1;
  const form=document.getElementById('dealWizard');
  if(!form) return;

  const show=()=>{
    form.querySelectorAll('[data-step]').forEach(x=>x.classList.toggle('hidden',+x.dataset.step!==step));
    document.querySelectorAll('.step-dot').forEach((x,i)=>x.className=`step-dot h-2 flex-1 rounded-full ${i<step?'bg-emerald-700':'bg-slate-200'}`);
    document.getElementById('prevStep').classList.toggle('invisible',step===1);
    document.getElementById('wizardActions').classList.toggle('hidden',step===6);
  };

  document.getElementById('nextStep').onclick=()=>{
    const currentStepEl = form.querySelector(`[data-step="${step}"]`);
    const inputs = currentStepEl.querySelectorAll('input[required], select[required]');
    let valid = true;
    inputs.forEach(input => {
      if(!input.checkValidity()){
        input.reportValidity();
        valid = false;
      }
    });
    if(!valid) return;

    if(step < 5){
      step++;
      show();
      return;
    }

    const formData = new FormData(form);
    const price = parseFloat(formData.get('deal_price')) || 0;
    const fee = Math.max(price * 0.025, 50);
    const vat = fee * 0.15;
    const id = `WJH-${Date.now().toString().slice(-8)}`;
    const url = new URL(`${base}deal-view/?id=${id}`, location.href).href;

    document.getElementById('dealSummary').textContent = `القيمة ${money(price)} — الرسوم والضريبة ${money(fee + vat)}`;
    document.getElementById('waShare').href = `https://wa.me/?text=${encodeURIComponent('راجع صفقة وجهة الآمنة: ' + url)}`;
    
    document.getElementById('copyDeal').onclick = () => {
      navigator.clipboard.writeText(url);
      alert('تم نسخ رابط الصفقة');
    };

    step = 6;
    show();
  };

  document.getElementById('prevStep').onclick=()=>{
    step = Math.max(1, step - 1);
    show();
  };
}

function initCountdown(){
  const el=document.getElementById('countdown');
  if(!el) return;
  const deadline=new Date(el.dataset.deadline);

  const update = () => {
    const d=Math.max(0, deadline - Date.now());
    const h=Math.floor(d / 36e5);
    const m=Math.floor((d % 36e5) / 6e4);
    const s=Math.floor((d % 6e4) / 1000);
    el.textContent=[h,m,s].map(x=>String(x).padStart(2,'0')).join(':');
  };

  update();
  setInterval(update, 1000);
}

document.addEventListener('submit', async e => {
  if (!['loginForm', 'registerForm'].includes(e.target.id)) return;
  e.preventDefault();

  const msg = document.getElementById('formMessage');
  msg.className = 'text-sm font-bold text-slate-600';
  msg.textContent = 'جارٍ التحقق...';

  try {
    const api = await import('./supabase-client.js');
    const fd = Object.fromEntries(new FormData(e.target));
    
    // تنسيق رقم الجوال عند إنشاء حساب جديد فقط
    if (fd.phone) {
      fd.phone = formatSAPhone(fd.phone);
    }

    const result = e.target.id === 'loginForm' 
      ? await api.signIn(fd.email, fd.password) 
      : await api.signUp(fd);

    if (result.error) throw result.error;

    msg.className = 'text-sm font-bold text-emerald-700';
    msg.textContent = e.target.id === 'loginForm' ? 'تم الدخول بنجاح.' : 'تم إنشاء الحساب؛ تحقق من البريد إن وُجد.';
  } catch (err) {
    msg.className = 'text-sm font-bold text-red-700';
    msg.textContent = err.message || 'تعذر إتمام العملية.';
  }
});

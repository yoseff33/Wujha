export const LEAD_STATUS={new:'جديد',contacted:'تم التواصل',waiting:'بانتظار العميل',completed:'مكتمل',closed:'مغلق',do_not_contact:'لا يرغب بالتواصل'};
export const REQUEST_TYPES={product:'تقسيط منتج',cash:'استفسار سيولة',general:'استفسار عام'};
export const PROVIDERS={tabby:'تابي',tamara:'تمارا',quara:'كوارا',emkan:'إمكان',tamam:'تمام'};
export function normalizePhone(value){let p=String(value||'').replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[^0-9]/g,'');if(p.startsWith('00966'))p=p.slice(2);if(p.startsWith('05'))p='966'+p.slice(1);else if(/^5\d{8}$/.test(p))p='966'+p;return /^9665\d{8}$/.test(p)?p:'';}
export const MESSAGE_TEMPLATES={
 welcome:{title:'ترحيب واستلام الطلب',text:'هلا {name}، معك فريق وجهة. وصلنا طلبك بخصوص {service}{provider}، ويسعدنا نوضح لك الخطوات والخيارات المتاحة. يناسبك نتواصل معك الآن؟'},
 followup:{title:'متابعة الطلب',text:'هلا {name}، حابين نتابع معك طلب {service}{provider} عند وجهة. إذا ما زلت مهتم، رد علينا ونكمل معك التفاصيل.'},
 details:{title:'استكمال التفاصيل',text:'حياك {name}، بخصوص طلبك لدى وجهة عن {service}{provider}، نحتاج نراجع معك بعض تفاصيل الطلب. تقدر توضح لنا وش تحتاج؟ لا ترسل أرقام بطاقات أو كلمات مرور أو رموز تحقق.'},
 closing:{title:'إغلاق المتابعة',text:'هلا {name}، معك فريق وجهة. نود نتأكد إذا تحتاج مساعدة إضافية بخصوص {service}. إذا ما عاد تحتاج المتابعة، بلغنا ونوقف التواصل معك. شاكرين لك.'}
};
export function draftMessage(lead,key){const t=MESSAGE_TEMPLATES[key]||MESSAGE_TEMPLATES.welcome;return t.text.replaceAll('{name}',lead.name||'عميلنا').replaceAll('{service}',REQUEST_TYPES[lead.request_type]||REQUEST_TYPES.general).replaceAll('{provider}',lead.provider?' عبر '+(PROVIDERS[lead.provider]||lead.provider):'');}
export function whatsappLink(lead,text){const phone=normalizePhone(lead.phone);if(!phone||!lead.contact_consent||lead.status==='do_not_contact')return '';return 'https://wa.me/'+phone+'?text='+encodeURIComponent(text);}

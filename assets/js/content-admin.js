import { supabase } from './cms-client.js';
import {mountLeadsAdmin} from './leads-admin.js';
import {mountBlocksEditor, syncBlockImages} from './content-blocks-admin.js';
const $ = s => document.querySelector(s);
const table = () => supabase.from('wujha_cms_content');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pages = {'/':'الرئيسية','/services/':'الخدمات','/tamara/':'تمارا','/quara/':'كوارا','/emkan/':'إمكان','/tamam/':'تمام','/blog/':'المدونة','/faq/':'الأسئلة الشائعة','/about/':'من نحن','/contact/':'تواصل معنا'};
let rows = [], active = false;
const message = (text, error = false) => { $('#status').textContent = text; $('#status').classList.toggle('error', error); };
const safeImage = value => { try {const u=new URL(value);return u.protocol==='https:'?u.href:'';} catch{return '';} };
function check(result) { if (result.error) throw result.error; return result.data; }
async function save(row) { return check(await table().upsert({...row, updated_at:new Date().toISOString()}, {onConflict:'kind,slug'}).select().single()); }
async function run(form, fn) {
  const buttons = [...form.querySelectorAll('button')]; buttons.forEach(b => b.disabled = true);
  message('جارٍ حفظ التعديلات…');
  try { await fn(); await load(); message('تم الحفظ بنجاح.'); }
  catch (error) { message(error.message || 'تعذر الحفظ، حاول مرة أخرى.', true); }
  finally {buttons.forEach(b => b.disabled = false);}
}
function fill(form, data) { for (const [key,value] of Object.entries(data)) {const input=form.elements.namedItem(key);if(input) {if(input.type==='checkbox')input.checked=!!value;else input.value=value??'';}} }
function imageOptions() {
  const images=rows.filter(r=>r.kind==='image');
  for(const input of [$('#settingsForm').elements.hero_image,$('#seoForm').elements.image]) {
    const value=input.value;
    input.replaceChildren(new Option('الصورة الأصلية / التصميم الحالي',''));
    images.forEach(r=>input.add(new Option(r.data.title,r.data.url)));
    input.value=value;
  }
}
function loadSeo() {const form=$('#seoForm'),row=rows.find(r=>r.kind==='seo'&&r.slug===form.elements.slug.value);fill(form,{title:'',description:'',image:'',...(row?.data||{})});preview();}
function preview() {const f=$('#seoForm').elements;$('#seoPreview').innerHTML=`<small>https://wujha.shop${esc(f.slug.value)}</small><h3>${esc(f.title.value||'عنوان الصفحة')}</h3><p>${esc(f.description.value||'وصف الصفحة كما سيظهر بشكل تقريبي في البحث.')}</p>`;}
async function load() {
  rows=check(await table().select('*').order('sort_order').order('updated_at',{ascending:false}))||[];
  updateBlocks(rows);
  imageOptions();
  const settings=rows.find(r=>r.kind==='settings'&&r.slug==='home');
  fill($('#settingsForm'),settings?.data||{served_count:0,completed_count:0,years_count:0,show_stats:false});
  $('#imageList').innerHTML=rows.filter(r=>r.kind==='image').map(r=>`<article><img src="${esc(safeImage(r.data.url))}" alt="${esc(r.data.alt)}"><h3>${esc(r.data.title)}</h3><p>${esc(r.data.alt)}</p><small>${r.published?'منشورة في المعرض':'في المكتبة فقط'}</small><footer><button data-action="edit-image" data-id="${r.id}">تعديل</button><button data-action="toggle" data-id="${r.id}" class="secondary">${r.published?'إخفاء':'نشر'}</button><button data-action="remove" data-id="${r.id}" class="danger">حذف من المكتبة</button></footer></article>`).join('')||'<p>ارفع أول صورة لموقعك.</p>';
  $('#reviewList').innerHTML=rows.filter(r=>r.kind==='review').map(r=>`<article><h3>${esc(r.data.name)}</h3><span>${esc(r.data.rating)} / 5</span><p>${esc(r.data.text)}</p><small>${r.published?'منشور':'مسودة'}</small><footer><button data-action="edit-review" data-id="${r.id}">تعديل</button><button data-action="toggle" data-id="${r.id}" class="secondary">${r.published?'إخفاء':'نشر'}</button><button data-action="remove" data-id="${r.id}" class="danger">حذف</button></footer></article>`).join('')||'<p>لا توجد تقييمات بعد.</p>';
  loadSeo();
}
async function init() {
  try {
    const session=check(await supabase.auth.getSession())?.session;
    $('#logout').hidden=!session;
    if(!session){$('#login').hidden=false;message('سجّل الدخول لإدارة المحتوى.');return;}
    const allowed=check(await supabase.rpc('wujha_is_cms_admin'));
    if(!allowed){message('حسابك غير مخوّل لإدارة المحتوى. أضف معرف الحساب إلى wujha_cms_admins من SQL Editor.',true);return;}
    await load(); active=true;$('#login').hidden=true;$('#dashboard').hidden=false;message('متصل بـ Supabase. المحتوى جاهز للإدارة.');
  } catch(error) { message('تعذر فتح اللوحة: '+error.message+' — عند الإعداد لأول مرة نفّذ supabase/content-cms.sql في SQL Editor.',true); }
}
$('#loginForm').onsubmit=async e=>{e.preventDefault();await run(e.target,async()=>{const f=new FormData(e.target);check(await supabase.auth.signInWithPassword({email:f.get('email').trim(),password:f.get('password')}));location.reload();});};
$('#logout').onclick=async()=>{try{check(await supabase.auth.signOut());location.reload();}catch(e){message(e.message,true);}};
$('.tabs').onclick=e=>{const button=e.target.closest('[data-tab]');if(!button)return;document.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==button.dataset.tab);document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));};
$('#settingsForm').onsubmit=e=>{e.preventDefault();run(e.target,async()=>{const raw=Object.fromEntries(new FormData(e.target));for(const name of ['served_count','completed_count','years_count']){raw[name]=Number(raw[name]);if(!Number.isSafeInteger(raw[name])||raw[name]<0)throw Error('الأرقام يجب أن تكون أعدادًا صحيحة موجبة أو صفرًا.');}raw.show_stats=e.target.elements.show_stats.checked;await save({kind:'settings',slug:'home',data:raw,published:true});});};
const imageId=document.createElement('input');imageId.type='hidden';imageId.name='id';$('#imageForm').append(imageId);
$('#imageForm').onsubmit=e=>{e.preventDefault();run(e.target,async()=>{
  const raw=Object.fromEntries(new FormData(e.target)),old=rows.find(r=>r.id===raw.id),file=e.target.elements.file.files[0];let url=old?.data.url;
  if(file){if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8388608)throw Error('اختر صورة JPG أو PNG أو WebP بحجم حتى 8MB.');const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type],path=`images/${crypto.randomUUID()}.${ext}`;check(await supabase.storage.from('wujha-content').upload(path,file,{contentType:file.type}));url=supabase.storage.from('wujha-content').getPublicUrl(path).data.publicUrl;}
  if(!url)throw Error('اختر صورة أولًا.');
  const imageData={url,title:raw.title.trim(),alt:raw.alt.trim()};
  await save({kind:'image',slug:old?.slug||crypto.randomUUID(),data:imageData,published:e.target.elements.published.checked,sort_order:Number(raw.sort_order)});
  if(old)await syncBlockImages(supabase,rows,old.slug,imageData);
  e.target.reset();imageId.value='';e.target.elements.file.required=true;
});};
$('#reviewForm').onsubmit=e=>{e.preventDefault();run(e.target,async()=>{const raw=Object.fromEntries(new FormData(e.target)),old=rows.find(r=>r.id===raw.id);await save({kind:'review',slug:old?.slug||crypto.randomUUID(),data:{name:raw.name.trim(),text:raw.text.trim(),rating:Number(raw.rating)},published:e.target.elements.published.checked,sort_order:Number(raw.sort_order)});e.target.reset();e.target.elements.id.value='';});};
$('#newReview').onclick=()=>{$('#reviewForm').reset();$('#reviewForm').elements.id.value='';};
Object.entries(pages).forEach(([slug,label])=>$('#seoPage').add(new Option(label,slug)));
$('#seoPage').onchange=loadSeo;
$('#seoForm').oninput=preview;
$('#seoForm').onsubmit=e=>{e.preventDefault();run(e.target,async()=>{const raw=Object.fromEntries(new FormData(e.target));await save({kind:'seo',slug:raw.slug,data:{title:raw.title.trim(),description:raw.description.trim(),image:raw.image},published:true});});};
$('#dashboard').addEventListener('click',async e=>{
  const b=e.target.closest('[data-action]');if(!b||!active)return;const row=rows.find(r=>r.id===b.dataset.id);if(!row)return;
  if(b.dataset.action==='edit-review'){fill($('#reviewForm'),{id:row.id,...row.data,published:row.published,sort_order:row.sort_order});$('#reviewForm').scrollIntoView({behavior:'smooth',block:'center'});return;}
  if(b.dataset.action==='edit-image'){fill($('#imageForm'),{id:row.id,...row.data,published:row.published,sort_order:row.sort_order});$('#imageForm').elements.file.required=false;$('#imageForm').scrollIntoView({behavior:'smooth',block:'center'});return;}
  if(b.dataset.action==='remove'&&!confirm(row.kind==='image'?'حذف الصورة من المكتبة والمعرض؟ يبقى الملف محفوظًا حتى لا تتعطل روابطه المستخدمة.':'حذف التقييم نهائيًا؟'))return;
  b.disabled=true;
  try{if(b.dataset.action==='toggle')check(await table().update({published:!row.published,updated_at:new Date().toISOString()}).eq('id',row.id).select().single());else check(await table().delete().eq('id',row.id).select().single());await load();message('تم تحديث المحتوى.');}catch(error){message(error.message,true);}finally{b.disabled=false;}
});
const updateBlocks=mountBlocksEditor(supabase,{notify:message,refresh:load});
mountLeadsAdmin(supabase);
init();

// Public content only. Draft visibility and mutations are enforced by Supabase RLS.
import {supabase} from './cms-client.js';
import './visit-tracker.js';
import {mountVisualContent} from './site-highlights.js';
const imageUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'?u.href:'';}catch{return '';}};
function node(tag,text,className){const el=document.createElement(tag);if(text!=null)el.textContent=text;if(className)el.className=className;return el;}
function meta(key,value,property=false){if(!value)return;const attr=property?'property':'name';let el=document.head.querySelector(`meta[${attr}="${key}"]`);if(!el){el=document.createElement('meta');el.setAttribute(attr,key);document.head.append(el);}el.content=value;}
function section(title,id){const el=node('section',null,'cms-section');el.id=id;const wrap=node('div',null,'cms-container');wrap.append(node('h2',title));el.append(wrap);return [el,wrap];}
async function load(){
 const path=location.pathname.replace(/index\.html$/,'').replace(/\/?$/,'/');
 const {data,error}=await supabase.from('wujha_cms_content').select('kind,slug,data,sort_order').eq('published',true).order('sort_order').order('updated_at',{ascending:false});
 if(error){console.info('محتوى الموقع الافتراضي متاح؛ لم يتم تحميل CMS.');return;}
 const seo=data.find(r=>r.kind==='seo'&&r.slug===path)?.data;
 if(seo){if(seo.title)document.title=seo.title;meta('description',seo.description);meta('og:title',seo.title,true);meta('og:description',seo.description,true);meta('twitter:title',seo.title);meta('twitter:description',seo.description);const image=imageUrl(seo.image);if(image){meta('og:image',image,true);meta('twitter:image',image);}}
 if(path!=='/')return;
 const s=data.find(r=>r.kind==='settings'&&r.slug==='home')?.data||{};
 if(s.hero_title){const h=document.querySelector('.hero h1');if(h)h.textContent=s.hero_title;}
 if(s.hero_description){const p=document.querySelector('.hero-subtitle');if(p)p.textContent=s.hero_description;}
 if(imageUrl(s.hero_image)){const host=document.querySelector('.hero-visual');if(host){const image=node('img');image.src=imageUrl(s.hero_image);image.alt=s.hero_alt||'وجهة';image.width=640;image.height=640;image.fetchPriority='high';image.style.cssText='position:relative;width:100%;height:100%;object-fit:cover';host.replaceChildren(image);}}
 const content=document.createDocumentFragment();
 const place=(el,key)=>{const slot=document.querySelector('[data-cms-slot="'+key+'"]');if(slot){slot.hidden=false;slot.replaceChildren(el);}else content.append(el);};
 if(s.show_stats){const [el,wrap]=section('وجهة بالأرقام','cms-statistics'),grid=node('div',null,'cms-grid');for(const [value,label] of [[s.served_count,'عميل خدمنا'],[s.completed_count,'طلب مكتمل'],[s.years_count,'سنوات خبرة']]){const item=node('article');const number=Number(value);item.append(node('strong',new Intl.NumberFormat('ar-SA').format(Number.isFinite(number)?Math.max(0,number):0)),node('p',label));grid.append(item);}wrap.append(grid);place(el,'stats');}
 const images=data.filter(r=>r.kind==='image'&&imageUrl(r.data.url));if(images.length){const [el,wrap]=section(s.gallery_title||'من صورنا','cms-gallery'),grid=node('div',null,'cms-grid');images.forEach(r=>{const figure=node('figure'),img=node('img');img.src=imageUrl(r.data.url);img.alt=r.data.alt||r.data.title||'';img.loading='lazy';img.width=640;img.height=440;figure.append(img,node('figcaption',r.data.title));grid.append(figure);});wrap.append(grid);place(el,'gallery');}
 const reviews=data.filter(r=>r.kind==='review');if(reviews.length){const [el,wrap]=section(s.reviews_title||'آراء عملائنا','cms-reviews'),grid=node('div',null,'cms-grid');const rated=reviews.map(r=>Number(r.data.rating)).filter(n=>Number.isFinite(n)&&n>=1&&n<=5);if(rated.length){const average=rated.reduce((a,b)=>a+b,0)/rated.length;wrap.append(node('p',average.toFixed(1)+' / 5 · '+rated.length+' تقييم منشور','review-summary'));}reviews.slice(0,6).forEach(r=>{const card=node('article'),rating=Math.min(5,Math.max(1,Number(r.data.rating)||1)),stars=node('div','★'.repeat(rating));stars.className='cms-stars';stars.setAttribute('aria-label',`التقييم ${rating} من 5`);card.append(stars,node('blockquote',r.data.text),node('strong',r.data.name));grid.append(card);});wrap.append(grid);place(el,'reviews');}
 const main=document.querySelector('main');if(main){main.insertBefore(content,main.querySelector('.final-cta'));mountVisualContent(data,main);}
}
load().catch(()=>console.info('تم عرض محتوى الموقع الافتراضي.'));

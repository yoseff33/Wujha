// Shared, code-defined icons; editable content never becomes SVG/HTML markup.
export const ICONS = {
  star: {label:'نجمة',path:'m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z'},
  user: {label:'عملاء',path:'M20 21v-2a7 7 0 0 0-14 0v2M13 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8'},
  check: {label:'علامة صح',path:'m5 12 4 4L19 6'},
  bolt: {label:'برق',path:'m13 2-9 12h7l-1 8 10-13h-8Z'},
  shield: {label:'درع',path:'M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7ZM8 12l3 3 5-6'},
  phone: {label:'جوال',path:'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM10 18h4'},
  clock: {label:'وقت',path:'M12 8v5l3 2M22 12a10 10 0 1 0-20 0 10 10 0 0 0 20 0'},
  bag: {label:'طلبات',path:'M5 7h14l2 14H3ZM8 7V6a4 4 0 0 1 8 0v1'},
  heart: {label:'قلب',path:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8'},
  image: {label:'صور',path:'M3 3h18v18H3ZM3 17l6-6 5 5 3-3 4 4M16 7h.01'}
};
export const safeImage = value => {try{const u=new URL(value);return u.protocol==='https:'?u.href:'';}catch{return '';}};
export function iconMarkup(key){const icon=ICONS[key]||ICONS.star;return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icon.path}"/></svg>`;}
export function element(tag,text,cls){const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;}
export function infoCard(data){const card=element('article',null,'wj-info-card'+(data.style==='gold'?' wj-info-gold':'')),badge=element('span',null,'wj-icon');badge.innerHTML=iconMarkup(data.icon);card.append(badge);if(data.value)card.append(element('strong',data.value,'wj-info-value'));card.append(element('h3',data.title),element('p',data.description||''),element('span',null,'wj-dash'));return card;}
export function featureCard(data){const card=element('article',null,'wj-feature-card'),badge=element('span',null,'wj-icon');badge.innerHTML=iconMarkup(data.icon);card.append(badge,element('h3',data.title),element('span',null,'wj-dash'));return card;}
export const blockRows=(rows,type)=>rows.filter(r=>r.kind==='settings'&&r.data?.block_type===type);
export function slidesFor(data,rows){return (Array.isArray(data.slides)?data.slides:[]).map(slide=>{const linked=rows.find(r=>r.kind==='image'&&r.slug===slide.image_slug);const image=linked?.data||slide;return {url:safeImage(image.url),alt:image.alt||image.title||data.title||'',caption:slide.caption||''};}).filter(s=>s.url);}

export function createId(){if(typeof crypto.randomUUID==='function')return crypto.randomUUID();const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const h=[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}

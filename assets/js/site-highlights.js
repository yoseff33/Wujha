import {blockRows,element,infoCard,featureCard,safeImage,slidesFor} from './content-blocks.js';
export function mountVisualContent(rows,main){
 const features=blockRows(rows,'feature'),highlights=blockRows(rows,'highlight'),infos=blockRows(rows,'infographic');
 if(features.length){const defaults=main.querySelector('#defaultBenefits');if(defaults)defaults.hidden=true;}
 if(features.length||highlights.length){const section=element('section',null,'wj-social-content');section.setAttribute('aria-label','مميزات وجهة والهايلايت');const wrap=element('div',null,'cms-container');
  if(features.length){const grid=element('div',null,'wj-feature-grid');features.forEach(row=>grid.append(featureCard(row.data)));wrap.append(grid);}
  const groups=highlights.map(row=>({...row.data,slides:slidesFor(row.data,rows)})).filter(g=>g.slides.length);
  if(groups.length){const title=element('h2','تعرّف علينا أكثر','wj-highlights-heading'),rail=element('div',null,'wj-highlights');rail.setAttribute('aria-label','هايلايت وجهة');groups.forEach((g,i)=>{const button=element('button',null,'wj-highlight'),ring=element('span',null,'wj-highlight-ring'),img=element('img');img.src=safeImage(g.cover)||g.slides[0].url;img.alt='';img.loading='lazy';img.width=96;img.height=96;ring.append(img);button.type='button';button.setAttribute('aria-label','فتح هايلايت '+g.title);button.append(ring,element('span',g.title,'wj-highlight-title'));button.addEventListener('click',()=>openStories(groups,i,button));rail.append(button);});wrap.append(title,rail);}
  section.append(wrap);const anchor=(!features.length&&main.querySelector('#defaultBenefits'))||main.querySelector('.hero');if(anchor)anchor.after(section);else main.prepend(section);
 }
 if(infos.length){const section=element('section',null,'wj-info-section'),wrap=element('div',null,'cms-container'),grid=element('div',null,'wj-info-grid');wrap.append(element('h2','وجهة باختصار','wj-highlights-heading'));infos.forEach(row=>grid.append(infoCard(row.data)));wrap.append(grid);section.append(wrap);const slot=main.querySelector('[data-cms-slot="infographics"]');if(slot){slot.hidden=false;slot.replaceChildren(section);}else main.insertBefore(section,main.querySelector('.final-cta'));}
}
function openStories(groups,start,opener){
 document.querySelector('.wj-stories')?.close();
 const dialog=element('dialog',null,'wj-stories');dialog.dir='rtl';dialog.setAttribute('aria-label','عارض الهايلايت');
 const inner=element('div',null,'wj-story-inner'),header=element('header',null,'wj-story-header'),progress=element('div',null,'wj-story-progress'),title=element('strong'),counter=element('span',null,'wj-story-counter'),close=element('button','×','wj-story-close');close.type='button';close.setAttribute('aria-label','إغلاق الهايلايت');header.append(title,counter,close);
 const frame=element('div',null,'wj-story-frame'),img=element('img'),caption=element('p',null,'wj-story-caption'),loading=element('span','جارٍ تحميل الصورة…','wj-story-loading');frame.append(img,loading);
 const footer=element('div',null,'wj-story-controls'),prev=element('button','السابق'),next=element('button','التالي'),hint=element('span','اسحب للتنقل');prev.type=next.type='button';footer.append(prev,hint,next);inner.append(progress,header,frame,caption,footer);dialog.append(inner);document.body.append(dialog);
 let group=start,slide=0,touchX=null;const scroll=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';
 const render=()=>{const g=groups[group],s=g.slides[slide];title.textContent=g.title;counter.textContent=`${slide+1} / ${g.slides.length}`;img.alt=s.alt;loading.textContent='جارٍ تحميل الصورة…';loading.hidden=false;img.hidden=true;img.src=s.url;caption.textContent=s.caption;progress.replaceChildren(...g.slides.map((_,i)=>element('span',null,i<=slide?'is-seen':'')));prev.disabled=group===0&&slide===0;next.textContent=group===groups.length-1&&slide===g.slides.length-1?'إغلاق':'التالي';};
 const move=direction=>{if(direction>0){if(slide<groups[group].slides.length-1)slide++;else if(group<groups.length-1){group++;slide=0;}else{dialog.close();return;}}else{if(slide>0)slide--;else if(group>0){group--;slide=groups[group].slides.length-1;}}render();};
 img.onload=()=>{loading.hidden=true;img.hidden=false;};img.onerror=()=>{loading.textContent='تعذر تحميل الصورة. انتقل للصورة التالية.';img.hidden=true;};
 close.onclick=()=>dialog.close();prev.onclick=()=>move(-1);next.onclick=()=>move(1);
 dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();move(e.key==='ArrowLeft'?1:-1);}});
 frame.addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX;},{passive:true});frame.addEventListener('touchend',e=>{if(touchX!==null){const delta=e.changedTouches[0].clientX-touchX;if(Math.abs(delta)>45)move(delta>0?1:-1);touchX=null;}},{passive:true});
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});dialog.addEventListener('close',()=>{document.documentElement.style.overflow=scroll;dialog.remove();opener.focus();},{once:true});
 dialog.showModal();render();close.focus();
}

import {supabase} from './cms-client.js';
import {createId} from './content-blocks.js';
export async function trackVisit(){
 if(document.visibilityState==='prerender')return;
 const path=location.pathname.replace(/index\.html$/,'').replace(/\/?$/,'/');
 if(!['/','/services/','/tamara/','/quara/','/emkan/','/tamam/','/blog/','/faq/','/about/','/contact/','/apply/'].includes(path))return;
 // No IP, form values, query strings, or persistent browser fingerprint are collected.
 try{const now=Date.now();let session;try{session=JSON.parse(sessionStorage.getItem('wujha_visit')||'null');}catch{}if(!session||!session.id||now-session.last>1800000)session={id:createId()};session.last=now;sessionStorage.setItem('wujha_visit',JSON.stringify(session));await supabase.rpc('wujha_track_view',{p_event:createId(),p_session:session.id,p_path:path});}catch{/* Analytics must never block the page. */}
}
trackVisit();

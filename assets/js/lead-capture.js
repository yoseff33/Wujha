import {supabase} from './cms-client.js';
import {createId} from './content-blocks.js';
import {normalizePhone} from './lead-utils.js';
let requestId=createId();
export async function captureLead(state,consent){
 if(!consent)return false;
 const phone=normalizePhone(state.phone);if(!phone)throw Error('تحقق من رقم جوالك.');
 const {data,error}=await supabase.rpc('wujha_submit_lead',{p_id:requestId,p_name:String(state.fullName||'').trim(),p_phone:phone,p_type:['product','cash'].includes(state.type)?state.type:'general',p_provider:String(state.type==='cash'?state.cashProvider||'':state.provider||'').slice(0,40),p_consent:true});
 if(error||data!==true)throw Error('تعذر حفظ الطلب. تأكد من اتصالك ثم أعد المحاولة.');
 return true;
}

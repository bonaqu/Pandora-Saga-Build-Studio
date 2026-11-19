/* Public read-only loading: bounded retries for transient GET failures only.
   Never retries mutations, malformed JSON, missing D1 provenance or 4xx
   contract failures. Does not supply an archive/cache fallback. */
(function(root){
'use strict';
const transient=new Set([408,429,500,502,503,504]);
// A cancelled checkpoint must not keep a queued retry alive. Default timer
// cleanup also avoids waking an abandoned tab solely to attempt another GET.
const abortReason=signal=>signal?.reason||Error('Request aborted');
const defaultPause=(ms,signal)=>new Promise((resolve,reject)=>{
 if(signal?.aborted){reject(abortReason(signal));return}
 const timer=setTimeout(()=>{signal?.removeEventListener('abort',onAbort);resolve()},ms);
 function onAbort(){
  clearTimeout(timer);
  signal.removeEventListener('abort',onAbort);
  reject(abortReason(signal));
 }
 signal?.addEventListener('abort',onAbort,{once:true});
});
// A custom fetch or JSON adapter may ignore AbortSignal altogether.
// Waiting for its promise would strand an online-only checkpoint forever.
// Always release listeners after completion, rejection, or cancellation.
function untilAbort(work,signal){
 if(!signal)return Promise.resolve().then(work);
 if(signal.aborted)return Promise.reject(abortReason(signal));
 return new Promise((resolve,reject)=>{
  let settled=false;
  const finish=(callback,value)=>{
   if(settled)return;
   settled=true;
   signal.removeEventListener('abort',onAbort);
   callback(value);
  };
  const onAbort=()=>finish(reject,abortReason(signal));
  signal.addEventListener('abort',onAbort,{once:true});
  Promise.resolve().then(()=>{
   if(signal.aborted)throw abortReason(signal);
   return work();
  }).then(value=>finish(resolve,value),error=>finish(reject,error));
 });
}
const pauseRetry=(ms,signal,pause)=>pause===defaultPause?
 defaultPause(ms,signal):untilAbort(()=>pause(ms),signal);
// Quota errors are confirmed by the Worker response body, not by HTTP 503
// alone. Keep only a short, in-memory advisory cooldown: the user's manual
// retry always bypasses it and success must revalidate D1 before unblocking.
let quotaUntil=0;
const quotaCooldownMs=()=>Math.max(0,quotaUntil-Date.now());
function resetQuotaCooldown(){quotaUntil=0}
async function observeQuotaFailure(response,signal){
 if(response?.status!==503||typeof response.clone!=='function')return false;
 try{
  const payload=await response.clone().json();
  // Do not publish a stale cooldown after the cancelled request has ended.
  if(signal?.aborted||payload?.code!=='D1_DAILY_QUOTA_EXCEEDED')return false;
  const raw=response.headers?.get?.('retry-after')||'';
  const seconds=/^[1-9][0-9]{0,4}$/.test(raw)?Number(raw):60;
  // 00:00 UTC is the theoretical reset, but short automatic probes still
  // allow recovery if the operator upgrades/repairs D1 before midnight.
  const cooldown=Math.min(300000,Math.max(1000,seconds*1000));
  quotaUntil=Math.max(quotaUntil,Date.now()+cooldown);
  return true;
 }catch{return false}
}
// A temporary 429/503 may include Retry-After. Respect a short server
// cooldown without letting a bad header stall the online-only editor.
// Invalid headers preserve the existing bounded exponential-ish backoff.
function retryDelay(attempt,response){
 const fallback=attempt*350;
 const raw=response?.headers?.get?.('retry-after');
 if(typeof raw!=='string'||!raw.trim())return fallback;
 const value=raw.trim();
 const seconds=/^(0|[1-9][0-9]{0,3})$/.test(value)?Number(value):null;
 const date=seconds===null?Date.parse(value):NaN;
 const requested=seconds!==null?seconds*1000:
  Number.isFinite(date)?Math.max(0,date-Date.now()):NaN;
 return Number.isFinite(requested)?Math.max(fallback,Math.min(2500,requested)):fallback;
}

async function get(url,options={},config={}){
 const fetcher=config.fetcher||root.fetch?.bind(root);
 const pause=config.pause||defaultPause;
 const attempts=config.attempts??3;
 const timeoutMs=config.timeoutMs??12000;
 if(typeof url!=='string'||!url||typeof fetcher!=='function'||
  typeof pause!=='function'||!Number.isInteger(attempts)||attempts<1||attempts>3||
  !Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000||
  options?.body!=null||options?.method&&String(options.method).toUpperCase()!=='GET')
  throw Error('Invalid read-only request');
 const parent=options?.signal||null;
 for(let attempt=1;attempt<=attempts;attempt++){
  if(parent?.aborted)throw abortReason(parent);
  // Each attempt owns its own deadline. The outer deadline takes priority.
  const clock=AbortSignal.timeout(timeoutMs);
  const signal=parent?AbortSignal.any([parent,clock]):clock;
  let response;
  try{
   // Never allow caller defaults or browser caches to serve a stale D1 GET.
   response=await untilAbort(()=>fetcher(url,{
    ...options,method:'GET',cache:'no-store',signal
   }),signal);
  }catch(error){
   // Only a transport failure can be retried. Parent cancellation is final.
   if(parent?.aborted)throw abortReason(parent);
   if(attempt===attempts)throw error;
   await pauseRetry(attempt*350,parent,pause);
   continue;
  }
  // Even an adapter that ignores AbortSignal cannot turn a cancelled or
  // timed-out response into a valid snapshot for a newer connection attempt.
  if(signal.aborted)throw signal.reason||Error('Read-only request aborted');
  // A broken fetch adapter is a contract failure, not a transient HTTP error.
  // Retrying it would conceal the defect and multiply unnecessary D1 reads.
  if(!response||typeof response.ok!=='boolean')
   throw Error('Invalid public GET response');
  // An explicitly exhausted D1 Free quota cannot recover during the
  // following 350ms/700ms retries. Preserve the original body for callers.
  const quota=response.status===503&&await untilAbort(
   ()=>observeQuotaFailure(response,signal),signal
  );
  if(signal.aborted)throw signal.reason||Error('Read-only request aborted');
  if(quota||response.ok||!transient.has(response.status)||attempt===attempts)
   return response;
  // Back off rather than multiplying short-lived 429/503 bursts after F5.
  // No owner/account writes are ever sent by this helper.
  await pauseRetry(retryDelay(attempt,response),parent,pause);
 }
 throw Error('Unexpected read-only retry state');
}

// Unlike Promise.all over the entire D1 catalog, this starts only a small
// number of simultaneous downloads, retaining the source order and snapshot
// integrity checks performed by the caller.
async function mapLimit(items,limit,mapper,{signal:parent}={}){
 if(!Array.isArray(items)||!Number.isInteger(limit)||limit<1||limit>8||
  typeof mapper!=='function')throw Error('Invalid read-only batch');
 if(parent!=null&&(typeof parent.aborted!=='boolean'||
  typeof parent.addEventListener!=='function'||
  typeof parent.removeEventListener!=='function'))
  throw Error('Invalid batch cancellation signal');
 if(parent?.aborted)throw abortReason(parent);
 const output=new Array(items.length),controller=new AbortController();
 let next=0,firstError=null;
 const onParentAbort=()=>controller.abort(abortReason(parent));
 parent?.addEventListener('abort',onParentAbort,{once:true});
 async function work(){
  while(!controller.signal.aborted){
   const index=next++;
   if(index>=items.length)return;
   try{
    output[index]=await untilAbort(
     ()=>mapper(items[index],index,controller.signal),controller.signal
    );
   }catch(error){
    if(firstError===null){
     firstError=error;
     // Preserve the original failure, aborting already-started siblings.
     controller.abort(error);
    }
    return;
   }
  }
 }
 try{
  // Abort can race the initial preflight before any mapper runs.
  if(parent?.aborted)throw abortReason(parent);
  await Promise.all(Array.from({length:Math.min(limit,items.length)},work));
  if(firstError!==null)throw firstError;
  if(controller.signal.aborted)throw abortReason(controller.signal);
  return output;
 }finally{parent?.removeEventListener('abort',onParentAbort)}
}
root.PandoraStudioLiveRead=Object.freeze({get,mapLimit,quotaCooldownMs,resetQuotaCooldown});
})(typeof window==='undefined'?globalThis:window);

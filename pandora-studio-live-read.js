/* Public read-only loading: bounded retries for transient GET failures only.
   Never retries mutations, malformed JSON, missing D1 provenance or 4xx
   contract failures. Does not supply an archive/cache fallback. */
(function(root){
'use strict';
const transient=new Set([408,429,500,502,503,504]);
const defaultPause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
// Quota errors are confirmed by the Worker response body, not by HTTP 503
// alone. Keep only a short, in-memory advisory cooldown: the user's manual
// retry always bypasses it and success must revalidate D1 before unblocking.
let quotaUntil=0;
const quotaCooldownMs=()=>Math.max(0,quotaUntil-Date.now());
function resetQuotaCooldown(){quotaUntil=0}
async function observeQuotaFailure(response){
 if(response?.status!==503||typeof response.clone!=='function')return false;
 try{
  const payload=await response.clone().json();
  if(payload?.code!=='D1_DAILY_QUOTA_EXCEEDED')return false;
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
  if(parent?.aborted)throw parent.reason||Error('Request aborted');
  // Each attempt owns its own deadline. The outer deadline takes priority.
  const clock=AbortSignal.timeout(timeoutMs);
  const signal=parent?AbortSignal.any([parent,clock]):clock;
  let response;
  try{
   // Never allow caller defaults or browser caches to serve a stale D1 GET.
   response=await fetcher(url,{...options,method:'GET',cache:'no-store',signal});
  }catch(error){
   // Only a transport failure can be retried. Parent cancellation is final.
   if(parent?.aborted||attempt===attempts)throw error;
   await pause(attempt*350);
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
  const quota=response.status===503&&await observeQuotaFailure(response);
  if(signal.aborted)throw signal.reason||Error('Read-only request aborted');
  if(quota||response.ok||!transient.has(response.status)||attempt===attempts)
   return response;
  // Back off rather than multiplying short-lived 429/503 bursts after F5.
  // No owner/account writes are ever sent by this helper.
  await pause(retryDelay(attempt,response));
 }
 throw Error('Unexpected read-only retry state');
}

// Unlike Promise.all over the entire D1 catalog, this starts only a small
// number of simultaneous downloads, retaining the source order and snapshot
// integrity checks performed by the caller.
async function mapLimit(items,limit,mapper){
 if(!Array.isArray(items)||!Number.isInteger(limit)||limit<1||limit>8||
  typeof mapper!=='function')throw Error('Invalid read-only batch');
 const output=new Array(items.length);
 let next=0,stopped=false;
 async function work(){
  while(!stopped){
   const index=next++;
   if(index>=items.length)return;
   try{output[index]=await mapper(items[index],index)}
   catch(error){stopped=true;throw error}
  }
 }
 await Promise.all(Array.from({length:Math.min(limit,items.length)},work));
 return output;
}
root.PandoraStudioLiveRead=Object.freeze({get,mapLimit,quotaCooldownMs,resetQuotaCooldown});
})(typeof window==='undefined'?globalThis:window);

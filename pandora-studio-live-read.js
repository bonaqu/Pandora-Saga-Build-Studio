/* Public read-only loading: bounded retries for transient GET failures only.
   Never retries mutations, malformed JSON, missing D1 provenance or 4xx
   contract failures. Does not supply an archive/cache fallback. */
(function(root){
'use strict';
const transient=new Set([408,429,500,502,503,504]);
const defaultPause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

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
  try{
   // Each new attempt owns a fresh timeout; an outer startup/checkpoint
   // deadline still takes priority and cannot be bypassed by retries.
   const clock=AbortSignal.timeout(timeoutMs);
   const signal=parent?AbortSignal.any([parent,clock]):clock;
   const response=await fetcher(url,{...options,method:'GET',signal});
   if(!response||typeof response.ok!=='boolean')
    throw Error('Invalid public GET response');
   if(response.ok||!transient.has(response.status)||attempt===attempts)
    return response;
  }catch(error){
   if(parent?.aborted||attempt===attempts)throw error;
  }
  // Back off rather than multiplying short-lived 429/503 bursts after F5.
  // No owner/account writes are ever sent by this helper.
  await pause(attempt*350);
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
root.PandoraStudioLiveRead=Object.freeze({get,mapLimit});
})(typeof window==='undefined'?globalThis:window);

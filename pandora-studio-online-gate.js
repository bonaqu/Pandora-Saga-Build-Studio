/* Online-only published game data: small, read-only validation contract.
   Live operation is gated by a verified D1 snapshot, not navigator.onLine.
   This file has no storage, account, admin, or mutation capabilities. */
(function(root){
'use strict';
// JSON object member order is not semantic data. D1 / Workers may
// serialize nested owner-copy maps in a different order after readback.
const canonical=value=>Array.isArray(value)?value.map(canonical):
 value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const digest=value=>{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 return JSON.stringify(canonical(value));
};
const snapshotValue=response=>response?.headers?.get?.('x-ps-catalog-snapshot')||'';
// A custom fetcher or JSON adapter may ignore AbortSignal. An abandoned
// checkpoint must never authorize editing from its late success response.
function requireActive(signal){
 if(signal?.aborted)throw signal.reason||Error('Online checkpoint aborted');
}
// Fetch and JSON body adapters may ignore AbortSignal. Both startup and
// periodic D1 checks must settle at the checkpoint deadline, without ever
// accepting a late success from a discarded catalog generation.
function untilAbort(work,signal){
 if(typeof work!=='function')throw TypeError('Checkpoint operation required');
 if(!signal)return Promise.resolve().then(work);
 requireActive(signal);
 return new Promise((resolve,reject)=>{
  let finished=false;
  const finish=(callback,value)=>{
   if(finished)return;
   finished=true;
   signal.removeEventListener('abort',onAbort);
   callback(value);
  };
  const onAbort=()=>finish(reject,signal.reason||Error('Online checkpoint aborted'));
  signal.addEventListener('abort',onAbort,{once:true});
  Promise.resolve().then(()=>{
   requireActive(signal);
   return work();
  }).then(value=>finish(resolve,value),error=>finish(reject,error));
 });
}
async function inspect({api,fetcher,expectedSnapshot,expectedOverrides,expectedCounts,signal}){
 if(typeof api!=='string'||!api.startsWith('https://')||
  typeof fetcher!=='function'||!expectedSnapshot)throw Error('Invalid online checkpoint');
 requireActive(signal);
 const options={cache:'no-store',...(signal?{signal}:{})};
 // Both the authorial override layer and published game records must be live.
 // One healthy endpoint is not proof that the entire site is up to date.
 const [catalogResponse,copyResponse]=await Promise.all([
  untilAbort(()=>fetcher(api+'/api/catalog/meta.json',options),signal),
  untilAbort(()=>fetcher(api+'/api/overrides',options),signal)
 ]);
 requireActive(signal);
 if(!catalogResponse?.ok||!copyResponse?.ok)
  throw Error('Game data connection unavailable');
 if(catalogResponse.headers?.get('x-ps-catalog')!=='d1'||
  !snapshotValue(catalogResponse))
  throw Error('Game data source is not verified');
 const [meta,copy]=await Promise.all([
  untilAbort(()=>catalogResponse.json(),signal),
  untilAbort(()=>copyResponse.json(),signal)
 ]);
 requireActive(signal);
 const counts=meta?.counts,overrides=copy?.values;
 if(!counts||!Number.isSafeInteger(counts.items)||counts.items<1||
  !Number.isSafeInteger(counts.skills)||counts.skills<1||
  !overrides||typeof overrides!=='object'||Array.isArray(overrides))
  throw Error('Incomplete online catalog or authorial copy');
 const snapshot=snapshotValue(catalogResponse);
 const changed=snapshot!==expectedSnapshot||
  digest(overrides)!==digest(expectedOverrides)||
  (expectedCounts&&digest(counts)!==digest(expectedCounts));
 return Object.freeze({status:changed?'changed':'ready',snapshot});
}
root.PandoraStudioOnlineGate=Object.freeze({inspect,digest,untilAbort});
})(typeof window==='undefined'?globalThis:window);

/* Online-only published game data: small, read-only validation contract.
   Live operation is gated by a verified D1 snapshot, not navigator.onLine.
   This file has no storage, account, admin, or mutation capabilities. */
(function(root){
'use strict';
const digest=value=>{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 return JSON.stringify(Object.keys(value).sort().map(key=>[key,value[key]]));
};
const snapshotValue=response=>response?.headers?.get?.('x-ps-catalog-snapshot')||'';
async function inspect({api,fetcher,expectedSnapshot,expectedOverrides,expectedCounts,signal}){
 if(typeof api!=='string'||!api.startsWith('https://')||
  typeof fetcher!=='function'||!expectedSnapshot)throw Error('Invalid online checkpoint');
 const options={cache:'no-store',...(signal?{signal}:{})};
 // Both the authorial override layer and published game records must be live.
 // One healthy endpoint is not proof that the entire site is up to date.
 const [catalogResponse,copyResponse]=await Promise.all([
  fetcher(api+'/api/catalog/meta.json',options),
  fetcher(api+'/api/overrides',options)
 ]);
 if(!catalogResponse?.ok||!copyResponse?.ok)
  throw Error('Game data connection unavailable');
 if(catalogResponse.headers?.get('x-ps-catalog')!=='d1'||
  !snapshotValue(catalogResponse))
  throw Error('Game data source is not verified');
 const [meta,copy]=await Promise.all([
  catalogResponse.json(),copyResponse.json()
 ]);
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
root.PandoraStudioOnlineGate=Object.freeze({inspect,digest});
})(typeof window==='undefined'?globalThis:window);

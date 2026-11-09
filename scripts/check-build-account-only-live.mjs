// Read-only release guard for the live Worker. Never posts or mutates D1.
const worker='https://ps-build-studio-cloud.bonaqu.workers.dev';
const origin='https://bonaqu.github.io';
const key='f'.repeat(64);
const required=['buildLibraryRequiresAccount','sharedPreviewRequiresAccount',
 'legacyAccountImportPreview'];
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function get(path,token=null){
 const response=await fetch(worker+path,{
  headers:{Origin:origin,...(token?{Authorization:'Bearer '+token}:{})},
  cache:'no-store',signal:AbortSignal.timeout(15000)
 });
 return response;
}
let capabilities=null;
for(let attempt=0;attempt<30;attempt++){
 try{
  const r=await get('/api/runtime-capabilities');
  if(r.ok)capabilities=await r.json();
  if(required.every(k=>capabilities?.[k]===true))break;
 }catch(err){
  if(attempt===29)throw err;
 }
 if(attempt<29)await pause(5000);
}
if(!required.every(k=>capabilities?.[k]===true))
 throw Error('Production Worker has not deployed the account-only build endpoints');
console.log('OK live account-only Worker capability markers');
const attempts=[
 {path:'/api/library',type:'anonymous library'},
 {path:'/api/library',token:key,type:'legacy guest-key library'},
 {path:'/api/shared/A1234567890',type:'anonymous shared build'},
 {path:'/api/shared/A1234567890',token:key,type:'legacy guest-key shared build'},
 {path:'/api/library/legacy-preview',token:key,type:'guest-key migration preview'}
];
for(const check of attempts){
 const response=await get(check.path,check.token);
 if(response.status!==401)
  throw Error(check.type+' expected HTTP 401; received '+response.status);
 console.log('OK denied '+check.type+' (HTTP 401)');
}
console.log('Account-only Worker checks passed; no D1 writes or account access performed');

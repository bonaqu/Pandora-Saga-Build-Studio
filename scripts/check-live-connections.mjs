/* Read-only diagnostic of Pages <-> Cloudflare Worker <-> D1.
   No secrets, account login, database mutation or GitHub Actions. Node 20+. */
import {readFileSync} from 'node:fs';
import {classifyGameSource} from './source-egress-status.mjs';
const site='https://bonaqu.github.io/Pandora-Saga-Build-Studio/';
const worker='https://ps-build-studio-cloud.bonaqu.workers.dev';
const origin='https://bonaqu.github.io';
const expected=JSON.parse(readFileSync(new URL('../site-version.json',import.meta.url),'utf8')).release;
const full=process.argv.includes('--full');
// Full public D1 set includes all gameplay and both RU/EN resource layers.
const sets=full?['meta','classes','skills','items','souls','monsters','drops','maps',
 'instances','racialPassives','itemForth','unison','trades','tradeMeta','legacyLocale',
 'tables','expertise','chests','stringsEn']:['meta','classes','skills','items','souls'];
let failures=0;
async function read(url,{method='GET',cors=false}={}){
 const response=await fetch(url,{method,headers:cors?{Origin:origin}:undefined,
  cache:'no-store',signal:AbortSignal.timeout(12000)});
 const payload=method==='GET'?await response.json().catch(()=>null):null;
 return{response,payload};
}
const check=(yes,label,reason='')=>{
 console.log((yes?'OK  ':'FAIL')+' '+label+(reason?' — '+reason:''));
 if(!yes)failures++;
};
try{
 const {response,payload}=await read(site+'site-version.json?diagnostic='+Date.now());
 check(response.ok&&payload?.release===expected,'Pages publication',
  'expected '+expected+', live '+(payload?.release??'unavailable'));
}catch(e){check(false,'Pages publication',e.message)}
// Production social-preview verification: HTML is static for crawlers;
// the image URL and both versions must match the actually published release.
try{
 const previewVersion='0.'+Number(expected.split('.')[3])+'.0';
 const imageUrl=site+'assets/social-preview.jpg?v='+expected;
 const response=await fetch(site+'?social-check='+encodeURIComponent(expected),{
  cache:'no-store',signal:AbortSignal.timeout(12000)});
 const html=await response.text();
 const matchingDescriptions=[...html.matchAll(/<meta (?:property="og:description"|name="twitter:description") content="([^"]+)">/g)]
  .filter(m=>m[1].includes('Version: '+previewVersion));
 check(response.ok&&matchingDescriptions.length===2&&
  html.includes('<meta property="og:title" content="Pandora Saga | Build Studio">')&&
  html.includes('<meta name="twitter:card" content="summary_large_image">')&&
  (html.match(/content="https:\/\/bonaqu\.github\.io\/Pandora-Saga-Build-Studio\/assets\/social-preview\.jpg\?v=[0-9.]+"\>/g)||[]).length===2&&
  html.includes('content="'+imageUrl+'"'),
  'Public social preview metadata','Open Graph and X share version '+previewVersion);
 const image=await fetch(imageUrl,{method:'HEAD',cache:'no-store',
  signal:AbortSignal.timeout(12000)});
 check(image.ok&&String(image.headers.get('content-type')||'').includes('image/jpeg'),
  'Public social preview image',
  image.status+' / '+(image.headers.get('content-type')||'no image type'));
}catch(e){check(false,'Public social preview metadata/image',e.message)}
try{
 const {response,payload}=await read(worker+'/api/health',{cors:true});
 check(response.status===200&&payload?.status==='ok'&&payload?.storage==='d1',
  'Worker and D1 health',response.status+' / '+(payload?.status??'unknown'));
 check(response.headers.get('access-control-allow-origin')===origin,'Worker GET CORS');
 check(payload?.features?.sharing===true,'D1 sharing tables','migration 0003 required if false');
 check(payload?.features?.library===true,'D1 cloud build library','library tables or Worker release missing');
 check(payload?.features?.catalog===true,'D1 active catalog publication','publish own catalog if false');
 check(payload?.features?.accounts===true,'D1 player accounts',
  'migration 0005 confirmed in production run 41263185077; check connected Worker if false');
}catch(e){check(false,'Worker and D1 health',e.message)}
try{
 // Read-only negative authentication probe: no account, password, session or D1 write.
 const {response,payload}=await read(worker+'/api/account/me',{cors:true});
 check(response.status===401&&payload?.error==='Sign in required'&&
  response.headers.get('access-control-allow-origin')===origin,
  'Player-account authentication endpoint',
  response.status+' / anonymous request rejected without credentials');
}catch(e){check(false,'Player-account authentication endpoint',e.message)}
try{
 // The new PR bridge is protected even when its optional GitHub Secret is
 // unset. Anonymous GET must return 401 once the updated Worker is deployed.
 // 404 means Pages was updated but the Cloudflare Worker wasn't yet.
 const {response}=await read(worker+'/api/admin/catalog/github-status',{cors:true});
 const deployed=response.status===401&&
  response.headers.get('access-control-allow-origin')===origin;
 console.log((deployed?'OK  ':'WARN')+' GitHub PR Worker capability — '+
  (deployed?'admin-auth gate deployed':'Cloudflare Worker update still unconfirmed')+
  ' / HTTP '+response.status);
}catch(error){
 console.log('WARN GitHub PR Worker capability — '+error.message);
}
try{
 // Read-only version check: this endpoint exists only in the new Worker release.
 const {response,payload}=await read(worker+'/api/runtime-capabilities',{cors:true});
 const capabilities=['itemedit','tradeedit','acquireedit','wikiedit',
  'dropedit','chestedit','spawnedit','virtual-town-wiki','bilingual-wiki'];
 const release=/^0\.(\d+)\.0$/.exec(String(payload?.codeRelease||''));
 const deployed=response.ok&&Number(release?.[1]||0)>=322&&
  payload?.githubOwnerExport===true&&
  capabilities.every(k=>payload.ownerEditors?.includes(k));
 console.log((deployed?'OK  ':'WARN')+' Worker runtime capability marker — '+
  (deployed?'0.322.0+ with 9 owner editor capabilities':'required current Cloudflare Worker capability set not verified')+
  ' / HTTP '+response.status+' / reported '+(payload?.codeRelease||'unavailable'));
 const itemTextReady=deployed&&Number(release?.[1]||0)>=351&&
  payload.ownerEditors?.includes('bilingual-item-text');
 console.log((itemTextReady?'OK  ':'WARN')+' Live English item editing in D1 — '+
  (itemTextReady?'Worker 0.351.0+ supports EN text overrides':
   'deploy the reviewed Worker source to enable English item edits'));
 const adminD1Ready=deployed&&Number(release?.[1]||0)>=354&&
  payload?.adminD1WriteCheck==='catalog-and-overrides';
 console.log((adminD1Ready?'OK  ':'WARN')+' Admin D1 write-check capability — '+
  (adminD1Ready?'Worker 0.354.0+ supports isolated catalog and owner edits':
   'deploy Worker 0.354.0; no authenticated production write has been attempted'));

 const liveSourceReady=deployed&&Number(release?.[1]||0)>=355&&
  payload?.catalogSourceFailover===true;
 const probeReady=deployed&&Number(release?.[1]||0)>=360&&
  payload?.sourceEgressProbe===true&&payload?.sourceInstancesArray===true&&
  payload?.sourceFullProbe===true;
 console.log((probeReady?'OK  ':'WARN')+' Worker game-source egress probe — '+
  (probeReady?'read-only /api/source-health is available':'Worker 0.360.0 has not been deployed'));
 console.log((liveSourceReady?'OK  ':'WARN')+' Admin current-game source recovery — '+
  (liveSourceReady?'Worker 0.355.0+ supports two trusted source aliases':
   'Deploy Worker 0.355.0; upstream availability still requires a real admin check'));

}catch(error){
 console.log('WARN Worker runtime capability marker — '+error.message);
}

 // A published D1 catalog may work even if the Worker cannot reach the
 // external game source right now. Probe egress, not merely API capability.
try{
 const {response,payload}=await read(worker+'/api/source-health',{cors:true});
 const signal=classifyGameSource(response.status,payload);
 console.log((signal.healthy?'OK  ':'WARN')+
  ' Worker to current-game source — '+
  (signal.healthy?'game source reachable':'upstream temporarily unavailable; D1 checked separately')+
  ' / HTTP '+response.status+
  (signal.healthy?'':' / '+signal.reason));
}catch(error){
 console.log('WARN Worker to current-game source — probe unavailable; D1 checked separately');
}

try{
 const {response}=await read(worker+'/api/health',{method:'OPTIONS',cors:true});
 check(response.status===204&&response.headers.get('access-control-allow-origin')===origin,
  'Worker OPTIONS preflight');
}catch(e){check(false,'Worker OPTIONS preflight',e.message)}
for(const name of sets){
 try{
  const {response,payload}=await read(worker+'/api/catalog/'+name+'.json',{cors:true});
  const valid=payload!==null&&typeof payload==='object'&&Object.keys(payload).length>0;
  check(response.ok&&valid&&response.headers.get('x-ps-catalog')==='d1'&&
   response.headers.get('access-control-allow-origin')===origin,
   'D1 dataset '+name,response.status+' / source '+(response.headers.get('x-ps-catalog')||'unknown'));
 }catch(e){check(false,'D1 dataset '+name,e.message)}
}
console.log(failures?'Connection diagnostics: '+failures+' check(s) need attention.':'Connection diagnostics: all queried checks passed.');
if(failures)process.exitCode=1;

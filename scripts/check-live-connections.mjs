/* Read-only diagnostic of Pages <-> Cloudflare Worker <-> D1.
   No secrets, account login, database mutation or GitHub Actions. Node 20+. */
import {readFileSync} from 'node:fs';
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
try{
 const {response,payload}=await read(worker+'/api/health',{cors:true});
 check(response.status===200&&payload?.status==='ok'&&payload?.storage==='d1',
  'Worker and D1 health',response.status+' / '+(payload?.status??'unknown'));
 check(response.headers.get('access-control-allow-origin')===origin,'Worker GET CORS');
 check(payload?.features?.sharing===true,'D1 sharing tables','migration 0003 required if false');
 check(payload?.features?.catalog===true,'D1 active catalog publication','publish own catalog if false');
}catch(e){check(false,'Worker and D1 health',e.message)}
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

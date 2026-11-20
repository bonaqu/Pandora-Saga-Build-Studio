import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

// GitHub Pages still uses branch publishing. The ordinary Pages build may
// occasionally fail to start after a successful protected-branch merge.
// Only the current protected head may request a rebuild, and only when the
// verified public release is genuinely older. Never touch Worker or D1.
const SITE='https://bonaqu.github.io/Pandora-Saga-Build-Studio/site-version.json';
const RELEASE=/^\d{4}\.\d{1,2}\.\d{1,2}\.\d+$/;
const REPO=/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export function compareRelease(a,b){
 if(!RELEASE.test(a)||!RELEASE.test(b))throw Error('Invalid release format');
 const left=a.split('.').map(Number),right=b.split('.').map(Number);
 for(let i=0;i<4;i++)if(left[i]!==right[i])return left[i]>right[i]?1:-1;
 return 0;
}

// Adapter implementations can stall after HTTP headers or ignore abort.
// The same one-shot signal settles both stages and cannot leave a job stuck.
async function boundedOperation(operation,signal){
 if(signal.aborted)throw signal.reason||Error('Request cancelled');
 return new Promise((resolve,reject)=>{
  let done=false;
  const finish=(fn,value)=>{
   if(done)return;
   done=true;
   signal.removeEventListener('abort',onAbort);
   fn(value);
  };
  const onAbort=()=>finish(reject,signal.reason||Error('Request cancelled'));
  signal.addEventListener('abort',onAbort,{once:true});
  try{Promise.resolve(operation()).then(value=>finish(resolve,value),
   error=>finish(reject,error))}
  catch(error){finish(reject,error)}
 });
}

export async function recoverStalePages({
 expected,repository,token,fetcher=fetch,clock=Date.now,timeoutMs=12000
}={}){
 if(typeof expected!=='string'||!RELEASE.test(expected)||
  typeof repository!=='string'||!REPO.test(repository)||
  typeof fetcher!=='function')throw Error('Invalid Pages release recovery inputs');
 const signal=AbortSignal.timeout(timeoutMs);
 const versionResponse=await boundedOperation(()=>fetcher(
  SITE+'?recovery='+clock(),{cache:'no-store',signal}),signal);
 if(!versionResponse?.ok)throw Error('Public Pages version is unavailable; no rebuild requested');
 const manifest=await boundedOperation(()=>versionResponse.json(),signal);
 const live=manifest?.release;
 if(typeof live!=='string'||!RELEASE.test(live))
  throw Error('Malformed public release manifest; no rebuild requested');
 if(compareRelease(live,expected)>=0)return {status:'current',live,expected};
 // Untrusted public text never enters an API URL, filename, shell, or Git ref.
 if(typeof token!=='string'||!token)
  throw Error('Pages rebuild permissions unavailable');
 const requestSignal=AbortSignal.timeout(timeoutMs);
 const endpoint='https://api.github.com/repos/'+repository+'/pages/builds';
 const buildResponse=await boundedOperation(()=>fetcher(endpoint,{
  method:'POST',signal:requestSignal,
  headers:{
   Accept:'application/vnd.github+json',
   'X-GitHub-Api-Version':'2026-03-10',
   Authorization:'Bearer '+token
  }
 }),requestSignal);
 if(buildResponse?.status!==201)
  throw Error('GitHub Pages rebuild rejected (HTTP '+String(buildResponse?.status||0)+')');
 return {status:'requested',live,expected};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const expected=JSON.parse(readFileSync(new URL('../site-version.json',import.meta.url),'utf8')).release;
 recoverStalePages({expected,repository:process.env.GITHUB_REPOSITORY,
  token:process.env.GITHUB_TOKEN})
 .then(result=>console.log('Pages recovery: '+result.status+'; public '+
  result.live+'; protected branch '+result.expected))
 .catch(error=>{console.error('Pages recovery failed: '+error.message);process.exitCode=1});
}

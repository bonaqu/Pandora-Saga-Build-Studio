// One-off cleanup of explicitly audited, obsolete GitHub branches.
// The production branch and any ref moved since the audit are never deleted.
const AUDITED=Object.freeze({
 'codex/account-public-errors-877-final':'30f7a7127a2c1175c55f4e37f281b12dfa552546',
 'feat/615-atomic-status-833-stack':'03bd6328336e57625b58afa0bdbe3506216f81be',
 'feat/615-model-references-831':'03fa448417303684f9eb9d3b38a2c5483bd6f927',
 'feat/615-source-contract-registry-832-stack':'b871a72f8562942659df6161ab252d1255d20318',
 'fix/615-ammo-support-source-parity-844':'b20637283b47375b55b3d5af90de75aed55c223f',
 'fix/615-legacy-link-metadata-842':'2aaeb48da0fc898d9685c3e7770e807014769e9d',
 'fix/615-replay-complete-loss-audit-843':'3da85adf72bd907347fe1126292cdc79809a0164',
 'fix/615-specialized-situational-source-parity-845':'27e55575cc05785c66fc298d9e548670d73958a1',
 'fix/615-tactical-metadata-841':'e4fc5053fbd646c2650c4bee9f9433f4f758e818',
 'fix/615-wiki-gear-artwork-846':'9e144fa3b1d5460b70e1b4a83c92cf82df9a28bc',
 'review/archive-promotion-regression-20261115':'defd5ffaad8b9418bc0f2ee1921871efe864d5f6',
 'work/946-direct-inline-editor-no-caption-pencils':'575b141939b407230531516a6b570fbb4e76f12c',
 'work/946-inline-editor-no-label-pencils':'3d5876165790dc769a7e8bce9568b083fc570621'
});
export const targets=AUDITED;
const API='https://api.github.com/repos/bonaqu/Pandora-Saga-Build-Studio/git/refs/heads/';
export async function prune({fetcher=fetch,token,repo,ref}){
 if(repo!=='bonaqu/Pandora-Saga-Build-Studio'||ref!=='refs/heads/bonaqu_projects')
  throw Error('Branch cleanup is permitted only on the protected production source');
 if(!token)throw Error('GITHUB_TOKEN is required for audited Git ref cleanup');
 const headers={Accept:'application/vnd.github+json',Authorization:'Bearer '+token,
  'X-GitHub-Api-Version':'2022-11-28'};
 const result={deleted:[],gone:[],moved:[],failed:[]};
 for(const [name,sha] of Object.entries(AUDITED)){
  if(name==='bonaqu_projects')throw Error('Refuse to delete the default branch');
  const url=API+name.split('/').map(encodeURIComponent).join('/');
  let response;
  try{response=await fetcher(url,{method:'GET',headers})}
  catch(error){result.failed.push({name,reason:'GET network: '+error.message});continue}
  if(response.status===404){result.gone.push(name);continue}
  if(response.status!==200){
   result.failed.push({name,reason:'GET HTTP '+response.status});continue
  }
  let actual;
  try{actual=(await response.json())?.object?.sha}
  catch(error){result.failed.push({name,reason:'Malformed ref response'});continue}
  if(actual!==sha){result.moved.push({name,expected:sha,actual});continue}
  // The GitHub REST API has no conditional DELETE ref endpoint. We rely on
  // immutable audit SHAs checked immediately before each DELETE; a concurrent
  // ref update is still theoretically possible and is surfaced on postflight.
  try{
   const removed=await fetcher(url,{method:'DELETE',headers});
   if(removed.status===204)result.deleted.push(name);
   else result.failed.push({name,reason:'DELETE HTTP '+removed.status});
  }catch(error){result.failed.push({name,reason:'DELETE network: '+error.message})}
 }
 return result;
}
if(process.argv[1]?.endsWith('/prune-audited-branches.mjs')){
 const result=await prune({token:process.env.GITHUB_TOKEN,
  repo:process.env.GITHUB_REPOSITORY,ref:process.env.GITHUB_REF});
 console.log(JSON.stringify(result,null,2));
 if(result.failed.length||result.moved.length)process.exitCode=1;
}

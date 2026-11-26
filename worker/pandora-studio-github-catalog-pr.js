/**
 * Administrator-only D1 game catalog -> GitHub pull-request bridge.
 * GitHub credential stays in a Cloudflare Worker Secret, never in the browser.
 * Repository and target paths are fixed, and the published D1 snapshot is read only.
 */
const REPO='bonaqu/Pandora-Saga-Build-Studio';
const BASE='bonaqu_projects';
const API='https://api.github.com/repos/'+REPO;
const SOURCES=Object.freeze([
 ['meta','meta'],['classes','classes'],['skills','skills'],['items','items'],
 ['souls','souls'],['monsters','monsters'],['drops','drops'],['maps','maps'],
 ['instances','instances'],['racialPassives','racialPassives'],['itemForth','itemForth'],
 ['unison','unison'],['trades','trades'],['tables','tables'],['expertise','expertise'],
 ['chests','chests'],['strings.en','stringsEn']
]);
const SERIALIZED=new Set(['tables','expertise','chests','stringsEn']);
const validSnapshot=value=>typeof value==='string'&&/^[a-z0-9-]{8,64}$/.test(value);
const fault=(message,status=502)=>Object.assign(new Error(message),{status});
export const githubCatalogEnabled=env=>typeof env?.GITHUB_CATALOG_TOKEN==='string'&&env.GITHUB_CATALOG_TOKEN.length>=20;

async function gh(env,path,{method='GET',body=null,optional=false}={}){
 const response=await fetch(API+path,{
  method,redirect:'manual',signal:AbortSignal.timeout(20000),
  headers:{Authorization:'Bearer '+env.GITHUB_CATALOG_TOKEN,
   Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',
   'User-Agent':'Pandora-Studio-Catalog-Sync',
   ...(body?{'Content-Type':'application/json'}:{})},
  ...(body?{body:JSON.stringify(body)}:{})
 });
 if(optional&&response.status===404)return null;
 if(!response.ok){
  let hint='';
  try{hint=String((await response.json())?.message||'').slice(0,130)}catch{}
  throw fault('GitHub HTTP '+response.status+(hint?': '+hint:''),response.status===403?503:502);
 }
 return response.json();
}
// Authenticated read-only GitHub token diagnostics. A configured secret by
// itself is not proof the credential works or grants repository write access.
export async function githubCatalogReadiness(env){
 if(!githubCatalogEnabled(env))return {configured:false};
 try{
  const [repository,reference]=await Promise.all([
   gh(env,''),gh(env,'/git/ref/heads/'+BASE)
  ]);
  if(!repository||repository.full_name!==REPO||
    !/^[a-f0-9]{40}$/.test(reference?.object?.sha||''))
   return {configured:true,connected:false,writeAccess:null};
  const permission=repository.permissions?.push;
  return {configured:true,connected:true,
   writeAccess:typeof permission==='boolean'?permission:null};
 }catch{
  return {configured:true,connected:false,writeAccess:null};
 }
}
const unpack=row=>JSON.parse(row.payload);
export async function readPublishedGameCatalog(db,active){
 if(!validSnapshot(active?.snapshot))throw fault('Invalid published catalog',409);
 let counts;
 try{counts=JSON.parse(active.expected_counts)}catch{throw fault('Invalid published counts',409)}
 const data={};
 for(const [source,name] of [...SOURCES,['tradeMeta','tradeMeta']]){
  const expected=Number(counts[name]);
  if(!Number.isSafeInteger(expected)||expected<1)throw fault('Missing dataset '+name,409);
  const response=await db.prepare(
   'SELECT record_key,payload FROM catalog_entries WHERE snapshot=? AND dataset=? ORDER BY record_key'
  ).bind(active.snapshot,name).all();
  const rows=response.results||[];
  if(rows.length!==expected)throw fault('Incomplete published dataset '+name,409);
  if(name==='meta')data[source]=unpack(rows[0]);
  else if(SERIALIZED.has(name))
   data[source]=JSON.parse(rows.map(row=>unpack(row).data).join(''));
  else if(name==='instances')data[source]=rows.map(unpack);
  else if(name==='trades')data[source]={trades:rows.map(unpack)};
  else if(name==='tradeMeta')data[source]=unpack(rows[0]);
  else data[source]=Object.fromEntries(rows.map(row=>[row.record_key,unpack(row)]));
 }
 data.trades={...data.trades,...data.tradeMeta};
 delete data.tradeMeta;
 if(data['strings.en']?.locale!=='en'||!data.meta?.counts)
  throw fault('Published metadata is inconsistent',409);
 return data;
}
const validPull=pull=>typeof pull?.html_url==='string'&&
 /^https:\/\/github\.com\/bonaqu\/Pandora-Saga-Build-Studio\/pull\/\d+$/.test(pull.html_url)&&
 Number.isSafeInteger(pull.number)&&pull.number>0;

// Git's SHA-1 blob envelope is deterministic. A stranded catalog branch must
// match EACH source JSON from the active D1 snapshot before we can restore its
// missing PR. Never reuse arbitrary branches named like a catalog snapshot.
async function gitBlobSha(content){
 const encoder=new TextEncoder(),body=encoder.encode(content);
 const envelope=encoder.encode('blob '+body.byteLength+'\0');
 const bytes=new Uint8Array(envelope.length+body.length);
 bytes.set(envelope);bytes.set(body,envelope.length);
 const hash=new Uint8Array(await crypto.subtle.digest('SHA-1',bytes));
 return Array.from(hash,n=>n.toString(16).padStart(2,'0')).join('');
}
async function verifyStrandedCatalogBranch(env,active,snapshot,sha){
 if(!/^[a-f0-9]{40}$/.test(sha||''))throw fault('Invalid catalog branch reference',409);
 const [base,commit]=await Promise.all([
  gh(env,'/git/ref/heads/'+BASE),gh(env,'/git/commits/'+sha)
 ]);
 const baseSha=base?.object?.sha;
 if(!/^[a-f0-9]{40}$/.test(baseSha||'')||
  commit?.message!=='catalog: reviewed game data snapshot '+snapshot||
  commit?.parents?.length!==1||commit.parents[0]?.sha!==baseSha||
  !/^[a-f0-9]{40}$/.test(commit?.tree?.sha||''))
  throw fault('Catalog branch is not a verified child of the current base',409);
 const diff=await gh(env,'/compare/'+baseSha+'...'+sha);
 const allowed=new Set(SOURCES.map(([name])=>'data/os/'+name+'.json'));
 if(!Array.isArray(diff?.files)||diff.files.length<1||
   diff.files.length>SOURCES.length||diff.files.some(file=>
    !allowed.has(file.filename)||!['added','modified'].includes(file.status)))
  throw fault('Catalog branch contains unexpected changes',409);
 const nextTree=async(current,name)=>{
  const tree=await gh(env,'/git/trees/'+current);
  if(tree.truncated===true||!Array.isArray(tree.tree))
   throw fault('Catalog tree incomplete',409);
  const match=tree.tree.find(row=>row.path===name&&row.type==='tree');
  if(!/^[a-f0-9]{40}$/.test(match?.sha||''))
   throw fault('Missing expected catalog directory',409);
  return match.sha;
 };
 const dataTree=await nextTree(commit.tree.sha,'data');
 const osTree=await nextTree(dataTree,'os');
 const directory=await gh(env,'/git/trees/'+osTree);
 if(directory.truncated===true||!Array.isArray(directory.tree))
  throw fault('Catalog tree incomplete',409);
 const catalog=await readPublishedGameCatalog(env.DB,active);
 for(const [name] of SOURCES){
  const file=directory.tree.find(row=>
   row.path===name+'.json'&&row.type==='blob'&&row.mode==='100644');
  const expected=await gitBlobSha(JSON.stringify(catalog[name])+'\n');
  if(file?.sha!==expected)
   throw fault('The stranded catalog branch differs from published D1: '+name,409);
 }
 return true;
}
export async function createCatalogPullRequest(env,active,activeSnapshot){
 if(!githubCatalogEnabled(env))throw fault('GitHub PR integration not configured',503);
 const snapshot=active?.snapshot;
 if(!validSnapshot(snapshot))throw fault('Invalid published snapshot',409);
 const branch='catalog/snapshot-'+snapshot;
 const ref='/git/ref/heads/'+branch;
 const existing=await gh(env,ref,{optional:true});
 if(existing){
  const pulls=await gh(env,'/pulls?state=open&head=bonaqu%3A'+encodeURIComponent(branch));
  if(Array.isArray(pulls)&&pulls.length){
   const pull=pulls[0];
   if(!validPull(pull)||pull.head?.ref!==branch||pull.base?.ref!==BASE)
    throw fault('Unexpected open catalog PR identity',409);
   return {url:pull.html_url,number:pull.number,reused:true};
  }
  // A previous request can create the Git branch successfully but time out
  // before GitHub creates the PR. Verify all 17 exact D1 file hashes and
  // ensure the branch has no code changes before resuming automatically.
  await verifyStrandedCatalogBranch(env,active,snapshot,existing?.object?.sha);
  if(await activeSnapshot()!==snapshot)
   throw fault('Published catalog changed before GitHub PR recovery',409);
  const restored=await gh(env,'/pulls',{method:'POST',body:{
   title:'catalog: reviewed game-data update ('+snapshot+')',
   head:branch,base:BASE,
   body:'Recovered verified D1 game-data backup after an interrupted PR request.\n\n'+
    'Current published D1 snapshot: '+snapshot+'\n'+
    'All 17 JSON blobs were verified against the live D1 snapshot.\n'+
    'Node and Chromium must pass before automatic merging.'
  }});
  if(!validPull(restored))throw fault('GitHub returned an invalid recovered PR',502);
  return {url:restored.html_url,number:restored.number,reused:false,recovered:true};
 }
 const catalog=await readPublishedGameCatalog(env.DB,active);
 const base=await gh(env,'/git/ref/heads/'+BASE),baseSha=base?.object?.sha;
 if(!/^[a-f0-9]{40}$/.test(baseSha||''))throw fault('Invalid GitHub base reference');
 const commit=await gh(env,'/git/commits/'+baseSha),treeSha=commit?.tree?.sha;
 if(!/^[a-f0-9]{40}$/.test(treeSha||''))throw fault('Invalid GitHub base tree');
 const blobs=[];
 for(let i=0;i<SOURCES.length;i+=4){
  const group=await Promise.all(SOURCES.slice(i,i+4).map(async([name])=>{
   const blob=await gh(env,'/git/blobs',{method:'POST',
    body:{content:JSON.stringify(catalog[name])+'\n',encoding:'utf-8'}});
   if(!/^[a-f0-9]{40}$/.test(blob?.sha||''))throw fault('GitHub blob upload failed');
   return {path:'data/os/'+name+'.json',mode:'100644',type:'blob',sha:blob.sha};
  }));
  blobs.push(...group);
 }
 const tree=await gh(env,'/git/trees',{method:'POST',body:{base_tree:treeSha,tree:blobs}});
 if(!/^[a-f0-9]{40}$/.test(tree?.sha||''))throw fault('GitHub catalog tree missing');
 if(tree.sha===treeSha)return {unchanged:true};
 if(await activeSnapshot()!==snapshot)
  throw fault('Published catalog changed during GitHub PR preparation',409);
 const freshBase=await gh(env,'/git/ref/heads/'+BASE);
 if(freshBase?.object?.sha!==baseSha)throw fault('GitHub base branch changed. Retry.',409);
 const next=await gh(env,'/git/commits',{method:'POST',body:{
  message:'catalog: reviewed game data snapshot '+snapshot,tree:tree.sha,parents:[baseSha]}});
 if(!/^[a-f0-9]{40}$/.test(next?.sha||''))throw fault('GitHub commit failed');
 try{
  await gh(env,'/git/refs',{method:'POST',body:{ref:'refs/heads/'+branch,sha:next.sha}});
 }catch(error){
  // A dropped response after GitHub accepted the branch is recoverable.
  // A different conflicting branch must never be overwritten.
  const created=await gh(env,ref,{optional:true});
  if(created?.object?.sha!==next.sha)throw error;
 }
 const pull=await gh(env,'/pulls',{method:'POST',body:{
  title:'catalog: reviewed game-data update ('+snapshot+')',
  head:branch,base:BASE,
  body:'Reviewed game-data update from an authenticated site administrator.\n\n'+
   'Current published D1 snapshot: '+snapshot+'\n'+
   'Only the 17 stable data/os JSON files are changed.\n'+
   'Review the diff and wait for Node and Chromium checks before merging.\n'+
   'No player accounts, passwords or Cloudflare settings are included.'
 }});
 if(!validPull(pull))throw fault('Unexpected GitHub pull request URL');
 return {url:pull.html_url,number:pull.number,reused:false};
}

const OWNER_PATH='data/admin/encyclopedia-overrides.json';
const ownerKey=/^(?:itemedit|item|itemdesc|itemslots|acquireedit|tradeedit|chestedit|dropedit|spawnedit)\.[0-9]{1,15}$|^wikiedit\.(?:monster|map|npc|instance|skill|soul)\.[0-9]{1,15}$|^wikiedit\.(?:map\.(?:astir-(?:union|empire|kingdom)|el-beht|astir-underground|custom-[a-z0-9-]{6,42})|npc\.(?:astir-npc-(?:union|empire|kingdom)-[a-z0-9-]{1,32}|owner-npc-[a-f0-9]{16})|monster\.owner-monster-[a-z0-9]{12,24})$|^guideedit\.(?:book\.[a-z][a-z0-9._:-]{1,80}|honor\.(?:overview|rank\.(?:[0-9]|1[01])|zones|wars))$|^(?:skill|skilldesc)\.[A-Za-z0-9_-]{1,32}\.[0-9]{1,12}$|^soul\.[A-Za-z0-9_.-]{1,70}$/;
async function ownerPayload(env){
 const rows=(await env.DB.prepare('SELECT key,value FROM overrides ORDER BY key').all()).results||[];
 const selected=rows.filter(row=>ownerKey.test(row.key)&&typeof row.value==='string');
 if(selected.length>3000)throw fault('Too many administrator edits to export',409);
 const content=JSON.stringify({schema:1,source:'Cloudflare D1 owner overrides',
  overrides:Object.fromEntries(selected.map(row=>[row.key,row.value]))},null,2)+'\n';
 if(content.length>450000)throw fault('Owner overrides export exceeds safe size',409);
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(content));
 const fingerprint=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,16);
 return {count:selected.length,content,fingerprint};
}
export async function previewOwnerOverrides(env){
 const {count,fingerprint}=await ownerPayload(env);
 return {count,fingerprint,configured:githubCatalogEnabled(env)};
}
export async function createOwnerOverridesPullRequest(env,expectedFingerprint){
 if(!githubCatalogEnabled(env))throw fault('GitHub PR integration not configured',503);
 if(typeof expectedFingerprint!=='string'||!/^[a-f0-9]{16}$/.test(expectedFingerprint))
  throw fault('Owner review fingerprint required',409);
 const source=await ownerPayload(env);
 if(source.fingerprint!==expectedFingerprint)
  throw fault('Admin edits changed. Review them again before GitHub sync.',409);
 if(!source.count)throw fault('No encyclopedia edits to export',409);
 const branch='catalog/owner-'+source.fingerprint;
 const existing=await gh(env,'/git/ref/heads/'+branch,{optional:true});
 if(existing){
  const pulls=await gh(env,'/pulls?state=open&head=bonaqu%3A'+encodeURIComponent(branch));
  if(Array.isArray(pulls)&&pulls.length)
   return {url:pulls[0].html_url,number:pulls[0].number,reused:true};
  throw fault('Owner export branch exists without an open PR. Review it on GitHub.',409);
 }
 const base=await gh(env,'/git/ref/heads/'+BASE),baseSha=base?.object?.sha;
 if(!/^[a-f0-9]{40}$/.test(baseSha||''))throw fault('Invalid base commit');
 const commit=await gh(env,'/git/commits/'+baseSha),treeSha=commit?.tree?.sha;
 const blob=await gh(env,'/git/blobs',{method:'POST',
  body:{content:source.content,encoding:'utf-8'}});
 if(!/^[a-f0-9]{40}$/.test(blob?.sha||''))throw fault('GitHub owner blob upload failed');
 const tree=await gh(env,'/git/trees',{method:'POST',body:{base_tree:treeSha,tree:[
  {path:OWNER_PATH,mode:'100644',type:'blob',sha:blob.sha}]}});
 if(tree.sha===treeSha)return {unchanged:true,count:source.count};
 const after=await ownerPayload(env);
 if(after.fingerprint!==source.fingerprint)throw fault('Admin edits changed during export',409);
 const fresh=await gh(env,'/git/ref/heads/'+BASE);
 if(fresh?.object?.sha!==baseSha)throw fault('GitHub base changed. Retry.',409);
 const next=await gh(env,'/git/commits',{method:'POST',body:{
  message:'catalog: reviewed owner encyclopedia overrides '+source.fingerprint,
  tree:tree.sha,parents:[baseSha]}});
 await gh(env,'/git/refs',{method:'POST',body:{ref:'refs/heads/'+branch,sha:next.sha}});
 const pull=await gh(env,'/pulls',{method:'POST',body:{
  title:'catalog: review encyclopedia owner changes ('+source.count+')',
  head:branch,base:BASE,
  body:'Administrator-reviewed encyclopedia overrides from production D1.\n\n'+
   'The original game catalog JSON files are not replaced.\n'+
   'Review all editable descriptions and notes before merging because PRs are public.\n'+
   'This is a versioned export, NOT an automatic restore to D1.\n'+
   'No account, login, password, session or Cloudflare secrets are exported.'
 }});
 if(!/^https:\/\/github\.com\/bonaqu\/Pandora-Saga-Build-Studio\/pull\/\d+$/.test(pull?.html_url||''))
  throw fault('Unexpected PR URL');
 return {url:pull.html_url,number:pull.number,reused:false,count:source.count};
}


// Owner-only read-only backup status for the admin dashboard. Outbox "done"
// means "PR created", NOT that Github's tested fallback reached main.
export async function githubCatalogBackupStage(env,snapshot,job){
 const common={snapshot};
 if(!job)return {...common,state:'not_started'};
 if(['pending','running','retry'].includes(job.state))
  return {...common,state:'working'};
 if(job.state==='attention')return {...common,state:'attention'};
 if(job.state==='superseded')return {...common,state:'superseded'};
 if(job.state!=='done')return {...common,state:'unavailable'};
 if(job.result?.unchanged===true)return {...common,state:'synced'};
 const number=job.result?.number;
 if(!Number.isSafeInteger(number)||number<1||!githubCatalogEnabled(env))
  return {...common,state:'unavailable'};
 try{
  const pr=await gh(env,'/pulls/'+number);
  // Report a result only for the exact D1 snapshot/branch, never an
  // unrelated PR or a different catalog revision.
  if(pr?.number!==number||pr?.head?.ref!=='catalog/snapshot-'+snapshot||
     pr?.base?.ref!==BASE||!validPull(pr))
   return {...common,state:'attention'};
  const result={...common,number,url:pr.html_url};
  if(pr.merged===true)return {...result,state:'synced'};
  if(pr.state!=='open')return {...result,state:'attention'};
  const sha=pr.head?.sha;
  if(!/^[0-9a-f]{40}$/.test(String(sha||'')))
   return {...result,state:'unavailable'};
  const params=new URLSearchParams({event:'pull_request',head_sha:sha,per_page:'60'});
  const rows=(await gh(env,'/actions/runs?'+params.toString()))?.workflow_runs||[];
  const names=['Studio quality checks','Chromium browser smoke'];
  const latest=names.map(name=>rows.find(r=>r.name===name&&r.event==='pull_request'&&
   r.head_sha===sha));
  if(latest.some(r=>r?.status==='completed'&&
   ['failure','timed_out','cancelled','action_required'].includes(r.conclusion)))
   return {...result,state:'attention'};
  return {...result,state:'checking'};
 }catch{return {...common,state:'unavailable'}}
}

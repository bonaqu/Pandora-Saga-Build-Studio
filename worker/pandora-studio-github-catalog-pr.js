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
  method,redirect:'error',signal:AbortSignal.timeout(20000),
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
export async function createCatalogPullRequest(env,active,activeSnapshot){
 if(!githubCatalogEnabled(env))throw fault('GitHub PR integration not configured',503);
 const snapshot=active?.snapshot;
 if(!validSnapshot(snapshot))throw fault('Invalid published snapshot',409);
 const branch='catalog/snapshot-'+snapshot;
 const ref='/git/ref/heads/'+branch;
 const existing=await gh(env,ref,{optional:true});
 if(existing){
  const pulls=await gh(env,'/pulls?state=open&head=bonaqu%3A'+encodeURIComponent(branch));
  if(Array.isArray(pulls)&&pulls.length)
   return {url:pulls[0].html_url,number:pulls[0].number,reused:true};
  throw fault('The catalog branch already exists. Inspect it in GitHub before retrying.',409);
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
 await gh(env,'/git/refs',{method:'POST',body:{ref:'refs/heads/'+branch,sha:next.sha}});
 const pull=await gh(env,'/pulls',{method:'POST',body:{
  title:'catalog: reviewed game-data update ('+snapshot+')',
  head:branch,base:BASE,
  body:'Reviewed game-data update from an authenticated site administrator.\n\n'+
   'Current published D1 snapshot: '+snapshot+'\n'+
   'Only the 17 stable data/os JSON files are changed.\n'+
   'Review the diff and wait for Node and Chromium checks before merging.\n'+
   'No player accounts, passwords or Cloudflare settings are included.'
 }});
 if(!/^https:\/\/github\.com\/bonaqu\/Pandora-Saga-Build-Studio\/pull\/\d+$/.test(pull?.html_url||''))
  throw fault('Unexpected GitHub pull request URL');
 return {url:pull.html_url,number:pull.number,reused:false};
}

#!/usr/bin/env node
// Trusted GitHub Actions worker: original artwork only. This is deliberately
// NOT executed from PR code with a privileged token.
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const REPO='bonaqu/Pandora-Saga-Build-Studio',BASE='bonaqu_projects';
const FLOW=['Studio quality checks','Chromium browser smoke'];
const REFS=['quality.yml','browser-smoke.yml'];
const api='https://api.github.com/repos/'+REPO;
const run=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const wait=ms=>new Promise(r=>setTimeout(r,ms));
export function permittedFiles(changed){
 return Array.isArray(changed)&&changed.length>0&&changed.length<=600&&
  new Set(changed).size===changed.length&&changed.every(path=>
   path==='assets/os-icon-manifest.json'||
   path==='assets/wiki/honor-victories.jpg'||
   /^assets\/(items|skills|souls)\/icons\/[A-Za-z0-9_-]{1,120}\.webp$/.test(path));
}
export function eligibleMirrorPR({pr,files,sourceSha,currentBase,checks}={}){
 if(!pr||pr.state!=='open'||pr.draft||pr.base?.ref!==BASE||
  pr.base?.sha!==sourceSha||currentBase!==sourceSha||
  !/^catalog\/original-icons-[a-f0-9]{12}$/.test(pr.head?.ref||'')||
  pr.head?.repo?.full_name!==REPO||pr.base?.repo?.full_name!==REPO||
  !Number.isSafeInteger(pr.changed_files)||
  pr.changed_files!==(files||[]).length||
  !permittedFiles((files||[]).map(f=>f.filename))||
  files.some(row=>!['modified','added'].includes(row.status)))return false;
 return FLOW.every(name=>checks?.some(x=>x.name===name&&
  x.head_sha===pr.head.sha&&x.event==='workflow_dispatch'&&
  x.status==='completed'&&x.conclusion==='success'));
}
async function main(){
 const token=process.env.GITHUB_TOKEN;
 if(process.env.GITHUB_ACTIONS!=='true'||!token)throw Error('GitHub Actions only');
 const baseline=run('rev-parse','HEAD');
 if(!/^[a-f0-9]{40}$/.test(baseline))throw Error('Invalid base SHA');
 const diff=run('diff','--name-only','--','assets').split('\n').filter(Boolean);
 const untracked=run('ls-files','--others','--exclude-standard','--','assets')
  .split('\n').filter(Boolean);
 const changes=[...new Set([...diff,...untracked])];
 if(!changes.length){console.log('No new verified original artwork; no PR');return}
 if(!permittedFiles(changes))
  throw Error('Unapproved asset changes: '+changes.join(', '));
 // The offline audit has already validated canonical manifest and WebP bytes.
 const branch='catalog/original-icons-'+baseline.slice(0,12);
 run('config','user.name','github-actions[bot]');
 run('config','user.email','41898282+github-actions[bot]@users.noreply.github.com');
 run('checkout','-b',branch);
 run('add','--',...changes);
 run('commit','-m','assets: reconcile original catalog WebP files');
 const head=run('rev-parse','HEAD');
 run('push','origin','HEAD:'+branch);
 const call=async(path,method='GET',value)=>{
  const r=await fetch(api+path,{method,
   headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28',
    ...(value?{'Content-Type':'application/json'}:{})},
   ...(value?{body:JSON.stringify(value)}:{}),
   signal:AbortSignal.timeout(25000)});
  if(!r.ok)throw Error('GitHub '+method+' '+path+' HTTP '+r.status+
   ' '+(await r.text()).slice(0,250));
  return r.status===204?null:r.json();
 };
 // Inspect every approved asset diff, not only GitHub's first 100 files.
 // For 100+ recovered originals, silently authorizing a partial page is unsafe.
 const listPRFiles=async number=>{
  const rows=[];
  for(let page=1;page<=6;page++){
   const chunk=await call('/pulls/'+number+'/files?per_page=100&page='+page);
   if(!Array.isArray(chunk)||chunk.length>100)
    throw Error('GitHub returned an invalid asset diff page');
   rows.push(...chunk);
   if(chunk.length<100)break;
  }
  if(rows.length>600)throw Error('Icon PR exceeds bounded asset audit');
  return rows;
 };
 const original=await call('/git/ref/heads/'+BASE);
 if(original?.object?.sha!==baseline)
  throw Error('Main branch changed during icon preparation; do not create stale PR');
 const pr=await call('/pulls','POST',{base:BASE,head:branch,
  title:'assets: original icons for catalog ('+baseline.slice(0,12)+')',
  body:'Automatic original-only WebP reconciliation after verified release. '+
   'Exact source IDs, offline RIFF validation and full catalog icon audit. '+
   'No D1 or gameplay changes. Node and Chromium must pass on the exact SHA.'});
 console.log('Created original image PR #'+pr.number+' '+head);
 // GITHUB_TOKEN-created pull_request events cannot start Actions themselves.
 // Explicit workflow_dispatch events are allowed and run the exact PR branch.
 for(const workflow of REFS)await call('/actions/workflows/'+workflow+'/dispatches',
  'POST',{ref:branch});
 const deadline=Date.now()+22*60_000;
 while(Date.now()<deadline){
  await wait(16000);
  const all=await call('/actions/runs?branch='+encodeURIComponent(branch)+
   '&event=workflow_dispatch&per_page=50');
  const current=all.workflow_runs.filter(x=>x.head_sha===head&&
   FLOW.includes(x.name));
  if(FLOW.every(name=>current.some(x=>x.name===name&&
     x.status==='completed'))){
   if(current.some(x=>x.conclusion!=='success'))throw Error(
    'Original icons CI failed on '+head);
   const [details,prFiles,latest]=await Promise.all([
    call('/pulls/'+pr.number),
    listPRFiles(pr.number),
    call('/git/ref/heads/'+BASE)
   ]);
   if(details.head.sha!==head||!eligibleMirrorPR({
    pr:details,files:prFiles,sourceSha:baseline,
    currentBase:latest.object.sha,checks:current
   }))throw Error('Original icon PR no longer satisfies exact SHA / base policy');
   const merge=await call('/pulls/'+pr.number+'/merge','PUT',{
    sha:head,merge_method:'squash',
    commit_title:'assets: auto-publish verified original icons'});
   if(merge?.merged!==true)throw Error('GitHub refused original icon merge');
   console.log('Verified original icon PR #'+pr.number+' merged at '+merge.sha);
   // GITHUB_TOKEN-made merges do not always schedule a fresh Pages build.
   // Request the built-in Pages rebuild explicitly; never rewrite game data.
   try{
    await call('/pages/builds','POST',{});
    console.log('Requested Pages rebuild for verified artwork');
   }catch(error){
    console.warn('Automatic Pages build request was unavailable: '+error.message);
   }
   try{await call('/actions/workflows/live-readonly.yml/dispatches',
     'POST',{ref:BASE})}
   catch(error){console.warn('Read-only follow-up could not be dispatched: '+error.message)}
   return;
  }
 }
 throw Error('Original image CI not completed before safety deadline; PR left unmerged');
}
if(process.argv[1]?.endsWith('/catalog-icon-reconcile-ci.mjs'))
 main().catch(e=>{console.error(e);process.exitCode=1});

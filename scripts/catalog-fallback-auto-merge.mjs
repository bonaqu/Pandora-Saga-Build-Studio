/**
 * GitHub Actions-only automatic merge of trusted D1 catalog fallback PRs.
 * Read-only until both official PR suites have succeeded on the exact head.
 * Nothing in a PR branch is executed by this privileged workflow.
 */
import {readFileSync} from 'node:fs';

export const REPO='bonaqu/Pandora-Saga-Build-Studio';
export const BASE='bonaqu_projects';
export const SOURCE_NAMES=Object.freeze([
 'meta','classes','skills','items','souls','monsters','drops','maps','instances',
 'racialPassives','itemForth','unison','trades','tables','expertise','chests','strings.en'
]);
export const ALLOWED_FILES=Object.freeze(SOURCE_NAMES.map(name=>'data/os/'+name+'.json'));
export const REQUIRED_WORKFLOWS=Object.freeze(['Studio quality checks','Chromium browser smoke']);
const branchPattern=/^catalog\/snapshot-(ps-[a-z0-9-]{8,64})$/;
const exactObject=value=>value&&typeof value==='object'&&!Array.isArray(value);

export function assessCatalogPullRequest({event,pr,files,runs}){
 const trigger=event?.workflow_run;
 const snapshot=branchPattern.exec(String(pr?.head?.ref||''))?.[1];
 if(trigger?.conclusion!=='success'||trigger?.status!=='completed'||
  !REQUIRED_WORKFLOWS.includes(trigger?.name))
  return {ok:false,reason:'Not a successful catalog CI completion'};
 if(event?.repository?.full_name!==REPO||trigger?.head_repository?.full_name!==REPO)
  return {ok:false,reason:'Workflow originated outside the trusted repository'};
 if(pr?.state!=='open'||pr?.draft||!snapshot||pr.base?.ref!==BASE||
  pr.base?.repo?.full_name!==REPO||pr.head?.repo?.full_name!==REPO||
  !Number.isSafeInteger(pr.number)||pr.number<1)
  return {ok:false,reason:'Not an open trusted catalog-only PR'};
 if(trigger.head_branch!==pr.head.ref||trigger.head_sha!==pr.head.sha)
  return {ok:false,reason:'The PR head differs from the completed CI revision'};
 if(pr.title!=='catalog: reviewed game-data update ('+snapshot+')')
  return {ok:false,reason:'Unexpected PR identity'};
 if(!Array.isArray(files)||files.length<1||files.length>ALLOWED_FILES.length||
  pr.changed_files!==files.length||
  new Set(files.map(row=>row?.filename)).size!==files.length||
  files.some(row=>!ALLOWED_FILES.includes(row?.filename)||
   !['modified','added'].includes(row.status)))
  return {ok:false,reason:'Changes are not exactly the 17 approved catalog JSON files'};
 if(!Array.isArray(runs)||!REQUIRED_WORKFLOWS.every(name=>
  runs.some(run=>run?.name===name&&run?.event==='pull_request'&&
   run?.head_sha===pr.head.sha&&run?.head_repository?.full_name===REPO&&
   run?.status==='completed'&&run?.conclusion==='success')))
  return {ok:false,reason:'Both required PR suites must pass on the exact head SHA'};
 return {ok:true,snapshot,prNumber:pr.number,headSha:pr.head.sha};
}

const qs=params=>new URLSearchParams(params).toString();
export async function autoMergeFromEvent({event,fetcher=fetch,token,apiBase='https://api.github.com'}){
 const run=event?.workflow_run;
 if(!branchPattern.test(String(run?.head_branch||''))||
    event?.repository?.full_name!==REPO||
    run?.head_repository?.full_name!==REPO||
    run?.status!=='completed'||run?.conclusion!=='success'||
    !REQUIRED_WORKFLOWS.includes(run?.name))
  return {ok:false,reason:'Not an eligible completed catalog workflow'};
 if(typeof token!=='string'||token.length<10)
  throw Error('GitHub Actions token missing');
 const call=async(path,method='GET',payload=null)=>{
  const response=await fetcher(apiBase+path,{
   method,headers:{Authorization:'Bearer '+token,
    'Accept':'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28',
    ...(payload?{'Content-Type':'application/json'}:{})},
   ...(payload?{body:JSON.stringify(payload)}:{}),
   signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('GitHub '+method+' '+path.split('?')[0]+' HTTP '+response.status);
  return response.json();
 };
 const branch=run.head_branch;
 const pulls=await call('/repos/'+REPO+'/pulls?'+qs({state:'open',head:'bonaqu:'+branch,per_page:20}));
 if(!Array.isArray(pulls)||pulls.length!==1)
  return {ok:false,reason:'Expected exactly one open catalog PR'};
 const pr=await call('/repos/'+REPO+'/pulls/'+pulls[0].number);
 if(!Number.isSafeInteger(pr?.changed_files)||pr.changed_files<1||
    pr.changed_files>ALLOWED_FILES.length)
  return {ok:false,reason:'Pull request has an unexpected number of files'};
 const files=await call('/repos/'+REPO+'/pulls/'+pr.number+'/files?per_page=100');
 const workflowRuns=await call('/repos/'+REPO+'/actions/runs?'+qs({
  event:'pull_request',head_sha:pr.head.sha,per_page:100}));
 const assessed=assessCatalogPullRequest({event,pr,files,
  runs:workflowRuns?.workflow_runs});
 if(!assessed.ok)return assessed;
 // Conditional GitHub merge uses the expected exact head SHA. Concurrent PR
 // edits cannot silently publish a different catalog.
 const result=await call('/repos/'+REPO+'/pulls/'+pr.number+'/merge','PUT',{
  sha:assessed.headSha,merge_method:'squash',
  commit_title:'catalog: auto-publish verified fallback '+assessed.snapshot});
 if(result?.merged!==true)throw Error('GitHub did not confirm the fallback PR merge');
 return {ok:true,prNumber:pr.number,snapshot:assessed.snapshot,mergeSha:result.sha};
}
if(process.argv[1]?.endsWith('/catalog-fallback-auto-merge.mjs')){
 const file=process.env.GITHUB_EVENT_PATH,token=process.env.GITHUB_TOKEN;
 try{
  const event=JSON.parse(readFileSync(file,'utf8'));
  const result=await autoMergeFromEvent({event,token});
  console.log(JSON.stringify(result));
 }catch(error){console.error('Catalog fallback automation: '+error.message);process.exitCode=1}
}

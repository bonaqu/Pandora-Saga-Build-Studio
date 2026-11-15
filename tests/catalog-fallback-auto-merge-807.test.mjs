import test from 'node:test';
import assert from 'node:assert/strict';
import {ALLOWED_FILES,REPO,BASE,REQUIRED_WORKFLOWS,
 assessCatalogPullRequest,autoMergeFromEvent} from '../scripts/catalog-fallback-auto-merge.mjs';
const snapshot='ps-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const sha='f'.repeat(40);
function fixtures(){
 const head={ref:'catalog/snapshot-'+snapshot,sha,repo:{full_name:REPO}};
 const event={repository:{full_name:REPO},workflow_run:{
  name:REQUIRED_WORKFLOWS[0],status:'completed',conclusion:'success',
  head_branch:head.ref,head_sha:sha,head_repository:{full_name:REPO}}};
 const pr={number:52,state:'open',draft:false,
  title:'catalog: reviewed game-data update ('+snapshot+')',
  changed_files:17,head,base:{ref:BASE,repo:{full_name:REPO}}};
 const files=ALLOWED_FILES.map(filename=>({filename,status:'modified'}));
 const runs=REQUIRED_WORKFLOWS.map(name=>({name,event:'pull_request',
  head_sha:sha,head_repository:{full_name:REPO},status:'completed',conclusion:'success'}));
 return {event,pr,files,runs};
}
test('exactly 17 JSON files and both CI suites allow an atomic merge',()=>{
 const a=fixtures();
 assert.equal(assessCatalogPullRequest(a).ok,true);
 assert.equal(ALLOWED_FILES.length,17);
});
test('reject changed source code, extra paths and duplicates',()=>{
 const a=fixtures();
 for(const files of [[...a.files,{filename:'worker/index.js',status:'modified'}],
  a.files.map((r,i)=>i===1?{...r,filename:'index.html'}:r),
  [...a.files.slice(0,3),a.files[0]]]){
  assert.equal(assessCatalogPullRequest({...a,files}).ok,false);
 }
});

test('one-data-file or a subset is enough: Git diffs omit unchanged JSON blobs',()=>{
 const a=fixtures();
 for(const count of [1,2,8,16,17]){
  const files=a.files.slice(0,count);
  const pr={...a.pr,changed_files:count};
  assert.equal(assessCatalogPullRequest({...a,files,pr}).ok,true);
 }
 const files=a.files.slice(0,2);
 assert.equal(assessCatalogPullRequest({...a,files}).ok,false,
  'GitHub-reported changed_files must match the complete inspected file list');
});
test('reject missing, failing and stale CI suites',()=>{
 const a=fixtures();
 assert.equal(assessCatalogPullRequest({...a,runs:a.runs.slice(0,1)}).ok,false);
 assert.equal(assessCatalogPullRequest({...a,runs:a.runs.map((r,i)=>
  i===1?{...r,conclusion:'failure'}:r)}).ok,false);
 assert.equal(assessCatalogPullRequest({...a,runs:a.runs.map(r=>({...r,head_sha:'0'.repeat(40)}))}).ok,false);
});
test('reject unexpected title, draft, outside repo and new head',()=>{
 const a=fixtures();
 assert.equal(assessCatalogPullRequest({...a,pr:{...a.pr,draft:true}}).ok,false);
 assert.equal(assessCatalogPullRequest({...a,pr:{...a.pr,title:'a'}}).ok,false);
 assert.equal(assessCatalogPullRequest({...a,event:{...a.event,
  repository:{full_name:'external/fork'}}}).ok,false);
 assert.equal(assessCatalogPullRequest({...a,pr:{...a.pr,head:{...a.pr.head,sha:'0'.repeat(40)}}}).ok,false);
});
test('integration route issues one conditional PUT only after both exact CI runs',async()=>{
 const a=fixtures(),paths=[],api='https://api.github.com';
 const fetcher=async(url,opts)=>{
  paths.push({url:url.slice(api.length),method:opts.method,body:opts.body});
  const path=url.slice(api.length);
  let data;
  if(path.includes('/pulls?'))data=[{number:a.pr.number}];
  else if(path.endsWith('/pulls/52'))data=a.pr;
  else if(path.includes('/pulls/52/files?'))data=a.files;
  else if(path.includes('/actions/runs?'))data={workflow_runs:a.runs};
  else if(path.endsWith('/pulls/52/merge'))data={merged:true,sha:'b'.repeat(40)};
  else throw Error('Unknown request '+path);
  return {ok:true,json:async()=>data};
 };
 const result=await autoMergeFromEvent({event:a.event,fetcher,token:'test-token-long-enough'});
 assert.equal(result.ok,true);
 assert.equal(paths.filter(x=>x.method==='PUT').length,1);
 const body=JSON.parse(paths.find(x=>x.method==='PUT').body);
 assert.equal(body.sha,sha);
 assert.equal(body.merge_method,'squash');
});
test('a red browser suite must never issue a merge request',async()=>{
 const a=fixtures(),paths=[];
 const fetcher=async(url,opts)=>{
  paths.push(opts.method);
  const p=url.split('github.com')[1];
  const data=p.includes('/pulls?')?[{number:52}]:
   p.endsWith('/pulls/52')?a.pr:
   p.includes('/pulls/52/files?')?a.files:
   {workflow_runs:a.runs.map((r,i)=>i===1?{...r,conclusion:'failure'}:r)};
  return {ok:true,json:async()=>data};
 };
 const result=await autoMergeFromEvent({event:a.event,fetcher,token:'test-token-long-enough'});
 assert.equal(result.ok,false);assert.ok(!paths.includes('PUT'));
});

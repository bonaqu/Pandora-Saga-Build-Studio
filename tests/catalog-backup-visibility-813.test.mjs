import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {githubCatalogBackupStage} from '../worker/pandora-studio-github-catalog-pr.js';
const snapshot='ps-b9fcc323cce04cc0ba83e7760f5bd151';
const env={GITHUB_CATALOG_TOKEN:'owner-backup-test-token-'.padEnd(45,'x')};
const githubUrl='https://github.com/bonaqu/Pandora-Saga-Build-Studio/pull/810';
const job={state:'done',result:{number:810,url:githubUrl,unchanged:false}};
const makePR=change=>({number:810,html_url:githubUrl,state:'open',merged:false,
 head:{ref:'catalog/snapshot-'+snapshot,sha:'a'.repeat(40)},
 base:{ref:'bonaqu_projects'},...change});
async function withGithub(pr,workflows,fn){
 const old=globalThis.fetch;
 const calls=[];
 globalThis.fetch=async(url,opts)=>{
  calls.push({url:String(url),method:opts.method,headers:opts.headers});
  const payload=String(url).includes('/actions/runs')?{workflow_runs:workflows}:pr;
  return new Response(JSON.stringify(payload),{status:200});
 };
 try{return {status:await fn(),calls}}finally{globalThis.fetch=old}
}
test('admin shows background processing without any GitHub request or D1 write',async()=>{
 assert.equal((await githubCatalogBackupStage(env,snapshot,null)).state,'not_started');
 for(const state of ['pending','running','retry'])
  assert.equal((await githubCatalogBackupStage(env,snapshot,{state})).state,'working');
 assert.equal((await githubCatalogBackupStage(env,snapshot,{state:'attention'})).state,'attention');
 assert.equal((await githubCatalogBackupStage(env,snapshot,{state:'done',result:{unchanged:true}})).state,'synced');
});
test('created PR is checking; only merged PR proves the GitHub backup complete',async()=>{
 const open=await withGithub(makePR(),[],()=>githubCatalogBackupStage(env,snapshot,job));
 assert.equal(open.status.state,'checking');
 assert.equal(open.status.number,810);
 assert.ok(open.calls.every(x=>x.method==='GET'));
 const done=await withGithub(makePR({state:'closed',merged:true}),[],()=>githubCatalogBackupStage(env,snapshot,job));
 assert.equal(done.status.state,'synced');
 assert.equal(done.calls.length,1);
});
test('owner dashboard labels failed required checks and wrong PR identity as attention',async()=>{
 const checks=[{name:'Studio quality checks',event:'pull_request',
  head_sha:'a'.repeat(40),status:'completed',conclusion:'failure'}];
 const failed=await withGithub(makePR(),checks,()=>githubCatalogBackupStage(env,snapshot,job));
 assert.equal(failed.status.state,'attention');
 const wrong=await withGithub(makePR({head:{ref:'work/other',sha:'a'.repeat(40)}}),[],
  ()=>githubCatalogBackupStage(env,snapshot,job));
 assert.equal(wrong.status.state,'attention');
});
test('new owner UI shows the real backup status when reopened, no token in JS',()=>{
 const worker=readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../pandora-os-catalog-workbench.js',import.meta.url),'utf8');
 assert.match(worker,/githubCatalogBackupStage\(env,active\?\.snapshot\|\|null,job\)/);
 assert.match(ui,/startBackupTracking\(data\.snapshot\)/);
 assert.match(ui,/Каталог обновлён\. Резервная копия проверяется/);
 assert.doesNotMatch(ui,/GITHUB_CATALOG_TOKEN/);
});

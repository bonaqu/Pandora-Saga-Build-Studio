import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {targets,prune} from '../scripts/prune-audited-branches.mjs';

const expectedNames=Object.keys(targets);
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('stale-branch cleanup has a closed, audited SHA allowlist and never targets default',()=>{
 assert.equal(expectedNames.length,13);
 assert.ok(!expectedNames.includes('bonaqu_projects'));
 assert.ok(!expectedNames.includes('work/946-direct-inline-owner-copy'));
 for(const [branch,sha] of Object.entries(targets)){
  assert.match(sha,/^[0-9a-f]{40}$/);
  assert.ok(read('docs/BRANCH_AUDIT_2026-11-20.md').includes(branch));
 }
 const yml=read('.github/workflows/prune-audited-branches.yml');
 assert.match(yml,/contents: write/);
 assert.match(yml,/refs\/heads\/bonaqu_projects/);
 assert.match(yml,/workflow_dispatch:/);
 assert.match(yml,/inputs\.confirm == 'DELETE_AUDITED_BRANCHES'/);
 assert.doesNotMatch(yml,/^\s*push:/m);
 assert.doesNotMatch(yml,/^\s*pull_request:/m);
 assert.doesNotMatch(yml,/^\s*schedule:/m);
 assert.doesNotMatch(yml,/CLOUDFLARE|wrangler|D1_DATABASE|--force/);
});

test('cleanup refuses all writes from anything except this exact protected repo and branch',async()=>{
 for(const bad of [{repo:'other/repo',ref:'refs/heads/bonaqu_projects'},
  {repo:'bonaqu/Pandora-Saga-Build-Studio',ref:'refs/heads/dev'}]){
  await assert.rejects(()=>prune({...bad,token:'fake-token',
   fetcher:()=>{throw Error('Must never request GitHub API')}}),/protected production source/);
 }
 await assert.rejects(()=>prune({repo:'bonaqu/Pandora-Saga-Build-Studio',
  ref:'refs/heads/bonaqu_projects',token:''}),/GITHUB_TOKEN/);
});

test('cleanup skips missing refs and changed SHAs; deletes only matching audited refs',async()=>{
 const calls=[];
 const first=expectedNames[0],second=expectedNames[1],third=expectedNames[2];
 const actual=targets[first];
 const fake=async(url,options)=>{
  const name=decodeURIComponent(url.split('/git/refs/heads/')[1]);
  calls.push({name,method:options.method});
  if(name===second)return {status:404};
  if(name===third)return {status:200,json:async()=>({object:{sha:'f'.repeat(40)}})};
  if(options.method==='DELETE')return {status:204};
  return {status:200,json:async()=>({object:{sha:targets[name]}})};
 };
 const result=await prune({fetcher:fake,token:'fake-token',
  repo:'bonaqu/Pandora-Saga-Build-Studio',ref:'refs/heads/bonaqu_projects'});
 assert.ok(result.deleted.includes(first));
 assert.ok(result.gone.includes(second));
 assert.ok(result.moved.some(row=>row.name===third));
 assert.ok(!calls.some(call=>call.method==='DELETE'&&[second,third].includes(call.name)));
 assert.equal(calls.filter(call=>call.method==='DELETE').length,expectedNames.length-2);
 assert.equal(result.failed.length,0);
 assert.ok(actual);
});

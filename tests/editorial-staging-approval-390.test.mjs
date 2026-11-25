import test from 'node:test';
import assert from 'node:assert/strict';
import {
 assertGreenStagingSource,expectedStagingArtifactName,
 assertRetainedStagingArtifact
} from '../scripts/check-editorial-staging-approval.mjs';

const sha='a'.repeat(40),digest='b'.repeat(64);
const run=(name,override={})=>({name,head_sha:sha,event:'pull_request',
 status:'completed',conclusion:'success',...override});
const runs=[run('Studio quality checks'),run('Chromium browser smoke')];

test('#390 Cloudflare write phases require two successful exact-source CI workflows',()=>{
 assert.equal(assertGreenStagingSource(runs,sha),true);
 for(const failure of [
  [runs[0]],[runs[1]],
  [run('Studio quality checks',{head_sha:'c'.repeat(40)}),runs[1]],
  [runs[0],run('Chromium browser smoke',{conclusion:'failure'})],
  [runs[0],run('Chromium browser smoke',{status:'in_progress'})],
  [runs[0],run('Chromium browser smoke',{event:'workflow_dispatch'})],
  []
 ])assert.throws(()=>assertGreenStagingSource(failure,sha));
 for(const bad of [null,{},'bad',[]])
  assert.throws(()=>assertGreenStagingSource(bad,sha));
});

test('#390 retained encrypted artifact receipt must match source SHA and backup phase',()=>{
 const name=expectedStagingArtifactName('before',sha,digest);
 assert.equal(name,'ps390-before-'+('a'.repeat(12))+'-'+('b'.repeat(16)));
 const good={name,expired:false,size_in_bytes:456,
  workflow_run:{id:12345,head_sha:sha,head_branch:'work/947-issue390-editorial-parity'}};
 assert.equal(assertRetainedStagingArtifact([good],'before',sha,digest),name);
 for(const list of [
  [],[{...good,expired:true}], [{...good,size_in_bytes:0}],
  [{...good,workflow_run:{id:12345,head_branch:'main',head_sha:sha}}],
  [{...good,name:expectedStagingArtifactName('after',sha,digest)}]
 ])assert.throws(()=>assertRetainedStagingArtifact(list,'before',sha,digest));
 for(const [stage,source,hash] of [
  ['other',sha,digest],['before','no',digest],['after',sha,'broken'],
  ['rollback',sha,digest]
 ])assert.throws(()=>expectedStagingArtifactName(stage,source,hash));
});

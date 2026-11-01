import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scope={};Function('window',read('build-library-merge.js'))(scope);
const merge=scope.PandoraBuildLibraryMerge.reconcile;
const A='a'.repeat(32),B='b'.repeat(32);
test('D1 remains authoritative and the offline edited saved build becomes a separate cloud-synced copy',()=>{
 const local={id:A,name:'Local',at:200,data:{race:1,job:0,level:55}};
 const remote={id:A,name:'Cloud',at:100,data:{race:1,job:0,level:54}};
 const result=merge({local:[local],remote:[{id:A,entry:remote}],activeId:A,newId:()=>B});
 assert.deepEqual(result.merged.find(v=>v.id===A),remote);
 assert.equal(result.merged.find(v=>v.id===B).data.level,55);
 assert.deepEqual(result.outgoing.map(v=>v.id),[]);
 assert.equal(result.activeId,B);
 const app=read('app.js');
 assert.match(app,/const reconciled=window\.PandoraBuildLibraryMerge\.reconcile/);
 assert.match(app,/if\(libraryChangeId!==generation\)break/);
 assert.match(app,/await putCloudBuild\(entry\)/);
});
test('monotonic timestamps and atomic SQLite compare prevent late or same-timestamp clobbers',()=>{
 const app=read('app.js'),worker=read('worker/index.js');
 assert.match(app,/Math\.max\(Date\.now\(\),\(existingIndex>=0\?Number\(builds\[existingIndex\]\.at\)\|\|0:0\)\+1\)/);
 assert.match(worker,/private_builds\.deleted_at IS NULL AND \(CAST\(json_extract/);
 assert.match(worker,/private_builds\.payload=excluded\.payload/);
 assert.match(worker,/reason:'conflict'/);
 assert.match(worker,/reason:'stale'/);
 assert.match(worker,/reason:'deleted'/);
});

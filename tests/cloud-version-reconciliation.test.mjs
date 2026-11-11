import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scope={};Function('window',read('pandora-studio-build-library-merge.js'))(scope);
const merge=scope.PandoraBuildLibraryMerge.reconcile;
const A='a'.repeat(32),B='b'.repeat(32);
test('D1 remains authoritative and a conflicting offline edit becomes a browser-only copy',()=>{
 const local={id:A,name:'Local',at:200,data:{race:1,job:0,level:55}};
 const remote={id:A,name:'Cloud',at:100,data:{race:1,job:0,level:54}};
 const result=merge({local:[local],remote:[{id:A,entry:remote}],activeId:A,newId:()=>B});
 assert.deepEqual(result.merged.find(v=>v.id===A),remote);
 assert.equal(result.merged.find(v=>v.id===B).data.level,55);
 assert.deepEqual(result.outgoing.map(v=>v.id),[]);
 assert.equal(result.merged.find(v=>v.id===B).localOnly,true);
 const repeated=merge({local:result.merged,remote:[{id:A,entry:remote}],
  activeId:B,newId:()=>A});
 assert.deepEqual(repeated.outgoing,[]);
 assert.equal(result.activeId,B);
 const app=read('pandora-studio-app.js');
 assert.match(app,/const reconciled=window\.PandoraBuildLibraryMerge\.reconcile/);
 assert.match(app,/if\(libraryChangeId!==generation\)break/);
 assert.match(app,/await putCloudBuild\(entry\)/);
});
test('monotonic timestamps and atomic SQLite compare prevent late or same-timestamp clobbers',()=>{
 const app=read('pandora-studio-app.js'),worker=read('worker/index.js');
 assert.match(app,/Math\.max\(Date\.now\(\),\(existing\?Number\(existing\.at\)\|\|0:0\)\+1\)/);
 assert.match(worker,/private_builds\.deleted_at IS NULL AND/);
 assert.match(worker,/CASE WHEN json_valid\(private_builds\.payload\)/);
 assert.match(worker,/json_type\(private_builds\.payload,'\$\.data\.level'\)='integer'/);
 assert.match(worker,/private_builds\.payload=excluded\.payload/);
 assert.match(worker,/reason:'conflict'/);
 assert.match(worker,/reason:'stale'/);
 assert.match(worker,/reason:'deleted'/);
});

test('parallel cloud refreshes must not replay an older response over the newest one',()=>{
 const app=read('pandora-studio-app.js');
 const start=app.indexOf('async function loadCloudBuilds(){');
 const end=app.indexOf('\nfunction h(tag,attrs={}',start);
 const loader=app.slice(start,end);
 assert.match(app,/let libraryChangeId=0,cloudLoadRequestId=0/);
 assert.match(loader,/const generation=libraryChangeId,requestId=\+\+cloudLoadRequestId/);
 assert.match(loader,/if\(!latest\(\)\)return;/);
 assert.match(loader,/if\(libraryChangeId===generation&&latest\(\)\)/);
 assert.match(app,/AbortSignal\.timeout\(payload\?25000:20000\)/);
});

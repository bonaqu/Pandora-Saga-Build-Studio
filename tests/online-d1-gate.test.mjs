import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root={};root.window=root;
runInNewContext(read('pandora-studio-online-gate.js'),root);
const gate=root.PandoraStudioOnlineGate;
const api='https://example.test';
const counts={items:45,skills:60,souls:8};
const overrides={'guideedit.book.wiki-ui.example':'{"ru":"Да","en":"Yes"}'};
function response(payload,{snapshot='d1-1',catalog=true,ok=true}={}){
 return {ok,headers:{get:key=>key==='x-ps-catalog'?(catalog?'d1':'archive'):
  key==='x-ps-catalog-snapshot'?snapshot:null},json:async()=>payload};
}
function source({snapshot='d1-1',copy=overrides,meta=counts,catalog=true,status=true}={}){
 const reads=[];
 const fetcher=async(url,opts)=>{
  reads.push({url,opts});
  if(url.endsWith('/meta.json'))return response({counts:meta},{snapshot,catalog,ok:status});
  if(url.endsWith('/overrides'))return response({values:copy},{ok:status});
  throw Error('unexpected URL');
 };
 return {reads,fetcher};
}
const verify=mock=>gate.inspect({api,fetcher:mock.fetcher,expectedSnapshot:'d1-1',
 expectedOverrides:overrides,expectedCounts:counts});

test('read-only live D1 checkpoint accepts only the current published snapshot and authored text',async()=>{
 const mock=source();
 const result=await verify(mock);
 assert.equal(result.status,'ready');
 assert.equal(result.snapshot,'d1-1');
 assert.equal(mock.reads.length,2);
 assert.ok(mock.reads.every(x=>x.opts.cache==='no-store'));
 assert.deepEqual(mock.reads.map(x=>x.url).sort(),[
  api+'/api/catalog/meta.json',api+'/api/overrides'
 ]);
 assert.equal(gate.digest({b:'2',a:'1'}),gate.digest({a:'1',b:'2'}));
});

test('different published D1 snapshot or translated copy requires a safe reload',async()=>{
 assert.equal((await verify(source({snapshot:'d1-2'}))).status,'changed');
 assert.equal((await verify(source({copy:{...overrides,'guideedit.book.example':'new'}}))).status,'changed');
 assert.equal((await verify(source({meta:{...counts,skills:61}}))).status,'changed');
});

test('missing D1 proof, invalid source, malformed catalog and server failures never show stale data',async()=>{
 for(const mock of [
  source({snapshot:''}),source({catalog:false}),source({status:false}),
  source({meta:{items:0,skills:20}}),source({copy:[]})
 ])await assert.rejects(verify(mock));
 await assert.rejects(gate.inspect({
  api,expectedSnapshot:'d1-1',expectedOverrides:overrides,
  fetcher:async()=>{throw Error('offline')}
 }));
 await assert.rejects(gate.inspect({
  api:'http://untrusted.invalid',expectedSnapshot:'d1-1',
  fetcher:async()=>response({})
 }));
});

test('public startup has no archive button or user-accessible local-catalog path',()=>{
 const html=read('index.html'),app=read('pandora-studio-app.js');
 assert.doesNotMatch(html,/id="startupArchive"|Open archived copy|Открыть архивную копию/);
 assert.match(html,/id="startupRetry"/);
 assert.match(html,/pandora-studio-online-gate\.js/);
 assert.doesNotMatch(app,/\$\('startupArchive'\)\.onclick/);
 assert.match(app,/const localCatalogHost=\['127\.0\.0\.1','localhost'\]/);
 assert.match(app,/void startStudio\(\{archive:localCatalogHost\}\)/);
 assert.match(app,/const base=archive\?'\.\/data\/os':API\+'\/api\/catalog'/);
});

test('disconnect saves both scoped local states and blocks editing, even on a failed local save',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/function saveLiveDraft\(\)/);
 assert.match(app,/const draft=persist\(\),library=persistBuilds\(\)/);
 assert.match(app,/return draft===true&&library===true/);
 assert.match(app,/liveLocalSaved=saveLiveDraft\(\)/);
 assert.match(app,/if\(!liveLocalSaved\)\{[\s\S]*?showLiveGate\('storage'\)/);
 assert.match(app,/liveGateReason==='storage'/);
 assert.match(app,/document\.body\.classList\.add\('studio-live-blocked'\)/);
 assert.match(app,/event\.stopImmediatePropagation\(\)/);
 assert.match(app,/window\.PandoraAccountUI\?\.updateGuard\?\.\(\)/);
 assert.match(app,/pandora:before-update/);
 assert.match(app,/location\.replace\(url\.toString\(\)\)/);
 assert.match(app,/if\(!localCatalogHost&&\(!studioLiveReady\|\|liveGateReason\)\)return/);
 const updater=read('pandora-studio-update-manager.js');
 assert.match(updater,/classList\.contains\('studio-live-blocked'\)/);
 assert.match(updater,/#startupOverlay:not\(\[hidden\]\):not\(\.is-finished\)/);
});

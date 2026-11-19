import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const begin=app.indexOf('let catalogArchived=false;');
const end=app.indexOf('function openWiki(type,id,highlight=null)',begin);
assert.ok(begin>=0&&end>begin,'Wiki loader must be inspectable');

function harness({online=false}={}){
 const calls=[],overrides={},selection={type:'item',id:null},gates=[];
 const window={__gates:gates,
  PandoraStudioLiveRead:{get:()=>Promise.reject(Error('Unused network fixture'))},
  PandoraWikiCatalog:{load:()=>new Promise((resolve,reject)=>calls.push({resolve,reject}))},
  PandoraHistoricalMaps:{records:()=>({})},
  PandoraStudioTradeOwnerData:{apply:trades=>trades},
  PandoraStudioItemOwnerEditor:{applyItems:items=>items},
  PandoraWikiOwnerData:{apply:source=>source},
  PandoraWikiData:{build:source=>({source,canonical:(_type,id)=>id})}
 };
 const module=Function('window','API','fetch','override','wikiSelection',
  'let wikiIndex=null,wikiPending=null,wikiData=null;'+
  'const activeCatalogSnapshot=null,catalogSource=null,liveGateReason=null;'+
  'const studioLiveReady='+String(online)+';'+
  'const showLiveGate=value=>window.__gates.push(value);\n'+app.slice(begin,end)+
  '\nreturn {loadWiki,invalidateWikiCatalog,read:()=>({wikiIndex,wikiData,wikiPending,wikiBaseData,wikiLoadGeneration})};');
 return {...module(window,'https://example.test',()=>{},overrides,selection),calls,overrides,gates};
}
const source=tag=>({data:{meta:{tag},skills:{},items:{},maps:{},
 trades:{npcs:{},mapNames:{},trades:[]}}});

test('out-of-order D1 Wiki requests never overwrite the newer catalog snapshot',async()=>{
 const app=harness(),first=app.loadWiki();
 assert.equal(app.calls.length,1);
 app.invalidateWikiCatalog({dropSnapshot:true});
 const latest=app.loadWiki();
 assert.equal(app.calls.length,2);
 app.calls[1].resolve(source('latest'));
 assert.equal((await latest).source.meta.tag,'latest');
 app.calls[0].resolve(source('stale'));
 assert.equal((await first).source.meta.tag,'latest');
 assert.equal(app.read().wikiIndex.source.meta.tag,'latest');
 assert.equal(app.read().wikiBaseData.meta.tag,'latest');
 assert.equal(app.read().wikiPending,null);
});

test('failed obsolete D1 request does not show an error after a newer load succeeds',async()=>{
 const app=harness(),stale=app.loadWiki();
 app.invalidateWikiCatalog({dropSnapshot:true});
 const current=app.loadWiki();
 app.calls[0].reject(new Error('Obsolete network failure'));
 app.calls[1].resolve(source('current'));
 const [previous,newer]=await Promise.all([stale,current]);
 assert.equal(previous,newer);
 assert.equal(app.read().wikiIndex.source.meta.tag,'current');
 assert.equal(app.read().wikiPending,null);
});

test('owner edits reuse the D1 snapshot without refetching and build a fresh index',async()=>{
 const app=harness(),first=app.loadWiki();
 app.calls[0].resolve(source('cached'));
 const previous=await first;
 app.invalidateWikiCatalog();
 const current=await app.loadWiki();
 assert.equal(app.calls.length,1,'rebuilding owner changes needs no extra D1 roundtrip');
 assert.notEqual(previous,current);
 assert.equal(current.source.meta.tag,'cached');
 assert.equal(app.read().wikiLoadGeneration,1);
});

test('Wiki search batches keystrokes and cancels outdated DOM work on navigation',()=>{
 const start=app.indexOf('function renderWiki(root)');
 const end=app.indexOf('function renderProfile(root)',start);
 assert.ok(start>=0&&end>start);
 const wiki=app.slice(start,end);
 assert.match(wiki,/search\.addEventListener\('input',\(\)=>\{/);
 assert.match(wiki,/if\(wikiSearchTimer!==null\)clearTimeout\(wikiSearchTimer\)/);
 assert.match(wiki,/wikiSearchTimer=setTimeout\(\(\)=>\{/);
 assert.match(wiki,/if\(root\.isConnected&&activeTab==='wiki'&&wikiIndex\)draw\(\)/);
 assert.match(wiki,/\},100\)/);
 assert.match(wiki,/wikiOutsideCleanup=\(\)=>\{[\s\S]*?clearTimeout\(wikiSearchTimer\)/);
});

test('changed D1 snapshot immediately protects the active Hero instead of waiting for heartbeat',async()=>{
 const app=harness({online:true}),load=app.loadWiki();
 assert.equal(app.calls.length,1);
 app.calls[0].reject(Error('В ходе загрузки версия опубликованного каталога изменилась'));
 await assert.rejects(load,/версия опубликованного каталога изменилась/);
 assert.deepEqual(app.gates,['changed'],
  'An incompatible Wiki source must immediately block stale Hero calculations');
 const unrelated=harness({online:true}),load2=unrelated.loadWiki();
 unrelated.calls[0].reject(Error('One missing Wiki record'));
 await assert.rejects(load2,/One missing Wiki record/);
 assert.deepEqual(unrelated.gates,[],
  'Ordinary record/network failure is not proof of a different published snapshot');
});

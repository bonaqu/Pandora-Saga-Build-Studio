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

test('nested JSON key order alone never claims a new D1 snapshot',async()=>{
 const expected={...overrides,layout:{ru:{heading:'Герой',label:'Книга'},en:{label:'Book',heading:'Hero'}}};
 const responseCopy={layout:{en:{heading:'Hero',label:'Book'},ru:{label:'Книга',heading:'Герой'}},...overrides};
 assert.equal(gate.digest(expected),gate.digest(responseCopy));
 const mock=source({copy:responseCopy});
 const checked=await gate.inspect({api,fetcher:mock.fetcher,expectedSnapshot:'d1-1',
  expectedOverrides:expected,expectedCounts:counts});
 assert.equal(checked.status,'ready');
 const changed=source({copy:{...responseCopy,layout:{...responseCopy.layout,
  ru:{...responseCopy.layout.ru,heading:'Другой герой'}}}});
 assert.equal((await gate.inspect({api,fetcher:changed.fetcher,expectedSnapshot:'d1-1',
  expectedOverrides:expected,expectedCounts:counts})).status,'changed');
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
 assert.match(updater,/#startupOverlay:not\(\[hidden\]\)/, 'The D1 fade remains modal until hidden');
});

test('late custom fetch/JSON adapters cannot mark an aborted D1 checkpoint ready',async()=>{
 const controller=new AbortController();
 const slow=source();
 const fetcher=async(url,options)=>{
  const reply=await slow.fetcher(url,options);
  controller.abort(Error('Old D1 checkpoint discarded'));
  return reply; // Simulates a fetch implementation ignoring signal.
 };
 await assert.rejects(gate.inspect({
  api,fetcher,signal:controller.signal,expectedSnapshot:'d1-1',
  expectedOverrides:overrides,expectedCounts:counts
 }),/Old D1 checkpoint discarded/);

 const duringJson=new AbortController();
 const lateFetcher=async(url)=>{
  const catalog=url.endsWith('/meta.json');
  const data=catalog?{counts}:{values:overrides};
  return {
   ...response(data),
   json:async()=>{
    if(catalog)duringJson.abort(Error('Snapshot changed during parse'));
    return data;
   }
  };
 };
 await assert.rejects(gate.inspect({
  api,fetcher:lateFetcher,signal:duringJson.signal,
  expectedSnapshot:'d1-1',expectedOverrides:overrides,expectedCounts:counts
 }),/Snapshot changed during parse/);
});

test('stalled D1 checkpoint headers and JSON bodies settle when their deadline expires',async()=>{
 for(const endpoint of ['meta.json','overrides']){
  for(const stage of ['headers','json']){
   const keepAlive=setTimeout(()=>{},200);
   let reads=0;
   const fetcher=async url=>{
    reads++;
    const isMeta=url.endsWith('meta.json'),target=url.endsWith(endpoint);
    if(target&&stage==='headers')return new Promise(()=>{});
    const payload=isMeta?{counts}:{values:overrides};
    return {
     ...response(payload),
     json:target&&stage==='json'?async()=>new Promise(()=>{}):async()=>payload
    };
   };
   try{
    await assert.rejects(gate.inspect({
     api,fetcher,signal:AbortSignal.timeout(35),expectedSnapshot:'d1-1',
     expectedOverrides:overrides,expectedCounts:counts
    }),/abort|timeout/i,endpoint+' '+stage);
    assert.equal(reads,2,
     'A stalled checkpoint must not issue extra network retries or unlock the editor');
   }finally{clearTimeout(keepAlive)}
  }
 }
});

test('an explicit checkpoint cancellation rejects hung custom fetch and JSON promises',async()=>{
 for(const stage of ['headers','json']){
  const controller=new AbortController();
  let began;
  const started=new Promise(resolve=>{began=resolve});
  const fetcher=async url=>{
   if(url.endsWith('meta.json')){
    if(stage==='headers'){began();return new Promise(()=>{})}
    return {...response({counts}),json:async()=>{began();return new Promise(()=>{})}};
   }
   return response({values:overrides});
  };
  const pending=gate.inspect({api,fetcher,signal:controller.signal,
   expectedSnapshot:'d1-1',expectedOverrides:overrides,expectedCounts:counts});
  await started;
  controller.abort(Error('D1 checkpoint superseded'));
  await assert.rejects(pending,/D1 checkpoint superseded/);
 }
});

test('live account-only guard retries network timeouts, never non-401 HTTP responses',async()=>{
 const script=read('scripts/check-build-account-only-live.mjs');
 const start=script.indexOf('async function get(path,token=null){');
 const end=script.indexOf('\nlet capabilities=',start);
 assert.ok(start>=0&&end>start);
 const make=(fetcher,delays)=>Function('fetch','pause','AbortSignal','worker','origin',
  script.slice(start,end)+'\nreturn get;')(fetcher,ms=>{delays.push(ms)},
   AbortSignal,'https://worker.example','https://bonaqu.github.io');
 const delays=[],requests=[];
 let calls=0;
 const fetcher=async(_url,options)=>{
  requests.push(options);
  if(++calls===1)throw Error('Temporary routing failure');
  return {status:401};
 };
 const get=make(fetcher,delays);
 assert.equal((await get('/api/library')).status,401);
 assert.equal(calls,2);
 assert.deepEqual(delays,[500]);
 assert.ok(requests.every(options=>options.method==='GET'&&
  options.cache==='no-store'&&options.headers.Origin==='https://bonaqu.github.io'));
 let badCalls=0;
 assert.equal((await make(async()=>{badCalls++;return {status:500}},[] )('/api/library')).status,500);
 assert.equal(badCalls,1,'A non-401 Worker response must not be silently retried as success');
 let failures=0;
 await assert.rejects(make(async()=>{failures++;throw Error('Offline')},[])('/api/shared/A1234567890'),
  /Read-only Worker check failed/);
 assert.equal(failures,3,'Network retry attempts are capped');
});

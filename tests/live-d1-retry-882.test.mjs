import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const load=()=>{
 const ctx={AbortSignal,setTimeout,clearTimeout,console};
 ctx.globalThis=ctx;
 runInNewContext(read('pandora-studio-live-read.js'),ctx);
 return ctx.PandoraStudioLiveRead;
};
const instant=async()=>{};
const response=(status)=>({ok:status===200,status});

test('a transient 429/503/network error retries GET at most three times without a page refresh',async()=>{
 const live=load();
 const seen=[];
 const statuses=[429,503,200];
 const fetcher=async(_url,init)=>{
  seen.push(init);
  return response(statuses.shift());
 };
 const result=await live.get('https://example.test/api/catalog/meta.json',
  {cache:'no-store'},{fetcher,pause:instant});
 assert.equal(result.status,200);
 assert.equal(seen.length,3);
 assert.ok(seen.every(x=>x.method==='GET'&&x.signal&&!x.signal.aborted));
 const flaky=async()=>{
  if(++calls===1)throw new TypeError('Network failed');
  return response(200);
 };
 let calls=0;
 assert.equal((await live.get('https://example.test/api/overrides',{},
  {fetcher:flaky,pause:instant})).status,200);
 assert.equal(calls,2);
});

test('persistent 503 exhausts retries, but authorization and missing records fail immediately',async()=>{
 const live=load();
 for(const expected of [503,401,403,404]){
  let calls=0;
  const result=await live.get('https://example.test/api/catalog/items.json',{},
   {fetcher:async()=>{calls++;return response(expected)},pause:instant});
  assert.equal(result.status,expected);
  assert.equal(calls,expected===503?3:1);
 }
 let count=0;
 await assert.rejects(live.get('https://example.test/api/catalog/skills.json',{},
  {fetcher:async()=>{count++;throw Error('Offline')},pause:instant}),
  /Offline/);
 assert.equal(count,3);
});

test('retry transport is read-only, obeys abort and never retries invalid successful content',async()=>{
 const live=load();
 for(const options of [{method:'POST'},{method:'DELETE'},{body:'{}'}]){
  await assert.rejects(live.get('https://example.test/api/overrides',options,
   {fetcher:async()=>{throw Error('must not execute')}}),/Invalid read-only request/);
 }
 const controller=new AbortController();
 controller.abort(Error('Discarded navigation'));
 let count=0;
 await assert.rejects(live.get('https://example.test/api/overrides',
  {signal:controller.signal},{fetcher:async()=>{count++;return response(200)}}),
 /Discarded navigation/);
 assert.equal(count,0);

 const unexpected={ok:true,status:200,json:async()=>{throw new SyntaxError('Broken JSON')}};
 const fetcher=async()=>{count++;return unexpected};
 const received=await live.get('https://example.test/api/overrides',{},
  {fetcher,pause:instant});
 await assert.rejects(received.json(),/Broken JSON/);
 assert.equal(count,1,'Invalid JSON is never retried as a network failure');
});

test('malformed fetch adapter responses fail immediately without multiplying D1 reads',async()=>{
 const live=load();
 for(const malformed of [null,{}, {ok:'yes',status:200}]){
  let calls=0;
  await assert.rejects(live.get('https://example.test/api/catalog/meta.json',{},
   {fetcher:async()=>{calls++;return malformed},pause:instant}),
   /Invalid public GET response/);
  assert.equal(calls,1,'A broken response is not a transient network outage');
 }
});

test('read-only batching does not exceed three in-flight datasets and preserves order',async()=>{
 const live=load();
 let active=0,peak=0;
 const ids=Array.from({length:12},(_,i)=>i);
 const loaded=await live.mapLimit(ids,3,async id=>{
  active++;peak=Math.max(peak,active);
  await new Promise(resolve=>setTimeout(resolve,(id%3+1)*2));
  active--;
  return id*2;
 });
 assert.equal(peak,3);
 assert.deepEqual([...loaded],ids.map(x=>x*2));
 await assert.rejects(live.mapLimit(ids,9,async()=>0),/Invalid read-only batch/);
});

test('D1 origin and matching snapshot are still checked after a successful retried GET',async()=>{
 const ctx={AbortSignal,setTimeout,clearTimeout,console};
 ctx.globalThis=ctx;
 runInNewContext(read('pandora-studio-live-read.js'),ctx);
 runInNewContext(read('pandora-studio-online-gate.js'),ctx);
 const counts={items:11,skills:22};
 let calls=0;
 const fetcher=async url=>{
  calls++;
  const catalog=url.endsWith('/meta.json');
  return {ok:true,status:200,headers:{get:key=>
    key==='x-ps-catalog'?(catalog?'archive':null):
    key==='x-ps-catalog-snapshot'?'snapshot-882':null},
   json:async()=>catalog?{counts}:{values:{}}};
 };
 await assert.rejects(ctx.PandoraStudioOnlineGate.inspect({
  api:'https://example.test',fetcher:(u,opts)=>ctx.PandoraStudioLiveRead.get(u,opts,
   {fetcher,pause:instant}),expectedSnapshot:'snapshot-882',
  expectedOverrides:{},expectedCounts:counts
 }),/source is not verified/);
 assert.equal(calls,2,'Invalid D1 provenance cannot trigger another GET or unlock');
});

test('public D1 reads force no-store and ignore a successful response after cancellation',async()=>{
 const live=load();
 let observed=null;
 const response=await live.get('https://example.test/api/catalog/meta.json',
  {cache:'force-cache'},{fetcher:async(_url,options)=>{
   observed=options;return {ok:true,status:200};
  },pause:instant});
 assert.equal(response.status,200);
 assert.equal(observed.cache,'no-store','The live snapshot cannot use a stale HTTP cache');
 assert.equal(observed.method,'GET');
 const controller=new AbortController();
 let fetches=0;
 await assert.rejects(live.get('https://example.test/api/catalog/meta.json',
  {signal:controller.signal},{fetcher:async()=>{
   fetches++;
   controller.abort(Error('New snapshot requested'));
   // Simulate an adapter which returns despite cancellation.
   return {ok:true,status:200};
  },pause:instant}),/New snapshot requested/);
 assert.equal(fetches,1,'A cancelled response is not retried or accepted');
});

test('429 and 503 respect bounded Retry-After without multiplying D1 requests',async()=>{
 const live=load(),delays=[];
 let fetches=0;
 const answer=await live.get('https://example.test/api/catalog/items.json',{},
  {fetcher:async()=>{
   fetches++;
   return fetches===1?
    {ok:false,status:429,headers:{get:name=>name==='retry-after'?'2':null}}:
    {ok:true,status:200};
  },pause:async ms=>delays.push(ms)});
 assert.equal(answer.status,200);
 assert.deepEqual(delays,[2000]);
 assert.equal(fetches,2);

 const capped=[];
 let count=0;
 await live.get('https://example.test/api/catalog/skills.json',{},
  {fetcher:async()=>{
   count++;
   return count===1?
    {ok:false,status:503,headers:{get:()=> '999'}}:
    {ok:true,status:200};
  },pause:async ms=>capped.push(ms)});
 assert.deepEqual(capped,[2500],'Long Retry-After must not freeze startup');

 const fallback=[];
 let seen=0;
 await live.get('https://example.test/api/catalog/souls.json',{},
  {fetcher:async()=>{
   seen++;
   return seen===1?
    {ok:false,status:503,headers:{get:()=> 'malformed'}}:
    {ok:true,status:200};
  },pause:async ms=>fallback.push(ms)});
 assert.deepEqual(fallback,[350]);
});

test('a confirmed D1 Free row quota stops immediate retries and preserves its HTTP body',async()=>{
 const live=load(),url='https://example.test/api/catalog/meta.json';
 let calls=0;
 const exhausted=()=>new Response(JSON.stringify({
  error:'Database temporarily unavailable',code:'D1_DAILY_QUOTA_EXCEEDED'
 }),{status:503,headers:{'retry-after':'6000','content-type':'application/json'}});
 const reply=await live.get(url,{},{
  fetcher:async()=>{calls++;return exhausted()},pause:instant
 });
 assert.equal(calls,1,'Daily row quota must not cause three identical D1 attempts');
 assert.equal(reply.status,503);
 assert.equal((await reply.json()).code,'D1_DAILY_QUOTA_EXCEEDED',
  'The source response body is not consumed by the quota detector');
 assert.ok(live.quotaCooldownMs()>240000&&live.quotaCooldownMs()<=300000,
  'The advisory cooldown is bounded, not the whole 24-hour window');
 live.resetQuotaCooldown();
 assert.equal(live.quotaCooldownMs(),0);
});
test('generic 503 and malformed quota payload still use bounded transient retries',async()=>{
 const live=load();
 for(const content of [
  {error:'Ordinary service maintenance'},
  {error:'Database temporarily unavailable',code:'TYPO'},
  'not-json'
 ]){
  let calls=0;
  const status=await live.get('https://example.test/api/overrides',{},{
   fetcher:async()=>{calls++;return new Response(
    typeof content==='string'?content:JSON.stringify(content),
    {status:503,headers:{'retry-after':'300'}})},pause:instant
  });
  assert.equal(status.status,503);
  assert.equal(calls,3,'Unverified quota signal must not be treated as a confirmed daily cap');
  assert.equal(live.quotaCooldownMs(),0);
 }
});

test('parent abort interrupts transient HTTP backoff without another D1 request',async()=>{
 const live=load(),controller=new AbortController();
 let calls=0,started;
 const waiting=new Promise(resolve=>{started=resolve});
 const request=live.get('https://example.test/api/catalog/meta.json',
  {signal:controller.signal},{
   fetcher:async()=>{calls++;return response(429)},
   pause:async()=>{started();await new Promise(()=>{})}
  });
 await waiting;
 controller.abort(Error('Catalog connection superseded'));
 await assert.rejects(request,/Catalog connection superseded/);
 assert.equal(calls,1,'No follow-up HTTP request after the cancelled backoff');
});

test('transport failure backoff is cancelled before retrying a stale checkpoint',async()=>{
 const live=load(),controller=new AbortController();
 let calls=0,started;
 const waiting=new Promise(resolve=>{started=resolve});
 const request=live.get('https://example.test/api/overrides',
  {signal:controller.signal},{
   fetcher:async()=>{calls++;throw Error('Connection dropped')},
   pause:async()=>{started();await new Promise(()=>{})}
  });
 await waiting;
 controller.abort(Error('Checkpoint replaced'));
 await assert.rejects(request,/Checkpoint replaced/);
 assert.equal(calls,1,'Cancelled transport retry must not re-enter fetch');
});

test('read-only retries reject a cancellation occurring during a failed fetch',async()=>{
 const live=load(),controller=new AbortController();
 let calls=0;
 await assert.rejects(live.get('https://example.test/api/catalog/items.json',
  {signal:controller.signal},{
   fetcher:async()=>{
    calls++;
    controller.abort(Error('User left the page'));
    throw Error('Offline');
   },pause:instant
  }),/User left the page/);
 assert.equal(calls,1);
});

test('cancelled D1 GET rejects promptly even when an HTTP adapter ignores AbortSignal',async()=>{
 const live=load(),controller=new AbortController();
 let began;const started=new Promise(resolve=>{began=resolve});
 let fetches=0;
 const pending=live.get('https://example.test/api/catalog/items.json',
  {signal:controller.signal},{
   attempts:1,
   fetcher:async()=>{fetches++;began();return new Promise(()=>{})}
  });
 await started;
 controller.abort(Error('Catalog attempt superseded'));
 await assert.rejects(pending,/Catalog attempt superseded/);
 assert.equal(fetches,1);
});

test('a timed-out read-only fetch adapter is bounded without consuming extra D1 retries',async()=>{
 const live=load();
 let fetches=0;
 await assert.rejects(live.get('https://example.test/api/catalog/meta.json',
  {},{attempts:1,timeoutMs:35,
   fetcher:async()=>{fetches++;return new Promise(()=>{})}
  }),/abort|timeou/i);
 assert.equal(fetches,1);
});

test('a stale quota JSON parse cannot extend the next checkpoint cooldown',async()=>{
 const live=load(),controller=new AbortController();
 let finishPayload,started;
 const reading=new Promise(resolve=>{finishPayload=resolve});
 const began=new Promise(resolve=>{started=resolve});
 const response={ok:false,status:503,clone(){return {json:async()=>{
  started();return reading;
 }}}};
 const pending=live.get('https://example.test/api/catalog/meta.json',
  {signal:controller.signal},{fetcher:async()=>response});
 await began;
 controller.abort(Error('Quota reply obsolete'));
 await assert.rejects(pending,/Quota reply obsolete/);
 finishPayload({code:'D1_DAILY_QUOTA_EXCEEDED'});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(live.quotaCooldownMs(),0);
});

test('one invalid D1 dataset aborts sibling requests and preserves the original failure',async()=>{
 const live=load(),started=[],aborted=[];
 const items=Array.from({length:10},(_,i)=>i);
 const promise=live.mapLimit(items,3,async(id,_index,signal)=>{
  started.push(id);
  if(id===0)throw Error('Invalid skill snapshot');
  return new Promise(resolve=>{
   signal.addEventListener('abort',()=>{aborted.push(id);resolve('late')},{once:true});
  });
 });
 await assert.rejects(promise,/Invalid skill snapshot/);
 assert.ok(started.includes(0));
 assert.ok(!started.some(id=>id>=3),'No further dataset GET may be launched');
 assert.deepEqual(aborted.sort((a,b)=>a-b),started.filter(id=>id!==0).sort((a,b)=>a-b),
  'All already started siblings must receive cancellation');
});

test('batch failures never change successful read ordering or client cache policy',async()=>{
 const live=load();
 const ids=[4,2,9,3,8];
 const out=await live.mapLimit(ids,2,async(id,i,signal)=>{
  assert.equal(signal.aborted,false);
  await Promise.resolve();
  return id+':'+i;
 });
 assert.deepEqual([...out],ids.map((id,i)=>id+':'+i));
});

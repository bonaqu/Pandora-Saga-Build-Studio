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

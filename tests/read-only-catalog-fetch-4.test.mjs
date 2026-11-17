import test from 'node:test';
import assert from 'node:assert/strict';
import {readPublishedCatalog} from '../scripts/read-only-catalog-fetch.mjs';
const url='https://ps-build-studio-cloud.bonaqu.workers.dev/api/catalog/items.json';
const good=()=>new Response(JSON.stringify({1:{name:'source'}}),
 {status:200,headers:{'x-ps-catalog':'d1','access-control-allow-origin':'https://bonaqu.github.io'}});
test('temporary network error retries one safe GET and preserves source header',async()=>{
 let calls=0;const requests=[],delays=[];
 const got=await readPublishedCatalog(url,{
  fetchImpl:async (url,options)=>{
   requests.push({url,options});calls++;
   if(calls===1)throw new TypeError('fetch failed');
   return good();
  },pause:async ms=>delays.push(ms)
 });
 assert.equal(got.attempts,2);
 assert.equal(got.payload['1'].name,'source');
 assert.equal(got.response.headers.get('x-ps-catalog'),'d1');
 assert.deepEqual(delays,[350]);
 assert.equal(requests.length,2);
 for(const req of requests){
  assert.equal(req.url,url);
  assert.equal(req.options.method,'GET');
  assert.equal(req.options.headers.Origin,'https://bonaqu.github.io');
  assert.equal(req.options.cache,'no-store');
 }
});
test('retries only known transient HTTP statuses, never authorization or missing records',async()=>{
 let calls=0;
 const got=await readPublishedCatalog(url,{
  fetchImpl:async()=>{calls++;return calls===1?
   new Response('temporary',{status:503}):good()},pause:async()=>{}
 });
 assert.equal(got.attempts,2);
 assert.equal(calls,2);
 for(const status of [401,403,404,422]){
  let count=0;
  const denied=await readPublishedCatalog(url,{
   fetchImpl:async()=>{count++;return new Response('{}',{status})},
   pause:async()=>{throw Error('Should not wait on non-transient HTTP '+status)}
  });
  assert.equal(denied.response.status,status);
  assert.equal(denied.attempts,1);
  assert.equal(count,1);
 }
});
test('invalid JSON and bad source headers cannot be healed by re-fetching',async()=>{
 let count=0;
 const result=await readPublishedCatalog(url,{
  fetchImpl:async()=>{count++;return new Response('{broken',{status:200})},
  pause:async()=>{throw Error('Should never retry malformed JSON')}
 });
 assert.equal(count,1);
 assert.equal(result.payload,null,'caller fails contract check');
 let headersCount=0;
 const wrong=await readPublishedCatalog(url,{
  fetchImpl:async()=>{headersCount++;return new Response('{}',{status:200,
   headers:{'x-ps-catalog':'archive'}})},
  pause:async()=>{throw Error('Should never retry a valid non-D1 response')}
 });
 assert.equal(wrong.response.headers.get('x-ps-catalog'),'archive');
 assert.equal(headersCount,1);
});
test('exhaustion leaves a real failure and never hides a broken endpoint',async()=>{
 let count=0;
 await assert.rejects(readPublishedCatalog(url,{
  fetchImpl:async()=>{count++;throw new Error('network still down')},
  pause:async()=>{}
 }),/network still down/);
 assert.equal(count,3);
 let attempts=0;
 const persistent=await readPublishedCatalog(url,{
  fetchImpl:async()=>{attempts++;return new Response('offline',{status:503})},
  pause:async()=>{}
 });
 assert.equal(persistent.response.status,503);
 assert.equal(persistent.attempts,3);
 assert.equal(attempts,3);
});
test('never accepts unlimited retry budgets or insecure URL',async()=>{
 await assert.rejects(readPublishedCatalog(url,{maxAttempts:4}),/Invalid read-only/);
 await assert.rejects(readPublishedCatalog('http://insecure.local/api/catalog',{maxAttempts:1}),/Invalid read-only/);
});

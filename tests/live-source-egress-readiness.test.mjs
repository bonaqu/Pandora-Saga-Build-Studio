import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyGameSource} from '../scripts/source-egress-status.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('a real Worker upstream response is required for source health',()=>{
 assert.deepEqual(classifyGameSource(200,{status:'ok',source:'game-site'}),
  {healthy:true,reason:'ok'});
 for(const [status,payload] of [
  [503,{status:'unavailable',code:'timeout'}],
  [200,{status:'ok',source:'stale-cache'}],
  [503,null],[200,{status:'unavailable'}]
 ])assert.equal(classifyGameSource(status,payload).healthy,false);
});
test('source diagnostic sanitizes upstream values before logging',()=>{
 assert.deepEqual(classifyGameSource(503,{code:'Bearer secret\n::error::'}),
  {healthy:false,reason:'unavailable'});
 assert.deepEqual(classifyGameSource(503,{code:'http-503'}),
  {healthy:false,reason:'http-503'});
});
test('readiness performs anonymous source GET and does not fail an otherwise healthy D1',()=>{
 const src=read('scripts/check-live-connections.mjs');
 assert.match(src,/read\(worker\+'\/api\/source-health',\{cors:true\}\)/);
 assert.match(src,/classifyGameSource\(response\.status,payload\)/);
 assert.match(src,/signal\.healthy\?'OK  ':'WARN'/);
 const start=src.indexOf(' // A published D1 catalog may work');
 const end=src.indexOf("try{\n const {response}=await read(worker+'/api/health'",start);
 assert.ok(start>0&&end>start);
 assert.doesNotMatch(src.slice(start,end),/failures\+\+|check\(false|Bearer |Authorization|POST/);
});

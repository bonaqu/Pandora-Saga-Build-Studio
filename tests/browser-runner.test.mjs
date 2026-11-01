import test from 'node:test';
import assert from 'node:assert/strict';
import {runIndependentSmokes} from './browser-runner.mjs';

test('limited concurrent runner keeps independent scenarios and original result order',async()=>{
 const gates=[],visited=[],cases=Array.from({length:7},(_,i)=>['case-'+i,
  async()=>{visited.push(i);if(i<3)await new Promise(resolve=>gates.push(resolve));}]);
 const promise=runIndependentSmokes(cases,null,null,{concurrency:3});
 await Promise.resolve();
 assert.deepEqual(visited,[0,1,2],'No more than three contexts begin simultaneously');
 gates.forEach(release=>release());
 const report=await promise;
 assert.deepEqual(report.map(x=>x.name),cases.map(x=>x[0]));
 assert.deepEqual(visited,[0,1,2,3,4,5,6]);
 assert.ok(report.every(x=>x.ms>=0));
});

test('serial mode executes strictly in source order, for reproducible debugging',async()=>{
 const order=[],cases=[0,1,2].map(n=>['case-'+n,async()=>{order.push('start '+n);
  await Promise.resolve();order.push('end '+n)}]);
 await runIndependentSmokes(cases,null,null,{concurrency:1});
 assert.deepEqual(order,['start 0','end 0','start 1','end 1','start 2','end 2']);
});

test('scenario failures retain label and reject only after independent in-flight tests settle',async()=>{
 const runs=[],cases=[['broken',async()=>{throw Error('checked regression')}],
  ['another',async()=>{runs.push('finished')}],['not-started',async()=>runs.push('wrong')]];
 await assert.rejects(runIndependentSmokes(cases,null,null,{concurrency:2}),error=>
  error instanceof AggregateError&&error.message.includes('browser scenario')&&
  error.errors[0].message.includes('broken')&&
  error.errors[0].cause.message==='checked regression');
 assert.ok(!runs.includes('wrong'));
 assert.deepEqual(runs,['finished']);
 await assert.rejects(runIndependentSmokes([],null,null,{concurrency:0}),/Invalid smoke concurrency/);
});

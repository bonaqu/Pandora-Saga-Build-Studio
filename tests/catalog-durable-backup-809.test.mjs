import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {queueBackupStatement,getBackupJob,completeBackupJob,deliverCatalogBackupJob}
 from '../worker/pandora-studio-catalog-backup-outbox.js';
import worker from '../worker/index.js';
const snapshot='ps-test-durable-809';
function fake(){
 let row=null;
 const DB={get row(){return row},prepare(sql){
  let args=[];
  return {bind(...a){args=a;return this},async first(){
   if(sql.startsWith('SELECT snapshot,attempts'))return row&&
    ['pending','retry','running'].includes(row.state)&&row.next_attempt_at<=args[0]&&
    (row.state!=='running'||row.lease_until<args[1])?{snapshot:row.snapshot,attempts:row.attempts}:null;
   if(sql.startsWith('SELECT snapshot,state'))return row?.snapshot===args[0]?{...row}:null;
   throw Error('Unexpected SELECT '+sql);
  },async run(){
   if(sql.startsWith('INSERT')){
    row={snapshot:args[0],state:'pending',attempts:0,next_attempt_at:args[1],lease_until:0,
     updated_at:args[2],last_error:null,result_json:null};return {meta:{changes:1}};
   }
   if(!row)return {meta:{changes:0}};
   if(sql.includes("state='running',attempts=")){
    if(row.snapshot!==args[2]||row.next_attempt_at>args[3]||
       row.state==='running'&&row.lease_until>=args[4])return {meta:{changes:0}};
    Object.assign(row,{state:'running',attempts:row.attempts+1,lease_until:args[0],updated_at:args[1]});
   }else if(sql.includes("state='superseded'")){
    Object.assign(row,{state:'superseded',lease_until:0,updated_at:args[0]});
   }else if(sql.includes("state='done'")){
    if(row.state==='superseded')return {meta:{changes:0}};
    Object.assign(row,{state:'done',next_attempt_at:0,lease_until:0,
     updated_at:args[0],result_json:args[1],last_error:null});
   }else if(sql.includes('SET state=?')){
    Object.assign(row,{state:args[0],next_attempt_at:args[1],lease_until:0,
     updated_at:args[2],last_error:args[3]});
   }else throw Error('Unexpected UPDATE '+sql);
   return {meta:{changes:1}};
  }};
 }};
 return DB;
}
const active=async()=>({snapshot});
test('server job is durable and succeeds without the owner browser',async()=>{
 const DB=fake(),env={DB};await queueBackupStatement(env,snapshot,1000).run();
 assert.equal((await getBackupJob(env,snapshot)).state,'pending');
 const result=await deliverCatalogBackupJob(env,active,async(_env,old,read)=>{
  assert.equal(old.snapshot,snapshot);assert.equal(await read(),snapshot);
  return {url:'https://github.com/bonaqu/Pandora-Saga-Build-Studio/pull/900',number:900};
 },{now:()=>2000});
 assert.equal(result.state,'done');
 assert.equal((await getBackupJob(env,snapshot)).result.number,900);
 assert.equal((await deliverCatalogBackupJob(env,active,()=>{}, {now:()=>3000})).state,'idle');
});
test('superseded snapshot is never sent to GitHub',async()=>{
 const DB=fake(),env={DB};await queueBackupStatement(env,snapshot,1000).run();
 const result=await deliverCatalogBackupJob(env,async()=>({snapshot:'ps-next-version'}),
  ()=>{throw Error('unexpected GitHub request')},{now:()=>2000});
 assert.equal(result.state,'superseded');
 assert.equal(DB.row.state,'superseded');
});
test('temporary failure to read active D1 never destroys a queued job',async()=>{
 const DB=fake(),env={DB};await queueBackupStatement(env,snapshot,1000).run();
 const result=await deliverCatalogBackupJob(env,async()=>null,
  ()=>{throw Error('GitHub must not run while D1 is unknown')},{now:()=>2000});
 assert.equal(result.state,'unavailable');assert.equal(DB.row.state,'pending');
});
test('temporary network failures retry and do not falsely report success',async()=>{
 const DB=fake(),env={DB};await queueBackupStatement(env,snapshot,1000).run();
 const fail=async()=>{throw Error('network lost')};
 assert.equal((await deliverCatalogBackupJob(env,active,fail,{now:()=>2000})).state,'retry');
 assert.equal(DB.row.next_attempt_at,62000);
 assert.equal((await deliverCatalogBackupJob(env,active,fail,{now:()=>61000})).state,'idle');
 assert.equal((await deliverCatalogBackupJob(env,active,async()=>({unchanged:true}),{now:()=>62000})).state,'done');
 assert.equal(DB.row.attempts,2);
});
test('GitHub branch conflicts halt unsafe retries',async()=>{
 const DB=fake(),env={DB};await queueBackupStatement(env,snapshot,1000).run();
 const conflict=Object.assign(new Error('branch mismatch'),{status:409});
 assert.equal((await deliverCatalogBackupJob(env,active,async()=>{throw conflict},{now:()=>2000})).state,'attention');
 assert.equal(await completeBackupJob(env,snapshot,{unchanged:true},3000),true);
 assert.equal(DB.row.state,'done');
});
test('Cron does not require a manual D1 migration before the first owner import',async()=>{
 const DB={prepare(sql){assert.match(sql,/sqlite_master/);return {async first(){return null}}}};
 let task;
 await worker.scheduled(null,{DB},{waitUntil(p){task=p}});
 assert.ok(task);
 await task;
});
test('publish pointer/outbox batch, Cron and UI status are connected',()=>{
 const w=readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
 const c=readFileSync(new URL('../worker/scripts/prepare-config.mjs',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../pandora-os-catalog-workbench.js',import.meta.url),'utf8');
 assert.match(w,/env\.DB\.batch\(\[statement,backup\]\)/);
 assert.match(w,/async scheduled\(_event,env,ctx\)/);
 assert.match(w,/\/api\/admin\/catalog\/backup-status/);
 assert.match(c,/crons = \["\*\/5 \* \* \* \*"\]/);
 assert.match(ui,/startBackupTracking\(snapshot\)/);
 assert.match(ui,/Каталог обновлён\. Проверено разделов:/);
 assert.match(w,/ctx\.waitUntil\(task\)/,
  'After a successful D1 CAS commit, the Worker immediately schedules the backup');
 assert.match(w,/deliverCatalogBackupJob\(env,activeCatalog,createCatalogPullRequest\)/);
});

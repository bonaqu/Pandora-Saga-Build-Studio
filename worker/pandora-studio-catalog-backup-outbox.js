// Durable D1 outbox: enqueue atomically with catalog_current in the publish batch.
export const BACKUP_OUTBOX_SCHEMA="CREATE TABLE IF NOT EXISTS catalog_backup_jobs ("+
 "snapshot TEXT PRIMARY KEY,state TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,"+
 "next_attempt_at INTEGER NOT NULL,lease_until INTEGER NOT NULL DEFAULT 0,"+
 "updated_at INTEGER NOT NULL,last_error TEXT,result_json TEXT)";
const valid=s=>typeof s==='string'&&/^[a-z0-9-]{8,64}$/.test(s);
const updated=r=>Number(r?.meta?.changes||0)===1;
const safe=r=>({unchanged:r?.unchanged===true,
 url:/^https:\/\/github\.com\/bonaqu\/Pandora-Saga-Build-Studio\/pull\/\d+$/.test(r?.url||'')?r.url:null,
 number:Number.isSafeInteger(r?.number)?r.number:null});
export function queueBackupStatement(env,snapshot,now=Date.now()){
 if(!valid(snapshot))throw Error('Invalid backup snapshot');
 return env.DB.prepare("INSERT INTO catalog_backup_jobs(snapshot,state,attempts,next_attempt_at,lease_until,updated_at) VALUES(?,'pending',0,?,0,?)").bind(snapshot,now,now);
}
export async function getBackupJob(env,snapshot){
 if(!valid(snapshot))return null;
 const row=await env.DB.prepare('SELECT snapshot,state,attempts,next_attempt_at,last_error,result_json FROM catalog_backup_jobs WHERE snapshot=?').bind(snapshot).first();
 if(!row)return null;
 let result=null;try{result=JSON.parse(row.result_json||'null')}catch{}
 return {snapshot:row.snapshot,state:row.state,attempts:row.attempts,nextAttemptAt:row.next_attempt_at,
  lastError:row.last_error||null,...(result?{result}:{})};
}
export async function completeBackupJob(env,snapshot,result,now=Date.now()){
 if(!valid(snapshot))return false;
 return updated(await env.DB.prepare(
  "UPDATE catalog_backup_jobs SET state='done',next_attempt_at=0,lease_until=0,updated_at=?,last_error=NULL,result_json=? WHERE snapshot=? AND state<>'superseded'"
 ).bind(now,JSON.stringify(safe(result)),snapshot).run());
}
export async function deliverCatalogBackupJob(env,readActive,createPR,{now=Date.now}={}){
 const stamp=now(),job=await env.DB.prepare(
  "SELECT snapshot,attempts FROM catalog_backup_jobs WHERE next_attempt_at<=? AND (state='pending' OR state='retry' OR (state='running' AND lease_until<?)) ORDER BY updated_at DESC LIMIT 1"
 ).bind(stamp,stamp).first();
 if(!job)return {state:'idle'};
 const snapshot=job.snapshot;
 if(!valid(snapshot))return {state:'invalid'};
 const active=await readActive(env);
 // A temporary D1 read failure is not evidence of a superseded snapshot.
 if(!active)return {state:'unavailable',snapshot};
 if(active.snapshot!==snapshot){
  await env.DB.prepare("UPDATE catalog_backup_jobs SET state='superseded',lease_until=0,updated_at=? WHERE snapshot=? AND state IN ('pending','retry','running')").bind(stamp,snapshot).run();
  return {state:'superseded',snapshot};
 }
 const lease=stamp+240000;
 const claim=await env.DB.prepare(
  "UPDATE catalog_backup_jobs SET state='running',attempts=attempts+1,lease_until=?,updated_at=? WHERE snapshot=? AND next_attempt_at<=? AND (state='pending' OR state='retry' OR (state='running' AND lease_until<?))"
 ).bind(lease,stamp,snapshot,stamp,stamp).run();
 if(!updated(claim))return {state:'claimed',snapshot};
 try{
  const result=await createPR(env,active,async()=>(await readActive(env))?.snapshot||null);
  await env.DB.prepare(
   "UPDATE catalog_backup_jobs SET state='done',next_attempt_at=0,lease_until=0,updated_at=?,last_error=NULL,result_json=? WHERE snapshot=? AND state='running' AND lease_until=?"
  ).bind(now(),JSON.stringify(safe(result)),snapshot,lease).run();
  return {state:'done',snapshot,result:safe(result)};
 }catch(error){
  const latest=await readActive(env);
  if(latest&&latest.snapshot!==snapshot){
   await env.DB.prepare("UPDATE catalog_backup_jobs SET state='superseded',lease_until=0,updated_at=? WHERE snapshot=? AND state='running' AND lease_until=?").bind(now(),snapshot,lease).run();
   return {state:'superseded',snapshot};
  }
  const attention=[400,401,403,409,428].includes(Number(error?.status));
  const attempts=Math.max(1,Number(job.attempts||0)+1);
  const delay=Math.min(3600000,60000*2**Math.min(attempts-1,6));
  const state=attention?'attention':'retry',next=attention?0:now()+delay;
  await env.DB.prepare("UPDATE catalog_backup_jobs SET state=?,next_attempt_at=?,lease_until=0,updated_at=?,last_error=? WHERE snapshot=? AND state='running' AND lease_until=?")
   .bind(state,next,now(),String(error?.message||'GitHub unavailable').slice(0,180),snapshot,lease).run();
  return {state,snapshot,attempts,nextAttemptAt:next};
 }
}

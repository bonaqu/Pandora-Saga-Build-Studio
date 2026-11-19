// Production D1 triage. SQL probes and analytics are read-only.
// Never print SQL result payloads, tokens, account data, snapshot IDs or raw errors.
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const TARGET_ACCOUNT='57ac934cd0f0a7f5e8533177d612f893';
const TARGET_DB='0f8fbcd8-be06-414c-844b-a2091fdf6784';
if(!process.env.CLOUDFLARE_API_TOKEN||
 process.env.CLOUDFLARE_ACCOUNT_ID!==TARGET_ACCOUNT||
 process.env.PS_D1_DATABASE_ID!==TARGET_DB){
 console.error('D1 diagnostics refused: missing credentials or wrong production target');
 process.exit(1);
}
const workerDir=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const invoke=args=>spawnSync('npx',['--yes','wrangler@4','d1',...args],{
 cwd:workerDir,env:process.env,encoding:'utf8',timeout:60000,maxBuffer:1024*1024
});
// Cloudflare began enforcing Free row budgets in September 2026. Distinguish
// quota exhaustion from missing schema; a rollback cannot fix a daily quota.
function category(raw){
 const message=String(raw||'');
 if(/exceeded D1.s free tier daily row read limit/i.test(message))
  return 'free_daily_row_read_quota_exhausted';
 if(/exceeded D1.s free tier daily row write limit/i.test(message))
  return 'free_daily_row_write_quota_exhausted';
 if(/maximum account storage limit|Exceeded maximum DB size/i.test(message))
  return 'database_storage_limit';
 if(/no such table/i.test(message))return 'missing_table';
 if(/no such column/i.test(message))return 'missing_column';
 if(/malformed database schema|database disk image is malformed|SQLITE_CORRUPT/i.test(message))
  return 'database_integrity_error';
 if(/overloaded|requests queued for too long|7429/i.test(message))
  return 'database_overloaded';
 if(/timed out|timeout|ETIMEDOUT/i.test(message))return 'query_timeout';
 if(/not authorized|unauthorized|permission denied|7403/i.test(message))
  return 'insufficient_permissions';
 if(/database not found|7404/i.test(message))return 'database_not_found';
 if(/D1_ERROR|SQLITE_ERROR/i.test(message))return 'D1_SQL_error_other';
 return 'query_unavailable_unclassified';
}
const checks=[
 ['basic_select','SELECT 1 AS reachable'],
 ['tables',"SELECT name FROM sqlite_master WHERE type='table' AND name IN ('catalog_current','catalog_entries','user_accounts','user_sessions','user_registration_limits','private_builds') ORDER BY name"],
 ['active_catalog_rows','SELECT COUNT(*) AS rows FROM catalog_current'],
 ['catalog_entry_rows','SELECT COUNT(*) AS rows FROM catalog_entries'],
 ['published_catalog_entry_rows','SELECT COUNT(*) AS rows FROM catalog_entries WHERE snapshot=(SELECT snapshot FROM catalog_current WHERE id=1)'],
 ['account_columns','PRAGMA table_info(user_accounts)'],
 ['session_columns','PRAGMA table_info(user_sessions)']
];
const insightsOnly=process.argv.includes('--insights-only');
let failures=0;
if(!insightsOnly){
for(const [label,sql] of checks){
 // Defense in depth: never allow a D1 mutation from this diagnostics script.
 if(!/^(?:SELECT\s|PRAGMA\s+table_info\()/i.test(sql)||sql.includes(';'))
  throw Error('Non-read-only D1 query refused: '+label);
 const result=invoke(['execute','ps-build-studio-db','--remote','--json','--command',sql]);
 if(result.error||result.status!==0){
  failures++;
  const reason=category(String(result.stderr||'')+' '+String(result.stdout||'')+
   ' '+String(result.error?.message||''));
  console.warn('D1 probe '+label+': '+reason+'; no query contents shown');
  continue;
 }
 try{
  const parsed=JSON.parse(result.stdout||'null');
  const groups=Array.isArray(parsed)?parsed:[parsed];
  if(!groups.length||groups.some(group=>!group||group.success===false)){
   failures++;
   const reason=category(groups.map(group=>String(group?.error||group?.message||'')).join(' '));
   console.warn('D1 probe '+label+': '+reason+'; query unsuccessful');
   continue;
  }
  const rows=groups.flatMap(group=>Array.isArray(group.results)?group.results:[]);
  // Names are fixed schema identifiers, counts are aggregate. No records.
  const clean=rows.map(row=>({
   ...(typeof row.name==='string'?{name:row.name.slice(0,60)}:{}),
   ...(Number.isSafeInteger(row.rows)?{rows:row.rows}:{}),
   ...(Number.isSafeInteger(row.reachable)?{reachable:row.reachable}:{})
  })).slice(0,60);
  console.log('D1 probe '+label+': '+JSON.stringify(clean));
 }catch{
  failures++;
  console.warn('D1 probe '+label+': invalid response shape; raw output withheld');
 }
}
}
// Query insights use Cloudflare's analytics API, not an SQL SELECT on D1.
// This allows examining daily read volume even when free SQL rows are exhausted.
// Account Analytics Read permission may be absent; do not fail the incident job.
const insightsPeriod=process.argv.includes('--period=1h')?'1h':'1d';
const insights=invoke(['insights','ps-build-studio-db','--time-period='+insightsPeriod,
 '--sort-by=reads','--sort-type=sum','--limit=20','--json']);
if(insights.status===0){
 try{
  const data=JSON.parse(insights.stdout||'null');
  const entries=Array.isArray(data)?data:Array.isArray(data?.result)?data.result:[];
  const queryClass=raw=>{
   const sql=String(raw||'');
   if(/catalog_entries/i.test(sql))return 'catalog_entries';
   if(/catalog_current/i.test(sql))return 'catalog_current';
   if(/user_sessions|user_accounts/i.test(sql))return 'account_sessions';
   if(/private_builds/i.test(sql))return 'private_build_library';
   if(/shared_builds|shared_build_sources/i.test(sql))return 'shared_build_previews';
   if(/login_attempts|user_registration_limits|shared_build_limits/i.test(sql))return 'security_limits';
   if(/(?:^|\W)overrides(?:\W|$)/i.test(sql))return 'ui_overrides';
   if(/(?:sqlite_master|pragma_table)/i.test(sql))return 'schema_lookup';
   if(/catalog_backup_jobs/i.test(sql))return 'catalog_backup_outbox';
   return 'other_query';
  };
  const byClass=new Map();
  for(const [i,item] of entries.slice(0,20).entries()){
   const number=value=>{
    const v=Number(value);return Number.isFinite(v)&&v>=0?Math.round(v):null;
   };
   const queryClassName=queryClass(item.query),rowsRead=number(item.totalRowsRead),
    rowsWritten=number(item.totalRowsWritten),executions=number(item.numberOfTimesRun);
   const previous=byClass.get(queryClassName)||{rowsRead:0,rowsWritten:0,executions:0};
   byClass.set(queryClassName,{rowsRead:previous.rowsRead+(rowsRead||0),
    rowsWritten:previous.rowsWritten+(rowsWritten||0),
    executions:previous.executions+(executions||0)});
   console.log('D1 insight '+(i+1)+': '+JSON.stringify({
    queryClass:queryClassName,rowsRead,rowsWritten,executions,avgRowsRead:number(item.avgRowsRead)
   }));
  }
  if(!entries.length)console.log('D1 insights: no metrics supplied');
  else console.log('D1 insights: top 20 query-class aggregates (not account totals): '+
   JSON.stringify(Object.fromEntries(byClass)));
  console.log('D1 Analytics report: trailing '+insightsPeriod+'; no SQL probes');
 }catch{console.warn('D1 insights: response unavailable or format changed')}
}else console.warn('D1 insights: unavailable (check Account Analytics Read); raw error withheld');

if(insightsOnly){
 console.log('D1 Analytics-only inspection complete; no D1 SQL probes executed.');
}else if(failures){
 console.error('Read-only D1 triage: '+failures+' of '+checks.length+
  ' SQL probes unavailable. No writes attempted.');
 process.exitCode=1;
}else console.log('Read-only D1 triage complete. No writes attempted.');

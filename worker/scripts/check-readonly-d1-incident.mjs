// Production incident triage. All queries are read-only schema/aggregate probes.
// Prints no token, account identity, record payload or catalog snapshot value.
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const TARGET_ACCOUNT='57ac934cd0f0a7f5e8533177d612f893';
const TARGET_DB='0f8fbcd8-be06-414c-844b-a2091fdf6784';
if(!process.env.CLOUDFLARE_API_TOKEN||
 process.env.CLOUDFLARE_ACCOUNT_ID!==TARGET_ACCOUNT||
 process.env.PS_D1_DATABASE_ID!==TARGET_DB){
 console.error('Read-only D1 diagnostics: missing credentials or wrong production target');
 process.exit(1);
}
const workerDir=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const checks=[
 ['tables', "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('catalog_current','catalog_entries','user_accounts','user_sessions','user_registration_limits','private_builds') ORDER BY name"],
 ['active_catalog_rows','SELECT COUNT(*) AS rows FROM catalog_current'],
 ['catalog_entry_rows','SELECT COUNT(*) AS rows FROM catalog_entries'],
 ['published_catalog_entry_rows','SELECT COUNT(*) AS rows FROM catalog_entries WHERE snapshot=(SELECT snapshot FROM catalog_current WHERE id=1)'],
 ['account_columns','PRAGMA table_info(user_accounts)'],
 ['session_columns','PRAGMA table_info(user_sessions)']
];
let errors=0;
for(const [label,sql] of checks){
 // Even a future edit to this script must not create a write-capable probe.
 if(!/^(?:SELECT\\s|PRAGMA\\s+table_info\\()/i.test(sql)||sql.includes(';'))
  throw Error('Non-read-only D1 query refused: '+label);
 const result=spawnSync('npx',[
  '--yes','wrangler@4','d1','execute','ps-build-studio-db','--remote',
  '--json','--command',sql
 ],{cwd:workerDir,env:process.env,encoding:'utf8',timeout:60000,maxBuffer:1024*1024});
 if(result.error||result.status!==0){
  errors++;
  const description=String(result.stderr||'')+' '+String(result.stdout||'');
  const category=description.match(/no such table|no such column|SQLITE_ERROR|D1_ERROR|rate limit|timed out|unauthorized|permission denied/i)?.[0]||'query unavailable';
  console.warn('D1 incident '+label+': '+category+'; no content returned');
  continue;
 }
 try{
  const parsed=JSON.parse(result.stdout||'null');
  const groups=Array.isArray(parsed)?parsed:[parsed];
  if(!groups.length||groups.some(group=>!group||group.success===false))
   throw Error('D1 returned unsuccessful query');
  const rows=groups.flatMap(group=>Array.isArray(group.results)?group.results:[]);
  // The only printed result properties are schema column/table names and
  // aggregate COUNT(*). Never log raw SQL result rows or diagnostic payloads.
  const clean=rows.map(row=>({
   ...(typeof row.name==='string'?{name:row.name.slice(0,60)}:{}),
   ...(Number.isSafeInteger(row.rows)?{rows:row.rows}:{})
  })).slice(0,60);
  console.log('D1 incident '+label+': '+JSON.stringify(clean));
 }catch{
  errors++;
  console.warn('D1 incident '+label+': response not valid diagnostic JSON');
 }
}
if(errors){
 console.error('Read-only D1 incident triage: '+errors+' of '+checks.length+' probes unavailable; no writes attempted.');
 process.exitCode=1;
}else console.log('Read-only D1 incident triage complete; no writes attempted.');

#!/usr/bin/env node
// #390: production EDITORIAL-ONLY preflight. All Cloudflare commands are SELECT,
// PRAGMA table_xinfo or D1 list; never export private rows or write to D1.
// The independent normal production tables/accounts/builds are not read.
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {
 assertDatabaseIdentity,assertStagingSchema,assertStagingTableColumns,
 PRODUCTION_D1_ID
} from './guard-editorial-staging-d1.mjs';
import {buildEditorialDefaultsManifest,renderEditorialDefaultsReadbackSQL,
 parseWranglerEditorialReadback,verifyEditorialDefaultsReadback} from './plan-editorial-d1-defaults.mjs';

const ACCOUNT_ID='57ac934cd0f0a7f5e8533177d612f893';
const DB_NAME='ps-build-studio-db';
const TABLES=Object.freeze(['editorial_default_rows','editorial_default_snapshots']);
const CODE=/^[a-f0-9]{64}$/;
const MANIFEST=buildEditorialDefaultsManifest();

export function assertProductionIdentity(raw,{name=DB_NAME,id=PRODUCTION_D1_ID}={}){
 if(name!==DB_NAME||id!==PRODUCTION_D1_ID)
  throw Error('Unexpected production D1 target');
 return assertDatabaseIdentity(raw,{name,id});
}
export function readProductionEditorialSchema(raw){
 const result=assertStagingSchema(raw);
 if(result.tables.length===1)
  throw Error('Incomplete editorial schema: only one of the two reviewed tables exists');
 return Object.freeze({tables:result.tables,
  installed:result.tables.length===2});
}
export function parseProductionPresence(raw,manifest=MANIFEST){
 let payload;
 try{payload=JSON.parse(raw)}catch{throw Error('Malformed production editorial readback JSON')}
 if(!Array.isArray(payload)||payload.length!==1||
  payload[0]?.success!==true||!Array.isArray(payload[0].results)||
  payload[0].results.length!==1)
  throw Error('Production editorial readback must return exactly one successful row');
 const row=payload[0].results[0];
 if(!row||typeof row!=='object'||Array.isArray(row)||
  Object.keys(row).sort().join('|')!==
   'expected_rows|marker_digest|marker_release|markers|rows')
  throw Error('Unexpected production editorial readback shape');
 if(!Number.isSafeInteger(row.markers)||!Number.isSafeInteger(row.rows)||
  row.markers<0||row.rows<0||row.markers>1)
  throw Error('Invalid production editorial counts');
 if(row.markers===0&&row.rows===0&&row.marker_digest===null&&
  row.marker_release===null&&row.expected_rows===null)
  return Object.freeze({status:'not_installed',rows:0,markers:0});
 if(row.markers!==1||row.rows!==manifest.records.length||
  row.marker_digest!==manifest.digest||row.marker_release!==manifest.release||
  row.expected_rows!==manifest.records.length||!CODE.test(row.marker_digest||''))
  throw Error('Production editorial snapshot does not match the pinned manifest');
 return Object.freeze({status:'installed',markers:1,rows:row.rows,
  snapshot:manifest.snapshot,digest:row.marker_digest});
}
export function productionPresenceSQL(manifest=MANIFEST){
 const snap=String(manifest.snapshot);
 if(!/^[0-9]+\.[0-9]+\.[0-9]+-[a-f0-9]{16}$/.test(snap)||
  !CODE.test(manifest.digest)||manifest.records.length<1)
  throw Error('Invalid pinned manifest for production read-only inspection');
 const quoted="'"+snap+"'";
 return "SELECT "+
  "(SELECT COUNT(*) FROM editorial_default_snapshots WHERE snapshot="+quoted+") AS markers,"+
  "(SELECT COUNT(*) FROM editorial_default_rows WHERE snapshot="+quoted+") AS rows,"+
  "(SELECT sha256 FROM editorial_default_snapshots WHERE snapshot="+quoted+") AS marker_digest,"+
  "(SELECT source_release FROM editorial_default_snapshots WHERE snapshot="+quoted+") AS marker_release,"+
  "(SELECT expected_rows FROM editorial_default_snapshots WHERE snapshot="+quoted+") AS expected_rows;";
}
export function checkedReadOnlySQL(query){
 const value=String(query||'').trim();
 // Exact generated full-content query is the only extra SQL allowed.
 // Reject caller-supplied alternative queries, even if read-only-looking.
 const fullReadback=renderEditorialDefaultsReadbackSQL(MANIFEST)
  .replace(/^\s*--[^\n]*(?:\n|$)/gm,'').trim();
 if(value===fullReadback)return value;
 if(value.includes('--')||value.includes('/*')||value.includes('\n')||
  !/^(?:SELECT\s|PRAGMA table_xinfo\((?:editorial_default_rows|editorial_default_snapshots)\);$)/i.test(value)||
  value.split(';').length!==2||value.indexOf(';')!==value.length-1)
  throw Error('Unsafe or multiple-statement production SQL rejected');
 return value;
}
function wrangler(args,{timeout=150000}={}){
 const proc=spawnSync('npx',['--yes','wrangler@4','d1',...args],{
  encoding:'utf8',timeout,maxBuffer:5*1024*1024,
  env:process.env
 });
 if(proc.error||proc.status!==0)throw Error('Production read-only Wrangler operation failed; step '+args[0]);
 if(!proc.stdout?.trim())throw Error('Production read-only Wrangler returned no data');
 return proc.stdout;
}
function query(config,sql){
 return wrangler(['execute',DB_NAME,'--remote','--config',config,
  '--command',checkedReadOnlySQL(sql),'--json']);
}
export async function verifyProductionWorker(fetcher=fetch){
 const endpoint='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const health=await fetcher(endpoint+'/api/health',{
  cache:'no-store',signal:AbortSignal.timeout(18000)
 });
 const healthy=await health.json().catch(()=>null);
 if(!health.ok||healthy?.storage!=='d1'||healthy?.features?.catalog!==true)
  throw Error('Existing public Worker/production D1 is not healthy');
 const url=endpoint+'/api/editorial-defaults?snapshot='+MANIFEST.snapshot;
 const response=await fetcher(url,{cache:'no-store',signal:AbortSignal.timeout(18000)});
 if(response.status===404)return 'disabled';
 if(response.status!==200)
  throw Error('Unexpected public editorial reader HTTP '+response.status);
 const data=await response.json().catch(()=>null);
 if(data?.snapshot!==MANIFEST.snapshot||data.sha256!==MANIFEST.digest||
  data.release!==MANIFEST.release||!Array.isArray(data.records)||
  data.records.length!==MANIFEST.records.length)
  throw Error('Already enabled production reader is not pinned to the audited source');
 const digest=createHash('sha256').update(JSON.stringify({schema:1,
  release:data.release,records:data.records}),'utf8').digest('hex');
 if(data.schema!==1||digest!==MANIFEST.digest)
  throw Error('Public Worker editorial row content SHA-256 does not match reviewed source');
 // Do not log or persist the full source-authorial response.
 return 'enabled-and-pinned';
}
export async function main(){
 if(process.argv.length!==2)throw Error('Production preflight takes no arguments');
 if(process.env.CLOUDFLARE_ACCOUNT_ID!==ACCOUNT_ID||
  process.env.PS_D1_DATABASE_ID!==PRODUCTION_D1_ID||
  !process.env.CLOUDFLARE_API_TOKEN)
  throw Error('Production D1 account, UUID, or API token not configured');
 const temp=mkdtempSync(join(tmpdir(),'ps390-production-readonly-'));
 try{
  const config=join(temp,'wrangler.toml');
  writeFileSync(config,[
   'name = "ps390-production-readonly"',
   'compatibility_date = "2026-10-20"',
   '[[d1_databases]]',
   'binding = "EDITORIAL_READONLY_DB"',
   'database_name = "'+DB_NAME+'"',
   'database_id = "'+PRODUCTION_D1_ID+'"',''
  ].join('\n'),{mode:0o600});
  assertProductionIdentity(wrangler(['list','--json']));
  const tables=readProductionEditorialSchema(query(config,
   "SELECT name,type FROM sqlite_master WHERE name IN ('editorial_default_rows','editorial_default_snapshots') ORDER BY name;"));
  for(const table of TABLES)
   if(tables.installed)assertStagingTableColumns(query(config,
    'PRAGMA table_xinfo('+table+');'),table,true);
  const state=tables.installed?
   parseProductionPresence(query(config,productionPresenceSQL())):
   {status:'tables_absent',markers:0,rows:0};
  // A count/marker check cannot detect a same-count corrupted authorial row.
  // Read every pinned D1 value and hash canonical content independently.
  let readback=null;
  if(tables.installed&&state.status==='installed'){
   const fullSQL=checkedReadOnlySQL(renderEditorialDefaultsReadbackSQL(MANIFEST)
    .replace(/^\s*--[^\n]*(?:\n|$)/gm,'').trim());
   const parsed=parseWranglerEditorialReadback(query(config,fullSQL));
   const verdict=verifyEditorialDefaultsReadback(MANIFEST,parsed.metadata,parsed.rows);
   if(!verdict.ok)throw Error('Independent production full readback mismatch: '+verdict.reason);
   readback={checkedRows:verdict.checkedRows,sha256:verdict.digest};
  }
  const worker=await verifyProductionWorker();
  if(worker==='enabled-and-pinned'&&state.status!=='installed')
   throw Error('Public Worker advertises pinned editorial data without matching production D1 tables');
  console.log('PRODUCTION EDITORIAL READ-ONLY PREFLIGHT SUCCESS');
  console.log(JSON.stringify({
   target:'ps-build-studio-db',database_id:PRODUCTION_D1_ID,
   snapshot:MANIFEST.snapshot,digest:MANIFEST.digest,
   expected_rows:MANIFEST.records.length,tables:tables.tables,
   snapshot_status:state.status,markers:state.markers,rows:state.rows,
   full_readback:readback,public_worker:worker,operation:'READ_ONLY_NO_D1_WRITE'
  }));
 }finally{rmSync(temp,{recursive:true,force:true})}
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))
 main().catch(err=>{console.error('PRODUCTION PREFLIGHT STOPPED: '+err.message);process.exitCode=1});

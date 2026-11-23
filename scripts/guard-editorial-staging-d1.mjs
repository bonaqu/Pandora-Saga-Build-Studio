#!/usr/bin/env node
// Issue #390: fail-closed STAGING database target checks. This script never
// talks to Cloudflare and never executes SQL; Wrangler is manual-only.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const PRODUCTION_D1_ID='0f8fbcd8-be06-414c-844b-a2091fdf6784';
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const NAME=/^ps-editorial-staging-[a-z0-9](?:[a-z0-9-]{0,40}[a-z0-9])?$/;
// A view, trigger or additional user-created index is not isolated staging.
// SQLite LIKE '_' matches ANY character: LIKE 'sqlite_%' accidentally hides
// user-created names such as sqliteXshadow. Use literal '_' with GLOB, after
// lower() for case-insensitive reserved sqlite_ internal entries only.
export const STAGING_SCHEMA_SQL=
 "SELECT type,name FROM sqlite_master WHERE type IN "+
 "('table','view','trigger','index') AND lower(name) NOT GLOB 'sqlite_*' "+
 "ORDER BY type,name;";

export function validateEditorialStagingTarget({name,id,operation,confirmation,accountId}){
 if(!['preflight','import','rollback'].includes(operation))
  throw Error('Invalid staging operation');
 if(typeof name!=='string'||!NAME.test(name))
  throw Error('Database name must explicitly identify isolated editorial staging');
 if(typeof id!=='string'||!UUID.test(id)||id.toLowerCase()===PRODUCTION_D1_ID)
  throw Error('Production/invalid D1 database UUID is forbidden');
 if(typeof accountId!=='string'||!/^[a-f0-9]{32}$/i.test(accountId))
  throw Error('Explicit staging Cloudflare account ID is required');
 if(operation!=='preflight'&&confirmation!==
   'CONFIRM-EDITORIAL-STAGING-'+name+'-'+operation)
  throw Error('Operation-specific manual staging confirmation is missing');
 return Object.freeze({name,id:id.toLowerCase(),accountId,operation});
}

function decode(raw){
 if(typeof raw!=='string'||raw.length>3_000_000)
  throw Error('Remote D1 JSON is missing or too large');
 try{return JSON.parse(raw)}catch{throw Error('Remote D1 JSON is malformed')}
}
export function assertDatabaseIdentity(raw,target){
 const data=decode(raw);
 const rows=Array.isArray(data)?data:
  Array.isArray(data?.result)?data.result:null;
 if(!rows)throw Error('Unexpected Wrangler d1 list schema');
 const named=rows.filter(row=>row?.name===target.name);
 if(named.length!==1||String(named[0].uuid??named[0].id??'').toLowerCase()!==target.id)
  throw Error('Staging D1 name and UUID did not match');
 return true;
}
function oneQuery(raw){
 const entries=decode(raw);
 if(!Array.isArray(entries)||entries.length!==1||
    entries[0]?.success!==true||!Array.isArray(entries[0]?.results))
  throw Error('Expected one successful Wrangler read-only SQL statement');
 return entries[0].results;
}
export function assertStagingSchema(raw){
 const rows=oneQuery(raw),seen=new Set();
 const allowed=new Set(['editorial_default_rows','editorial_default_snapshots']);
 for(const row of rows){
  if(!row||typeof row!=='object'||Array.isArray(row)||
     Object.keys(row).sort().join('|')!=='name|type'||
     row.type!=='table'||typeof row.name!=='string'||
     !allowed.has(row.name)||seen.has(row.name))
   throw Error('Target contains unexpected schema objects, tables or duplicates');
  seen.add(row.name);
 }
 return {tables:[...seen].sort()};
}
// A table with the right NAME but unexpected columns must not be written to.
// SQLite PRAGMA table_info yields cid/name/type/notnull/dflt_value/pk.
const stagingColumns=Object.freeze({
 editorial_default_rows:[
  ['snapshot','TEXT',1,1],['record_key','TEXT',1,2],
  ['field','TEXT',1,3],['value','TEXT',1,0]
 ],
 editorial_default_snapshots:[
  ['snapshot','TEXT',0,1],['source_release','TEXT',1,0],
  ['sha256','TEXT',1,0],['expected_rows','INTEGER',1,0],
  ['installed_at','INTEGER',1,0]
 ]
});
export function assertStagingTableColumns(raw,table,present){
 if(!Object.hasOwn(stagingColumns,table)||typeof present!=='boolean')
  throw Error('Unknown staging table requested for column audit');
 const rows=oneQuery(raw);
 if(!present){
  if(rows.length!==0)throw Error('Unexpected columns in absent staging table');
  return true;
 }
 const expected=stagingColumns[table];
 if(rows.length!==expected.length)
  throw Error('Unexpected staging D1 column count for '+table);
 for(const [index,[name,type,notnull,pk]] of expected.entries()){
  const row=rows[index];
  if(!row||typeof row!=='object'||Array.isArray(row)||
   Object.keys(row).sort().join('|')!=='cid|dflt_value|name|notnull|pk|type'||
   row.cid!==index||row.name!==name||row.type!==type||
   row.notnull!==notnull||row.pk!==pk||row.dflt_value!==null)
   throw Error('Staging D1 column layout differs from reviewed schema: '+table);
 }
 return true;
}

export function assertRolledBack(raw){
 const rows=oneQuery(raw);
 if(rows.length!==1||!rows[0]||typeof rows[0]!=='object'||
    Array.isArray(rows[0])||
    Object.keys(rows[0]).sort().join('|')!=='remaining_markers|remaining_rows'||
    rows[0].remaining_markers!==0||rows[0].remaining_rows!==0)
  throw Error('Exact D1 snapshot rollback was not complete');
 return true;
}
export function renderStagingWranglerConfig(target){
 return [
  'name = "pandora-editorial-staging-only"',
  'compatibility_date = "2026-10-01"',
  '[[d1_databases]]',
  'binding = "EDITORIAL_STAGING_DB"',
  'database_name = "'+target.name+'"',
  'database_id = "'+target.id+'"',
  ''
 ].join('\n');
}
function rollbackSnapshotLiteral(snapshot){
 if(typeof snapshot!=='string'||!/^0\.947\.0-[a-f0-9]{16}$/.test(snapshot))
  throw Error('Rollback must target a pinned release and digest snapshot');
 return "'"+snapshot+"'";
}
export function renderStagingRollbackPresenceSQL(snapshot){
 const name=rollbackSnapshotLiteral(snapshot);
 // Read-only existence check BEFORE exporting or mutating the target.
 // Partial imports may contain only rows, or only a marker: both qualify.
 return 'SELECT (SELECT COUNT(*) FROM editorial_default_snapshots WHERE snapshot='+
  name+') AS existing_markers, (SELECT COUNT(*) FROM editorial_default_rows WHERE snapshot='+
  name+') AS existing_rows;\n';
}
export function assertStagingRollbackPresent(raw){
 const rows=oneQuery(raw);
 if(rows.length!==1||!rows[0]||typeof rows[0]!=='object'||
  Array.isArray(rows[0])||
  Object.keys(rows[0]).sort().join('|')!=='existing_markers|existing_rows')
  throw Error('Missing or malformed read-only staging rollback presence');
 const markers=rows[0].existing_markers,values=rows[0].existing_rows;
 if(!Number.isSafeInteger(markers)||markers<0||markers>1||
  !Number.isSafeInteger(values)||values<0||!(markers||values))
  throw Error('No exact staging snapshot exists to roll back');
 return {markers,rows:values};
}
export function renderStagingRollbackCheckSQL(snapshot){
 const name=rollbackSnapshotLiteral(snapshot);
 return 'SELECT (SELECT COUNT(*) FROM editorial_default_snapshots WHERE snapshot='+
  name+') AS remaining_markers, (SELECT COUNT(*) FROM editorial_default_rows WHERE snapshot='+
  name+') AS remaining_rows;\n';
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const target=validateEditorialStagingTarget({
  name:process.env.PS_EDITORIAL_STAGING_NAME,
  id:process.env.PS_EDITORIAL_STAGING_ID,
  operation:process.env.PS_EDITORIAL_OPERATION,
  confirmation:process.env.PS_EDITORIAL_CONFIRMATION,
  accountId:process.env.CLOUDFLARE_ACCOUNT_ID
 });
 const [operation,file,second,third]=process.argv.slice(2);
 if(operation==='--validate'&&!file){
  process.stdout.write('Isolated staging D1 target approved by strict preflight\n');
 }else if(operation==='--write-config'&&file){
  writeFileSync(resolve(file),renderStagingWranglerConfig(target),{mode:0o600});
 }else if(operation==='--write-rollback-check'&&file){
  const {buildEditorialDefaultsManifest}=await import('./plan-editorial-d1-defaults.mjs');
  writeFileSync(resolve(file),
   renderStagingRollbackCheckSQL(buildEditorialDefaultsManifest().snapshot));
 }else if(file&&operation==='--verify-list'){
  assertDatabaseIdentity(readFileSync(resolve(file),'utf8'),target);
  process.stdout.write('Exact remote staging UUID confirmed\n');
 }else if(file&&operation==='--verify-schema'){
  const result=assertStagingSchema(readFileSync(resolve(file),'utf8'));
  process.stdout.write('Isolated staging schema confirmed: '+result.tables.length+' tables\n');
 }else if(operation==='--verify-columns'&&file&&second&&third){
  // Verify BOTH inventory and layout before allowing the manual workflow.
  const schema=assertStagingSchema(readFileSync(resolve(second),'utf8'));
  assertStagingTableColumns(readFileSync(resolve(third),'utf8'),file,
   schema.tables.includes(file));
  process.stdout.write('Exact staging columns confirmed: '+file+'\n');
 }else if(operation==='--write-rollback-presence-check'&&file){
  const {buildEditorialDefaultsManifest}=await import('./plan-editorial-d1-defaults.mjs');
  writeFileSync(resolve(file),
   renderStagingRollbackPresenceSQL(buildEditorialDefaultsManifest().snapshot));
 }else if(file&&operation==='--verify-rollback-presence'){
  const found=assertStagingRollbackPresent(readFileSync(resolve(file),'utf8'));
  process.stdout.write('Existing exact staging snapshot confirmed: '+
   found.markers+' marker / '+found.rows+' rows\n');
 }else if(file&&operation==='--verify-rollback'){
  assertRolledBack(readFileSync(resolve(file),'utf8'));
  process.stdout.write('Exact remote staging snapshot rollback confirmed\n');
 }else throw Error('Unrecognized staging validation or missing file');
}

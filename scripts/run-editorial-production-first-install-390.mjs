#!/usr/bin/env node
// #390: FIRST INSTALL of version-pinned authorial defaults in production D1.
// No account/build/catalog UPDATE/DELETE, no deployment or Worker activation.
// This script is callable only from owner-approved GitHub Actions workflow.
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {buildEditorialDefaultsManifest,renderEditorialDefaultsSQL,
 renderEditorialDefaultsReadbackSQL,parseWranglerEditorialReadback,
 verifyEditorialDefaultsReadback} from './plan-editorial-d1-defaults.mjs';
import {assertStagingSchema,assertStagingTableColumns} from './guard-editorial-staging-d1.mjs';
import {assertProductionIdentity,verifyProductionWorker,
 readProductionEditorialSchema} from './check-editorial-production-readonly.mjs';
import {decryptProductionSQL,proveProductionExportCanRestore}
 from './production-editorial-sealed-backup-390.mjs';

const REPO='bonaqu/Pandora-Saga-Build-Studio';
const ACCOUNT='57ac934cd0f0a7f5e8533177d612f893';
const DB='ps-build-studio-db';
const DB_ID='0f8fbcd8-be06-414c-844b-a2091fdf6784';
const BRANCH='work/947-issue390-editorial-parity';
const BACKUP_SOURCE='c065104cf8996c95a96b7f076fec0fbe38c94fc4';
const BACKUP_RUN=45724027475;
const BACKUP_ID=15072673742;
const ZIP_BYTES=41518725;
const ZIP_SHA='eafca586b7efaadd6801931c09b963f5bea5015eb50a92147f7b93304155fb6e';
const ENC_SHA='00512049d705155fd10bdf02c9149332cec0dea6d00d9d062620049ef5d1adf8';
const SQL_SHA='2e43f27faaa742b8143ab8cd4e8bd8997875a6eb791ad9cd261b3f429ad67fd3';
const DIGEST='5637e5c111eb452800609eb44f808f2f9d465277252595ad8e2c125f79cb6c8d';
const SNAPSHOT='0.948.0-5637e5c111eb4528';
const ROWS=2734;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const encFile='ps390-production-before-'+BACKUP_SOURCE.slice(0,12)+'.enc';
const artifactName='ps390-production-before-'+BACKUP_SOURCE+'-'+ENC_SHA;

export function assertPinnedProductionManifest(manifest){
 if(manifest?.snapshot!==SNAPSHOT||manifest?.digest!==DIGEST||
  manifest?.release!=='0.948.0'||manifest?.records?.length!==ROWS)
  throw Error('Source defaults changed since reviewed staging/production backup');
 return manifest;
}
export function assertOnlyPinnedProductionSQL(sql,manifest){
 if(typeof sql!=='string'||sql!==renderEditorialDefaultsSQL(assertPinnedProductionManifest(manifest)))
  throw Error('SQL is not the exact generated authorial-only first-install plan');
 // SQL literals can include authored newlines: NEVER count raw lines as statements.
 // Identity with the reviewed deterministic renderer above is the primary guard.
 const inserts=(sql.match(/(?:^|\n)INSERT INTO editorial_default_rows\(snapshot,record_key,field,value\) VALUES \(/g)||[]).length;
 const marker=(sql.match(/(?:^|\n)INSERT INTO editorial_default_snapshots\(/g)||[]).length;
 if(!sql.startsWith('-- DRY RUN SQL ONLY.')||
  !sql.includes('CREATE TABLE IF NOT EXISTS editorial_default_rows (')||
  !sql.includes('CREATE TABLE IF NOT EXISTS editorial_default_snapshots (')||
  inserts!==ROWS||marker!==1||
  !sql.includes('SELECT COUNT(*) AS actual_rows FROM editorial_default_rows')||
  !sql.includes('SELECT snapshot,source_release,sha256,expected_rows FROM editorial_default_snapshots'))
  throw Error('Unexpected generated D1 first-install SQL structure');
 return true;
}
export function assertOriginalBackupMetadata(artifact){
 if(artifact?.id!==BACKUP_ID||artifact?.expired!==false||
  artifact?.size_in_bytes!==ZIP_BYTES||
  artifact?.digest!=='sha256:'+ZIP_SHA||
  artifact?.name!==artifactName||
  artifact?.workflow_run?.id!==BACKUP_RUN||
  artifact?.workflow_run?.head_sha!==BACKUP_SOURCE)
  throw Error('Saved production backup artifact metadata is missing or has changed');
 return true;
}
export function assertOriginalBackupReceipt(receipt,encrypted,backupSql){
 if(receipt?.format!=='ps390-production-full-d1-aes256gcm-scrypt-v1'||
  receipt?.sourceSha!==BACKUP_SOURCE||receipt?.databaseId!==DB_ID||
  receipt?.snapshot!==SNAPSHOT||receipt?.expected_rows!==ROWS||
  receipt?.encryptedSha256!==ENC_SHA||receipt?.sqlSha256!==SQL_SHA||
  receipt?.artifactName!==artifactName||
  sha(encrypted)!==ENC_SHA||sha(backupSql)!==SQL_SHA)
  throw Error('Protected original production backup, receipt or SQL SHA mismatch');
 return true;
}
export function assertProductionInstallInputs(env,head){
 if(env.PS390_PRODUCTION_IMPORT_APPROVED!=='CONFIRM-PS390-PRODUCTION-FIRST-INSTALL-'+SNAPSHOT||
  env.CLOUDFLARE_ACCOUNT_ID!==ACCOUNT||
  env.PS_D1_DATABASE_ID!==DB_ID||
  !env.CLOUDFLARE_API_TOKEN||
  !env.GITHUB_TOKEN||
  typeof env.PS390_PRODUCTION_BACKUP_KEY!=='string'||
  env.PS390_PRODUCTION_BACKUP_KEY.length<32||
  env.PS390_PRODUCTION_BACKUP_KEY.length>512||
  !/^[a-f0-9]{40}$/.test(head)||head!==env.PS_EDITORIAL_EXPECTED_SHA)
  throw Error('Production protected approval, credentials or exact source SHA missing');
 return true;
}
function run(command,args,{timeout=200000,maxBuffer=10*1024*1024}={}){
 const p=spawnSync(command,args,{encoding:'utf8',timeout,maxBuffer,
  env:process.env,stdio:['ignore','pipe','pipe']});
 // Never print stdout/stderr from export, SQL or account data.
 if(p.error||p.status!==0)
  throw Error('Protected production step failed: '+command+' '+args[0]);
 return p.stdout||'';
}
function wrangler(args){
 return run('npx',['--yes','wrangler@4','d1',...args],{timeout:240000,maxBuffer:10*1024*1024});
}
function query(config,sql){
 const statement=sql.replace(/^\s*--[^\n]*(?:\n|$)/gm,'').trim();
 if(!/^SELECT\s/i.test(statement)||!statement.endsWith(';')||
  statement.indexOf(';')!==statement.length-1||statement.length>220000)
  throw Error('Only one bounded reviewed SELECT query permitted');
 return wrangler(['execute',DB,'--remote','--config',config,
  '--command',statement,'--json']);
}
function schema(config){
 const raw=query(config,
  "SELECT name,type FROM sqlite_master WHERE name IN ('editorial_default_rows','editorial_default_snapshots') ORDER BY name;");
 return readProductionEditorialSchema(raw);
}
function proveEmptyBeforeWrite(config){
 const result=schema(config);
 if(result.tables.length!==0)
  throw Error('Production editorial schema is no longer empty; manual investigation required');
 return result;
}
async function verifyOriginalBackup(dir){
 const headers={Authorization:'Bearer '+process.env.GITHUB_TOKEN,
  Accept:'application/vnd.github+json',
  'X-GitHub-Api-Version':'2022-11-28'};
 const base='https://api.github.com/repos/'+REPO+'/actions/artifacts/'+BACKUP_ID;
 const metadataResponse=await fetch(base,{headers,signal:AbortSignal.timeout(60000)});
 if(!metadataResponse.ok)throw Error('Original production backup artifact unavailable');
 assertOriginalBackupMetadata(await metadataResponse.json());
 const zipResponse=await fetch(base+'/zip',{headers,signal:AbortSignal.timeout(160000)});
 if(!zipResponse.ok)throw Error('Original production backup ZIP cannot be downloaded');
 const zip=Buffer.from(await zipResponse.arrayBuffer());
 if(zip.length!==ZIP_BYTES||sha(zip)!==ZIP_SHA)
  throw Error('Previously retained GitHub encrypted ZIP checksum differs');
 const zipPath=join(dir,'original-encrypted-backup.zip');
 writeFileSync(zipPath,zip,{mode:0o600,flag:'wx'});
 const entries=run('unzip',['-Z','-1',zipPath]).trim().split('\n').sort();
 if(entries.join('|')!==[encFile,'receipt.json'].sort().join('|'))
  throw Error('Original encrypted ZIP has unexpected files');
 const extract=join(dir,'original-encrypted-files');
 mkdirSync(extract,{mode:0o700});
 run('unzip',['-qq',zipPath,'-d',extract]);
 const encrypted=readFileSync(join(extract,encFile));
 const receipt=JSON.parse(readFileSync(join(extract,'receipt.json'),'utf8'));
 const sql=decryptProductionSQL(encrypted,process.env.PS390_PRODUCTION_BACKUP_KEY,
  {sourceSha:BACKUP_SOURCE,databaseId:DB_ID});
 assertOriginalBackupReceipt(receipt,encrypted,sql);
 proveProductionExportCanRestore(sql);
 console.log('Original owner-retained production backup: GitHub ZIP/.enc/SQL digests, AES-GCM decrypt and SQLite restore verified');
 // The owner's separately retained offline ZIP is attested, not automatically readable.
}
export async function main(){
 if(process.argv.length!==2)throw Error('Production installer accepts no arguments');
 const manifest=assertPinnedProductionManifest(buildEditorialDefaultsManifest());
 const head=run('git',['rev-parse','HEAD']).trim();
 assertProductionInstallInputs(process.env,head);
 if(run('git',['branch','--show-current']).trim()!==BRANCH||
  run('git',['status','--porcelain']).trim())
  throw Error('Source branch moved or checkout is unclean');
 if(await verifyProductionWorker()!=='disabled')
  throw Error('Public Worker editorial route already enabled; no first install');
 const dir=mkdtempSync(join(tmpdir(),'ps390-production-first-install-'));
 try{
  // Any artifact metadata, decrypt/restore or preflight failure occurs BEFORE write.
  await verifyOriginalBackup(dir);
  const config=join(dir,'wrangler.toml');
  writeFileSync(config,[
   'name = "ps390-editorial-production-install"',
   'compatibility_date = "2026-10-20"',
   '[[d1_databases]]',
   'binding = "EDITORIAL_FIRST_INSTALL_ONLY"',
   'database_name = "'+DB+'"',
   'database_id = "'+DB_ID+'"',''
  ].join('\n'),{mode:0o600});
  assertProductionIdentity(wrangler(['list','--json']));
  proveEmptyBeforeWrite(config);
  const sql=renderEditorialDefaultsSQL(manifest);
  assertOnlyPinnedProductionSQL(sql,manifest);
  const sqlPath=join(dir,'editorial-only-first-install.sql');
  writeFileSync(sqlPath,sql,{mode:0o600});
  // RECHECK identity, schema, and public route immediately before the write.
  assertProductionIdentity(wrangler(['list','--json']));
  proveEmptyBeforeWrite(config);
  if(await verifyProductionWorker()!=='disabled')
   throw Error('Public Worker changed before import; refusing production D1 write');
  console.log('Production first-install preflight passed; importing ONLY pinned editorial tables');
  wrangler(['execute',DB,'--remote','--config',config,'--file',sqlPath,'--yes']);
  // Verify actual remote row values, not merely the completion marker or counts.
  const after=schema(config);
  if(!after.installed)throw Error('Production editorial table pair absent after import');
  for(const table of ['editorial_default_rows','editorial_default_snapshots']){
   const raw=wrangler(['execute',DB,'--remote','--config',config,
    '--command','PRAGMA table_xinfo('+table+');','--json']);
   assertStagingTableColumns(raw,table,true);
  }
  const readback=query(config,renderEditorialDefaultsReadbackSQL(manifest));
  const parsed=parseWranglerEditorialReadback(readback);
  const verified=verifyEditorialDefaultsReadback(manifest,parsed.metadata,parsed.rows);
  if(!verified.ok)throw Error('REMOTE PRODUCTION READBACK MISMATCH: '+verified.reason+
   '; stop, do not deploy Worker/Pages, retain backup');
  if(await verifyProductionWorker()!=='disabled')
   throw Error('Worker route changed during install; inspect before deployment');
  console.log('PRODUCTION EDITORIAL FIRST INSTALL VERIFIED: '+verified.checkedRows+
   ' rows, SHA-256 '+verified.digest+', snapshot '+verified.snapshot);
  console.log('No Worker activation, Pages deployment, owner override or catalog write was performed.');
 }finally{rmSync(dir,{recursive:true,force:true})}
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))
 main().catch(e=>{console.error('PRODUCTION FIRST INSTALL STOPPED: '+e.message);process.exitCode=1});

#!/usr/bin/env node
// #390: production D1 FULL export is sensitive (accounts, build records).
// Only authenticated ciphertext + nonsecret receipt may leave the private runner.
// This module NEVER imports, deploys or writes to remote D1.
import {spawnSync} from 'node:child_process';
import {createCipheriv,createDecipheriv,createHash,randomBytes,scryptSync} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {appendFileSync,chmodSync,closeSync,constants,fsyncSync,
 lstatSync,mkdirSync,mkdtempSync,openSync,readFileSync,rmSync,statSync,
 writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename,dirname,join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertProductionIdentity} from './check-editorial-production-readonly.mjs';
import {buildEditorialDefaultsManifest} from './plan-editorial-d1-defaults.mjs';
const DB_NAME='ps-build-studio-db';
const DB_ID='0f8fbcd8-be06-414c-844b-a2091fdf6784';
const ACCOUNT='57ac934cd0f0a7f5e8533177d612f893';
const FORMAT='ps390-production-full-d1-aes256gcm-scrypt-v1';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const hex40=/^[a-f0-9]{40}$/, hex64=/^[a-f0-9]{64}$/;
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const MIN_BACKUP=128,MAX_BACKUP=128*1024*1024;
function key(pass){
 if(typeof pass!=='string'||pass.length<32||pass.length>512)
  throw Error('Private 32–512 character production backup recovery passphrase missing');
 return pass;
}
function context({sourceSha,databaseId}){
 if(!hex40.test(sourceSha||'')||databaseId!==DB_ID)
  throw Error('Production backup source SHA or exact database identity mismatch');
 return Object.freeze({sourceSha,databaseId});
}
function aad(value){
 return Buffer.from(JSON.stringify([FORMAT,value.sourceSha,value.databaseId,
  value.sqlSha256]),'utf8');
}
export function encryptProductionSQL(plaintext,passphrase,meta){
 key(passphrase);
 const ctx=context(meta);
 if(!Buffer.isBuffer(plaintext)||plaintext.byteLength<MIN_BACKUP||
  plaintext.byteLength>MAX_BACKUP)
  throw Error('Production SQL backup empty, truncated, or exceeds reviewed memory cap');
 const sqlSha256=sha(plaintext),salt=randomBytes(16),iv=randomBytes(12);
 const value={format:FORMAT,...ctx,sqlSha256};
 const derived=scryptSync(passphrase,salt,32,{N:32768,r:8,p:1,maxmem:64*1024*1024});
 const cipher=createCipheriv('aes-256-gcm',derived,iv);
 cipher.setAAD(aad(value));
 const body=Buffer.concat([cipher.update(plaintext),cipher.final()]);
 const envelope={...value,salt:salt.toString('base64'),iv:iv.toString('base64'),
  tag:cipher.getAuthTag().toString('base64'),ciphertext:body.toString('base64')};
 const bytes=Buffer.from(JSON.stringify(envelope)+'\n','utf8');
 if(!decryptProductionSQL(bytes,passphrase,ctx).equals(plaintext))
  throw Error('Encrypted production D1 round-trip did not match');
 return {bytes,encryptedSha256:sha(bytes),sqlSha256};
}
export function decryptProductionSQL(bytes,passphrase,meta){
 key(passphrase);
 const ctx=context(meta);
 if(!Buffer.isBuffer(bytes)||bytes.length<MIN_BACKUP||
  bytes.length>MAX_BACKUP*2)
  throw Error('Invalid encrypted production backup length');
 let obj;
 try{obj=JSON.parse(bytes.toString('utf8'))}
 catch{throw Error('Malformed encrypted production backup')};
 if(!obj||typeof obj!=='object'||Array.isArray(obj)||
  Object.keys(obj).sort().join('|')!==
   'ciphertext|databaseId|format|iv|salt|sourceSha|sqlSha256|tag'||
  obj.format!==FORMAT||obj.databaseId!==ctx.databaseId||
  obj.sourceSha!==ctx.sourceSha||!hex64.test(obj.sqlSha256||''))
  throw Error('Encrypted production source/identity/checksum metadata invalid');
 const decode=field=>{
  if(typeof obj[field]!=='string'||
   !/^[A-Za-z0-9+/]*={0,2}$/.test(obj[field]))
   throw Error('Invalid production ciphertext encoding');
  return Buffer.from(obj[field],'base64');
 };
 const salt=decode('salt'),iv=decode('iv'),tag=decode('tag'),body=decode('ciphertext');
 if(salt.length!==16||iv.length!==12||tag.length!==16||
  body.length<MIN_BACKUP||body.length>MAX_BACKUP)
  throw Error('Invalid production ciphertext nonce, tag, or size');
 const derived=scryptSync(passphrase,salt,32,{N:32768,r:8,p:1,maxmem:64*1024*1024});
 try{
  const decipher=createDecipheriv('aes-256-gcm',derived,iv);
  decipher.setAAD(aad(obj));decipher.setAuthTag(tag);
  const sql=Buffer.concat([decipher.update(body),decipher.final()]);
  if(sha(sql)!==obj.sqlSha256)throw Error('SQL hash mismatch');
  return sql;
 }catch{throw Error('Encrypted production backup authentication/decryption failed')}
}
export function proveProductionExportCanRestore(sql){
 if(!Buffer.isBuffer(sql)||sql.length<MIN_BACKUP||sql.length>MAX_BACKUP)
  throw Error('Invalid production D1 export for restore test');
 const db=new DatabaseSync(':memory:');
 try{
  db.exec(sql.toString('utf8'));
  if(db.prepare('PRAGMA integrity_check;').get()?.integrity_check!=='ok')
   throw Error('SQLite restore integrity check was not OK');
  const names=new Set(db.prepare(
   "SELECT name FROM sqlite_master WHERE type='table'").all().map(x=>x.name));
  // Core published data and owner edits must survive a full SQL replay.
  for(const table of ['admins','sessions','overrides','catalog_entries'])
   if(!names.has(table))throw Error('Restored production export missing required table '+table);
  return Object.freeze({ok:true,requiredTables:4});
 }catch(e){throw Error('PRODUCTION RESTORE PROOF FAILED: '+e.message)}
 finally{db.close()}
}
function subprocess(bin,args,options={}){
 const p=spawnSync(bin,args,{encoding:'utf8',timeout:220000,
  maxBuffer:6*1024*1024,...options});
 // Never print subprocess stdout or stderr: they may contain account data.
 if(p.error||p.status!==0)
  throw Error('Production backup Cloudflare read operation failed: '+args[0]);
 return p.stdout||'';
}
export async function main(){
 if(process.argv.length!==2)throw Error('Production backup command takes no inputs');
 const manifest=buildEditorialDefaultsManifest(),expected=process.env.PS_EDITORIAL_EXPECTED_SHA;
 context({sourceSha:expected,databaseId:process.env.PS_D1_DATABASE_ID});
 key(process.env.PS390_PRODUCTION_BACKUP_KEY);
 if(process.env.CLOUDFLARE_ACCOUNT_ID!==ACCOUNT||
  !process.env.CLOUDFLARE_API_TOKEN)
  throw Error('Exact production account and Cloudflare token required');
 if(subprocess('git',['rev-parse','HEAD']).trim()!==expected||
  subprocess('git',['branch','--show-current']).trim()!=='work/947-issue390-editorial-parity'||
  subprocess('git',['status','--porcelain']).trim())
  throw Error('PR branch/commit unclean or moved; no production backup');
 const folder=process.env.PS390_PRODUCTION_BACKUP_DIR;
 if(!folder||!resolve(folder).startsWith(resolve(process.env.HOME||'/')+sep)||
  resolve(folder).startsWith(root+sep))
  throw Error('Production export must be inside operator HOME, outside repo');
 mkdirSync(folder,{recursive:true,mode:0o700});
 if((statSync(folder).mode&0o777)!==0o700)
  throw Error('Production export directory must have private mode 0700');
 const out=process.env.PS390_PRODUCTION_CIPHER_DIR;
 if(!out||!resolve(out).startsWith(resolve(process.env.RUNNER_TEMP||'/')+sep))
  throw Error('Ciphertext must be inside isolated runner temp');
 mkdirSync(out,{recursive:true,mode:0o700});
 if((statSync(out).mode&0o777)!==0o700)
  throw Error('Encrypted output must have private mode 0700');
 const sqlPath=join(folder,'production-before-'+expected+'.sql');
 const config=join(folder,'wrangler-production-readonly.toml');
 const toml=['name = "ps390-production-export-only"',
  'compatibility_date = "2026-10-20"','[[d1_databases]]',
  'binding = "PRODUCTION_BACKUP_ONLY"','database_name = "'+DB_NAME+'"',
  'database_id = "'+DB_ID+'"',''].join('\n');
 writeFileSync(config,toml,{mode:0o600,flag:'wx'});
 try{
  const list=subprocess('npx',['--yes','wrangler@4','d1','list','--json']);
  assertProductionIdentity(list);
  if(lstatSync(folder).isSymbolicLink())
   throw Error('Backup directory must not be a symlink');
  subprocess('npx',['--yes','wrangler@4','d1','export',DB_NAME,
   '--remote','--config',config,'--output',sqlPath],{timeout:240000});
  chmodSync(sqlPath,0o600);
  const fd=openSync(sqlPath,constants.O_RDONLY|constants.O_NOFOLLOW);
  let sql;
  try{
   if(lstatSync(sqlPath).nlink!==1||statSync(sqlPath).size>MAX_BACKUP)
    throw Error('Unexpected SQL export hardlink or size');
   fsyncSync(fd);sql=readFileSync(fd);
  }finally{closeSync(fd)}
  proveProductionExportCanRestore(sql);
  const ctx={sourceSha:expected,databaseId:DB_ID};
  const sealed=encryptProductionSQL(sql,process.env.PS390_PRODUCTION_BACKUP_KEY,ctx);
  if(sealed.sqlSha256!==sha(sql))
   throw Error('Production export SHA changed before encryption');
  const filename='ps390-production-before-'+expected.slice(0,12)+'.enc';
  const artifactName='ps390-production-before-'+expected+'-'+sealed.encryptedSha256;
  writeFileSync(join(out,filename),sealed.bytes,{mode:0o600,flag:'wx'});
  const receipt={format:FORMAT,sourceSha:expected,databaseId:DB_ID,
   snapshot:manifest.snapshot,expected_rows:manifest.records.length,
   sqlSha256:sealed.sqlSha256,encryptedSha256:sealed.encryptedSha256,
   artifactName};
  writeFileSync(join(out,'receipt.json'),JSON.stringify(receipt,null,2)+'\n',
   {mode:0o600,flag:'wx'});
  if(process.env.GITHUB_OUTPUT)
   appendFileSync(process.env.GITHUB_OUTPUT,'artifact_name='+artifactName+'\n');
  console.log('PRODUCTION FULL D1 BACKUP SUCCESS: independently restored encrypted SQL');
  console.log('Pinned source SHA '+expected+'; snapshot '+manifest.snapshot);
  console.log('Encrypted .enc SHA-256 '+sealed.encryptedSha256);
  console.log('Original SQL SHA-256 '+sealed.sqlSha256);
  console.log('Retain encrypted ZIP and recovery password independently OFF GitHub.');
 }finally{
  rmSync(sqlPath,{force:true});rmSync(config,{force:true});
 }
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))
 main().catch(e=>{console.error('PRODUCTION BACKUP STOPPED: '+e.message);process.exitCode=1});

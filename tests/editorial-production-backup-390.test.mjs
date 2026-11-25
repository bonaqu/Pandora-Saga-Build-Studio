import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {
 encryptProductionSQL,decryptProductionSQL,proveProductionExportCanRestore
} from '../scripts/production-editorial-sealed-backup-390.mjs';
const meta={sourceSha:'a'.repeat(40),
 databaseId:'0f8fbcd8-be06-414c-844b-a2091fdf6784'};
const pass='prod full backup very secret '+('xY49!'.repeat(10));
const exportSQL=()=>{
 const db=new DatabaseSync(':memory:');
 try{
  db.exec('CREATE TABLE admins(id INTEGER);CREATE TABLE sessions(id INTEGER);'+
   'CREATE TABLE overrides(key TEXT,value TEXT);'+
   'CREATE TABLE catalog_entries(snapshot TEXT,payload TEXT);'+
   "INSERT INTO overrides VALUES('private','ACCOUNT_SECRET_NEVER_UPLOAD');");
  return Buffer.from([
   'CREATE TABLE admins(id INTEGER);','CREATE TABLE sessions(id INTEGER);',
   'CREATE TABLE overrides(key TEXT,value TEXT);',
   'CREATE TABLE catalog_entries(snapshot TEXT,payload TEXT);',
   "INSERT INTO overrides VALUES('private','ACCOUNT_SECRET_NEVER_UPLOAD');"
  ].join('\n')+'\n','utf8');
 }finally{db.close()}
};
test('#390 complete production SQL export restores required tables without exposing contents',()=>{
 const sql=exportSQL();
 assert.equal(proveProductionExportCanRestore(sql).ok,true);
 assert.throws(()=>proveProductionExportCanRestore(Buffer.from(
  'CREATE TABLE overrides(key TEXT);'.repeat(8))),/missing required table/);
 assert.throws(()=>proveProductionExportCanRestore(Buffer.from('DROP TABLE accounts;'.repeat(20))),
  /RESTORE PROOF FAILED/);
});
test('#390 production backup encryption authenticates exact SHA and D1 UUID',()=>{
 const sql=exportSQL();
 const sealed=encryptProductionSQL(sql,pass,meta);
 assert.equal(sealed.sqlSha256,createHash('sha256').update(sql).digest('hex'));
 assert.equal(sealed.encryptedSha256,
  createHash('sha256').update(sealed.bytes).digest('hex'));
 assert.ok(!sealed.bytes.toString().includes('ACCOUNT_SECRET_NEVER_UPLOAD'));
 assert.deepEqual(decryptProductionSQL(sealed.bytes,pass,meta),sql);
 assert.throws(()=>decryptProductionSQL(sealed.bytes,'wrong '.repeat(8),meta),
  /authentication/);
 assert.throws(()=>decryptProductionSQL(sealed.bytes,pass,
  {...meta,databaseId:'56757608-3492-4fae-b698-27c76918cdc1'}));
 assert.throws(()=>decryptProductionSQL(sealed.bytes,pass,
  {...meta,sourceSha:'b'.repeat(40)}));
 const tampered=JSON.parse(sealed.bytes.toString());
 tampered.ciphertext='A'+tampered.ciphertext.slice(1);
 assert.throws(()=>decryptProductionSQL(Buffer.from(JSON.stringify(tampered)),pass,meta),
  /authentication/);
 assert.throws(()=>encryptProductionSQL(sql,'short',meta));
});
test('#390 production CLI fails closed before reading Cloudflare if secret is missing',()=>{
 const file=fileURLToPath(new URL('../scripts/production-editorial-sealed-backup-390.mjs',
  import.meta.url));
 const p=spawnSync(process.execPath,[file],{
  encoding:'utf8',
  env:{...process.env,PS_EDITORIAL_EXPECTED_SHA:'a'.repeat(40),
   PS_D1_DATABASE_ID:meta.databaseId,PS390_PRODUCTION_BACKUP_KEY:''},
  timeout:30000
 });
 assert.notEqual(p.status,0);
 assert.match(p.stderr,/passphrase missing/);
 assert.doesNotMatch(p.stderr,/ACCOUNT_SECRET_NEVER_UPLOAD/);
});

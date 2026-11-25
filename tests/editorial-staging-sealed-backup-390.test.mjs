import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {openEditorialBackup,sealEditorialBackup,packageEditorialBackup}
 from '../scripts/seal-editorial-staging-backup.mjs';

const context={phase:'before',sourceSha:'a'.repeat(40),
 stagingId:'56757608-3492-4fae-b698-27c76918cdc1'};
const secret='correct horse backup phrase '+('abcXYZ0123456789!'.repeat(4));
const sql=Buffer.from("CREATE TABLE marker (v TEXT); INSERT INTO marker VALUES ('PRIVATE_CONTENT_NEVER_UPLOAD');\n");
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');

test('#390 encrypts authenticated D1 SQL and proves exact local decryption before artifact',()=>{
 const sealed=sealEditorialBackup(sql,secret,context);
 assert.equal(sealed.sqlSha256,sha256(sql));
 assert.equal(sealed.encryptedSha256,sha256(sealed.bytes));
 assert.equal(openEditorialBackup(sealed.bytes,secret,context).equals(sql),true);
 assert.ok(!sealed.bytes.toString().includes('PRIVATE_CONTENT_NEVER_UPLOAD'));
 assert.throws(()=>openEditorialBackup(sealed.bytes,'wrong '.repeat(8),context),
  /authentication/);
 for(const wrong of [
  {...context,phase:'after'}, {...context,sourceSha:'b'.repeat(40)},
  {...context,stagingId:'0f8fbcd8-be06-414c-844b-a2091fdf6784'}
 ])assert.throws(()=>openEditorialBackup(sealed.bytes,secret,wrong));
 assert.throws(()=>sealEditorialBackup(sql,'short',context));
 assert.throws(()=>sealEditorialBackup(Buffer.alloc(0),secret,context));
 const corrupted=JSON.parse(sealed.bytes.toString());
 corrupted.sqlSha256='f'.repeat(64);
 assert.throws(()=>openEditorialBackup(Buffer.from(JSON.stringify(corrupted)),secret,context),
  /authentication/);
 corrupted.sqlSha256=sha256(sql);
 corrupted.ciphertext=(corrupted.ciphertext[0]==='A'?'B':'A')+
  corrupted.ciphertext.slice(1);
 assert.throws(()=>openEditorialBackup(Buffer.from(JSON.stringify(corrupted)),secret,context),
  /authentication/);
});

test('#390 only encrypted ciphertext and an unprivileged receipt enter upload directory',()=>{
 const sandbox=mkdtempSync(join(tmpdir(),'ps390-encryption-test-'));
 const root=join(sandbox,'private'),out=join(sandbox,'sealed');
 try{
  mkdirSync(root,{mode:0o700});
  const file=join(root,'only-source.sql');
  writeFileSync(file,sql,{mode:0o600});
  writeFileSync(file+'.sha256',sha256(sql)+'  only-source.sql\n',{mode:0o600});
  const receipt=packageEditorialBackup(root,out,secret,context);
  assert.match(receipt.artifactName,/^ps390-before-a{40}-[a-f0-9]{64}$/);
  assert.equal(receipt.sqlSha256,sha256(sql));
  const contents=readdirSync(out).sort();
  assert.deepEqual(contents,['ps390-before-'+('a'.repeat(12))+'.enc','receipt.json']);
  const encrypted=readFileSync(join(out,contents[0]));
  assert.equal(openEditorialBackup(encrypted,secret,context).equals(sql),true);
  const meta=JSON.parse(readFileSync(join(out,'receipt.json'),'utf8'));
  assert.equal(meta.encryptedSha256,sha256(encrypted));
  assert.ok(!JSON.stringify(meta).includes('PRIVATE_CONTENT_NEVER_UPLOAD'));
  assert.throws(()=>packageEditorialBackup(root,out,secret,context),/EEXIST/);
  writeFileSync(file+'.sha256','0'.repeat(64)+'  only-source.sql\n');
  assert.throws(()=>packageEditorialBackup(root,join(sandbox,'bad'),secret,context),
   /checksum sidecar/);
 }finally{rmSync(sandbox,{recursive:true,force:true})}
});

test('#390 CLI never prints the SQL or recovery phrase and keeps exact source SHA',()=>{
 const source=new URL('../scripts/seal-editorial-staging-backup.mjs',import.meta.url);
 const sandbox=mkdtempSync(join(tmpdir(),'ps390-encrypted-cli-'));
 const backup=join(sandbox,'backup'),output=join(sandbox,'out');
 try{
  mkdirSync(backup,{mode:0o700});
  writeFileSync(join(backup,'before.sql'),sql,{mode:0o600});
  writeFileSync(join(backup,'before.sql.sha256'),
   sha256(sql)+'  before.sql\n',{mode:0o600});
  const result=spawnSync(process.execPath,[source.pathname,backup,output,'before'],{
   encoding:'utf8',env:{...process.env,PS390_BACKUP_ENCRYPTION_KEY:secret,
    PS_EDITORIAL_EXPECTED_SHA:context.sourceSha,
    PS_EDITORIAL_STAGING_ID:context.stagingId}
  });
  assert.equal(result.status,0,result.stderr);
  assert.ok(!result.stdout.includes('PRIVATE_CONTENT_NEVER_UPLOAD'));
  assert.ok(!result.stdout.includes(secret));
  assert.equal(readdirSync(output).length,2);
 }finally{rmSync(sandbox,{recursive:true,force:true})}
});

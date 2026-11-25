#!/usr/bin/env node
// #390: never upload raw D1 export SQL to public GitHub Actions artifacts.
// Encrypt authenticated SQL + manifest before upload; the operator retains
// the encrypted artifact AND independent recovery passphrase outside GitHub.
import {createCipheriv,createDecipheriv,createHash,randomBytes,scryptSync} from 'node:crypto';
import {constants,appendFileSync,lstatSync,mkdirSync,openSync,closeSync,
 readFileSync,readdirSync,statSync,writeFileSync} from 'node:fs';
import {basename,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyIndependentStagingBackup} from './run-editorial-staging-d1-premerge.mjs';

const FORMAT='ps390-d1-aes256gcm-scrypt-v1';
const STAGING_UUID='56757608-3492-4fae-b698-27c76918cdc1';
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const hex40=/^[a-f0-9]{40}$/;
const hex64=/^[a-f0-9]{64}$/;
const phases=['before','after'];

function checkedKey(passphrase){
 if(typeof passphrase!=='string'||passphrase.length<32||passphrase.length>512)
  throw Error('A private random recovery passphrase (32-512 characters) is required');
 return passphrase;
}
function checkedContext({phase,sourceSha,stagingId}){
 if(!phases.includes(phase)||typeof sourceSha!=='string'||
  !hex40.test(sourceSha)||stagingId!==STAGING_UUID)
  throw Error('Unexpected staging backup phase, source SHA or database UUID');
 return {phase,sourceSha,stagingId};
}
function cipherAAD(payload){
 return Buffer.from(JSON.stringify([FORMAT,payload.phase,payload.sourceSha,
  payload.stagingId,payload.sqlSha256]),'utf8');
}
export function sealEditorialBackup(sql,passphrase,context){
 checkedKey(passphrase);
 const {phase,sourceSha,stagingId}=checkedContext(context);
 if(!Buffer.isBuffer(sql)||sql.length<1)throw Error('Empty SQL export cannot be encrypted');
 const salt=randomBytes(16),iv=randomBytes(12),rawHash=sha256(sql);
 const payload={format:FORMAT,phase,sourceSha,stagingId,sqlSha256:rawHash};
 const key=scryptSync(passphrase,salt,32,{N:32768,r:8,p:1,maxmem:64*1024*1024});
 const cipher=createCipheriv('aes-256-gcm',key,iv);
 cipher.setAAD(cipherAAD(payload));
 const encrypted=Buffer.concat([cipher.update(sql),cipher.final()]);
 const envelope={...payload,salt:salt.toString('base64'),
  iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),
  ciphertext:encrypted.toString('base64')};
 const bytes=Buffer.from(JSON.stringify(envelope)+'\n');
 // Verify that the ciphertext can actually be decrypted BEFORE it is uploaded.
 const replay=openEditorialBackup(bytes,passphrase,context);
 if(!replay.equals(sql))throw Error('Encrypted backup replay does not match source SQL');
 return {bytes,sqlSha256:rawHash,encryptedSha256:sha256(bytes)};
}
export function openEditorialBackup(bytes,passphrase,context){
 checkedKey(passphrase);
 const requested=checkedContext(context);
 if(!Buffer.isBuffer(bytes)||bytes.length>64*1024*1024)
  throw Error('Invalid or oversized encrypted staging backup');
 let payload;
 try{payload=JSON.parse(bytes.toString('utf8'))}
 catch{throw Error('Encrypted staging backup is not valid JSON')}
 if(!payload||Array.isArray(payload)||typeof payload!=='object'||
  Object.keys(payload).sort().join('|')!==
  'ciphertext|format|iv|phase|salt|sourceSha|sqlSha256|stagingId|tag'||
  payload.format!==FORMAT||payload.phase!==requested.phase||
  payload.sourceSha!==requested.sourceSha||
  payload.stagingId!==requested.stagingId||
  typeof payload.sqlSha256!=='string'||!hex64.test(payload.sqlSha256))
  throw Error('Encrypted staging backup metadata or source SHA mismatch');
 const b64=field=>{
  if(typeof payload[field]!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(payload[field]))
   throw Error('Invalid staging backup encoded '+field);
  return Buffer.from(payload[field],'base64');
 };
 const salt=b64('salt'),iv=b64('iv'),tag=b64('tag'),ciphertext=b64('ciphertext');
 if(salt.length!==16||iv.length!==12||tag.length!==16||ciphertext.length<1)
  throw Error('Invalid staging backup nonce, salt, tag or ciphertext');
 const key=scryptSync(passphrase,salt,32,{N:32768,r:8,p:1,maxmem:64*1024*1024});
 try{
  const cipher=createDecipheriv('aes-256-gcm',key,iv);
  cipher.setAAD(cipherAAD(payload));
  cipher.setAuthTag(tag);
  const restored=Buffer.concat([cipher.update(ciphertext),cipher.final()]);
  if(sha256(restored)!==payload.sqlSha256)
   throw Error('Restored staging SQL digest mismatch');
  return restored;
 }catch{throw Error('Encrypted staging backup authentication/decryption FAILED')}
}
export function packageEditorialBackup(backupDirectory,outputDirectory,passphrase,context){
 checkedContext(context);
 const files=readdirSync(backupDirectory);
 const sqls=files.filter(x=>x.endsWith('.sql'));
 if(sqls.length!==1)throw Error('Expected exactly one independently verified SQL export');
 const sqlPath=join(backupDirectory,sqls[0]);
 if(!lstatSync(sqlPath).isFile())throw Error('Backup is not a regular file');
 const plainHash=verifyIndependentStagingBackup(sqlPath);
 const checksumPath=sqlPath+'.sha256';
 if(readFileSync(checksumPath,'utf8')!==
  plainHash+'  '+basename(sqlPath)+'\n')
  throw Error('Export checksum sidecar differs from verified SQL');
 const sealed=sealEditorialBackup(readFileSync(sqlPath),passphrase,context);
 if(sealed.sqlSha256!==plainHash)
  throw Error('Sealed backup SQL SHA-256 differs from retained export');
 mkdirSync(outputDirectory,{recursive:true,mode:0o700});
 if((statSync(outputDirectory).mode&0o777)!==0o700)
  throw Error('Encrypted backup output directory must be private 0700');
 const stub='ps390-'+context.phase+'-'+context.sourceSha.slice(0,12);
 const filename=stub+'.enc',artifactName='ps390-'+context.phase+'-'+
  context.sourceSha+'-'+sealed.encryptedSha256;
 const receipt={format:FORMAT,phase:context.phase,sourceSha:context.sourceSha,
  stagingId:context.stagingId,encryptedSha256:sealed.encryptedSha256,
  sqlSha256:plainHash,artifactName};
 writeFileSync(join(outputDirectory,filename),sealed.bytes,{mode:0o600,flag:'wx'});
 writeFileSync(join(outputDirectory,'receipt.json'),JSON.stringify(receipt,null,2)+'\n',
  {mode:0o600,flag:'wx'});
 return receipt;
}

async function main(){
 if(process.argv.length!==5)
  throw Error('Usage: seal-editorial-staging-backup.mjs BACKUP_DIR ENCRYPTED_DIR before|after');
 const phase=process.argv[4];
 const sourceSha=process.env.PS_EDITORIAL_EXPECTED_SHA;
 const stagingId=process.env.PS_EDITORIAL_STAGING_ID;
 const receipt=packageEditorialBackup(process.argv[2],process.argv[3],
  process.env.PS390_BACKUP_ENCRYPTION_KEY,{phase,sourceSha,stagingId});
 if(process.env.GITHUB_OUTPUT)
  appendFileSync(process.env.GITHUB_OUTPUT,'artifact_name='+receipt.artifactName+'\n');
 process.stdout.write('Authenticated encrypted backup created. Phase '+phase+
  ', source '+sourceSha+', encrypted SHA-256 '+receipt.encryptedSha256+
  ', original SQL SHA-256 '+receipt.sqlSha256+'\n'+
  'DOWNLOAD the encrypted artifact and retain its recovery passphrase OFF GitHub.'+
  ' Neither SQL nor recovery passphrase is printed or uploaded.\n');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))
 main().catch(error=>{
  process.stderr.write('BACKUP SEAL STOPPED: '+error.message+'\n');
  process.exitCode=1;
 });

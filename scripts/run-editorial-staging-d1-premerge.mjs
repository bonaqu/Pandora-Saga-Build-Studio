#!/usr/bin/env node
// #390: explicitly approved PRE-MERGE remote staging D1 rehearsal.
// GitHub workflow_dispatch requires its YAML on the default branch, so this
// alternative can be run from a clean PR checkout without merging the PR.
// Importing this module never invokes Wrangler or writes anything remotely.
import {spawnSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {constants,closeSync,existsSync,fchmodSync,fstatSync,fsyncSync,
 lstatSync,mkdtempSync,openSync,readFileSync,realpathSync,rmSync,
 statSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename,dirname,isAbsolute,join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
 STAGING_SCHEMA_SQL,validateEditorialStagingTarget,assertDatabaseIdentity,
 assertStagingSchema,assertStagingTableColumns,assertRolledBack,
 renderStagingWranglerConfig,
 renderStagingRollbackCheckSQL
} from './guard-editorial-staging-d1.mjs';
import {
 buildEditorialDefaultsManifest,renderEditorialDefaultsSQL,
 renderEditorialDefaultsReadbackSQL,renderEditorialDefaultsRollbackSQL,
 parseWranglerEditorialReadback,verifyEditorialDefaultsReadback
} from './plan-editorial-d1-defaults.mjs';

const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const PR_BRANCH='work/947-issue390-editorial-parity';

export function assertPremergeSource(actualBranch,actualSha,expectedSha,dirty){
 if(actualBranch!==PR_BRANCH)throw Error('Not on the approved #390 PR branch');
 if(typeof expectedSha!=='string'||!/^[a-f0-9]{40}$/i.test(expectedSha)||
  actualSha!==expectedSha)throw Error('Explicit pinned PR HEAD SHA does not match');
 if(dirty)throw Error('Uncommitted or untracked files: source snapshot is not clean');
 return actualSha;
}

export function checkedBackupDirectory(directory,repoDir=repo,tempDir=tmpdir()){
 if(typeof directory!=='string'||!isAbsolute(directory))
  throw Error('Provide an existing absolute PS_EDITORIAL_BACKUP_DIR for independent backup');
 const destination=realpathSync(directory);
 const details=statSync(destination);
 if(!details.isDirectory())throw Error('Backup location is not a directory');
 // A complete staging SQL export is sensitive, including pre-existing data.
 // Forbid shared directories even when the Cloudflare target is isolated.
 if(typeof process.getuid==='function'&&details.uid!==process.getuid())
  throw Error('Staging backup directory must belong to the current operator');
 if((details.mode&0o777)!==0o700)
  throw Error('Staging backup directory must have private mode 0700');
 const inDir=(root,path)=>path===root||path.startsWith(root+sep);
 if(inDir(realpathSync(repoDir),destination)||
  inDir(realpathSync(tempDir),destination))
  throw Error('Independent backup must be outside repository and system temp');
 return destination;
}

// An export is a durable backup only when it is a private regular file
// flushed to disk. Check this before ANY remote staging import/rollback.
export function verifyIndependentStagingBackup(path){
 const details=lstatSync(path);
 if(!details.isFile()||details.isSymbolicLink()||details.size===0)
  throw Error('Staging backup must be a nonempty regular SQL file');
 // Keep the same inode open from verification through chmod, flush and hash.
 // O_NOFOLLOW prevents a symlink swap between lstat and open on Linux/WSL.
 const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{
  const opened=fstatSync(fd);
  if(!opened.isFile()||opened.size===0||opened.ino!==details.ino||
   opened.dev!==details.dev)
   throw Error('Staging backup changed while opening the verified export');
  if(typeof process.getuid==='function'&&opened.uid!==process.getuid())
   throw Error('Staging backup is not owned by the operator');
  fchmodSync(fd,0o600);
  fsyncSync(fd);
  return createHash('sha256').update(readFileSync(fd)).digest('hex');
 }finally{closeSync(fd)}
}
function syncBackupFile(path){
 const fd=openSync(path,'r');
 try{fsyncSync(fd)}finally{closeSync(fd)}
}
function syncBackupDirectory(path){
 // Persist directory entries for both newly created backup and checksum:
 // fsync(file) alone does not guarantee crash-safe file creation on Linux.
 const fd=openSync(path,constants.O_RDONLY);
 try{fsyncSync(fd)}finally{closeSync(fd)}
}

function run(command,args,{env=process.env}={}){
 const result=spawnSync(command,args,{
  cwd:repo,encoding:'utf8',maxBuffer:16*1024*1024,
  env,windowsHide:true,stdio:['ignore','pipe','pipe']
 });
 if(result.error||result.status!==0){
  const token=env.CLOUDFLARE_API_TOKEN||'';
  const safe=String(result.stderr||result.error?.message||'')
   .replaceAll(token||'\u0000','[redacted]').slice(-850);
  throw Error(command+' failed (exit '+String(result.status)+'): '+safe);
 }
 return result.stdout;
}
const git=(args)=>run('git',args).trim();

export function validateCliInputs(operation,env){
 if(!['preflight','import','rollback'].includes(operation))
  throw Error('Usage: node scripts/run-editorial-staging-d1-premerge.mjs preflight|import|rollback');
 if(typeof env.CLOUDFLARE_API_TOKEN!=='string'||!env.CLOUDFLARE_API_TOKEN.trim())
  throw Error('A dedicated staging-only CLOUDFLARE_API_TOKEN is required');
 const target=validateEditorialStagingTarget({
  name:env.PS_EDITORIAL_STAGING_NAME,id:env.PS_EDITORIAL_STAGING_ID,
  operation,confirmation:env.PS_EDITORIAL_CONFIRMATION,
  accountId:env.CLOUDFLARE_ACCOUNT_ID
 });
 if(operation!=='preflight'&&!env.PS_EDITORIAL_BACKUP_DIR)
  throw Error('Writes require an independent staging backup directory');
 return target;
}

export function plannedStagingCommands(target,config,sqlFile){
 const execute=['execute',target.name,'--remote','--config',config];
 return Object.freeze({
  list:['list','--json'],
  schema:[...execute,'--command',STAGING_SCHEMA_SQL,'--json'],
  columns:table=>{
   if(!['editorial_default_rows','editorial_default_snapshots'].includes(table))
    throw Error('Unallowlisted staging schema inspection');
   return [...execute,'--command','PRAGMA table_info('+table+');','--json'];
  },
  export:output=>['export',target.name,'--remote','--config',config,
   '--output',output,'--skip-confirmation'],
  executeFile:[...execute,'--file',sqlFile,'--yes'],
  readFile:[...execute,'--file',sqlFile,'--json']
 });
}

async function main(){
 if(process.platform==='win32')
  throw Error('Run staging preflight under Linux or WSL with Node 22; no Windows shell execution');
 const operation=process.argv[2];
 if(process.argv.length!==3)throw Error('Specify exactly one staging operation');
 const target=validateCliInputs(operation,process.env);
 assertPremergeSource(git(['branch','--show-current']),git(['rev-parse','HEAD']),
  process.env.PS_EDITORIAL_EXPECTED_SHA,git(['status','--porcelain']));
 const manifest=buildEditorialDefaultsManifest();
 const stagingDir=mkdtempSync(join(tmpdir(),'ps-editorial-staging-390-'));
 const stagingConfig=join(stagingDir,'wrangler.toml');
 const stagingSQL=join(stagingDir,'staging.sql');
 const cmd=plannedStagingCommands(target,stagingConfig,stagingSQL);
 const wrangler=args=>run('npx',['--yes','wrangler@4','d1',...args]);
 try{
  writeFileSync(stagingConfig,renderStagingWranglerConfig(target),{mode:0o600});
  // Every path, including preflight, checks the API's exact remote UUID and
  // fails closed when unrelated tables exist. No SQL write before this.
  assertDatabaseIdentity(wrangler(cmd.list),target);
  const schema=assertStagingSchema(wrangler(cmd.schema));
  // A same-named legacy/spoofed table is not safe to reuse; audit each
  // existing table's exact SQLite column types and key ordering as read-only.
  for(const table of ['editorial_default_rows','editorial_default_snapshots'])
   assertStagingTableColumns(wrangler(cmd.columns(table)),table,
    schema.tables.includes(table));
  process.stdout.write('Remote staging UUID confirmed; allowed tables: '+
   schema.tables.length+'; pinned source '+process.env.PS_EDITORIAL_EXPECTED_SHA+'\n');
  if(operation==='preflight'){
   process.stdout.write('READ-ONLY preflight complete. No D1 records changed.\n');
   return;
  }

  // Independent persistent backup is mandatory before ANY import/rollback.
  // Backups are deliberately not stored in the checkout or system temp.
  const backupRoot=checkedBackupDirectory(process.env.PS_EDITORIAL_BACKUP_DIR);
  const backup=join(backupRoot,'editorial-before-'+target.name+'-'+
   manifest.snapshot+'-'+randomUUID()+'.sql');
  if(existsSync(backup))throw Error('Refusing to overwrite a staging backup');
  wrangler(cmd.export(backup));
  const hash=verifyIndependentStagingBackup(backup);
  writeFileSync(backup+'.sha256',hash+'  '+basename(backup)+'\n',{
   flag:'wx',mode:0o600
  });
  syncBackupFile(backup+'.sha256');
  syncBackupDirectory(backupRoot);
  // This is safe to display: never print a token, account secret or SQL data.
  process.stdout.write('Independent staging export retained: '+backup+
   ' (SHA-256 '+hash+')\n');

  if(operation==='import'){
   writeFileSync(stagingSQL,renderEditorialDefaultsSQL(manifest),{mode:0o600});
   wrangler(cmd.executeFile);
   writeFileSync(stagingSQL,renderEditorialDefaultsReadbackSQL(manifest),{mode:0o600});
   const parsed=parseWranglerEditorialReadback(wrangler(cmd.readFile));
   const check=verifyEditorialDefaultsReadback(manifest,parsed.metadata,parsed.rows);
   if(!check.ok)throw Error('Remote staging D1 SHA-256 readback FAILED: '+check.reason+
    '. Do not activate; inspect the backup and perform separately confirmed rollback.');
   process.stdout.write('Verified remote staging rows '+check.checkedRows+
    ', snapshot '+check.snapshot+', SHA-256 '+check.digest+'\n');
  }else{
   writeFileSync(stagingSQL,renderEditorialDefaultsRollbackSQL(manifest),{mode:0o600});
   wrangler(cmd.executeFile);
   writeFileSync(stagingSQL,renderStagingRollbackCheckSQL(manifest.snapshot),{mode:0o600});
   assertRolledBack(wrangler(cmd.readFile));
   process.stdout.write('Verified exact snapshot rollback: '+manifest.snapshot+'\n');
  }
 }finally{
  rmSync(stagingDir,{recursive:true,force:true});
 }
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 main().catch(error=>{
  process.stderr.write('STAGING STOPPED: '+String(error.message||error)+'\n');
  process.exitCode=1;
 });
}

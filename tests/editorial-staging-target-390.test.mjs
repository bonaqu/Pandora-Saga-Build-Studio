import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 PRODUCTION_D1_ID,validateEditorialStagingTarget,assertDatabaseIdentity,
 assertStagingSchema,assertStagingTableColumns,assertRolledBack,
 renderStagingWranglerConfig,
 renderStagingRollbackCheckSQL
} from '../scripts/guard-editorial-staging-d1.mjs';
const repo=new URL('../',import.meta.url);
const name='ps-editorial-staging-390';
const id='8adfd82a-3a19-45fe-acfe-499bf97be455';
const accountId='a'.repeat(32);
const target=operation=>validateEditorialStagingTarget({
 name,id,accountId,operation,
 confirmation:'CONFIRM-EDITORIAL-STAGING-'+name+'-'+operation
});
const query=rows=>JSON.stringify([{success:true,results:rows}]);

test('#390 staging gate refuses production D1, wrong operation and unconfirmed writes',()=>{
 for(const operation of ['preflight','import','rollback']){
  const value=target(operation);
  assert.equal(value.id,id);
  assert.equal(value.name,name);
 }
 for(const bad of [
  {name:'ps-build-studio-db'},
  {name:'ps-editorial-staging-390;DELETE'},
  {name:'ps-editorial-staging-390"'},
  {name:'ps-editorial-staging-390/path'},
  {id:PRODUCTION_D1_ID},{id:'bad'},
  {accountId:'wrong'},{operation:'deploy'},
  {operation:'import',confirmation:'CONFIRM-EDITORIAL-STAGING-'+name+'-rollback'},
  {operation:'rollback',confirmation:''}
 ]){
  const operation=bad.operation||'import';
  assert.throws(()=>validateEditorialStagingTarget({
   name,id,accountId,operation,
   confirmation:'CONFIRM-EDITORIAL-STAGING-'+name+'-'+operation,...bad
  }));
 }
});

test('#390 D1 list requires unique matching database name AND UUID',()=>{
 assert.equal(assertDatabaseIdentity(JSON.stringify([{name,uuid:id}]),target('import')),true);
 for(const raw of [
  'not json','{}','[]',
  JSON.stringify([{name:'ps-build-studio-db',uuid:id}]),
  JSON.stringify([{name,uuid:PRODUCTION_D1_ID}]),
  JSON.stringify([{name,uuid:id},{name,uuid:id}]),
  JSON.stringify([{name,id:PRODUCTION_D1_ID}])
 ])assert.throws(()=>assertDatabaseIdentity(raw,target('import')));
});

test('#390 staging schema denies any account/build/overrides/catalog tables',()=>{
 assert.deepEqual(assertStagingSchema(query([])),{tables:[]});
 assert.deepEqual(assertStagingSchema(query([
  {name:'editorial_default_rows'},{name:'editorial_default_snapshots'}
 ])),{tables:['editorial_default_rows','editorial_default_snapshots']});
 for(const raw of [
  query([{name:'accounts'}]),query([{name:'builds'}]),
  query([{name:'overrides'}]),query([{name:'catalogs'}]),
  query([{name:'editorial_default_rows'},{name:'editorial_default_rows'}]),
  query([{name:'editorial_default_rows',value:'unexpected'}]),
  JSON.stringify([{success:false,results:[]}]),
  JSON.stringify([{success:true,results:[]},{success:true,results:[]}])
 ])assert.throws(()=>assertStagingSchema(raw));
});

test('#390 staging table names must also have exact expected column types and keys',()=>{
 const rows=[
  {cid:0,name:'snapshot',type:'TEXT',notnull:1,dflt_value:null,pk:1},
  {cid:1,name:'record_key',type:'TEXT',notnull:1,dflt_value:null,pk:2},
  {cid:2,name:'field',type:'TEXT',notnull:1,dflt_value:null,pk:3},
  {cid:3,name:'value',type:'TEXT',notnull:1,dflt_value:null,pk:0}
 ];
 const snapshots=[
  {cid:0,name:'snapshot',type:'TEXT',notnull:0,dflt_value:null,pk:1},
  {cid:1,name:'source_release',type:'TEXT',notnull:1,dflt_value:null,pk:0},
  {cid:2,name:'sha256',type:'TEXT',notnull:1,dflt_value:null,pk:0},
  {cid:3,name:'expected_rows',type:'INTEGER',notnull:1,dflt_value:null,pk:0},
  {cid:4,name:'installed_at',type:'INTEGER',notnull:1,dflt_value:null,pk:0}
 ];
 assert.equal(assertStagingTableColumns(query(rows),'editorial_default_rows',true),true);
 assert.equal(assertStagingTableColumns(query(snapshots),'editorial_default_snapshots',true),true);
 assert.equal(assertStagingTableColumns(query([]),'editorial_default_rows',false),true);
 assert.equal(assertStagingTableColumns(query([]),'editorial_default_snapshots',false),true);
 for(const changed of [
  rows.slice(1),rows.concat({...rows[0],cid:4,name:'extra'}),
  rows.map((row,i)=>i===1?{...row,type:'INTEGER'}:row),
  rows.map((row,i)=>i===0?{...row,pk:0}:row),
  rows.map((row,i)=>i===2?{...row,notnull:0}:row),
  rows.map((row,i)=>i===2?{...row,dflt_value:"'text'"}:row),
  rows.map((row,i)=>i===3?{...row,unexpected:'extra'}:row)
 ])assert.throws(()=>assertStagingTableColumns(
  query(changed),'editorial_default_rows',true));
 assert.throws(()=>assertStagingTableColumns(query(rows),'editorial_default_rows',false));
 assert.throws(()=>assertStagingTableColumns(query([]),'other_table',false));
 assert.throws(()=>assertStagingTableColumns(query([]),'editorial_default_rows','false'));
});

test('#390 independent rollback checks exact snapshot, both row classes, and JSON success',()=>{
 const snapshot='0.947.0-'+'f'.repeat(16);
 const sql=renderStagingRollbackCheckSQL(snapshot);
 assert.ok(sql.includes("WHERE snapshot='"+snapshot+"'"));
 assert.equal((sql.match(/WHERE snapshot=/g)||[]).length,2);
 assert.ok(!sql.includes('ORDER BY installed_at'));
 assert.throws(()=>renderStagingRollbackCheckSQL("0.947.0-ffffffffffffffff' OR 1=1"));
 assert.throws(()=>renderStagingRollbackCheckSQL('0.945.0-ffffffffffffffff'));
 assert.equal(assertRolledBack(query([{remaining_markers:0,remaining_rows:0}])),true);
 for(const bad of [
  query([{remaining_markers:1,remaining_rows:0}]),
  query([{remaining_markers:0,remaining_rows:1}]),
  query([]),query([{remaining_markers:'0',remaining_rows:0}]),
  query([{remaining_markers:0,remaining_rows:0,other:1}]),
  JSON.stringify([{success:false,results:[{remaining_markers:0,remaining_rows:0}]}])
 ])assert.throws(()=>assertRolledBack(bad));
});

test('#390 manual staging workflow never runs on push, uses new staging-only credentials and prior export',()=>{
 const config=renderStagingWranglerConfig(target('import'));
 assert.match(config,/binding = "EDITORIAL_STAGING_DB"/);
 assert.match(config,/database_name = "ps-editorial-staging-390"/);
 assert.match(config,/database_id = "8adfd82a-3a19-45fe-acfe-499bf97be455"/);
 assert.doesNotMatch(config,/ps-build-studio-db|0f8fbcd8-be06-414c-844b-a2091fdf6784/);
 const workflow=readFileSync(new URL('.github/workflows/editorial-staging-d1-manual.yml',repo),'utf8');
 assert.match(workflow,/workflow_dispatch:/);
 assert.doesNotMatch(workflow,/^\s+(?:push|pull_request|schedule):/m);
 assert.match(workflow,/refs\/heads\/work\/947-issue390-editorial-parity/);
 assert.match(workflow,/secrets\.EDITORIAL_STAGING_CF_TOKEN/);
 assert.match(workflow,/secrets\.EDITORIAL_STAGING_CF_DATABASE_ID/);
 assert.doesNotMatch(workflow,/secrets\.CLOUDFLARE_API_TOKEN/);
 assert.match(workflow,/--verify-list/);
 assert.match(workflow,/--verify-schema/);
 assert.match(workflow,/editorial:defaults:verify-wrangler/);
 assert.match(workflow,/--verify-rollback/);
 assert.match(workflow,/--write-rollback-check/);
 const backup=workflow.indexOf('d1 export "$PS_EDITORIAL_STAGING_NAME" --remote');
 const importStep=workflow.indexOf('d1 execute "$PS_EDITORIAL_STAGING_NAME" --remote --config "$STAGING_CONFIG" --file "$RUNNER_TEMP/editorial-import.sql"');
 assert.ok(backup>0&&importStep>backup,'Backup MUST precede any mutation');
 assert.match(workflow,/concurrency:/);
});

test('#390 premerge staging CLI is import-inert, SHA-pinned and requires a separate approved backup',async()=>{
 const {tmpdir}=await import('node:os');
 const {
  assertPremergeSource,checkedBackupDirectory,validateCliInputs,plannedStagingCommands
 }=await import('../scripts/run-editorial-staging-d1-premerge.mjs');
 const head='a'.repeat(40),branch='work/947-issue390-editorial-parity';
 assert.equal(assertPremergeSource(branch,head,head,''),head);
 for(const [actualBranch,actualSha,expected,dirty] of [
  ['main',head,head,''],[branch,head,'b'.repeat(40),''],
  [branch,head,'not-a-sha',''],[branch,head,head,' M changed.txt']
 ])assert.throws(()=>assertPremergeSource(actualBranch,actualSha,expected,dirty));
 const env={
  CLOUDFLARE_API_TOKEN:'dedicated-staging-fixture-token',
  CLOUDFLARE_ACCOUNT_ID:accountId,
  PS_EDITORIAL_STAGING_NAME:name,PS_EDITORIAL_STAGING_ID:id,
  PS_EDITORIAL_BACKUP_DIR:'/independent/operator-owned-backups',
  PS_EDITORIAL_CONFIRMATION:'CONFIRM-EDITORIAL-STAGING-'+name+'-import'
 };
 assert.equal(validateCliInputs('preflight',env).id,id);
 assert.equal(validateCliInputs('import',env).name,name);
 for(const bad of [
  {...env,CLOUDFLARE_API_TOKEN:''},
  {...env,PS_EDITORIAL_STAGING_ID:PRODUCTION_D1_ID},
  {...env,PS_EDITORIAL_STAGING_NAME:'ps-build-studio-db'},
  {...env,PS_EDITORIAL_BACKUP_DIR:''},
  {...env,PS_EDITORIAL_CONFIRMATION:'wrong'},
 ])assert.throws(()=>validateCliInputs('import',bad));
 assert.throws(()=>validateCliInputs('rollback',env),'rollback needs distinct confirmation');
 assert.throws(()=>validateCliInputs('deploy',env));
 assert.throws(()=>checkedBackupDirectory(process.cwd()));
 assert.throws(()=>checkedBackupDirectory(tmpdir()));
 const command=plannedStagingCommands(target('preflight'),
  '/tmp/only-staging.toml','/tmp/staging-only.sql');
 assert.deepEqual(command.list,['list','--json']);
 assert.ok(command.schema.includes('--remote'));
 assert.ok(command.schema.some(arg=>arg.includes('sqlite_master')));
 assert.ok(command.columns('editorial_default_rows').some(arg=>
  arg.includes('PRAGMA table_info(editorial_default_rows)')));
 assert.ok(command.columns('editorial_default_snapshots').includes('--remote'));
 assert.throws(()=>command.columns('users'));
 assert.ok(command.executeFile.includes('--yes'));
 assert.ok(command.readFile.includes('--json'));
 assert.ok(command.export('/outside/backup.sql').includes('--skip-confirmation'));
 for(const args of [command.schema,command.columns('editorial_default_rows'),
  command.columns('editorial_default_snapshots'),
  command.executeFile,command.readFile,command.export('/outside/backup.sql')]){
  assert.ok(args.includes('--config'),'commands must isolate the staging config');
  assert.ok(!args.includes('ps-build-studio-db'),'never target production name');
 }
 const source=readFileSync(new URL('../scripts/run-editorial-staging-d1-premerge.mjs',
  import.meta.url),'utf8');
 const docs=readFileSync(new URL('../docs/issue-390-premerge-d1-staging.md',
  import.meta.url),'utf8');
 assert.match(source,/assertDatabaseIdentity\(wrangler\(cmd.list\),target\)/);
 assert.match(source,/assertStagingTableColumns\(wrangler\(cmd.columns\(table\)\),table,/);
 assert.match(source,/const backupRoot=checkedBackupDirectory/);
 assert.ok(source.indexOf('const backupRoot=checkedBackupDirectory')<
  source.indexOf('wrangler(cmd.executeFile)'),
  'independent backup validation precedes every write');
 assert.match(source,/verifyEditorialDefaultsReadback\(manifest,parsed.metadata,parsed.rows\)/);
 assert.match(source,/assertRolledBack\(wrangler\(cmd.readFile\)\)/);
 assert.match(docs,/workflow_dispatch/);
 assert.match(docs,/read-only/);
 assert.match(docs,/PS_EDITORIAL_EXPECTED_SHA/);
 assert.match(docs,/PS_EDITORIAL_BACKUP_DIR/);
});

test('#390 staging export must be private, nonempty and not a symlink',async()=>{
 const {mkdtempSync,mkdirSync,chmodSync,writeFileSync,statSync,symlinkSync,rmSync}=
  await import('node:fs');
 const {join}=await import('node:path');
 const {tmpdir}=await import('node:os');
 const {checkedBackupDirectory,verifyIndependentStagingBackup}=
  await import('../scripts/run-editorial-staging-d1-premerge.mjs');
 const sandbox=mkdtempSync(join(tmpdir(),'ps390-backup-test-'));
 try{
  const repoDir=join(sandbox,'repo');
  const systemTemp=join(sandbox,'temp');
  const backupDir=join(sandbox,'private');
  for(const path of [repoDir,systemTemp,backupDir])
   mkdirSync(path,{mode:0o700});
  assert.equal(checkedBackupDirectory(backupDir,repoDir,systemTemp),backupDir);
  chmodSync(backupDir,0o750);
  assert.throws(()=>checkedBackupDirectory(backupDir,repoDir,systemTemp),
   /private mode 0700/);
  chmodSync(backupDir,0o707);
  assert.throws(()=>checkedBackupDirectory(backupDir,repoDir,systemTemp),
   /private mode 0700/);
  chmodSync(backupDir,0o700);
  const exportPath=join(backupDir,'source.sql');
  writeFileSync(exportPath,'-- isolated staging export',{mode:0o644});
  assert.match(verifyIndependentStagingBackup(exportPath),/^[0-9a-f]{64}$/);
  assert.equal(statSync(exportPath).mode&0o777,0o600);
  const emptyPath=join(backupDir,'empty.sql');
  writeFileSync(emptyPath,'');
  assert.throws(()=>verifyIndependentStagingBackup(emptyPath),/nonempty regular/);
  const linkPath=join(backupDir,'link.sql');
  symlinkSync(exportPath,linkPath);
  assert.throws(()=>verifyIndependentStagingBackup(linkPath),/nonempty regular/);
 }finally{rmSync(sandbox,{recursive:true,force:true})}
});

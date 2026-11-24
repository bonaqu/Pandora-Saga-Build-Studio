import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {
 PRODUCTION_D1_ID,STAGING_SCHEMA_SQL,validateEditorialStagingTarget,
 assertDatabaseIdentity,
 assertStagingSchema,assertStagingTableColumns,assertRolledBack,
 assertStagingRollbackPresent,assertStagingImportAbsent,renderStagingRollbackPresenceSQL,
 renderStagingRollbackMutationSQL,renderStagingWranglerConfig,renderStagingRollbackCheckSQL
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

test('#390 staging schema rejects unrelated tables, views, triggers and manual indexes',()=>{
 assert.ok(STAGING_SCHEMA_SQL.includes("type IN ('table','view','trigger','index')"));
 assert.ok(STAGING_SCHEMA_SQL.includes("lower(name) NOT GLOB 'sqlite_*'"));
 assert.ok(!STAGING_SCHEMA_SQL.includes("name NOT LIKE 'sqlite_%'"));
 assert.deepEqual(assertStagingSchema(query([])),{tables:[]});
 assert.deepEqual(assertStagingSchema(query([
  {type:'table',name:'editorial_default_rows'},
  {type:'table',name:'editorial_default_snapshots'}
 ])),{tables:['editorial_default_rows','editorial_default_snapshots']});
 for(const raw of [
  query([{type:'table',name:'accounts'}]),
  query([{type:'table',name:'builds'}]),
  query([{type:'table',name:'overrides'}]),
  query([{type:'table',name:'catalogs'}]),
  query([{type:'view',name:'editorial_default_rows'}]),
  query([{type:'view',name:'editorial_preview'}]),
  query([{type:'trigger',name:'unexpected_write_trigger'}]),
  query([{type:'index',name:'manual_secondary_index'}]),
  query([{type:'table',name:'editorial_default_rows'},
   {type:'table',name:'editorial_default_rows'}]),
  query([{type:'table',name:'editorial_default_rows',value:'unexpected'}]),
  query([{name:'editorial_default_rows'}]),
  query([{type:'table',name:'editorial_default_rows',extra:1}]),
  JSON.stringify([{success:false,results:[]}]),
  JSON.stringify([{success:true,results:[]},{success:true,results:[]}])
 ])assert.throws(()=>assertStagingSchema(raw));
});

test('#390 staging schema sees sqliteX names that SQL LIKE used to hide',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  // This is an actual SQLite sqlite_master query, not mocked JSON: SQL LIKE
  // underscore is wildcard. Reserved sqlite_ system names are not counted.
  db.exec('CREATE TABLE editorial_default_rows (value TEXT);');
  db.exec('CREATE TABLE "sqliteXshadow" (value TEXT);');
  const rows=db.prepare(STAGING_SCHEMA_SQL).all();
  assert.ok(rows.some(row=>row.name==='sqliteXshadow'&&row.type==='table'));
  assert.throws(()=>assertStagingSchema(query(rows)),
   'An unrelated table that begins sqlite and one other character must stop import');
  db.exec('DROP TABLE "sqliteXshadow"; CREATE TABLE "SQLiteXshadow" (value TEXT);');
  assert.ok(db.prepare(STAGING_SCHEMA_SQL).all().some(row=>row.name==='SQLiteXshadow'));
  db.exec('DROP TABLE "SQLiteXshadow";');
  const safe=db.prepare(STAGING_SCHEMA_SQL).all();
  assert.deepEqual(safe.map(row=>row.name),['editorial_default_rows']);
  db.exec('CREATE TABLE seqtest (id INTEGER PRIMARY KEY AUTOINCREMENT);');
  assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE name='sqlite_sequence'").get());
  assert.ok(!db.prepare(STAGING_SCHEMA_SQL).all().some(row=>row.name==='sqlite_sequence'));
 }finally{db.close()}
});

test('#390 staging table names must also have exact expected column types and keys',()=>{
 const rows=[
  {cid:0,name:'snapshot',type:'TEXT',notnull:1,dflt_value:null,hidden:0,pk:1},
  {cid:1,name:'record_key',type:'TEXT',notnull:1,dflt_value:null,hidden:0,pk:2},
  {cid:2,name:'field',type:'TEXT',notnull:1,dflt_value:null,hidden:0,pk:3},
  {cid:3,name:'value',type:'TEXT',notnull:1,dflt_value:null,hidden:0,pk:0}
 ];
 const snapshots=[
  {cid:0,name:'snapshot',type:'TEXT',notnull:0,dflt_value:null,hidden:0,pk:1},
  {cid:1,name:'source_release',type:'TEXT',notnull:1,dflt_value:null,hidden:0,pk:0},
  {cid:2,name:'sha256',type:'TEXT',notnull:1,dflt_value:null,hidden:0,pk:0},
  {cid:3,name:'expected_rows',type:'INTEGER',notnull:1,dflt_value:null,hidden:0,pk:0},
  {cid:4,name:'installed_at',type:'INTEGER',notnull:1,dflt_value:null,hidden:0,pk:0}
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
  rows.map((row,i)=>i===3?{...row,unexpected:'extra'}:row),
  rows.map((row,i)=>i===3?{...row,hidden:2}:row),
  rows.map((row,i)=>i===3?{...row,hidden:3}:row),
  rows.map(({hidden,...row})=>row)
 ])assert.throws(()=>assertStagingTableColumns(
  query(changed),'editorial_default_rows',true));
 assert.throws(()=>assertStagingTableColumns(query(rows),'editorial_default_rows',false));
 assert.throws(()=>assertStagingTableColumns(query([]),'other_table',false));
 assert.throws(()=>assertStagingTableColumns(query([]),'editorial_default_rows','false'));
});

test('#390 full staging column inspection rejects generated columns missed by table_info',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  const ddl='CREATE TABLE editorial_default_rows ('+
   'snapshot TEXT NOT NULL,record_key TEXT NOT NULL,field TEXT NOT NULL,value TEXT NOT NULL,';
  db.exec(ddl+'PRIMARY KEY(snapshot,record_key,field));');
  const inspect=()=>db.prepare('PRAGMA table_xinfo(editorial_default_rows)').all();
  assert.equal(assertStagingTableColumns(query(inspect()),'editorial_default_rows',true),true);
  for(const kind of ['VIRTUAL','STORED']){
   db.exec('DROP TABLE editorial_default_rows;'+ddl+
    'shadow TEXT GENERATED ALWAYS AS (value) '+kind+',PRIMARY KEY(snapshot,record_key,field));');
   assert.equal(db.prepare('PRAGMA table_info(editorial_default_rows)').all().length,4,
    'Old inspection would miss the generated column');
   const actual=inspect();
   assert.equal(actual.length,5);
   assert.ok(actual.some(row=>row.name==='shadow'&&row.hidden!==0));
   assert.throws(()=>assertStagingTableColumns(query(actual),'editorial_default_rows',true),
    /Unexpected staging D1 column count/);
  }
 }finally{db.close()}
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

test('#390 rollback requires existing pinned rows or marker before deletion',()=>{
 const snapshot='0.947.0-'+'f'.repeat(16);
 const sql=renderStagingRollbackPresenceSQL(snapshot);
 assert.equal((sql.match(/WHERE snapshot=/g)||[]).length,2);
 assert.ok(sql.includes("WHERE snapshot='"+snapshot+"'"));
 assert.ok(sql.startsWith('SELECT '),'presence is SELECT-only');
 assert.throws(()=>renderStagingRollbackPresenceSQL(snapshot+"' OR 1=1"));
 for(const [markers,rows] of [[1,345],[1,0],[0,18]]){
  assert.deepEqual(assertStagingRollbackPresent(query([{
   existing_markers:markers,existing_rows:rows
  }])),{markers,rows});
 }
 for(const raw of [
  query([{existing_markers:0,existing_rows:0}]),
  query([{existing_markers:2,existing_rows:1}]),
  query([{existing_markers:1,existing_rows:-1}]),
  query([{existing_markers:'1',existing_rows:2}]),
  query([{existing_markers:1,existing_rows:'2'}]),
  query([{existing_markers:1,existing_rows:0,unexpected:1}]),
  query([]),query([{existing_markers:1}]),
  JSON.stringify([{success:false,results:[{
   existing_markers:1,existing_rows:1
  }]}])
 ])assert.throws(()=>assertStagingRollbackPresent(raw));
 const db=new DatabaseSync(':memory:');
 try{
  db.exec('CREATE TABLE editorial_default_rows (snapshot TEXT, value TEXT);'+
   'CREATE TABLE editorial_default_snapshots (snapshot TEXT);');
  const runPresence=()=>query(db.prepare(sql).all());
  assert.throws(()=>assertStagingRollbackPresent(runPresence()),
   'Never treat an empty staging DB as a successful rollback');
  db.prepare('INSERT INTO editorial_default_rows(snapshot,value) VALUES (?,?)')
   .run(snapshot,'partial');
  assert.deepEqual(assertStagingRollbackPresent(runPresence()),{markers:0,rows:1},
   'Partial failed import remains recoverable');
  db.prepare('INSERT INTO editorial_default_snapshots(snapshot) VALUES (?)')
   .run(snapshot);
  assert.deepEqual(assertStagingRollbackPresent(runPresence()),{markers:1,rows:1});
 }finally{db.close()}
});

test('#390 import rehearsal must not reuse existing exact snapshot or partial rows',()=>{
 const snapshot='0.947.0-'+'f'.repeat(16),other='0.947.0-'+'e'.repeat(16);
 const db=new DatabaseSync(':memory:');
 try{
  const presence=tables=>query(db.prepare(renderStagingRollbackPresenceSQL(snapshot,tables)).all());
  assert.deepEqual(assertStagingImportAbsent(presence([])),{markers:0,rows:0});
  db.exec('CREATE TABLE editorial_default_rows (snapshot TEXT);'+
   'CREATE TABLE editorial_default_snapshots (snapshot TEXT);');
  const tables=['editorial_default_rows','editorial_default_snapshots'];
  for(const table of tables)db.prepare('INSERT INTO '+table+' VALUES (?)').run(other);
  assert.deepEqual(assertStagingImportAbsent(presence(tables)),{markers:0,rows:0});
  db.prepare('INSERT INTO editorial_default_rows VALUES (?)').run(snapshot);
  assert.throws(()=>assertStagingImportAbsent(presence(['editorial_default_rows'])),/already exists/);
  assert.throws(()=>assertStagingImportAbsent(presence(tables)),/already exists/);
  db.prepare('DELETE FROM editorial_default_rows WHERE snapshot=?').run(snapshot);
  db.prepare('INSERT INTO editorial_default_snapshots VALUES (?)').run(snapshot);
  assert.throws(()=>assertStagingImportAbsent(presence(['editorial_default_snapshots'])),/already exists/);
  for(const bad of [query([]),query([{existing_markers:0,existing_rows:'0'}]),
   query([{existing_markers:0,existing_rows:-1}]),query([{existing_markers:2,existing_rows:0}])])
   assert.throws(()=>assertStagingImportAbsent(bad));
 }finally{db.close()}
});

test('#390 interrupted one-table staging import can be rolled back without creating tables',()=>{
 const snapshot='0.947.0-'+'f'.repeat(16),other='0.947.0-'+'e'.repeat(16);
 for(const table of ['editorial_default_rows','editorial_default_snapshots']){
  const db=new DatabaseSync(':memory:');
  try{
   db.exec('CREATE TABLE '+table+' (snapshot TEXT, value TEXT);');
   const schema=assertStagingSchema(query(db.prepare(STAGING_SCHEMA_SQL).all()));
   const presence=renderStagingRollbackPresenceSQL(snapshot,schema.tables);
   const read=()=>query(db.prepare(presence).all());
   assert.throws(()=>assertStagingRollbackPresent(read()));
   for(const key of [snapshot,other])
    db.prepare('INSERT INTO '+table+' (snapshot,value) VALUES (?,?)').run(key,'keep exact');
   assert.deepEqual(assertStagingRollbackPresent(read()),table.endsWith('_rows')?
    {markers:0,rows:1}:{markers:1,rows:0});
   const mutation=renderStagingRollbackMutationSQL(snapshot,schema.tables);
   assert.equal((mutation.match(/DELETE FROM/g)||[]).length,1);
   assert.doesNotMatch(mutation,/CREATE|DROP|UPDATE/);
   db.exec(mutation);
   assert.equal(assertRolledBack(query(db.prepare(
    renderStagingRollbackCheckSQL(snapshot,schema.tables)).all())),true);
   assert.equal(db.prepare('SELECT snapshot FROM '+table).get().snapshot,other);
   assert.deepEqual(assertStagingSchema(query(db.prepare(STAGING_SCHEMA_SQL).all())),schema);
  }finally{db.close()}
 }
 for(const invalid of [[],['overrides'],['editorial_default_rows','editorial_default_rows'],null])
  assert.throws(()=>renderStagingRollbackMutationSQL(snapshot,invalid));
 const empty=new DatabaseSync(':memory:');
 try{
  assert.throws(()=>assertStagingRollbackPresent(query(empty.prepare(
   renderStagingRollbackPresenceSQL(snapshot,[])).all())));
 }finally{empty.close()}
});

test('#390 GitHub staging workflow is preflight-only and never uploads raw SQL',()=>{
 const config=renderStagingWranglerConfig(target('import'));
 assert.match(config,/binding = "EDITORIAL_STAGING_DB"/);
 assert.match(config,/database_name = "ps-editorial-staging-390"/);
 assert.match(config,/database_id = "8adfd82a-3a19-45fe-acfe-499bf97be455"/);
 assert.doesNotMatch(config,/ps-build-studio-db|0f8fbcd8-be06-414c-844b-a2091fdf6784/);
 const workflow=readFileSync(new URL('.github/workflows/editorial-staging-d1-manual.yml',repo),'utf8');
 assert.match(workflow,/workflow_dispatch:/);
 assert.doesNotMatch(workflow,/^\s+(?:push|pull_request|schedule):/m);
 assert.match(workflow,/options: \[preflight\]/);
 assert.match(workflow,/inputs.operation == 'preflight'/);
 assert.match(workflow,/secrets\.EDITORIAL_STAGING_CF_TOKEN/);
 assert.match(workflow,/secrets\.EDITORIAL_STAGING_CF_DATABASE_ID/);
 assert.doesNotMatch(workflow,/secrets\.CLOUDFLARE_API_TOKEN/);
 assert.match(workflow,/--verify-list/);
 assert.match(workflow,/--verify-schema/);
 assert.match(workflow,/--verify-columns editorial_default_rows/);
 assert.match(workflow,/--verify-columns editorial_default_snapshots/);
 assert.ok(workflow.includes("type IN ('table','view','trigger','index')"));
 assert.ok(workflow.includes("lower(name) NOT GLOB 'sqlite_*'"));
 assert.ok(!workflow.includes("name NOT LIKE 'sqlite_%'"));
 const executed=workflow.split('\n').filter(line=>line.includes('wrangler@4 d1 execute'));
 assert.equal(executed.length,3,'Only read-only schema + two PRAGMA queries allowed');
 assert.equal(executed.filter(line=>line.includes('PRAGMA table_xinfo(')).length,2);
 assert.ok(!workflow.includes('PRAGMA table_info('));
 for(const line of executed){
  assert.ok(line.includes('--command'),line);
  assert.ok(line.includes('--json'),line);
  assert.ok(!line.includes('--file'),line);
 }
 for(const unsafe of [
  'd1 export','upload-artifact','d1 import','editorial-import.sql',
  'editorial-rollback.sql','--skip-confirmation',
  'retention-days','--verify-rollback','--write-rollback-check'
 ])assert.ok(!workflow.includes(unsafe),'Unsafe staging workflow operation: '+unsafe);
 assert.doesNotMatch(workflow,/d1 execute[^\n]* --yes(?:\s|$)/m,
  'Remote D1 execution may not use a write-mode confirmation flag');
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
 assert.ok(command.schema.includes(STAGING_SCHEMA_SQL));
 assert.ok(command.columns('editorial_default_rows').some(arg=>
  arg.includes('PRAGMA table_xinfo(editorial_default_rows)')));
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
 assert.match(source,/assertStagingRollbackPresent\(wrangler\(cmd\.readFile\)\)/);
 assert.match(source,/assertStagingImportAbsent\(wrangler\(cmd\.readFile\)\)/);
 assert.ok(source.indexOf('assertStagingImportAbsent(wrangler(cmd.readFile))')<
  source.indexOf('const backupRoot=checkedBackupDirectory'));
 const afterBackup=source.slice(source.indexOf('syncBackupDirectory(backupRoot)'));
 const beforeMutation=afterBackup.slice(0,afterBackup.indexOf('wrangler(cmd.executeFile)'));
 assert.match(beforeMutation,/assertDatabaseIdentity\(wrangler\(cmd.list\),target\)/);
 assert.match(beforeMutation,/const beforeWrite=assertStagingSchema/);
 assert.match(beforeMutation,/assertStagingImportAbsent\(wrangler\(cmd\.readFile\)\)/);
 assert.match(beforeMutation,/currentPresence\.rows!==initialPresence\.rows/);
 assert.ok(source.indexOf('assertStagingRollbackPresent(wrangler(cmd.readFile))')<
  source.indexOf('const backupRoot=checkedBackupDirectory'),
  'A nonexistent snapshot cannot count as verified rollback');
 assert.match(source,/openSync\(path,constants\.O_RDONLY\|constants\.O_NOFOLLOW\)/);
 assert.match(source,/const opened=fstatSync\(fd\)/);
 assert.match(source,/fchmodSync\(fd,0o600\)/);
 assert.match(source,/syncBackupDirectory\(backupRoot\)/);
 assert.ok(source.indexOf('syncBackupDirectory(backupRoot)')<
  source.indexOf('wrangler(cmd.executeFile)'),
  'both backup and directory entries MUST be durable before mutation');
 assert.ok(source.indexOf('const backupRoot=checkedBackupDirectory')<
  source.indexOf('wrangler(cmd.executeFile)'),
  'independent backup validation precedes every write');
 assert.match(source,/verifyEditorialDefaultsReadback\(manifest,parsed.metadata,parsed.rows\)/);
 assert.match(source,/assertRolledBack\(wrangler\(cmd.readFile\)\)/);
 assert.match(source,/renderStagingRollbackMutationSQL\(manifest.snapshot,schema.tables\)/);
 assert.match(source,/renderStagingRollbackCheckSQL\(manifest.snapshot,afterRollback.tables\)/);
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
  const contents='-- isolated staging export';
  writeFileSync(exportPath,contents,{mode:0o644});
  const {createHash}=await import('node:crypto');
  const expected=createHash('sha256').update(contents).digest('hex');
  assert.equal(verifyIndependentStagingBackup(exportPath),expected);
  assert.equal(statSync(exportPath).mode&0o777,0o600);
  const emptyPath=join(backupDir,'empty.sql');
  writeFileSync(emptyPath,'');
  assert.throws(()=>verifyIndependentStagingBackup(emptyPath),/nonempty regular/);
  const linkPath=join(backupDir,'link.sql');
  symlinkSync(exportPath,linkPath);
  assert.throws(()=>verifyIndependentStagingBackup(linkPath),/nonempty regular/);
 }finally{rmSync(sandbox,{recursive:true,force:true})}
});

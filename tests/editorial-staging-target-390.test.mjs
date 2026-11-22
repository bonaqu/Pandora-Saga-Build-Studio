import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 PRODUCTION_D1_ID,validateEditorialStagingTarget,assertDatabaseIdentity,
 assertStagingSchema,assertRolledBack,renderStagingWranglerConfig,
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

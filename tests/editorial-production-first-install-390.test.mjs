import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildEditorialDefaultsManifest,renderEditorialDefaultsSQL}
 from '../scripts/plan-editorial-d1-defaults.mjs';
import {
 assertPinnedProductionManifest,assertOnlyPinnedProductionSQL,
 assertOriginalBackupMetadata,assertOriginalBackupReceipt,
 assertProductionInstallInputs
} from '../scripts/run-editorial-production-first-install-390.mjs';

const source='c065104cf8996c95a96b7f076fec0fbe38c94fc4';
const encrypted='00512049d705155fd10bdf02c9149332cec0dea6d00d9d062620049ef5d1adf8';
const snapshot='0.948.0-5637e5c111eb4528';
const manifest=buildEditorialDefaultsManifest();

test('#390 production first install pins exact verified staging manifest',()=>{
 assert.equal(assertPinnedProductionManifest(manifest),manifest);
 assert.equal(manifest.records.length,2734);
 assert.equal(manifest.digest,
  '5637e5c111eb452800609eb44f808f2f9d465277252595ad8e2c125f79cb6c8d');
 assert.throws(()=>assertPinnedProductionManifest({...manifest,release:'0.949.0'}));
 assert.throws(()=>assertPinnedProductionManifest({...manifest,records:manifest.records.slice(1)}));
});

test('#390 production first install refuses SQL that changes anything beyond exact defaults',()=>{
 const sql=renderEditorialDefaultsSQL(manifest);
 assert.equal(assertOnlyPinnedProductionSQL(sql,manifest),true);
 for(const mutated of [
  sql+'DELETE FROM overrides;',
  sql.replace('CREATE TABLE IF NOT EXISTS editorial_default_rows','DROP TABLE admins; CREATE TABLE editorial_default_rows'),
  sql.replace('editorial_default_rows(snapshot','overrides(snapshot'),
  sql.slice(0,-50)
 ])assert.throws(()=>assertOnlyPinnedProductionSQL(mutated,manifest));
});

test('#390 production encrypted backup metadata is pinned to exact owner saved artifact',()=>{
 const a={
  id:15072673742,expired:false,size_in_bytes:41518725,
  digest:'sha256:eafca586b7efaadd6801931c09b963f5bea5015eb50a92147f7b93304155fb6e',
  name:'ps390-production-before-'+source+'-'+encrypted,
  workflow_run:{id:45724027475,head_sha:source}
 };
 assert.equal(assertOriginalBackupMetadata(a),true);
 for(const wrong of [
  {...a,expired:true},{...a,id:99},{...a,size_in_bytes:1},
  {...a,workflow_run:{...a.workflow_run,head_sha:'0'.repeat(40)}}
 ])assert.throws(()=>assertOriginalBackupMetadata(wrong));
 assert.throws(()=>assertOriginalBackupReceipt({},Buffer.from('wrong'),Buffer.from('wrong')));
});

test('#390 production import needs owner protected approval, live credentials, exact SHA',()=>{
 const head='a'.repeat(40);
 const valid={
  PS390_PRODUCTION_IMPORT_APPROVED:'CONFIRM-PS390-PRODUCTION-FIRST-INSTALL-'+snapshot,
  CLOUDFLARE_ACCOUNT_ID:'57ac934cd0f0a7f5e8533177d612f893',
  PS_D1_DATABASE_ID:'0f8fbcd8-be06-414c-844b-a2091fdf6784',
  CLOUDFLARE_API_TOKEN:'test-token',GITHUB_TOKEN:'test-github',
  PS390_PRODUCTION_BACKUP_KEY:'x'.repeat(64),PS_EDITORIAL_EXPECTED_SHA:head
 };
 assert.equal(assertProductionInstallInputs(valid,head),true);
 for(const changed of [
  {...valid,PS390_PRODUCTION_IMPORT_APPROVED:''},
  {...valid,PS_D1_DATABASE_ID:'56757608-3492-4fae-b698-27c76918cdc1'},
  {...valid,CLOUDFLARE_API_TOKEN:''},
  {...valid,PS390_PRODUCTION_BACKUP_KEY:'short'},
  {...valid,PS_EDITORIAL_EXPECTED_SHA:'b'.repeat(40)}
 ])assert.throws(()=>assertProductionInstallInputs(changed,head));
});

test('#390 production workflow is single explicitly approved PR-only operation',()=>{
 const wf=readFileSync(new URL(
  '../.github/workflows/editorial-production-first-install-390.yml',import.meta.url),'utf8');
 assert.match(wf,/environment: editorial-production-390/);
 assert.match(wf,/github\.event\.pull_request\.number == 809/);
 assert.match(wf,/github\.event\.label\.name == 'ps390-production-first-install'/);
 assert.match(wf,/node scripts\/check-editorial-staging-approval\.mjs ci/);
 assert.match(wf,/node scripts\/run-editorial-production-first-install-390\.mjs/);
 assert.doesNotMatch(wf,/wrangler@4 deploy|git push|ps390-rollback/);
});

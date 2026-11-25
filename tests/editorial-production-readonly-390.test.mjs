import test from 'node:test';
import assert from 'node:assert/strict';
import {buildEditorialDefaultsManifest} from '../scripts/plan-editorial-d1-defaults.mjs';
import {
 assertProductionIdentity,readProductionEditorialSchema,
 parseProductionPresence,productionPresenceSQL,checkedReadOnlySQL,
 verifyProductionWorker
} from '../scripts/check-editorial-production-readonly.mjs';

const manifest=buildEditorialDefaultsManifest();
const query=rows=>JSON.stringify([{success:true,results:rows}]);
const identity=[{name:'ps-build-studio-db',
 uuid:'0f8fbcd8-be06-414c-844b-a2091fdf6784'}];
const absent={markers:0,rows:0,marker_digest:null,marker_release:null,
 expected_rows:null};
const complete={markers:1,rows:manifest.records.length,
 marker_digest:manifest.digest,marker_release:manifest.release,
 expected_rows:manifest.records.length};

test('#390 production read-only preflight uses exact account and D1 identity',()=>{
 assert.equal(assertProductionIdentity(JSON.stringify(identity)),true);
 assert.throws(()=>assertProductionIdentity(JSON.stringify([{...identity[0],
  uuid:'56757608-3492-4fae-b698-27c76918cdc1'}])),/did not match/);
 assert.throws(()=>assertProductionIdentity(JSON.stringify(identity),{
  name:'ps-editorial-staging-390',id:identity[0].uuid}),/Unexpected production/);
});
test('#390 production editorial-only schema detects absent/partial/altered tables',()=>{
 assert.equal(readProductionEditorialSchema(query([])).installed,false);
 assert.deepEqual(readProductionEditorialSchema(query([
  {name:'editorial_default_rows',type:'table'},
  {name:'editorial_default_snapshots',type:'table'}
 ])).tables,['editorial_default_rows','editorial_default_snapshots']);
 assert.throws(()=>readProductionEditorialSchema(query([
  {name:'editorial_default_rows',type:'table'}])),/Incomplete/);
 assert.throws(()=>readProductionEditorialSchema(query([
  {name:'editorial_default_rows',type:'view'},
  {name:'editorial_default_snapshots',type:'table'}
 ])),/unexpected/i);
});
test('#390 exact production metadata/readback fail closed without reading private rows',()=>{
 assert.equal(parseProductionPresence(query([absent])).status,'not_installed');
 assert.deepEqual(JSON.parse(JSON.stringify(parseProductionPresence(query([complete]))),{
  status:'installed',markers:1,rows:manifest.records.length,
  snapshot:manifest.snapshot,digest:manifest.digest
 });
 for(const row of [
  {...absent,rows:1},
  {...complete,marker_digest:'f'.repeat(64)},
  {...complete,marker_release:'0.947.0'},
  {...complete,rows:manifest.records.length-1},
  {...complete,markers:0},
  {...complete,unexpected:'column'}
 ])
  assert.throws(()=>parseProductionPresence(query([row])),
   /Production editorial|Invalid production|Unexpected production/);
 assert.match(productionPresenceSQL(),/AS marker_digest/);
 assert.equal(checkedReadOnlySQL(productionPresenceSQL()),productionPresenceSQL());
 for(const bad of ['DELETE FROM editorial_default_rows;','SELECT * FROM users; DROP TABLE users;',
  'PRAGMA table_xinfo(user_accounts);','-- bypass\nSELECT 1;','SELECT 1;\nSELECT 2;'])
  assert.throws(()=>checkedReadOnlySQL(bad),/Unsafe/);
});
test('#390 production Worker preflight checks health and disabled/pinned status',async()=>{
 const health={storage:'d1',features:{catalog:true}};
 const mock=(status,payload)=>async url=>({
  ok:url.endsWith('/api/health')?true:status===200,
  status:url.endsWith('/api/health')?200:status,
  json:async()=>url.endsWith('/api/health')?health:payload
 });
 assert.equal(await verifyProductionWorker(mock(404,{error:'Not found'})),'disabled');
 assert.equal(await verifyProductionWorker(mock(200,{
  snapshot:manifest.snapshot,release:manifest.release,sha256:manifest.digest,
  records:Array.from({length:manifest.records.length},()=>({}))
 })),'enabled-and-pinned');
 await assert.rejects(()=>verifyProductionWorker(mock(503,{})),/Unexpected/);
 await assert.rejects(()=>verifyProductionWorker(mock(200,{
  snapshot:'0.947.0-0000000000000000',records:[]
 })),/not pinned/);
});

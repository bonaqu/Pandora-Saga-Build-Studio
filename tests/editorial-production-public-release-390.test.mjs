import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildEditorialDefaultsManifest} from '../scripts/plan-editorial-d1-defaults.mjs';
import {assertPublicEditorialReleaseSource} from '../scripts/check-editorial-public-release-390.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const manifest=buildEditorialDefaultsManifest(),worker=read('worker/index.js'),app=read('pandora-studio-app.js');

test('#390 release Worker and real Pages source pin the independently imported D1 snapshot',()=>{
 assert.equal(assertPublicEditorialReleaseSource({manifest,worker,app}),true);
 assert.throws(()=>assertPublicEditorialReleaseSource({
  manifest:{...manifest,records:manifest.records.slice(1)},worker,app
 }),/must match/);
 assert.throws(()=>assertPublicEditorialReleaseSource({
  manifest,worker:worker.replace("env.EDITORIAL_DEFAULTS_PREVIEW==='disabled'",'true'),app
 }),/does not pin/);
 assert.throws(()=>assertPublicEditorialReleaseSource({
  manifest,worker,app:app.replace("const EDITORIAL_DEFAULTS_PIN='0.948.0-5637e5c111eb4528'",'')
 }),/does not pin/);
});
test('#390 release readiness will audit actual public Worker response, not just deploy status',()=>{
 const source=read('scripts/check-editorial-public-release-390.mjs');
 const wf=read('.github/workflows/live-readonly.yml');
 assert.match(source,/verifyProductionWorker\(\)/);
 assert.match(source,/result==='enabled-and-pinned'/);
 assert.match(wf,/name: Verify 0\.948\.0 authorial defaults in live Worker against D1 SHA/);
 assert.match(wf,/node scripts\/check-editorial-public-release-390\.mjs/);
 assert.doesNotMatch(source,/wrangler.*execute|INSERT INTO|DELETE FROM|UPDATE /);
});

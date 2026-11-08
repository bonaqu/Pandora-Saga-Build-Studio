import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('live readiness runs parity only after the published release and Worker checks',()=>{
 const workflow=read('.github/workflows/live-readonly.yml');
 const wait=workflow.indexOf('run: node scripts/wait-live-release.mjs');
 const health=workflow.indexOf('run: npm run connection:check:full');
 const parity=workflow.indexOf('run: npm run catalog:parity:live');
 assert.ok(wait>=0&&health>wait&&parity>health,
  'Read-only parity must check only after expected publication and health');
 assert.match(workflow,/workflow_run:/);
 assert.match(workflow,/schedule:/);
 assert.match(workflow,/workflow_dispatch:/);
 assert.match(workflow,/contents: read/);
 assert.doesNotMatch(workflow,/catalog:review|catalog:import|wrangler d1|--write|--strict-ru/);
});
test('parity command runs a read-only script, not a production D1 mutation',()=>{
 const pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.scripts['catalog:parity:live'],'node scripts/audit-live-catalog-parity.mjs');
 const source=read('scripts/audit-live-catalog-parity.mjs');
 assert.match(source,/method|fetcher/);
 assert.doesNotMatch(source,/Authorization:|Bearer |method:\s*['"]POST|method:\s*['"]PUT/);
 assert.match(source,/x-ps-catalog-snapshot/);
});

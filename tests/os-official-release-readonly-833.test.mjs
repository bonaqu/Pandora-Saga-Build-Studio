import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('each release audits authoritative OS values after D1 16/16 without production write',()=>{
 const yml=read('.github/workflows/live-readonly.yml');
 const official="      - name: Compare official Pandora Saga OS game files (GET-only, nonblocking)";
 const published="      - name: Compare 16 published gameplay datasets against the same D1 snapshot (read-only)";
 assert.equal(yml.split(official).length,2);
 assert.ok(yml.indexOf(official)>yml.indexOf(published));
 assert.match(yml,/Compare official Pandora Saga OS game files \(GET-only, nonblocking\)\n        continue-on-error: true\n        timeout-minutes: 3\n        run: npm run os:source:live/);
 assert.match(yml,/push:\n    branches: \[bonaqu_projects\]/);
 assert.doesNotMatch(yml,/^\s*schedule:/m);
 const step=yml.slice(yml.indexOf(official),yml.indexOf('      - name:',yml.indexOf(official)+official.length));
 assert.doesNotMatch(step,/CLOUDFLARE_API_TOKEN|PS_D1_DATABASE_ID|GITHUB_TOKEN|write|POST|PUT|DELETE/);
 const packageFile=JSON.parse(read('package.json'));
 assert.equal(packageFile.scripts['os:source:live'],'node scripts/audit-official-os-source.mjs');
 const audit=read('scripts/audit-official-os-source.mjs');
 assert.match(audit,/export const OFFICIAL_GAMEDATA_SETS/);
 assert.match(audit,/method:'GET'/);
 assert.match(audit,/summary\.matched!==report\.summary\.requested/);
});

test('release official-API audit does not replace existing D1 readiness gates',()=>{
 const yml=read('.github/workflows/live-readonly.yml');
 for(const step of [
  'npm run connection:check:release',
  'node scripts/check-editorial-public-release-390.mjs',
  'node scripts/check-build-account-only-live.mjs',
  'npm run catalog:parity:live'
 ])assert.ok(yml.includes(step),'must preserve '+step);
 assert.match(yml,/permissions:\n  contents: read/);
 assert.doesNotMatch(yml,/permissions:\n  contents: write/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {selectBrowserSuite,normalizeForReleaseOnly} from '../scripts/select-browser-suite.mjs';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('CI still runs a full browser suite on gameplay, persistence, Worker and unclassified changes',()=>{
 for(const p of ['pandora-studio-app.js','pandora-studio-build-scope.js',
  'pandora-os-character-calculator.js','worker/index.js','data/os/items.json',
  'index.html','tests/browser-smoke.mjs','.github/workflows/browser-smoke.yml']){
  assert.equal(selectBrowserSuite([p]),'full',p);
 }
 assert.equal(selectBrowserSuite([]),'full','Unknown diff must fail closed');
});
test('CI reserves quick for copy-only and gives CSS a real desktop/mobile layout audit',()=>{
 assert.equal(selectBrowserSuite([
  'pandora-studio-ui-locale.js','docs/NOTES.md',
  'CHANGELOG.md','tests/honor-guide-ux.test.mjs'
 ]),'quick');
 for(const paths of [
  ['pandora-studio-theme.css'],
  ['pandora-studio-owner-inline-ui.css','docs/NOTES.md','tests/honor-guide-ux.test.mjs'],
  ['pandora-studio-theme.css','index.html']
 ]){
  const releaseOnlyFiles=paths.includes('index.html')?['index.html']:[];
  assert.equal(selectBrowserSuite(paths,{releaseOnlyFiles}),'layout',paths.join(', '));
 }
 assert.equal(selectBrowserSuite(['pandora-studio-theme.css','worker/index.js']),'full');
 assert.equal(selectBrowserSuite(['index.html'],{releaseOnlyFiles:['index.html']}),'quick');
});
test('release-only metadata cannot conceal a new script, asset or HTML element',()=>{
 const old='<meta name="ps-studio-release" content="2026.11.11.627"><script src="sample-entry.js?v=2026.11.11.627"></script>';
 const next='<meta name="ps-studio-release" content="2026.11.11.628"><script src="sample-entry.js?v=2026.11.11.628"></script>';
 assert.equal(normalizeForReleaseOnly('index.html',old),normalizeForReleaseOnly('index.html',next));
 assert.notEqual(normalizeForReleaseOnly('index.html',old),normalizeForReleaseOnly('index.html',next+'<button>unexpected</button>'));
 assert.equal(normalizeForReleaseOnly('package.json','{"version":"0.627.0","pandoraRelease":"2026.11.11.627","scripts":{"test":"node --test"}}'),
  normalizeForReleaseOnly('package.json','{"version":"0.628.0","pandoraRelease":"2026.11.11.628","scripts":{"test":"node --test"}}'));
 assert.notEqual(normalizeForReleaseOnly('package.json','{"version":"0.627.0","scripts":{"test":"node --test"}}'),
  normalizeForReleaseOnly('package.json','{"version":"0.628.0","scripts":{"test":"echo bypass"}}'));
});
test('PR is tested once before merge; postmerge live Pages/Worker acceptance remains',()=>{
 for(const name of ['quality.yml','browser-smoke.yml']){
  const wf=read('.github/workflows/'+name);
  assert.match(wf,/^\s*pull_request:\s*$/m);
  assert.match(wf,/^\s*workflow_dispatch:\s*$/m);
  assert.doesNotMatch(wf,/^\s*push:\s*$/m,name+' should not duplicate a merged PR');
 }
 assert.doesNotMatch(read('.github/workflows/quality.yml'),/      - 'tests\/\*\.test\.mjs'/,
  'Node-only regression PRs must still trigger quality CI');
 const live=read('.github/workflows/live-readonly.yml');
 assert.match(live,/^\s*push:\s*$/m);
 assert.match(live,/run: npm run connection:check:release/);
 assert.match(live,/run: npm run catalog:parity:live/);
});
test('manual browser run keeps full coverage, while PR failures of classifier fail closed',()=>{
 const wf=read('.github/workflows/browser-smoke.yml');
 assert.match(wf,/mode=full/);
 assert.match(wf,/node scripts\/select-browser-suite\.mjs/);
 assert.match(wf,/node tests\/browser-smoke\.mjs --quick/);
 assert.match(wf,/node tests\/browser-smoke\.mjs --layout/);
 assert.match(wf,/node tests\/browser-smoke\.mjs --catalog/);
 assert.match(wf,/node scripts\/catalog-ci-mode\.mjs/);
 assert.match(read('tests/browser-smoke.mjs'),/if\(!quick&&!catalog\)await runLayoutAudit\(browser,base\)/);
 assert.match(wf,/node tests\/browser-smoke\.mjs\s*$/m);
 const runner=read('tests/browser-smoke.mjs');
 for(const scenario of ['cloud-conflict','cloud-save-failure','cross-tab-account','account-feedback-race'])
  assert.ok(runner.includes("'"+scenario+"'"),scenario);
});

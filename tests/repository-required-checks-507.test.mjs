import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectBrowserSuite} from '../scripts/select-browser-suite.mjs';

const root=new URL('../',import.meta.url);
const read=name=>readFileSync(new URL(name,root),'utf8');
const quality=read('.github/workflows/quality.yml');
const browser=read('.github/workflows/browser-smoke.yml');

test('both Ruleset-required checks run for all PR diffs, including docs and test-only',()=>{
 for(const [name,workflow] of [['Node',quality],['Chromium',browser]]){
  assert.match(workflow,/on:\n  pull_request:\n    branches: \[bonaqu_projects\]\n  workflow_dispatch:/,
   name+' must trigger on every PR targeting protected main');
  assert.doesNotMatch(workflow,/paths-ignore:|^\s+paths:/m,
   name+' must not be skipped by file filters while required by GitHub Ruleset');
  assert.match(workflow,/concurrency:/);
  assert.match(workflow,/cancel-in-progress: true/);
 }
 assert.match(quality,/name: Unit regressions and release consistency/);
 assert.match(browser,/^\s+browser:\n/m);
 assert.match(quality,/run: npm test/);
 assert.match(browser,/node tests\/browser-smoke\.mjs/);
 assert.match(browser,/npx playwright install chromium/);
});

test('fail-fast release guard comes before the complete Node suite',()=>{
 assert.ok(quality.indexOf('run: npm run release:check')<
  quality.indexOf('run: npm test'));
 assert.match(quality,/run: npm run assets:audit/);
 assert.match(quality,/run: npm run locales:audit/);
});

test('real Chromium quick mode is only for demonstrably harmless PR diffs',()=>{
 assert.equal(selectBrowserSuite(['AGENTS.md','README.md','docs/procedure.md']),'quick');
 assert.equal(selectBrowserSuite(['tests/social-preview.test.mjs']),'quick');
 assert.equal(selectBrowserSuite(['assets/icon.css','AGENTS.md']),'quick');
 for(const paths of [['pandora-os-character-calculator.js'],
  ['data/os/skills.json'],['scripts/select-browser-suite.mjs'],
  ['.github/workflows/browser-smoke.yml'],['index.html']]){
  assert.equal(selectBrowserSuite(paths),'full',paths[0]);
 }
 assert.equal(selectBrowserSuite([]),'full','unclassified PR must run full Chromium');
});

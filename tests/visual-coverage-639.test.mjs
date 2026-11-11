import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('saved build comparison checkbox label is a borderless transparent hit target',()=>{
 const css=file('pandora-studio-build-comparison.css');
 const start=css.indexOf('.build-card-compare{');
 const end=css.indexOf('.build-card-compare>span',start);
 assert.ok(start>=0&&end>start);
 const block=css.slice(start,end);
 assert.match(block,/border:0/);
 assert.match(block,/background:transparent/);
 assert.match(block,/box-shadow:none/);
 assert.doesNotMatch(block,/border:1px|box-shadow:0 0 0 1px/);
 assert.equal((css.match(/\.build-card:has\(/g)||[]).length,1,
  'Only one selected-card outline rule is allowed');
 const app=file('pandora-studio-app.js');
 assert.match(app,/class:'build-card-compare'/);
 assert.match(app,/class:'build-card-actions'/);
});

test('full visual QA takes screenshots of core editor, book, wiki and modal workflows',()=>{
 const module=file('tests/browser-visual-coverage.mjs');
 const entry=file('tests/browser-smoke.mjs');
 assert.match(entry,/site-visual-coverage',runVisualCoverageSmoke/);
 for(const target of ['origin-race','origin-class','origin-stats','path-skills','path-growth',
  'hero-book-results','wiki-','build-account-gate','guest-save-modal','account-panel'])
  assert.ok(module.includes(target),target);
 assert.match(module,/document\.querySelectorAll\('#stageBookPanel details\.stage-result-section/);
 assert.match(module,/visibleDialog/);
 assert.match(module,/globalOverflow/);
 assert.match(module,/horizontalOverflow/);
 assert.match(module,/collisions/);
 assert.match(module,/artifacts\/layout\/visual-coverage\.json/);
});

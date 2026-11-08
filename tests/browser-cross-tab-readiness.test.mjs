import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const code=readFileSync(new URL('../tests/browser-cross-tab-account.mjs',import.meta.url),'utf8');

test('cross-tab account smoke waits for real editor and account readiness, not locale text',()=>{
 assert.match(code,/localStorage\.getItem\('ps-build-owner-scope\.v1'\)/);
 assert.match(code,/document\.querySelector\('#raceGrid'\)\?\.children\.length>0/);
 assert.match(code,/document\.querySelector\('#hero'\)\?\.getAttribute\('src'\)/);
 assert.match(code,/profile\.includes\(expected\)/);
 assert.match(code,/accountBootstrap==='verified'/);
 assert.doesNotMatch(code,/\/\\d\+ навыков/,
  'do not make an account test depend on Russian catalog counter text');
});

test('cross-tab account timeout reports non-secret UI state',()=>{
 assert.match(code,/Cross-tab account bootstrap for/);
 assert.match(code,/raceCount:/);
 assert.match(code,/hasHero:/);
 assert.match(code,/catalogStatus:/);
 assert.match(code,/accountBootstrap:/);
 assert.match(code,/diagnostic\.meStatuses=/);
 const section=code.slice(code.indexOf('const diagnostic=await page.evaluate('),
  code.indexOf('throw Error(\'Cross-tab account bootstrap'));
 assert.doesNotMatch(section,/ps-account-session|ps-build-library-secret|\\.token\\b|authorization/i);
});


test('late account session race is exercised in a paused-module Chromium flow',()=>{
 const runner=readFileSync(new URL('../tests/browser-smoke.mjs',import.meta.url),'utf8');
 const late=readFileSync(new URL('../tests/browser-account-late-bootstrap.mjs',import.meta.url),'utf8');
 const source=readFileSync(new URL('../pandora-studio-account-ui.js',import.meta.url),'utf8');
 assert.match(runner,/account-late-bootstrap/);
 assert.match(late,/page\.route\('\*\*\/pandora-studio-app\.js\*'/);
 assert.match(late,/stats\.guestLibrary,0/);
 assert.match(late,/stats\.me,1/);
 assert.match(source,/if\(!session\)try\{/);
 assert.match(source,/const latest=JSON\.parse\(localStorage\.getItem\(KEY\)/);
});

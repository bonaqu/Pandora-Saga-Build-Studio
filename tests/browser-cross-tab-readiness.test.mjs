import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const code=readFileSync(new URL('../tests/browser-cross-tab-account.mjs',import.meta.url),'utf8');

test('cross-tab account smoke waits for real editor and account readiness, not locale text',()=>{
 assert.match(code,/localStorage\.getItem\('ps-build-owner-scope\.v1'\)/);
 assert.match(code,/document\.querySelector\('#raceGrid'\)\?\.children\.length>0/);
 assert.match(code,/document\.querySelector\('#hero'\)\?\.getAttribute\('src'\)/);
 assert.match(code,/profile\.includes\(expected\)/);
 assert.doesNotMatch(code,/\/\\d\+ навыков/,
  'do not make an account test depend on Russian catalog counter text');
});

test('cross-tab account timeout reports non-secret UI state',()=>{
 assert.match(code,/Cross-tab account bootstrap for/);
 assert.match(code,/raceCount:/);
 assert.match(code,/hasHero:/);
 assert.match(code,/catalogStatus:/);
 const section=code.slice(code.indexOf('const diagnostic=await page.evaluate('),
  code.indexOf('throw Error(\'Cross-tab account bootstrap'));
 assert.doesNotMatch(section,/ps-account-session|ps-build-library-secret|token/);
});

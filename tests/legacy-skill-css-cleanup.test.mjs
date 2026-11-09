import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const css=read('pandora-studio-theme.css'),path=read('pandora-studio-hero-path.js');
const legacy=['inline-branch-milestones','inline-milestone','path-threshold-tick',
 'path-milestone-pin','path-milestone-core'];

test('obsolete detached/diamond skill markers are absent from current CSS and Hero Path',()=>{
 for(const className of legacy){
  assert.ok(!css.includes('.'+className),'Dead CSS selector should be removed: '+className);
  assert.ok(!path.includes(className),'Live Hero Path must not depend on '+className);
 }
 // This is the current implementation, not the abandoned 2026.10.30 milestone.
 for(const name of ['path-integrated-track','path-unlock-notch',
  'path-integrated-milestones','path-milestone-tooltip',
  'path-current-notch'])
  assert.ok(css.includes('.'+name)&&path.includes(name),name);
 // Explicit Origin, two-slot item and mastery baseline styles use a modest
 // additional budget; still guard against runaway duplicate CSS accumulation.
 assert.ok(css.length<162000,'Stylesheet must stay bounded after new encyclopedia UI components');
});

test('actual milestone tooltip and 18px hidden native thumb remain after pruning',()=>{
 for(const expression of [
  '.inline-mastery-track.path-integrated-track .path-unlock-notch{',
  '.inline-mastery-track.path-integrated-track .path-unlock-notch.reached{',
  '.inline-mastery-track.path-integrated-track .path-unlock-notch.unreachable{',
  '.inline-mastery-track.path-integrated-track .path-unlock-notch.is-hovered',
  '.inline-mastery-track.path-integrated-track .path-current-notch{',
  '.inline-mastery-track.path-integrated-track .path-unlock-notch .path-milestone-tooltip{'
 ])assert.ok(css.includes(expression),expression);
 assert.match(path,/range\.addEventListener\('input'/);
 assert.match(path,/track\.addEventListener\('pointermove'/);
 assert.match(css,/::-webkit-slider-thumb\{[\s\S]*?width:18px;height:18px/);
 assert.match(css,/::-moz-range-thumb\{[\s\S]*?width:18px;height:18px/);
});

test('cross-tab acceptance requires scope, profile and complete OS catalog before saving',()=>{
 const c=read('tests/browser-cross-tab-account.mjs');
 assert.match(c,/localStorage\.getItem\('ps-build-owner-scope\.v1'\)===/);
 assert.match(c,/document\.querySelector\('#catalogStatus'\)/);
 assert.match(c,/document\.querySelector\('#profileTrigger'\)/);
 assert.match(c,/page\.waitForResponse\(response=>/);
 assert.match(c,/response\.request\(\)\.headers\(\)\.authorization===/);
 assert.match(c,/response\.request\(\)\.postDataJSON\(\)\?\.entry\?\.name===name/);
 for(const expected of ["'Alice first',tokenA","'Bob only',tokenB",
   "'Alice second',tokenA"])assert.ok(c.includes(expected),expected);
});

test('guest tabs preserve former owner backups but cannot access account-only libraries',()=>{
 const guest=read('tests/browser-cross-tab-guest.mjs');
 assert.match(guest,/async function ready\(page,secret\)/);
 assert.match(guest,/localStorage\.getItem\('ps-build-owner-scope\.v1'\)==='guest:'\+key/);
 assert.match(guest,/document\.querySelector\('#raceGrid'\)\?\.children\.length>0/);
 assert.match(guest,/await ready\(first,firstKey\)/);
 assert.match(guest,/await ready\(second,secondKey\)/);
 assert.match(guest,/assert\.equal\(requests\.length,0/);
 assert.match(guest,/ps-build-scope-cache\.v1:guest:/);
 assert.match(guest,/\.build-signin-gate/);
 assert.doesNotMatch(guest,/await save\(/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('app.js'),milestones=read('skill-milestones.js');

test('retired branch-row and archival mark helpers are unreachable and removed',()=>{
 assert.doesNotMatch(app,/\bfunction branchRow\(/);
 assert.doesNotMatch(app,/\bfunction markNode\(/);
 assert.doesNotMatch(app,/\bbranchRow\s*\(/);
 assert.doesNotMatch(app,/\bmarkNode\s*\(/);
 assert.match(app,/function renderBranches\(\)/);
 assert.match(app,/function renderPathPages\(\)/);
});

test('above-cap skill adapter resolves IDs once and preserves first-match semantics',()=>{
 const start=app.indexOf('  milestones:(skills,key,cap)=>{');
 const end=app.indexOf('  onGroup:key=>{',start);
 assert.ok(start>0&&end>start);
 const source=app.slice(start,end);
 assert.match(source,/const byId=new Map\(\)/);
 assert.match(source,/if\(!byId\.has\(id\)\)byId\.set\(id,skill\)/);
 assert.match(source,/const skill=byId\.get\(String\(row\.id\)\)/);
 assert.doesNotMatch(source,/skills\.find\(/);
 assert.match(source,/locked\.set\(row\.threshold,bucket\)/);
 assert.match(source,/\.sort\(\(a,b\)=>a\.threshold-b\.threshold\)/);
});

test('skill thresholds and class caps are validated before showing a milestone',()=>{
 assert.match(milestones,/const rawMax=Number\(cap\),max=Number\.isSafeInteger\(rawMax\)/);
 assert.match(milestones,/Number\(amount\)<=0\)continue/);
 assert.match(milestones,/record\.id===undefined\|\|record\.id===null/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};
Function('window',file('pandora-studio-build-library-merge.js'))(host);
const {reconcile,orderByCreation,creationStamp}=host.PandoraBuildLibraryMerge;
const id=n=>n.toString(16).repeat(32);
const build=(n,createdAt,at=createdAt)=>({
 id:id(n),name:'Build '+n,at,createdAt,
 data:{race:1,job:8,level:10}
});

test('cloud reconnection places newer saves after older cards, independently of transport order',()=>{
 const oldest=build(1,100,990),middle=build(2,200,300),newest=build(3,300,200);
 const r=reconcile({local:[newest,oldest],remote:[{id:middle.id,entry:middle}],
  newId:()=>id(4)});
 assert.deepEqual(r.merged.map(x=>x.id),[oldest.id,middle.id,newest.id]);
 assert.equal(r.merged.find(x=>x.id===oldest.id).at,990,
  'An overwritten build stays at its creation position even with a newer revision');
});

test('legacy saves without creation timestamp use at; real createdAt is never overwritten by a revision',()=>{
 const old={...build(1,100),createdAt:undefined};
 const revised={...build(2,200,990)};
 const newest=build(3,300,301);
 assert.equal(creationStamp(old),100);
 assert.equal(creationStamp(revised),200);
 const rows=[newest,revised,old];
 assert.equal(orderByCreation(rows),rows);
 assert.deepEqual(rows.map(x=>x.id),[old.id,revised.id,newest.id]);
});

test('saved-build UI appends new cards, preserves overwritten positions and keeps the row capped at four',()=>{
 const app=file('pandora-studio-app.js');
 const css=file('pandora-studio-build-comparison.css');
 const save=app.slice(app.indexOf('function saveBuild('),app.indexOf('function sanitizeSharedState('));
 const library=app.slice(app.indexOf('function renderBuilds('),app.indexOf('function newId()'));
 assert.match(save,/if\(existing\)builds\.splice\(existingIndex,1,entry\)/);
 assert.match(save,/else builds\.push\(entry\)/);
 assert.doesNotMatch(save,/builds\.unshift\(/);
 assert.match(library,/const setGridColumns=count/);
 assert.match(library,/Math\.max\(1,Math\.min\(4,count\)\)/);
 assert.match(library,/setGridColumns\(searchable\.length\)/);
 assert.match(library,/setGridColumns\(visible\)/);
 assert.match(css,/grid-template-columns:repeat\(var\(--build-visible-columns,4\),390px\)/);
 assert.match(css,/overflow-x:auto/);
 assert.doesNotMatch(css,/\.build-grid\{grid-template-columns:repeat\(auto-fit/);
});

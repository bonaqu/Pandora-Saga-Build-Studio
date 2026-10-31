import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const snapshot=JSON.parse(read('data/remaked/legacy-calc-cases.v1.json'));
const inventory=read('docs/REMAKED_FORMULA_INVENTORY.md');
test('every one of 178 Remaked switches and 143 identities has a source line and durable audit entry',()=>{
 assert.equal(snapshot.caseOccurrences,178);
 assert.equal(snapshot.entries.length,snapshot.caseOccurrences);
 const keys=new Set(snapshot.entries.map(r=>r.key));
 assert.equal(snapshot.uniqueKeys,143);
 assert.equal(keys.size,snapshot.uniqueKeys);
 for(const row of snapshot.entries){
  assert.ok(Number.isInteger(row.line)&&row.line>0);
  assert.ok(keys.has(row.key));
  assert.match(inventory,new RegExp('\\| \\x60'+row.key+'\\x60 \\|'));
 }
});
test('audit has no duplicate or silently absent Legacy calculation identities',()=>{
 const keys=[...inventory.matchAll(/^\\| \\x60([^\\x60]+)\\x60 \\|/gm)].map(x=>x[1]);
 assert.equal(keys.length,snapshot.uniqueKeys);
 assert.equal(new Set(keys).size,snapshot.uniqueKeys);
 assert.deepEqual(new Set(keys),new Set(snapshot.entries.map(x=>x.key)));
});
test('formula index remains visible in roadmap and pinned to a Remaked source revision',()=>{
 assert.match(snapshot.sourceRepository,/Pandora-Saga-Simulator-remaked/);
 assert.match(snapshot.sourceTreeSha,/^[a-f0-9]{40}$/);
 assert.match(read('ROADMAP.md'),/REMAKED_FORMULA_INVENTORY\.md/);
});

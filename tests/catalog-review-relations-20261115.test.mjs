import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditGameRelationships,auditReview}
 from '../scripts/check-catalog-review-2026-11-15.mjs';

const prefix='../data/catalog-review/ps-ca9a604163b54a2da5c83ea55077ef96/';
const names=['items','monsters','drops','trades','chests','itemForth'];
const data=Object.fromEntries(names.map(name=>[
 name,JSON.parse(readFileSync(new URL(prefix+name+'.json',import.meta.url),'utf8'))
]));
const verify=source=>auditGameRelationships(source);

test('pinned candidate has no unresolved loot, NPC, chest or enhancement links',()=>{
 const result=verify(data);
 assert.deepEqual(result.errors,[]);
 assert.equal(result.ok,true);
 assert.ok(result.checked.drops>1000);
 assert.ok(result.checked.trades>200);
 assert.ok(result.checked.tradeMaterials>200);
 assert.ok(result.checked.chestRewards>100);
 assert.ok(result.checked.itemForth>150);
 const full=auditReview();
 assert.deepEqual(full.gameRelations,result.checked);
 assert.equal(full.promoted,true);
});

test('candidate relation gate detects each independent broken source link',()=>{
 const broken=[
  [s=>{s.drops['11101'].d[0].i=999999998},'unknown-drop-item'],
  [s=>{s.drops['11101'].d[0].hi=-1},'invalid-drop-refinement'],
  [s=>{s.trades.trades[0].i=999999998},'unknown-trade-result'],
  [s=>{s.trades.trades[0].mats[0].i=999999998},'unknown-trade-material'],
  [s=>{s.trades.trades[0].mats.push({...s.trades.trades[0].mats[0]})},'duplicate-trade-material'],
  [s=>{s.trades.trades[0].npc[0]=999999998},'unknown-trade-npc'],
  [s=>{s.trades.trades[0].npc.push(s.trades.trades[0].npc[0])},'duplicate-trade-npc'],
  [s=>{s.chests.boxes[0].i=999999998},'unknown-chest-box'],
  [s=>{s.chests.boxes[0].rolls[0][0].i=999999998},'unknown-chest-reward'],
  [s=>{s.itemForth['999999998']={}},'unknown-forth-item']
 ];
 for(const [mutate,kind] of broken){
  const source=structuredClone(data);mutate(source);
  assert.ok(verify(source).errors.some(x=>x.kind===kind),kind);
 }
});

test('current catalog data is not modified by read-only cross-reference audit',()=>{
 const before=JSON.stringify(data);
 assert.equal(verify(data).ok,true);
 assert.equal(JSON.stringify(data),before);
});

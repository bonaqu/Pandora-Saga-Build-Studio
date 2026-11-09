import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const host={};
Function('window',readFileSync(new URL('../pandora-studio-encyclopedia-catalog.js',
 import.meta.url),'utf8'))(host);
const wiki=host.PandoraWikiCatalog;
const original=Object.fromEntries(wiki.keys.map(key=>[
 key,JSON.parse(readFileSync(new URL('../data/os/'+key+'.json',import.meta.url),'utf8'))
]));
const fixture=()=>structuredClone(original);

test('all OS monster-drop refine intervals and trade recipe groups are source-valid',()=>{
 const rows=Object.values(original.drops).flatMap(group=>
  [...(group.d||[]),...(group.s||[])]);
 assert.equal(rows.length,1288);
 assert.ok(rows.every(row=>row.lo<=row.hi));
 assert.equal(original.trades.trades.length,236);
 assert.ok(original.trades.trades.every(recipe=>
  new Set((recipe.mats||[]).map(row=>String(row.i))).size===(recipe.mats||[]).length&&
  new Set((recipe.npc||[]).map(String)).size===(recipe.npc||[]).length));
 assert.doesNotThrow(()=>wiki.validate(fixture()));
});

test('an inverted monster refinement range is not accepted as live source',()=>{
 const data=fixture();
 const drop=Object.values(data.drops).find(group=>group.d?.length).d[0];
 drop.lo=6;drop.hi=3;
 assert.throws(()=>wiki.validate(data),/диапазон улучшения добычи монстра/);
});

test('duplicate trade ingredients cannot double-charge an apparently valid item',()=>{
 const data=fixture();
 const recipe=data.trades.trades.find(row=>row.mats?.length);
 recipe.mats.push({...recipe.mats[0]});
 assert.throws(()=>wiki.validate(data),/повторный материал обмена NPC/);
});

test('repeated NPC in one trade recipe does not create duplicate offer links',()=>{
 const data=fixture();
 const recipe=data.trades.trades.find(row=>row.npc?.length);
 recipe.npc.push(recipe.npc[0]);
 assert.throws(()=>wiki.validate(data),/повторный NPC обмена/);
});

test('different NPCs and different recipes may still offer same item',()=>{
 const data=fixture();
 const recipe=data.trades.trades.find(row=>row.npc?.length);
 // This adds a legitimate distinct NPC already present in the source.
 const alternative=Object.keys(data.trades.npcs).find(id=>
  !recipe.npc.includes(Number(id)));
 assert.ok(alternative);
 recipe.npc.push(Number(alternative));
 assert.doesNotThrow(()=>wiki.validate(data));
});

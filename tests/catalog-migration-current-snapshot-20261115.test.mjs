import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>JSON.parse(readFileSync(new URL('../data/os/'+name+'.json',import.meta.url),'utf8'));
const old=name=>JSON.parse(readFileSync(new URL('../data/catalog-history/pre-2026-11-15/'+name+'.json',import.meta.url),'utf8'));
const host={};Function('window',readFileSync(new URL('../pandora-studio-encyclopedia-catalog.js',import.meta.url),'utf8'))(host);
const C=host.PandoraWikiCatalog;
test('current published D1 source is accepted by the same strict catalog validator',()=>{
 const game=Object.fromEntries(C.keys.map(k=>[k,read(k)]));
 assert.doesNotThrow(()=>C.validate(game));
 assert.equal(Object.keys(game.items).length,1140);
 assert.equal(Object.keys(game.skills).length,571);
 assert.equal(Object.keys(game.souls).length,115);
 assert.equal(Object.keys(game.monsters).length,707);
 assert.equal(Object.keys(game.drops).length,180);
 assert.equal(game.trades.trades.length,212);
 assert.equal(Object.keys(read('itemForth')).length,172);
 assert.equal(game.chests.boxes.length,33);
 assert.equal(game.tables.levelCap,50);
 assert.equal(read('meta').curated,true);
});
test('changes to current game tables do not fabricate removed historical drop sources',()=>{
 const before=old('tables'),after=read('tables');
 assert.equal(before.levelCap,45);
 assert.equal(after.levelCap,50);
 assert.ok(before.zoneDrops.length>=after.zoneDrops.length);
 for(const area of after.zoneDrops){
  assert.ok(Array.isArray(area.rows));
  assert.ok(area.rows.every(row=>row&&typeof row==='object'));
 }
 const beforeDescriptions=old('instances'),afterDescriptions=read('instances');
 for(const item of beforeDescriptions){
  const next=afterDescriptions.find(x=>x.id===item.id);
  assert.deepEqual(next,item,'Manually preserved Russian text '+item.id);
 }
});

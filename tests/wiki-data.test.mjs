import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../wiki-data.js',import.meta.url),'utf8'),ctx);
test('item sources retain distinct NPC, monster and chest probability semantics',()=>{
 const data={drops:{20:{d:[{i:101,p:4.5}]}},trades:{trades:[{id:4,i:101,npc:[7]}]},chests:{boxes:[{i:8,rolls:[[{i:101,p:30}]]}]},tables:{zoneDrops:[]},maps:{3:{name:'Field',mobs:[20]}}};
 const w=ctx.window.PandoraWikiData.build(data);
 assert.equal(w.sources(101).length,3);
 assert.equal(w.drops(20)[0].percent,4.5);
 assert.equal(w.trades(7)[0].id,4);
 assert.equal(w.locations(20)[0].name,'Field');
});
test('group rewards do not claim per-item probability',()=>{
 const w=ctx.window.PandoraWikiData.build({tables:{zoneDrops:[{map:8,rows:[{base:10,items:[{i:1},{i:2}]}]}]}});
 assert.equal(w.sources(1)[0].percent,undefined);
 assert.equal(w.sources(1)[0].groupChance,10);
});

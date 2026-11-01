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
test('searches across names, descriptions, class restrictions and alternate display names',()=>{
 const data={items:{1:{name:'Крепкий шлем',level:51,desc:'Укреплённый доспех'},2:{name:'Зелье',desc:'Восстанавливает ману'}},
  monsters:{3:{name:'Ёж',level:20}},maps:{8:{name:'Лес',mobs:[3]}},skills:{4:{name:'Удар',classes:{WARRIOR:1}}},
  souls:{5:{name:'Душа удачи',slots:['weapon']}},trades:{npcs:{6:{name:'Кузнец',maps:[8]}},trades:[],mapNames:{}},
  tables:{zoneDrops:[]},chests:{boxes:[]},instances:[]};
 const wiki=ctx.window.PandoraWikiData.build(data);
 assert.equal(wiki.search('item','крепкий 51').length,1);
 assert.equal(wiki.search('item','ману').length,1);
 assert.equal(wiki.search('monster','еж').length,1);
 assert.equal(wiki.search('monster','лес').length,1);
 assert.equal(wiki.search('skill','warrior').length,1);
 assert.equal(wiki.search('item','helmet',id=>id==='1'?'Heavy Helmet':'').length,1);
 assert.equal(wiki.search('soul','weapon').length,1);
 assert.equal(wiki.search('item','unmatched').length,0);
 assert.equal(wiki.search('item','000001').length,0,'database IDs are not a public search field');
 assert.equal(wiki.residents(8).length,1);
 assert.equal(wiki.records('map')['8'].name,'Лес');
 assert.equal(wiki.records('item')['1'].name,'Крепкий шлем');
 assert.equal(wiki.normalize('ЁЖ'),'еж');
});
test('materials link back to unique NPC trades, and zones use one location index',()=>{
 const wiki=ctx.window.PandoraWikiData.build({trades:{trades:[
  {id:1,i:40,npc:[7,8],mats:[{i:11},{i:11}]},
  {id:2,i:41,npc:[8],mats:[{i:11}]}],npcs:{},mapNames:{}},
  tables:{zoneDrops:[{map:3,rows:[{base:10,items:[{i:11}]}]}]}});
 assert.equal(wiki.materialUses(11).length,2);
 assert.equal(wiki.trades(8).length,2);
 assert.equal(wiki.zones(3).length,1);
 assert.equal(wiki.sources(11)[0].groupChance,10);
});
test('group rewards do not claim per-item probability',()=>{
 const w=ctx.window.PandoraWikiData.build({tables:{zoneDrops:[{map:8,rows:[{base:10,items:[{i:1},{i:2}]}]}]}});
 assert.equal(w.sources(1)[0].percent,undefined);
 assert.equal(w.sources(1)[0].groupChance,10);
});

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
test('searches names only, with RU/EN labels and no raw IDs or descriptions',()=>{
 const data={items:{1:{name:'Крепкий шлем',level:51,desc:'Укреплённый доспех'},2:{name:'Зелье',desc:'Восстанавливает ману'}},
  monsters:{3:{name:'Ёж',level:20}},maps:{8:{name:'Лес',mobs:[3]}},skills:{4:{name:'Удар',classes:{WARRIOR:1}}},
  souls:{5:{name:'Душа удачи',slots:['weapon']}},trades:{npcs:{6:{name:'Кузнец',maps:[8]}},trades:[],mapNames:{}},
  tables:{zoneDrops:[]},chests:{boxes:[]},instances:[]};
 const wiki=ctx.window.PandoraWikiData.build(data);
 assert.equal(wiki.search('item','крепкий шлем').length,1);
 assert.equal(wiki.search('item','крепкий 51').length,0);
 assert.equal(wiki.search('item','ману').length,0);
 assert.equal(wiki.search('monster','еж').length,1);
 assert.equal(wiki.search('monster','лес').length,0);
 assert.equal(wiki.search('skill','warrior').length,0);
 assert.equal(wiki.search('item','helmet',id=>id==='1'?'Heavy Helmet':'').length,1);
 assert.equal(wiki.search('item','heals mana',id=>id==='2'?'Potion':'').length,0);
 assert.equal(wiki.search('soul','weapon').length,0);
 assert.equal(wiki.search('item','unmatched').length,0);
 assert.equal(wiki.search('item','000001').length,0);
 assert.equal(wiki.residents(8).length,1);
 assert.equal(wiki.records('map')['8'].name,'Лес');
 assert.equal(wiki.records('item')['1'].name,'Крепкий шлем');
 assert.equal(wiki.normalize('ЁЖ'),'еж');
});
test('English item names are searchable, unlike English description-only words',()=>{
 const items=JSON.parse(fs.readFileSync(new URL('../data/os/items.json',import.meta.url),'utf8'));
 const en=JSON.parse(fs.readFileSync(new URL('../data/os/strings.en.json',import.meta.url),'utf8'));
 assert.equal(en.items['1822'].n,'Kris');
 const wiki=ctx.window.PandoraWikiData.build({items,instances:[],
  trades:{npcs:{},trades:[],mapNames:{}},tables:{zoneDrops:[]}});
 assert.ok(wiki.search('item','kris',id=>en.items?.[id]?.n||'').some(([id])=>id==='1822'));
 assert.equal(wiki.search('item','meteoric ore',id=>en.items?.[id]?.n||'').length,0);
});
test('display dedup keeps source records, collapses exact mobs and script-only skills',()=>{
 const wiki=ctx.window.PandoraWikiData.build({
  monsters:{11:{id:11,name:'Волк',level:10,life:100},22:{id:22,name:'Волк',level:10,life:100},
   33:{id:33,name:'Волк',level:20,life:200}},
  maps:{5:{name:'Лес',mobs:[11]},6:{name:'Долина',mobs:[22]}},
  skills:{101:{id:101,name:'Ловушка',branch:'trap',learnable:true,mana:20},
   102:{id:102,name:'Ловушка',branch:'trap',learnable:false,mana:0},
   103:{id:103,name:'Сосредоточенность',branch:'slash',learnable:true},
   104:{id:104,name:'Сосредоточенность',branch:'element',learnable:true}},
  items:{41:{id:41,name:'Амулет',AC:1},42:{id:42,name:'Амулет',AC:2}},
  trades:{npcs:{},trades:[],mapNames:{}},tables:{zoneDrops:[]}});
 assert.equal(wiki.search('monster','волк').length,2);
 assert.equal(wiki.canonical('monster',22),'11');
 assert.equal(wiki.locations(11).map(x=>x.name).sort().join('|'),'Долина|Лес');
 assert.equal(wiki.search('skill','ловушка').length,1);
 assert.equal(wiki.canonical('skill',102),'101');
 assert.equal(wiki.search('skill','сосредоточенность').length,2);
 assert.equal(wiki.search('item','амулет').length,2);
 assert.ok(wiki.records('monster')['22']);
 assert.ok(wiki.records('skill')['102']);
});
test('identical monster stats with different loot cannot be merged',()=>{
 const data={monsters:{
  11:{id:11,name:'Страж',level:25,life:900},
  22:{id:22,name:'Страж',level:25,life:900}},
  drops:{11:{d:[{i:41,p:20}]},22:{d:[{i:42,p:50}]}},
  trades:{npcs:{},trades:[],mapNames:{}},tables:{zoneDrops:[]}};
 const wiki=ctx.window.PandoraWikiData.build(data);
 assert.equal(wiki.search('monster','страж').length,2);
 assert.equal(wiki.sameName('monster',11).length,1);
 assert.equal(wiki.drops(11)[0].itemId,'41');
 assert.equal(wiki.drops(22)[0].itemId,'42');
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
test('all eight original level-reward series entries remain distinct and future chests are browsable',()=>{
 const items=JSON.parse(fs.readFileSync(new URL('../data/os/items.json',import.meta.url),'utf8'));
 const boxes=JSON.parse(fs.readFileSync(new URL('../data/os/chests.json',import.meta.url),'utf8'));
 const wiki=ctx.window.PandoraWikiData.build({items,chests:boxes,
  trades:{npcs:{},trades:[],mapNames:{}},tables:{zoneDrops:[]}});
 assert.equal(boxes.boxes.length,32,'Original OS loot tables are unchanged');
 assert.equal(wiki.search('chest','').length,52);
 assert.equal(wiki.rewardChest(51003).level,5);
 assert.equal(wiki.rewardChest(51005).family,'warrior');
 assert.equal(wiki.rewardChest(51018).family,'scout');
 assert.equal(wiki.rewardChest(51026).family,'acolyte');
 assert.equal(wiki.rewardChest(51034).family,'mage');
 for(const id of [51010,51018,51026,51034]){
  assert.equal(wiki.rewardChest(id).level,60);
  assert.equal(wiki.records('chest')[id].rolls.length,0);
  assert.equal(wiki.records('chest')[id].unlistedContents,true);
  assert.ok(wiki.search('item','').some(([key])=>key===String(id)));
 }
 assert.equal(wiki.rewardChest(80106),null);
});
test('location chests are indexed separately from storage upgrades and unverified loot',()=>{
 const items=JSON.parse(fs.readFileSync(new URL('../data/os/items.json',import.meta.url),'utf8'));
 const maps=JSON.parse(fs.readFileSync(new URL('../data/os/maps.json',import.meta.url),'utf8'));
 const chests=JSON.parse(fs.readFileSync(new URL('../data/os/chests.json',import.meta.url),'utf8'));
 const wiki=ctx.window.PandoraWikiData.build({items,maps,chests,
  trades:{npcs:{},trades:[],mapNames:{}},tables:{zoneDrops:[]}});
 for(const id of ['51038','51040','51042','52000','52001','52011','900001'])
  assert.ok(wiki.search('chest','').some(([key])=>key===id),'Missing chest '+id);
 assert.equal(wiki.search('chest','Мальдии').length,1);
 assert.equal(wiki.records('chest')['52011'].unlistedContents,true);
 assert.equal(wiki.records('chest')['52011'].rolls.length,0);
 assert.equal(wiki.chestPlaces('52011').length,2);
 for(const id of [90057,90058,90059,90060,90061,90062])
  assert.equal(wiki.records('chest')[id],undefined,'Warehouse upgrades are not loot chests');
 assert.equal(chests.boxes.length,32,'Do not fabricate chest tables in OS data');
});
test('group rewards do not claim per-item probability',()=>{
 const w=ctx.window.PandoraWikiData.build({tables:{zoneDrops:[{map:8,rows:[{base:10,items:[{i:1},{i:2}]}]}]}});
 assert.equal(w.sources(1)[0].percent,undefined);
 assert.equal(w.sources(1)[0].groupChance,10);
});

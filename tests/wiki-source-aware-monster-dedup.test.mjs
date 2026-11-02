import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const json=path=>JSON.parse(read(path));
const context={window:{}};
vm.runInNewContext(read('pandora-studio-encyclopedia-data.js'),context);
const build=context.window.PandoraWikiData.build;
const plain=x=>JSON.parse(JSON.stringify(x));
const fixture=()=>({
 items:{},monsters:{},drops:{},maps:{},instances:[],trades:{trades:[],npcs:{},mapNames:{}},
 tables:{zoneDrops:[]},chests:{boxes:[],npc:[]},skills:{},souls:{}
});
test('Giant python source-backed ID 11205 supersedes empty ID 72006 without removing raw records',()=>{
 const all=json('data/os/monsters.json'),drops=json('data/os/drops.json'),
  maps=json('data/os/maps.json');
 const input=fixture();
 input.monsters={'11205':all['11205'],'72006':all['72006']};
 input.drops={'11205':drops['11205']};
 input.maps={'2002002':maps['2002002']};
 const index=build(input);
 const results=plain(index.search('monster','Гигантский питон').map(([id])=>id));
 assert.deepEqual(results,['11205']);
 assert.equal(index.canonical('monster','72006'),'11205');
 assert.deepEqual(plain(index.related('monster','11205')),['11205','72006']);
 assert.equal(index.records('monster')['72006'].id,72006);
 assert.equal(index.drops('11205').length,8);
 assert.equal(index.drops('72006').length,8);
 assert.deepEqual(plain(index.locations('72006').map(x=>x.id)),['2002002']);
 assert.equal(index.sameName('monster','11205').length,0);
});
test('identical orphan monster copies collapse even if none has drop or spawn info',()=>{
 const input=fixture();
 for(const id of [43211,43212,43213,43214,43215])
  input.monsters[id]={id,name:'Зомби',level:48,life:800,resists:{fire:10}};
 const index=build(input);
 assert.deepEqual(plain(index.search('monster','Зомби').map(([id])=>id)),['43211']);
 for(const id of [43212,43213,43214,43215])
  assert.equal(index.canonical('monster',id),'43211');
 assert.deepEqual(plain(index.related('monster','43211')),
  ['43211','43212','43213','43214','43215']);
});
test('different monster stats, source-backed variants, and zone-only sources are preserved',()=>{
 const input=fixture();
 const common={name:'Фонарщик',level:50,life:9000};
 input.monsters={11:{...common,id:11},12:{...common,id:12},
 13:{...common,id:13},14:{...common,id:14,life:9100}};
 input.drops={11:{d:[{i:90,p:30}],s:[]},12:{d:[{i:91,p:30}],s:[]}};
 input.tables.zoneDrops=[{map:444,rows:[{mob:13,items:[]}]}];
 const index=build(input);
 assert.deepEqual(plain(index.search('monster','Фонарщик').map(([id])=>id)),
  ['11','12','13','14']);
 assert.equal(index.canonical('monster','12'),'12');
 assert.equal(index.canonical('monster','13'),'13');
});
test('matching item records retain all independent acquisition locations',()=>{
 const input=fixture();
 const original={name:'Зелье мастерства',kind:'POTION',level:1};
 input.items={100:{...original,id:100},101:{...original,id:101}};
 input.monsters={10:{name:'Источник A',id:10},20:{name:'Источник Б',id:20}};
 input.drops={10:{d:[{i:100,p:20}],s:[]},20:{d:[{i:101,p:30}],s:[]}};
 const index=build(input);
 assert.equal(index.search('item','Зелье мастерства').length,1);
 assert.equal(index.canonical('item','101'),'100');
 assert.deepEqual(plain(index.sources('100').map(x=>x.id)),['10','20']);
 assert.deepEqual(plain(index.sources('101').map(x=>x.id)),['10','20']);
});
test('real game encyclopedia hides unreferenced identical monster records without mutating OS data',()=>{
 const input=fixture();
 Object.assign(input,{monsters:json('data/os/monsters.json'),
  drops:json('data/os/drops.json'),maps:json('data/os/maps.json'),
  instances:json('data/os/instances.json'),tables:json('data/os/tables.json')});
 const total=Object.keys(input.monsters).length,index=build(input);
 const shown=index.search('monster','');
 assert.equal(total,702);
 assert.ok(shown.length<total-100,'Duplicate orphan clutter must be removed');
 assert.equal(index.search('monster','Гигантский питон').length,1);
 assert.equal(index.canonical('monster','72006'),'11205');
 const lamplighters=index.search('monster','Фонарщик');
 assert.equal(lamplighters.length,1,
  'Identical event phases with the same drop and spawns should show only once');
 assert.equal(index.canonical('monster','43642'),'43641');
 assert.equal(index.drops('43641').length,2);
 assert.equal(index.locations('43641').length,2);
 assert.equal(Object.keys(input.monsters).length,702,
  'Deduplication must never delete original OS game records');
});

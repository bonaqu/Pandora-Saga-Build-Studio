import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-studio-encyclopedia-catalog.js'))(host);
const loader=host.PandoraWikiCatalog;

const fixture=()=>({
 meta:{counts:Object.fromEntries([
  'items','monsters','maps','instances','drops','trades','skills','souls',
  'racialPassives'].map(key=>[key,1]))},
 items:{1:{id:1,name:'Item'}},
 souls:{1:{id:1,name:'Soul'}},
 monsters:{1:{id:1,name:'Monster'}},
 maps:{1:{name:'Map',mobs:[1]}},
 instances:[{id:1,name:'Dungeon',mobs:[1]}],
 drops:{1:{d:[{i:1}],s:[]}},
 trades:{trades:[{id:1,i:1,mats:[{i:1,n:1}],npc:[1]}],
  npcs:{1:{name:'Merchant',maps:[1]}},mapNames:{}},
 tables:{zoneDrops:[{map:1,rows:[{mob:1,items:[{i:1}]}]}]},
 chests:{boxes:[{i:1,rolls:[[]]}],npc:[]},
 skills:{1:{id:1,name:'Test passive',skillType:'PASSIVE',branch:'race'}},
 racialPassives:{HUMAN:{key:'HUMAN',raceId:1,skills:[1]}}
});

test('a complete catalog accepts valid source-backed nested relationship arrays',()=>{
 const value=fixture(),before=JSON.stringify(value);
 assert.doesNotThrow(()=>loader.validate(value));
 assert.equal(JSON.stringify(value),before,'validation must not mutate the catalog');
 const archive={};
 for(const key of loader.keys)archive[key]=JSON.parse(read('data/os/'+key+'.json'));
 assert.doesNotThrow(()=>loader.validate(archive),
  'real bundled game tables use the same strict nested-list contract');
});

test('malformed nested relation lists fail before Encyclopedia indexes partial links',()=>{
 const failures=[
  ['maps mobs as string',c=>{c.maps[1].mobs='1'}],
  ['maps mobs as object',c=>{c.maps[1].mobs={0:1}}],
  ['maps NPCs as string',c=>{c.maps[1].npcs='1'}],
  ['dungeon mobs as string',c=>{c.instances[0].mobs='1'}],
  ['monster drops as string',c=>{c.drops[1].d='1'}],
  ['monster soul drops as object',c=>{c.drops[1].s={}}],
  ['trade materials as string',c=>{c.trades.trades[0].mats='1'}],
  ['trade NPCs as string',c=>{c.trades.trades[0].npc='1'}],
  ['NPC locations as string',c=>{c.trades.npcs[1].maps='1'}],
  ['zone rows as object',c=>{c.tables.zoneDrops[0].rows={}}],
  ['zone reward items as string',c=>{c.tables.zoneDrops[0].rows[0].items='1'}],
  ['null monster drop record',c=>{c.drops[1].d=[null]}],
  ['null trade material record',c=>{c.trades.trades[0].mats=[null]}],
  ['null zone reward record',c=>{c.tables.zoneDrops[0].rows[0].items=[null]}],
  ['null map record',c=>{c.maps[1]=null}]
 ];
 for(const [label,corrupt] of failures){
  const data=fixture();corrupt(data);
  assert.throws(()=>loader.validate(data),/Нарушены связи игрового каталога/,
   label+' must be rejected');
 }
});

test('optional absent relationship lists remain backward compatible',()=>{
 const data=fixture();
 delete data.maps[1].mobs;
 delete data.instances[0].mobs;
 delete data.drops[1].d;
 delete data.trades.trades[0].mats;
 delete data.trades.trades[0].npc;
 delete data.trades.npcs[1].maps;
 delete data.tables.zoneDrops[0].rows;
 assert.doesNotThrow(()=>loader.validate(data));
});

test('malformed D1 links fail strictly or atomically use a valid local snapshot',async()=>{
 const bad=fixture(),local=fixture();
 bad.maps[1].mobs='1';
 bad.items[1].name='broken online data';
 local.items[1].name='safe archive';
 const fetcher=async url=>{
  const remote=url.includes('/api/catalog/');
  const key=url.split('/').at(-1).replace('.json','');
  return {ok:true,status:200,
   headers:{get:name=>remote?name==='x-ps-catalog'?'d1':
    name==='x-ps-catalog-snapshot'?'fixture-v1':null:null},
   json:async()=>structuredClone((remote?bad:local)[key])};
 };
 await assert.rejects(loader.load({api:'https://worker.example',fetcher,strict:true}),
  /список монстров локации/);
 const accepted=await loader.load({api:'https://worker.example',fetcher});
 assert.equal(accepted.source,'local');
 assert.equal(accepted.data.items[1].name,'safe archive');
 assert.deepEqual(accepted.data.maps[1].mobs,[1]);
});

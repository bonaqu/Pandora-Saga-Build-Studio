import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import worker from '../worker/index.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={window:{}};
for(const file of ['pandora-studio-astir-locations.js',
 'pandora-studio-wiki-owner-data.js','pandora-studio-encyclopedia-data.js'])
 vm.runInNewContext(read(file),root,{filename:file});
const geo=root.window.PandoraAstirLocations;
const owner=root.window.PandoraWikiOwnerData;
const wikiData=root.window.PandoraWikiData;
const plain=x=>JSON.parse(JSON.stringify(x));
const base=()=>({
 trades:{npcs:{131:{name:'Королевский NPC',maps:[1003001]}},trades:[],
  mapNames:{1001004:{name:'Центральная площадь'},
   1002001:{name:'Союз северных племен Ванриг'},
   1003001:{name:'Королевство Сэнт-Фальстайн'},
   1004001:{name:'Лотарская империя'}}},
 maps:{},items:{},monsters:{},drops:{},instances:[],skills:{},souls:{},
 tables:{zoneDrops:[]},chests:{boxes:[],npc:[]}
});
const overrides={
 'wikiedit.npc.astir-npc-kingdom-claris':JSON.stringify({
  name:'Кларис',nameEn:'Claris',desc:'Открывает сундуки',
  descEn:'Opens chests',service:'Мастер сундуков',
  serviceEn:'Chest master',maps:['astir-empire'],grid:'H-8'}),
 'wikiedit.map.astir-empire':JSON.stringify({
  name:'Территория Империи',nameEn:'Empire District',
  desc:'Внутригородская территория',descEn:'A district of Astir'}),
 'wikiedit.npc.astir-npc-union-custom-1':JSON.stringify({
  name:'Тестовый NPC',nameEn:'Test NPC',maps:['astir-union'],
  service:'Работа с предметами'})
};
test('town map, NPC, RU/EN strings and reverse locations come from the same D1 override',()=>{
 const original=base(),patched=owner.apply(original,overrides);
 const index=wikiData.build(patched);
 const claris=index.records('npc')['astir-npc-kingdom-claris'];
 assert.equal(claris.nameEn,'Claris');
 assert.equal(claris.service,'Мастер сундуков');
 assert.equal(claris.serviceEn,'Chest master');
 assert.equal(claris.descEn,'Opens chests');
 assert.deepEqual(plain(claris.maps),['astir-empire']);
 assert.equal(index.residents('astir-kingdom').some(([id])=>id==='astir-npc-kingdom-claris'),false);
 assert.equal(index.residents('astir-empire').some(([id])=>id==='astir-npc-kingdom-claris'),true);
 assert.equal(index.records('map')['astir-empire'].descEn,'A district of Astir');
 assert.equal(index.records('map')['astir-empire'].name,'Территория Империи');
 assert.equal(index.search('npc','Test NPC',id=>index.records('npc')[id]?.nameEn)
  .some(([id])=>id==='astir-npc-union-custom-1'),true);
 assert.equal(index.residents('astir-union').length,1);
 assert.deepEqual(plain(original.trades.npcs[131].maps),[1003001],
  'Game NPC residency must never be changed by special wiki edits');
 assert.equal(original.townNpcs,undefined,'Base OS data stays immutable');
});
test('virtual patch validation rejects unknown fields, IDs and forged NPC relations',()=>{
 assert.equal(owner.validTownPatch('npc','astir-npc-kingdom-claris',
  {nameEn:'Claris',maps:['astir-kingdom']}),true);
 assert.equal(owner.validTownPatch('npc','astir-npc-kingdom-claris',
  {maps:['1001004']}),true);
 for(const [type,id,patch] of [
  ['npc','astir-npc-empire-claris',{maps:['1003001']}],
  ['npc','astir-npc-kingdom-claris',{maps:['astir-imperial']}],
  ['npc','astir-npc-kingdom-claris',{maps:['astir-union','astir-empire']}],
  ['npc','astir-npc-kingdom-claris',{nameEn:''}],
  ['map','astir-kingdom',{mobs:[1]}],
  ['npc','astir-npc-kingdom-../evil',{name:'A'}],
  ['npc','astir-npc-kingdom-claris',{__protoPolluted:true}]
 ])assert.equal(owner.validTownPatch(type,id,patch),false,String(id)+' / '+JSON.stringify(patch));
 const changed=owner.apply(base(),{
  'wikiedit.npc.astir-npc-kingdom-claris':JSON.stringify({maps:['1003001']})
 });
 assert.equal(changed.townNpcs,undefined);
});
test('authenticated Worker saves and resets bounded town wiki patches in D1',async()=>{
 const db={values:new Map(),prepare(sql){
  const args=[];
  return {
   bind(...values){args.push(...values);return this},
   first:async()=>({id:1}),
   run:async()=>{
    if(sql.includes('INSERT INTO overrides'))db.values.set(args[0],args[1]);
    else if(sql.includes('DELETE FROM overrides'))db.values.delete(args[0]);
    return{meta:{changes:1}};
   }
  };
 }};
 const send=(key,value,token='a'.repeat(43))=>worker.fetch(new Request(
  'https://ps-build-studio-cloud.bonaqu.workers.dev/api/admin/override',{
   method:'POST',headers:{Origin:'https://bonaqu.github.io',
    Authorization:'Bearer '+token},
   body:JSON.stringify({key,value:JSON.stringify(value)})
  }),{DB:db});
 const approved=[
  ['wikiedit.npc.astir-npc-kingdom-claris',{name:'Кларис',nameEn:'Claris'}],
  ['wikiedit.npc.astir-npc-union-custom-1',{name:'Новый NPC',maps:['astir-union']}],
  ['wikiedit.map.astir-kingdom',{name:'Территория Королевства',descEn:'Kingdom District'}],
  ['wikiedit.npc.131',{nameEn:'Existing NPC'}]
 ];
 for(const [key,patch] of approved){
  const response=await send(key,patch);
  assert.equal(response.status,200,key+' '+await response.text());
  assert.deepEqual(JSON.parse(db.values.get(key)),patch);
  assert.equal((await send(key,patch,'bad-token')).status,401);
 }
 for(const [key,patch] of [
  ['wikiedit.npc.astir-npc-kingdom-claris',{maps:['1003001']}],
  ['wikiedit.npc.astir-npc-kingdom-claris',{__protoPolluted:3}],
  ['wikiedit.npc.astir-npc-kingdom-claris',{nameEn:''}],
  ['wikiedit.npc.astir-npc-kingdom-claris',{maps:['astir-kingdom','astir-union']}],
  ['wikiedit.npc.astir-npc-kingdom-claris',{service:'A'.repeat(241)}],
  ['wikiedit.map.astir-kingdom',{mobs:[100]}],
  ['wikiedit.npc.astir-npc-kingdom-claris/../../admin',{name:'X'}]
 ])assert.equal((await send(key,patch)).status,400,key);
 const r=await worker.fetch(new Request(
  'https://ps-build-studio-cloud.bonaqu.workers.dev/api/admin/reset',{
   method:'POST',headers:{Origin:'https://bonaqu.github.io',
    Authorization:'Bearer '+'a'.repeat(43)},
   body:JSON.stringify({key:'wikiedit.npc.astir-npc-kingdom-claris'})
  }),{DB:db});
 assert.equal(r.status,200);
 assert.equal(db.values.has('wikiedit.npc.astir-npc-kingdom-claris'),false);
});
test('owner interface offers in-place bilingual editing, NPC creation and editable locations',()=>{
 const app=read('pandora-studio-app.js'),workerSource=read('worker/index.js');
 const exportSource=read('worker/pandora-studio-github-catalog-pr.js');
 assert.match(app,/data-owner-field':lang==='en'\?'nameEn':'name'/);
 assert.match(app,/data-owner-field':lang==='en'\?'descEn'/);
 assert.match(app,/wiki-town-npc-create/);
 assert.match(app,/saveWikiRecordPatch\('npc',identifier,patch\)/);
 assert.match(app,/saveWikiRecordField\('npc',id,'maps',\[selector.value\]\)/);
 assert.match(app,/await apiRequest\('\/api\/admin\/override',\{key,value:after\}\)/);
 assert.match(workerSource,/validTownWikiPatch/);
 assert.match(exportSource,/npc\\\.astir-npc/);
 assert.ok(geo.district('astir-kingdom'));
});

test('nation and central-plaza owner names stay editable without confusing town districts',()=>{
 const b=base();
 const patched=owner.apply(b,{
  'wikiedit.map.1001004':JSON.stringify({name:'Главная площадь Астира',nameEn:'Astir Plaza'}),
  'wikiedit.map.1003001':JSON.stringify({name:'Новое название государства'})
 });
 const index=wikiData.build(patched);
 assert.equal(index.records('map')['1001004'].name,'Главная площадь Астира');
 assert.equal(index.records('map')['1001004'].nameEn,'Astir Plaza');
 assert.equal(index.records('map')['1003001'].name,'Новое название государства');
 assert.equal(index.records('map')['astir-kingdom'].name,'Территория Королевства');
 assert.equal(b.trades.mapNames[1003001].name,'Королевство Сэнт-Фальстайн');
});

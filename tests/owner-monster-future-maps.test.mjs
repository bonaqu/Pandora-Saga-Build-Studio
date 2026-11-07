import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import realWorker from '../worker/index.js';
import {withOwnerCasTestClient} from './helpers/owner-cas-compat.mjs';
const worker=withOwnerCasTestClient(realWorker);
import {previewOwnerOverrides} from '../worker/pandora-studio-github-catalog-pr.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const win={};
for(const file of ['pandora-studio-historic-maps.js','pandora-studio-wiki-owner-data.js',
 'pandora-studio-encyclopedia-data.js'])Function('window',read(file))(win);
const owner=win.PandoraWikiOwnerData,locations=win.PandoraHistoricalMaps;
const monsterId='owner-monster-0011223344556677';
const monster={name:'Кровавый ящер-солдат',nameEn:'Blood Lizard Soldier',
 desc:'',descEn:'',level:47,life:900,loot:[100],resists:{fire:10}};
const roster=locations.records()['el-beht'].reportedSpawns.map(x=>({...x}));
const patch={roster:roster.map(x=>x.name==='Кровавый ящер-солдат'?
 {...x,monsterId}:x),mobs:[...locations.records()['el-beht'].mobs,monsterId]};
test('confirmed future zones have normal blank descriptions and keep all owner-provided spawn entries',()=>{
 const places=locations.records();
 for(const placeId of ['el-beht','astir-underground']){
  const place=places[placeId];
  assert.equal(place.historic,undefined);
  assert.equal(place.serverAvailable,undefined);
  assert.equal(place.desc,'');
  assert.equal(place.descEn,'');
  assert.equal(place.releaseStage,'future');
 }
 assert.equal(roster.length,22);
 assert.equal(roster.filter(x=>x.monsterId==null).length,3);
 assert.ok(roster.some(x=>x.name==='Ящер-рыцарь'&&x.level===60));
});
test('owner monster and map roster schemas validate bilingual records without invented game IDs',()=>{
 assert.equal(owner.ownerMonsterId(monsterId),true);
 assert.equal(owner.validTownPatch('monster',monsterId,monster),true);
 assert.equal(owner.validTownPatch('map','el-beht',patch),true);
 assert.equal(owner.validRoster(patch.roster),true);
 assert.equal(owner.validPatch('instance',{mobs:[monsterId]}),true);
 assert.equal(owner.validPatch('map',{mobs:[monsterId]}),true);
 assert.equal(owner.validMapExtra('extraSections',[{
  id:'section-soldiers',titleRu:'Стража',titleEn:'Guards',kind:'monster',entries:[monsterId]
 }]),true);
 for(const bad of [
  {...monster,nameEn:''},{...monster,level:0},{...monster,level:256},
  {...monster,loot:[100,100]},{...monster,resists:{bad:999}},
  {...monster,unexpected:true}
 ])assert.equal(owner.validTownPatch('monster',monsterId,bad),false);
 for(const bad of [
  [...roster,roster[0]],roster.map((x,i)=>i===0?{...x,monsterId:'fake-monster'}:x),
  roster.map((x,i)=>i===0?{...x,level:0}:x),
  roster.map((x,i)=>i===0?{...x,evil:'data'}:x)
 ])assert.equal(owner.validTownPatch('map','el-beht',{roster:bad}),false);
 assert.equal(owner.validTownPatch('monster','owner-monster-invalid',monster),false);
});
test('D1 owner monster is searchable, linked to its future zone and curated item loot',()=>{
 const base={maps:locations.records(),monsters:{},items:{'100':{id:100,name:'Подтверждённый предмет'}},
  trades:{npcs:{},trades:[],mapNames:{}},drops:{},tables:{zoneDrops:[]},
  chests:{boxes:[],npc:[]},instances:[],skills:{},souls:{}};
 const before=JSON.stringify(base);
 const changed=owner.apply(base,{
  ['wikiedit.monster.'+monsterId]:JSON.stringify(monster),
  'wikiedit.map.el-beht':JSON.stringify(patch)
 });
 assert.equal(JSON.stringify(base),before,'Source OS records remain untouched');
 assert.equal(changed.monsters[monsterId].nameEn,'Blood Lizard Soldier');
 assert.equal(changed.maps['el-beht'].roster.find(x=>x.monsterId===monsterId).level,47);
 const graph=win.PandoraWikiData.build(changed);
 assert.equal(graph.records('monster')[monsterId].name,monster.name);
 assert.ok(graph.search('monster','Кровавый ящер').some(([id])=>id===monsterId));
 assert.ok(graph.locations(monsterId).some(x=>x.id==='el-beht'));
 assert.ok(graph.drops(monsterId).some(x=>x.itemId==='100'&&x.curated));
 assert.ok(graph.sources('100').some(x=>x.id===monsterId&&x.type==='owner-monster'));
});
test('only authenticated admin can save owner monsters and map roster in Worker D1',async()=>{
 const values=new Map(),DB={prepare(sql){
  let args=[];
  return {bind(...v){args=v;return this},first:async()=>({id:1}),
   run:async()=>{
    if(sql.includes('INSERT INTO overrides'))values.set(args[0],args[1]);
    if(sql.includes('DELETE FROM overrides'))values.delete(args[0]);
    return {meta:{changes:1}};
   }};
 }};
 const send=async(key,value,auth=true)=>worker.fetch(new Request(
  'https://ps-build-studio-cloud.bonaqu.workers.dev/api/admin/override',{
   method:'POST',headers:{Origin:'https://bonaqu.github.io',
    ...(auth?{Authorization:'Bearer '+'a'.repeat(43)}:{})},
   body:JSON.stringify({key,value:JSON.stringify(value)})
  }),{DB});
 assert.equal((await send('wikiedit.monster.'+monsterId,monster,false)).status,401);
 for(const [key,value]of [
  ['wikiedit.monster.'+monsterId,monster],
  ['wikiedit.map.el-beht',patch],
  ['wikiedit.instance.42',{mobs:[monsterId]}]
 ]){
  const response=await send(key,value);
  assert.equal(response.status,200,key+': '+await response.text());
  assert.equal(values.has(key),true);
 }
 for(const [key,value]of [
  ['wikiedit.monster.owner-monster-invalid',monster],
  ['wikiedit.monster.'+monsterId,{...monster,nameEn:''}],
  ['wikiedit.map.el-beht',{roster:[{id:'bad',name:'bad',level:30}]}],
  ['wikiedit.map.el-beht',{mobs:['../attack']}]
 ])assert.notEqual((await send(key,value)).status,200,key);
});
test('owner review includes new monsters and future roster but excludes private keys',async()=>{
 const rows=[
  {key:'wikiedit.monster.'+monsterId,value:JSON.stringify(monster)},
  {key:'wikiedit.map.el-beht',value:JSON.stringify(patch)},
  {key:'account.password',value:'secret'}
 ];
 const result=await previewOwnerOverrides({DB:{prepare(){
  return {all:async()=>({results:rows})};
 }}});
 assert.equal(result.count,2);
});
test('future zone UI shares the native monster grid and offers in-place linked-card controls',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/const list=h\('div',\{class:'wiki-map-monsters'\}/);
 assert.doesNotMatch(app,/wiki-historic-roster/);
 assert.doesNotMatch(app,/Историческая PvP-локация · недоступна на OS/);
 assert.match(app,/wiki-map-roster-actions/);
 assert.match(app,/createOwnerMonster\(create,\{mapId:id,spawnId:reported.id/);
 assert.match(app,/wiki-monster-create/);
 assert.match(app,/wiki-add-resistance/);
});

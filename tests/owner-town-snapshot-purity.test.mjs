import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from '../worker/index.js';

const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const host={};
for(const path of ['pandora-studio-wiki-owner-data.js',
 'pandora-studio-trade-owner-data.js'])Function('window',read(path))(host);
const owner=host.PandoraWikiOwnerData;
const recipes=host.PandoraStudioTradeOwnerData;
const ownedNpc='owner-npc-0123456789abcdef';
const ownerNpcPatch={name:'Мастер зелий',nameEn:'Potion master',maps:['astir-kingdom']};

const townBase=()=>({
 maps:{},monsters:{},
 townMaps:{
  'astir-kingdom':{name:'Территория Королевства'},
  'astir-union':{name:'Территория Союза'}
 },
 townNpcs:{
  'astir-npc-kingdom-claris':{
   name:'Кларис',maps:['astir-kingdom']},
  'astir-npc-union-guide':{
   name:'Проводник',maps:['astir-union']}
 }
});

test('town owner overlays preserve source town maps and NPCs without shared mutable dictionaries',()=>{
 const base=townBase(),original=JSON.stringify(base);
 Object.freeze(base.townMaps);
 Object.freeze(base.townNpcs);
 const overrides={
  'wikiedit.map.astir-kingdom':JSON.stringify({name:'Новая территория Королевства'}),
  'wikiedit.npc.astir-npc-kingdom-claris':JSON.stringify({
   name:'Кларис — мастер сундуков',maps:['astir-union']
  }),
  ['wikiedit.npc.'+ownedNpc]:JSON.stringify(ownerNpcPatch)
 };
 const changed=owner.apply(base,overrides);
 assert.equal(JSON.stringify(base),original,'A source snapshot must remain byte-for-byte unchanged');
 assert.notStrictEqual(changed.townMaps,base.townMaps);
 assert.notStrictEqual(changed.townNpcs,base.townNpcs);
 assert.equal(changed.townMaps['astir-kingdom'].name,'Новая территория Королевства');
 assert.equal(changed.townMaps['astir-union'].name,'Территория Союза');
 assert.equal(changed.townNpcs['astir-npc-kingdom-claris'].name,'Кларис — мастер сундуков');
 assert.deepEqual(changed.townNpcs['astir-npc-kingdom-claris'].maps,['astir-union']);
 assert.equal(changed.townNpcs[ownedNpc].nameEn,'Potion master');
 assert.deepEqual(changed.townNpcs[ownedNpc].maps,['astir-kingdom']);
 assert.equal(changed.townNpcs[ownedNpc].ownerCreated,true);
 assert.equal(base.townNpcs[ownedNpc],undefined);
 assert.strictEqual(changed.townMaps['astir-union'],base.townMaps['astir-union'],
  'Unchanged source entries can be safely shared');
 const second=owner.apply(base,overrides);
 assert.deepEqual(second,changed,'Reindexing the same source snapshot is deterministic');
 assert.equal(JSON.stringify(base),original);
});

test('separate town overlays cannot contaminate one another through the source snapshot',()=>{
 const base=townBase(),original=JSON.stringify(base);
 const location=owner.apply(base,{
  'wikiedit.map.astir-union':JSON.stringify({name:'Союз — новая подпись'})});
 const resident=owner.apply(base,{
  'wikiedit.npc.astir-npc-union-guide':JSON.stringify({name:'Новый проводник'})});
 assert.equal(location.townMaps['astir-union'].name,'Союз — новая подпись');
 assert.equal(resident.townMaps['astir-union'].name,'Территория Союза');
 assert.equal(resident.townNpcs['astir-npc-union-guide'].name,'Новый проводник');
 assert.equal(location.townNpcs['astir-npc-union-guide'].name,'Проводник');
 assert.equal(JSON.stringify(base),original);
});

test('new owner NPC always names a genuine selected location, legacy Astir NPC patches stay editable',()=>{
 assert.equal(owner.validTownPatch('npc',ownedNpc,ownerNpcPatch),true);
 assert.equal(owner.validTownPatch('npc',ownedNpc,{
  name:'Мастер зелий',nameEn:'Potion master'}),false);
 assert.equal(owner.validTownPatch('npc',ownedNpc,{
  ...ownerNpcPatch,maps:['astir-unrecognized']}),false);
 assert.equal(owner.validTownPatch('npc','astir-npc-kingdom-claris',
  {name:'Кларис'}),true,'Existing Astir NPCs may still have partial patches');
 const changed=owner.apply(townBase(),{
  ['wikiedit.npc.'+ownedNpc]:JSON.stringify({
   name:'Мастер зелий',nameEn:'Potion master'
  })});
 assert.equal(changed.townNpcs[ownedNpc],undefined,
  'Never fabricate a location from an owner NPC random identifier');
});

test('NPC recipe records reject repeated material IDs rather than counting one item twice',()=>{
 const items={'10':{},'20':{}},npcs={'7':{}};
 const rec={id:50,i:20,npc:[7],mats:[{i:10,n:1},{i:10,n:2}],
  gold:0,honor:0,exp:0};
 assert.equal(recipes.recipeValid(rec,items,npcs),false);
 const base={trades:[],npcs};
 assert.strictEqual(recipes.apply(base,items,{
  'tradeedit.50':JSON.stringify({recipe:rec})}),base);
 assert.equal(recipes.recipeValid({...rec,mats:[{i:10,n:3}]},items,npcs),true);
});

test('Cloudflare Worker mirrors new NPC location and trade material validation',async()=>{
 const written=new Map();
 const DB={prepare(sql){
  let args=[];
  return {bind(...values){args=values;return this},
   first:async()=>({id:1}),
   run:async()=>{
    if(sql.includes('INSERT INTO overrides'))written.set(args[0],args[1]);
    if(sql.includes('DELETE FROM overrides'))written.delete(args[0]);
    return {meta:{changes:1}};
   }};
 }};
 const request=(key,data)=>worker.fetch(new Request(
  'https://ps-build-studio-cloud.bonaqu.workers.dev/api/admin/override',{
   method:'POST',
   headers:{Origin:'https://bonaqu.github.io',
    Authorization:'Bearer '+'a'.repeat(43)},
   body:JSON.stringify({key,value:JSON.stringify(data)})
  }),{DB});
 const badNpc={name:'Мастер зелий',nameEn:'Potion master'};
 const invalidRecipe={recipe:{
  id:50,i:20,npc:[7],mats:[{i:10,n:1},{i:10,n:2}],gold:0,honor:0,exp:0}};
 for(const [key,value] of [
  ['wikiedit.npc.'+ownedNpc,badNpc],
  ['tradeedit.50',invalidRecipe]
 ]){
  const response=await request(key,value);
  assert.equal(response.status,400,key+': '+await response.text());
  assert.equal(written.has(key),false);
 }
 for(const [key,value] of [
  ['wikiedit.npc.'+ownedNpc,ownerNpcPatch],
  ['tradeedit.50',{recipe:{
   ...invalidRecipe.recipe,mats:[{i:10,n:3}]}}]
 ]){
  const response=await request(key,value);
  assert.equal(response.status,200,key+': '+await response.text());
  assert.equal(written.has(key),true);
 }
});

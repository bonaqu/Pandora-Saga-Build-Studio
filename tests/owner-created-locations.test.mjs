import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import realWorker from '../worker/index.js';
import {withOwnerCasTestClient} from './helpers/owner-cas-compat.mjs';
const worker=withOwnerCasTestClient(realWorker);
import {previewOwnerOverrides} from '../worker/pandora-studio-github-catalog-pr.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};
for(const path of ['pandora-studio-wiki-owner-data.js','pandora-studio-encyclopedia-data.js'])
 Function('window',read(path))(host);
const owner=host.PandoraWikiOwnerData;
const index=host.PandoraWikiData;
const customId='custom-ab12cd34ef56';
const extras=[
 {id:'section-pvp',titleRu:'Арена',titleEn:'Arena',kind:'monster',entries:[21231]},
 {id:'section-history',titleRu:'История',titleEn:'History',kind:'text',
  entries:[],textRu:'Историческая заметка',textEn:'Historical notes'}
];
const patch={name:'Новая PvP-локация',nameEn:'New PvP location',
 desc:'Описание локации',descEn:'Location description',
 notesRu:'Заметка',notesEn:'Note',mobs:[21231],npcs:[131],loot:[100],
 tags:[{ru:'Государство',en:'Nation'}],
 sections:['monsters','npcs','loot','tags','custom'],extraSections:extras};
test('owner map allows typed bilingual sections, tags and source links; rejects bad data',()=>{
 assert.equal(owner.customMapId(customId),true);
 assert.equal(owner.validTownPatch('map',customId,patch),true);
 assert.equal(owner.validPatch('map',{tags:patch.tags,sections:patch.sections}),true);
 for(const invalid of [
  {...patch,nameEn:''},
  {...patch,loot:[100,100]},
  {...patch,npcs:['javascript:alert(1)']},
  {...patch,tags:[{ru:'Государство'}]},
  {...patch,notesEn:42},
  {...patch,sections:['monsters','monsters']},
  {...patch,extraSections:[{...extras[0],kind:'javascript'}]},
  {...patch,extraSections:[{...extras[0],entries:[21231,21231]}]},
  {...patch,unexpected:'unsafe'}
 ])assert.equal(owner.validTownPatch('map',customId,invalid),false,JSON.stringify(invalid).slice(0,150));
 assert.equal(owner.validTownPatch('map','custom-../../admin',patch),false);
 assert.equal(owner.validTownPatch('map','astir-union',{mobs:[21231]}),true);
});
test('custom D1 map uses the same canonical location record and NPC reverse index',()=>{
 const base={maps:{'el-beht':{name:'Эль Ведд',mobs:[21231],virtual:true}},
 monsters:{'21231':{id:21231,name:'Кровавый ящер',level:41}},
 items:{'100':{id:100,name:'Предмет'}},
 trades:{npcs:{'131':{id:131,name:'NPC',maps:[]}},trades:[],mapNames:{}},
 drops:{},tables:{zoneDrops:[]},chests:{boxes:[],npc:[]},
 instances:[],skills:{},souls:{}};
 const copy=JSON.stringify(base);
 const next=owner.apply(base,{['wikiedit.map.'+customId]:JSON.stringify(patch)});
 assert.equal(next.maps[customId].name,patch.name);
 assert.equal(next.maps[customId].nameEn,patch.nameEn);
 assert.equal(next.maps[customId].ownerCreated,true);
 assert.deepEqual(next.maps[customId].tags,patch.tags);
 assert.equal(next.maps[customId].notesEn,'Note');
 assert.equal(JSON.stringify(base),copy,'The canonical imported OS dataset must not change');
 const graph=index.build(next);
 assert.ok(graph.records('map')[customId]);
 assert.ok(graph.locations(21231).some(x=>String(x.id)===customId));
 assert.ok(graph.residents(customId).some(([id])=>String(id)==='131'));
});
test('authenticated Worker persists custom maps and rejects invalid fields and anonymous writes',async()=>{
 const values=new Map();
 const DB={prepare(sql){
  const args=[];
  return {bind(...input){args.push(...input);return this},
   first:async()=>({id:1}),
   run:async()=>{
    if(sql.includes('INSERT INTO overrides'))values.set(args[0],args[1]);
    if(sql.includes('DELETE FROM overrides'))values.delete(args[0]);
    return {meta:{changes:1}};
   }};
 }};
 const key='wikiedit.map.'+customId;
 const request=(path,body,authorized=true)=>worker.fetch(new Request(
  'https://ps-build-studio-cloud.bonaqu.workers.dev'+path,{
   method:'POST',headers:{Origin:'https://bonaqu.github.io',
    ...(authorized?{Authorization:'Bearer '+'a'.repeat(43)}:{})},
   body:JSON.stringify(body)
  }),{DB});
 const value=JSON.stringify(patch);
 let response=await request('/api/admin/override',{key,value});
 assert.equal(response.status,200,key+' '+await response.text());
 assert.equal(values.get(key),value);
 response=await request('/api/admin/override',{key,value},false);
 assert.equal(response.status,401);
 response=await request('/api/admin/override',{key,value:JSON.stringify({...patch,sections:['eval']})});
 assert.equal(response.status,400);
 response=await request('/api/admin/reset',{key});
 assert.equal(response.status,200);
 assert.equal(values.has(key),false);
});
test('reviewed owner export includes custom location records, never accounts',async()=>{
 const data=[
 {key:'wikiedit.map.'+customId,value:JSON.stringify(patch)},
 {key:'guideedit.honor.overview',value:JSON.stringify({overviewRu:'Честь'})},
 {key:'user.password',value:'secret'},
 {key:'wikiedit.map.custom-../../unsafe',value:JSON.stringify(patch)}
 ];
 const result=await previewOwnerOverrides({DB:{prepare(){
  return {all:async()=>({results:data})};
 }}});
 assert.equal(result.count,2);
});
test('Hero Book preserves mounted scrolling pane and keeps Honor controls compact',()=>{
 const hero=read('pandora-studio-hero-book.js');
 const app=read('pandora-studio-app.js');
 const honor=read('pandora-studio-honor-view.js');
 assert.match(hero,/const reusePanel=stablePanel\?\.dataset\.bookVisible===page/);
 assert.match(hero,/stablePanel\.replaceChildren\(\.\.\.body\.childNodes\)/);
 assert.doesNotMatch(hero,/stage-book-honor-link/);
 assert.match(hero,/stage-honor-term/);
 assert.match(app,/wiki-map-create-form/);
 assert.match(app,/wiki-map-section-switches/);
 assert.match(app,/wiki-map-notes/);
 assert.match(app,/wiki-map-extra-section/);
 assert.match(honor,/wiki-honor-nav-link/);
 assert.match(honor,/wiki-honor-rank-filters/);
 assert.doesNotMatch(honor,/wiki-honor-toc/);
});

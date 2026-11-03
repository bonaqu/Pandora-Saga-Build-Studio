import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from '../worker/index.js';
import {previewOwnerOverrides} from '../worker/pandora-studio-github-catalog-pr.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};
for(const path of ['pandora-studio-wiki-owner-data.js','pandora-studio-encyclopedia-data.js'])
 Function('window',read(path))(host);
const owner=host.PandoraWikiOwnerData;
const npcId='owner-npc-0123456789abcdef';
const npc={name:'Мастер арены Алиса',nameEn:'Arena Master Alice',maps:['el-beht'],
 service:'Арена',serviceEn:'Arena'};
const base={items:{},maps:{'el-beht':{name:'Эль Ведд',virtual:true,mobs:[],npcs:[]}},
 monsters:{},souls:{},skills:{},instances:[],drops:{},chests:{boxes:[],npc:[]},
 tables:{zoneDrops:[]},trades:{npcs:{},trades:[],mapNames:{}}};

test('owner-created NPC belongs to a confirmed map and is indexed without a fake OS ID',()=>{
 assert.equal(owner.ownerNpcId(npcId),true);
 assert.equal(owner.validTownPatch('npc',npcId,npc),true);
 assert.equal(owner.validMapExtra('npcs',[npcId]),true);
 assert.equal(owner.validMapExtra('extraSections',[{id:'section-guest',titleRu:'NPC',
  titleEn:'NPCs',kind:'npc',entries:[npcId]}]),true);
 const result=owner.apply(base,{['wikiedit.npc.'+npcId]:JSON.stringify(npc)});
 assert.equal(result.townNpcs[npcId].ownerCreated,true);
 assert.equal(result.townNpcs[npcId].maps[0],'el-beht');
 assert.equal(base.townNpcs,undefined,'OS snapshot remains unchanged');
 const wiki=host.PandoraWikiData.build(result);
 assert.equal(wiki.records('npc')[npcId].name,'Мастер арены Алиса');
 assert.ok(wiki.search('npc','Мастер арены').some(([id])=>id===npcId));
 assert.ok(wiki.residents('el-beht').some(([id])=>id===npcId));
});
test('reject invalid NPC identifiers, missing names, or nonexistent map reference forms',()=>{
 for(const [id,patch] of [
  ['owner-npc-123',npc],[npcId,{...npc,nameEn:''}],
  [npcId,{...npc,name:9}],[npcId,{...npc,maps:['../../../admin']}],
  [npcId,{...npc,maps:[100]}],[npcId,{...npc,grid:42}],
  [npcId,{...npc,extra:'illegal'}]
 ])assert.equal(owner.validTownPatch('npc',id,patch),false,id);
 assert.equal(owner.validMapExtra('npcs',[npcId,npcId]),false);
 assert.equal(owner.validMapExtra('npcs',['../bad']),false);
});
test('editable chapter fields include bilingual names, descriptions and safe optional fields',()=>{
 assert.equal(owner.validPatch('skill',{nameEn:'Skill',descEn:'Help',mana:1}),true);
 assert.equal(owner.validPatch('soul',{nameEn:'Soul',descEn:'Description',price:0}),true);
 assert.equal(owner.validPatch('instance',{nameEn:'Dungeon',blurb:'Description'}),true);
 assert.equal(owner.validPatch('npc',{service:'Arena',grid:'12, 34'}),true);
 assert.equal(owner.validPatch('monster',{nameEn:'Lizard'}),true);
 assert.equal(owner.validPatch('skill',{nameEn:''}),false);
});
test('Worker accepts authenticated NPC edits and rejects malicious/invalid payloads',async()=>{
 const rows=new Map();
 const DB={prepare(sql){
  let args=[];
  return {bind(...v){args=v;return this},first:async()=>({id:1}),
   run:async()=>{
    if(sql.includes('INSERT INTO overrides'))rows.set(args[0],args[1]);
    if(sql.includes('DELETE FROM overrides'))rows.delete(args[0]);
    return {meta:{changes:1}};
   }};
 }};
 const send=async(path,key,value,authorized=true)=>{
  const response=await worker.fetch(new Request(
   'https://ps-build-studio-cloud.bonaqu.workers.dev'+path,{
    method:'POST',headers:{Origin:'https://bonaqu.github.io',
     ...(authorized?{Authorization:'Bearer '+'a'.repeat(43)}:{})},
    body:JSON.stringify(path.endsWith('reset')?{key}:
     {key,value:JSON.stringify(value)})}),{DB});
  return response;
 };
 const key='wikiedit.npc.'+npcId;
 assert.equal((await send('/api/admin/override',key,npc,false)).status,401);
 assert.equal((await send('/api/admin/override',key,npc)).status,200);
 assert.equal(JSON.parse(rows.get(key)).name,npc.name);
 assert.equal((await send('/api/admin/override',key,{...npc,nameEn:''})).status,400);
 assert.equal((await send('/api/admin/override',key,{...npc,maps:['../bad']})).status,400);
 assert.equal((await send('/api/admin/override',key,{...npc,name:9})).status,400);
 assert.equal((await send('/api/admin/override','wikiedit.map.el-beht',
  {npcs:[npcId]})).status,200);
 assert.equal((await send('/api/admin/override','wikiedit.skill.77',
  {nameEn:'Valid skill'})).status,200);
 assert.equal((await send('/api/admin/override','wikiedit.instance.9',
  {blurb:'English dungeon description'})).status,200);
 assert.equal((await send('/api/admin/override','wikiedit.soul.42',
  {descEn:'Soul description'})).status,200);
 assert.equal((await send('/api/admin/reset',key,{},false)).status,401);
 assert.equal((await send('/api/admin/reset',key,{})).status,200);
 assert.equal(rows.has(key),false);
});
test('owner-reviewed GitHub export includes only owner data, not secrets',async()=>{
 const rows=[{key:'wikiedit.npc.'+npcId,value:JSON.stringify(npc)},
  {key:'wikiedit.map.el-beht',value:JSON.stringify({npcs:[npcId]})},
  {key:'account.password',value:'secret'}];
 const review=await previewOwnerOverrides({DB:{prepare(){return{
  all:async()=>({results:rows})
 }}}});
 assert.equal(review.count,2);
});
test('admin UI explains autosave semantics and every encyclopedia type offers edit affordances',()=>{
 const app=read('pandora-studio-app.js'),theme=read('pandora-studio-theme.css'),
  ownerCss=read('pandora-studio-item-owner-editor.css');
 assert.match(app,/Сохраняю в Cloudflare D1/);
 assert.match(app,/Сохранено в Cloudflare D1/);
 assert.match(app,/записей/);
 assert.match(app,/За этот сеанс/);
 assert.match(app,/owner-workflow-guide/);
 assert.match(app,/Отдельной кнопки сохранения нет/);
 assert.match(app,/PR правок/);
 assert.match(app,/wiki-map-create-npc/);
 assert.match(app,/wiki-skill-add-field/);
 assert.match(app,/wiki-owner-delete-record/);
 assert.match(app,/wiki-owner-instruction/);
 assert.match(app,/Сохранение в Cloudflare D1|Cloudflare D1/);
 assert.doesNotMatch(app,/Подтверждённых сведений о NPC пока нет/);
 assert.match(ownerCss,/wiki-page h3\[data-owner-record\]>.wiki-owner-plaintext/);
 assert.match(ownerCss,/white-space:pre-wrap;overflow:visible/);
 assert.match(ownerCss,/owner-dock-save-state\[data-state="error"\]/);
});

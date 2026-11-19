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

test('41 monster labels are bilingual D1 overlays with isolated OS stats and loot',()=>{
 const app=read('pandora-studio-app.js');
 const block=app.slice(app.indexOf('const wikiMonsterRows='),app.indexOf('const wikiNpcTradeRows='));
 const entries=[...block.matchAll(/^ \["([^"]+)","([^"]+)","([^"]+)"\],?$/gm)];
 assert.equal(entries.length,41);
 assert.equal(new Set(entries.map(row=>row[1])).size,41);
 const langEnv={window:{}};
 Function('window',read('pandora-studio-honor-guide.js'))(langEnv.window);
 for(const [key,ru,en]of [
  ['statLevel','Уровень','Level'],['resistCold','Лёд','Ice'],
  ['loot','Выпадающие предметы','Dropped items'],
  ['confirmRemove','Подтвердить удаление','Confirm removal']
 ]){
  const canonical='wiki.monster.text.'+key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
  const stored={['guideedit.book.'+canonical]:JSON.stringify({ru:'Авторская подпись',en:'Custom label'})};
  const guide=langEnv.window.PandoraHonorGuide;
  assert.equal(guide.field(stored,canonical,ru,en).ru,'Авторская подпись');
  assert.equal(guide.field(stored,canonical,ru,en).en,'Custom label');
  assert.equal(guide.field({},canonical,ru,en).ru,ru);
 }
 const drops=JSON.parse(read('data/os/drops.json'))['11101'];
 assert.equal(drops.d.length,8);
 const saved=JSON.stringify(drops);
 const edits={'guideedit.book.wiki.monster.text.loot':JSON.stringify({ru:'Трофеи',en:'Loot'})};
 const unchanged=win.PandoraWikiOwnerData.apply({
  monsters:{'11101':{id:11101,name:'Койот'}},drops:{'11101':drops},
  items:{},maps:{},instances:[],tables:{},trades:{npcs:{},trades:[]},
  chests:{},souls:{},skills:{}
 },edits);
 assert.equal(JSON.stringify(unchanged.drops['11101']),saved);
 assert.match(app,/ownerInterfaceEditor\(\s*'wiki\.monster\.text',wikiMonsterRows/);
 assert.match(app,/monsterBind\(list\.querySelector\('h4'\),kind==='map'\?'spawnMaps':'spawnDungeons'\)/);
 assert.match(app,/remove\.addEventListener\('blur',resetRemove\)/);
 assert.match(app,/e\.key==='Escape'\)\{e\.preventDefault\(\);e\.stopPropagation\(\);resetRemove\(\)\}/);
 assert.match(app,/remove\.disabled=true;\s*const all=dropRows\(\)/);
});

test('map and dungeon captions use the shared bilingual D1 owner editor',()=>{
 const app=read('pandora-studio-app.js');
 const block=app.slice(app.indexOf('const wikiMapRows='),app.indexOf('const wikiMonsterRows='));
 const captions=[...block.matchAll(/^ \["([^"]+)","([^"]+)","([^"]+)"\],?$/gm)];
 assert.equal(captions.length,45);
 assert.equal(new Set(captions.map(row=>row[1])).size,45);
 const win={};Function('window',read('pandora-studio-honor-guide.js'))(win);
 for(const [,key,ru,en]of captions){
  const path='wiki.map.text.'+key.replace(/[A-Z]/g,x=>'-'+x.toLowerCase());
  const patch={['guideedit.book.'+path]:JSON.stringify({ru:'Новое',en:'Updated'})};
  assert.equal(win.PandoraHonorGuide.field(patch,path,ru,en).ru,'Новое');
  assert.equal(win.PandoraHonorGuide.field(patch,path,ru,en).en,'Updated');
 }
 assert.match(app,/ownerInterfaceEditor\(\s*'wiki\.map\.text',wikiMapRows/);
 assert.match(app,/mapBind\(h\('span'\),'chanceUnknown'\)/);
 assert.match(app,/text:description\|\|mapCopy\('descriptionHint'\)/);
 assert.match(app,/mapBind\(paragraph,'descriptionHint'\)/);
 assert.match(app,/mapBind\(monsterRelations\.querySelector\('h4'\)/);
 assert.match(app,/mapBind\(npcRelations\.querySelector\('h4'\),'npcs'\)/);
 assert.match(app,/mapBind\(lootRelations\.querySelector\('h4'\),'loot'\)/);
});
test('tag and section deletion needs explicit second click, Escape cancels, CAS failure disarms',async()=>{
 const app=read('pandora-studio-app.js');
 const body=app.slice(app.indexOf('function confirmWikiOwnerRemoval('),app.indexOf('const wikiMonsterRows='));
 const warnings=[];
 const attach=Function('showStudioToast',body+'return confirmWikiOwnerRemoval;')(
  (...values)=>warnings.push(values));
 function button(){
  const attrs={},listeners={};
  return {dataset:{},disabled:false,textContent:'×',listeners,
   addEventListener(type,fn){listeners[type]=fn},
   setAttribute(name,value){attrs[name]=value},
   getAttribute(name){return attrs[name]}
  };
 }
 let count=0;
 const tag=button();
 attach(tag,{label:'Delete tag',confirm:'Confirm',action:()=>{count++}});
 tag.onclick();assert.equal(count,0);
 tag.listeners.blur();assert.equal(tag.dataset.confirm,undefined);
 tag.onclick();
 const escape={key:'Escape',stop:false,preventDefault(){},stopPropagation(){this.stop=true}};
 tag.listeners.keydown(escape);assert.equal(escape.stop,true);
 tag.onclick();tag.onclick();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(count,1);assert.equal(tag.disabled,false);
 const section=button();
 attach(section,{label:'Remove',confirm:'Confirm',action:()=>Promise.reject(Error('CAS conflict'))});
 section.onclick();section.onclick();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(section.dataset.confirm,undefined);
 assert.equal(section.disabled,false);
 assert.deepEqual(warnings,[['CAS conflict','warning']]);
 assert.match(app,/wiki-map-section-delete/);
});

test('map list snapshots reject stale owner writes and preserve canonical field values',()=>{
 const app=read('pandora-studio-app.js');
 const begin=app.indexOf('function wikiMapListEqual(');
 const end=app.indexOf('async function saveWikiRecordField(',begin);
 assert.ok(begin>=0&&end>begin);
 const snippet=app.slice(begin,end);
 const record={tags:[{ru:'Старый',en:'Old'}],sections:['monsters']};
 const edits=[];
 const helpers=Function('wikiIndex','saveWikiRecordPatch','wt',snippet+
  ';return {same:wikiMapListEqual,save:saveWikiMapList}')(
  {records:()=>({somewhere:record})},
  (type,id,build)=>{assert.equal(type,'map');edits.push(build({}));return Promise.resolve()},
  (ru,en)=>ru);
 assert.equal(helpers.same([{ru:'A',en:'B'}],[{en:'B',ru:'A'}]),true);
 assert.equal(helpers.same(['a','b'],['b','a']),false);
 assert.equal(helpers.same([{ru:'A'}],[{ru:'B'}]),false);
 const before=[{ru:'Старый',en:'Old'}];
 helpers.save('somewhere','tags',before,[...before,{ru:'Новый',en:'New'}]);
 assert.deepEqual(edits[0].tags.at(-1),{ru:'Новый',en:'New'});
 record.tags=[...before,{ru:'Из другой формы',en:'Another form'}];
 assert.throws(()=>helpers.save('somewhere','tags',before,[]),/Список уже изменён/);
 assert.equal(edits.length,1,'Stale form never starts another D1 write');
 assert.throws(()=>helpers.save('somewhere','unsupported',[],[]),/Unsupported map list/);
 helpers.save('somewhere','sections',['monsters'],['monsters','notes']);
 assert.deepEqual(edits.at(-1),{sections:['monsters','notes']});
});
test('map editor supports bounded tags/sections and hides empty owner prompt from guests',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/if\(ownerMap&&tags\.length<16\)/);
 assert.match(app,/tags\.some\(duplicate\)/);
 assert.match(app,/submit\.disabled=true;message\.textContent=''/);
 assert.match(app,/if\(note\|\|ownerMap\)/);
 assert.match(app,/if\(!note\)mapBind\(text,'sectionEmpty'\)/);
 assert.match(app,/mapBind\(\s*h\('small',\{class:'wiki-map-limit',role:'status'\}\),'tagLimit'\)/);
 assert.match(app,/if\(ownerMap&&custom\.length<12\)/);
 assert.match(app,/saveWikiMapList\(id,'extraSections',custom/);
 assert.match(app,/saveWikiMapList\(id,'loot',loot/);
 assert.match(app,/saveWikiMapList\(id,'npcs',rec\.npcs\|\|\[\]/);
 assert.equal(owner.validMapExtra('tags',Array.from({length:16},(_,i)=>({ru:'Тег'+i,en:'Tag'+i}))),true);
 assert.equal(owner.validMapExtra('tags',Array.from({length:17},(_,i)=>({ru:'Тег'+i,en:'Tag'+i}))),false);
 assert.equal(owner.validMapExtra('extraSections',Array.from({length:13},(_,i)=>({
  id:'section-'+i,titleRu:'Раздел '+i,titleEn:'Section '+i,kind:'text',entries:[]
 }))),false);
});

test('new Astir NPCs and future-map NPCs share canonical bilingual owner IDs without rewriting legacy town NPCs',()=>{
 const npcId='owner-npc-0011223344556677';
 const row={name:'Тестовый торговец',nameEn:'Test vendor',
  service:'Проверка',maps:['astir-kingdom']};
 for(const place of ['astir-kingdom','astir-union','astir-empire','el-beht','custom-example1']){
  assert.equal(owner.virtualMapId(place),true);
  assert.equal(owner.validTownPatch('npc',npcId,{...row,maps:[place]}),true);
 }
 assert.equal(owner.validTownPatch('npc',npcId,{...row,nameEn:''}),false);
 assert.equal(owner.validTownPatch('npc',npcId,{...row,maps:[]}),false);
 assert.equal(owner.validTownPatch('npc',npcId,{...row,maps:['astir-kingdom','el-beht']}),false);
 assert.equal(owner.validTownPatch('npc',npcId,{...row,maps:['1003001']}),false);
 const original={maps:{},townNpcs:{},trades:{npcs:{}}};
 const merged=owner.apply(original,{['wikiedit.npc.'+npcId]:JSON.stringify(row)});
 assert.equal(original.townNpcs[npcId],undefined);
 assert.equal(merged.townNpcs[npcId].nameEn,'Test vendor');
 assert.deepEqual(merged.townNpcs[npcId].maps,['astir-kingdom']);
 assert.equal(merged.townNpcs[npcId].ownerCreated,true);
 const legacyId='astir-npc-kingdom-custom-1';
 assert.equal(owner.validTownPatch('npc',legacyId,{name:'Исторический',maps:['astir-kingdom']}),true);
 const legacy=owner.apply(original,{['wikiedit.npc.'+legacyId]:
  JSON.stringify({name:'Исторический',maps:['astir-kingdom']})});
 assert.equal(legacy.townNpcs[legacyId].name,'Исторический');
 assert.equal(legacy.townNpcs[legacyId].ownerCreated,true);
 assert.equal(owner.curatedNpcId(legacyId),true);
 assert.equal(owner.curatedNpcId(npcId),true);
 assert.equal(owner.curatedNpcId('astir-npc-kingdom-claris'),false);
 assert.equal(owner.curatedNpcId('astir-npc-kingdom-custom-x'),false);
 assert.equal(owner.curatedNpcId('astir-npc-empire-other'),false);
 const verified=owner.apply({maps:{},townNpcs:{
  'astir-npc-kingdom-claris':{name:'Кларис',maps:['astir-kingdom']}
 },trades:{npcs:{}}},{'wikiedit.npc.astir-npc-kingdom-claris':
  JSON.stringify({name:'Кларис',maps:['astir-kingdom']})});
 assert.equal(verified.townNpcs['astir-npc-kingdom-claris'].ownerCreated,false,
  'Known catalog NPC must never become owner deletable');
});

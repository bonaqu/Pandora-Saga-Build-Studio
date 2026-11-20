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

test('52 monster labels are bilingual D1 overlays with isolated OS stats and loot',()=>{
 const app=read('pandora-studio-app.js');
 const block=app.slice(app.indexOf('const wikiMonsterRows='),app.indexOf('const wikiNpcTradeRows='));
 const entries=[...block.matchAll(/^ \["([^"]+)","([^"]+)","([^"]+)"\],?$/gm)];
 assert.equal(entries.length,52);
 assert.equal(new Set(entries.map(row=>row[1])).size,entries.length,
  'Every owner-editable label has a distinct semantic key');
 const langEnv={window:{}};
 Function('window',read('pandora-studio-honor-guide.js'))(langEnv.window);
 for(const [key,ru,en]of [
  ['statLevel','Уровень','Level'],['resistCold','Лёд','Ice'],
  ['loot','Выпадающие предметы','Dropped items'],
  ['confirmRemove','Подтвердить удаление','Confirm removal'],
  ['createLinkFailure','Монстр создан, но связь с локацией не сохранилась. Открой локацию и выбери существующую карточку монстра.','Monster card created, but its location link was not saved. Open the location and select the existing monster card.']
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
 assert.equal(captions.length,54);
 assert.equal(new Set(captions.map(row=>row[1])).size,captions.length);
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
test('skill requirements, Soul slots, curated loot and NPC locations reject stale list writes',()=>{
 const app=read('pandora-studio-app.js');
 const start=app.indexOf('function wikiMapListEqual(');
 const end=app.indexOf('async function saveWikiRecordField(',start);
 const snippet=app.slice(start,end);
 const current={
  skill:{somewhere:{reqs:[{branch:'martial',amount:5}]}},
  soul:{somewhere:{slots:['weapon']}},
  monster:{somewhere:{loot:[100]}},
  npc:{somewhere:{maps:[1001004]}},
  instance:{somewhere:{mobs:[110]}},
  map:{somewhere:{reportedSpawns:[{id:'spawn1',monsterId:110}],mobs:[110]}}
 };
 const writes=[];
 const actions=Function('wikiIndex','saveWikiRecordPatch','wt',snippet+
  ';return {save:saveWikiRecordList,mobs:saveWikiMapMonsterList}')(
  {records:type=>current[type]},
  (type,id,build)=>{
   const patch=build({});writes.push({type,patch});
   Object.assign(current[type][id],patch);return Promise.resolve();
  },(ru,en)=>ru);
 const fields=[['skill','reqs',[{branch:'martial',amount:5}],
  [{branch:'martial',amount:6}]],
  ['soul','slots',['weapon'],['weapon','head']],
  ['monster','loot',[100],[100,200]],
  ['npc','maps',[1001004],[1001004,'astir-kingdom']],
  ['instance','mobs',[110],[110,111]]];
 for(const [type,field,expected,next] of fields){
  actions.save(type,'somewhere',field,expected,next);
  assert.deepEqual(current[type].somewhere[field],next,type+'.'+field);
  assert.throws(()=>actions.save(type,'somewhere',field,expected,[]),
   /Список уже изменён/,type+'.'+field+' must reject a stale field');
 }
 assert.deepEqual(current.npc.somewhere.maps,[1001004,'astir-kingdom'],
  'Curated location IDs stay strings, real game map IDs stay numeric');
 actions.save('map','somewhere','roster',[{id:'spawn1',monsterId:110}],
  [{id:'spawn1',monsterId:null}]);
 assert.equal(current.map.somewhere.roster[0].monsterId,null);
 assert.throws(()=>actions.save('map','somewhere','roster',
  [{id:'spawn1',monsterId:110}],[]),/Список уже изменён/);
 assert.throws(()=>actions.save('skill','somewhere','desc',[],[]),/Unsupported owner list/);
 current.map.somewhere.roster=[{id:'spawn1',monsterId:110}];
 actions.mobs('somewhere',[110],[]);
 assert.deepEqual(current.map.somewhere.mobs,[]);
 assert.equal(current.map.somewhere.roster[0].monsterId,null,
  'One D1 patch must unlink removed monster in curator roster');
 const writesBefore=writes.length;
 assert.throws(()=>actions.mobs('somewhere',[110],[110,111]),/Список уже изменён/);
 assert.equal(writes.length,writesBefore);
 assert.match(app,/saveWikiRecordList\('skill',id,'reqs'/);
 assert.match(app,/saveWikiRecordList\('soul',id,'slots'/);
 assert.match(app,/saveWikiRecordList\('monster',id,'loot'/);
 assert.match(app,/saveWikiRecordList\('npc',id,'maps'/);
 assert.match(app,/saveWikiMapMonsterList\(locationId,existing,nextMobs\)/);
});

test('reported monster links rebase independent rows but reject stale edits to the same row',async()=>{
 const app=read('pandora-studio-app.js');
 const begin=app.indexOf('const persistRosterLink=async(');
 const end=app.indexOf('const createOwnerMonster=',begin);
 assert.ok(begin>=0&&end>begin);
 const body=app.slice(begin,end);
 const record={roster:[{id:'one',monsterId:null},{id:'two',monsterId:null}],
  mobs:[]};
 const records={map:{'el-beht':record},monster:{m1:{},m2:{},m3:{}}};
 let chain=Promise.resolve(),writes=0;
 const persist=Function('wikiIndex','mapRoster','wt','saveWikiRecordPatch',body+
  ';return persistRosterLink;')(
  {records:type=>records[type]},rec=>rec.roster??rec.reportedSpawns??[],
  (ru,en)=>ru,(type,id,make,options)=>{
   assert.equal(type,'map');assert.equal(id,'el-beht');
   assert.deepEqual(options,{verifyUncertain:true},
    'Map linking must verify D1 state if its CAS receipt is lost');
   const writing=chain.catch(()=>{}).then(()=>{
    const patch=make({});Object.assign(record,patch);writes++;
   });
   chain=writing;return writing;
  });
 await Promise.all([persist('el-beht','one','m1'),persist('el-beht','two','m2')]);
 assert.deepEqual(record.roster.map(row=>row.monsterId),['m1','m2']);
 assert.deepEqual(record.mobs,['m1','m2']);
 assert.equal(writes,2);
 const [first,second]=await Promise.allSettled([
  persist('el-beht','one',null),persist('el-beht','one','m3')
 ]);
 assert.equal(first.status,'fulfilled');
 assert.equal(second.status,'rejected');
 assert.match(second.reason.message,/Связь уже изменена/);
 assert.equal(record.roster[0].monsterId,null);
 assert.deepEqual(record.mobs,['m2'],'Another row stays linked');
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

test('shared owner identity reservation checks collisions before issuing D1 saves',()=>{
 const app=read('pandora-studio-app.js');
 const begin=app.indexOf('const reserveWikiOwnerId=type=>');
 const end=app.indexOf('\n const mapRoster=',begin);
 assert.ok(begin>=0&&end>begin);
 let calls=0;
 const reserve=Function('crypto','wikiIndex','override',
  app.slice(begin,end)+'\nreturn reserveWikiOwnerId;')(
  {getRandomValues:bytes=>{
   bytes.fill(0);bytes[7]=++calls===1?1:calls;return bytes;
  }},
  {records:type=>type==='monster'?{'owner-monster-0000000000000001':{}}:{}},
  {});
 assert.equal(reserve('monster'),'owner-monster-0000000000000002',
  'An already-existing monster identity must not be claimed');
 assert.match(reserve('map'),/^custom-[a-f0-9]{16}$/);
 assert.match(reserve('npc'),/^owner-npc-[a-f0-9]{16}$/);
 assert.equal(reserve('unsupported'),null);
});
test('a failed create POST reuses its ID; a failed follow-up link reveals the already saved card',async()=>{
 const app=read('pandora-studio-app.js');
 const start=app.indexOf(' const createOwnerMonster=(');
 const end=app.indexOf(" if(adminEditing&&adminToken&&wikiSelection.type==='monster')",start);
 assert.ok(start>0&&end>start);
 const buttons=[],fields=[],posts=[],links=[],visited=[],notices=[];
 const h=(tag,attrs={})=>{
  const node={tag,...attrs,disabled:false,
   append(){},remove(){this.removed=true}};
  if(tag==='button')buttons.push(node);
  return node;
 };
 const field=attrs=>{const node={...attrs,value:attrs.value||'',focus(){}};fields.push(node);return node};
 let failFirst=true;
 const factory=Function('h','ownerPlainTextField','monsterBind',
  'ownerInterfaceEditor','wikiMonsterRows','saveWikiRecordPatch',
  'persistRosterLink','openWiki','showStudioToast','reserveWikiOwnerId',
  'monsterCopy','wt','const adminToken="token",adminEditing=true;\n'+
  app.slice(start,end)+'\nreturn createOwnerMonster;');
 const creatorBind=(node,key,attr='text')=>{
  const labels={createMonsterSave:'Сохранить монстра',
   createMonsterCancel:'Отмена',createMonsterNameRuAria:'Название монстра RU',
   createMonsterNameEnAria:'Название монстра EN'};
  if(attr==='text')node.text=labels[key]||key;
  else node[attr]=labels[key]||key;
  return node;
 };
 const create=factory(h,field,creatorBind,()=>null,[],async(type,id,patch)=>{
  posts.push({type,id,patch});
  if(failFirst){failFirst=false;throw Error('Temporary D1 failure')}
 },async(...args)=>{links.push(args);throw Error('Map CAS 409')},
 (...args)=>visited.push(args),(...args)=>notices.push(args),
 ()=> 'owner-monster-0000000000000001',()=> 'Saved without a location link',
 (ru,en)=>ru);
 const trigger={parentElement:{querySelector:()=>null},after(form){this.form=form}};
 create(trigger,{mapId:'el-beht',spawnId:'spawn-a',name:'Солдат',level:33});
 fields.find(f=>f['aria-label']==='Название монстра EN').value='Soldier';
 const save=buttons.find(b=>b.text==='Сохранить монстра');
 assert.ok(save);
 await save.onclick();
 assert.equal(save.disabled,false,'An initial failed POST must remain retryable');
 await save.onclick();
 assert.equal(posts.length,2);
 assert.equal(posts[0].id,posts[1].id,'Retry uses the original D1 key');
 assert.equal(links.length,1,'Map linkage only starts after creation is acknowledged');
 assert.deepEqual(visited,[['monster','owner-monster-0000000000000001']],
  'The saved card remains accessible even after the second write fails');
 assert.deepEqual(notices,[['Saved without a location link','warning']]);
 await save.onclick();
 assert.equal(posts.length,2,'A completed-but-detached form cannot submit duplicates');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import realWorker from '../worker/index.js';
import {withOwnerCasTestClient} from './helpers/owner-cas-compat.mjs';
const worker=withOwnerCasTestClient(realWorker);
import {previewOwnerOverrides} from '../worker/pandora-studio-github-catalog-pr.js';
const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-studio-honor-guide.js'))(host);
Function('window',read('pandora-studio-historic-maps.js'))(host);
Function('window',read('pandora-studio-wiki-owner-data.js'))(host);
const g=host.PandoraHonorGuide,m=host.PandoraHistoricalMaps,owners=host.PandoraWikiOwnerData;
const app=read('pandora-studio-app.js'),book=read('pandora-studio-hero-book.js');
const monsters=JSON.parse(read('data/os/monsters.json'));
test('43 distinct Summary statistics have compact RU/EN descriptions',()=>{
 const hero={};Function('window','document',book)(hero,{documentElement:{lang:'ru'}});
 const rows=hero.PandoraStageAttributes.summaryRows(null).flatMap(x=>x.rows);
 assert.equal(rows.length,43);
 for(const [index,row] of rows.entries()){
  const copy=g.summary({},index,row.ru,row.en);
  assert.ok(Object.hasOwn(g.hints,row.ru),'Missing dedicated RU/EN hint: '+row.ru);
  assert.equal(copy.ru,row.ru);
  assert.equal(copy.en,row.en);
  const maxHint=['Сопр. аном. тел.','Сопр. аном. дух.'].includes(row.ru)?360:160;
  assert.ok(copy.hintRu.length>8&&copy.hintRu.length<=maxHint,row.ru);
  assert.ok(copy.hintEn.length>8&&copy.hintEn.length<=maxHint,row.en);
 }
 assert.match(g.summary({},0,'ОЗ','HP').hintRu,/Очки здоровья/);
 assert.match(g.summary({},1,'Сопр. АТК сзади','Back').hintRu,/в спину/);
});
test('Book copy, honor ranks and list updates validate D1 override schemas',()=>{
 const patch=JSON.stringify({ru:'Здоровье',en:'Health',hintRu:'Очки здоровья.',hintEn:'Health points.'});
 assert.ok(g.validOverride('book.summary.0',patch));
 const changed=g.summary({'guideedit.book.summary.0':patch},0,'ОЗ','HP');
 assert.equal(changed.ru,'Здоровье');
 assert.equal(changed.hintEn,'Health points.');
 for(const [key,value] of [
  ['book.summary.0',JSON.stringify({ru:'Name',ep:'untrusted'})],
  ['book.summary.0',JSON.stringify({ru:'a'.repeat(361)})],
  ['honor.rank.12',JSON.stringify({nameRu:'Invalid'})],
  ['honor.overview',JSON.stringify({currentRu:'',fake:1})],
  ['honor.zones',JSON.stringify([{id:'bad',nameRu:'Зона'}])],
  ['honor.wars',JSON.stringify([{id:'bad',nameRu:'А',nameEn:'B',evil:1}])]
 ])assert.equal(g.validOverride(key,value),false,key);
 assert.ok(g.validOverride('honor.zones','[]'));
 assert.ok(g.validOverride('honor.wars',JSON.stringify([{id:'custom-1',nameRu:'Война',nameEn:'War'}])));
});
test('12 Honor ranks separate Count passives from 3 monthly leaderboards',()=>{
 const article=g.article({});
 assert.equal(article.ranks.length,12);
 const count=article.ranks[7];
 assert.equal(count.nameRu,'Министр');
 assert.equal(count.nameEn,'Count');
 assert.deepEqual([count.points,count.gold],[129000,640000]);
 assert.deepEqual(article.ranks.slice(9).map(x=>x.top),[15,5,1]);
 assert.notEqual(article.ranks[8].nameEn,article.ranks[9].nameEn);
 assert.ok(article.overview.currentRu.includes('Вся честь'));
 assert.equal(article.zones.length,3);
 assert.equal(article.battles.length,2);
 const changed=g.article({'guideedit.honor.rank.7':JSON.stringify({benefitRu:'Новая награда'})});
 assert.equal(changed.ranks[7].benefitRu,'Новая награда');
});
test('Confirmed future El Beht retains 22 spawns with 19 matching current catalog IDs',()=>{
 const historical=m.records(),beht=historical['el-beht'];
 assert.equal(beht.nameEn,'El Beht');
 assert.equal(beht.releaseStage,'future');
 assert.equal(beht.historic,undefined);
 assert.equal(beht.desc,'');
 assert.equal(beht.descEn,'');
 assert.equal(historical['astir-underground'].mobs.length,0);
 assert.equal(beht.reportedSpawns.length,22);
 const confirmed=beht.reportedSpawns.filter(x=>x.monsterId!=null);
 const missing=beht.reportedSpawns.filter(x=>x.monsterId==null);
 assert.equal(confirmed.length,19);assert.equal(missing.length,3);
 for(const row of confirmed){
  const mob=monsters[String(row.monsterId)];
  assert.ok(mob,row.monsterId+' missing');
  assert.equal(mob.name,row.name,row.name);
  assert.equal(mob.level,row.level,row.name);
 }
 assert.ok(missing.some(x=>x.level===60&&x.name==='Ящер-рыцарь'));
 assert.equal(beht.reportedSpawns.find(x=>x.name==='Ящер-вожак').spawn,'anywhere');
 assert.equal(beht.reportedSpawns.find(x=>x.name==='Ящер-стражник').spawn,'boss-guard');
});
test('Owner historical maps D1 patches do not alter game source records',()=>{
 const base={maps:m.records(),monsters};
 const patch={name:'Новая локация',nameEn:'New map',mobs:[21231,21232]};
 assert.ok(owners.validTownPatch('map','el-beht',patch));
 const edited=owners.apply(base,{'wikiedit.map.el-beht':JSON.stringify(patch)});
 assert.equal(edited.maps['el-beht'].name,'Новая локация');
 assert.deepEqual(edited.maps['el-beht'].mobs,[21231,21232]);
 assert.equal(base.maps['el-beht'].name,'Эль Ведд');
 assert.equal(owners.validTownPatch('map','astir-union',{mobs:[21231]}),true);
 assert.equal(owners.validTownPatch('map','el-beht',{mobs:[21231,21231]}),false);
});
test('authenticated D1 Worker saves and resets Honor copy, lists and historical maps',async()=>{
 const values=new Map();
 const DB={prepare(sql){
  let args=[];
  return {
   bind(...params){args=params;return this},
   first:async()=>({id:1}),
   run:async()=>{
    if(sql.includes('INSERT INTO overrides'))values.set(args[0],args[1]);
    if(sql.includes('DELETE FROM overrides'))values.delete(args[0]);
    return {meta:{changes:1}};
   }
  };
 }};
 const token='a'.repeat(43),origin='https://bonaqu.github.io';
 const invoke=async(path,payload,auth=true)=>{
  const response=await worker.fetch(new Request(
   'https://ps-build-studio-cloud.bonaqu.workers.dev'+path,{
    method:'POST',headers:{Origin:origin,
     ...(auth?{Authorization:'Bearer '+token}:{})},
    body:JSON.stringify(payload)
   }),{DB});
  return response;
 };
 const examples=[
  ['guideedit.book.summary.0',{ru:'Очки здоровья',hintEn:'Total health points.'}],
  ['guideedit.book.buffs.honor',{hintRu:'Пассивное умение Министра.'}],
  ['guideedit.honor.rank.7',{nameRu:'Министр',benefitEn:'Honor passive.'}],
  ['guideedit.honor.overview',{currentRu:'Вся честь используется для рангов.'}],
  ['guideedit.honor.zones',[{id:'elbeht',nameRu:'Эль Ведд',nameEn:'El Beht',mapId:'el-beht'}]],
  ['guideedit.honor.wars',[{id:'lidia',nameRu:'Лидия',nameEn:'Lydia'}]],
  ['wikiedit.map.el-beht',{name:'Эль Ведд',nameEn:'El Beht',mobs:[21231,21205]}],
  ['wikiedit.map.astir-underground',{name:'Подземные руины Астира',mobs:[]}]
 ];
 for(const [key,object] of examples){
  const value=JSON.stringify(object);
  const result=await invoke('/api/admin/override',{key,value});
  assert.equal(result.status,200,key+' '+await result.text());
  assert.equal(values.get(key),value,key+' persisted');
  assert.equal((await invoke('/api/admin/override',{key,value},false)).status,401);
  const reset=await invoke('/api/admin/reset',{key});
  assert.equal(reset.status,200,key+' reset '+await reset.text());
  assert.equal(values.has(key),false,key+' removed');
 }
 for(const [key,object] of [
  ['guideedit.book.summary.0',{ru:'Allowed',onclick:'alert(1)'}],
  ['guideedit.honor.zones',[{id:'x',nameRu:'Only RU'}]],
  ['guideedit.honor.wars',[{id:'x',nameRu:'RU',nameEn:'EN',evil:1}]],
  ['wikiedit.map.el-beht',{mobs:[21231,21231]}],
  ['wikiedit.map.astir-underground',{name:''}],
  ['wikiedit.map.not-a-map',{name:'Fake'}]
 ]){
  const response=await invoke('/api/admin/override',{key,value:JSON.stringify(object)});
  assert.equal(response.status,400,key+' '+await response.text());
 }
});
test('Worker advertises installed guide editing API without exposing admin edits',async()=>{
 const response=await worker.fetch(new Request(
  'https://ps-build-studio-cloud.bonaqu.workers.dev/api/runtime-capabilities'),{DB:{}});
 assert.equal(response.status,200);
 const info=await response.json();
 assert.match(info.codeRelease,/^0\.\d+\.0$/);
 assert.ok(Number(info.codeRelease.split('.')[1])>=351,'Guide editor requires Worker 0.351+');
 for(const capability of ['guideedit','honor-lists','historical-map-wiki'])
  assert.ok(info.ownerEditors.includes(capability),capability);
});
test('owner export includes reviewed Honor/Book text and historical map overrides',async()=>{
 const rows=[
  ['guideedit.book.summary.0',JSON.stringify({ru:'ОЗ'})],
  ['guideedit.honor.overview',JSON.stringify({currentRu:'Вся честь'})],
  ['guideedit.honor.zones',JSON.stringify([{id:'a',nameRu:'A',nameEn:'B'}])],
  ['guideedit.honor.wars',JSON.stringify([{id:'b',nameRu:'B',nameEn:'C'}])],
  ['guideedit.honor.rank.7',JSON.stringify({benefitRu:'Луна'})],
  ['wikiedit.map.el-beht',JSON.stringify({name:'Эль Ведд'})],
  ['wikiedit.map.astir-underground',JSON.stringify({name:'Руины'})],
  ['guideedit.honor.rank.12',JSON.stringify({benefitRu:'Unknown'})],
  ['wikiedit.map.fake-map',JSON.stringify({name:'Unknown'})],
  ['user.password','Never export secrets']
 ].map(([key,value])=>({key,value}));
 const result=await previewOwnerOverrides({DB:{prepare(sql){
  assert.match(sql,/FROM overrides ORDER BY key/);
  return {all:async()=>({results:rows})};
 }}});
 assert.equal(result.count,7,'Only approved copy and maps may enter owner review');
 assert.match(result.fingerprint,/^[a-f0-9]{16}$/);
});
test('Book, encyclopedia, Worker, scripts and styles are connected',()=>{
 const html=read('index.html'),worker=read('worker/index.js'),
  css=read('pandora-studio-honor.css'),hint=read('pandora-studio-honor-guide.js');
 const release=JSON.parse(read('site-version.json')).release;
 for(const file of ['pandora-studio-honor-guide.js','pandora-studio-guide-tooltips.js',
  'pandora-studio-historic-maps.js','pandora-studio-honor-view.js'])
  assert.ok(html.includes(file+'?v='+release),file);
 assert.match(book,/function guideLabel/);
 assert.match(book,/Пассивное восстановление/);
 assert.match(book,/Passive recovery/);
 assert.match(book,/Пассивное умение за честь/);
 assert.ok(hint.includes('defense.hpRecoverySpeed'));
 assert.match(app,/PandoraHistoricalMaps\?\.records/);
 assert.match(app,/saveGuidePatch/);
 assert.match(app,/PandoraHonorView\?\.render/);
 assert.match(app,/wiki-map-roster-actions/);
 assert.doesNotMatch(app,/wiki-historic-roster/);
 assert.match(worker,/function validGuideEdit/);
 assert.match(worker,/guideedit/);
 assert.match(worker,/el-beht/);
 assert.match(css,/\.stage-guide-popup/);
 assert.match(css,/\.wiki-honor-rank/);
});

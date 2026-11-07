import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import realWorker from '../worker/index.js';
import {withOwnerCasTestClient} from './helpers/owner-cas-compat.mjs';
const worker=withOwnerCasTestClient(realWorker);

const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-studio-honor-guide.js'))(host);
const guide=host.PandoraHonorGuide;
const view=read('pandora-studio-honor-view.js');
const app=read('pandora-studio-app.js');
const css=read('pandora-studio-honor.css');

test('Honor displays succinct rank descriptions and three proper monthly title groups',()=>{
 const {ranks,overview,zones,battles}=guide.article({});
 assert.equal(ranks.length,12);
 assert.deepEqual(ranks.slice(9).map(r=>r.nameRu),['Герцог','Кронпринц','Эрцгерцог']);
 assert.deepEqual(ranks.slice(9).map(r=>r.top),[15,5,1]);
 assert.equal(ranks[10].nameEn,'Crown Prince');
 assert.match(ranks[0].requirementRu,/1 000 очков начальной чести/);
 assert.doesNotMatch(overview.overviewRu,/1 000/);
 assert.doesNotMatch(view,/wiki-honor-joining/);
 assert.match(view,/wiki-honor-emblem/);
 assert.match(view,/tr\('Награды','Rewards'\)/);
 assert.match(ranks[8].benefitRu,/Новые предметы в обменнике предметов за честь/);
 assert.equal(overview.totalRu,'Заработанная за всё время честь: определяет ранги и рейтинги.');
 assert.equal(overview.cloaksRu.split(/\n\s*\n/).length,3);
 for(const term of ['Герцог','Кронпринц','Эрцгерцог'])
  assert.match(overview.monthlyNoteRu,new RegExp(term));
 assert.equal(zones.length,3);assert.equal(battles.length,2);
 assert.deepEqual(zones.map(x=>x.nameRu),[
  'Покинутые земли Мальдии','Эль Ведд','Подземные руины Астира']);
 assert.deepEqual(battles.map(x=>x.nameRu),['Лидия','Гихайм']);
 assert.doesNotMatch(view,/Официальная новость|Источники:|ИЗМЕНЕНИЕ ПРАВИЛ|#news\/8/);
 assert.match(view,/wiki-honor-monthly-card/);
 assert.match(css,/\.wiki-honor-monthly-head/);
 assert.match(view,/rank\.requirementRu/);
 assert.doesNotMatch(view,/en\?rank\.nameRu:rank\.nameEn/);
 assert.doesNotMatch(view,/Вторая локаль|Other language/);
 assert.match(view,/if\(isZone\)\{/);
 assert.match(view,/location name still belongs to the Locations chapter/);
 assert.match(view,/linked\?\(en\?linked\.nameEn:linked\.nameRu\):item\[field\]/);
 assert.doesNotMatch(view,/23.10.2026/);
});

test('Honor editor links selected known map in UI and keeps article scroll after saving',()=>{
 assert.match(view,/mapOptions\.find\(entry=>entry\.id===select\.value\)/);
 assert.match(view,/onOpenLocations\(\)/);
 assert.match(view,/mapOptions\.filter/);
 assert.match(view,/names\.append\(anchor\)/);
 assert.match(view,/pane\.scrollTo/);
 assert.doesNotMatch(view,/scrollIntoView/);
 assert.match(app,/wikiRenderSelected\?\.\(\)/);
 assert.match(app,/if\(pane\)pane\.scrollTop=position/);
 assert.match(app,/mapOptions:Object\.entries\(wikiIndex\?\.records\('map'\)\|\|\{\}\)/);
});

test('Guide and Worker allow the same new copy fields and structured rank requirements',async()=>{
 const overview={
  honorRu:'Честь тратится в обменнике.',
  totalRu:'Заработанная честь для ранга.',
  monthlyNoteEn:'Monthly rank renewal condition.'
 };
 const requirement={requirementRu:'Для получения ранга необходимо 3 000 очков ресурса «Вся честь».',
  requirementEn:'Earn 3,000 Total Honor points.'};
 assert.equal(guide.validOverride('honor.overview',JSON.stringify(overview)),true);
 assert.equal(guide.validOverride('honor.rank.2',JSON.stringify(requirement)),true);
 assert.equal(guide.validOverride('honor.zones',JSON.stringify([
  {id:'custom-1',nameRu:'Новая локация',nameEn:'New map',mapId:'custom-test-zone'}
 ])),true);
 assert.equal(guide.validOverride('honor.zones',JSON.stringify([
  {id:'custom-2',nameRu:'Плохая',nameEn:'Bad',mapId:'../secrets'}
 ])),false);
 const values=new Map(),calls=[];
 const DB={prepare(sql){let args=[];
  return{bind(...values){args=values;return this},
   first:async()=>({id:1}),
   run:async()=>{calls.push({sql,args});
    if(sql.includes('INSERT INTO overrides'))values.set(args[0],args[1]);
    return{meta:{changes:1}}}
  };
 }};
 const base='https://ps-build-studio-cloud.bonaqu.workers.dev/api/admin/override';
 for(const [key,patch] of [
  ['guideedit.honor.overview',overview],
  ['guideedit.honor.rank.2',requirement]
 ]){
  const response=await worker.fetch(new Request(base,{
   method:'POST',headers:{
    Origin:'https://bonaqu.github.io',Authorization:'Bearer '+'a'.repeat(43)},
   body:JSON.stringify({key,value:JSON.stringify(patch)})
  }),{DB});
  assert.equal(response.status,200,key+' '+await response.text());
  assert.deepEqual(JSON.parse(values.get(key)),patch);
 }
 assert.equal(calls.length,2);
});

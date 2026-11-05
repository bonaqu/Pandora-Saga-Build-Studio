import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from '../worker/index.js';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-studio-wiki-labels.js'))(host);
Function('window',read('pandora-studio-honor-guide.js'))(host);
const registry=host.PandoraWikiLabels,guide=host.PandoraHonorGuide;
const app=read('pandora-studio-app.js'),view=read('pandora-studio-honor-view.js');

test('editable bilingual labels preserve stable internal chapter and section keys',()=>{
 assert.equal(registry.value({},'chapter','honor','ru'),'Честь');
 assert.equal(registry.value({},'chapter','honor','en'),'Honor');
 assert.equal(registry.value({},'honor','gain','ru'),'Получение и потеря чести');
 const patch={chapter_honor_ru:'Честь и ранги',chapter_honor_en:'Honor and ranks',
  honor_gain_ru:'Получение и потеря чести',honor_gain_en:'Earning and losing Honor'};
 const overrides={'guideedit.wiki.labels':JSON.stringify(patch)};
 assert.equal(registry.validPatch(patch),true);
 assert.equal(guide.validOverride('wiki.labels',JSON.stringify(patch)),true);
 assert.equal(registry.value(overrides,'chapter','honor','ru'),'Честь и ранги');
 assert.equal(registry.value(overrides,'chapter','honor','en'),'Honor and ranks');
 assert.equal(registry.value(overrides,'chapter','map','ru'),'Локации');
 assert.equal(registry.key('chapter','honor','en'),'chapter_honor_en');
 for(const bad of [{chapter_hidden_ru:'Secrets'},
  {chapter_honor_ru:' '},{chapter_honor_ru:'x'.repeat(91)},
  {chapter_honor_ru:'Вкладка\nОшибка'}]){
  assert.equal(registry.validPatch(bad),false);
  assert.equal(guide.validOverride('wiki.labels',JSON.stringify(bad)),false);
 }
 assert.match(app,/'data-wiki-chapter':key/);
 assert.match(app,/window\.PandoraWikiLabels\.key\('chapter',key,lang\)/);
 assert.match(view,/editLabel\(heading,'honor',id,name\)/);
 assert.match(view,/label\('chapter','honor','Честь','Honor'\)/);
});

test('Worker stores only whitelisted source-independent label content',async()=>{
 const values=new Map(),calls=[];
 const DB={prepare(sql){let args=[];
  return{bind(...values){args=values;return this},
   first:async()=>({id:1}),
   run:async()=>{
    calls.push({sql,args});
    if(sql.includes('INSERT INTO overrides'))values.set(args[0],args[1]);
    return{meta:{changes:1}};
   }};
 }};
 const endpoint='https://ps-build-studio-cloud.bonaqu.workers.dev/api/admin/override';
 const send=async patch=>worker.fetch(new Request(endpoint,{
  method:'POST',headers:{Origin:'https://bonaqu.github.io',
   Authorization:'Bearer '+'a'.repeat(43)},
  body:JSON.stringify({key:'guideedit.wiki.labels',value:JSON.stringify(patch)})
 }),{DB});
 const allowed={chapter_honor_ru:'Честь',honor_gain_en:'Earning and losing Honor'};
 const saved=await send(allowed);
 assert.equal(saved.status,200,await saved.clone().text());
 assert.deepEqual(JSON.parse(values.get('guideedit.wiki.labels')),allowed);
 for(const bad of [{chapter_ghost_ru:'Unexpected'}, {honor_ranks_en:' '},
  {chapter_map_ru:'x'.repeat(91)}]){
  const denied=await send(bad);
  assert.equal(denied.status,400,await denied.clone().text());
 }
 assert.equal(calls.filter(x=>x.sql.includes('INSERT INTO overrides')).length,1);
});

test('location relation controls reuse one name-based picker and do not expose IDs',()=>{
 assert.match(app,/function wikiOwnerEntityList\(\{label,existing,kind,onChange,limit=1000,replaceable=true\}\)/);
 assert.match(app,/class:'wiki-owner-replace'/);
 assert.match(app,/const next=replaceId\?ids\.map\(id=>id===replaceId\?chosen:id\):\[\.\.\.ids,chosen\]/);
 assert.match(app,/!ids\.includes\(key\)/);
 assert.match(app,/holder\.append\(add\)/);
 assert.match(view,/destination\.append\(add\)/);
 assert.match(view,/items\.some\(\(row,i\)=>i!==index&&row\.mapId===id\)/);
 assert.match(app,/replaceable:false,onChange:async next/);
});

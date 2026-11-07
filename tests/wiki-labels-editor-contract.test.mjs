import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import realWorker from '../worker/index.js';
import {withOwnerCasTestClient} from './helpers/owner-cas-compat.mjs';
const worker=withOwnerCasTestClient(realWorker);

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
 assert.equal(registry.value({},'skillFilter','unknown','ru'),'Неуточнённые');
 assert.equal(registry.value({},'skillFilter','unknown','en'),'Unresolved');
 assert.equal(registry.value({},'skillFilter','racial','ru'),'Расовая пассивка');
 assert.equal(registry.value({},'skillFilter','racial','en'),'Racial passive');
 assert.equal(registry.value({},'skillFilter','special','ru'),'Особое');
 assert.equal(registry.value({},'skillFilter','special','en'),'Special');
 assert.equal(registry.value({},'skillFilter','variants','ru'),'Дубли навыков');
 assert.equal(registry.value({},'skillFilter','variants','en'),'Duplicate skills');
 const patch={chapter_honor_ru:'Честь и ранги',chapter_honor_en:'Honor and ranks',
  honor_gain_ru:'Получение и потеря чести',honor_gain_en:'Earning and losing Honor',
  skill_filter_unknown_ru:'На уточнении',skill_filter_unknown_en:'Needs review'};
 const overrides={'guideedit.wiki.labels':JSON.stringify(patch)};
 assert.equal(registry.validPatch(patch),true);
 assert.equal(guide.validOverride('wiki.labels',JSON.stringify(patch)),true);
 assert.equal(registry.value(overrides,'chapter','honor','ru'),'Честь и ранги');
 assert.equal(registry.value(overrides,'chapter','honor','en'),'Honor and ranks');
 assert.equal(registry.value(overrides,'chapter','map','ru'),'Локации');
 assert.equal(registry.value(overrides,'skillFilter','unknown','ru'),'На уточнении');
 assert.equal(registry.value(overrides,'skillFilter','unknown','en'),'Needs review');
 assert.equal(registry.value(overrides,'skillFilter','player','ru'),'Умения персонажа');
 assert.equal(registry.key('skillFilter','unknown','en'),'skill_filter_unknown_en');
 assert.equal(registry.key('chapter','honor','en'),'chapter_honor_en');
 for(const bad of [{chapter_hidden_ru:'Secrets'},
  {chapter_honor_ru:' '},{chapter_honor_ru:'x'.repeat(91)},
  {chapter_honor_ru:'Вкладка\nОшибка'},
  {skill_filter_ghost_ru:'Служебное имя'},
  {skill_filter_racial_en:' '},
  {skill_filter_unknown_en:''},
  {skill_filter_unknown_ru:'x'.repeat(91)}]){
  assert.equal(registry.validPatch(bad),false);
  assert.equal(guide.validOverride('wiki.labels',JSON.stringify(bad)),false);
 }
 assert.match(app,/'data-wiki-chapter':key/);
 assert.match(app,/window\.PandoraWikiLabels\.key\('skillFilter',id,lang\)/);
 assert.match(app,/class:'wiki-categories wiki-skill-edit-list'/);
 assert.match(app,/saveGuidePatch\('wiki.labels',\{/);
 assert.match(app,/window\.PandoraWikiLabels\.key\('chapter',key,lang\)/);
 assert.match(view,/editLabel\(heading,'honor',id,name\)/);
 assert.match(view,/label\('chapter','honor','Честь','Honor'\)/);
});

test('skill filters reuse the compact native Encyclopedia filter layout',()=>{
 const css=read('pandora-studio-wiki-polish.css');
 const itemCss=read('pandora-studio-item-owner-editor.css');
 assert.match(app,/class:'wiki-effect-toolbar wiki-skill-toolbar'/);
 assert.match(itemCss,/\.wiki-effect-toolbar\{display:flex;gap:8px;align-items:center;flex-wrap:wrap\}/);
 assert.match(css,/\.wiki-skill-toolbar>\.wiki-skill-type\{[^}]*flex:0 1 auto/);
 assert.doesNotMatch(css,/\.wiki-skill-toolbar>\.wiki-skill-type\{[^}]*flex:1 1 auto/);
});

test('exact older default labels are updated while custom owner names survive',()=>{
 const old={'guideedit.wiki.labels':JSON.stringify({
  skill_filter_special_ru:'Особые умения',skill_filter_special_en:'Special skills',
  skill_filter_variants_ru:'Варианты навыков',skill_filter_variants_en:'Skill variants'
 })};
 assert.equal(registry.value(old,'skillFilter','special','ru'),'Особое');
 assert.equal(registry.value(old,'skillFilter','special','en'),'Special');
 assert.equal(registry.value(old,'skillFilter','variants','ru'),'Дубли навыков');
 assert.equal(registry.value(old,'skillFilter','variants','en'),'Duplicate skills');
 const custom={'guideedit.wiki.labels':JSON.stringify({
  skill_filter_special_ru:'Другая категория',skill_filter_variants_en:'Other variants'
 })};
 assert.equal(registry.value(custom,'skillFilter','special','ru'),'Другая категория');
 assert.equal(registry.value(custom,'skillFilter','variants','en'),'Other variants');
});
test('all 44 bilingual chapter, Honor and skill filter labels fit one validated owner patch',()=>{
 const all=Object.fromEntries([
  ...Object.entries(registry.chapter).flatMap(([id,names])=>[
   [registry.key('chapter',id,'ru'),names[0]],
   [registry.key('chapter',id,'en'),names[1]]]),
  ...Object.entries(registry.honor).flatMap(([id,names])=>[
   [registry.key('honor',id,'ru'),names[0]],
   [registry.key('honor',id,'en'),names[1]]]),
  ...Object.entries(registry.skillFilter).flatMap(([id,names])=>[
   [registry.key('skillFilter',id,'ru'),names[0]],
   [registry.key('skillFilter',id,'en'),names[1]]])
 ]);
 assert.equal(Object.keys(all).length,44);
 assert.equal(registry.validPatch(all),true);
 assert.equal(guide.validOverride('wiki.labels',JSON.stringify(all)),true);
 const overrides={'guideedit.wiki.labels':JSON.stringify(all)};
 assert.equal(registry.value(overrides,'skillFilter','unknown','ru'),'Неуточнённые');
 assert.equal(registry.value(overrides,'chapter','honor','ru'),'Честь');
 assert.equal(registry.validPatch({...all,skill_filter_missing_ru:'Oops'}),false);
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
 const allowed={chapter_honor_ru:'Честь',honor_gain_en:'Earning and losing Honor',
  skill_filter_unknown_ru:'На уточнении',skill_filter_unknown_en:'Needs review',
  skill_filter_racial_ru:'Расовая пассивка',skill_filter_racial_en:'Racial passive'};
 const saved=await send(allowed);
 assert.equal(saved.status,200,await saved.clone().text());
 assert.deepEqual(JSON.parse(values.get('guideedit.wiki.labels')),allowed);
 for(const bad of [{chapter_ghost_ru:'Unexpected'}, {honor_ranks_en:' '},
  {chapter_map_ru:'x'.repeat(91)},
  {skill_filter_invalid_ru:'Некорректный ключ'},
  {skill_filter_unknown_ru:'x'.repeat(91)}]){
  const denied=await send(bad);
  assert.equal(denied.status,400,await denied.clone().text());
 }
 // A full 44-label bilingual patch must pass the Worker validator as well.
 const large=Object.fromEntries([
  ...Object.entries(registry.chapter).flatMap(([id,n])=>[
   [registry.key('chapter',id,'ru'),n[0]],[registry.key('chapter',id,'en'),n[1]]]),
  ...Object.entries(registry.honor).flatMap(([id,n])=>[
   [registry.key('honor',id,'ru'),n[0]],[registry.key('honor',id,'en'),n[1]]]),
  ...Object.entries(registry.skillFilter).flatMap(([id,n])=>[
   [registry.key('skillFilter',id,'ru'),n[0]],[registry.key('skillFilter',id,'en'),n[1]]])
 ]);
 assert.equal((await send(large)).status,200);
 assert.deepEqual(JSON.parse(values.get('guideedit.wiki.labels')),large);
 assert.equal(calls.filter(x=>x.sql.includes('INSERT INTO overrides')).length,2);
});

test('location relation controls reuse one name-based picker and do not expose IDs',()=>{
 assert.match(app,/function wikiOwnerEntityList\(\{label,existing,kind,onChange,limit=1000,replaceable=true,replaceCandidate=null\}\)/);
 assert.match(app,/class:'wiki-owner-replace'/);
 assert.match(app,/const next=replaceId\?ids\.map\(id=>id===replaceId\?chosen:id\):\[\.\.\.ids,chosen\]/);
 assert.match(app,/!ids\.includes\(key\)/);
 assert.match(app,/holder\.append\(add\)/);
 assert.match(view,/destination\.append\(add\)/);
 assert.match(view,/items\.some\(\(row,i\)=>i!==index&&row\.mapId===id\)/);
 assert.match(app,/replaceable:false,onChange:async next/);
});

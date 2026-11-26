import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const wiki=app.slice(app.indexOf('function renderWiki(root)'),app.indexOf('function renderProfile(root)'));

test('temporary encyclopedia picker listeners are cleaned on view change and detail redraw',()=>{
 // A multiline title editor must not remove the picker disposer.
 assert.match(app,/function renderDetails\(\)\{\s*wikiOutsideCleanup\?\.\(\);\s*wikiOutsideCleanup=null/);
 assert.match(app,/bindAccountCopyEditors\(heading\.parentElement\)/);
 assert.match(wiki,/const outsidePickers=new Set\(\)/);
 assert.match(wiki,/const cleanupOutsidePickers=\(\)=>\{/);
 assert.match(wiki,/for\(const onOutside of outsidePickers\)/);
 assert.match(wiki,/outsidePickers\.delete\(onOutside\)/);
 assert.match(wiki,/wikiOutsideCleanup=\(\)=>\{/);
 assert.match(wiki,/cleanupOutsidePickers\(\);\s*if\(wikiSearchTimer!==null\)clearTimeout\(wikiSearchTimer\)/);
 assert.match(wiki,/cleanupOutsidePickers\(\);\s*detail\.replaceChildren\(\)/);
 assert.match(wiki,/registerOutsidePicker\(form\)/);
 assert.match(wiki,/registerOutsidePicker\(panel,add\)/);
 assert.match(wiki,/registerOutsidePicker\(panel,plus\)/);
 assert.equal((wiki.match(/document\.addEventListener\('pointerdown'/g)||[]).length,1,
  'all transient outside-picker listeners use the centralized disposer');
});

test('wiki navigation reuses unchanged search results without rebuilding the browse list',()=>{
 assert.match(wiki,/let wikiResultsCache=null/);
 assert.match(wiki,/const resultKey=JSON\.stringify\(\[type,wikiSearch,wikiItemType/);
 assert.match(wiki,/wikiResultsCache\?\.index===wikiIndex/);
 assert.match(wiki,/wikiResultsCache\.equipment===catalog\.equipment/);
 assert.match(wiki,/wikiResultsCache\.english===officialEnglish/);
 assert.match(wiki,/wikiResultsCache\.key===resultKey/);
 assert.match(wiki,/if\(!results\)\{\s*results=wikiIndex\.search/);
 assert.match(wiki,/wikiResultsCache=\{index:wikiIndex/);
 assert.match(wiki,/if\(!detailOnly\)browse\.replaceChildren\(\)/);
 assert.match(app,/if\(sameCategory\)wikiRenderSelected\(\)/);
});

test('verified English potion names are preserved in the checked-in OS localization',()=>{
 const source=JSON.parse(read('data/os/strings.en.json'));
 const verified=new Map([
  ['50060','Chunk of Meat'],['50001','Painkiller'],['50002','Salve'],
  ['50003','Remedy'],['50061','Mysterious Potion'],['50023','Hepatica'],
  ['50062','Pumpkin Cookie'],['50065','Astian Candy'],
  ['50063','Elegant Champagne'],['50004','Restoration Potion']
 ]);
 assert.equal(source.locale,'en');
 for(const [id,name] of verified)
  assert.equal(source.items[id]?.n,name,'current source ID '+id);
});

test('Wiki results and actions preserve live numbers beside independent owner-editable captions',()=>{
 const expected=[
  ['resultsShown','Показано','Showing'],
  ['resultsOf','из','of'],
  ['resultsUnits','записей','entries'],
  ['morePrefix','Показать ещё','Show more'],
  ['noMatches','Ничего не найдено.','No matching entries.'],
  ['selectPrompt','Выбери запись','Select an entry'],
  ['placeCity','Город Астир','Astir city'],
  ['placeNation','Государства','Nations'],
  ['placeOther','Другие локации','Other locations'],
  ['backLabel','← Назад','← Back']
 ];
 // The shared owner-copy dictionary is intentionally outside renderWiki;
 // the live view must still consume it and keep each precise semantic identity.
 const source=app.match(
  /const wikiCoreCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 assert.ok(source,'The production Wiki must share one source copy dictionary');
 const rows=runInNewContext('('+source[1]+')',{});
 assert.equal(rows.length,17);
 assert.match(wiki,/ownerInterfaceEditor\('wiki-ui',wikiCoreCopyRows/);
 for(const [key,ru,en] of expected){
  const entry=rows.find(row=>row[0]===key);
  assert.ok(entry,'Missing semantic owner-copy key '+key);
  assert.ok(entry[1].startsWith(ru)&&entry[2].startsWith(en),
   'Source-authored RU/EN default mismatch for '+key);
 }
 assert.match(wiki,/summary\.append\(/);
 assert.match(wiki,/String\(visible\.length\)/);
 assert.match(wiki,/String\(results\.length\)/);
 assert.match(wiki,/more\.append\(bindOwnerInterfaceText/);
 assert.match(wiki,/String\(results\.length-wikiShown\)/);
 assert.match(wiki,/batch\.append\(bindOwnerInterfaceText\(/);
 assert.match(app,/bindOwnerInterfaceText\(button,'wiki-ui','backLabel'/);
 assert.doesNotMatch(wiki,/text:lang==='en'\?'Showing '/);
});

test('#390 late Wiki skill source readiness reconciles real counts without changing owner captions',()=>{
 const begin=wiki.indexOf("const filterModel=type==='skill'?skillModel():null;");
 const end=wiki.indexOf("if(type==='skill'&&wikiSelection.id!=null",begin);
 assert.ok(begin>=0&&end>begin,'Skill count reconciliation must run with a ready index');
 const code=wiki.slice(begin,end);
 assert.match(code,/controls\.querySelector\('\.wiki-skill-type'\)/);
 assert.match(code,/filterModel\.counts\?\.\[id\]/);
 assert.match(code,/PandoraWikiLabels\.value\(override,'skillFilter',id,lang\)/);
 assert.match(code,/option\.dataset\.labelCount=value/);
 assert.match(code,/option\.textContent=caption/);
 assert.doesNotMatch(code,/skillPicker\.value=|skillPicker\.replaceChildren\(/,
  'Do not replace the selected native filter');
});

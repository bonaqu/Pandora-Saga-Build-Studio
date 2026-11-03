import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const wiki=app.slice(app.indexOf('function renderWiki(root)'),app.indexOf('function renderProfile(root)'));

test('temporary encyclopedia picker listeners are cleaned on view change and detail redraw',()=>{
 assert.match(app,/function renderDetails\(\)\{wikiOutsideCleanup\?\.\(\);wikiOutsideCleanup=null/);
 assert.match(wiki,/const outsidePickers=new Set\(\)/);
 assert.match(wiki,/const cleanupOutsidePickers=\(\)=>\{/);
 assert.match(wiki,/for\(const onOutside of outsidePickers\)/);
 assert.match(wiki,/outsidePickers\.delete\(onOutside\)/);
 assert.match(wiki,/wikiOutsideCleanup=cleanupOutsidePickers/);
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
 assert.match(wiki,/if\(sameCategory\)wikiRenderSelected\(\)/);
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

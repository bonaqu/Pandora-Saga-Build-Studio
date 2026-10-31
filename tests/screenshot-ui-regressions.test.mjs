import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('two explicit RU/EN buttons keep the selected language accessible',()=>{
 const index=read('index.html'),app=read('app.js'),ui=read('ui-locale.js');
 assert.match(index,/id="locale" class="locale-switch"/);
 assert.match(index,/data-locale="ru" aria-pressed="true"/);
 assert.match(index,/data-locale="en" aria-pressed="false"/);
 assert.match(app,/button\.setAttribute\('aria-pressed',String\(active\)\)/);
 const host={},nodes=[
  {dataset:{i18n:'appearance'},textContent:''},
  {dataset:{i18n:'path'},textContent:''}
 ];
 const doc={documentElement:{lang:'ru'},querySelectorAll:()=>nodes};
 Function('window',ui)(host);
 host.PandoraUILocale.apply('en',doc);
 assert.deepEqual(nodes.map(n=>n.textContent),['Hero Appearance','Hero Path']);
 assert.equal(doc.documentElement.lang,'en');
 host.PandoraUILocale.apply('ru',doc);
 assert.deepEqual(nodes.map(n=>n.textContent),['Образ героя','Путь героя']);
});
test('item details use global item presenter and never leak English slot key into visible header',()=>{
 const source=read('stage-item-ui.js');
 assert.match(source,/globalThis\.PandoraItemPresentation\?\.displayName\(record\)/);
 assert.match(source,/api\.slotLabel/);
 assert.doesNotMatch(source,/root\.PandoraItemPresentation\?\.displayName\(record\)\|\|'Слот:/);
 const app=read('app.js');
 assert.match(app,/slotLabel:slots\[selectedSlot\]\[0\]/);
});
test('skill markers keep tooltips, use three distinct vertical lanes, and do not block slider',()=>{
 const css=read('style.css'),hero=read('hero-path.js');
 assert.match(css,/\.path-threshold-tick:nth-child\(3n\+1\)/);
 assert.match(css,/\.path-threshold-tick:nth-child\(3n\+2\)/);
 assert.match(css,/\.path-threshold-tick:nth-child\(3n\)\{/);
 assert.match(hero,/class:'path-milestone-tooltip',role:'tooltip'/);
 assert.match(hero,/track\.append\(range\);paint\(\)/);
});
test('auto cloud saves happen only after an intentional edit and only for existing IDs',()=>{
 const app=read('app.js'),helper=read('saved-build-autosave.js');
 assert.match(app,/if\(event\.isTrusted\)savedEditIntent=true/);
 assert.match(app,/if\(!savedEditIntent\)return/);
 assert.match(app,/const update=window\.PandoraSavedBuildAutosave\.updatedSaved/);
 assert.match(app,/if\(!cloudReadSucceeded\)return/);
 assert.match(helper,/if\(index<0\)return null/);
 assert.match(app,/void putCloudBuild\(entry\)/);
});

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
test('item dialog header shows localized slot type, not duplicated item name',()=>{
 const source=read('stage-item-ui.js'),app=read('app.js');
 assert.match(source,/api\.slotLabel\|\|'Слот: '\+slot/);
 assert.match(app,/\['Оружие','Щит','Шлем','Броня','Перчатки','Штаны','Обувь','Плащ'/);
 assert.match(app,/\['Weapon','Shield','Helmet','Armor','Gloves','Pants'/);
});
test('skill markers keep tooltips in one shared bar and never block the slider',()=>{
 const css=read('style.css'),hero=read('hero-path.js');
 assert.match(css,/\.path-integrated-track \.path-unlock-notch\{/);
 assert.match(css,/\.path-integrated-track \.path-unlock-notch\{[^}]*pointer-events:none/);
 assert.match(css,/\.path-integrated-track \.path-current-notch\{/);
 assert.doesNotMatch(css,/\.path-threshold-tick:nth-child\(3n/);
 assert.match(hero,/class:'path-milestone-tooltip',role:'tooltip'/);
 assert.match(hero,/track\.append\(range\);paint\(\)/);
});
test('saved builds stay local until the user explicitly overwrites',()=>{
 const app=read('app.js');
 assert.match(app,/function persist\(\)\{try\{window\.PandoraBuildScope\.setOwned/);
 assert.doesNotMatch(app,/PandoraSavedBuildAutosave\.updatedSaved/);
 assert.match(app,/text:'↻ Перезаписать'/);
 assert.match(app,/saveBuild\(state\.name,b\.id\)/);
 assert.match(app,/function saveBuild\(name=state\.name\|\|'Новый герой',overwriteId=null\)/);
 assert.match(app,/\$\('snapshot'\)\.onclick=\(\)=>\{changeTab\('builds'\)\}/);
});
test('locale selection works before async catalog is available',()=>{
 const app=read('app.js');
 assert.match(app,/function applyGameLocale\(\)\{\n window\.PandoraUILocale\.apply\(lang\)/);
 assert.match(app,/button\.setAttribute\('aria-pressed',String\(active\)\)/);
});

test('saved build overwrite confirms inside a visible card, not a native dialog',()=>{
 const app=read('app.js'),css=read('style.css');
 assert.match(app,/class:'build-overwrite-choice',hidden:true/);
 assert.match(app,/text:'Подтвердить перезапись'/);
 assert.doesNotMatch(app,/if\(!confirm\('Перезаписать сохранённый билд/);
 assert.match(css,/\.build-overwrite-choice\[hidden\]\{display:none\}/);
 assert.match(css,/\.build-overwrite-choice\{display:flex/);
});

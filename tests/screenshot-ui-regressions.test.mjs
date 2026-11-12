import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('two explicit RU/EN buttons keep the selected language accessible',()=>{
 const index=read('index.html'),app=read('pandora-studio-app.js'),ui=read('pandora-studio-ui-locale.js');
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
 const source=read('pandora-studio-equipment-ui.js'),app=read('pandora-studio-app.js');
 assert.match(source,/api\.slotLabel\|\|tr\('Слот: ','Slot: '\)\+slot/);
 assert.match(source,/tr\('Закрыть настройку','Close item settings'\)/);
 assert.match(app,/const slots=\[\['Оружие','⚔'\]/);
 assert.match(app,/const englishGearSlots=\['Weapon','Shield','Helmet','Armor','Gloves','Pants'/);
 assert.match(app,/slotLabel:\(lang==='en'\?'Slot: ':'Слот: '\)\+gearSlotName\(selectedSlot\)/);
});
test('skill markers keep tooltips in one shared bar and never block the slider',()=>{
 const css=read('pandora-studio-theme.css'),hero=read('pandora-studio-hero-path.js');
 assert.match(css,/\.path-integrated-track \.path-unlock-notch\{/);
 assert.match(css,/\.path-integrated-track \.path-unlock-notch\{[^}]*pointer-events:none/);
 assert.match(css,/\.path-integrated-track \.path-current-notch\{/);
 assert.doesNotMatch(css,/\.path-threshold-tick:nth-child\(3n/);
 assert.match(hero,/class:'path-milestone-tooltip',role:'tooltip'/);
 assert.match(hero,/track\.append\(range\);paint\(\)/);
});
test('saved builds stay local until the user explicitly overwrites',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/function persist\(\)\{\s*try\{\s*const committed=window\.PandoraBuildScope\.setOwned/);
 assert.match(app,/draftStorageStatus\(committed!==true\)/);
 assert.match(app,/catch\(error\)\{[\s\S]*?draftStorageStatus\(true\);return false/);
 assert.doesNotMatch(app,/PandoraSavedBuildAutosave\.updatedSaved/);
 assert.match(app,/cardAction\('↻','libraryCardOverwrite','libraryHintOverwrite'/);
 assert.match(app,/saveBuild\(activeBuildId===b\.id\?state\.name:b\.name,b\.id\)/);
 assert.match(app,/function saveBuild\(name=state\.name\|\|'Новый герой',overwriteId=null\)/);
 assert.match(app,/\$\('snapshot'\)\.onclick=\(\)=>\{changeTab\('builds'\)\}/);
});
test('locale selection works before async catalog is available',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/window\.PandoraUILocale\.setOverrides\(override\)/);
 assert.match(app,/window\.PandoraUILocale\.apply\(lang\)/);
 assert.match(app,/button\.setAttribute\('aria-pressed',String\(active\)\)/);
});

test('saved build overwrite confirms inside a visible card, not a native dialog',()=>{
 const app=read('pandora-studio-app.js'),css=read('pandora-studio-theme.css');
 assert.match(app,/class:'build-overwrite-choice',hidden:true/);
 assert.match(app,/text:tr\('Подтвердить перезапись','Confirm overwrite'\)/);
 assert.doesNotMatch(app,/if\(!confirm\('Перезаписать сохранённый билд/);
 assert.match(css,/\.build-overwrite-choice\[hidden\]\{display:none\}/);
 assert.match(css,/\.build-overwrite-choice\{display:flex/);
});

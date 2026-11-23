import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const html=read('index.html'),app=read('pandora-studio-app.js');
const locale={};
Function('window',read('pandora-studio-ui-locale.js'))(locale);

test('important static player landmarks and controls are translated on RU/EN changes',()=>{
 const cases=[
  ['editorHeading','Pandora Saga Build Studio — character planner'],
  ['workshopArea','Character planner workspace'],
  ['workshopLabel','Character workshop'],
  ['raceCarousel','Race portrait carousel'],
  ['racePassivesArea','Selected race passives'],
  ['calculatedVitals','Calculated HP and MP'],
  ['baseStatPoints','Base attribute points'],
  ['heroPathPages','Hero Path pages'],
  ['searchSkills','Search skills'],
  ['skillFilter','Skill filter'],
  ['hpShort','HP'],
  ['mpShort','MP'],
  ['closeWorkbench','Close workbench']
 ];
 for(const [key,en] of cases){
  assert.equal(locale.PandoraUILocale.text(key,'en'),en,key);
  assert.notEqual(locale.PandoraUILocale.text(key,'ru'),en,key);
  assert.match(html,new RegExp('data-i18n(?:-aria-label)?="'+key+'"'),key);
 }
 assert.match(html,/data-i18n-aria-label="heroLevel"/);
});

test('EN race image and portrait arrow descriptions follow the chosen race/gender',()=>{
 const begin=app.indexOf('function renderRaces(){');
 const end=app.indexOf('function renderJobs(){',begin);
 assert.ok(begin>=0&&end>begin);
 const races=app.slice(begin,end);
 assert.match(races,/const raceName=races\[i\]\[lang==='en'\?1:0\]/);
 assert.match(races,/lang==='en'\?' · male':' · мужчина'/);
 assert.match(races,/lang==='en'\?' · female':' · женщина'/);
 // Three authorial action phrases now come from the same bilingual D1/CAS
 // registry, not a static inline lang ternary. Race/gender remain source data.
 const registry=app.match(/const originRacePortraitAriaRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 assert.ok(registry,'Source-backed bilingual race ARIA registry must exist');
 const rows=Function('return '+registry[1])();
 assert.deepEqual(rows,[
  ['racePortraitPreviousAria','Предыдущий портрет','Previous portrait'],
  ['racePortraitNextAria','Следующий портрет','Next portrait'],
  ['racePortraitChooseAria','Выбрать','Choose']
 ]);
 for(const [key,ru,en] of rows){
  assert.ok(races.includes("'"+key+"'"),'Live race gallery binds '+key);
  assert.notEqual(ru,en,'Both languages must be explicit: '+key);
 }
 assert.match(races,/bindOwnerInterfaceText\(img,'origin','racePortraitChooseAria'/);
 assert.match(races,/'aria-label',' '\+raceName\+sexSuffix/);
 assert.match(races,/'visual\.race\.'\+i\+'\.'\+\(gender\?'m':'f'\)/);
 assert.match(app,/window\.PandoraUILocale\.apply\(lang\)/);
});

test('calculated origin vitals use locale-specific HP/MP announcements',()=>{
 const from=app.indexOf('function renderOriginVitals(calculated=undefined){');
 const to=app.indexOf('\nfunction setVitalsEnhancement(key,value){',from);
 assert.ok(from>=0&&to>from);
 const code=app.slice(from,to);
 assert.match(code,/lang==='en'\?'HP '\+calculated\.hp/);
 assert.match(code,/lang==='en'\?'HP and MP will appear when game data have loaded\.'/);
 assert.match(html,/<span data-i18n="hpShort">ОЗ<\/span>/);
 assert.match(html,/<span data-i18n="mpShort">ОМ<\/span>/);
});

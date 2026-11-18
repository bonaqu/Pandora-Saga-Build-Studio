// Consolidated short Origin, workbench and visual identity contracts.
// Each lexical block preserves its original assertions and source name.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Original: tests/origin-wizard.test.mjs
{
const root=new URL('../',import.meta.url),get=p=>readFileSync(new URL(p,root),'utf8');
test('three origin tabs group race+racial passive, class, level+stats',()=>{
 const html=get('index.html'),code=get('pandora-studio-app.js');
 for(const section of ['race','class','stats'])
  assert.match(html,new RegExp('data-origin-section="'+section+'"'));
 assert.doesNotMatch(html,/data-origin-section="passive"/);
 assert.doesNotMatch(html,/data-origin-section="level"/);
 assert.match(html,/id="originPassives"/);
 assert.match(html,/id="originStats"/);
 assert.match(code,/function renderOriginTabs\(/);
});
test('class wizard traverses parent genealogy with back button',()=>{
 const app=get('pandora-studio-app.js');
 assert.match(app,/jobPathKey=parentOf\(jobPathKey\)/);
 assert.match(app,/const next=records.filter\(x=>x.parent===\(jobPathKey\|\|null\)\)/);
 assert.match(app,/jobPathKey=node.key;selectJob\(node.i\)/);
});
test('race can be activated from image or button, no disabled selection',()=>{
 const app=get('pandora-studio-app.js');
 assert.match(app,/img.addEventListener\('click',chooseRace\)/);
 assert.doesNotMatch(app,/disabled:chosen/);
});
}

// Original: tests/race-skill-locale-artwork.test.mjs
{
const src=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL('../assets/os-icon-manifest.json',import.meta.url),'utf8'));
const begin=src.indexOf('function localizedRaceSkillStem(');
const end=src.indexOf('function skillIcon(',begin);
assert.ok(begin>0&&end>begin,'Source contains exact RU/EN race icon mapping');
const choose=Function(src.slice(begin,end)+'return localizedRaceSkillStem;')();

test('two exact race icons reuse existing client-matched local art by language',()=>{
 const ids=['skill_900050003','skill_900060003'];
 for(const id of ids)assert.ok(manifest.icons.skills[id],id+' must already be mirrored locally');
 assert.equal(choose(ids[0],'ru'),ids[1]);
 assert.equal(choose(ids[1],'ru'),ids[0]);
 assert.equal(choose(ids[0],'en'),ids[0]);
 assert.equal(choose(ids[1],'en'),ids[1]);
 assert.equal(choose('skill_100000501','ru'),'skill_100000501');
 assert.equal(choose(ids[0],'jp'),ids[0]);
 assert.ok(src.indexOf('if(custom)return custom;')<
  src.indexOf('const localeStem=localizedRaceSkillStem(stem,lang);'),
  'explicit owner art overrides must take precedence over locale reuse');
});
}

// Original: tests/origin-editor-locale-undo-625.test.mjs
{
const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');

test('Origin captures locale at editor open, not when a D1 save resolves',()=>{
 const from=app.indexOf('function editOriginCopyLabel('),to=app.indexOf('function renderOriginCopyLabels()',from);
 assert.ok(from>0&&to>from);
 const edit=app.slice(from,to);
 assert.match(edit,/const editLang=lang;/);
 assert.match(edit,/\{\[editLang\]:next\}/);
 assert.doesNotMatch(edit,/\{\[lang\]:next\}/);
 assert.match(edit,/const visible=lang===editLang\?next:originCopy\(key,ru,en\)/);
 assert.match(edit,/pencil\.dataset\.originEditFor===key/);
});
test('Origin Undo and reset update only existing copy, leaving the hero draft mounted',()=>{
 assert.match(app,/node\.dataset\.originCopyRu=ru;node\.dataset\.originCopyEn=en/);
 assert.match(app,/function refreshVisibleOriginCopy\(recordKey\)/);
 assert.match(app,/node\.dataset\.originEditing==='1'/);
 assert.match(app,/if\(originGuideKey\(key\)!==wanted\)/);
 assert.match(app,/if\(last\.key\.startsWith\('guideedit\.book\.origin\.'\)\)/);
 assert.match(app,/refreshVisibleOriginCopy\(last\.key\);saveView\(\)/);
 assert.match(app,/refreshVisibleOriginCopy\(record\.key\);saveView\(\)/);
});
}

// Original: tests/clean-origin-and-share-errors.test.mjs
{
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Origin and hero stage do not show Remaked methodology notes to ordinary players',()=>{
 const html=read('index.html'),app=read('pandora-studio-app.js');
 assert.doesNotMatch(html,/Числовые показатели скорости из Remaked/);
 assert.doesNotMatch(html,/из актуальной таблицы OS, а не старой версии Remaked/);
 assert.doesNotMatch(app,/Часть эффектов заточки, комплектов и умений пока не проверена/);
 assert.match(app,/holder\.setAttribute\('aria-label',notice\)/);
 assert.doesNotMatch(app,/renderVitalsEnhancements\(|renderPotionPreview\(/);
});
test('invalid saved character is caught by the per-card share handler',()=>{
 const app=read('pandora-studio-app.js');
 const part=app.slice(app.indexOf('async function createShared('),app.indexOf('function openSharedSnapshot('));
 assert.match(part,/try\{[\s\S]*?const expectedData=JSON\.parse\(JSON\.stringify\(build\.data\)\)/);
 assert.match(part,/sanitizeSharedState\(expectedData\)/);
 assert.match(part,/const currentRequest=\(\)=>sameViewer\(\)&&pendingShareRequests\.get\(requestKey\)===operation/);
 assert.match(part,/if\(!currentRequest\(\)\)return;/);
 assert.match(part,/catch\(error\)/);
 assert.match(part,/class:'share-editorial-row build-share-error'/);
 assert.match(part,/class:'share-runtime-detail'/);
 assert.match(part,/const target=currentHost\(\);\s*if\(target\)\{\s*target\.replaceChildren\(row\);/);
 assert.match(part,/const visibleOwner=\(\)=>copy\.isConnected&&/);
});
}

// Original: tests/calculator-level55-guard.test.mjs
{
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const cls=JSON.parse(read('data/os/classes.json'));
const scope={};Function('window',read('pandora-os-character-calculator.js'))(scope);
const zero={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const build=level=>scope.PandoraOSCalculator.base({
 classData:cls.CLERIC,
 raceData:{...zero,vit:49,spi:53},jobData:zero,allocation:zero,level
});
test('full class formula accepts planned 55 even though live server may temporarily cap at 45',()=>{
 const last=build(55),current=build(45);
 assert.ok(last&&current);
 assert.equal(last.hpBase>=current.hpBase,true);
 assert.equal(last.mpBase>=current.mpBase,true);
});
test('the actual build calculator rejects levels outside the 1–55 planning contract',()=>{
 assert.equal(build(0),null);
 assert.equal(build(-1),null);
 assert.equal(build(56),null);
 assert.equal(build(99),null);
 assert.equal(build(1.5),null);
 assert.ok(build(1));
});
test('live readiness checks separately require cloud build-library D1 migration',()=>{
 const script=read('scripts/check-live-connections.mjs');
 assert.match(script,/features\?\.library===true/);
 assert.match(script,/D1 cloud build library/);
 assert.match(script,/connection diagnostics/i);
});
}

// Original: tests/workbench-guidance-863.test.mjs
{
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('shared build names are runtime-only and both actions explain their outcomes',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/class:'shared-current-name',text:currentName/);
 assert.match(app,/class:'shared-personal-name',text:incomingName/);
 assert.match(app,/class:'shared-build-replacement'/);
 assert.match(app,/saveBuild\(state\.name\|\|currentName,savedCurrent\?\.id\|\|null\)/);
 assert.match(app,/hintButton\(sharedText\('Открыть без сохранения'/);
 assert.doesNotMatch(app,/class:'shared-personal-name',\s*'data-owner-copy-key'/);
});
test('three onboarding steps and equipment tabs have bilingual help',()=>{
 const html=read('index.html'),locale=read('pandora-studio-ui-locale.js');
 const equipment=read('pandora-studio-equipment-ui.js');
 for(const key of ['originGuide','appearanceGuide','pathGuide']){
  assert.match(html,new RegExp('data-i18n="'+key+'"'));
  assert.match(locale,new RegExp(key+':\\['));
 }
 assert.match(equipment,/const hints=\{/);
 for(const id of ['choose','details','souls'])assert.match(equipment,new RegExp(id+':\\['));
 assert.match(equipment,/PandoraGuideTooltip\?\.attach\(button,actionHelp,/);
});
}

// Original: tests/origin-no-tech-notes.test.mjs
{
const root=new URL('../',import.meta.url),get=p=>readFileSync(new URL(p,root),'utf8');
test('Origin has no technical disclaimers under base stat controls',()=>{
 const html=get('index.html'),css=get('pandora-studio-theme.css');
 assert.doesNotMatch(html,/Общий бюджет очков параметров ещё не подтверждён/);
 assert.doesNotMatch(html,/origin-stats-note/);
 assert.doesNotMatch(css,/\.origin-stats-note\{/);
 assert.match(html,/id="originStats"/);
});
test('detailed stat labels match compact editor while keeping save keys',()=>{
 const src=get('pandora-studio-app.js');
 assert.match(src,/h\('h3',\{text:statName\(i\)\}\)/);
 assert.match(src,/const statName=i=>lang==='en'/);
 assert.match(src,/if\(hp\)hp\.textContent=hpReady\?String\(calculated\.hp\):'—'/);
 assert.match(src,/if\(mp\)mp\.textContent=mpReady\?String\(calculated\.mp\):'—'/);
 assert.doesNotMatch(src,/ОЗ ≈/);
 assert.doesNotMatch(src,/Предел пока неизвестен\. Используется редактор плана/);
 assert.doesNotMatch(src,/Предварительные ОЗ ≈/);
 assert.match(src,/const STATS=\['Выносливость','Сила','Ловкость','Сноровка','Дух','Интеллект'\]/);
});
}

// Original: tests/favicon-studio.test.mjs
{
const from=p=>readFileSync(new URL('../'+p,import.meta.url));
test('browser tab uses PS artwork instead of hard-to-read header image',()=>{
 const html=from('index.html').toString('utf8'),v=JSON.parse(from('site-version.json').toString('utf8')).release;
 assert.match(html,/<link rel="icon" type="image\/png" sizes="96x96" href="assets\/favicon-ps-96\.png\?v=/);
 assert.match(html,/rel="apple-touch-icon" href="assets\/favicon-ps-96\.png\?v=/);
 assert.doesNotMatch(html,/<link rel="icon" href="assets\/pandora-logo\.png">/);
 assert.equal([...html.matchAll(/assets\/favicon-ps-96\.png\?v=([^"]+)"/g)].length,2);
 assert.ok([...html.matchAll(/assets\/favicon-ps-96\.png\?v=([^"]+)"/g)].every(m=>m[1]===v));
});
test('96px PS PNG has genuine palette transparency, not painted background',()=>{
 const bytes=from('assets/favicon-ps-96.png');
 assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 assert.equal(bytes.readUInt32BE(16),96);
 assert.equal(bytes.readUInt32BE(20),96);
 assert.ok(bytes.includes(Buffer.from('tRNS')));
 assert.ok(bytes.length>1200&&bytes.length<20000);
});
}

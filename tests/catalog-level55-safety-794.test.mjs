import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const browser={window:{}};
for(const path of [
 'pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js',
 'pandora-studio-skill-progression.js',
 'pandora-os-catalog-review.js',
 'pandora-os-catalog-import.js',
 'pandora-studio-catalog-safety.js'
])vm.runInNewContext(read(path),browser,{filename:path});
const safety=browser.window.PandoraCatalogSafety;
const review=browser.window.PandoraOSCatalogReview;
const importer=browser.window.PandoraCatalogImport;
const old=Object.fromEntries(importer.files.map(key=>[
 key,JSON.parse(read('data/catalog-history/pre-2026-11-15/'+key+'.json'))
]));
const hero={race:'HUMAN',klass:'WARRIOR',level:55,
 stats:{vit:0,str:0,agi:0,dex:0,spi:0,int:0},points:{slash:5}};
const cloned=()=>structuredClone(old);

test('server levelCap 50 never lowers the level-55 planner or points',()=>{
 const next=cloned();next.tables.levelCap=50;
 const check=safety.check(next);
 assert.equal(check.ok,true,check.issues.join(' / '));
 assert.equal(check.plannerMax,55);
 assert.equal(check.levelCap,50);
 assert.equal(check.attributesAt55,544);
 assert.equal(check.skillsAt55,134);
 const projection=safety.project(next,hero);
 assert.equal(projection.attributeBudget,544);
 assert.equal(projection.skillBudget,134);
 assert.equal(projection.skillRemaining,129);
 for(const [level,attributePoints,skillPoints] of [
  [45,432,104],[46,446,107],[47,460,110],[48,474,113],
  [49,488,116],[50,504,119],[51,512,122],[55,544,134]
 ]){
  const candidate={...hero,level};
  assert.equal(safety.project(next,candidate).attributeBudget,attributePoints);
  assert.equal(safety.project(next,candidate).skillBudget,skillPoints);
 }
});

test('broken 51–55 progression blocks catalog publication',()=>{
 const missing=cloned();missing.tables.levelCap=50;
 delete missing.tables.abilityPoint['55'];
 assert.equal(safety.check(missing).ok,false);
 assert.match(safety.check(missing).issues.join(' '),/55-го уровня/);
 const badClass=cloned();
 badClass.classes.WARRIOR.hp.lv='not-a-number';
 assert.equal(safety.check(badClass).ok,false);
 assert.match(safety.check(badClass).issues.join(' '),/герой WARRIOR/i);
});

test('selected game metadata cap does not change current hero calculations',()=>{
 const next=cloned();next.tables.levelCap=50;
 const found=importer.files.flatMap(key=>review.changes(key,old[key],next[key]));
 assert.ok(found.some(row=>row.dataset==='tables'));
 const chosen=new Set(found.map(row=>row.id));
 const selected=review.compose(old,next,chosen,importer.files);
 review.auditSelection(old,next,selected,chosen,importer.files);
 const check=safety.check(selected);
 assert.equal(check.ok,true,check.issues.join(' / '));
 assert.equal(selected.tables.levelCap,50);
 assert.equal(safety.compare(old,selected,hero).changes.length,0);
});

test('owner sees exact character stat/HP and MP deltas from selected formula tables',()=>{
 const next=cloned();
 next.tables.raceInit.HUMAN.vit+=2;
 next.tables.raceInit.HUMAN.spi+=1;
 const report=safety.compare(old,next,hero);
 assert.equal(report.hasHero,true);
 assert.ok(report.changes.some(row=>row.key==='stat:vit'&&row.after-row.before===2));
 assert.ok(report.changes.some(row=>row.key==='stat:spi'&&row.after-row.before===1));
 assert.ok(report.changes.some(row=>row.key==='baseHp'&&row.after>row.before));
 assert.ok(report.changes.some(row=>row.key==='baseMp'&&row.after>row.before));
 assert.equal(report.changes.some(row=>row.key==='attributeBudget'),false);
 assert.equal(report.changes.some(row=>row.key==='skillBudget'),false);
});

test('selection of changed class formulas shows a concrete HP change',()=>{
 const next=cloned();
 next.classes.WARRIOR.hp.base+=10;
 const report=safety.compare(old,next,hero);
 assert.ok(report.changes.some(row=>row.key==='baseHp'&&
  row.after-row.before===10));
});

test('publication verifies actual public tables/classes, not only a snapshot header',()=>{
 const workbench=read('pandora-os-catalog-workbench.js');
 const app=read('pandora-studio-app.js');
 const html=read('index.html');
 assert.match(html,/pandora-studio-catalog-safety\.js/);
 assert.match(app,/getHero:\(\)=>Number\.isInteger\(state\.race\)/);
 assert.match(workbench,/const modelCheck=safety\.check\(combined\)/);
 assert.match(workbench,/publish\.disabled=!ready\|\|!acknowledged\|\|preview\?\.validation\?\.ok!==true/);
 assert.match(workbench,/const files=root\.PandoraCatalogImport\?\.files/);
 assert.match(workbench,/review\.strictEqual\(data,expected\?\.\[name\]\)/);
 assert.match(workbench,/const check=safety\.check\(received\)/);
 assert.match(workbench,/await finalizePublication\(result\.active,staged\.combined,\{superseded\}\)/);
 assert.match(workbench,/await finalizePublication\(observed\.active,staged\.combined,\{recovered:true\}\)/);
 assert.match(workbench,/formulaRows\.append/);
});

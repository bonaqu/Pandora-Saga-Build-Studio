import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');

const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
Function('window',read('pandora-studio-skill-progression.js'))(host);
const C=host.PandoraOSCalculator,P=host.PandoraSkillProgression;
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const view={};
Function('window','document',read('pandora-studio-hero-book.js'))(
 view,{documentElement:{lang:'ru'}});
const rows=calc=>new Map(view.PandoraStageAttributes.summaryRows(calc)
 .flatMap(group=>group.rows.map(row=>[row.ru,row.value])));

function archer(allocation={},techniqueTrained=0){
 return C.base({
  classData:classes.ARCHER,raceData:tables.raceInit.ELF,
  jobData:tables.jobInit.SCOUT,level:45,
  allocation:{vit:0,str:0,agi:0,dex:0,spi:0,int:0,...allocation},
  combatContext:{jobKey:'ARCHER',techniqueInnate:0,techniqueTrained}
 });
}
test('9→10→20 absolute DEX changes critical chance at every confirmed Remaked threshold',()=>{
 // ELF + SCOUT begin at 6 DEX; spend 3, 4 and 14.
 const results=[3,4,14].map(dex=>archer({dex},0));
 assert.deepEqual(results.map(x=>x.stats.dex),[9,10,20]);
 assert.deepEqual(results.map(x=>x.combat.critical.base),[1,2,3]);
 assert.deepEqual(results.map(x=>rows(x).get('Шанс крита')),[1,2,3]);
 for(const c of results)assert.equal(rows(c).get('Точность'),c.combat.accuracy.known);
});
test('85→65 actual green Tactics changes Archer accuracy by two, not untrained potential',()=>{
 const state={masteryAuto:false,masteryFormat:2,
  points:{archery:50,alchemy:26},
  mastery:{archery:55,alchemy:30}};
 const innate=tables.jobInit.SCOUT.branches,caps=classes.ARCHER.branchCaps;
 const green=()=>P.combatMasteries(state,innate,caps).techniqueTrained;
 assert.equal(green(),85);
 const at85=archer({dex:3},green());
 assert.equal(P.setTrained(state,'alchemy',10,innate,caps),true);
 assert.equal(green(),65);
 const at65=archer({dex:3},green());
 assert.equal(at85.combat.accuracy.known-at65.combat.accuracy.known,2);
 assert.equal(rows(at85).get('Точность')-rows(at65).get('Точность'),2);
 assert.equal(P.combatMasteries({...state,masteryAuto:true},innate,caps).techniqueTrained,91); // Auto also includes innate Assassin 3 + Warding 3
});
test('all six base stat investments affect their supported final computed outputs',()=>{
 const base=archer();
 const vit=archer({vit:10}),str=archer({str:10}),agi=archer({agi:20}),
  dex=archer({dex:15}),spi=archer({spi:10}),int=archer({int:40}); // Cross floor(INT²/1000) threshold
 assert.ok(vit.hp>base.hp,'VIT must increase HP');
 assert.ok(str.combat.attack.known>base.combat.attack.known,'STR must increase ATK');
 assert.ok(agi.combat.dodge.known>base.combat.dodge.known,'AGI must increase dodge');
 assert.ok(agi.combat.attackSpeed.known>base.combat.attackSpeed.known,'AGI must increase attack speed');
 assert.ok(dex.combat.critical.known>base.combat.critical.known,'DEX must increase crit');
 assert.ok(dex.combat.accuracy.known>base.combat.accuracy.known,'DEX must increase accuracy');
 assert.ok(spi.mp>base.mp,'SPI must increase MP');
 assert.ok(int.combat.manaCost.remaining<base.combat.manaCost.remaining,'INT must reduce MP cost');
});
test('Origin and trained/allocated skill changes must invalidate the OPEN Book',()=>{
 const app=read('pandora-studio-app.js');
 const start=app.indexOf('function renderOriginVitals(calculated=undefined){');
 const end=app.indexOf('function renderVitalsEnhancements(calculated=undefined){',start);
 assert.ok(start>=0&&end>start);
 assert.match(app.slice(start,end),/refreshOpenHeroBook\(calculated\);/);
 assert.match(app,/function refreshOpenHeroBook\(calculated=undefined\)\{\s*if\(stageAttributesPage&&!stageSlotPickerOpen\)renderStageAttributes\(calculated\)/);
 assert.match(app,/function renderStageAttributes\(calculated=undefined\)/);
 assert.match(app,/const bookModifiers=calculated===undefined\?previewBaseStats\(\):calculated/);
 assert.match(app,/modifiers:bookModifiers/);
 assert.match(app,/targetSkillDamages=stageAttributesPage==='effects'/);
 assert.match(app,/if\(allocationChanged&&!final\)refreshOpenHeroBook\(\)/);
 assert.match(app,/if\(!final\)refreshOpenHeroBook\(\)/);
 assert.match(app,/function setAttributePoints[\s\S]*?renderOriginVitals\(\)/);
 assert.match(app,/\$\('pathResetPoints'\)\.onclick=[\s\S]*?renderOriginVitals\(\)/);
 assert.match(app,/\$\('pathAutoMastery'\)\.onchange=[\s\S]*?renderOriginVitals\(\)/);
 assert.match(app,/updateGrade:n=>[\s\S]*?renderOriginVitals\(\)/);
 assert.match(app,/assignSoul:entry=>[\s\S]*?renderOriginVitals\(\)/);
});

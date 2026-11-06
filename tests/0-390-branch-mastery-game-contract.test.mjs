import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const models={};
for(const path of ['pandora-studio-skill-progression.js','pandora-os-character-calculator.js'])
 Function('window',read(path))(models);
const M=models.PandoraSkillProgression,OS=models.PandoraOSCalculator;
const table=JSON.parse(read('data/os/tables.json'));
const classes=JSON.parse(read('data/os/classes.json'));
function job(name,opts={}){
 const klass=classes[name],innate=table.jobInit[klass.baseClass||name]?.branches||{};
 return {state:{level:1,points:{},mastery:{},masteryFormat:2,masteryAuto:false,...opts},
  innate,caps:klass.branchCaps};
}
test('all 28 jobs: source-backed starting skill points but zero green before training',()=>{
 assert.equal(Object.keys(classes).length,28);
 for(const key of Object.keys(classes)){
  const {state,innate,caps}=job(key);
  for(const branch of Object.keys(caps)){
   const start=M.branchBase(innate,branch);
   assert.equal(M.potential(state,branch),0,key+': '+branch+' free spent');
   assert.equal(M.branchMastery(state,branch,innate,caps),0,key+': '+branch+' manual green starts at 0');
   assert.equal(M.branchPotential(state,branch,innate,caps),
    caps[branch]?Math.min(caps[branch],start):0,key+': '+branch+' allocated start');
   state.masteryAuto=true;
   assert.equal(M.branchMastery(state,branch,innate,caps),
    M.branchPotential(state,branch,innate,caps),key+': '+branch+' auto trains actual allocation only');
   state.masteryAuto=false;
  }
  assert.equal(M.spending(table.abilityPoint,1,state.points).total,0);
 }
});
test('Warrior at level 1 has 5/2/5/2/4 + Archery 1 branch points and ZERO manual green',()=>{
 const {state,innate,caps}=job('WARRIOR');
 for(const [branch,start,limit] of [
  ['slash',5,25],['thrust',2,25],['brush',5,25],['blow',2,20],
  ['defense',4,25],['archery',1,5]]){
  assert.equal(M.branchBase(innate,branch),start);
  assert.equal(M.classLimit(branch,caps),limit);
  assert.equal(M.branchPotential(state,branch,innate,caps),start);
  assert.equal(M.branchMastery(state,branch,innate,caps),0);
  state.masteryAuto=true;
  assert.equal(M.branchMastery(state,branch,innate,caps),start);
  state.masteryAuto=false;
 }
});
test('level 4: 5 starting slash + 3 spent = 8 available, green can be any 0..8',()=>{
 const {state,innate,caps}=job('WARRIOR',{level:4});
 assert.equal(M.spending(table.abilityPoint,4,state.points).total,3);
 assert.equal(M.setPotential(state,'slash',3,innate,caps),true);
 assert.equal(M.branchPotential(state,'slash',innate,caps),8);
 assert.equal(M.branchMastery(state,'slash',innate,caps),0);
 assert.equal(M.setTrained(state,'slash',8,innate,caps),true);
 assert.equal(M.branchMastery(state,'slash',innate,caps),8);
 assert.equal(M.setTrained(state,'slash',0,innate,caps),true);
 assert.equal(M.branchMastery(state,'slash',innate,caps),0);
 assert.equal(M.setTrained(state,'slash',9,innate,caps),false);
 M.setAuto(state,true,[],innate,caps);
 assert.equal(M.branchMastery(state,'slash',innate,caps),8);
 M.setAuto(state,false,[],innate,caps);
 assert.equal(M.branchMastery(state,'slash',innate,caps),0);
 assert.equal(M.spending(table.abilityPoint,4,state.points).spent,3);
});
test('Sniper archery 72 points and 34 green; autogreen 72, manually restored to 34',()=>{
 const {state,innate,caps}=job('SNIPER',{level:45});
 const base=M.branchBase(innate,'archery'),extra=72-base;
 assert.ok(extra>=0&&extra<=M.spending(table.abilityPoint,45,state.points).total);
 assert.equal(M.setPotential(state,'archery',extra,innate,caps),true);
 assert.equal(M.branchPotential(state,'archery',innate,caps),72);
 assert.equal(M.setTrained(state,'archery',34,innate,caps),true);
 assert.equal(M.branchMastery(state,'archery',innate,caps),34);
 M.setAuto(state,true,[],innate,caps);
 assert.equal(M.branchMastery(state,'archery',innate,caps),72);
 M.setAuto(state,false,[],innate,caps);
 assert.equal(M.branchMastery(state,'archery',innate,caps),34);
});
test('class caps and 90 hard maximum apply to increases; prior over-cap builds can refund',()=>{
 const {state,innate,caps}=job('WARRIOR',{level:55});
 assert.equal(M.setPotential(state,'slash',20,innate,caps),true);
 assert.equal(M.branchPotential(state,'slash',innate,caps),25);
 assert.equal(M.setPotential(state,'slash',21,innate,caps),false);
 assert.equal(M.setPotential(state,'slash',100,innate,caps),false);
 const late=job('JUGGERNAUT',{level:55});
 const native=M.branchBase(late.innate,'slash');
 assert.equal(M.setPotential(late.state,'slash',90-native,late.innate,late.caps),true);
 assert.equal(M.branchPotential(late.state,'slash',late.innate,late.caps),90);
 assert.equal(M.setPotential(late.state,'slash',91-native,late.innate,late.caps),false);
 late.state.points.slash=100;
 assert.equal(M.setPotential(late.state,'slash',90-native,late.innate,late.caps),true,
  'refund oversized legacy skill allocation');
});
test('legacy explicit additional-green values migrate without turning an empty field into innate green',()=>{
 const {state,innate,caps}=job('WARRIOR',{
  masteryFormat:1,points:{slash:3,thrust:0},mastery:{slash:2},masteryAuto:false
 });
 assert.equal(M.branchMastery(state,'slash',innate,caps),7,'legacy displayed 5+2');
 assert.equal(M.branchMastery(state,'thrust',innate,caps),0,'absent mastery stays zero');
 M.setAuto(state,true,[],innate,caps);
 assert.equal(state.masteryFormat,2);
 assert.equal(state.mastery.slash,7);
 M.setAuto(state,false,[],innate,caps);
 assert.equal(M.branchMastery(state,'slash',innate,caps),7);
 assert.equal(M.branchMastery(state,'thrust',innate,caps),0);
});
test('Prayer and technique per-ten bonuses depend on GREEN, never starting branch points',()=>{
 const cleric=job('CLERIC');
 assert.equal(M.prayerAdeptness(cleric.state,cleric.innate,cleric.caps),0);
 const spiritAtZero=M.legacyPrayerSpirit('CLERIC',cleric.state,cleric.innate,cleric.caps);
 assert.equal(M.setPotential(cleric.state,'benevolence',5,cleric.innate,cleric.caps),true);
 assert.equal(M.setTrained(cleric.state,'benevolence',10,cleric.innate,cleric.caps),true);
 assert.equal(M.legacyPrayerSpirit('CLERIC',cleric.state,cleric.innate,cleric.caps),spiritAtZero+1);
 const sniper=job('SNIPER');
 const accuracy=(green)=>{
  M.setAuto(sniper.state,false,[],sniper.innate,sniper.caps);
  M.setTrained(sniper.state,'archery',green,sniper.innate,sniper.caps);
  const mastery=M.combatMasteries(sniper.state,sniper.innate,sniper.caps);
  return OS.combatPreview({stats:{dex:10,agi:10,str:10},level:45,jobKey:'SNIPER',
   techniqueInnate:mastery.techniqueInnate,techniqueTrained:mastery.techniqueTrained})?.accuracy?.passive;
 };
 M.setPotential(sniper.state,'archery',20,sniper.innate,sniper.caps);
 const before=accuracy(0),after=accuracy(10);
 assert.ok(Number.isFinite(before)&&Number.isFinite(after));
 assert.equal(after-before,1,'+1 accuracy per 10 actual green technique for applicable class');
});
test('fixed 90 scale has a single non-innate green overlay and +/- hold controls',()=>{
 const js=read('pandora-studio-hero-path.js'),css=read('pandora-studio-theme.css');
 assert.match(js,/const visualMax=90/);
 assert.match(js,/green\.style\.width=widthOnRail\(greenFraction\)/);
 assert.match(js,/gold\.style\.width=widthOnRail\(goldFraction\)/);
 assert.doesNotMatch(js,/const innateFraction=|track\.append\(innateFill\)/);
 assert.doesNotMatch(css,/\.path-innate-fill\{/);
 assert.match(js,/function bindPathHoldStep/);
 assert.match(js,/setInterval\(run,85\)/);
 assert.match(js,/data-branch-control/);
 assert.match(css,/\.path-point-stepper\{/);
});

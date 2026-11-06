import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};
for(const path of ['pandora-studio-skill-progression.js','pandora-studio-attribute-progression.js',
 'pandora-os-character-calculator.js'])
 Function('window',read(path))(root);
Function('window','document',read('pandora-studio-hero-path.js'))(root,{
 createElement:tag=>({tag,children:[],append(){},addEventListener(){},setAttribute(){}}),
 createTextNode:text=>({textContent:String(text)})
});
const S=root.PandoraSkillProgression,A=root.PandoraAttributeProgression,
 O=root.PandoraOSCalculator,H=root.PandoraHeroPath,
 tables=JSON.parse(read('data/os/tables.json')),
 classes=JSON.parse(read('data/os/classes.json')),
 app=read('pandora-studio-app.js'),html=read('index.html');

test('live-observed ENKIDU WARRIOR base stats and dual point budgets',()=>{
 assert.deepEqual(A.base(tables,'ENKIDU','WARRIOR'),[10,9,3,5,5,2]);
 for(const [level,stats,skills]of [[1,0,0],[2,6,1],[3,12,2],[4,18,3],[45,432,104],[55,544,134]]){
  assert.equal(A.budget(level),stats,'attribute points at '+level);
  const s=S.spending(tables.abilityPoint,level,{slash:0});
  assert.equal(s.total,skills,'free skill points at '+level);
 }
 assert.equal(tables.abilityPoint[2],2,
  'Archived table field is NOT the verified spendable skill budget');
});

test('all four root classes preserve starting allocations but zero manual green',()=>{
 const expected={
  WARRIOR:{slash:5,thrust:2,brush:5,blow:2,defense:4,archery:1},
  SCOUT:{slash:4,archery:5,alchemy:4,assassin:3,warding:3},
  ACOLYTE:{blow:2,defense:2,benevolence:5,blessing:5,exorcism:5},
  MAGE:{slash:2,blow:2,element:5,embody:5,charm:5}
 };
 for(const [job,start] of Object.entries(expected)){
  assert.deepEqual(tables.jobInit[job].branches,start,job);
  const state={level:1,masteryFormat:2,masteryAuto:false,points:{},mastery:{}};
  assert.equal(S.spending(tables.abilityPoint,1,state.points).spent,0);
  for(const [branch,value]of Object.entries(start)){
   assert.equal(S.branchBase(start,branch),value);
   assert.equal(S.branchPotential(state,branch,start,classes[job].branchCaps),value);
   assert.equal(S.branchMastery(state,branch,start,classes[job].branchCaps),0);
   state.masteryAuto=true;
   assert.equal(S.branchMastery(state,branch,start,classes[job].branchCaps),value);
   state.masteryAuto=false;
  }
 }
 assert.match(app,/mastery:\{\},masteryFormat:2,masteryAuto:false,stats:/);
});

test('actual game: branch start 5, manual green 0..5; each extra point extends both ceilings to 6',()=>{
 const innate=tables.jobInit.WARRIOR.branches,caps=classes.WARRIOR.branchCaps;
 const state={level:1,masteryFormat:2,points:{slash:0},mastery:{},masteryAuto:false};
 assert.equal(S.branchBase(innate,'slash'),5);
 assert.equal(S.branchPotential(state,'slash',innate,caps),5);
 assert.equal(S.branchMastery(state,'slash',innate,caps),0);
 assert.equal(S.trainedLimit(state,'slash',innate,caps),5);
 assert.equal(S.setTrained(state,'slash',5,innate,caps),true);
 assert.equal(S.setTrained(state,'slash',6,innate,caps),false);
 state.level=2;
 assert.equal(S.setPotential(state,'slash',1,innate,caps),true);
 assert.equal(S.branchPotential(state,'slash',innate,caps),6);
 assert.equal(S.setTrained(state,'slash',6,innate,caps),true);
 assert.equal(S.spending(tables.abilityPoint,2,state.points).remaining,0);
 S.setPotential(state,'slash',0,innate,caps);
 assert.equal(S.branchMastery(state,'slash',innate,caps),5,
  'refunding reduces manual green only to the remaining branch level');
 assert.equal(S.spending(tables.abilityPoint,2,state.points).remaining,1);
});

test('auto green fills actual branch level; switching off restores manually trained zero or value',()=>{
 const innate=tables.jobInit.WARRIOR.branches,caps=classes.WARRIOR.branchCaps;
 const state={level:1,masteryFormat:2,masteryAuto:false,points:{slash:0},mastery:{}};
 assert.equal(S.branchPotential(state,'slash',innate,caps),5);
 assert.equal(S.branchMastery(state,'slash',innate,caps),0);
 S.setAuto(state,true,['slash'],innate,caps);
 for(const [branch,base] of Object.entries(innate))
  assert.equal(S.branchMastery(state,branch,innate,caps),base,branch);
 S.setAuto(state,false,['slash'],innate,caps);
 assert.equal(S.branchMastery(state,'slash',innate,caps),0);
 state.level=2;
 S.setPotential(state,'slash',1,innate,caps);
 S.setTrained(state,'slash',4,innate,caps);
 S.setAuto(state,true,['slash'],innate,caps);
 assert.equal(S.branchMastery(state,'slash',innate,caps),6);
 assert.equal(S.branchPotential(state,'slash',innate,caps),6);
 S.setAuto(state,false,['slash'],innate,caps);
 assert.equal(S.branchMastery(state,'slash',innate,caps),4);
 assert.equal(S.setTrained(state,'slash',7,innate,caps),false);
});

test('all 28 careers auto-on L1 preserve innate levels and zero level-up spending',()=>{
 for(const [job,cls] of Object.entries(classes)){
  const innate=tables.jobInit[cls.baseClass||job]?.branches||{};
  const state={level:1,masteryAuto:true,points:{},mastery:{}};
  assert.equal(S.spending(tables.abilityPoint,1,state.points).spent,0,job);
  for(const [branch,cap] of Object.entries(cls.branchCaps||{})){
   const innateLevel=S.branchBase(innate,branch);
   assert.equal(S.branchMastery(state,branch,innate,cls.branchCaps),innateLevel,
    job+' '+branch+' should show class starting value, not '+cap);
  }
 }
});

test('skill learning checks branch points, never demands green before the first usable skill',()=>{
 const innate=tables.jobInit.WARRIOR.branches,caps=classes.WARRIOR.branchCaps;
 const state={level:1,masteryFormat:2,masteryAuto:false,points:{slash:0},mastery:{}};
 const api={state,innate,branchCaps:caps,job:'WARRIOR',lang:'ru',
  cap:k=>caps[k]??0,branchName:k=>k,skillCatalog:[]};
 const skill=amount=>({id:amount,name:'Порог',classes:{WARRIOR:1},
  charLevel:1,reqs:[{branch:'slash',amount}]});
 assert.equal(H.readiness(skill(5),api).learned,true,'five starting branch points, no green');
 assert.equal(H.readiness(skill(6),api).learned,false);
 assert.equal(S.setPotential(state,'slash',1,innate,caps),true);
 assert.equal(H.readiness(skill(6),api).learned,true,'six available even when green is zero');
 assert.equal(H.readiness(skill(26),api).learned,false,'Warrior hard cap 25');
 assert.equal(H.readiness({...skill(1),reqs:[{branch:'element',amount:1}]},api).learned,false,
  'a Warrior cannot unlock a blocked magic branch');
});

test('Inspiration increments every 10 actual green Prayer, independent of initial branch points',()=>{
 const innate=tables.jobInit.ACOLYTE.branches,caps=classes.PRIEST.branchCaps;
 const state={masteryFormat:2,masteryAuto:false,points:{benevolence:0},mastery:{}};
 assert.equal(S.prayerAdeptness(state,innate,caps),0);
 assert.equal(S.legacyPrayerSpirit('PRIEST',state,innate,caps),1);
 assert.equal(S.legacyPrayerSpirit('WARRIOR',state,innate,caps),0);
 S.setPotential(state,'benevolence',5,innate,caps);
 S.setTrained(state,'benevolence',10,innate,caps);
 assert.equal(S.prayerAdeptness(state,innate,caps),10);
 assert.equal(S.legacyPrayerSpirit('PRIEST',state,innate,caps),2);
});

test('ten green Technique boosts Archer accuracy one point, not Warrior',()=>{
 const innate=tables.jobInit.SCOUT.branches,caps=classes.ARCHER.branchCaps;
 const state={masteryFormat:2,masteryAuto:false,points:{archery:0},mastery:{}};
 const first=S.combatMasteries(state,innate,caps);
 assert.equal(first.techniqueInnate,0);
 assert.equal(first.techniqueTrained,0);
 S.setPotential(state,'archery',5,innate,caps);
 S.setTrained(state,'archery',10,innate,caps);
 const second=S.combatMasteries(state,innate,caps);
 assert.equal(second.techniqueInnate,0);
 assert.equal(second.techniqueTrained,10);
 const preview=(jobKey,technique)=>O.combatPreview({
  stats:{vit:10,str:10,agi:10,dex:10,spi:10,int:10},
  level:45,jobKey,techniqueInnate:technique.techniqueInnate,
  techniqueTrained:technique.techniqueTrained
 });
 assert.equal(preview('ARCHER',second).accuracy.known-preview('ARCHER',first).accuracy.known,1);
 assert.equal(preview('WARRIOR',second).accuracy.known-preview('WARRIOR',first).accuracy.known,0);
});

test('hero skill search is never exposed as login, including static search input',()=>{
 const tag=html.match(/<input\s+id="pathSkillSearch"[^>]*>/)?.[0];
 assert.ok(tag);
 for(const attr of ['autocomplete="off"','name="ps-hero-skill-filter"',
  'data-lpignore="true"','data-1p-ignore="true"','data-bwignore="true"',
  'data-form-type="other"','aria-autocomplete="none"'])
  assert.ok(tag.includes(attr),'missing '+attr);
 assert.match(app,/guardEncyclopediaSearch\(\$\('pathSkillSearch'\)\)/);
 assert.match(app,/attrs\['data-auth-field'\]==='true'/);
});

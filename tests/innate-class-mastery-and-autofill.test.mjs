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

test('all four root classes preserve source innate green values at level 1',()=>{
 const expected={
  WARRIOR:{slash:5,thrust:2,brush:5,blow:2,defense:4,archery:1},
  SCOUT:{slash:4,archery:5,alchemy:4,assassin:3,warding:3},
  ACOLYTE:{blow:2,defense:2,benevolence:5,blessing:5,exorcism:5},
  MAGE:{slash:2,blow:2,element:5,embody:5,charm:5}
 };
 for(const [job,inborn]of Object.entries(expected)){
  assert.deepEqual(tables.jobInit[job].branches,inborn,job);
  const state={level:1,masteryAuto:false,points:{},mastery:{}};
  assert.equal(S.spending(tables.abilityPoint,1,state.points).spent,0);
  for(const [branch,base]of Object.entries(inborn)){
   assert.equal(S.branchBase(inborn,branch),base);
   assert.equal(S.branchMastery(state,branch,inborn,classes[job].branchCaps),base);
   assert.equal(S.branchPotential(state,branch,inborn,classes[job].branchCaps),
    classes[job].branchCaps[branch]);
  }
 }
 assert.match(app,/mastery:\{\},masteryAuto:false,stats:/,
  'a new hero starts with only innate green, not artificially maximized mastery');
});

test('Remaked P plus invested defines trainable green; no need to spend at first level',()=>{
 const innate=tables.jobInit.WARRIOR.branches,caps=classes.WARRIOR.branchCaps;
 const state={level:1,points:{slash:0},mastery:{},masteryAuto:false};
 assert.equal(S.branchBase(innate,'slash'),5);
 assert.equal(S.branchPotential(state,'slash',innate,caps),25);
 assert.equal(S.branchMastery(state,'slash',innate,caps),5);
 assert.equal(S.trainedLimit(state,'slash',innate,caps),20);
 assert.equal(S.setTrained(state,'slash',20,innate,caps),true,
  'training can reach native P=25 without spending any free points');
 assert.equal(S.branchMastery(state,'slash',innate,caps),25);
 assert.equal(S.setTrained(state,'slash',21,innate,caps),false);
 assert.equal(S.spending(tables.abilityPoint,1,state.points).spent,0);
 state.level=2;S.setPotential(state,'slash',1,innate,caps);
 assert.equal(S.branchPotential(state,'slash',innate,caps),26);
 assert.equal(S.setTrained(state,'slash',21,innate,caps),true);
 assert.equal(S.branchMastery(state,'slash',innate,caps),26);
 assert.equal(S.spending(tables.abilityPoint,2,state.points).remaining,0);
 S.setPotential(state,'slash',0,innate,caps);
 assert.equal(S.branchMastery(state,'slash',innate,caps),25,
  'refund clamps trained mastery to class P, not to zero');
 assert.equal(S.spending(tables.abilityPoint,2,state.points).remaining,1);
});

test('automatic training fills P+invested only when explicitly enabled',()=>{
 const innate=tables.jobInit.WARRIOR.branches,caps=classes.WARRIOR.branchCaps;
 const state={masteryAuto:false,points:{slash:1},mastery:{}};
 assert.equal(S.branchMastery(state,'slash',innate,caps),5);
 S.setAuto(state,true,['slash'],innate,caps);
 assert.equal(S.branchMastery(state,'slash',innate,caps),26);
 S.setAuto(state,false,['slash'],innate,caps);
 assert.equal(state.mastery.slash,21);
 assert.equal(S.setTrained(state,'slash',0,innate,caps),true);
 assert.equal(S.branchMastery(state,'slash',innate,caps),5);
});

test('skill unlocks count innate green and P, but reject unavailable branches',()=>{
 const innate=tables.jobInit.WARRIOR.branches,caps=classes.WARRIOR.branchCaps;
 const state={level:1,masteryAuto:false,points:{slash:0},mastery:{}};
 const api={state,innate,branchCaps:caps,job:'WARRIOR',lang:'ru',
  cap:k=>caps[k]??0,branchName:k=>k,skillCatalog:[]};
 const skill=amount=>({id:amount,name:'Проверка порога',classes:{WARRIOR:1},
  charLevel:1,reqs:[{branch:'slash',amount}]});
 assert.equal(H.readiness(skill(5),api).learned,true,'innate first-level green meets 5');
 assert.equal(H.readiness(skill(6),api).learned,false);
 assert.equal(S.setTrained(state,'slash',1,innate,caps),true);
 assert.equal(H.readiness(skill(6),api).learned,true);
 assert.equal(H.readiness(skill(26),api).learned,false,'P=25, cannot reach 26 without points');
 S.setPotential(state,'slash',1,innate,caps);
 S.setTrained(state,'slash',21,innate,caps);
 assert.equal(H.readiness(skill(26),api).learned,true);
 assert.equal(H.readiness({...skill(1),reqs:[{branch:'element',amount:1}]},api).learned,false,
  'a warrior cannot unlock a zero-potential Magic branch');
});

test('inspiration derives Spirit from full Prayer green each ten, not allocated points',()=>{
 const innate=tables.jobInit.ACOLYTE.branches,caps=classes.PRIEST.branchCaps;
 const state={masteryAuto:false,points:{benevolence:0},mastery:{}};
 assert.equal(S.prayerAdeptness(state,innate,caps),15);
 assert.equal(S.legacyPrayerSpirit('PRIEST',state,innate,caps),2);
 assert.equal(S.legacyPrayerSpirit('CLERIC',state,innate,caps),2);
 assert.equal(S.legacyPrayerSpirit('WARRIOR',state,innate,caps),0);
 S.setTrained(state,'benevolence',10,innate,caps);
 assert.equal(S.prayerAdeptness(state,innate,caps),25);
 assert.equal(S.legacyPrayerSpirit('PRIEST',state,innate,caps),3);
 assert.equal(S.spending(tables.abilityPoint,1,state.points).spent,0);
});

test('Technique trained ten changes Archer accuracy by one, never universally',()=>{
 const innate=tables.jobInit.SCOUT.branches,caps=classes.ARCHER.branchCaps;
 const state={masteryAuto:false,points:{archery:0},mastery:{}};
 const first=S.combatMasteries(state,innate,caps);
 assert.equal(first.techniqueInnate,15);
 assert.equal(first.techniqueTrained,0);
 S.setTrained(state,'archery',10,innate,caps);
 const second=S.combatMasteries(state,innate,caps);
 assert.equal(second.techniqueInnate,15);
 assert.equal(second.techniqueTrained,10);
 const preview=(jobKey,technique)=>O.combatPreview({
  stats:{vit:10,str:10,agi:10,dex:10,spi:10,int:10},
  level:45,jobKey,techniqueInnate:technique.techniqueInnate,
  techniqueTrained:technique.techniqueTrained
 });
 const archer0=preview('ARCHER',first),archer10=preview('ARCHER',second);
 const warrior0=preview('WARRIOR',first),warrior10=preview('WARRIOR',second);
 assert.ok(archer0?.accuracy&&archer10?.accuracy&&warrior0?.accuracy&&warrior10?.accuracy);
 assert.equal(archer10.accuracy.known-archer0.accuracy.known,1);
 assert.equal(warrior10.accuracy.known-warrior0.accuracy.known,0);
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

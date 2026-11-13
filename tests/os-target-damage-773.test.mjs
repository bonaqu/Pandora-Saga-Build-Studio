import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-studio-target-damage.js'))(host);
const OS=host.PandoraOSTargetDamage;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const monsters=JSON.parse(read('data/os/monsters.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const itemForth=JSON.parse(read('data/os/itemForth.json'));
const unison=JSON.parse(read('data/os/unison.json'));
const english=JSON.parse(read('data/os/strings.en.json'));
const mods=rate=>({combat:{spellDamageEquipmentRate:rate,priestSong:{}},priestApplied:{}});
const fixture=(overrides={})=>({skillCatalog:skills,classes,jobKey:'WARLOCK',
 level:45,masteries:{element:70,exorcism:20,darkness:25,charm:20},
 branchCaps:classes.WARLOCK.branchCaps,stats:{dex:65,int:80,spi:50},
 equipment:[],tables,itemForth,unison,modifiers:mods(0),...overrides});
const hitList=opts=>OS.supportedSkillHits(fixture(opts));
const packet=(hits,id)=>hits.find(x=>x.skillId===id);
const compact=hits=>hits.map(x=>[x.skillId,x.min,x.average,x.max]);
const newIds=[330001001,410011001,410012001,410021001,410023001,420003001];
test('OS web calculator Et→kt→Ie→ve→Tt, all six newly verified skill hits',()=>{
 const result=hitList();
 assert.deepEqual(compact(result),[
  [410001001,5,22,29],
  [330001001,2,10,17],
  [410011001,1,7,11],
  [410012001,12,56,79],
  [410021001,1,10,22],
  [410023001,4,30,54],
  [420003001,4,18,23],
  [430001001,10,48,71],
  [430052001,1,5,9]
 ]);
 for(const id of newIds){
  const row=packet(result,id);
  assert.ok(row);
  assert.equal(row.monsterId,22104);
  assert.equal(row.targetName,monsters['22104'].name);
  assert.equal(row.levelPenalty,24);
  assert.equal(row.heroInt,80);
  assert.equal(english.skills[String(id)].n.length>0,true);
  assert.equal(row.element,skills[String(id)].element.toLowerCase());
  assert.equal(row.heroMasteryKey,skills[String(id)].branch);
  assert.equal(row.heroPowerKey,id===420003001?'spi':'int');
 }
 for(const school of ['fire','cold','lightning','charm','holy','dark'])
  assert.equal(OS.target.resists[school],monsters['22104'].resists[school]);
});
test('Learnability: green mastery, source class and character level independently gate hits',()=>{
 const none=hitList({masteries:{element:0,exorcism:0,darkness:0,charm:0}});
 assert.deepEqual(none.map(x=>x.skillId),[410001001,410021001,410023001]);
 const unlocked=hitList({masteries:{element:20,exorcism:7,darkness:0,charm:11}});
 assert.deepEqual(unlocked.map(x=>x.skillId),
  [410001001,410011001,410021001,410023001]);
 const lowLevel=hitList({jobKey:'MAGE',level:11,branchCaps:classes.MAGE.branchCaps,
  masteries:{element:20}});
 assert.deepEqual(lowLevel.map(x=>x.skillId),[410001001,410011001]);
 const twelve=hitList({jobKey:'MAGE',level:12,branchCaps:classes.MAGE.branchCaps,
  masteries:{element:20}});
 assert.deepEqual(twelve.map(x=>x.skillId),[410001001,410011001,410021001]);
 const priest=hitList({jobKey:'PRIEST',branchCaps:classes.PRIEST.branchCaps,
  masteries:{exorcism:20}});
 assert.deepEqual(priest.map(x=>x.skillId),[330001001]);
 assert.equal(packet(hitList({masteries:{element:70,exorcism:7,darkness:25,charm:20}}),
  330001001),undefined);
});
test('Source action snapshots reject mutation of direct or secondary effects',()=>{
 for(const id of newIds){
  const broken=structuredClone(skills);
  broken[String(id)].funcs[0].fv1[0]++;
  assert.equal(packet(hitList({skillCatalog:broken}),id),undefined,
   'Modified primary effect should fail closed for '+id);
  const record=skills[String(id)];
  if(record.funcs.length>1){
   const secondary=structuredClone(skills);
   secondary[String(id)].funcs[1].fv2[3]++;
   assert.equal(packet(hitList({skillCatalog:secondary}),id),undefined,
    'Changed extra status effect must invalidate source signature '+id);
  }
  const invalidReq=structuredClone(skills);
  invalidReq[String(id)].powerStat='STR';
  assert.equal(packet(hitList({skillCatalog:invalidReq}),id),undefined);
 }
});
test('True source elemental variance: cold 20%, lightning 50%, holy 25%, charm 0%',()=>{
 const hits=hitList();
 for(const [id,school] of [[330001001,'holy'],[410011001,'cold'],
  [410021001,'lightning'],[420003001,'charm']]){
  const item=packet(hits,id);
  assert.equal(item.element,school);
  assert.ok(item.average>=item.min);
  assert.ok(item.max>=item.average);
 }
 assert.equal(packet(hits,420003001).min,4);
 assert.equal(packet(hits,420003001).average,18);
 assert.equal(packet(hits,420003001).max,23);
});
test('School-specific equipment bonuses and magical refinement cannot leak',()=>{
 const baseline=hitList();
 const fire={record:{id:8001,slot:'weapon',effects:[
  {func:'EP_ELEMENT_DAMAGE_SCALE_FIRE',a:150}]},
  issue:[],refinement:0,souls:[],gem:null};
 const eFire=hitList({equipment:[fire]});
 assert.ok(packet(eFire,410001001).max>packet(baseline,410001001).max);
 for(const id of newIds)
  assert.equal(packet(eFire,id).max,packet(baseline,id).max);
 const cold={...fire,record:{id:8002,slot:'weapon',effects:[
  {func:'EP_ELEMENT_DAMAGE_SCALE_COLD',a:90}]}};
 const eCold=hitList({equipment:[cold]});
 for(const id of [410011001,410012001])
  assert.ok(packet(eCold,id).max>packet(baseline,id).max);
 for(const id of [330001001,410021001,410023001,420003001])
  assert.equal(packet(eCold,id).max,packet(baseline,id).max);
 const holy={...fire,record:{id:8003,slot:'weapon',effects:[
  {func:'EP_ELEMENT_DAMAGE_SCALE_HOLY',a:90}]}};
 const eHoly=hitList({equipment:[holy]});
 assert.ok(packet(eHoly,330001001).max>packet(baseline,330001001).max);
 assert.equal(packet(eHoly,410011001).max,packet(baseline,410011001).max);
 const coldGem=hitList({equipment:[{...fire,record:{id:8004,slot:'weapon',effects:[]},
  refinement:8,gem:{type:'magical',element:'cold'}}]});
 assert.ok(packet(coldGem,410012001).max>packet(baseline,410012001).max);
 assert.equal(packet(coldGem,410001001).max,packet(baseline,410001001).max);
 const fakeSheet=hitList({modifiers:mods(100)});
 assert.equal(fakeSheet.length,0,'Out-of-sync equipment rate is unsafe');
});
test('Target damage is current hero only, no phantom sleep, freeze or knockdown damage',()=>{
 const base=hitList();
 const raised=hitList({stats:{dex:65,int:100,spi:70}});
 for(const id of newIds)
  assert.ok(packet(raised,id).max>=packet(base,id).max);
 assert.ok(packet(raised,420003001).max>packet(base,420003001).max);
 const book=read('pandora-studio-hero-book.js');
 for(const id of newIds)assert.match(book,new RegExp(String(id)));
 assert.doesNotMatch(book,/stage-material-actions|function materialSkillResults\(/);
 assert.equal(hitList().some(x=>x.skillId===410002001),false);
 assert.equal(hitList().some(x=>x.skillId===430053001),false);
 assert.equal(hitList().some(x=>x.skillId===410004001),false);
});

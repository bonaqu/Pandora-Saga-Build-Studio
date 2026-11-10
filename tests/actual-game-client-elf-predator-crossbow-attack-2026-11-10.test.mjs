import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scope={};
Function('window',read('pandora-os-character-calculator.js'))(scope);
const C=scope.PandoraOSCalculator;
const [items,tables,classes,itemForth,skills]=
 ['items','tables','classes','itemForth','skills'].map(k=>JSON.parse(read('data/os/'+k+'.json')));

// Direct player measurements: female Elf, PREDATOR (Охотник) level 45;
// no item Souls, no other combat buffs. Equipment unchanged across steps.
const worn=[11532,12041,14532,13532,15011,18001,22001,22001,21001];
const clothes=worn.map(id=>['item:'+id,items[id],0]);
const trained={slash:4,archery:41,alchemy:4,assassin:3,trap:21,warding:3};
const techniqueGreen=41+4+3+21+3;

function hunter(weaponId,grade,str){
 const weapon=items[weaponId];
 const records=[['item:'+weaponId,weapon,grade],...clothes];
 return C.base({
  classData:classes.PREDATOR,raceData:tables.raceInit.ELF,
  jobData:tables.jobInit.SCOUT,
  allocation:{vit:0,str:str-6,agi:0,dex:0,spi:0,int:0},
  level:45,records,itemForth,
  combatContext:{weapon,weaponGrade:grade,
   weaponPlus:tables.weaponPlus,magicPlus:tables.magicPlus,
   jobKey:'PREDATOR',skillCatalog:skills,
   branchMasteries:trained,meleeMastery:4,techniqueTrained:techniqueGreen}
 });
}

test('Hunter all-current equipment base STR6, DEF41, ACC72 and Dodge55',()=>{
 assert.equal(classes.PREDATOR.name,'Охотник');
 assert.equal(items[2442].W,79);
 assert.equal(items[2442].PEN,90);
 assert.equal(items[2411].W,67);
 assert.equal(items[2411].PEN,90);
 const r=hunter(2442,0,6);
 assert.ok(r);
 assert.deepEqual(r.stats,{vit:3,str:6,agi:8,dex:6,spi:7,int:7});
 assert.equal(r.combat.defense.known,41);
 assert.equal(r.combat.accuracy.known,72);
 assert.equal(r.combat.dodge.known,55);
 assert.deepEqual([r.combat.attack.minimum,r.combat.attack.known],[70,87]);
 assert.deepEqual([hunter(2411,0,6).combat.attack.minimum,
  hunter(2411,0,6).combat.attack.known],[60,75]);
});

test('Hunter strength20 and physical refinement +0/+1/+2 matches the client',()=>{
 for(const [id,grade,str,min,max] of [
  [2442,0,20,76,95],[2411,0,20,67,83],
  [2442,1,20,79,98],[2411,2,20,72,89]
 ]){
  const r=hunter(id,grade,str);
  assert.ok(r);
  assert.equal(r.stats.str,str);
  assert.deepEqual([r.combat.attack.minimum,r.combat.attack.known],[min,max],
   items[id].name+' grade='+grade+' STR='+str);
 }
});

test('Hunter two crossbows +1/+2 across STR22..30: all 18 full formula states',()=>{
 const fire=[[22,80,99],[23,80,99],[24,80,100],[25,80,100],
  [26,81,101],[27,81,101],[28,82,102],[29,82,102],[30,84,105]];
 const heavy=[[22,72,90],[23,72,90],[24,73,91],[25,73,91],
  [26,74,92],[27,74,92],[28,75,93],[29,75,93],[30,76,95]];
 for(const [id,grade,entries] of [[2442,1,fire],[2411,2,heavy]]){
  for(const [str,min,max] of entries){
   const r=hunter(id,grade,str);
   assert.ok(r);
   assert.equal(r.stats.str,str);
   assert.deepEqual([r.combat.attack.minimum,r.combat.attack.known],[min,max],
    items[id].name+' STR='+str);
  }
 }
});

test('actual green 41, not prior green 54, is used even when potential caps training',()=>{
 const progress={};
 Function('window',read('pandora-studio-skill-progression.js'))(progress);
 const P=progress.PandoraSkillProgression;
 const state={level:45,points:{archery:36},masteryAuto:false,masteryFormat:2,
  mastery:{archery:54}};
 const initial=tables.jobInit.SCOUT.branches,caps=classes.PREDATOR.branchCaps;
 assert.equal(P.branchMastery(state,'archery',initial,caps),41,
  'SCOUT starts archery5 and trained 54 is capped at current potential 41');
 const r=hunter(2442,1,30);
 assert.equal(r.combat.attack.minimumSpreadPercent,20);
});

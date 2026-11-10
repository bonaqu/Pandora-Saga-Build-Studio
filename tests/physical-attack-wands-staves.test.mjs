import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const context={};
Function('window',read('pandora-os-character-calculator.js'))(context);
const C=context.PandoraOSCalculator;
const [items,tables,classes,skills]=['items','tables','classes','skills']
 .map(type=>JSON.parse(read('data/os/'+type+'.json')));

// WAND and STAFF physical attack is separate from magical attack.
// Physical gems use tables.weaponPlus for the physical W refinement;
// magical gems must NOT also add physical weapon refinement.
const make=({id,green=15,grade=0,gemType='physical',str=30})=>{
 const weapon=items[id],raceData=tables.raceInit.HUMAN,jobData=tables.jobInit.MAGE;
 const raceAndClassSTR=raceData.str+jobData.str;
 assert.ok(str>=raceAndClassSTR);
 return C.base({
  classData:classes.MAGE,raceData,jobData,
  allocation:{vit:0,str:str-raceAndClassSTR,agi:0,dex:0,spi:0,int:0},
  level:40,records:[['item:'+id,weapon,grade]],
  gemSelections:grade?[{slot:'weapon',itemId:id,grade,
   gem:{type:gemType,element:'fire'}}]:[],
  combatContext:{weapon,weaponGrade:grade,
   weaponPlus:tables.weaponPlus,magicPlus:tables.magicPlus,
   jobKey:'MAGE',skillCatalog:skills,
   branchMasteries:{blow:green},meleeMastery:0,magicMastery:0,
   techniqueTrained:0}
 });
};

test('wands and staves use blow mastery and their own catalog physical PEN',()=>{
 for(const [id,pen] of [[2602,50],[2641,50],[2802,55],[2812,55],[2841,30]]){
  const weapon=items[id],r=make({id});
  assert.equal(weapon.PEN,pen);
  assert.ok(['WAND','STAFF'].includes(weapon.kind));
  assert.ok(r);
  const current=r.combat.attack;
  assert.equal(current.minimumVerified,true);
  assert.equal(current.minimumSpreadPercent,Math.floor(100*pen/(200+6*15)));
  assert.equal(current.minimum,current.known-
   Math.floor(current.known*current.minimumSpreadPercent/100));
 }
});

test('WAND and STAFF: physical gems increase MAX and MIN while magic gems do not increase physical W',()=>{
 for(const id of [2602,2802,2812]){
  const weapon=items[id],baseline=make({id,grade:0});
  const physical=make({id,grade:2,gemType:'physical'});
  const magical=make({id,grade:2,gemType:'magical'});
  for(const r of [baseline,physical,magical]){
   assert.ok(r,weapon.name);
   assert.equal(r.combat.attack.minimumVerified,true);
  }
  const refinement=Math.floor(weapon.W*tables.weaponPlus['2'].ratio/100)+
   tables.weaponPlus['2'].flat;
  assert.equal(physical.combat.attack.known-baseline.combat.attack.known,
   refinement,weapon.name+' physical +2');
  assert.equal(magical.combat.attack.known,baseline.combat.attack.known,
   weapon.name+' magical +2 does not grant physical refinement');
  assert.ok(physical.combat.attack.minimum>=baseline.combat.attack.minimum);
  assert.equal(magical.combat.attack.minimum,baseline.combat.attack.minimum);
  assert.equal(physical.combat.attack.minimum,
   physical.combat.attack.known-
   Math.floor(physical.combat.attack.known*
    Math.floor(100*weapon.PEN/(200+6*15))/100));
  assert.equal(magical.combat.magicAttack.refinement,tables.magicPlus['2'].ratio,
   weapon.name+' magical +2 only affects MATK preview');
  assert.equal(physical.combat.magicAttack.refinement,0,
   weapon.name+' physical +2 does not refine MATK');
 }
});

test('weapon branch skill changes range without changing physical maximum, including staff',()=>{
 for(const id of [2602,2802]){
  const untrained=make({id,green:0,grade:2});
  const trained=make({id,green:20,grade:2});
  assert.equal(untrained.combat.attack.known,trained.combat.attack.known);
  assert.ok(untrained.combat.attack.minimum<=trained.combat.attack.minimum);
  assert.ok(untrained.combat.attack.minimumSpreadPercent>
   trained.combat.attack.minimumSpreadPercent);
 }
});

test('Hero Book renders physical MIN–MAX for mage with staff and preserves separate MATK',()=>{
 const document={documentElement:{lang:'ru'}};
 const root={};
 Function('window','document',read('pandora-studio-hero-book.js'))(root,document);
 const out=make({id:2802,grade:2,gemType:'physical'});
 const rows=root.PandoraStageAttributes.summaryRows(out)
  .flatMap(group=>group.rows);
 const atk=rows.find(row=>row.ru==='АТК');
 const matk=rows.find(row=>row.ru==='МАТК');
 assert.ok(atk&&matk);
 assert.equal(atk.display,out.combat.attack.minimum+'–'+out.combat.attack.known);
 assert.equal(atk.value,out.combat.attack.known);
 assert.equal(matk.display,null);
 assert.equal(matk.value,out.combat.magicAttack.known);
});

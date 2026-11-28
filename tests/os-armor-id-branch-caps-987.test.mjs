import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const env={};
Function('window',read('pandora-os-character-calculator.js'))(env);
Function('window',read('pandora-studio-equipment-rules.js'))(env);
const C=env.PandoraOSCalculator,R=env.PandoraStudioRules;
const classes=JSON.parse(read('data/os/classes.json'));
const items=JSON.parse(read('data/os/items.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const stats0={vit:0,str:0,agi:0,dex:0,spi:0,int:0};

test('spoofed equipment ID cannot inflate base AC or grade defense',()=>{
 const fake={id:778,name:'Forged armor',slot:'body',AC:100,
  effects:[{func:'EP_ARMORCLASS_CONST',a:50}]};
 for(const [source,record] of [
  ['item:777',fake],
  ['item:777',{...fake,id:undefined}],
  ['item:777',{...fake,id:'777'}],
  ['item:00777',{...fake,id:777}]
 ]){
  assert.deepEqual(C.sourceEffects(source,record,7),[],
   'source ID mismatch must reject structured bonuses');
  const defense=C.defensePreview({records:[[source,record,7]]});
  assert.ok(defense);
  assert.equal(defense.armor,0);
  assert.equal(defense.refinement,0);
  assert.equal(defense.known,0);
 }
 // The same exact-ID fixture still exercises the existing DEF model,
 // independent of source integrity (not proof of final game rounding).
 const same={...fake,id:777,effects:[]};
 assert.equal(C.defensePreview({
  records:[['item:777',same,7]]
 }).known,108);
});

test('Hero Book combat totals do not inherit forged base armor',()=>{
 const fake={id:778,name:'Forged armor',slot:'body',AC:100,effects:[]};
 const context={classData:classes.WARRIOR,raceData:tables.raceInit.ELF,
  jobData:tables.jobInit.WARRIOR,allocation:stats0,level:1,
  combatContext:{jobKey:'WARRIOR',skillCatalog:{}}};
 const without=C.base({...context,records:[]});
 const attack=C.base({...context,records:[['item:777',fake,0]]});
 assert.ok(without?.combat?.defense&&attack?.combat?.defense);
 assert.equal(attack.combat.defense.known,without.combat.defense.known,
  'a mismatched item must not change actual Hero Book defense');
 assert.equal(attack.effects.health.hp,without.effects.health.hp);
});

test('source accessories with legitimate armor remain counted (including duplicates)',()=>{
 for(const id of [18016,19002,21006,22041]){
  const item=items[id];
  assert.ok(item&&Number.isFinite(item.AC)&&item.AC>0);
  assert.equal(C.defensePreview({
   records:[['item:'+id,item,0]]
  }).armor,item.AC,'legitimate accessory ID '+id);
 }
 const earring=items[22002];
 assert.ok(earring&&earring.slot==='ear'&&earring.AC===1);
 assert.equal(C.defensePreview({records:[
  ['item:22002',earring,0],['item:22002',earring,0]
 ]}).armor,2,'two legitimate earrings may use the same item type');
});

test('all 1140 item AC sources across all eleven grades remain eligible for calculation',()=>{
 let compared=0;
 const enhancementSlots=new Set(['shield','head','body','gloves','legs','feet']);
 for(const [id,item] of Object.entries(items)){
  assert.equal(String(item.id),id);
  for(let grade=0;grade<=10;grade++){
   const actual=C.defensePreview({records:[['item:'+id,item,grade]]});
   assert.ok(actual,'valid source record '+id+' grade '+grade);
   assert.equal(actual.armor,Number.isFinite(item.AC)?item.AC:0);
   const refinable=item.AC!=null&&enhancementSlots.has(item.slot)&&
    item.name!=='-';
   const expectedTenths=refinable?grade*12:0;
   assert.equal(actual.refinementTenths,expectedTenths);
   compared++;
  }
 }
 assert.equal(compared,1140*11);
});

test('branch caps require explicit numeric and owned class definitions',()=>{
 const bad=['90',true,false,[90],{value:90},NaN,Infinity,-1,90.5];
 for(const invalid of bad){
  const example={WARRIOR:{branchCaps:{slash:invalid}}};
  assert.equal(R.branchCap(example,'WARRIOR','slash'),null,
   'corrupt class branch limit '+String(invalid));
 }
 const inheritedClass=Object.create({WARRIOR:{branchCaps:{slash:90}}});
 assert.equal(R.branchCap(inheritedClass,'WARRIOR','slash'),null);
 const inheritedCap=Object.create({slash:90});
 assert.equal(R.branchCap({WARRIOR:{branchCaps:inheritedCap}},
  'WARRIOR','slash'),null);
 assert.equal(R.branchCap(classes,'UNKNOWN','slash'),null);
 assert.equal(R.branchCap(classes,'WARRIOR','unknown-branch'),null);
});

test('all 756 current class-branch caps remain unchanged',()=>{
 assert.equal(Object.keys(classes).length,28);
 let compared=0;
 for(const [job,record] of Object.entries(classes))
  for(const [branch,value] of Object.entries(record.branchCaps||{})){
   assert.ok(Number.isSafeInteger(value)&&value>=0);
   assert.equal(R.branchCap(classes,job,branch),value);
   compared++;
  }
 assert.equal(compared,756);
});

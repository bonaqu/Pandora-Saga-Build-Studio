import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Active Pandora Saga OS #news/4 (player screenshot, 2026-11-07).
// Do NOT derive these expectations from the copied game table: the snapshot
// must fail if either the official schedule or calculator changes accidentally.
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};Function('window',read('pandora-os-character-calculator.js'))(root);
Function('window',read('pandora-studio-enchantment.js'))(root);
const C=root.PandoraOSCalculator,UI=root.PandoraEnchantModel;
const tables=JSON.parse(read('data/os/tables.json'));
const items=JSON.parse(read('data/os/items.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const ratios=[0,2,4,6,8,10,12,15,18,21,25];
const flats=[0,2,4,6,8,11,15,19,23,27,32];
const magic=[0,1,3,5,8,11,15,19,23,27,32];
const zero={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const piece=(slot,grade,id=0,ac=10)=>
 ['item:'+id,{id,slot,name:'Test armor',AC:ac,effects:[]},grade];

test('OS news #4 weapon physical table includes all +1..+10 new tiers',()=>{
 for(let grade=1;grade<=10;grade++){
  const tier=tables.weaponPlus[String(grade)];
  assert.deepEqual([tier.ratio,tier.flat],[ratios[grade],flats[grade]],
   'OS physical +'+grade);
  const expected=Math.floor(67*ratios[grade]/100)+flats[grade];
  assert.equal(UI.weaponPreview(67,grade,tables.weaponPlus).increment,expected);
  assert.equal(C.weaponAttackPreview({str:5,weapon:{W:67},grade,
   weaponPlus:tables.weaponPlus}).refinement,expected);
 }
});
test('OS news #4 magical table has exactly the published percentage for all grades',()=>{
 for(let grade=1;grade<=10;grade++){
  assert.equal(tables.magicPlus[String(grade)].ratio,magic[grade],
   'OS magical +'+grade);
  assert.equal(UI.magicPreview(grade,tables.magicPlus)?.rate,magic[grade]);
  const base=C.magicAttackPreview({int:50,weapon:{id:2601,kind:'WAND',slot:'weapon'}});
  const refined=C.magicAttackPreview({int:50,weapon:{id:2601,kind:'WAND',slot:'weapon'},
   weaponGrade:grade,weaponEnhancementType:'magical',magicPlus:tables.magicPlus});
  assert.equal(refined.known,base.known+magic[grade]);
  assert.equal(refined.refinement,magic[grade]);
 }
});
test('magical refinement never adds undocumented magicPlus.flat and fails closed without table',()=>{
 const weapon={id:2601,kind:'WAND',slot:'weapon'};
 const base=C.magicAttackPreview({int:60,weapon});
 const magical=C.magicAttackPreview({int:60,weapon,weaponGrade:10,
  weaponEnhancementType:'magical',magicPlus:tables.magicPlus});
 assert.equal(magical.known,base.known+32);
 assert.equal(magical.refinement,32);
 assert.equal(C.magicAttackPreview({int:60,weapon,weaponGrade:10,
  weaponEnhancementType:'magical'}).known,null);
 assert.equal(C.magicAttackPreview({int:60,weapon,weaponGrade:10,
  weaponEnhancementType:'physical',magicPlus:tables.magicPlus}).known,base.known);
});
test('all six armor/shield kinds use 1.2 DEF per level, never the old 1.5',()=>{
 const allowed=['shield','head','body','gloves','legs','feet'];
 for(const slot of allowed){
  for(let grade=0;grade<=10;grade++){
   const actual=C.defensePreview({records:[piece(slot,grade,grade+1)]});
   const tenths=12*grade;
   assert.equal(actual.refinementTenths,tenths,slot+' +'+grade);
   assert.equal(actual.refinementRaw,tenths/10,slot+' +'+grade);
   assert.equal(actual.refinement,Math.floor(tenths/10),slot+' +'+grade);
   assert.equal(actual.known,10+Math.floor(tenths/10),slot+' +'+grade);
  }
 }
});
test('armor fractions accumulate across different pieces before truncation',()=>{
 const rows=[piece('head',2,101),piece('body',3,102)];
 const actual=C.defensePreview({records:rows});
 assert.deepEqual([actual.armor,actual.refinementTenths,actual.refinement,
  actual.directRaw,actual.known],[20,60,6,26,26]);
 // Flooring each piece would give 2+3=5, NOT 6.
 assert.equal(actual.known,26);
 assert.equal(C.defensePreview({records:[piece('ring',10,101)]}).refinement,0);
 assert.equal(C.defensePreview({records:[piece('weapon',10,102)]}).refinement,0);
});
test('one +3 leggings correctly accumulates +3.6 and shows DEF 47',()=>{
 const records=[
  ['item:11001',items['11001'],0],['item:12041',items['12041'],0],
  ['item:14004',items['14004'],0],['item:13041',items['13041'],3],
  ['item:15011',items['15011'],0]
 ];
 const actual=C.defensePreview({records});
 assert.equal(actual.armor,44);
 assert.equal(actual.refinementRaw,3.6);
 assert.equal(actual.directRaw,47.6);
 assert.equal(actual.known,47);
});
test('defense percentage and active buffs use assembled raw total, final result truncates',()=>{
 const rows=[piece('head',3,100,12)];
 const boosted=[...rows,['soul:99',{effects:[
  {func:'EP_ARMORCLASS_SCALE',a:10} ]},0]];
 const defense=C.defensePreview({records:boosted});
 assert.equal(defense.directRaw,15.6);
 assert.equal(defense.percentBonus,2);
 assert.equal(defense.raw,17.6);
 assert.equal(defense.known,17);
 const stats={vit:10,str:20,agi:10,dex:10,spi:10,int:10};
 const combat=C.combatPreview({stats,level:10,records:boosted});
 assert.equal(combat.defense.known,17);
 assert.equal(combat.defense.raw,17.6);
});
test('gem type determines which weapon enhancement table affects the hero',()=>{
 const weapon={id:2411,slot:'weapon',kind:'CROSSBOW',W:67,effects:[]};
 const stats={vit:10,str:20,agi:10,dex:10,spi:10,int:50};
 const baseline=C.combatPreview({stats,level:30,weapon,weaponGrade:0,
  weaponPlus:tables.weaponPlus,magicPlus:tables.magicPlus});
 const physical=C.combatPreview({stats,level:30,weapon,weaponGrade:8,
  weaponPlus:tables.weaponPlus,magicPlus:tables.magicPlus,weaponEnhancementType:'physical'});
 const magical=C.combatPreview({stats,level:30,weapon,weaponGrade:8,
  weaponPlus:tables.weaponPlus,magicPlus:tables.magicPlus,weaponEnhancementType:'magical'});
 assert.equal(physical.attack.refinement,Math.floor(67*.18)+23);
 assert.equal(physical.magicAttack.known,baseline.magicAttack.known);
 assert.equal(magical.attack.refinement,0);
 assert.equal(magical.attack.known,baseline.attack.known);
 assert.equal(magical.magicAttack.known,baseline.magicAttack.known+23);
 const hero=C.base({classData:classes.SCOUT,raceData:stats,jobData:zero,
  allocation:zero,level:30,records:[['item:2411',weapon,8]],
  combatContext:{weapon,weaponGrade:8,weaponPlus:tables.weaponPlus,
   magicPlus:tables.magicPlus,jobKey:'SCOUT'},
  gemSelections:[{slot:'weapon',itemId:2411,grade:8,
   gem:{type:'magical',element:'fire'}}]});
 assert.equal(hero.combat.attack.refinement,0);
 assert.equal(hero.combat.magicAttack.refinement,23);
});
test('tooltip shares the same source tables as the calculator',()=>{
 const source=read('pandora-studio-equipment-ui.js');
 assert.match(source,/PandoraEnchantModel\?\.magicPreview\?\.\(grade,context\.tables\?\.magicPlus\)/);
 assert.match(source,/Магическая атака/);
 assert.match(source,/armorBonus\.increment>0/);
 const whole=[0,1,2,3,4,6,7,8,9,10,12];
 for(const slot of ['shield','head','body','gloves','legs','feet']){
  for(let grade=0;grade<=10;grade++){
   const value=UI.armorPreview(12,grade,slot);
   assert.equal(value.increment,whole[grade],slot+' +'+grade);
   assert.equal(value.rawIncrement,grade*1.2,slot+' raw +'+grade);
   assert.equal(value.total,12+whole[grade],slot+' total +'+grade);
  }
 }
 assert.equal(UI.armorPreview(12,10,'weapon'),null);
 assert.equal(UI.armorPreview(12,10,'belt'),null);
});

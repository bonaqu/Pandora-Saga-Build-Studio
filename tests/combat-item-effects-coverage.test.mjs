import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const runtime={};Function('window',read('os-calculator.js'))(runtime);
const calc=runtime.PandoraOSCalculator,items=JSON.parse(read('data/os/items.json'));
const stats={vit:30,str:50,agi:60,dex:35,spi:25,int:50};
test('MATK source exclusions use canonical OS item ID regardless of localized name',()=>{
 const cases=[[2802,'Iron Staff',0],[2812,'Might Staff',0],
  [2841,'Cursed Rod',20],[2801,'Unknown Localized Staff',15]];
 for(const [id,name,bonus] of cases){
  const value=calc.magicAttackPreview({int:50,weapon:{id,kind:'STAFF',name}});
  assert.equal(value.staff,bonus);
  const ru=calc.magicAttackPreview({int:50,weapon:{id,kind:'STAFF',name:items[id]?.name||name}});
  assert.equal(ru.known,value.known);
 }
 assert.equal(calc.magicAttackPreview({int:50,weapon:{kind:'WAND'}}).staff,10);
});
test('armor refinement never changes because RU/EN labels contain a hyphen',()=>{
 const ru=calc.defensePreview({records:[['item:1',{id:1,AC:13,slot:'body',name:'Кираса-3'},7]]});
 const en=calc.defensePreview({records:[['item:1',{id:1,AC:13,slot:'body',name:'Armor-3'},7]]});
 assert.equal(ru.refinement,10);assert.equal(ru.known,en.known);
 const empty=calc.defensePreview({records:[['item:1',{id:1,AC:13,slot:'body',name:'-'},7]]});
 assert.equal(empty.refinement,0);
});
test('armor flat+percent Forth uses ceil once per enhancement effect, then adds Honor',()=>{
 const item={id:777,slot:'body',name:'Test',AC:40};
 const forth={'777':{'7':[{func:'EP_ARMORCLASS_CONST',a:2},
  {func:'EP_ARMORCLASS_SCALE',a:10},
  {func:'EP_ARMORCLASS_SCALE',a:5}]}};
 const value=calc.defensePreview({records:[['item:777',item,7]],itemForth:forth,honorTitle:11});
 // Base 40 AC +10 refine +2 flat=52; percent ceil(5.2)+ceil(2.6)=6+3.
 assert.equal(value.percentBonus,9);assert.equal(value.known,66);
 assert.deepEqual(value.percentParts.map(x=>x.bonus),[6,3]);
});
test('typed move, cast delay, spell damage and back attack effects remain distinct',()=>{
 const rows=[
  ['item:head',{effects:[{func:'EP_CASTINGCANCEL_RESISTANCE_CONST',a:5},
   {func:'EP_SKILL_DELAY',a:-3},{func:'EP_ELEMENT_DAMAGE_SCALE',a:10},
   {func:'EP_ATTACK_BACKATK_RATE',a:10}]},0],
  ['soul:feet',{effects:[{func:'EP_MOVESPEED_SCALE',a:-3,min:0,max:10}]},5]
 ];
 const value=calc.combatPreview({stats,level:45,records:rows,weapon:{id:2602,kind:'WAND',W:4},honorTitle:4});
 assert.equal(value.castInterruption,7); // armor 5, Honor Tome of Ice +2
 assert.equal(value.skillDelayEquipment,-3);
 assert.equal(value.movementSpeed.known,97);
 assert.equal(value.backAttackEquipmentRate,10);
 assert.equal(value.spellDamageEquipmentRate,10);
 assert.equal(value.magicAttack.staff,10); // do not add gear's +10 twice
});
test('real OS equipment sources expose each independent effect without inferring procs',()=>{
 for(const [id,func] of [[2601,'EP_ELEMENT_DAMAGE_SCALE'],
  [12073,'EP_ATTACK_BACKATK_RATE'],[11092,'EP_SKILL_DELAY'],
  [15062,'EP_MOVESPEED_SCALE']]){
  assert.ok(items[id].effects.some(x=>x.func===func),id+': '+func);
 }
});

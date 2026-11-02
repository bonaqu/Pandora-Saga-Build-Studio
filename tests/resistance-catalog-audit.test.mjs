import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('os-calculator.js'))(host);
const calc=host.PandoraOSCalculator;
const datasets=[
 ['item',JSON.parse(read('data/os/items.json'))],
 ['soul',JSON.parse(read('data/os/souls.json'))]
];
const direct=Object.freeze({
 EP_FIRE_RESISTANCE_CONST:'fire',EP_COLD_RESISTANCE_CONST:'ice',
 EP_LIGHTNING_RESISTANCE_CONST:'lightning',EP_POISON_RESISTANCE_CONST:'poison',
 EP_CHARM_RESISTANCE_CONST:'charm',EP_HOLY_RESISTANCE_CONST:'light',
 EP_DARK_RESISTANCE_CONST:'dark',EP_MAGIC_RESISTANCE_CONST:'magic',
 EP_IMMUNE_VIT_TYPE:'physicalStatus',EP_IMMUNE_SPI_TYPE:'mentalStatus',
 EP_IMMUNE_STUN:'stun',EP_IMMUNE_NUMB:'numb',EP_IMMUNE_BURN:'burn',
 EP_IMMUNE_TUMBLE:'tumble',EP_IMMUNE_KNOCKBACK:'knockback',
 EP_IMMUNE_SLEEP:'sleep',EP_IMMUNE_SILENCE:'silence',
 EP_IMMUNE_CURSE:'curse',EP_IMMUNE_EVIL:'evil',
 EP_IMMUNE_DISEASE:'disease',EP_IMMUNE_RAVING:'madness'
});
test('every static OS item/Soul elemental and status resistance effect obeys signed value and improvement gates',()=>{
 let inspected=0,recordCount=0;
 for(const [kind,objects] of datasets)for(const [id,item] of Object.entries(objects)){
  recordCount++;
  const relevant=(item.effects||[]).filter(e=>Object.hasOwn(direct,e.func));
  if(!relevant.length)continue;
  for(const grade of [0,3,7,8,10]){
   const expected={};
   for(const effect of relevant){
    if((Number.isFinite(effect.min)&&grade<effect.min)||
     (Number.isFinite(effect.max)&&grade>effect.max))continue;
    expected[direct[effect.func]]=(expected[direct[effect.func]]||0)+effect.a;
    inspected++;
   }
   const actual=calc.gatherEffects([[kind+':'+id,item,grade]]).bonuses;
   for(const [key,value] of Object.entries(expected))
    assert.equal(actual[key],value,kind+' '+id+' +'+grade+' '+key);
   for(const key of new Set(Object.values(direct)))
    if(!Object.hasOwn(expected,key))assert.equal(actual[key]??0,0,
     'unexpected '+kind+' '+id+' +'+grade+' '+key);
  }
 }
 assert.ok(recordCount>1200,'all actual OS equipment and Soul entries were inspected');
 assert.ok(inspected>500,'all static resistance effect occurrences were exercised');
});
test('equipment, Souls and a physical armor gemstone accumulate signed resistance exactly once',()=>{
 const items=datasets[0][1],souls=datasets[1][1];
 const records=[['item:12032',items['12032'],4],
  ['soul:103020',souls['103020'],4],['soul:106001',souls['106001'],4]];
 const e=calc.gatherEffects(records);
 const rs=calc.resistancePreview({stats:{vit:56,spi:56},bonuses:e.bonuses});
 const gems=calc.gemstonePreview([
  {slot:'body',grade:4,gem:{type:'physical',element:'fire'},itemId:12032}
 ]);
 assert.equal(rs.elements.fire,50); // +5 -5 +50
 assert.equal(rs.elements.ice,-25);
 assert.equal(gems.resistance.fire,4);
 assert.equal(rs.elements.fire+gems.resistance.fire,54);
 assert.equal(rs.states.physical,14);
 assert.equal(rs.states.mental,14);
 assert.equal(calc.gemstonePreview([{slot:'body',grade:4,
  gem:{type:'magical',element:'fire'},itemId:12032}]).resistance.fire,4,
  'old stored armor magical flag must not change its numerical element');
});
test('skill resistance records are classified: active casts are not silently assumed permanent',()=>{
 const skills=JSON.parse(read('data/os/skills.json'));
 assert.equal(skills['330004001'].name,'Божественное благословление');
 assert.equal(skills['330004001'].funcs[0].ep,'EP_MAGIC_RESISTANCE_CONST');
 assert.equal(skills['330004001'].funcs[0].fv1[3],25);
 assert.equal(skills['260007001'].name,'Устойчивость');
 assert.equal(skills['410003001'].skillType,'ENEMY');
 const base=calc.resistancePreview({stats:{vit:56,spi:56}});
 assert.equal(base.elements.magic,0,
  'a known skill is not an always-on hero buff until it was cast');
});

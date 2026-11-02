import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('os-calculator.js'))(host);
const calc=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const z={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const race={vit:40,str:50,agi:30,dex:20,spi:70,int:15};
const classes=JSON.parse(read('data/os/classes.json'));
function base(enabled,blessing,selected=true,source=skills){
 return calc.base({classData:classes.WARRIOR,raceData:race,jobData:z,
  allocation:z,level:45,attributeBuffs:{
   priestEnabled:enabled,priestEncouragement:selected,priestGratia:false,
   priestLapisMedio:false},combatContext:{
   jobKey:'WARRIOR',externalPriest:{enabled,spi:134,blessing,hymn:30},
   skillCatalog:source,legacyBuffMasteries:{blessing:0,hymn:0,alchemy:0}}});
}
test('Ободрение / Battle Prayer applies Remaked Blessing mastery to STR AGI INT only',()=>{
 const initial=base(true,90,false),active=base(true,90,true);
 assert.ok(initial&&active);
 for(const key of ['str','agi','int'])assert.equal(active.stats[key]-initial.stats[key],9,key);
 for(const key of ['vit','dex','spi'])assert.equal(active.stats[key],initial.stats[key],key);
 assert.equal(active.legacyBuffs.encouragement.value,9);
 assert.equal(active.attributeBuffs.trace.find(x=>x.source.includes('Ободрение'))?.amount,9);
 for(const [enabled,blessing,selected] of [[true,60,true],[true,90,false],
  [false,90,true],[true,0,true]]){
  const r=base(enabled,blessing,selected);
  assert.equal(r.stats.str,initial.stats.str,String([enabled,blessing,selected]));
 }
 const corrupt={...skills,320012001:{...skills[320012001],name:'Неизвестный навык'}};
 assert.equal(base(true,90,true,corrupt).stats.str,initial.stats.str);
 assert.equal(skills[320012001].name,'Ободрение');
 assert.deepEqual(skills[320012001].reqs,[{branch:'blessing',amount:61}]);
});
test('gem type is selectable only for weapons; exact game-like elemental suffixes match reference screenshots',()=>{
 const w={};Function('window',read('enchant-model.js'))(w);
 const model=w.PandoraEnchantModel;
 const c=(type,element)=>({type,element});
 const cases=[
  ['Зеленое астирское платье','body',4,c('physical','fire'),
   'Зеленое астирское платье огня +4'],
  ['Лунные одежды','body',3,c('magical','dark'),
   'Лунные одежды тьмы +3'],
  ['Жилет для энкиду','body',3,c('physical','lightning'),
   'Жилет для энкиду молний +3'],
  ['Метеоритный нож','weapon',5,c('physical','fire'),
   'Огн. Метеоритный нож +5'],
  ['Огненный жезл искр','weapon',2,c('magical','fire'),
   'Огн. Огненный жезл искр +2']
 ];
 for(const [name,slot,grade,gem,expected] of cases)
  assert.equal(model.equipmentName(name,slot,grade,gem),expected);
 for(const slot of ['shield','head','body','gloves','legs','feet']){
  assert.deepEqual(model.normalizeForSlot(slot,c('magical','ice')),
   c('physical','ice'),slot);
 }
 assert.deepEqual(model.normalizeForSlot('weapon',c('magical','fire')),
  c('magical','fire'));
 assert.equal(model.normalizeForSlot('ring',c('physical','fire')),null);
 assert.equal(model.equipmentName('Жилет для энкиду молний','body',3,c('physical','lightning')),
  'Жилет для энкиду молний +3');
 assert.equal(model.equipmentName('Метеоритный нож','weapon',0,c('physical','fire')),
  'Метеоритный нож');
 const ui=read('stage-item-ui.js');
 assert.match(ui,/slot==='weapon'\)body.append\(group\('Тип'/);
 assert.match(ui,/group\('Стихия'/);
});

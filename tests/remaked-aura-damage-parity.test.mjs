import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scope={};Function('window',read('os-calculator.js'))(scope);
const calc=scope.PandoraOSCalculator;
const catalog=JSON.parse(read('data/os/items.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const zeros={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const gem=element=>({slot:'weapon',grade:7,itemId:22,
 gem:{type:'physical',element}});
const equipped=(grade=0)=>[['item:22051',catalog['22051'],grade]];
test('actual OS Priest Earring supplies +2 to each existing gem aura, not weapon ATK',()=>{
 const base=calc.gemstonePreview([gem('ice')]);
 assert.equal(catalog['22051'].name,'Серьга жреца');
 assert.equal(base.auras.ice,11);
 const raw=calc.auraDamagePreview({gemstones:base});
 const enhanced=calc.auraDamagePreview({gemstones:base,records:equipped()});
 assert.equal(raw.elements.ice.known,11);
 assert.equal(enhanced.elements.ice.known,13);
 assert.equal(enhanced.elements.ice.flat,2);
 assert.equal(enhanced.sharedFlat,2);
 assert.equal(enhanced.elements.fire,undefined);
});
test('Remaked aura percentage rounds up per existing element independently',()=>{
 const gems=calc.gemstonePreview([gem('ice'),gem('fire')]);
 const records=[...equipped(),['test:percent',{effects:[
  {func:'EP_AURADAMAGE_SCALE',a:20}]},0]];
 const v=calc.auraDamagePreview({gemstones:gems,records});
 for(const element of ['ice','fire']){
  const base=gems.auras[element];
  assert.equal(v.elements[element].known,base+2+Math.ceil(base*.2));
 }
 assert.equal(v.rate,20);
});
test('a flat aura bonus without elemental aura does not fabricate attack damage',()=>{
 const gemless=calc.gemstonePreview([]);
 const result=calc.auraDamagePreview({gemstones:gemless,records:equipped()});
 assert.equal(result.sharedFlat,2);
 assert.deepEqual(result.elements,{});
});
test('full level-55 character applies earring to aura preview but not HP or weapon ATK',()=>{
 const kwargs={classData:classes.WARRIOR,raceData:{vit:40,str:50,agi:70,dex:35,spi:30,int:15},
  jobData:zeros,allocation:zeros,level:55,gemSelections:[gem('ice')],
  combatContext:{jobKey:'WARRIOR',skillCatalog:{}}};
 const plain=calc.base({...kwargs,records:[]});
 const decorated=calc.base({...kwargs,records:equipped()});
 assert.ok(decorated.hp>0&&decorated.mp>0);
 assert.equal(decorated.auraDamage.elements.ice.known,13);
 assert.equal(decorated.hp,plain.hp);
 assert.equal(decorated.mp,plain.mp);
 assert.equal(decorated.combat.attack.known,plain.combat.attack.known);
});
test('book shows final elemental aura while keeping gem base and magic distinct',()=>{
 const source=read('stage-attributes.js');
 assert.match(source,/Основа ауры оружия/);
 assert.match(source,/modifiers\?\.auraDamage\?\.elements/);
 assert.match(source,/Итог ауры/);
 assert.match(source,/Магическое усиление оружия/);
});

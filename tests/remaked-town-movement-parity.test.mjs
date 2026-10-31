import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ctx={};Function('window',read('os-calculator.js'))(ctx);
const C=ctx.PandoraOSCalculator;
const gear=JSON.parse(read('data/os/items.json'));
const cloak=gear['18073'];
const stats={vit:40,str:50,agi:70,dex:35,spi:30,int:50};
const base=records=>C.combatPreview({stats,level:55,jobKey:'ARCHER',records,skillCatalog:{}});
test('official OS beginner cloak grants town-only movement +15',()=>{
 assert.equal(cloak.name,'Плащ новичка');
 assert.equal(cloak.effects.find(e=>e.func==='EP_RESTMAP_MOVESPEED_SCALE').a,15);
 const alone=base([]),equipped=base([['item:18073',cloak,0]]);
 assert.equal(equipped.movementSpeed.known,alone.movementSpeed.known);
 assert.equal(equipped.movementSpeed.townEquipment,15);
 assert.equal(equipped.movementSpeed.town-alone.movementSpeed.known,15);
 assert.equal(equipped.secondary.townMovement,15);
});
test('Remaked city speed includes the current ordinary movement and separate town gear once',()=>{
 const rows=[['item:18073',cloak,0],['item:speed',{effects:[{func:'EP_MOVESPEED_SCALE',a:5}]},0]];
 const cm=base(rows);
 assert.equal(cm.movementSpeed.equipment,5);
 assert.equal(cm.movementSpeed.known,105);
 assert.equal(cm.movementSpeed.town,120);
});
test('book shows city speed without inflating base movement label',()=>{
 const book=read('stage-attributes.js');
 assert.match(book,/Скорость в городе: /);
 assert.match(book,/cm\.movementSpeed\.town/);
 assert.match(book,/cm\.movementSpeed\.townEquipment/);
});

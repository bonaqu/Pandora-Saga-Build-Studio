import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scope={};Function('window',read('os-calculator.js'))(scope);
const souls=JSON.parse(read('data/os/souls.json'));
const expected=[[103029,502,'animal'],[103030,504,'devil'],[103031,505,'immortal'],
 [103032,508,'reptilian'],[103033,511,'ghost'],[103034,512,'golem']];
test('OS source defines six creature-specific reductions; grade gates apply',()=>{
 for(const [id,b,key] of expected){
  const record=souls[id];
  assert.equal(record.effects[0].func,'EP_ONDAMAGE_FDS_RACE');
  assert.equal(record.effects[0].b,b);
  const matched=scope.PandoraOSCalculator.targetResistancePreview({records:[['soul:'+id,record,0]]});
  assert.equal(matched.entries.length,1);
  assert.equal(matched.entries[0].key,key);
  assert.equal(matched.entries[0].change,-3);
  assert.equal(matched.verified,false);
  assert.deepEqual(scope.PandoraOSCalculator.targetResistancePreview({records:[['soul:'+id,record,11]]}).entries,[]);
 }
});
test('unknown type ignored and duplicate Souls not falsely aggregated',()=>{
 const invalid={name:'Unknown',effects:[{func:'EP_ONDAMAGE_FDS_RACE',a:-10,b:999,min:0,max:10}]};
 assert.deepEqual(scope.PandoraOSCalculator.targetResistancePreview({records:[['soul:1',invalid,5]]}).entries,[]);
 const known=souls[103029],entries=scope.PandoraOSCalculator.targetResistancePreview({records:[
  ['soul:1',known,0],['soul:2',known,0]]}).entries;
 assert.equal(entries.length,2);
});
test('Book shows category modifiers without injecting them into global armor',()=>{
 const calc=read('os-calculator.js'),book=read('stage-attributes.js');
 assert.match(calc,/const targetResistance=targetResistancePreview\(/);
 assert.match(calc,/resistances,targetResistance,procPreview,experienceBonus,battleMapCloaks,specialEquipment,regeneration/);
 assert.match(book,/modifiers\?\.targetResistance\?\.entries\?\.length/);
 assert.match(book,/Защита от отдельных типов противников/);
});

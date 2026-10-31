import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const w={};Function('window',read('os-calculator.js'))(w);
const C=w.PandoraOSCalculator;
const classes=JSON.parse(read('data/os/classes.json'));
const zeros={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
test('the six Remaked elemental magic branches reflect only chosen honor',()=>{
 const blank={fire:0,ice:0,lightning:0,poison:0,light:0,dark:0};
 assert.deepEqual(C.elementalMagicPreview({honorTitle:0}),blank);
 for(const [honor,element] of [[3,'fire'],[4,'ice'],[5,'lightning']]){
  const result=C.elementalMagicPreview({honorTitle:honor});
  assert.equal(result[element],5);
  assert.equal(Object.values(result).reduce((a,b)=>a+b,0),5);
 }
 assert.equal(C.elementalMagicPreview({honorTitle:14}),null);
});
test('a planned level-55 hero exposes magic honor without changing attack spells or elemental resistance',()=>{
 const input={classData:classes.MAGE,raceData:zeros,jobData:zeros,
  allocation:{vit:50,str:40,agi:20,dex:30,spi:35,int:90},level:55,
  combatContext:{jobKey:'MAGE',skillCatalog:{}}};
 const plain=C.base(input);
 const honor=C.base({...input,attributeBuffs:{honorTitle:3}});
 assert.equal(plain.elementalMagic.fire,0);
 assert.equal(honor.elementalMagic.fire,5);
 assert.equal(honor.elementalMagic.ice,0);
 assert.equal(honor.elementalMagic.lightning,0);
 assert.equal(honor.level,undefined);
});
test('book keeps physical weapon damage separate and renders elemental honor bonuses',()=>{
 const view=read('stage-attributes.js');
 assert.match(view,/Усиление стихийной магии/);
 assert.match(view,/modifiers\.elementalMagic/);
 assert.match(view,/labels\[element\]/);
});

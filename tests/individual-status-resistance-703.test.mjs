import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src=readFileSync(new URL('../pandora-os-character-calculator.js',import.meta.url),'utf8');
const root={};Function('window',src)(root);
const calc=root.PandoraOSCalculator;
const channels={
 burn:'EP_IMMUNE_BURN',stun:'EP_IMMUNE_STUN',
 numb:'EP_IMMUNE_NUMB',tumble:'EP_IMMUNE_TUMBLE',
 knockback:'EP_IMMUNE_KNOCKBACK',sleep:'EP_IMMUNE_SLEEP',
 silence:'EP_IMMUNE_SILENCE',evil:'EP_IMMUNE_EVIL',
 curse:'EP_IMMUNE_CURSE',disease:'EP_IMMUNE_DISEASE',
 madness:'EP_IMMUNE_RAVING',blockBreak:'EP_BLOCK_BREAK_RESIST'
};
const keys=Object.keys(channels);

test('every one of twelve OS item and Soul effect codes feeds only its own resistance',()=>{
 for(const [index,key] of keys.entries()){
  const id=987200+index,bonus=index+3;
  const soul={id,effects:[{func:channels[key],a:bonus}]};
  const e=calc.gatherEffects([['soul:'+id,soul,0]]);
  const r=calc.resistancePreview({stats:{vit:0,spi:0},bonuses:e.bonuses});
  for(const other of keys)assert.equal(r.status[other],
   other===key?bonus:0,key+' / '+other);
  assert.equal(r.states.physical,0,key);
  assert.equal(r.states.mental,0,key);
 }
});

test('grade gates, duplicate equipment and Soul effects, and canonical item identity',()=>{
 const soul={id:705002,effects:[
  {func:'EP_IMMUNE_STUN',a:13,min:4,max:9},
  {func:'EP_IMMUNE_STUN',a:6},
  {func:'EP_IMMUNE_VIT_TYPE',a:17},
  {func:'EP_IMMUNE_SPI_TYPE',a:8}
 ]};
 const low=calc.gatherEffects([['soul:705002',soul,2]]);
 const valid=calc.gatherEffects([['soul:705002',soul,6]]);
 assert.equal(low.bonuses.stun,6);
 assert.equal(valid.bonuses.stun,19);
 assert.equal(valid.bonuses.physicalStatus,17);
 assert.equal(valid.bonuses.mentalStatus,8);
 const invalid=calc.gatherEffects([['soul:705003',soul,6]]);
 assert.equal(invalid.bonuses.stun??0,0);
 const r=calc.resistancePreview({stats:{vit:28,spi:56},bonuses:valid.bonuses});
 assert.equal(r.status.stun,19);
 assert.equal(r.states.physical,24);
 assert.equal(r.states.mental,22);
 assert.equal(r.status.sleep,0);
});

test('250 synthetic OS effect vectors keep independent status channels isolated',()=>{
 let count=0;
 for(let sample=0;sample<250;sample++){
  const effects=keys.map((key,i)=>({
   func:channels[key],a:((sample*7+i*11)%39)-10
  }));
  const id=807000+sample;
  const gathered=calc.gatherEffects([['soul:'+id,{id,effects},0]]);
  const result=calc.resistancePreview({stats:{vit:sample%84,spi:(sample*3)%112},
   bonuses:gathered.bonuses});
  for(const [i,key] of keys.entries()){
   assert.equal(result.status[key],effects[i].a);
  }
  assert.equal(result.states.physical,Math.floor((sample%84)/28)*7);
  assert.equal(result.states.mental,Math.floor(((sample*3)%112)/28)*7);
  count++;
 }
 assert.equal(count,250);
});

test('honor and verified racial modifiers do not bleed into unrelated channels',()=>{
 const stats={vit:28,spi:28};
 const rank3=calc.resistancePreview({stats,honorTitle:3});
 const rank4=calc.resistancePreview({stats,honorTitle:4});
 const rank5=calc.resistancePreview({stats,honorTitle:5});
 assert.equal(rank3.status.burn,5);assert.equal(rank3.status.numb,0);
 assert.equal(rank4.status.numb,5);assert.equal(rank4.status.burn,0);
 assert.equal(rank5.status.tumble,5);assert.equal(rank5.status.burn,0);
 const dwarf=calc.resistancePreview({stats,racialPassiveId:900030001});
 for(const key of ['stun','numb','tumble'])assert.equal(dwarf.status[key],10);
 for(const key of keys.filter(k=>!['stun','numb','tumble'].includes(k)))
  assert.equal(dwarf.status[key],0);
 // Body and mind group resistances are independent: no speculative
 // contribution to each individual status roll.
 const families=calc.resistancePreview({stats:{vit:84,spi:84},
  bonuses:{physicalStatus:100,mentalStatus:100}});
 for(const key of keys)assert.equal(families.status[key],0);
 assert.equal(families.states.physical,121);
 assert.equal(families.states.mental,121);
 assert.equal(families.verified,false);
});

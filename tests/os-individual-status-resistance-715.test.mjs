import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const items=JSON.parse(read('data/os/items.json'));
const souls=JSON.parse(read('data/os/souls.json'));
const statusByEp=Object.freeze({
 EP_IMMUNE_BURN:'burn',EP_IMMUNE_STUN:'stun',EP_IMMUNE_NUMB:'numb',
 EP_IMMUNE_TUMBLE:'tumble',EP_IMMUNE_KNOCKBACK:'knockback',
 EP_IMMUNE_SLEEP:'sleep',EP_IMMUNE_SILENCE:'silence',EP_IMMUNE_EVIL:'evil',
 EP_IMMUNE_CURSE:'curse',EP_IMMUNE_DISEASE:'disease',
 EP_IMMUNE_RAVING:'madness',EP_BLOCK_BREAK_RESIST:'blockBreak'
});
const statusKeys=Object.values(statusByEp);
const sources=[
 ...Object.values(items).map(x=>['item:'+x.id,x]),
 ...Object.values(souls).map(x=>['soul:'+x.id,x])
].filter(([,x])=>Array.isArray(x.effects)&&
 x.effects.some(e=>Object.hasOwn(statusByEp,e.func)));
const expected=(records)=>{
 const sums=Object.fromEntries(statusKeys.map(k=>[k,0]));
 for(const [source,record,grade] of records){
  for(const e of record.effects||[]){
   const field=statusByEp[e?.func];
   if(!field||!Number.isFinite(e.a)||
    (Number.isFinite(e.min)&&grade<e.min)||
    (Number.isFinite(e.max)&&grade>e.max))continue;
   sums[field]+=e.a;
  }
 }
 return sums;
};
const actual=(records)=>{
 const effects=C.gatherEffects(records);
 const resist=C.resistancePreview({stats:{vit:0,spi:0},bonuses:effects.bonuses});
 assert.ok(resist);
 return resist.status;
};
test('all 12 individual status channels match pinned real item and Soul sources',()=>{
 assert.equal(statusKeys.length,12);
 assert.ok(sources.length>=50,'pinned OS snapshot has real equipment effects');
 const found=new Set();
 for(const [label,record] of sources){
  for(const grade of [0,7]){
   const got=actual([[label,record,grade]]);
   const want=expected([[label,record,grade]]);
   for(const key of statusKeys){
    assert.equal(got[key],want[key],label+' +'+grade+' / '+key);
    if(want[key]!==0)found.add(key);
   }
  }
 }
 assert.ok(found.size>=9,'actual game data exercises most status categories');
});
test('300 synthetic equipment combinations preserve independent signed resistance totals',()=>{
 for(let i=0;i<300;i++){
  const selected=[
   sources[i%sources.length],
   sources[(i*7+13)%sources.length],
   sources[(i*11+27)%sources.length]
  ].filter((x,index,a)=>a.findIndex(y=>y[0]===x[0])===index)
   .map(([source,rec],j)=>[source,rec,(i+j*3)%11]);
  const got=actual(selected),want=expected(selected);
  for(const field of statusKeys)
   assert.equal(got[field],want[field],'scenario '+i+' status '+field);
 }
});
test('upgrade conditions are honored; an unrelated status cannot leak into another',()=>{
 const soul={id:987001,effects:[
  {func:'EP_IMMUNE_STUN',a:25,min:5,max:10},
  {func:'EP_IMMUNE_SILENCE',a:10,min:7,max:10}]};
 for(const [grade,stun,silence] of [[4,0,0],[5,25,0],[7,25,10]]){
  const status=actual([['soul:987001',soul,grade]]);
  assert.equal(status.stun,stun);
  assert.equal(status.silence,silence);
  for(const field of statusKeys.filter(k=>!['stun','silence'].includes(k)))
   assert.equal(status[field],0);
 }
 const malformed={id:987002,effects:[{func:'EP_IMMUNE_STUN',a:null}]};
 assert.equal(actual([['soul:987002',malformed,0]]).stun,0);
 const wrongIdentity={id:987003,effects:[{func:'EP_IMMUNE_STUN',a:100}]};
 assert.equal(actual([['soul:987004',wrongIdentity,0]]).stun,0);
});
test('physical and mental group bases never overwrite one of the 12 separate statuses',()=>{
 const gear={id:987010,effects:[
  {func:'EP_IMMUNE_VIT_TYPE',a:10},
  {func:'EP_IMMUNE_SPI_TYPE',a:7},
  {func:'EP_IMMUNE_STUN',a:4}]};
 const e=C.gatherEffects([['item:987010',gear,0]]);
 const r=C.resistancePreview({stats:{vit:56,spi:28},bonuses:e.bonuses});
 assert.equal(r.states.physical,24);
 assert.equal(r.states.mental,14);
 assert.equal(r.status.stun,4);
 for(const k of statusKeys.filter(x=>x!=='stun'))assert.equal(r.status[k],0);
 assert.equal(r.verified,false,'not a proven server resistance roll');
});
test('Book keeps Russian game labels rather than raw technical status codes',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/Сопротивления отдельным состояниям/);
 assert.match(book,/Немота/);
 assert.match(book,/Пробитие блока/);
});

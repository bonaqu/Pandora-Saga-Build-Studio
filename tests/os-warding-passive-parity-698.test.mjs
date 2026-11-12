import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const src=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const book=read('pandora-studio-hero-book.js');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const stats={vit:50,str:55,agi:65,dex:60,spi:80,int:45};
const combat={attack:{walkingBase:200},defense:{directRaw:100},accuracy:{base:130},dodge:{base:125}};
const inspect=(mastery,catalog=src)=>C.scalingSkillPreview({
 skillCatalog:catalog,jobKey:'SNIPER',level:45,
 branchCaps:classes.SNIPER.branchCaps,branchMasteries:{warding:mastery},
 stats,combat,weaponKind:'BARE_HAND'});
const passive=(mastery,catalog=src)=>C.wardingStatusPassive({
 jobKey:'SNIPER',wardingMastery:mastery,wardingCap:classes.SNIPER.branchCaps.warding,
 skillCatalog:catalog});
const row=(mastery,catalog=src)=>inspect(mastery,catalog).defense.find(x=>x.id===260007001);

test('Warding 26 supplies three 15-point resistances, never a duplicate caster benefit',()=>{
 assert.equal(passive(25),null);
 assert.deepEqual({...passive(26)},{stun:15,numb:15,tumble:15});
 assert.equal(row(26)?.amount,15);
 assert.equal(row(26)?.available,true);
 assert.equal(row(25)?.available,false);
 assert.match(book,/replace\(' сопротивления',' resistance'\)/);
});

test('250 mastery and attribute combinations keep passive Defense and Skill Effects consistent',()=>{
 const before=JSON.stringify(src);let seen=0;
 for(let mastery=0;mastery<50;mastery++)for(const delta of [0,5,10,25,100]){
  const result=C.resistancePreview({stats:{vit:50+delta,spi:80+delta},
   jobKey:'SNIPER',wardingMastery:mastery,
   wardingCap:classes.SNIPER.branchCaps.warding,skillCatalog:src});
  const expected=mastery>=26?15:0;
  for(const type of ['stun','numb','tumble'])assert.equal(result.status[type],expected);
  assert.equal(row(mastery)?.amount,15);
  assert.equal(row(mastery)?.available,mastery>=26);
  seen++;
 }
 assert.equal(seen,250);
 assert.equal(JSON.stringify(src),before);
});

test('tampered FV1/FV2, requirements, class and duplicate TARGET fail closed',()=>{
 const cases=[
  s=>s.funcs.find(x=>x.ep==='EP_IMMUNE_STUN').fv1[0]=9,
  s=>s.funcs.find(x=>x.ep==='EP_IMMUNE_TUMBLE').fv2[3]=1,
  s=>s.funcs.push(structuredClone(s.funcs.find(x=>x.ep==='EP_IMMUNE_NUMB'&&x.dir==='TARGET'))),
  s=>s.reqs[0].amount=35,
  s=>s.classes.SNIPER=0
 ];
 for(const mutate of cases){
  const forged=structuredClone(src);mutate(forged['260007001']);
  assert.equal(passive(30,forged),null);
  assert.equal(row(30,forged),undefined);
 }
 const caster=structuredClone(src);
 caster['260007001'].funcs.find(x=>x.ep==='EP_IMMUNE_NUMB'&&x.dir==='CASTER').fv1[3]=99;
 assert.equal(passive(26,caster)?.numb,15);
});

test('invalid profession cap and impossible green mastery cannot apply',()=>{
 assert.equal(C.wardingStatusPassive({jobKey:'WARRIOR',wardingMastery:26,
  wardingCap:classes.WARRIOR.branchCaps.warding,skillCatalog:src}),null);
 assert.equal(passive(91),null);
 assert.equal(row(91)?.amount,15);
 assert.equal(row(91)?.available,false);
 assert.match(row(91)?.reason||'',/Мастерство превышает предел профессии/);
});

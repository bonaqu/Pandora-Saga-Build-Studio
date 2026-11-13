import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root={};Function('window',read('pandora-os-character-calculator.js'))(root);
const C=root.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const hero=({jobKey='CLERIC',level=45,int=70,spi=95,mastery=41,
 percent=100,skillCatalog=skills}={})=>C.healingSpellsPreview({
 jobKey,level,int,spi,benevolence:mastery,healingPercent:percent,
 benevolenceCap:classes[jobKey].branchCaps.benevolence,
 skillCatalog
});
const pulses=({jobKey='CLERIC',level=45,spi=95,mastery=41,
 skillCatalog=skills}={})=>C.periodicRecoveryPreview({
 jobKey,level,spi,benevolence:mastery,
 benevolenceCap:classes[jobKey].branchCaps.benevolence,
 skillCatalog
});
const castTime=(percent,offset)=>
 ({known:percent,allyReduction:offset,
  source:"Remaked Calc('CastSPD'), Status_78 + current OS Воодушевление"});
const combat=(percent=100,offset=0)=>({
 castTime:castTime(percent,offset),castingSpeed:{known:345},
 cooldown:84,manaCost:{remaining:72}
});
const action=(skillId,ctx=combat(),source=skills)=>C.healingActionPreview({
 skillCatalog:source,skillId,combat:ctx
});

test('Actual OS healing skills use a distinct, source-proven 50% casting-time model',()=>{
 const originals=[
  [310001001,1,.5],[310001002,0,0],
  [310002001,1.5,.75],[310004001,2,1],
  [310004002,2,1],[310021001,1,.5],
  [310021002,1,.5],[310022001,3,1.5],
  [310023001,5,2.5],[330005001,1.5,.75]
 ];
 for(const [id,base,halved] of originals){
  const normal=action(id),inspired=action(id,combat(50,50));
  assert.equal(normal.cast,base);
  assert.equal(normal.castModel.seconds,base);
  assert.equal(inspired.castModel.seconds,halved);
  assert.equal(inspired.castModel.inspiration,true);
  assert.equal(inspired.mana,skills[String(id)].mana);
  assert.equal(inspired.cooldown,skills[String(id)].cooldown);
  assert.equal(inspired.manaRemainingIndex,72);
  assert.equal(inspired.cooldownIndex,84);
  assert.equal(inspired.verified,false);
 }
 assert.equal(action(310023002,combat(50,50)),null,
  'Triggered area effect is not a separate castable skill');
 assert.equal(action(320006001,combat(50,50)),null,
  'Inspiration itself is not an own healing skill');
});

test('Casting speed, cooldown and MP-cost indices must not be conflated with seconds',()=>{
 const c=combat(50,50);
 c.castingSpeed.known=999;
 c.cooldown=2;
 c.manaCost.remaining=18;
 const r=action(310022001,c);
 assert.equal(r.castModel.seconds,1.5,'Status_78 only, never cast speed index');
 assert.equal(r.cooldown,20,'source base cooldown does not become 0.4 seconds');
 assert.equal(r.mana,90,'source MP cost is not rounded from an index');
 assert.equal(r.cooldownIndex,2);
 assert.equal(r.manaRemainingIndex,18);
 c.castTime.source='An unrelated spell';
 assert.equal(action(310022001,c).castModel,null,
  'Unverified source must not authorize exact reduced cast time');
 c.castTime=castTime(65,35);
 assert.equal(action(310022001,c).castModel,null,
  'No invented intermediate casting-time bonuses');
});

test('A changed/forged OS action record does not generate trusted skill metadata',()=>{
 const forged=structuredClone(skills);
 forged['310022001'].id=1;
 assert.equal(action(310022001,combat(),forged),null);
 forged['310022001']=structuredClone(skills['310022001']);
 forged['310022001'].cast=-1;
 assert.equal(action(310022001,combat(),forged),null);
 forged['310022001']=structuredClone(skills['310022001']);
 forged['310022001'].mana=Number.NaN;
 assert.equal(action(310022001,combat(),forged),null);
});

test('Next actual INT/SPIRIT improvement respects OS formula and rounding',()=>{
 const direct=hero().rows.filter(x=>x.available);
 const aid=direct.find(x=>x.id==='firstAid');
 assert.equal(aid.amount,264);
 assert.deepEqual(aid.nextAttribute,{value:71,remaining:1,gain:1});
 assert.deepEqual(aid.breakdown,{
  kind:'direct',stat:'int',flat:25,statPart:70,levelPart:112.5,
  masteryPart:57.4,healingPercent:100
 });
 const restored=direct.find(x=>x.id==='restoration');
 assert.equal(restored.amount,28);
 assert.deepEqual(restored.nextAttribute,{value:100,remaining:5,gain:1});
 assert.equal(restored.breakdown.kind,'periodic');
 assert.equal(restored.breakdown.stat,'spi');
 assert.deepEqual(restored.breakdown,
  {kind:'periodic',stat:'spi',flat:5,statPart:19,levelPart:2,
   masteryPart:2,healingPercent:null});
 const p=pulses();
 const regen=p.rows.find(x=>x.id===310002001);
 const restore=p.rows.find(x=>x.id===310022001);
 assert.equal(regen.amount,27);
 assert.deepEqual(regen.nextAttribute,{value:100,remaining:5,gain:1});
 assert.deepEqual(regen.nextLevel,{value:50,remaining:5,gain:1});
 assert.deepEqual(restore.nextAttribute,restored.nextAttribute);
 assert.equal(restore.nextLevel,null);
 for(const row of direct){
  if(!row.nextAttribute)continue;
  const next=hero({int:row.id==='restoration'?70:row.nextAttribute.value,
   spi:row.id==='restoration'?row.nextAttribute.value:95}).rows
   .find(x=>x.id===row.id);
  assert.equal(next.amount,row.amount+row.nextAttribute.gain);
 }
});

test('HP and MP pulses have different stat sensitivity, next-level steps and access',()=>{
 const monk=pulses({jobKey:'ASCETIC',level:20,spi:60,mastery:0});
 const natural=monk.rows.find(x=>x.id===330005001);
 assert.equal(natural.available,true);
 assert.equal(natural.amount,2);
 assert.equal(natural.nextAttribute,null,'OS mana pulse does not use SPI');
 assert.deepEqual(natural.nextLevel,{value:30,remaining:10,gain:1});
 assert.equal(natural.breakdown.levelPart,2);
 assert.equal(natural.breakdown.statPart,0);
 const noSkills=hero({jobKey:'WARRIOR',mastery:0});
 assert.equal(noSkills.rows.filter(x=>x.available).length,0);
 assert.equal(noSkills.rows.every(x=>x.breakdown===null),true);
 assert.equal(pulses({jobKey:'WARRIOR',mastery:0}).rows
  .filter(x=>x.available).length,0);
});

test('Book presents the model in readable, compact Russian and English',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/С «Воодушевлением» от союзника/);
 assert.match(book,/Как рассчитано лечение/);
 assert.match(book,/Next Healing mastery increase/);
 assert.match(book,/Следующий прирост от /);
 assert.match(book,/Расход ОМ: /);
 assert.match(book,/Перезарядка: /);
 assert.doesNotMatch(book,/Точное время перезарядки с бонусами пока не установлено/);
 assert.match(book,/appendHealingBreakdown\(more,row,pulse\)/);
 assert.match(book,/stage-skill-more/);
});

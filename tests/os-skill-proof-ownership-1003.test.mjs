import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const jobs=JSON.parse(read('data/os/classes.json'));
const scope={};
Function('window',read('pandora-os-character-calculator.js'))(scope);
const C=scope.PandoraOSCalculator;
const forged=(id,job,flag)=>{const copy=structuredClone(skills);
 copy[String(id)].classes[job]=flag;return copy;};
const row=(rows,id)=>rows.find(r=>r.id===id);
const stats={vit:50,str:55,agi:65,dex:60,spi:80,int:45};
const combat={attack:{walkingBase:200},defense:{directRaw:100},
 accuracy:{base:130},dodge:{base:125}};
const warding=catalog=>C.wardingStatusPassive({jobKey:'SNIPER',
 wardingMastery:26,wardingCap:jobs.SNIPER.branchCaps.warding,skillCatalog:catalog});
const defense=catalog=>C.defensiveSkillPreview({skillCatalog:catalog,jobKey:'KNIGHT',
 level:45,branchMasteries:{},weaponKind:'1H_SWORD',hasShield:true});
const elemental=catalog=>C.elementalSpellCoefficientPreview({skillCatalog:catalog,
 jobKey:'WARLOCK',level:55,branchMasteries:{element:50,darkness:20},
 branchCaps:jobs.WARLOCK.branchCaps,stats:{int:80}});
const scaling=catalog=>C.scalingSkillPreview({skillCatalog:catalog,
 jobKey:'SNIPER',level:45,branchCaps:jobs.SNIPER.branchCaps,
 branchMasteries:{warding:26},stats,combat}).defense;
const healing=catalog=>C.healingSpellsPreview({level:55,int:90,spi:70,
 benevolence:60,healingPercent:120,jobKey:'CLERIC',
 benevolenceCap:jobs.CLERIC.branchCaps.benevolence,skillCatalog:catalog}).rows;
const periodic=(catalog,job='CLERIC')=>C.periodicRecoveryPreview({
 level:45,spi:60,benevolence:41,jobKey:job,
 benevolenceCap:jobs[job].branchCaps.benevolence,skillCatalog:catalog}).rows;
const song=catalog=>C.songSkillPreview({skillCatalog:catalog,jobKey:'CLERIC',level:55,
 branchCaps:jobs.CLERIC.branchCaps,
 branchMasteries:jobs.CLERIC.branchCaps}).rows;
const trap=catalog=>C.trapSkillCostPreview({skillCatalog:catalog,jobKey:'AGENT',level:55,
 branchCaps:jobs.AGENT.branchCaps,branchMasteries:jobs.AGENT.branchCaps}).rows;
const status=catalog=>C.statusApplicationPreview({skillCatalog:catalog,
 jobKey:'ASCETIC',level:55,branchCaps:jobs.ASCETIC.branchCaps,
 branchMasteries:jobs.ASCETIC.branchCaps}).rows;
const complex=catalog=>C.complexSkillSourcePreview({skillCatalog:catalog,
 jobKey:'WIZARD',level:55,branchCaps:jobs.WIZARD.branchCaps,
 branchMasteries:jobs.WIZARD.branchCaps}).rows;

test('all 571 current skills have numeric-one class fields, never string or Boolean coercions',()=>{
 assert.equal(Object.keys(skills).length,571);
 assert.equal(Object.keys(jobs).length,28);
 let count=0;
 for(const skill of Object.values(skills))
  for(const flag of Object.values(skill.classes||{})){
   assert.equal(flag,1);count++;
  }
 assert.equal(count,5700);
});

test('warding status and scaled defense reject a forged class flag',()=>{
 assert.deepEqual(warding(skills),{stun:15,numb:15,tumble:15});
 assert.equal(row(scaling(skills),260007001)?.amount,15);
 for(const bad of ['1',true,[],{},null,0]){
  const copy=forged(260007001,'SNIPER',bad);
  assert.equal(warding(copy),null);
  assert.equal(row(scaling(copy),260007001),undefined);
  const resist=C.resistancePreview({stats:{vit:50,spi:80},
   jobKey:'SNIPER',wardingMastery:26,
   wardingCap:jobs.SNIPER.branchCaps.warding,skillCatalog:copy});
  assert.equal(resist.status.stun,0);
 }
});

test('Bastion defensive source needs numeric Knight ownership and safe arrays',()=>{
 assert.equal(row(defense(skills),100053001)?.available,true);
 for(const bad of ['1',true,[],{},null,0])
  assert.equal(row(defense(forged(100053001,'KNIGHT',bad)),100053001),undefined);
 for(const mutate of [
  s=>{s.funcs='bad';},s=>{s.funcs={};},
  s=>{s.reqs='bad';},s=>{s.reqs={};},
  s=>{s.funcs=null;},s=>{s.reqs=null;}
 ]){
  const copy=structuredClone(skills);mutate(copy[100053001]);
  assert.doesNotThrow(()=>defense(copy));
  assert.equal(row(defense(copy),100053001),undefined);
 }
});

test('elemental spell coefficients remain source-derived, and reject forged WARLOCK',()=>{
 assert.equal(row(elemental(skills),410001001)?.coefficientModels[0].amount,150);
 for(const bad of ['1',true,[],{},null,0]){
  const copy=forged(410001001,'WARLOCK',bad);
  assert.equal(row(elemental(copy),410001001),undefined);
  assert.equal(row(elemental(copy),410002001)?.coefficientModels[0].amount,180);
 }
});

test('incredible strength remains a source-only on-hit effect, not extra sheet ATK',()=>{
 const get=catalog=>C.incredibleStrengthPreview({skillCatalog:catalog,
  jobKey:'DRAGOON',level:45});
 assert.equal(get(skills)?.id,910110001);
 assert.equal(get(skills)?.addsAttack,0);
 for(const bad of ['1',true,{},null,0])
  assert.equal(get(forged(910110001,'DRAGOON',bad)),null);
});

test('healing spells keep valid CLERIC numbers and disable forged learned spell',()=>{
 assert.equal(row(healing(skills),'heal')?.amount,1698);
 assert.equal(row(healing(skills),'heal')?.available,true);
 for(const bad of ['1',true,{},null,0]){
  const copy=forged(310004002,'CLERIC',bad);
  assert.equal(row(healing(copy),'heal')?.available,false);
  assert.equal(row(healing(copy),'firstAid')?.amount,720);
 }
});

test('HP and MP periodic effect models require their own numeric class',()=>{
 assert.equal(row(periodic(skills),310002001)?.amount,24);
 assert.equal(row(periodic(skills,'ASCETIC'),330005001)?.amount,2);
 for(const bad of ['1',true,{},null,0]){
  const copy=forged(310002001,'CLERIC',bad);
  assert.equal(row(periodic(copy),310002001),undefined);
  assert.equal(row(periodic(copy),310022001)?.amount,21);
  const mana=forged(330005001,'ASCETIC',bad);
  assert.equal(row(periodic(mana,'ASCETIC'),330005001),undefined);
 }
});

test('hymn root needs exact caster ownership; unaffected other hymn stays readable',()=>{
 assert.ok(row(song(skills),340001001));
 assert.ok(row(song(skills),340003001));
 for(const bad of ['1',true,{},null,0]){
  const copy=forged(340001001,'CLERIC',bad);
  assert.equal(row(song(copy),340001001),undefined);
  assert.ok(row(song(copy),340003001));
 }
});

test('trap-material model does not accept a string-class source',()=>{
 assert.equal(row(trap(skills),240001001)?.count,1);
 for(const bad of ['1',true,{},null,0]){
  const copy=forged(240001001,'AGENT',bad);
  assert.equal(row(trap(copy),240001001),undefined);
  assert.ok(row(trap(copy),240002001));
 }
});

test('status applications require numeric ASCETIC class, preserve other source rows',()=>{
 assert.equal(row(status(skills),142501101)?.sourceOnly,true);
 for(const bad of ['1',true,{},null,0]){
  const copy=forged(142501101,'ASCETIC',bad);
  assert.equal(row(status(copy),142501101),undefined);
  assert.ok(row(status(copy),168005001));
 }
});

test('complex elemental spell with secondary status rejects a forged WIZARD class',()=>{
 assert.equal(row(complex(skills),410012001)?.hasSecondaryEffect,true);
 for(const bad of ['1',true,{},null,0]){
  const copy=forged(410012001,'WIZARD',bad);
  assert.equal(row(complex(copy),410012001),undefined);
  assert.ok(row(complex(copy),410011001));
 }
});

test('28 class × 55 level status inspections retain original skill ownership',()=>{
 let compared=0;
 for(const [job,entry] of Object.entries(jobs))for(let level=1;level<=55;level++){
  const result=C.statusApplicationPreview({skillCatalog:skills,jobKey:job,level,
   branchCaps:entry.branchCaps,branchMasteries:entry.branchCaps});
  for(const skill of result.rows){
   assert.equal(skills[skill.id].classes[job],1);
   assert.equal(skill.sourceOnly,true);
   assert.equal(skill.targetSideOnly,true);
  }
  compared++;
 }
 assert.equal(compared,1540);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const calc=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const healing=(rank,job='CLERIC',level=50,int=70,spi=95)=>calc.healingSpellsPreview({
 jobKey:job,level,int,spi,benevolence:rank,healingPercent:100,
 benevolenceCap:classes[job].branchCaps.benevolence,skillCatalog:skills
});
const periodic=(rank,job='CLERIC',level=45,spi=95,source=skills)=>
 calc.periodicRecoveryPreview({jobKey:job,level,spi,benevolence:rank,
  benevolenceCap:classes[job].branchCaps.benevolence,skillCatalog:source});
test('Remaked LPsec/MPsec and exact current OS vectors support a 2-second model',()=>{
 for(const id of [310002001,310022001,330005001]){
  const skill=skills[String(id)];
  assert.equal(skill.funcs.length,1);
  assert.equal(skill.funcs[0].fv2[3],2);
  assert.match(skill.funcs[0].ep,/^EP_HEAL_(LIFE|MANA)_REGENERATOR$/);
 }
 for(const row of periodic(41).rows)
  assert.equal(row.intervalSeconds,2);
 assert.match(periodic(41).source,/2-second LPsec\/MPsec model/);
 assert.equal(calc.alliedNaturalRecoveryPreview({skillCatalog:skills,
  casterLevel:45}).intervalSeconds,2);
});
test('next healing gain uses actual source-dependent mastery steps, not assumed +1',()=>{
 const regen=periodic(41).rows.find(x=>x.id===310002001);
 const restore=periodic(41).rows.find(x=>x.id===310022001);
 assert.deepEqual(regen.nextMastery,{rank:50,remaining:9,gain:1});
 assert.deepEqual(restore.nextMastery,{rank:60,remaining:19,gain:1});
 for(const row of healing(60).rows.filter(x=>x.available)){
  if(!row.nextMastery)continue;
  const next=healing(row.nextMastery.rank).rows.find(x=>x.id===row.id);
  assert.equal(next.amount,row.amount+row.nextMastery.gain);
  for(let lower=60+1;lower<row.nextMastery.rank;lower++){
   const same=healing(lower).rows.find(x=>x.id===row.id);
   assert.equal(same.amount,row.amount,'earlier green rank cannot increase this heal');
  }
 }
 const max=healing(90);
 assert.ok(max.rows.every(row=>row.nextMastery===null));
});
test('OS gameplay metadata backs the displayed cost, cast, cooldown and scope',()=>{
 const expected=[
  [310001001,28,1,4,'ALLY'],
  [310001002,28,0,4,'ALLY'],
  [310002001,40,1.5,5,'ALLY'],
  [310004001,62,2,3,'ALLY'],
  [310021001,256,1,30,'PARTY_ALL'],
  [310022001,90,3,20,'PARTY_ALL'],
  [310023001,87,5,60,'POINT']
 ];
 for(const [id,mana,cast,cooldown,skillType] of expected){
  const s=skills[String(id)];
  assert.deepEqual([s.mana,s.cast,s.cooldown,s.skillType],
   [mana,cast,cooldown,skillType]);
 }
});
test('Conflicting Russian OS descriptions are visible without rewriting canonical source',()=>{
 assert.match(skills['310022001'].desc,/3 с\./);
 assert.match(skills['310023001'].desc,/ОМ/);
 assert.equal(skills['310023002'].funcs[0].ep,'EP_HEAL_LIFE');
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/В описании OS указано «3 с\.»/);
 assert.match(book,/Описание OS упоминает ОМ/);
 assert.match(book,/sourceId===310002001\|\|sourceId===310022001/);
 assert.match(book,/data-healing-skill-id/);
 assert.match(book,/Следующий прирост от Исцеления/);
 assert.match(book,/Базовое применение:/);
 assert.match(book,/Базовая перезарядка:/);
 assert.doesNotMatch(book,/реальные секунды не подтверждены\./);
});
test('Tampered OS interval does not produce a two-second skill preview',()=>{
 const forged=structuredClone(skills);
 forged['310022001'].funcs[0].fv2[3]=3;
 assert.ok(!periodic(41,'CLERIC',45,95,forged).rows.some(x=>x.id===310022001));
 const direct=calc.healingSpellsPreview({
  jobKey:'CLERIC',level:45,int:70,spi:95,benevolence:41,
  benevolenceCap:90,skillCatalog:forged,healingPercent:100});
 assert.equal(direct.rows.find(x=>x.id==='restoration').available,false);
});

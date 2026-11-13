import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const healing=(jobKey,level,mastery,int=70,spi=95)=>C.healingSpellsPreview({
 jobKey,level,int,spi,benevolence:mastery,healingPercent:100,
 benevolenceCap:classes[jobKey].branchCaps.benevolence,skillCatalog:skills
}).rows.filter(row=>row.available);
const hpPulses=(jobKey,level,mastery,spi=95,catalog=skills)=>C.periodicRecoveryPreview({
 jobKey,level,spi,benevolence:mastery,
 benevolenceCap:classes[jobKey].branchCaps.benevolence,skillCatalog:catalog
}).rows.filter(row=>row.kind==='hp'&&row.available);
test('Current hero class, level and learned Healing gate spell amounts',()=>{
 assert.deepEqual(healing('WARRIOR',45,0),[]);
 assert.deepEqual(hpPulses('WARRIOR',45,0),[]);
 assert.deepEqual(healing('ACOLYTE',17,8).map(row=>row.skillId),[310001001]);
 assert.deepEqual(healing('ACOLYTE',18,8).map(row=>row.skillId),[310001001,310004001]);
 assert.deepEqual(hpPulses('ACOLYTE',30,21).map(row=>row.id),[310002001]);
 assert.deepEqual(hpPulses('CLERIC',45,41).map(row=>row.id),[310002001,310022001]);
 assert.ok(healing('CLERIC',45,41).some(row=>row.skillId===310023001));
 assert.ok(healing('CLERIC',50,60).some(row=>row.skillId===310004002));
});
test('Current OS coefficients drive direct heals and independently rounded HP pulses',()=>{
 const row=healing('CLERIC',50,60,70,95).find(row=>row.skillId===310004002);
 const v=skills['310004002'].funcs[0].fv1;
 assert.equal(row.amount,Math.floor(v[3]+70*v[0]/100+50*v[1]/100+60*v[2]/100));
 for(const row of hpPulses('CLERIC',45,41,95)){
  const vector=skills[String(row.id)].funcs[0].fv1;
  assert.equal(row.amount,vector[3]+Math.floor(95*vector[0]/100)+
   Math.floor(45*vector[1]/100)+Math.floor(41*vector[2]/100));
 }
 const altered=structuredClone(skills);
 altered['310002001'].funcs[0].fv2[3]=4;
 assert.ok(!hpPulses('CLERIC',45,41,95,altered).some(row=>row.id===310002001));
});
test('Book keeps HP pulses with own healing spells without duplicate Restoration',()=>{
 const book=read('pandora-studio-hero-book.js');
 const part=book.slice(book.indexOf('function skillEffectsPage('),
  book.indexOf(' // Skill Effects shows the theoretical effect of a CAST,'));
 assert.match(part,/const periodicHeals=periodic.filter/);
 assert.match(part,/!directIds.has\(row.id\)/);
 assert.match(part,/const healingRows=\[...spells,...periodicHeals\]/);
 assert.match(part,/manaPulses=periodic.filter\(row=>row.kind==='mp'\)/);
 assert.doesNotMatch(book,/stage-ally-hp-fields/);
});

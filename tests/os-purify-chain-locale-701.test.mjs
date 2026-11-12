import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json')),classes=JSON.parse(read('data/os/classes.json'));
const meta=JSON.parse(read('data/os/meta.json')),en=JSON.parse(read('data/os/strings.en.json'));
const combat={attack:{walkingBase:180},defense:{directRaw:100},accuracy:{base:140},dodge:{base:100}};
const stats={vit:75,str:70,agi:65,dex:65,spi:85,int:80};
const kwargs=(job,branchMasteries={},skillCatalog=skills,hero=stats)=>({
 skillCatalog,jobKey:job,level:50,stats:hero,combat,
 branchMasteries,branchCaps:classes[job].branchCaps,
 branchLabels:meta.branchLabels,englishBranches:en.branches,weaponKind:'1H_SWORD'});
const find=(result,id)=>[...(result.offense||[]),...(result.defense||[])].find(x=>x.id===id);
test('Purify targets both status families from OS chained subskill, not permanent stats',()=>{
 const p=find(C.scalingSkillPreview(kwargs('WARRIOR')),310014001);
 assert.equal(p.name,'Полное исцеление');
 assert.equal(en.skills['310014001'].n,'Purify');
 assert.equal(p.recipient,true);
 assert.equal(p.available,true);
 assert.equal(p.amount,null);
 assert.equal(p.modelOnly,true);
 assert.deepEqual(p.coefficientModels.map(x=>[x.ep,x.amount]),[
  ['EP_IMMUNE_VIT_TYPE',100],['EP_IMMUNE_SPI_TYPE',100]]);
 const r=C.resistancePreview({stats});
 assert.equal(r.states.physical,Math.floor(stats.vit/28)*7);
 assert.equal(r.states.mental,Math.floor(stats.spi/28)*7);
});
test('corrupted root, internal effect, requirement, FV2 or ID safely omits Purify',()=>{
 const cases=[
  s=>s['310014001'].funcs.find(x=>x.ep==='EP_SKILL_EXEC').fv1[3]=310014003,
  s=>s['310014001'].funcs.find(x=>x.ep==='EP_RECOVERY_HEALTH').fv2[3]=1,
  s=>s['310014002'].funcs.find(x=>x.ep==='EP_IMMUNE_SPI_TYPE').fv1[3]=99,
  s=>s['310014002'].funcs.find(x=>x.ep==='EP_IMMUNE_VIT_TYPE').fv2[3]=1,
  s=>s['310014002'].learnable=true,
  s=>s['310014001'].reqs[0].amount=70,
  s=>s['310014001'].name='Invented title'
 ];
 for(const mutate of cases){
  const altered=structuredClone(skills);mutate(altered);
  const r=C.scalingSkillPreview(kwargs('WARRIOR',{},altered));
  assert.equal(find(r,310014001),undefined);
  assert.ok(find(r,320001001),'Unrelated source projection survives');
 }
});
test('250 distinct recipient builds cannot acquire the two +100 parameters permanently',()=>{
 const snapshot=JSON.stringify(skills);
 let count=0;
 for(let vit=1;vit<=50;vit++)for(const spi of [1,27,28,80,140]){
  const hero={...stats,vit,spi};
  const p=find(C.scalingSkillPreview(kwargs('WARRIOR',{slash:20},skills,hero)),310014001);
  assert.deepEqual(p.coefficientModels.map(x=>x.amount),[100,100]);
  assert.equal(p.amount,null);
  const r=C.resistancePreview({stats:hero});
  assert.equal(r.states.physical,Math.floor(vit/28)*7);
  assert.equal(r.states.mental,Math.floor(spi/28)*7);
  count++;
 }
 assert.equal(count,250);
 assert.equal(JSON.stringify(skills),snapshot);
});
test('direct strikes and spells emit real current OS mastery names in RU and EN',()=>{
 const spell=C.elementalSpellCoefficientPreview({
  ...kwargs('WARLOCK',{element:20}),stats:{int:80}
 }).find(x=>x.id===410004001);
 assert.ok(spell);
 assert.equal(spell.available,false);
 assert.match(spell.reason,/Магия стихий/);
 assert.match(spell.reasonEn,/Elemental/);
 const strike=C.directStrikeCoefficientPreview(kwargs('JUGGERNAUT',{slash:1}))
  .find(x=>x.id===100102001);
 assert.ok(strike);assert.equal(strike.available,false);
 assert.match(strike.reason,/Секущий удар/);
 assert.match(strike.reasonEn,/Slash/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const jobs=JSON.parse(read('data/os/classes.json'));
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const args=(level=55,jobKey='CLERIC',catalog=skills,mastery=60)=>({
 level,int:90,spi:70,benevolence:mastery,healingPercent:120,
 jobKey,benevolenceCap:jobs[jobKey].branchCaps.benevolence,skillCatalog:catalog
});
const heal=(catalog=skills,level=55)=>C.healingSpellsPreview(args(level,'CLERIC',catalog)).rows;
const periodic=(catalog=skills,jobKey='CLERIC',level=45,mastery=41)=>C.periodicRecoveryPreview({
 level,spi:60,benevolence:mastery,jobKey,
 benevolenceCap:jobs[jobKey].branchCaps.benevolence,skillCatalog:catalog
}).rows;

test('all five current OS healing and triggered child coefficients retain their previous numerical results',()=>{
 const rows=heal();
 assert.deepEqual(rows.map(r=>[r.id,r.skillId,r.amount,r.available]),[
  ['firstAid',310001002,720,true],
  ['heal',310004002,1698,true],
  ['healingAura',310021002,1518,true],
  ['sanctuary',310023001,480,true],
  ['restoration',310022001,24,true]
 ]);
 assert.deepEqual(periodic().map(r=>[r.id,r.amount,r.available]),[
  [310002001,24,true],[310022001,21,true]
 ]);
 assert.equal(periodic(skills,'ASCETIC',20,0).find(r=>r.id===330005001)?.amount,2);
 const source=read('pandora-os-character-calculator.js');
 assert.match(source,/const source=skillCatalog\?\.\[String\(sourceId\)\]\?\.funcs\?\.\[0\]\?\.fv1/);
 assert.match(source,/const v=skillCatalog\?\.\[String\(id\)\]\?\.funcs\?\.\[0\]\?\.fv1/);
 assert.doesNotMatch(source,/const recoveryFV=healingSourceSpecs\.restoration\.standard\[5\]/);
});

test('official FV1 changes replay into precise direct, child and periodic models without editing constants',()=>{
 const before=JSON.stringify(skills),source=JSON.parse(before);
 const changed=[
  [310001002,0,100,3], // boosted INT coefficient in current variant
  [310004002,1,300,10], // CLERIC level coefficient
  [310021002,2,400,20], // CLERIC mastery coefficient
  [310023002,3,100,7], // Sanctuary CHILD effect, never its root link
  [310022001,3,5,3],   // periodic Restoration constant
  [310002001,3,10,1], // periodic Regeneration
  [330005001,1,10,10] // Natural Recovery SPI/level stage
 ];
 for(const [id,index,current,increase] of changed){
  assert.equal(source[id].funcs[0].fv1[index],current);
  source[id].funcs[0].fv1[index]+=increase;
 }
 const current=heal(),modified=heal(source);
 assert.deepEqual(modified.map(r=>r.available),current.map(r=>r.available));
 assert.deepEqual(modified.map(r=>r.amount),[724,1704,1532,488,27]);
 // The applied model is Remaked-style; a new official FV1 changes only the
 // affected skill. The source's exact meaning/rounding is still unverified.
 assert.deepEqual(periodic(source).map(r=>r.amount),[25,24]);
 assert.equal(periodic(source,'ASCETIC',20,0).find(r=>r.id===330005001)?.amount,4);
 assert.equal(JSON.stringify(skills),before,'neither preview may edit game files');
});

test('source identity, EP, FV2, trigger link and unsafe FV1 fail closed individually',()=>{
 const base=heal().map(r=>r.amount);
 for(const edit of [
  catalog=>{catalog[310004002].funcs[0].fv1[2]=NaN;},
  catalog=>{catalog[310004002].funcs[0].fv1[0]=-1;},
  catalog=>{catalog[310004002].funcs[0].fv1[3]=20001;},
  catalog=>{catalog[310004002].funcs[0].fv1=[0,0,0,0];},
  catalog=>{catalog[310004002].funcs[0].fv2[3]=5;},
  catalog=>{catalog[310004002].funcs[0].dir='CASTER';}
 ]){
  const copy=JSON.parse(JSON.stringify(skills));edit(copy);
  const out=heal(copy);
  assert.equal(out[1].available,false);
  assert.equal(out[1].amount,null);
  assert.equal(out[0].amount,base[0],'unaffected sibling still computes');
 }
 for(const edit of [
  catalog=>{catalog[310023001].funcs[0].fv1[3]=310023003;},
  catalog=>{catalog[310023002].funcs[0].ep='EP_ELEMENT_DAMAGE';},
  catalog=>{catalog[310023002].funcs[0].fv1[1]=-10;},
  catalog=>{catalog[310023002].funcs[0].fv2[3]=2;}
 ]){
  const copy=JSON.parse(JSON.stringify(skills));edit(copy);
  const out=heal(copy);
  assert.equal(out[3].available,false,'bad child/root link cannot produce a fake heal');
 }
 for(const edit of [
  catalog=>{catalog[310002001].funcs[0].fv1[2]=10001;},
  catalog=>{catalog[310022001].funcs[0].fv1[3]=-1;},
  catalog=>{catalog[330005001].funcs[0].fv2[3]=8;}
 ]){
  const copy=JSON.parse(JSON.stringify(skills));edit(copy);
  const changed=periodic(copy);
  if(copy[330005001].funcs[0].fv2[3]===8){
   assert.ok(!periodic(copy,'ASCETIC',20,0).some(r=>r.id===330005001));
  }else assert.ok(changed.length<2);
 }
});

test('28 class source variants x 55 levels: actual OS FV1 drives all permitted models',()=>{
 const original=JSON.stringify(skills);
 const direct=(v,level,int,mastery,percent)=>Math.floor(
  (v[3]+int*v[0]/100+level*v[1]/100+mastery*v[2]/100)*percent/100);
 const periodicAmount=(v,level,spi,mastery)=>v[3]+
  Math.floor(spi*v[0]/100)+Math.floor(level*v[1]/100)+
  Math.floor(mastery*v[2]/100);
 const activeId={firstAid:310001001,heal:310004001,
  healingAura:310021001,sanctuary:310023002,restoration:310022001};
 let inspected=0,modeled=0;
 for(const [job,entry] of Object.entries(jobs)){
  const cap=entry.branchCaps.benevolence||0;
  const mastery=Math.min(cap,60);
  for(let level=1;level<=55;level++){
   const h=C.healingSpellsPreview(args(level,job,skills,mastery));
   const p=C.periodicRecoveryPreview({
    level,spi:60,benevolence:mastery,jobKey:job,
    benevolenceCap:cap,skillCatalog:skills});
   assert.ok(h?.rows?.length===5&&Array.isArray(p?.rows));
   for(const r of h.rows){
    if(!r.available)continue;
    let id=r.skillId;
    if(r.id==='sanctuary')id=310023002;
    const v=skills[id].funcs[0].fv1;
    const expected=r.id==='restoration'?
      periodicAmount(v,level,70,mastery):
      direct(v,level,90,mastery,120);
    assert.equal(r.amount,expected,r.id+' '+job+' '+level);
    modeled++;
   }
   for(const row of p.rows){
    const v=skills[row.id].funcs[0].fv1;
    assert.equal(row.amount,periodicAmount(v,level,60,mastery));
   }
   inspected++;
  }
 }
 assert.equal(inspected,1540);
 assert.ok(modeled>20);
 assert.equal(JSON.stringify(skills),original);
});

test('spell output and both RU/EN next-step hints retain explicit model status',()=>{
 const spell=C.elementalSpellCoefficientPreview({
  skillCatalog:skills,jobKey:'WARLOCK',level:45,
  branchMasteries:{element:40},branchCaps:jobs.WARLOCK.branchCaps,stats:{int:60}
 }).find(r=>r.id===410001001);
 assert.equal(spell.amount,null);
 assert.equal(spell.uncertain,true);
 assert.equal(spell.coefficientModels[0].confidence,'coefficient-model');
 assert.equal(spell.coefficientModels[0].labelRu,'Коэффициент заклинания (модель)');
 assert.equal(spell.coefficientModels[0].labelEn,'Spell coefficient (model)');
 assert.equal(spell.coefficientModels[0].unit,'');
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/text:en\?'\(model\)':'\(модель\)'/);
 assert.match(book,/next\.effect\)\)\?\[make\('span',\{class:'stage-skill-coefficient-uncertainty'/);
});

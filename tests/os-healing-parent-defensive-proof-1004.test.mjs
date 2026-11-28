import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const jobs=JSON.parse(read('data/os/classes.json'));
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator,clone=()=>structuredClone(skills);
const original=JSON.stringify(skills);
const row=(list,id)=>list.find(x=>x.id===id);
const heals=(catalog=skills,job='CLERIC',level=55)=>C.healingSpellsPreview({
 skillCatalog:catalog,jobKey:job,level,int:90,spi:70,
 benevolence:Math.min(60,jobs[job].branchCaps.benevolence),
 benevolenceCap:jobs[job].branchCaps.benevolence,healingPercent:120}).rows;
const defend=(catalog=skills,job='SNIPER',ranks={warding:41},level=45,more={})=>
 C.defensiveSkillPreview({skillCatalog:catalog,jobKey:job,level,
  branchMasteries:ranks,hasShield:true,weaponKind:'1H_SWORD',...more});
const strength=(level=45,jobKey='DRAGOON',catalog=skills)=>
 C.incredibleStrengthPreview({skillCatalog:catalog,jobKey,level});
const upgrades=[
 ['firstAid',310001001,310001002,720],
 ['heal',310004001,310004002,1698],
 ['healingAura',310021001,310021002,1518]
];
test('all three authentic CLERIC Lv55 enhanced heals retain child coefficients and current roots',()=>{
 const rows=heals();
 for(const [key,root,child,amount] of upgrades){
  assert.equal(skills[child].prereq,root);
  assert.equal(skills[root].classes.CLERIC,1);
  assert.equal(row(rows,key)?.skillId,child);
  assert.equal(row(rows,key)?.amount,amount);
  assert.equal(row(rows,key)?.available,true);
 }
 assert.equal(row(rows,'sanctuary')?.amount,480);
 assert.equal(row(rows,'restoration')?.amount,24);
});
test('wrong or missing numeric root identity cannot enable an enhanced spell',()=>{
 for(const [key,root] of upgrades)for(const corrupt of [
  s=>{s.id=1;},s=>{s.id=String(root);},
  s=>{s.prereq=7;},s=>{s.learnable=false;}
 ]){
  const copy=clone();corrupt(copy[root]);
  assert.equal(row(heals(copy),key)?.available,false,key+' '+root);
  assert.equal(row(heals(copy),'sanctuary')?.available,true);
 }
 for(const [key,root] of upgrades){
  const copy=clone();delete copy[String(root)];
  assert.equal(row(heals(copy),key)?.available,false);
 }
});
test('forged root class, branch and learning level are not authoritative',()=>{
 for(const [key,root] of upgrades)for(const corrupt of [
  s=>{s.classes.CLERIC='1';},s=>{s.classes.CLERIC=true;},
  s=>{s.classes.CLERIC={};},s=>{s.classes.CLERIC=0;},
  s=>{s.branch='element';},s=>{s.branchRaw='OTHER_BRANCH';},
  s=>{s.skillType='ENEMY';},s=>{s.charLevel+=1;}
 ]){
  const copy=clone();corrupt(copy[root]);
  assert.equal(row(heals(copy),key)?.available,false,key+' '+root);
  assert.equal(row(heals(copy),'restoration')?.available,true);
 }
});
test('wrong healing predecessor reqs, effect identity or vector is rejected',()=>{
 for(const [key,root] of upgrades)for(const corrupt of [
  s=>{s.reqs=null;},s=>{s.reqs=[{branch:'other',amount:3}];},
  s=>{s.funcs=null;},s=>{s.funcs=[];},
  s=>{s.funcs[0].ep='EP_ELEMENT_DAMAGE';},
  s=>{s.funcs[0].dir='CASTER';},
  s=>{s.funcs[0].fv1=['1',2,3,4];},
  s=>{s.funcs[0].fv2[3]=3;}
 ]){
  const copy=clone();corrupt(copy[root]);
  assert.equal(row(heals(copy),key)?.available,false,key+' '+root);
 }
});
test('verified numeric FV1 updates remain dynamic, rather than frozen in a root contract',()=>{
 const baseline=heals();
 for(const [key,root] of upgrades){
  const copy=clone();copy[root].funcs[0].fv1[0]+=5;
  assert.equal(row(heals(copy),key)?.available,true);
  assert.equal(row(heals(copy),key)?.amount,row(baseline,key)?.amount,
   'Enhanced child owns its own source FV1, not the predecessor vector');
 }
});
test('enhanced healing child branch must still match the exact current healing family',()=>{
 for(const [key,,child] of upgrades)for(const prop of ['branch','branchRaw']){
  const copy=clone();copy[child][prop]='OTHER';
  assert.equal(row(heals(copy),key)?.available,false);
  assert.equal(row(heals(copy),'sanctuary')?.available,true);
 }
});
test('Sanctuary linked source is a real SPHERE effect with no independent class',()=>{
 assert.equal(skills[310023002].skillType,'SPHERE');
 assert.deepEqual(Object.keys(skills[310023002].classes),[]);
 assert.equal(row(heals(),'sanctuary')?.available,true);
 for(const corrupt of [
  s=>{s.id=42;},s=>{s.learnable=false;},s=>{s.skillType='ALLY';},
  s=>{s.branch='element';},s=>{s.branchRaw='OTHER';},
  s=>{s.prereq=310023001;},s=>{s.charLevel=20;},
  s=>{s.classes.CLERIC=1;},s=>{s.classes=['CLERIC'];},
  s=>{s.classes=null;},s=>{s.funcs=[];}
 ]){
  const copy=clone();corrupt(copy[310023002]);
  assert.equal(row(heals(copy),'sanctuary')?.available,false);
  assert.equal(row(heals(copy),'heal')?.available,true);
 }
});
test('defensive model requires numeric mastery: string, Boolean and object cannot unlock it',()=>{
 assert.equal(row(defend(),260008001)?.available,true);
 for(const bad of ['41',true,[],{},null,undefined,NaN,40]){
  const result=row(defend(skills,'SNIPER',{warding:bad}),260008001);
  assert.equal(result?.available,false,String(bad));
  assert.match(result.reason,/мастерство/);
 }
 assert.equal(row(defend(skills,'SNIPER',{warding:41}),260008001)?.available,true);
});
test('invalid defensive source req shapes and weapon fields are rejected, siblings survive',()=>{
 for(const corrupt of [
  s=>{s.reqs=[null];},s=>{s.reqs=[{}];},
  s=>{s.reqs=[{branch:'warding',amount:'41'}];},
  s=>{s.reqs=[{branch:'',amount:41}];},
  s=>{s.reqs=[{branch:'warding',amount:-1}];},
  s=>{s.reqs=[{branch:'warding',amount:Infinity}];},
  s=>{s.weaponUse='1H_SWORD';}
 ]){
  const copy=clone();corrupt(copy[260008001]);
  assert.equal(row(defend(copy),260008001),undefined);
  assert.ok(row(defend(copy),260005001));
 }
});
test('wrong defensive source level and nonlearnable flag never imply a verified available effect',()=>{
 for(const bad of ['35',null,true,NaN,56,-1]){
  const copy=clone();copy[100053001].charLevel=bad;
  assert.equal(row(defend(copy,'KNIGHT',{},45),100053001),undefined);
 }
 for(const bad of [false,null,0,'true']){
  const copy=clone();copy[100053001].learnable=bad;
  assert.equal(row(defend(copy,'KNIGHT',{},45),100053001)?.available,false);
 }
});
test('defense and on-hit effects cannot appear outside the supported 1..55 planner levels',()=>{
 assert.deepEqual(defend(skills,'SNIPER',{warding:41},0),[]);
 assert.deepEqual(defend(skills,'SNIPER',{warding:41},56),[]);
 assert.deepEqual(defend(skills,'SNIPER',{warding:41},1.5),[]);
 assert.equal(strength(55)?.applies,true);
 assert.equal(strength(20)?.applies,true);
 assert.equal(strength(19),null);
 assert.equal(strength(56),null);
 assert.equal(strength(0),null);
});
test('missing RU/EN label maps do not crash locked defensive previews',()=>{
 const args={branchLabels:null,englishBranches:null};
 assert.doesNotThrow(()=>defend(skills,'SNIPER',{warding:0},45,args));
 const hit=row(defend(skills,'SNIPER',{warding:0},45,args),260008001);
 assert.equal(hit?.available,false);
 assert.match(hit.reason,/warding/);
 assert.match(hit.reasonEn,/warding/);
});
test('28 class by 55 levels: source-backed defensive gates stay numerically unchanged',()=>{
 let compared=0;
 for(const [job,entry] of Object.entries(jobs)){
  const mastery=entry.branchCaps;
  for(let level=1;level<=55;level++){
   const rows=defend(skills,job,mastery,level);
   for(const current of rows){
    const source=skills[String(current.id)];
    const expected=source.learnable===true&&source.prereq===null&&
      level>=source.charLevel&&source.reqs.every(req=>
       Number.isSafeInteger(mastery[req.branch])&&
       mastery[req.branch]>=req.amount);
    assert.equal(source.classes[job],1);
    assert.equal(current.available,expected,job+' L'+level+' '+current.id);
   }
   compared++;
  }
 }
 assert.equal(compared,1540);
 assert.equal(JSON.stringify(skills),original);
});

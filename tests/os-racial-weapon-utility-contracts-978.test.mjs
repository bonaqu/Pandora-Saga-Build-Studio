import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const items=JSON.parse(read('data/os/items.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const passives=JSON.parse(read('data/os/racialPassives.json'));
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;

const cases=[
 {id:900010001,race:'HUMAN',kind:'oneHanded',item:21,flat:10,percent:12},
 {id:900030002,race:'DWARF',kind:'axeBlunt',item:601,flat:10,percent:12},
 {id:900050002,race:'ENKIDU',kind:'twoHanded',item:2201,flat:0,percent:12}
];
const w=(id,source=skills,weapon=items[21])=>C.racialWeaponPreview({
 racialPassiveId:id,skillCatalog:source,weapon
});
const change=(id,mutate)=>{const copy=structuredClone(skills);
 mutate(copy[String(id)]);return copy};

test('three official racial weapon actions retain current numbers and matched item groups',()=>{
 assert.equal(Object.keys(classes).length,28);
 let count=0;
 for(const spec of cases){
  assert.ok(passives[spec.race].skills.includes(spec.id));
  const rec=skills[spec.id],action=rec.funcs[0];
  assert.equal(action.ep,'EP_SKILL_EQUIP_DAMAGERATE');
  assert.deepEqual(action.fv1.slice(0,3),[0,0,0]);
  assert.deepEqual(action.fv2.slice(0,3),[0,0,0]);
  for(const job of Object.keys(classes)){
   const result=w(spec.id,skills,items[spec.item]);
   assert.deepEqual([result.flat,result.percent,result.kind],
    [spec.flat,spec.percent,spec.kind],job);
   assert.equal(result.matchesCategory,true);
   assert.equal(result.verified,false);
   count++;
  }
 }
 assert.equal(count,84);
});

test('both independent FV source coefficients replay dynamically, never a frozen bonus',()=>{
 for(const spec of cases){
  for(const field of ['fv1','fv2']){
   const next=change(spec.id,record=>{record.funcs[0][field][3]+=3});
   const result=w(spec.id,next,items[spec.item]);
   assert.ok(result);
   assert.equal(result.flat,spec.flat+(field==='fv1'?3:0));
   assert.equal(result.percent,spec.percent+(field==='fv2'?3:0));
  }
 }
});

test('unverified metadata, unknown side channels and malformed weapons fail closed',()=>{
 const modifiers=[
  rec=>{rec.learnable=true},
  rec=>{rec.branch='defense'},
  rec=>{rec.branchRaw='DEFENSE'},
  rec=>{rec.charLevel=20},
  rec=>{rec.reqLevel=10},
  rec=>{rec.prereq=1},
  rec=>{rec.isLevelBased=false},
  rec=>{rec.reqs=[{branch:'defense',amount:3}]},
  rec=>{rec.classes.WARRIOR=1},
  rec=>{rec.funcs.push(structuredClone(rec.funcs[0]))},
  rec=>{rec.funcs[0].dir='CASTER'},
  rec=>{rec.funcs[0].ep='EP_NEW_EFFECT'},
  rec=>{rec.funcs[0].fv1[0]=1},
  rec=>{rec.funcs[0].fv2[2]=1},
  rec=>{rec.funcs[0].fv1[3]=0.5},
  rec=>{rec.funcs[0].fv2[3]=101},
  rec=>{rec.weaponUse.push('UNKNOWN_NEW_WEAPON')},
  rec=>{rec.weaponUse.push(rec.weaponUse[0])},
  rec=>{rec.weaponUse=[]}
 ];
 for(const spec of cases)for(const mut of modifiers){
  const bad=change(spec.id,mut);
  assert.equal(w(spec.id,bad,items[spec.item]),null,
   spec.id+' source contract mutation '+mut.toString());
 }
 assert.equal(w(999999999),null);
});

test('ELF has two paired FV1 channels only, DWARF survival shares four-effect source gate',()=>{
 assert.ok(passives.ELF.skills.includes(900020002));
 const present=C.racialUtilityPreview({racialPassiveId:900020002,skillCatalog:skills});
 assert.deepEqual(present.range,{general:500,carry:500});
 assert.equal(present.verified,false);
 const dwarf=C.racialUtilityPreview({racialPassiveId:900030001,skillCatalog:skills});
 assert.equal(dwarf.survival.chance,20);
 assert.equal(dwarf.survival.verified,false);
 const changed=change(900020002,rec=>{
  for(const fx of rec.funcs)fx.fv1[3]=530;
 });
 assert.deepEqual(C.racialUtilityPreview({
  racialPassiveId:900020002,skillCatalog:changed
 }).range,{general:530,carry:530});
 const variants=[
  rec=>{rec.funcs.push(structuredClone(rec.funcs[0]))},
  rec=>{rec.funcs[0].fv2[1]=100},
  rec=>{rec.funcs[0].fv1[0]=100},
  rec=>{rec.weaponUse=['BOW']},
  rec=>{rec.charLevel=45},
  rec=>{rec.branchRaw='EXTRA'}
 ];
 for(const mut of variants){
  const bad=change(900020002,mut);
  assert.equal(C.racialUtilityPreview({racialPassiveId:900020002,skillCatalog:bad}),
   null,mut.toString());
 }
 const strong=change(900030001,rec=>{rec.funcs[2].fv2[0]=3});
 assert.equal(C.racialUtilityPreview({
  racialPassiveId:900030001,skillCatalog:strong
 }),null,'unknown status channel invalidates conditional survival too');
 const diff=change(900030001,rec=>{rec.funcs[0].fv1[3]=25});
 assert.equal(C.racialUtilityPreview({
  racialPassiveId:900030001,skillCatalog:diff
 }).survival.chance,25);
});

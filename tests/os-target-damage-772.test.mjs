import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};
Function('window',read('pandora-studio-target-damage.js'))(root);
const D=root.PandoraOSTargetDamage;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const items=JSON.parse(read('data/os/items.json'));
const souls=JSON.parse(read('data/os/souls.json'));
const itemForth=JSON.parse(read('data/os/itemForth.json'));
const unison=JSON.parse(read('data/os/unison.json'));
const mods=rate=>({combat:{spellDamageEquipmentRate:rate,priestSong:{}},
 priestApplied:{}});
const fixture=(patch={})=>({
 skillCatalog:skills,classes,jobKey:'DISTURBANCE',level:45,
 masteries:{trap:41},branchCaps:classes.DISTURBANCE.branchCaps,
 stats:{dex:70,int:20},equipment:[],tables,itemForth,unison,
 modifiers:mods(0),...patch
});
const worn=(id,grade=0,extra={})=>({record:items[String(id)],
 refinement:grade,gem:null,issue:[],souls:[],...extra});
const output=(patch={})=>D.crawlingTrap(fixture(patch));
const triplet=x=>x&&[x.min,x.average,x.max];
test('Full trap→projectile→fire explosion remains the exact OS action chain',()=>{
 assert.deepEqual(triplet(output()),[34,148,194]);
 assert.equal(output()?.skillId,240005001);
 const stages=[
  ['240005001',0,'fv1',0,1],
  ['240005001',1,'fv2',0,9],
  ['240005002',0,'fv1',2,10],
  ['240005003',0,'fv1',0,681],
  ['240005003',0,'fv2',0,1]
 ];
 for(const [id,index,key,coord,value] of stages){
  const mutated=structuredClone(skills);
  mutated[id].funcs[index][key][coord]=value;
  assert.equal(output({skillCatalog:mutated}),null,
   'Unexpected action change '+id+' '+index+' '+key+' '+coord);
 }
 const direction=structuredClone(skills);
 direction['240005002'].funcs[0].dir='CASTER';
 assert.equal(output({skillCatalog:direction}),null);
 const changedCost=structuredClone(skills);
 changedCost['240005001'].funcs[0].fv2[3]=3;
 assert.equal(output({skillCatalog:changedCost}),null);
});
test('Sparse cumulative OS refinement applies at intermediate forge grades',()=>{
 const coat=items['12605'];
 assert.match(coat.desc,/За каждые 2 единицы/);
 assert.deepEqual(Object.keys(itemForth['12605']),
  ['2','4','6','8','10']);
 assert.deepEqual(triplet(output({equipment:[worn(12605,3)],
  modifiers:mods(1)})),[35,150,196]);
 assert.deepEqual(triplet(output({equipment:[worn(12605,5)],
  modifiers:mods(2)})),[35,152,198]);
 assert.equal(output({equipment:[worn(12605,3)]}),null,
  'Mismatch between character sheet and target damage must never silently pass');
 assert.deepEqual(D.equippedElementalEffects({
  equipment:[worn(12605,3)],itemForth,unison}),
  {general:1,fire:0,penetration:0});
});
test('Only eligible active Souls participate and their exact bonus is counted once',()=>{
 assert.deepEqual(souls['101006'].slots,['weapon']);
 const full=D.equippedElementalEffects({
  equipment:[worn(1,0,{souls:[souls['101006']]})],itemForth,unison
 });
 assert.deepEqual(full,{general:2,fire:0,penetration:0});
 assert.ok(output({equipment:[worn(1,0,{souls:[souls['101006']]})],
  modifiers:mods(2)}).max>output().max);
 const app=read('pandora-studio-app.js');
 assert.match(app,/\.filter\(s=>s&&plan\.validSoul\(s,slotKeys\[Number\(slot\)\]\)\)/);
 assert.doesNotMatch(app,/\.filter\(Boolean\)\.map\(s=>catalog\.souls\?\.\[String\(s\.id\)\]\|\|s\)/);
});
test('OS source grade min/max windows work on item and socketed Soul effects',()=>{
 const custom={...worn(1,3),record:{...items['1'],
  effects:[{func:'EP_ELEMENT_DAMAGE_SCALE',a:12,min:4,max:6}]},
  souls:[{id:900001,effects:[{func:'EP_ELEMENT_DAMAGE_SCALE',a:7,min:5,max:9}]}]};
 const clean=D.equippedElementalEffects({
  equipment:[custom],itemForth,unison
 });
 assert.equal(clean.general,0,'+3 is below both thresholds');
 const active=D.equippedElementalEffects({
  equipment:[{...custom,refinement:5}],itemForth,unison});
 assert.equal(active.general,19);
 const expired=D.equippedElementalEffects({
  equipment:[{...custom,refinement:8}],itemForth,unison});
 assert.equal(expired.general,7);
});
test('OS unison companions exclude the root and repeated IDs',()=>{
 const synthetic={
  '1':{members:[1,1,12605,12605],rows:[
   {minC:1,maxC:1,minL:0,maxL:10,func:'EP_ELEMENT_DAMAGE_SCALE',
    a:{f:0,p:0,c:6},b:{f:0,p:0,c:0}}
  ]}
 };
 const equipment=[worn(1),worn(12605)];
 assert.equal(D.equippedElementalEffects({
  equipment,itemForth,unison:synthetic})?.general,6);
 assert.equal(D.equippedElementalEffects({
  equipment:[worn(1)],itemForth,unison:synthetic})?.general,0);
});
test('Existing Book stays compact with only selected numeric hit components',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/Усиление урона/);
 assert.match(book,/Магическая заточка/);
 assert.match(book,/if\(boostParts\.length\)more\.append/);
 assert.doesNotMatch(book,/stage-material-actions|function materialSkillResults\(/);
});

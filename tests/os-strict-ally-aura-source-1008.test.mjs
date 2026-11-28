import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const jobs=JSON.parse(read('data/os/classes.json'));
const items=JSON.parse(read('data/os/items.json'));
const souls=JSON.parse(read('data/os/souls.json'));
const original=JSON.stringify(skills),host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const by=(list,id)=>list.find(x=>x.id===id);
const clone=()=>structuredClone(skills);
const basis={attack:{walkingBase:160},accuracy:{base:100},
 dodge:{base:130},defense:{directRaw:50}};
const allied=(combat=basis)=>C.alliedRecipientPreviews({
 skillCatalog:skills,combat,includeSource:false});
const aura=(auras,records=[])=>C.auraDamagePreview({
 gemstones:{auras},records});
const element=(catalog=skills)=>C.elementalSpellCoefficientPreview({
 skillCatalog:catalog,jobKey:'WARLOCK',level:55,
 branchMasteries:{element:50,darkness:20},
 branchCaps:jobs.WARLOCK.branchCaps,stats:{int:80}});
const scaling=(catalog=skills,job='SNIPER',level=45)=>
 C.scalingSkillPreview({skillCatalog:catalog,jobKey:job,level,
  branchMasteries:{warding:26},branchCaps:jobs[job].branchCaps,
  stats:{vit:50,str:50,agi:60,dex:50,spi:50,int:50},combat:basis});

test('all 571 current learned-effect source levels are true numeric integers',()=>{
 assert.equal(Object.keys(skills).length,571);
 for(const skill of Object.values(skills)){
  assert.equal(Number.isSafeInteger(skill.charLevel),true,skill.name);
  assert.ok(skill.charLevel>=0&&skill.charLevel<=55);
 }
 assert.equal(Object.keys(jobs).length,28);
});

test('elemental spell coefficients preserve real OS sources and all modeled caution flags',()=>{
 const r=by(element(),410001001);
 assert.equal(r?.coefficientModels[0].amount,150);
 assert.equal(r?.available,true);
 assert.equal(r?.amount,null);
 assert.equal(r?.uncertain,true);
 assert.ok(by(element(),410002001));
});

test('numeric-looking or missing spell source level cannot unlock a forged model',()=>{
 for(const bad of ['0',true,[0],{},null,56,-1,NaN]){
  const altered=clone();altered['410001001'].charLevel=bad;
  assert.equal(by(element(altered),410001001),undefined,
   'No source-level coercion: '+String(bad));
  assert.ok(by(element(altered),410002001),
   'Unrelated actual elemental spell remains visible');
 }
});

test('scaling self-skill source levels require numeric proof, unlike recipient buffs',()=>{
 assert.equal(by(scaling().defense,260007001)?.amount,15);
 assert.equal(by(scaling().defense,260007001)?.available,true);
 for(const bad of ['0',true,[0],{},null,56,-1,NaN]){
  const altered=clone();altered['260007001'].charLevel=bad;
  assert.equal(by(scaling(altered).defense,260007001),undefined);
  assert.equal(by(scaling(altered).movement,320004001)?.recipient,true,
   'External movement applies to a recipient, not a self skill');
 }
});

test('three ally recipient formulas retain genuine numerical attack/accuracy/dodge bases',()=>{
 const r=allied();
 assert.deepEqual(r.warCry,{base:160,bonus:42});
 assert.deepEqual(r.massConcentration,{base:100,bonus:35});
 assert.deepEqual(r.windAssist,{base:130,bonus:34});
 assert.equal(r.windBlessing?.bonus,40);
 assert.equal(r.divineBlessing?.bonus,25);
 assert.equal(r.blessedRepose?.bonus,90);
});

test('malformed Attack basis cannot create a War Cry bonus',()=>{
 for(const bad of ['160',true,[160],{},null,NaN,Infinity,-5]){
  const r=allied({...basis,attack:{walkingBase:bad}});
  assert.equal(r.warCry,null,'Forged ATK: '+String(bad));
  assert.equal(r.massConcentration?.bonus,35);
  assert.equal(r.windAssist?.bonus,34);
 }
});

test('malformed accuracy and dodge cannot fabricate ally-source coefficients',()=>{
 for(const field of ['accuracy','dodge'])for(const bad of ['130',true,[130],{},null,NaN,Infinity,-2]){
  const r=allied({...basis,[field]:{base:bad}});
  assert.equal(field==='accuracy'?r.massConcentration:r.windAssist,null,
   'Forged '+field+': '+String(bad));
  assert.equal(r.warCry?.bonus,42);
 }
});

test('forged mounted attack cannot fall back to genuine walking base',()=>{
 const valid=allied({...basis,attack:{walkingBase:160,mountedBase:200}});
 assert.equal(valid.warCry?.bonus,50);
 for(const bad of ['200',[200],true,{}]){
  const r=allied({...basis,attack:{walkingBase:160,mountedBase:bad}});
  assert.equal(r.warCry,null);
 }
 assert.equal(allied({...basis,attack:{walkingBase:160,mountedBase:null}})
  .warCry?.bonus,42);
});

test('source-only ally effects independent of recipient numerical bases survive bad stats',()=>{
 const r=allied({attack:{walkingBase:[160]},accuracy:{base:'100'},dodge:{base:true}});
 assert.equal(r.warCry,null);
 assert.equal(r.massConcentration,null);
 assert.equal(r.windAssist,null);
 assert.equal(r.windBlessing?.bonus,40);
 assert.equal(r.divineBlessing?.bonus,25);
 assert.equal(r.blessedRepose?.bonus,90);
});

test('genuine numeric aura sources retain source-only known magnitudes',()=>{
 const r=aura({fire:17,ice:1,lightning:20,poison:5});
 assert.equal(r.elements.fire.base,17);
 assert.equal(r.elements.fire.known,17);
 assert.equal(r.elements.ice.known,1);
 assert.equal(r.elements.lightning.known,20);
 assert.equal(r.elements.poison.known,5);
 assert.equal(r.verified,false);
});

test('Boolean, numeric strings and one-element arrays cannot generate aura damage',()=>{
 for(const bad of ['17',true,false,[17],[],{},null,Infinity,NaN]){
  const r=aura({fire:bad,poison:5});
  assert.equal(r.elements.fire,undefined,'Forged fire aura '+String(bad));
  assert.equal(r.elements.poison.known,5,
   'Independent numerically proved poison aura stays available');
 }
});

test('null and invalid aura dictionaries fail safely, valid empty dictionary remains',()=>{
 for(const bad of [null,false,[],23,'bad']){
  assert.doesNotThrow(()=>aura(bad));
  assert.equal(aura(bad),null);
 }
 const blank=aura({});
 assert.deepEqual(blank.elements,{});
});

test('real numeric gemstones continue to drive physical weapon aura',()=>{
 const gems=C.gemstonePreview([{slot:'weapon',itemId:422,grade:7,
  gem:{type:'physical',element:'fire'}}]);
 const native=gems.auras.fire;
 assert.ok(Number.isFinite(native)&&native>0);
 const preview=C.auraDamagePreview({gemstones:gems,records:[]});
 assert.equal(preview.elements.fire.base,native);
 assert.equal(preview.elements.fire.known,native);
 assert.equal(preview.verified,false);
});

test('confirmed on-hit item and Soul still require canonical numeric catalog identity',()=>{
 for(const [type,id,source] of [['item',422,items[422]],
  ['soul',101010,souls[101010]]]){
  const key=type+':'+id,valid=C.specialEquipmentPreview({
   records:[[key,source,0]]});
  assert.equal(valid.entries.length,1,key);
  const corrupted=structuredClone(source);
  corrupted.id=String(id);
  assert.equal(C.specialEquipmentPreview({records:[[key,corrupted,0]]}).entries.length,
   0,'Do not accept a string ID as a confirmed proc');
 }
});

test('all 28 jobs x Lv1..55 retain source-only numeric state and never invent final damage',()=>{
 let compared=0;
 for(const [job,info] of Object.entries(jobs)){
  for(let level=1;level<=55;level++){
   const r=C.scalingSkillPreview({skillCatalog:skills,jobKey:job,level,
    branchCaps:info.branchCaps,branchMasteries:info.branchCaps,
    stats:{vit:50,str:50,agi:60,dex:50,spi:50,int:50},combat:basis});
   for(const group of ['offense','defense','movement','utility']){
    for(const entry of r[group]){
     const source=skills[String(entry.id)];
     assert.ok(source,'Every source-backed model has a known numeric ID');
     assert.equal(Number.isSafeInteger(source.charLevel),true);
     if(entry.modelOnly===true)assert.equal(entry.uncertain,true);
     assert.equal('finalDamage' in entry,false,
      'Source-only coefficients are not verified final target damage');
    }
   }
   compared++;
  }
 }
 assert.equal(compared,1540);
 assert.equal(JSON.stringify(skills),original);
});

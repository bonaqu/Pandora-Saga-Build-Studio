import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json')),meta=JSON.parse(read('data/os/meta.json'));
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const args={spi:134,blessing:90,hymn:30,exorcism:26};
const cast=(src=skills)=>C.priestCastPreviews({...args,skills:src});
const effect=(src,ep)=>src['320011001'].funcs.find(f=>f.ep===ep);
const updated=(ep,index,value)=>{
 const next=structuredClone(skills);
 effect(next,ep).fv1[index]=value;
 return next;
};
test('current live source provides one three-effect ENCHANTER skill without unknown dependencies',()=>{
 const source=skills['320011001'];
 assert.equal(source.id,320011001);
 assert.equal(source.skillType,'ALLY');
 assert.equal(source.learnable,true);
 assert.equal(source.charLevel,45);
 assert.equal(source.classes.ENCHANTER,1);
 assert.deepEqual(source.reqs,[]);
 assert.deepEqual(source.funcs.map(x=>x.ep),[
  'EP_AURADAMAGE_SCALE','EP_AURADAMAGE_CONST','EP_ELEMENT_DAMAGE_SCALE'
 ]);
 assert.deepEqual(source.funcs.map(x=>x.fv1),[
  [20,0,20,10],[5,0,10,5],[0,0,20,10]
 ]);
 assert.deepEqual(source.funcs.map(x=>x.fv2),[
  [0,0,0,0],[0,0,0,0],[0,0,0,0]
 ]);
});
test('all three linked FV1 magnitudes replay independently while assembled Holy aura stays coherent',()=>{
 const baseline=cast();
 assert.deepEqual([
  baseline.enchantAuraRate,baseline.enchantAuraFlat,
  baseline.enchantElementRate,baseline.holyEnhanced
 ],[54,20,28,36]);
 assert.equal(baseline.verified,false);
 const cases=[
  ['EP_AURADAMAGE_SCALE',3,11,'enchantAuraRate',55],
  ['EP_AURADAMAGE_CONST',3,6,'enchantAuraFlat',21],
  ['EP_ELEMENT_DAMAGE_SCALE',3,11,'enchantElementRate',29]
 ];
 const original=JSON.stringify(skills);
 for(const [ep,index,value,key,expected] of cases){
  const changed=cast(updated(ep,index,value));
  assert.equal(changed[key],expected);
  assert.equal(changed.verified,false);
  for(const other of ['enchantAuraRate','enchantAuraFlat','enchantElementRate']){
   if(other!==key)assert.equal(changed[other],baseline[other]);
  }
  assert.equal(changed.holyEnhanced,
   baseline.holyWeapon+changed.enchantAuraFlat+
    Math.ceil(baseline.holyWeapon*changed.enchantAuraRate/100));
 }
 assert.equal(JSON.stringify(skills),original);
});
test('all-or-nothing three-effect gate rejects source substitutions, unknown channels and FV2',()=>{
 const variants=[
  src=>{effect(src,'EP_AURADAMAGE_SCALE').fv1[1]=1},
  src=>{effect(src,'EP_AURADAMAGE_CONST').fv2[3]=1},
  src=>{effect(src,'EP_ELEMENT_DAMAGE_SCALE').fv1[0]=1},
  src=>{effect(src,'EP_ELEMENT_DAMAGE_SCALE').dir='CASTER'},
  src=>{effect(src,'EP_AURADAMAGE_SCALE').ep='EP_BAD_SOURCE'},
  src=>{src['320011001'].funcs.push({...src['320011001'].funcs[0]})},
  src=>{src['320011001'].classes.ENCHANTER=0},
  src=>{src['320011001'].charLevel=44},
  src=>{src['320011001'].reqs=[{branch:'blessing',amount:1}]},
  src=>{effect(src,'EP_AURADAMAGE_SCALE').fv1[0]=-1}
 ];
 for(const mutate of variants){
  const copy=structuredClone(skills);
  mutate(copy);
  const x=cast(copy);
  for(const key of ['enchantAuraRate','enchantAuraFlat','enchantElementRate','holyEnhanced'])
   assert.equal(x[key],null,key+' must not survive unreviewed source');
  assert.equal(x.holyWeapon,10,'independent Holy Weapon survives');
 }
});
test('official OS metadata warnings are current source diagnostics, not guessed combat coefficients',()=>{
 assert.equal(meta.curated,true);
 assert.equal(meta.warnings.length,13);
 assert.ok(meta.warnings.some(s=>s.startsWith('61 event scripts')));
 assert.ok(meta.warnings.some(s=>s.startsWith('96 equippable items')));
 assert.ok(meta.warnings.some(s=>s.startsWith('51 mobs drop loot')));
 assert.ok(meta.warnings.some(s=>s.startsWith('areasv10/map_drop.json')));
 assert.ok(meta.warnings.some(s=>s.startsWith('99 map-drop rows')));
 assert.equal(new Set(meta.warnings).size,meta.warnings.length);
});

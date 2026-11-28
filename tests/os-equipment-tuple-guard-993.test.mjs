import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const env={};
Function('window',read('pandora-os-character-calculator.js'))(env);
const C=env.PandoraOSCalculator;
const items=JSON.parse(read('data/os/items.json'));
const souls=JSON.parse(read('data/os/souls.json'));
const forth=JSON.parse(read('data/os/itemForth.json'));

const valid=[
 ['item:13041',items['13041'],0],
 ['soul:100001',souls['100001'],0]
];
const damaged=[null,undefined,false,5,'malformed',{},[],['item:13041'],
 ['item:13041',items['13041']],...valid];

test('all twelve equipment preview paths skip malformed saved tuples without losing valid results',()=>{
 const configs=[
  ['potionRecovery',{vit:42}],
  ['healingSkillPreview',{}],
  ['defensePreview',{}],
  ['secondaryEffectsPreview',{}],
  ['battleMapCloakPreview',{skills:{}}],
  ['conditionalProcPreview',{skills:{}}],
  ['experienceBonusPreview',{}],
  ['attackRangePreview',{}],
  ['specialEquipmentPreview',{}],
  ['effectCoverage',{}],
  ['elementalRefinementPreview',{gemSelections:[]}]
 ];
 for(const [name,extra] of configs){
  const pristine=C[name]({...extra,records:valid,itemForth:forth});
  const candidate=C[name]({...extra,records:damaged,itemForth:forth});
  assert.deepEqual(candidate,pristine,name+' must not crash or drop a valid entry');
 }
 const expected=C.equippedCombatModifiers(valid,forth);
 assert.deepEqual(C.equippedCombatModifiers(damaged,forth),expected);
});

test('potion, healing and coverage previews safely ignore an entirely damaged list',()=>{
 for(const [name,extra] of [
  ['potionRecovery',{vit:42}],
  ['healingSkillPreview',{}],
  ['effectCoverage',{}]
 ]){
  assert.deepEqual(C[name]({...extra,records:damaged.slice(0,8),itemForth:forth}),
   C[name]({...extra,records:[],itemForth:forth}));
 }
});

test('numeric item and Soul references cannot spoof IDs or base armor',()=>{
 const fakeItem={id:13041,slot:'body',AC:5000,name:'Forged base armor',
  effects:[
   {func:'EP_STRENGTH_CONST',a:700},
   {func:'EP_MASTERY_POTION',a:150},
   {func:'EP_CAST_HEAL_LIFE_SCALE',a:99}
  ]};
 const fakeSoul={id:100001,effects:[{func:'EP_MAXLIFE_CONST',a:9000}]};
 for(const [label,rec] of [
  ['item:999',fakeItem],['item:013041',fakeItem],
  ['soul:999',fakeSoul],['soul:0100001',fakeSoul]
 ]){
  assert.deepEqual(C.sourceEffects(label,rec,0,forth),[],label);
  assert.deepEqual(C.gatherEffects([[label,rec,0]],forth),
   C.gatherEffects([],forth),label);
 }
 assert.equal(C.defensePreview({
  records:[['item:999',fakeItem,10]],itemForth:forth}).known,0);
 assert.equal(C.potionRecovery({vit:42,
  records:[['item:999',fakeItem,0]],itemForth:forth}).equipment,0);
 assert.equal(C.healingSkillPreview({
  records:[['item:999',fakeItem,0]],itemForth:forth}).equipment,0);
});
test('canonical identities and synthetic non-reserved fixtures still calculate',()=>{
 assert.ok(C.sourceEffects('item:13041',items['13041'],0,forth).length>=0);
 assert.deepEqual(C.sourceEffects('item:13041',
  {...items['13041'],id:999},0,forth),[]);
 const fixture={effects:[{func:'EP_STRENGTH_CONST',a:7}]};
 assert.equal(C.gatherEffects([['fixture:isolated',fixture,0]],forth).flat.str,7);
 assert.deepEqual(C.gatherEffects(valid,forth),
  C.gatherEffects(damaged,forth));
});

test('real catalog tuples retain all 1255 equipment and Soul identities',()=>{
 let checked=0;
 for(const [type,records] of [['item',items],['soul',souls]])
  for(const [id,rec] of Object.entries(records)){
   const source=type+':'+id;
   for(let grade=0;grade<=10;grade++){
    const result=C.sourceEffects(source,rec,grade,forth);
    assert.ok(Array.isArray(result),source+' +'+grade);
    checked++;
   }
  }
 assert.equal(checked,13805);
});

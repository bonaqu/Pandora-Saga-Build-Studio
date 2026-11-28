import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const env={};
Function('window',read('pandora-os-character-calculator.js'))(env);
Function('window',read('pandora-studio-equipment-plan.js'))(env);
const C=env.PandoraOSCalculator,P=env.PandoraEquipmentPlan;
const items=JSON.parse(read('data/os/items.json'));
const souls=JSON.parse(read('data/os/souls.json'));
const forth=JSON.parse(read('data/os/itemForth.json'));
const sets=JSON.parse(read('data/os/unison.json'));

test('malformed aggregate tuples are skipped without hiding independent valid effects',()=>{
 const valid=['item:13041',items['13041'],0];
 const synthetic=['soul:777',{id:777,effects:[{func:'EP_VITARITY_CONST',a:3}]},0];
 const correct=C.gatherEffects([valid,synthetic],forth);
 const mixed=[undefined,null,false,42,{},[],[1],valid,synthetic];
 assert.doesNotThrow(()=>C.gatherEffects(mixed,forth));
 assert.deepEqual(C.gatherEffects(mixed,forth),correct);
 const empty=C.gatherEffects([],forth);
 for(const malformed of [null,undefined,0,false,{},'records'])
  assert.deepEqual(C.gatherEffects(malformed,forth),empty);
});

test('one malformed set row does not crash the planner or discard valid siblings',()=>{
 const records=[['item:14094',items['14094'],0],
  ['item:17034',items['17034'],0]];
 const valid=sets['14094'].rows;
 const expected=C.unisonPreview({records,catalog:{14094:sets['14094']}});
 assert.equal(expected.active.length,1);
 for(const corrupt of [null,false,42,'bad',[],{}, {minC:'1'}]){
  const raw={...sets['14094'],rows:[corrupt,...valid]};
  const actual=C.unisonPreview({records,catalog:{14094:raw}});
  assert.deepEqual(actual,expected,
   'bad row '+String(corrupt)+' should not hide verified VIT and attack bonuses');
 }
 assert.deepEqual(C.unisonPreview({records,catalog:sets}),
  C.unisonPreview({records:[null,false,{},...records],catalog:sets}));
});

test('impossible or inverted set thresholds never turn into verified bonuses',()=>{
 const records=[['item:14094',items['14094'],0],
  ['item:17034',items['17034'],0]];
 const base=sets['14094'];
 for(const changes of [
  {minC:-1},{maxC:2},{minC:2},{minC:2,maxC:1},
  {minL:-1},{maxL:11},{minL:7,maxL:6},
  {minL:0.5},{maxL:'10'}, {minC:true}
 ]){
  const fake={...base,rows:[{...base.rows[0],...changes}]};
  const out=C.unisonPreview({records,catalog:{14094:fake}});
  assert.equal(out.active.length,0,'invalid threshold '+JSON.stringify(changes));
  assert.equal(out.supplemental.length,0);
 }
});

test('a mismatched item catalog ID cannot destroy a saved Soul arrangement',()=>{
 const original={equipment:{5:{id:13041}},
  souls:{5:[{id:100001}]},soulOwners:{5:'13041'}};
 const assertPreserved=(item,soul)=>{
  const state=structuredClone(original);
  const response=P.reconcileSoulOwnership(state,
   {'13041':item},{'100001':soul});
  assert.equal(response,false);
  assert.deepEqual(state,original,'no destructive write with untrusted catalog');
 };
 const legitimateItem=items['13041'];
 for(const invalid of [
  {...legitimateItem,id:999},{...legitimateItem,id:'13041'},
  {...legitimateItem,id:null},'broken',42,[],false
 ])assertPreserved(invalid,{id:100001,slots:['legs']});
 for(const invalidSoul of [
  {id:999,slots:['weapon']},{id:'100001',slots:['weapon']},
  'broken',42,[1],false
 ])assertPreserved(legitimateItem,invalidSoul);
});

test('verified item and Soul identity keeps pre-existing compatibility enforcement',()=>{
 const source=items['13041'];
 const accepted=Object.values(souls).find(row=>
  Array.isArray(row.slots)&&row.slots.includes('legs'));
 assert.ok(accepted&&Number.isSafeInteger(accepted.id));
 const original={equipment:{5:{id:source.id}},
  souls:{5:[{id:accepted.id}]},soulOwners:{5:String(source.id)}};
 const preserved=structuredClone(original);
 assert.equal(P.reconcileSoulOwnership(preserved,
  {[source.id]:source},{[accepted.id]:accepted}),false);
 assert.deepEqual(preserved,original);
 const incompatible={...accepted,slots:['weapon']};
 const invalid=structuredClone(original);
 assert.equal(P.reconcileSoulOwnership(invalid,
  {[source.id]:source},{[accepted.id]:incompatible}),true);
 assert.equal(invalid.souls[5],undefined,
  'a real source-confirmed incompatible Soul is still removed');
});

test('all canonical source sets retain their active states at grades 0 through 10',()=>{
 let checked=0;
 for(const [id,set] of Object.entries(sets)){
  const records=[Number(id),...set.members].map(itemId=>
   ['item:'+itemId,items[String(itemId)],0]);
  for(let grade=0;grade<=10;grade++){
   records[0][2]=grade;
   const result=C.unisonPreview({records,catalog:sets});
   assert.ok(Array.isArray(result.active)&&Array.isArray(result.supplemental));
   for(const setEffect of result.active)
    assert.ok(setEffect.effects.every(e=>Number.isFinite(e.a)));
   checked++;
  }
 }
 assert.equal(checked,3*11);
});

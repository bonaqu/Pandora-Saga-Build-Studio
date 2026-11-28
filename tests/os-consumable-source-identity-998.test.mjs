import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const env={};
Function('window',read('pandora-os-character-calculator.js'))(env);
const C=env.PandoraOSCalculator;
const items=JSON.parse(read('data/os/items.json'));
const skills=JSON.parse(read('data/os/skills.json'));
const defaults={maxHp:1000,maxMp:800};
const checks=[
 ['statusCurePreview',50057,{skills}],
 ['consumableRecoveryPreview',50061,defaults],
 ['consumableSkillPreview',50016,{skills}]
];
const values=(fn,id,params={},item=items[id],key=String(id))=>
 C[fn]({...params,items:{[key]:item}});
const found=(preview,id)=>Array.isArray(preview?.rows)?
 preview.rows.some(row=>row.id===id):
 Array.isArray(preview?.allRows)&&preview.allRows.some(row=>row.id===id);

test('all 1140 current item records retain owned canonical decimal IDs',()=>{
 assert.equal(Object.keys(items).length,1140);
 for(const [key,item] of Object.entries(items)){
  assert.ok(Number.isSafeInteger(item.id),key);
  assert.equal(String(item.id),key,'canonical '+key);
 }
});

test('all original consumable listings and skill links remain numerically identical',()=>{
 const heal=C.consumableRecoveryPreview({items,...defaults});
 const direct=C.statusCurePreview({items});
 const indirect=C.statusCurePreview({items,skills});
 const trigger=C.consumableSkillPreview({items,skills});
 assert.ok(heal&&direct&&indirect&&trigger);
 assert.deepEqual([heal.allRows.length,heal.rows.length,heal.healthRows.length],[20,8,12]);
 assert.deepEqual([direct.rows.length,indirect.rows.length],[9,10]);
 assert.deepEqual([trigger.rows.length,
  trigger.rows.reduce((sum,row)=>sum+row.skills.length,0)],[38,49]);
 assert.equal(heal.rows.find(row=>row.id===50061).mp,75);
 assert.deepEqual(direct.rows.find(row=>row.id===50057).conditions,['Яд']);
});

test('forged item record IDs cannot show healing, cleansing or on-use skills',()=>{
 for(const [fn,id,params] of checks){
  assert.ok(found(values(fn,id,params),id),'valid '+fn);
  for(const falseId of [50009,String(id),null,undefined,id+1]){
   const forged={...items[id],id:falseId};
   assert.equal(found(values(fn,id,params,forged),id),false,
    fn+' mismatch '+String(falseId));
  }
 }
});

test('leading-zero alias keys cannot display a real item under another label',()=>{
 for(const [fn,id,params] of checks){
  const alias='0'+id;
  assert.equal(found(values(fn,id,params,items[id],alias),id),false,
   'canonical key '+fn);
 }
});

test('indirect cleansing requires the exact linked skill ID and typed effects',()=>{
 const item=items[50016];
 const id=item.effects.find(e=>e.func==='EP_SKILL_EXEC')?.a;
 assert.equal(id,300004002);
 const valid=values('statusCurePreview',50016,{skills});
 assert.deepEqual(valid.rows[0].conditions,['Один отрицательный эффект']);
 for(const [label,record] of [
  ['foreign',{...skills[id],id:id+1}],
  ['text id',{...skills[id],id:String(id)}],
  ['missing funcs',{...skills[id],funcs:null}],
  ['string funcs',{...skills[id],funcs:'invalid'}],
  ['null effect',{...skills[id],funcs:[null]}]
 ]){
  const mutated={...skills,[id]:record};
  const result=values('statusCurePreview',50016,{skills:mutated});
  assert.equal(result.rows.length,0,label);
 }
 const falseSkill={...skills[id],id:String(id)};
 assert.equal(values('consumableSkillPreview',50016,{skills:{[id]:falseSkill}}).rows.length,0);
});

test('an array is not a catalog, while historical ID-less isolated fixtures remain valid',()=>{
 assert.equal(C.consumableRecoveryPreview({items:[items[50061]],...defaults}),null);
 assert.equal(C.statusCurePreview({items:[items[50057]]}),null);
 assert.equal(C.consumableSkillPreview({items:[items[50016]],skills}).rows.length,0);
 const futureHeal={kind:'POTION',name:'Future recovery',effects:[
  {func:'EP_HEAL_LIFE',dir:'TARGET',a:50}]};
 const futureCure={kind:'POTION',name:'Future cure',effects:[
  {func:'EP_RECOVERY_POISON',dir:'TARGET'}]};
 assert.equal(values('consumableRecoveryPreview',999998,defaults,futureHeal).allRows[0].hp,50);
 assert.deepEqual(values('statusCurePreview',999999,{},futureCure).rows[0].conditions,['Яд']);
});

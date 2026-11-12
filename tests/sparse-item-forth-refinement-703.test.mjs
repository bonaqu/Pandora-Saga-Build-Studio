import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const data=JSON.parse(read('data/os/items.json'));
const forth=JSON.parse(read('data/os/itemForth.json'));
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const at=(id,grade)=>C.sourceEffects('item:'+id,data[String(id)],grade,forth);
const effect=(id,grade,code)=>at(id,grade).filter(row=>row.func===code)
 .reduce((sum,row)=>sum+row.a,0);

test('real OS breakpoints persist between grades for block break, knockback and silence',()=>{
 for(const [id,code,grades] of [
  [15077,'EP_BLOCK_BREAK_RESIST',[1,1,1,3,3,3,5,5,5,7,7]],
  [15024,'EP_IMMUNE_KNOCKBACK',[5,5,5,5,5,5,5,10,10,10,10]],
  [14603,'EP_IMMUNE_SILENCE',[0,0,2,2,4,4,6,6,8,8,10]],
  [14613,'EP_IMMUNE_SILENCE',[0,0,2,2,4,4,6,6,8,8,10]]
 ]){
  for(let grade=0;grade<=10;grade++)assert.equal(effect(id,grade,code),
   grades[grade],data[String(id)].name+' +'+grade);
 }
});

test('all 162 OS Forth item snapshots carry forward until the next breakpoint',()=>{
 assert.equal(Object.keys(forth).length,162);
 let inspected=0,plateaus=0;
 for(const [id,byGrade] of Object.entries(forth)){
  assert.ok(data[id]&&data[id].id===Number(id));
  const original=data[id].effects||[];
  for(let grade=0;grade<=10;grade++){
   const candidates=Object.keys(byGrade).map(Number)
    .filter(level=>level<=grade).sort((a,b)=>b-a);
   const last=candidates[0];
   const expected=last===undefined?[]:byGrade[String(last)];
   const applied=at(id,grade);
   assert.deepEqual(applied.slice(original.length),expected,id+' +'+grade);
   if(last!==undefined&&last!==grade)plateaus++;
   inspected++;
  }
 }
 assert.equal(inspected,162*11);
 assert.ok(plateaus>50,'source contains many sparse levels');
});

test('resistance displayed to the hero reflects intermediate-grade OS Forth bonus',()=>{
 for(const [id,grade,kind,expected] of [
  [15077,4,'blockBreak',3],
  [15077,8,'blockBreak',5],
  [15024,9,'knockback',10],
  [14603,3,'silence',2],
  [14603,9,'silence',8]
 ]){
  const dataRow=data[String(id)];
  const bonuses=C.gatherEffects([['item:'+id,dataRow,grade]],forth).bonuses;
  const status=C.resistancePreview({stats:{vit:0,spi:0},bonuses}).status;
  assert.equal(status[kind],expected,kind+' '+id+' +'+grade);
 }
 assert.deepEqual(C.sourceEffects('item:15078',data['15077'],4,forth),[],
  'wrong item ID never inherits other item Forth');
});

test('before first OS breakpoint no bonus is invented or read from legacy copy',()=>{
 for(const [id,grade,code] of [
  [15077,2,'EP_BLOCK_BREAK_RESIST'],
  [15024,6,'EP_IMMUNE_KNOCKBACK'],
  [14603,1,'EP_IMMUNE_SILENCE']
 ]){
  const base=(data[String(id)].effects||[])
   .filter(row=>row.func===code).reduce((sum,row)=>sum+row.a,0);
  assert.equal(effect(id,grade,code),base,id+' +'+grade);
 }
});

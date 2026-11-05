import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>JSON.parse(readFileSync(new URL('../data/os/'+name+'.json',import.meta.url),'utf8'));
const items=read('items'),monsters=read('monsters'),drops=read('drops'),
 trades=read('trades'),chests=read('chests');
const missingItem=(id)=>!Object.hasOwn(items,String(id));

test('checked-in monster drops point to present monsters and items',()=>{
 const badMonsters=Object.keys(drops).filter(id=>!Object.hasOwn(monsters,id));
 const badItems=Object.entries(drops).flatMap(([id,record])=>
  (record.d||[]).filter(reward=>missingItem(reward.i))
   .map(reward=>({monster:id,item:reward.i})));
 assert.deepEqual(badMonsters,[], 'Every drop table must refer to an existing monster');
 assert.deepEqual(badItems,[], 'A missing reward item would create an unresolved encyclopedia link');
});

test('checked-in NPC exchange outputs, ingredients and NPC references resolve',()=>{
 const recipes=trades.trades||[];
 const badRewards=recipes.filter(recipe=>missingItem(recipe.i)).map(recipe=>recipe.id);
 const badIngredients=recipes.flatMap(recipe=>
  (recipe.mats||[]).filter(mat=>missingItem(mat.i))
   .map(mat=>({recipe:recipe.id,item:mat.i})));
 const badNpc=recipes.flatMap(recipe=>(recipe.npc||[]).filter(id=>
  !Object.hasOwn(trades.npcs||{},String(id)))
  .map(id=>({recipe:recipe.id,npc:id})));
 assert.deepEqual(badRewards,[]);
 assert.deepEqual(badIngredients,[]);
 assert.deepEqual(badNpc,[]);
});

test('checked-in chest contents resolve to items and have bounded listed chances',()=>{
 const missing=[],outOfRange=[];
 for(const box of chests.boxes||[]){
  for(const [index,group] of (box.rolls||[]).entries()){
   for(const reward of group){
    if(missingItem(reward.i))missing.push({chest:box.i,group:index+1,item:reward.i});
    if(reward.p!=null&&(!Number.isFinite(reward.p)||reward.p<0||reward.p>100))
     outOfRange.push({chest:box.i,group:index+1,chance:reward.p});
   }
  }
 }
 assert.deepEqual(missing,[]);
 assert.deepEqual(outOfRange,[]);
});

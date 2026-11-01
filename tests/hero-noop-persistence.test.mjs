import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const start=source.indexOf('  onAllocate:(key,requested,final)=>{');
const end=source.indexOf('  onMastery:(key,requested)=>{',start);
assert.ok(start>0&&end>start,'Expected existing Hero Path allocation API');
const body=source.slice(start,end).trim().replace(/^onAllocate:/,'').replace(/,\s*$/,'');
function fixture(){
 const state={level:55,branch:'slash',points:{slash:10,brush:0}};
 const count={set:0,persist:0,budget:0,render:0,stats:0,vitals:0,save:0};
 const progression={
  potential:(s,k)=>s.points[k]||0,
  canAllocate:(_table,_level,_points,key,_cap,amount)=>Number.isInteger(amount)&&
   amount>=0&&(key==='slash'?amount<=15:amount<=10),
  setPotential:(s,k,value)=>{count.set++;s.points[k]=value}
 };
 const handler=Function('window','state','allowedBranch','gameTables','branchCap',
  'persist','refreshBudgetLabel','renderBranches','renderOriginStats','renderOriginVitals',
  'saveView','document','heroPathPage','renderPathSkills','return ('+body+');')(
  {PandoraSkillProgression:progression},state,key=>key==='slash'?15:10,
  {abilityPoint:{}},key=>key==='slash'?15:10,
  ()=>count.persist++,()=>count.budget++,()=>count.render++,()=>count.stats++,
  ()=>count.vitals++,()=>count.save++,{activeElement:null,querySelector:()=>null},
  'growth',()=>{});
 return {state,count,handler};
}
test('blocked or repeated drag input cannot rewrite saved draft or rebuild budget',()=>{
 const {state,count,handler}=fixture();
 assert.equal(handler('slash',10,false),10);
 assert.equal(handler('slash',10,false),10);
 assert.deepEqual(count,{set:0,persist:0,budget:0,render:0,stats:0,vitals:0,save:0});
 assert.equal(handler('slash',15,false),15);
 assert.equal(state.points.slash,15);
 assert.equal(count.persist,1);
 assert.equal(count.budget,1);
 assert.equal(count.set,1);
 for(let n=16;n<=40;n++)assert.equal(handler('slash',n,false),15);
 assert.equal(count.persist,1,'Cap-bound pointer moves should never write a new draft');
 assert.equal(count.budget,1);
 assert.equal(count.set,1);
});
test('change/blur still repaints and saves view even when slider target stays the same',()=>{
 const {count,handler}=fixture();
 assert.equal(handler('slash',10,true),10);
 assert.equal(count.persist,0);
 assert.equal(count.budget,0);
 assert.equal(count.render,1);
 assert.equal(count.stats,1);
 assert.equal(count.vitals,1);
 assert.equal(count.save,1);
});
test('actual allocation, refund and branch navigation each persist exactly once',()=>{
 const {state,count,handler}=fixture();
 assert.equal(handler('slash',13,false),13);
 assert.equal(count.persist,1);
 assert.equal(handler('slash',9,false),9);
 assert.equal(count.persist,2);
 assert.equal(handler('brush',0,false),0);
 assert.equal(state.branch,'brush');
 assert.equal(count.persist,3,'Changing chosen branch without points must still save navigation');
 assert.equal(count.set,2,'No fake allocation when navigating with zero points');
 assert.equal(handler('brush',0,false),0);
 assert.equal(count.persist,3);
 assert.deepEqual(state.points,{slash:9,brush:0});
});
test('invalid numeric input cannot silently mutate saved allocation',()=>{
 const {state,count,handler}=fixture();
 assert.equal(handler('slash',Number.NaN,false),10);
 assert.equal(handler('slash',-5,false),10);
 assert.deepEqual(state.points,{slash:10,brush:0});
 assert.equal(count.persist,0);
});

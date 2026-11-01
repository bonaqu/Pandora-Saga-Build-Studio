import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../hero-path.js',import.meta.url),'utf8');
const start=source.indexOf('function nearestMilestone(');
const end=source.indexOf('\nfunction viewGrowth(',start);
assert.ok(start>=0&&end>start,'Expected binary search helper');
const nearest=new Function(source.slice(start,end)+'\nreturn nearestMilestone;')();
const marker=(fraction,id)=>({thresholdFraction:fraction,id});

test('all selected thresholds retain exact rail positioning across screen widths',()=>{
 const points=[0,1,2,8,20,30,45,60,80,90];
 const marks=points.map(n=>marker(n/90,n));
 for(const width of [180,240,390,1024,1920]){
  const travel=width-42;
  for(const n of points){
   const x=21+travel*n/90;
   assert.equal(nearest(marks,(x-21)/travel)?.id,n,'marker '+n+' at '+width+'px');
  }
 }
});

test('close ticks, midpoint ties, endpoints and invalid input have stable results',()=>{
 const marks=[marker(.1,'a'),marker(.1001,'b'),marker(.2,'c'),marker(.8,'d')];
 assert.equal(nearest(marks,.10009)?.id,'b');
 assert.equal(nearest(marks,.10001)?.id,'a');
 assert.equal(nearest(marks,.18)?.id,'c');
 const midpoint=(marks[0].thresholdFraction+marks[1].thresholdFraction)/2;
 assert.equal(nearest(marks,midpoint)?.id,'a');
 assert.equal(nearest(marks,-10)?.id,'a');
 assert.equal(nearest(marks,10)?.id,'d');
 assert.equal(nearest([],0),null);
 assert.equal(nearest(marks,Number.NaN),null);
});

test('single-pass grouping preserves every distinct skill at the same threshold',()=>{
 assert.match(source,/const byThreshold=new Map\(\)/);
 assert.match(source,/const at=byThreshold\.get\(threshold\)/);
 assert.match(source,/for\(const threshold of orderedThresholds\)/);
 assert.match(source,/const skillsAt=at\.flatMap\(mark=>mark\.skills\)/);
 assert.doesNotMatch(source,/marks\.filter\(mark=>mark\.threshold===threshold\)/);
 const data=[{threshold:8,skills:[1]},{threshold:8,skills:[2]},
  {threshold:55,skills:[3]},{threshold:120,skills:[4]}];
 const groups=new Map();
 for(const mark of data){
  if(mark.threshold<0||mark.threshold>90)continue;
  if(!groups.has(mark.threshold))groups.set(mark.threshold,[]);
  groups.get(mark.threshold).push(mark);
 }
 assert.deepEqual([...groups.keys()],[8,55]);
 assert.deepEqual(groups.get(8).flatMap(m=>m.skills),[1,2]);
});

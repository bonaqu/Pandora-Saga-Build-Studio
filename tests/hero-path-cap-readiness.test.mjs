import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../hero-path.js',import.meta.url),'utf8');
const root={PandoraSkillProgression:{
 potential:(state,key)=>state.points[key]||0,
 trained:(state,key)=>state.mastery[key]||0
}};
Function('window','document',source)(root,{});
const readiness=root.PandoraHeroPath.readiness;
const catalog=Object.values(JSON.parse(readFileSync(new URL('../data/os/skills.json',import.meta.url),'utf8')));
const classes=JSON.parse(readFileSync(new URL('../data/os/classes.json',import.meta.url),'utf8'));
const make=(id,reqs,prereq=null)=>({id,name:'Skill '+id,classes:{CLERIC:1},
 charLevel:1,reqs,prereq});
function fixture(skills,cap=15){
 return {lang:'en',job:'CLERIC',state:{level:55,points:{brush:50},mastery:{brush:50}},
 skillCatalog:skills,branchName:key=>key,cap:key=>key==='brush'?cap:0};
}
test('profession change cannot unlock a skill requiring more mastery than its current class cap',()=>{
 const skill=make(11,[{branch:'brush',amount:41}]);
 const api=fixture([skill]);
 const result=readiness(skill,api);
 assert.equal(result.learned,false);
 assert.ok(result.problems.some(p=>p.includes('class limit cannot meet requirement (41 > 15)')));
 assert.equal(api.state.points.brush,50,'out-of-cap saved investment is preserved');
 assert.equal(api.state.mastery.brush,50,'manual mastery values remain unchanged');
 const valid=make(12,[{branch:'brush',amount:8}]);
 assert.equal(readiness(valid,fixture([valid])).learned,true);
});

test('a prerequisite blocked by a class cap never makes its child available',()=>{
 const old=make(21,[{branch:'brush',amount:41}]);
 const next=make(22,[{branch:'brush',amount:8}],21);
 const api=fixture([old,next]);
 assert.equal(readiness(old,api).learned,false);
 const child=readiness(next,api);
 assert.equal(child.learned,false);
 assert.ok(child.problems.some(p=>p.includes('Requires previous skill')));
});

test('malformed requirements fail closed rather than silently counting as zero',()=>{
 for(const item of [
  {branch:'brush',amount:null},{branch:'brush',amount:''},
  {branch:'brush',amount:false},{branch:'brush',amount:-1},
  {branch:'brush',amount:0},{branch:'brush',amount:'0'},
  {branch:'brush',amount:2.5},{branch:'',amount:8},
  {amount:8},null
 ]){
  const skill=make(31,[item]);
  const result=readiness(skill,fixture([skill]));
  assert.equal(result.learned,false,JSON.stringify(item));
  assert.ok(result.problems.includes('Unknown requirement'),JSON.stringify(item));
 }
 const numericText=make(32,[{branch:'brush',amount:'8'}]);
 assert.equal(readiness(numericText,fixture([numericText])).learned,true);
});

test('official 569-skill OS source contains no malformed branch requirement',()=>{
 assert.equal(catalog.length,569);
 for(const skill of catalog){
  for(const req of skill.reqs||[]){
   assert.equal(typeof req.branch,'string');
   assert.ok(req.branch.trim());
   assert.ok(Number.isInteger(req.amount)&&req.amount>0,'skill '+skill.id);
  }
 }
 assert.equal(classes.CLERIC.branchCaps.brush,15);
});

test('marker readiness uses shared prerequisite index and dead spent subtotal is gone',()=>{
 assert.match(source,/const learned=skillsAt\.some\(skill=>readiness\(skill,api,new Set\(\),skillIndex\)\.learned\)/);
 assert.doesNotMatch(source,/const spent=branchKeys\.reduce/);
 assert.match(source,/entry\.skills\.some\(skill=>readiness\(skill,api,new Set\(\),skillIndex\)\.learned\)/);
});

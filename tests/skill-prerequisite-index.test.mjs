import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../hero-path.js',import.meta.url),'utf8');
const indexStart=source.indexOf('function indexSkills(');
const readinessStart=source.indexOf('function readiness(');
const end=source.indexOf('function nearestMilestone(',readinessStart);
assert.ok(indexStart>=0&&readinessStart>indexStart&&end>readinessStart);
const getIndex=new Function(source.slice(indexStart,readinessStart)+'\nreturn indexSkills;')();
const root={PandoraSkillProgression:{potential:(s,b)=>s.points[b]||0,
 trained:(s,b)=>s.mastery[b]||0}};
Function('window','document',source)(root,{});
const available=root.PandoraHeroPath.readiness;
const skill=(id,prereq)=>({id,name:'Skill '+id,
 classes:{CLERIC:1},charLevel:1,reqs:[{branch:'benevolence',amount:1}],prereq});

test('index keeps the first matching string ID, like the retired Array.find lookup',()=>{
 const first=skill(123,null),duplicate=skill('123',888);
 const index=getIndex([null,{name:'no id'},first,duplicate]);
 assert.equal(index.size,1);
 assert.equal(index.get('123'),first);
 assert.equal(index.has('undefined'),false);
});

test('indexed prerequisites preserve multi-step requirements, missing skills and cycles',()=>{
 const first=skill(100,null),second=skill(101,100),third=skill(102,101);
 const broken=skill(103,999),loopA=skill(104,105),loopB=skill(105,104);
 const skills=[first,second,third,broken,loopA,loopB];
 const api={state:{level:55,points:{benevolence:1},mastery:{benevolence:1}},
  job:'CLERIC',lang:'en',skillCatalog:skills,branchName:k=>k};
 const index=getIndex(skills);
 for(const row of skills){
  const original=available(row,api);
  const optimized=available(row,api,new Set(),index);
  assert.deepEqual(optimized,original,'skill ID '+row.id);
 }
 assert.equal(available(third,api,new Set(),index).learned,true);
 assert.ok(available(broken,api,new Set(),index).problems.includes('Required previous skill not found'));
 assert.equal(available(loopA,api,new Set(),index).learned,false);
});

test('render-time catalog lookup prevents a separate full Array.find for each prerequisite',()=>{
 const first=skill(1,null),second=skill(2,1);
 const index=getIndex([first,second]);
 const catalog=new Proxy([first,second],{get(target,key,receiver){
  if(key==='find')throw Error('Unexpected linear skill-catalog lookup');
  return Reflect.get(target,key,receiver);
 }});
 const api={state:{level:55,points:{benevolence:1},mastery:{benevolence:1}},
  job:'CLERIC',lang:'en',skillCatalog:catalog,branchName:k=>k};
 assert.equal(available(second,api,new Set(),index).learned,true);
 assert.match(source,/const skillIndex=indexSkills\(skillCatalog\)/);
 assert.match(source,/const skillIndex=indexSkills\(api\.skillCatalog\)/);
 assert.match(source,/entry\.skills\.some\(skill=>readiness\(skill,api,new Set\(\),skillIndex\)\.learned\)/);
 assert.doesNotMatch(source,/api\.skillCatalog\.find\(/);
});

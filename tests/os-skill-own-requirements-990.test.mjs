import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const env={};
Function('window',read('pandora-studio-equipment-rules.js'))(env);
const R=env.PandoraStudioRules;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));

const ready={id:123456,classes:{WARRIOR:1},learnable:true,
 charLevel:1,reqLevel:0,prereq:null,reqs:[{branch:'slash',amount:40}]};
const ctx=(points={},job='WARRIOR',level=55)=>({job,level,points});

test('inherited mastery never masquerades as trained character points',()=>{
 const inherited=Object.create({slash:100});
 const result=R.readiness(ready,ctx(inherited));
 assert.equal(result.status,'locked');
 assert.deepEqual(result.gates,[{branch:'slash',current:0,required:40,met:false}]);
 assert.ok(result.missing.includes('slash 0/40'));
 assert.equal(R.readiness(ready,ctx({slash:40})).status,'eligible');
 assert.equal(R.readiness(ready,ctx({slash:39})).status,'locked');
});

test('skill predecessor must be an explicit supported empty form',()=>{
 const clean={...ready,reqs:[]};
 for(const value of [undefined,false,true,'', '0','wrong',[],{}]){
  const skill={...clean,prereq:value};
  const result=R.readiness(skill,ctx());
  assert.equal(result.status,'unknown','bad predecessor '+String(value));
  assert.ok(result.unknown.includes('Дополнительное условие не проверено'));
 }
 const absent={...clean};delete absent.prereq;
 assert.equal(R.readiness(absent,ctx()).status,'unknown');
 for(const value of [null,0])assert.equal(
  R.readiness({...clean,prereq:value},ctx()).status,'eligible',
  'known canonical no-predecessor encoding '+String(value));
 const positive=R.readiness({...clean,prereq:123456},ctx());
 assert.equal(positive.status,'unknown','a real predecessor requires a separate check');
});

test('inherited or missing skill identity, classes and gates cannot authorize skills',()=>{
 for(const field of ['id','classes','charLevel','reqLevel',
  'learnable','reqs','prereq']){
  const inherited=Object.create({[field]:ready[field]});
  for(const [key,value] of Object.entries(ready))
   if(key!==field)inherited[key]=value;
  const result=R.readiness(inherited,ctx({slash:50}));
  assert.notEqual(result.status,'eligible','inherited '+field);
  const missing={...ready};delete missing[field];
  assert.notEqual(R.readiness(missing,ctx({slash:50})).status,'eligible',
   'missing '+field);
 }
 for(const field of ['branch','amount']){
  const req=Object.create({[field]:ready.reqs[0][field]});
  for(const [key,value] of Object.entries(ready.reqs[0]))
   if(key!==field)req[key]=value;
  assert.notEqual(R.readiness({...ready,reqs:[req]},
   ctx({slash:50})).status,'eligible','inherited '+field);
 }
});

test('class branch limits cannot be taken from mismatched or inherited records',()=>{
 const good={WARRIOR:{id:'WARRIOR',branchCaps:{slash:90}}};
 assert.equal(R.branchCap(good,'WARRIOR','slash'),90);
 for(const wrong of [
  null,undefined,'broken',false,[],{id:'MAGE',branchCaps:{slash:90}},
  {id:'WARRIOR',branchCaps:[]}, {id:'WARRIOR',branchCaps:'90'}
 ])assert.equal(R.branchCap({WARRIOR:wrong},'WARRIOR','slash'),null);
 const inherited=Object.create({branchCaps:{slash:90}});
 inherited.id='WARRIOR';
 assert.equal(R.branchCap({WARRIOR:inherited},'WARRIOR','slash'),null);
 const oldFixture={WARRIOR:{branchCaps:{slash:90}}};
 assert.equal(R.branchCap(oldFixture,'WARRIOR','slash'),90,
  'older unit fixtures without a class ID retain safe explicit caps');
});

test('all 28 real classes have exactly their published 756 branch capacities',()=>{
 const names=Object.keys(classes);
 assert.equal(names.length,28);
 let count=0;
 for(const [job,record] of Object.entries(classes)){
  assert.equal(record.id,job);
  for(const [branch,value] of Object.entries(record.branchCaps)){
   assert.equal(R.branchCap(classes,job,branch),value);
   count++;
  }
 }
 assert.equal(count,756);
});

test('all 571 current skills preserve 127904 source-defined readiness decisions',()=>{
 const jobs=Object.keys(classes),levels=[1,45,50,55];
 assert.equal(Object.keys(skills).length,571);
 let count=0;
 for(const skill of Object.values(skills))
  for(const job of jobs)
   for(const level of levels)
    for(const points of [{},classes[job].branchCaps]){
     const missing=skill.classes[job]!==1||skill.charLevel>level||
      skill.reqs.some(req=>(points[req.branch]??0)<req.amount);
     const unknown=skill.learnable!==true||
      (skill.prereq!==null&&skill.prereq!==0)||skill.reqLevel!==0;
     const expected=missing?'locked':unknown?'unknown':'eligible';
     const result=R.readiness(skill,ctx(points,job,level));
     assert.equal(result.status,expected,
      'skill '+skill.id+' '+job+' level '+level);
     count++;
    }
 assert.equal(count,571*28*4*2);
});

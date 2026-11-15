import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=JSON.parse(readFileSync(new URL('../data/os/skills.json',import.meta.url),'utf8'));
const wind=[source['420004001'],source['420004002']];
const root={PandoraSkillProgression:{
 branchPotential:(state,key)=>Number(state.points?.[key]||0)
}};
runInNewContext(readFileSync(new URL('../pandora-studio-hero-path.js',import.meta.url),'utf8'),
 {window:root});
const choose=({job='CONJURER',level=49,mastery=31,skills=wind}={})=>
 root.PandoraHeroPath.effectiveSkillCatalog(skills,{
  job,lang:'ru',state:{level,points:{embody:mastery}},
  branchName:key=>key,cap:()=>90,innate:{},branchCaps:{embody:90}
 });
test('source is exactly 5 s before 50 and 1 s for eligible Conjurer at 50',()=>{
 assert.equal(wind[0].cast,5);assert.equal(wind[1].cast,1);
 assert.equal(wind[1].prereq,wind[0].id);
 assert.equal(wind[1].charLevel,50);
 assert.equal(wind[1].classes.CONJURER,1);
 assert.deepEqual(choose({level:49}).skills.map(x=>x.id),[420004001]);
 assert.deepEqual(choose({level:50}).skills.map(x=>x.id),[420004002]);
});
test('other classes never receive the Conjurer-only level-50 cast reduction',()=>{
 assert.deepEqual(choose({job:'WARRIOR',level:55}).skills.map(x=>x.id),[420004001]);
});
test('upgrade is not active until its skill and prior requirements are met',()=>{
 assert.deepEqual(choose({level:50,mastery:30}).skills.map(x=>x.id),[420004001]);
 const broken=structuredClone(wind);broken[1].prereq=420009999;
 assert.deepEqual(choose({level:50,skills:broken}).skills.map(x=>x.id),
  [420004001,420004002]);
});
test('source family mapping does not alter upstream game catalog or skill ids',()=>{
 const before=JSON.stringify(wind);const out=choose({level:50});
 assert.equal(JSON.stringify(wind),before);
 assert.equal(out.aliases.get('420004001'),'420004002');
 assert.equal(out.skills[0],wind[1]);
});

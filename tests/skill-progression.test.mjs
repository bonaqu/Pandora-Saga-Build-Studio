import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const models={};
for(const path of ['skill-progression.js','attribute-progression.js','os-calculator.js'])
 Function('window',source(path))(models);
const S=models.PandoraSkillProgression,A=models.PandoraAttributeProgression,
 OS=models.PandoraOSCalculator,tables=JSON.parse(source('data/os/tables.json'));

test('level skill budget is independent of green Adeptness',()=>{
 const build={level:45,masteryAuto:false,points:{slash:45,blessing:0},mastery:{slash:42}};
 const before=S.spending(tables.abilityPoint,build.level,build.points);
 assert.equal(S.potential(build,'slash'),45);
 assert.equal(S.trained(build,'slash'),42);
 assert.equal(S.setTrained(build,'slash',43),true);
 assert.deepEqual(S.spending(tables.abilityPoint,build.level,build.points),before);
 assert.equal(S.setTrained(build,'slash',46),false);
});
test('auto full green / disable auto freezes actual values per learned branch',()=>{
 const s={masteryAuto:true,points:{slash:45,thrust:12},mastery:{}};
 assert.equal(S.trained(s,'slash'),45);
 S.setAuto(s,false,['slash','thrust']);
 assert.equal(s.mastery.slash,45);assert.equal(s.mastery.thrust,12);
 S.setTrained(s,'slash',42);assert.equal(S.trained(s,'slash'),42);
 S.setAuto(s,true,['slash','thrust']);assert.equal(S.trained(s,'slash'),45);
});
test('lowering allocated Potential clamps green, never consumes attribute or skill points',()=>{
 const s={masteryAuto:false,points:{slash:45},mastery:{slash:42}},previous=S.spending(tables.abilityPoint,45,s.points).spent;
 S.setPotential(s,'slash',39);
 assert.equal(S.potential(s,'slash'),39);assert.equal(S.trained(s,'slash'),39);
 assert.equal(S.spending(tables.abilityPoint,45,s.points).spent,previous-6);
});
test('old over-budget or changed class-cap builds can refund in small steps',()=>{
 const pts={slash:140,thrust:80};
 assert.ok(S.spending(tables.abilityPoint,2,pts).remaining<0);
 assert.equal(S.canAllocate(tables.abilityPoint,2,pts,'slash',90,139),true);
 assert.equal(S.canAllocate(tables.abilityPoint,2,pts,'slash',90,0),true);
 assert.equal(S.canAllocate(tables.abilityPoint,2,pts,'slash',90,141),false);
 assert.equal(S.canAllocate(tables.abilityPoint,45,{benevolence:0},'benevolence',0,1),false);
 assert.equal(S.canAllocate(tables.abilityPoint,45,{benevolence:8},'benevolence',0,7),true);
});
test('Rapin Warrior 5/4/5/6/8/6: level points only from manual allocation',()=>{
 const baseline=A.base(tables,'RAPIN','WARRIOR');
 assert.deepEqual(baseline,[5,4,5,6,8,6]);
 const invested=A.snapshot({tables,race:'RAPIN',klass:'WARRIOR',level:2,added:[1,0,0,0,0,0]});
 assert.equal(invested.spent,2);assert.equal(invested.remaining,4);
 const result=OS.base({classData:{hp:{base:100,lv:1,vit:1},mp:{base:30,lv:1,spi:1}},
  raceData:tables.raceInit.RAPIN,jobData:tables.jobInit.WARRIOR,
  allocation:{vit:1},level:2,
  records:[['equipment',{effects:[{func:'EP_VITARITY_CONST',a:5}]},0]]});
 assert.equal(result.basic.vit,6);
 assert.equal(result.stats.vit,11);
 assert.equal(invested.spent,2);assert.equal(invested.remaining,4);
});
test('historical Remaked Inspiration receives trained prayer group, not spent points',()=>{
 const state={masteryAuto:false,points:{benevolence:45,blessing:0,exorcism:0,hymn:0},
  mastery:{benevolence:42}};
 assert.equal(S.prayerAdeptness(state),42);
 assert.equal(S.legacyPrayerSpirit('CLERIC',state),5);
 assert.equal(S.legacyPrayerSpirit('SCOUT',state),0);
 const before=S.spending(tables.abilityPoint,45,state.points);
 S.setTrained(state,'benevolence',40);
 assert.deepEqual(S.spending(tables.abilityPoint,45,state.points),before);
});
test('skill gallery greys 45-potential/42-green threshold until training completes',()=>{
 const scope={PandoraSkillProgression:S};
 const doc={createElement:tag=>({tag,children:[],append(){},setAttribute(){},addEventListener(){}}),
 createTextNode:text=>({textContent:text})};
 Function('window','document',source('hero-path.js'))(scope,doc);
 const base={id:11,name:'Секущий',classes:{WARRIOR:1},charLevel:1,
  reqs:[{branch:'slash',amount:45}]};
 const upgrade={id:12,name:'Следующий',classes:{WARRIOR:1},charLevel:1,
  reqs:[{branch:'slash',amount:45}],prereq:11};
 const state={level:45,masteryAuto:false,points:{slash:45},mastery:{slash:42}};
 const api={state,job:'WARRIOR',skillCatalog:[base,upgrade],branchName:key=>key};
 assert.equal(scope.PandoraHeroPath.readiness(base,api).learned,false);
 S.setAuto(state,true,['slash']);
 assert.equal(scope.PandoraHeroPath.readiness(upgrade,api).learned,true);
});

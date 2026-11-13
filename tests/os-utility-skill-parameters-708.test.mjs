import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const english=JSON.parse(read('data/os/strings.en.json')).skills;
const classes=JSON.parse(read('data/os/classes.json'));
const root={};
Function('window',read('pandora-os-character-calculator.js'))(root);
const calculator=root.PandoraOSCalculator;
const preview=(jobKey,{level=55,mastery={},catalog=skills}={})=>
 calculator.utilitySkillSourcePreview({skillCatalog:catalog,jobKey,level,
  branchCaps:classes[jobKey].branchCaps,branchMasteries:mastery,
  branchLabels:{charm:'Чары'},englishBranches:{charm:'Charm'}});
const byId=(rows,id)=>rows.find(row=>row.id===id);
const expected=new Map([
 [100061001,[['EP_BENCHTIME_CUT',[0,0,0,50]],
  ['EP_CONSUME_LIFE_SCALE',[0,0,0,30]]]],
 [440008001,[['EP_AVOIDANCE_CONST',[0,0,0,-40]],
  ['EP_AVOIDANCE_SCALE',[0,0,-25,-25]]]],
 [440006001,[['EP_STOP_TIME',[0,0,0,0]],
  ['EP_HEAL_LIFE_FIN_SCALE',[0,0,-50,-50]]]]
]);

test('three current OS identities, target direction, effect vectors and official EN names',()=>{
 for(const [id,rows] of expected){
  const source=skills[String(id)];
  assert.equal(source.learnable,true);
  assert.equal(typeof english[String(id)]?.n,'string',String(id));
  assert.equal(source.funcs.length,rows.length);
  for(const [ep,v] of rows){
   const found=source.funcs.filter(f=>f.ep===ep);
   assert.equal(found.length,1,String(id)+' '+ep);
   assert.equal(found[0].dir,'TARGET');
   assert.deepEqual(found[0].fv1,v);
   assert.deepEqual(found[0].fv2,[0,0,0,0]);
  }
 }
 assert.equal(skills['100061001'].name,'Воля к жизни');
 assert.equal(skills['440008001'].name,'Обуздание');
 assert.equal(skills['440006001'].name,'Остановка времени');
});

test('level-based Juggernaut works with martial cap zero, without false mastery gate',()=>{
 assert.equal(classes.JUGGERNAUT.branchCaps.martial,0);
 const before=byId(preview('JUGGERNAUT',{level:49}),100061001);
 const ready=byId(preview('JUGGERNAUT',{level:50}),100061001);
 assert.equal(before?.available,false);
 assert.match(before.reason,/50/);
 assert.equal(ready?.available,true);
 assert.deepEqual(ready.sourceParameters.map(x=>x.amount),[50,30]);
 assert.ok(ready.sourceParameters.every(x=>x.confidence==='source-parameter'));
 assert.equal(ready.amount,null,'no invented final HP or cooldown');
 assert.equal(ready.modelOnly,true);
 assert.equal(byId(preview('GENERAL',{level:55}),100061001),undefined);
});

test('enemy debuffs respect actual Charm class caps, levels and mastery',()=>{
 assert.equal(byId(preview('WARRIOR',{mastery:{charm:99}}),440008001),undefined);
 assert.equal(byId(preview('JESTER',{level:44,mastery:{charm:32}}),440008001)?.available,false);
 assert.match(byId(preview('JESTER',{level:44,mastery:{charm:32}}),440008001)?.reason,/33/);
 assert.equal(byId(preview('JESTER',{level:44,mastery:{charm:33}}),440006001)?.available,false);
 const rows=preview('JESTER',{level:45,mastery:{charm:33}});
 assert.deepEqual(byId(rows,440008001)?.sourceParameters.map(x=>x.amount),[-40,-25,-25]);
 assert.deepEqual(byId(rows,440006001)?.sourceParameters.map(x=>x.amount),[-50,-50]);
 assert.equal(byId(rows,440006001)?.hostile,true);
 assert.equal(byId(rows,440008001)?.hostile,true);
 assert.match(byId(rows,440006001)?.detailRu,/не установлены/);
 assert.match(byId(rows,440008001)?.detailEn,/unknown/);
});

test('tampered source effects fail closed as an entire ability, not partial benefits',()=>{
 for(const id of expected.keys()){
  const validJob=id===100061001?'JUGGERNAUT':'JESTER';
  const good=preview(validJob,{level:55,mastery:{charm:50}});
  assert.ok(byId(good,id),'baseline exists for '+id);
  const edits=[
   row=>{row.funcs[0].dir='CASTER';},
   row=>{row.funcs[0].fv1[3]+=1;},
   row=>{row.funcs[0].fv2[3]=1;},
   row=>{row.funcs[0].fv1[0]=1;},
   row=>{row.funcs.push({...row.funcs[0]});},
   row=>{row.funcs[0].ep='EP_UNKNOWN';},
   row=>{row.prereq=0;},
   row=>{row.skillType='TOGGLE';},
   row=>{row.isLevelBased=!row.isLevelBased;}
  ];
  for(const mutate of edits){
   const broken=structuredClone(skills);
   mutate(broken[String(id)]);
   assert.equal(byId(preview(validJob,{catalog:broken,mastery:{charm:50}}),id),
    undefined,'invalid data for '+id);
  }
 }
});

test('300 deterministic class/level/mastery scenarios preserve all source data',()=>{
 const initial=JSON.stringify(skills);
 const jobs=Object.keys(classes).sort();
 let total=0;
 for(let i=0;i<300;i++){
  const job=jobs[i%jobs.length],caps=classes[job].branchCaps;
  const mastery=Object.fromEntries(Object.entries(caps).map(([key,max])=>
   [key,(i*17)%Math.max(1,max+1)]));
  const rows=preview(job,{level:1+(i*7)%55,mastery});
  const seen=new Set();
  for(const row of rows){
   assert.ok(expected.has(row.id));
   assert.ok(!seen.has(row.id));
   seen.add(row.id);
   assert.equal(row.modelOnly,true);
   assert.equal(row.amount,null);
   assert.ok(row.sourceParameters?.length>=2);
   assert.equal(row.name,skills[String(row.id)].name);
   total++;
  }
 }
 assert.ok(total>=60,'multiple source-gated skill cases covered');
 assert.equal(JSON.stringify(skills),initial);
});

test('integrated Hero Book, audit and source-only semantics are consistent',()=>{
 const result=calculator.scalingSkillPreview({skillCatalog:skills,jobKey:'JESTER',
  level:45,branchCaps:classes.JESTER.branchCaps,branchMasteries:{charm:33},
  combat:{attack:{walkingBase:180},defense:{directRaw:50},
   dodge:{base:100},accuracy:{base:100}},
  stats:{str:50,agi:50,dex:50,vit:50,spi:50,int:50}});
 assert.equal(result.utility.length,2);
 assert.equal(result.utility.every(row=>row.amount===null),true);
 assert.equal(result.utility.every(row=>!result.offense.some(s=>s.id===row.id)),true);
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/\['utility','Контроль и ресурсы'/);
 assert.match(book,/Control & resources/);
 assert.match(book,/skill\.sourceParameters/);
 assert.match(book,/'source-parameter'/);
 const audit=auditOsSkillFormulaCoverage({skills,classes,calculator});
 for(const id of expected.keys()){
  const row=audit.rows.find(x=>x.id===id);
  assert.equal(row?.status,'source-parameter',String(id));
  assert.equal(row?.coefficientModel,false);
  assert.equal(row?.numericPreview,false);
 }
 assert.equal(Object.values(audit.summary.statuses).reduce((a,b)=>a+b,0),569);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const english=JSON.parse(read('data/os/strings.en.json')).skills;
const root={};
Function('window',read('pandora-os-character-calculator.js'))(root);
const calc=root.PandoraOSCalculator;
const inspect=(jobKey,{level=45,mastery={},catalog=skills}={})=>
 calc.scalingSkillPreview({skillCatalog:catalog,jobKey,level,
  branchCaps:classes[jobKey].branchCaps,branchMasteries:mastery,
  combat:{attack:{walkingBase:200},defense:{directRaw:50},
   dodge:{base:100},accuracy:{base:100}},
  stats:{vit:40,str:50,agi:70,dex:50,spi:50,int:50}});
const movement=(jobKey,options={})=>inspect(jobKey,options).movement;
const get=(rows,id)=>rows.find(row=>row.id===id);
const ids=[168002001,168002003,230002001,230002005,
 260002001,260003001,260010001,320004001,320009001];

test('all nine OS learnable movement vectors, directions and canonical bilingual names',()=>{
 const expected=new Map([
  [168002001,-20],[168002003,-20],
  [230002001,-20],[230002005,-20],
  [260002001,30],[260003001,200],
  [260010001,200],[320004001,40],[320009001,-50]]);
 for(const [id,value] of expected){
  const s=skills[String(id)];
  assert.equal(s.learnable,true,'source learnable '+id);
  const rows=s.funcs.filter(x=>x.ep==='EP_MOVESPEED_SCALE');
  assert.equal(rows.length,1,id+' has one source vector');
  assert.deepEqual(rows[0].fv1,[0,0,0,value]);
  assert.deepEqual(rows[0].fv2,[0,0,0,0]);
  assert.equal(typeof english[String(id)]?.n,'string','official EN required '+id);
 }
 assert.equal(skills['260003001'].prereq,0,'OS zero-prereq sentinel is not null');
 assert.deepEqual([...expected.keys()],ids);
});
test('scoped source values are distinct from final movement speed and from buffs',()=>{
 const result=inspect('SNIPER',{mastery:{warding:70}});
 for(const [id,value] of [[260002001,30],[260003001,200],
  [260010001,200],[320004001,40]]){
  const item=get(result.movement,id);
  assert.equal(item?.amount,value,'movement parameter '+id);
  assert.equal(item?.modelOnly,true);
  assert.equal(item?.uncertain,true);
  assert.match(item?.detailRu,/итоговая скорость/);
  assert.match(item?.detailEn,/final speed/);
  assert.ok(!get(result.defense,id));
  assert.ok(!get(result.offense,id));
 }
 assert.equal(get(result.movement,260010001).recipient,true,
  'Any hero can receive the allied skill regardless of caster class');
 assert.equal(get(result.movement,320004001).recipient,true);
 assert.equal(get(result.movement,260003001).recipient,false);
 assert.equal(get(result.movement,260003001).available,true);
});
test('actual OS class caps, level requirements and zero prereq are respected',()=>{
 const warrior=movement('WARRIOR',{mastery:{warding:99}});
 assert.equal(get(warrior,260003001),undefined,'Warding cap 5 cannot train Dash');
 assert.equal(get(warrior,260010001)?.amount,200,
  'Ally-provided Bolster remains visible to a Warrior');
 const archer11=movement('ARCHER',{level:11,mastery:{warding:7}});
 assert.equal(get(archer11,260002001)?.available,false);
 assert.match(get(archer11,260002001)?.reason||'',/12/);
 assert.equal(get(archer11,260003001)?.available,false);
 assert.match(get(archer11,260003001)?.reason||'',/8/);
 assert.equal(get(movement('ARCHER',{level:12,mastery:{warding:8}}),
  260003001)?.available,true);
 assert.equal(get(movement('PALADIN',{mastery:{defense:41}}),168002003)?.amount,-20);
 assert.equal(get(movement('DISTURBANCE',{level:44,mastery:{assassin:55}}),
  230002005)?.available,false);
 assert.equal(get(movement('DISTURBANCE',{level:45,mastery:{assassin:55}}),
  230002005)?.available,true);
 const enemy=get(movement('ENCHANTER',{mastery:{blessing:21}}),320009001);
 assert.equal(enemy?.amount,-50);
 assert.equal(enemy?.hostile,true);
 assert.match(enemy?.detailEn,/enemy/);
});
test('unexpected skill structure and malformed coefficients fail closed',()=>{
 const broken=structuredClone(skills);
 const baseline=movement('SNIPER',{mastery:{warding:70}});
 const expected=get(baseline,260003001);
 assert.equal(expected?.amount,200);
 broken['260003001'].prereq=null;
 assert.equal(get(movement('SNIPER',{catalog:broken,mastery:{warding:70}}),
  260003001),undefined);
 broken['260003001'].prereq=0;
 broken['260003001'].funcs[0].dir='CASTER';
 assert.equal(get(movement('SNIPER',{catalog:broken,mastery:{warding:70}}),
  260003001),undefined);
 broken['260003001'].funcs[0].dir='TARGET';
 broken['260003001'].funcs[0].fv2[3]=10;
 assert.equal(get(movement('SNIPER',{catalog:broken,mastery:{warding:70}}),
  260003001),undefined);
 broken['260003001'].funcs[0].fv2[3]=0;
 broken['260003001'].funcs[0].fv1[0]=10;
 assert.equal(get(movement('SNIPER',{catalog:broken,mastery:{warding:70}}),
  260003001),undefined);
 broken['260003001'].funcs[0].fv1[0]=0;
 broken['260003001'].funcs[0].fv1[3]=-200;
 assert.equal(get(movement('SNIPER',{catalog:broken,mastery:{warding:70}}),
  260003001),undefined);
 assert.equal(get(baseline,320004001)?.amount,40,
  'Other canonical source previews do not change');
});
test('250 synthetic class/level/mastery vectors keep movement source data immutable',()=>{
 const before=JSON.stringify(skills),jobs=Object.keys(classes).sort();
 let considered=0;
 for(let i=0;i<250;i++){
  const job=jobs[i%jobs.length],caps=classes[job].branchCaps;
  const mastery=Object.fromEntries(Object.entries(caps).map(([k,n])=>
   [k,i%3===0?0:Math.max(0,Math.min(n,(i*17)%101))]));
  const rows=movement(job,{level:1+(i*7)%55,mastery});
  const seen=new Set();
  for(const row of rows){
   assert.ok(ids.includes(row.id),'no invented skill');
   assert.ok(!seen.has(row.id),'no duplicate skill identity');
   seen.add(row.id);
   const source=skills[String(row.id)].funcs.find(x=>x.ep==='EP_MOVESPEED_SCALE');
   assert.equal(row.amount,source.fv1[3],'read exactly current OS amount');
   assert.equal(typeof row.available,'boolean');
   assert.equal(row.modelOnly,true);
   considered++;
  }
 }
 assert.ok(considered>=250,'covered multiple class/movement scenarios');
 assert.equal(JSON.stringify(skills),before,'source JSON must be read-only');
});
test('Hero Book renders source-only movement group and the coverage audit counts it',()=>{
 const book=read('pandora-studio-hero-book.js');
 const audit=read('scripts/audit-os-skill-formulas.mjs');
 assert.match(book,/\['movement','Скорость передвижения · параметры умений'/);
 assert.match(book,/Movement speed · skill parameters/);
 assert.match(book,/gameSkillBadge\(skill\.id,skill\.name,source\?\.n/);
 assert.match(audit,/\.\.\.\(result\.movement\|\|\[\]\)/);
});

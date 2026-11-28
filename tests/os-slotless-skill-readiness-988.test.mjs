import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const env={};
Function('window',read('pandora-studio-equipment-rules.js'))(env);
const R=env.PandoraStudioRules;
const items=JSON.parse(read('data/os/items.json'));
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const jobs=Object.keys(classes);
const levels=[1,45,50,55];

test('a slotless consumable cannot pass any concrete equipment slot check',()=>{
 const potion=items['50001'];
 assert.equal(potion.slot,null);
 assert.equal(potion.classes.WARRIOR,1);
 for(const slot of ['weapon','shield','head','body','gloves','legs','feet','belt']){
  const check=R.equipment(potion,{slot,job:'WARRIOR',level:55});
  assert.equal(check.allowed,false,'potion assigned to '+slot);
  assert.ok(check.missing.includes('Другой слот'));
 }
 const unscoped=R.equipment(potion,{job:'WARRIOR',level:55});
 assert.equal(unscoped.allowed,true,
  'unscoped source permission is not an equipment action');
});

test('entire 1140-item catalog blocks 2248 false slotted grants without touching wearables',()=>{
 assert.equal(Object.keys(items).length,1140);
 assert.equal(jobs.length,28);
 let checked=0,slotless=0,wronglyGranted=0,wearables=0,expectedWearable=0;
 for(const item of Object.values(items)){
  if(item.slot===null)slotless++;
  else wearables++;
  for(const job of jobs)for(const level of levels){
   const slot=item.slot||'weapon',result=R.equipment(item,{slot,job,level});
   if(item.slot===null){
    assert.equal(result.allowed,false,'slotless item '+item.id+' '+job);
    if(item.classes?.[job]===1&&(item.level===null||item.level<=level))
     wronglyGranted++;
   }else{
    const expected=item.classes?.[job]===1&&
     (item.level===null||item.level<=level);
    assert.equal(result.allowed,expected,
     'wearable item '+item.id+' '+job+' '+level);
    if(expected)expectedWearable++;
   }
   checked++;
  }
 }
 assert.equal(checked,1140*28*4);
 assert.equal(slotless,556);
 assert.equal(wearables,584);
 assert.equal(wronglyGranted,2248,
  'only previously class-and-level-eligible slotless rows were false grants');
 assert.ok(expectedWearable>0);
});

test('malformed or absent skill identity is unknown rather than learnable',()=>{
 const options={job:'WARRIOR',level:55,points:{}};
 for(const value of [undefined,null,'broken',true,1,{},[],{id:-1},
  {id:'123'}, {id:0}, {id:1.5}]){
  const result=R.readiness(value,options);
  assert.equal(result.status,'unknown','input '+String(value));
  assert.ok(result.unknown.includes('Нет данных навыка'));
  assert.equal(result.gates.length,0);
 }
});

test('fake class grants and noninteger prerequisites never become eligible',()=>{
 const source={id:999,classes:{WARRIOR:0},learnable:true,
  charLevel:'oops',reqLevel:0,reqs:[{branch:'slash',amount:'90'}]};
 const denied=R.readiness(source,{job:'WARRIOR',level:55,points:{slash:90}});
 assert.equal(denied.status,'locked');
 assert.ok(denied.missing.includes('Недоступно этому классу'));
 assert.ok(denied.unknown.includes('Неизвестное требование ветки'));
 assert.ok(denied.unknown.includes('Некорректный уровень навыка'));
 const clean={...source,charLevel:1,classes:{WARRIOR:1},
  reqs:[{branch:'slash',amount:3}]};
 const valid=R.readiness(clean,{job:'WARRIOR',level:55,points:{slash:3}});
 assert.equal(valid.status,'eligible');
 assert.equal(valid.gates.length,1);
 assert.equal(valid.gates[0].met,true);
 const inherited=Object.create({WARRIOR:1});
 assert.notEqual(R.readiness({...clean,classes:inherited},
  {job:'WARRIOR',level:55,points:{slash:3}}).status,'eligible');
 for(const flag of [0,false,'1',true,[],null]){
  assert.notEqual(R.readiness({...clean,classes:{WARRIOR:flag}},
   {job:'WARRIOR',level:55,points:{slash:3}}).status,'eligible');
 }
});

test('broken numeric skill/hero levels, learned flags and mastery never imply eligibility',()=>{
 const clean={id:123456,classes:{WARRIOR:1},learnable:true,
  charLevel:1,reqLevel:0,reqs:[{branch:'slash',amount:3}]};
 const opts={job:'WARRIOR',level:55,points:{slash:5}};
 for(const level of [undefined,null,0,'55',false,NaN,1.5])
  assert.equal(R.readiness(clean,{...opts,level}).status,'unknown',
   'noninteger hero level '+String(level));
 for(const charLevel of [undefined,null,-1,'1',true,NaN,Infinity])
  assert.equal(R.readiness({...clean,charLevel},opts).status,'unknown',
   'invalid source charLevel '+String(charLevel));
 for(const reqLevel of [undefined,null,-1,'0',true,NaN])
  assert.equal(R.readiness({...clean,reqLevel},opts).status,'unknown',
   'invalid source reqLevel '+String(reqLevel));
 for(const learnable of [undefined,null,'true',1,false])
  assert.equal(R.readiness({...clean,learnable},opts).status,'unknown',
   'not explicitly learnable '+String(learnable));
 for(const amount of ['3',true,undefined,null,-1,3.5,NaN])
  assert.equal(R.readiness({...clean,reqs:[{branch:'slash',amount}]},opts)
   .status,'unknown','noninteger required mastery '+String(amount));
 for(const owned of ['5',true,[],{},-1,NaN,Infinity]){
  const result=R.readiness(clean,{...opts,points:{slash:owned}});
  assert.equal(result.status,'unknown',
   'malformed trained mastery '+String(owned));
  assert.ok(result.unknown.includes('Некорректное мастерство ветки'));
 }
 assert.equal(R.readiness({...clean,reqs:null},opts).status,'unknown');
 assert.equal(R.readiness({...clean,reqs:'bad'},opts).status,'unknown');
});

test('existing 571 skill records retain their 28-job four-level readiness decisions',()=>{
 assert.equal(Object.keys(skills).length,571);
 assert.equal(jobs.length,28);
 let n=0;
 const statuses={locked:0,eligible:0,unknown:0};
 for(const skill of Object.values(skills)){
  assert.ok(Number.isSafeInteger(skill.id)&&skill.id>0);
  assert.ok(Array.isArray(skill.reqs));
  for(const job of jobs)for(const level of levels){
   const out=R.readiness(skill,{job,level,points:{}});
   assert.ok(out&&['locked','eligible','unknown'].includes(out.status));
   assert.ok(Array.isArray(out.gates)&&Array.isArray(out.missing)&&
    Array.isArray(out.unknown));
   statuses[out.status]++;
   n++;
  }
 }
 assert.equal(n,571*28*4);
 assert.deepEqual(statuses,{locked:58324,eligible:505,unknown:5123});
});

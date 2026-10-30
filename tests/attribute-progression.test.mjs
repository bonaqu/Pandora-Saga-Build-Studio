import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scope={};Function('window',src('attribute-progression.js'))(scope);
const m=scope.PandoraAttributeProgression,os=JSON.parse(src('data/os/tables.json'));
const parity=[{"race":"HUMAN","klass":"WARRIOR","values":[7,8,4,6,4,5]},{"race":"HUMAN","klass":"SCOUT","values":[5,7,6,7,4,5]},{"race":"HUMAN","klass":"ACOLYTE","values":[5,7,4,5,6,7]},{"race":"HUMAN","klass":"MAGE","values":[4,6,4,6,6,8]},{"race":"ELF","klass":"WARRIOR","values":[5,6,5,5,6,7]},{"race":"ELF","klass":"SCOUT","values":[3,5,7,6,6,7]},{"race":"ELF","klass":"ACOLYTE","values":[3,5,5,4,8,9]},{"race":"ELF","klass":"MAGE","values":[2,4,5,5,8,10]},{"race":"DWARF","klass":"WARRIOR","values":[8,10,4,7,2,3]},{"race":"DWARF","klass":"SCOUT","values":[6,9,6,8,2,3]},{"race":"DWARF","klass":"ACOLYTE","values":[6,9,4,6,4,5]},{"race":"DWARF","klass":"MAGE","values":[5,8,4,7,4,6]},{"race":"MYLIN","klass":"WARRIOR","values":[7,8,8,7,2,2]},{"race":"MYLIN","klass":"SCOUT","values":[5,7,10,8,2,2]},{"race":"MYLIN","klass":"ACOLYTE","values":[5,7,8,6,4,4]},{"race":"MYLIN","klass":"MAGE","values":[4,6,8,7,4,5]},{"race":"ENKIDU","klass":"WARRIOR","values":[10,9,3,5,5,2]},{"race":"ENKIDU","klass":"SCOUT","values":[8,8,5,6,5,2]},{"race":"ENKIDU","klass":"ACOLYTE","values":[8,8,3,4,7,4]},{"race":"ENKIDU","klass":"MAGE","values":[7,7,3,5,7,5]},{"race":"RAPIN","klass":"WARRIOR","values":[5,4,5,6,8,6]},{"race":"RAPIN","klass":"SCOUT","values":[3,3,7,7,8,6]},{"race":"RAPIN","klass":"ACOLYTE","values":[3,3,5,5,10,8]},{"race":"RAPIN","klass":"MAGE","values":[2,2,5,6,10,9]}];
test('all 24 preserved Remaked initial combinations equal OS',()=>{
 for(const x of parity)assert.deepEqual(m.base(os,x.race,x.klass),x.values);
});
test('Rapin Warrior L1 = 5 4 5 6 8 6, no spend',()=>{
 const s=m.snapshot({tables:os,race:'RAPIN',klass:'WARRIOR',level:1,added:[0,0,0,0,0,0]});
 assert.deepEqual(s.base,[5,4,5,6,8,6]);assert.equal(s.total,0);assert.equal(m.allowed(s,0,1),false);
});
test('level budgets and costs exactly match Remaked source',()=>{
 for(const [l,v]of [[1,0],[2,6],[10,56],[20,138],[30,240],[40,362],[50,504],[55,544]])
  assert.equal(m.budget(l),v);
 assert.equal(m.cost(30,1),3);assert.equal(m.cost(50,1),4);assert.equal(m.cost(29,3),8);
});
test('cannot overspend or exceed 99; over-budget legacy builds may refund',()=>{
 const s=m.snapshot({tables:os,race:'RAPIN',klass:'WARRIOR',level:2,added:[2,1,0,0,0,0]});
 assert.equal(s.spent,6);assert.equal(m.allowed(s,0,3),false);assert.equal(m.allowed(s,0,1),true);
 const old=m.snapshot({tables:os,race:'RAPIN',klass:'WARRIOR',level:1,added:[3,0,0,0,0,0]});
 assert.equal(old.remaining,-6);assert.equal(m.allowed(old,0,4),false);assert.equal(m.allowed(old,0,2),true);
 const limit=m.snapshot({tables:os,race:'RAPIN',klass:'WARRIOR',level:55,added:[94,0,0,0,0,0]});
 assert.equal(limit.values[0],99);assert.equal(m.allowed(limit,0,95),false);
});

test('old build with 99 added over baseline may refund, never silently truncate',()=>{
 const saved=m.snapshot({tables:os,race:'RAPIN',klass:'WARRIOR',level:55,added:[99,0,0,0,0,0]});
 assert.ok(saved);assert.equal(saved.values[0],104);
 assert.equal(m.allowed(saved,0,100),false);assert.equal(m.allowed(saved,0,98),true);
});

test('Rapin Scout starts at 3/3/7/7/8/6 and absolute inputs enforce base minimum',()=>{
 const s=m.snapshot({tables:os,race:'RAPIN',klass:'SCOUT',level:55,
  added:[0,0,0,0,0,0]});
 assert.deepEqual(s.values,[3,3,7,7,8,6]);
 for(let i=0;i<6;i++){
  assert.equal(m.absolute(s,i),s.base[i]);
  assert.equal(m.resolveAbsolute(s,i,s.base[i]-1),s.base[i]);
  assert.equal(m.resolveAbsolute(s,i,-500),s.base[i]);
 }
 assert.equal(m.resolveAbsolute(s,0,'2'),3);
 assert.equal(m.resolveAbsolute(s,3,'100'),99);
 assert.equal(m.resolveAbsolute(s,3,'1000'),99);
 assert.equal(m.resolveAbsolute(s,3,'not a number'),7);
});
test('absolute stat input respects remaining level budget, not just the 99 ceiling',()=>{
 const s=m.snapshot({tables:os,race:'RAPIN',klass:'SCOUT',level:1,
  added:[0,0,0,0,0,0]});
 assert.equal(s.total,0);
 assert.equal(m.resolveAbsolute(s,3,100),7);
 const withPoints=m.snapshot({tables:os,race:'RAPIN',klass:'SCOUT',level:2,
  added:[0,0,0,0,0,0]});
 assert.ok(m.resolveAbsolute(withPoints,3,99)>7);
 assert.ok(m.resolveAbsolute(withPoints,3,99)<99);
 const chosen=m.resolveAbsolute(withPoints,3,99)-withPoints.base[3];
 assert.equal(m.allowed(withPoints,3,chosen),true);
 assert.equal(m.allowed(withPoints,3,chosen+1),false);
});
test('existing saved added-only stats round-trip without implicit migration',()=>{
 const saved={stats:{'Выносливость':12,'Сила':0,'Ловкость':0,'Сноровка':4,'Дух':0,'Интеллект':0}};
 const s=m.snapshot({tables:os,race:'RAPIN',klass:'SCOUT',level:55,
  added:[12,0,0,4,0,0]});
 assert.deepEqual(s.values,[15,3,7,11,8,6]);
 assert.equal(m.resolveAbsolute(s,0,15)-s.base[0],saved.stats['Выносливость']);
 assert.equal(m.resolveAbsolute(s,3,11)-s.base[3],saved.stats['Сноровка']);
});
test('flat equipment ability bonuses can exceed 99 without increasing invested points',()=>{
 const calcScope={};
 Function('window',src('os-calculator.js'))(calcScope);
 const calc=calcScope.PandoraOSCalculator;
 const s=m.snapshot({tables:os,race:'RAPIN',klass:'SCOUT',level:55,
  added:[0,0,0,92,0,0]});
 assert.equal(s.values[3],99);
 const item={effects:[{func:'EP_DEXTERITY_CONST',a:11}]};
 const out=calc.base({classData:{hp:{base:85,lv:13.85,vit:5.22},
  mp:{base:45,lv:2.69,spi:2.5}},raceData:os.raceInit.RAPIN,
  jobData:os.jobInit.SCOUT,level:55,allocation:{dex:92},
  records:[['test-item',item,0]]});
 assert.equal(out.basic.dex,99);
 assert.equal(out.effects.flat.dex,11);
 assert.equal(out.stats.dex,110);
 assert.equal(s.values[3],99,'paid stat remains at 99');
});

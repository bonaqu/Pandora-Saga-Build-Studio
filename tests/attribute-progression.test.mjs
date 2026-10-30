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

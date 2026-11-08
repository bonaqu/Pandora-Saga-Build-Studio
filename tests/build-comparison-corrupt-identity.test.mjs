import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const host={};
Function('window',readFileSync(new URL('../pandora-studio-build-comparison.js',import.meta.url),'utf8'))(host);
const compare=host.PandoraBuildComparison;
const opts={races:[['Человек','Human'],['Эльф','Elf']],jobs:['Воин','Маг'],
 stats:[],branches:[],slotLabels:[],equipment:{},souls:{}};
const row=(a,b,lang,key)=>compare.matrixRows(a,b,{...opts,lang})
 .find(value=>value.key===key);

test('damaged gender, race and class stay unknown while differing IDs remain distinct',()=>{
 const a={race:120,job:77,gender:'broken'},b={race:121,job:78,gender:1};
 const original=JSON.stringify(a);
 for(const lang of ['ru','en']){
  for(const key of ['race','job']){
   const result=row(a,b,lang,key);
   assert.deepEqual([result.a,result.b,result.equal],['—','—',false]);
  }
  const gender=row(a,b,lang,'gender');
  assert.equal(gender.a,'—');
  assert.equal(gender.b,lang==='en'?'Male':'Мужской');
  assert.equal(gender.equal,false);
 }
 assert.equal(JSON.stringify(a),original);
});
test('legacy missing gender stays at documented zero; exact string 1 is accepted',()=>{
 assert.equal(row({}, {gender:0},'ru','gender').equal,true);
 const string=row({gender:'1'},{gender:1},'en','gender');
 assert.deepEqual([string.a,string.b,string.equal],['Male','Male',true]);
 assert.equal(row({gender:4},{gender:0},'ru','gender').a,'—');
});
test('damaged masteryAuto does not impersonate enabled; different unknown values are distinct',()=>{
 const damaged=row({masteryAuto:'false'},{masteryAuto:false},'ru','masteryAuto');
 assert.deepEqual([damaged.a,damaged.b,damaged.equal],['—','Выкл',false]);
 const different=row({masteryAuto:'false'},{masteryAuto:2},'en','masteryAuto');
 assert.deepEqual([different.a,different.b,different.equal],['—','—',false]);
 assert.equal(row({},{masteryAuto:true},'en','masteryAuto').equal,true);
});
test('damaged honor title cannot become None and historical exact number strings stay equal',()=>{
 const a={attributeBuffs:{honorTitle:'invalid'}},b={attributeBuffs:{honorTitle:0}};
 const changed=row(a,b,'ru','honorTitle');
 assert.deepEqual([changed.a,changed.b,changed.equal],['—','Без титула',false]);
 assert.equal(row({attributeBuffs:{honorTitle:'1'}},
  {attributeBuffs:{honorTitle:1}},'en','honorTitle').equal,true);
 const two=row({attributeBuffs:{honorTitle:'first'}},
  {attributeBuffs:{honorTitle:'second'}},'en','honorTitle');
 assert.deepEqual([two.a,two.b,two.equal],['—','—',false]);
 assert.ok(compare.describe(a,b,{lang:'ru'}).some(value=>value.includes('—')));
});
test('invalid profile and resistance lists show no object internals, but remain different',()=>{
 const a={profile:{guild:{bad:'value'}},attributeBuffs:{resistanceSkillIds:{bad:1}}};
 const b={profile:{guild:'Guild'},attributeBuffs:{resistanceSkillIds:['bad-id']}};
 const guild=row(a,b,'en','profile.guild');
 assert.deepEqual([guild.a,guild.b,guild.equal],['—','Guild',false]);
 const resistance=row(a,b,'en','resistanceSkills');
 assert.deepEqual([resistance.a,resistance.b,resistance.equal],['—','—',false]);
 const original=JSON.stringify(a);
 compare.matrixRows(a,b,opts);
 assert.equal(JSON.stringify(a),original);
});

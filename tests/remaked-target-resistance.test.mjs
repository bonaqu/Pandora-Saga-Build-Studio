import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scope={};Function('window',read('os-calculator.js'))(scope);
const C=scope.PandoraOSCalculator;
const souls=JSON.parse(read('data/os/souls.json'));
const en=JSON.parse(read('data/os/strings.en.json'));
const cases=[[103029,502,'animal','animals'],[103030,504,'devil','demons'],
 [103031,505,'immortal','undead'],[103032,508,'reptilian','reptiles'],
 [103033,511,'ghost','ghosts'],[103034,512,'golem','unliving creatures']];
const preview=records=>C.targetResistancePreview({records}).entries;

test('six verified OS Souls and their RU/EN descriptions map to six distinct families',()=>{
 for(const [id,race,key,nameEn] of cases){
  const original=souls[id];
  assert.equal(original.effects[0].b,race);
  for(const locale of ['ru','en']){
   const record=locale==='en'?{...original,name:en.souls[id].n,desc:en.souls[id].d}:original;
   const rows=preview([['soul:'+id,record,0]]);
   assert.equal(rows.length,1,id+' '+locale);
   assert.equal(rows[0].key,key);
   assert.equal(rows[0].nameEn,nameEn);
   assert.equal(rows[0].raceId,race);
   assert.equal(rows[0].change,-3);
   assert.equal(rows[0].source,record.name);
  }
  assert.deepEqual(preview([['soul:'+id,original,11]]),[]);
 }
 assert.equal(C.targetResistancePreview({records:[['soul:103029',souls[103029],0]]}).verified,false);
});

test('forged source, altered description, grade, direction and race are ignored',()=>{
 const record=souls[103029],effect=record.effects[0];
 const bad=[
  ['soul:1',record,0],['item:103029',record,0],
  ['soul:103029',{...record,id:103030},0],
  ['soul:103029',{...record,desc:'Damage Reduction against Animals +4%'},0],
  ['soul:103029',{...record,slots:['weapon']},0],
  ['soul:103029',{...record,effects:[{...effect,b:504}]},0],
  ['soul:103029',{...record,effects:[{...effect,dir:'TARGET'}]},0],
  ['soul:103029',{...record,effects:[{...effect,a:-4}]},0],
  ['soul:103029',{...record,effects:[{...effect,min:1}]},0],
  ['soul:103029',{...record,effects:[{...effect,max:9}]},0],
  ['soul:103029',{...record,effects:[effect,effect]},0],
  ['soul:103029',record,-1],['soul:103029',record,0.5],
  ['soul:103029',record,25]
 ];
 for(const row of bad)assert.deepEqual(preview([row]),[],JSON.stringify(row));
 assert.deepEqual(preview([['soul:103029',record,10]]).map(x=>x.change),[-3]);
});

test('two valid sockets remain separate previews; no invented stacking',()=>{
 const soul=souls[103029],entries=preview([
  ['soul:103029',soul,0],['soul:103029',soul,0]]);
 assert.deepEqual(entries.map(x=>x.change),[-3,-3]);
});

test('bilingual Book labels keep separate creature damage from global defense',()=>{
 const code=read('os-calculator.js'),book=read('stage-attributes.js');
 assert.match(code,/const targetResistance=targetResistancePreview\(/);
 assert.match(code,/resistances,targetResistance,procPreview,experienceBonus,battleMapCloaks,specialEquipment,regeneration/);
 assert.match(book,/english\?'Defense by enemy type'/);
 assert.match(book,/english\?'Damage from ':'Урон от '/);
 assert.match(book,/english\?effect.nameEn:effect.name/);
 assert.equal(en.souls['103034'].d,'Damage Reduction against Unliving +3%',
  'OS English does not prove equivalence to the historical Remaked Inanimate type');
});

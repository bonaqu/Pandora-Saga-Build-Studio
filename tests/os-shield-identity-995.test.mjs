import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const env={};
Function('window',read('pandora-os-character-calculator.js'))(env);
const C=env.PandoraOSCalculator;
const items=JSON.parse(read('data/os/items.json'));
const stats={vit:40,str:50,agi:70,dex:35,spi:30,int:50};
const source=items['16001'];
assert.equal(source.id,16001);
assert.equal(source.slot,'shield');
const common={stats,level:35,jobKey:'KNIGHT',
  weapon:{W:48},combatBuffs:{combatDefender:true}};
const preview=records=>C.combatPreview({...common,records});

test('verified catalog shield grants the active stance; mismatch cannot activate it',()=>{
 const legitimate=preview([['item:16001',source,0]]);
 assert.equal(legitimate?.activeSkills.defender,true);
 assert.ok(legitimate.defense.activeBonus>0);
 assert.ok(legitimate.attack.activeBonus<0);
 const mismatched=[['item:16011',source,0]];
 const forged=preview(mismatched);
 const bare=preview([]);
 assert.deepEqual(forged,bare,
  'a stale saved item ID must not unlock shield-restricted skills');
 assert.equal(forged.activeSkills.defender,false);
 assert.equal(forged.attack.activeBonus,0);
 assert.equal(forged.defense.activeBonus,0);
});

test('a malformed or partial shield record does not count as equipped',()=>{
 const cases=[
  ['item:16001',{...source,id:16011},0],
  ['item:16001',{...source,id:'16001'},0],
  ['item:016001',source,0],
  ['item:16001',{...source,name:'-'},0],
  ['item:16001',source,-1],
  ['item:16001',source,11],
  ['item:16001',source,0.5],
  ['item:16001',source,'0'],
  ['item:16001',source,null],
  ['item:16001',null,0],
  ['item:16001',{},0],
  ['item:16001',[],0],
  ['item:16001',source]
 ];
 for(const item of cases){
  const result=preview([item]);
  assert.ok(result===null||result.activeSkills.defender===false,
   'invalid/partial shield cannot activate Defender: '+String(item[0])+
   ' grade '+String(item[2]));
 }
});

test('damaged neighboring entries preserve a real shield and original numbers',()=>{
 const genuine=['item:16001',source,5];
 const damaged=[null,undefined,{},false,['item:16011',source,0],
  ['item:16001',source],['item:16001',{...source,id:16021},0]];
 const expected=preview([genuine]);
 const actual=preview([...damaged,genuine]);
 assert.ok(expected&&actual&&expected.activeSkills.defender);
 assert.deepEqual(actual,expected);
});

test('existing synthetic test labels remain compatible while numeric identity is strict',()=>{
 const fixture={id:1,name:'Щит',slot:'shield',AC:40};
 const baseline=preview([['item:shield',fixture,0]]);
 assert.equal(baseline?.activeSkills.defender,true);
 assert.equal(preview([['item:1',fixture,0]])?.activeSkills.defender,true);
 assert.equal(preview([['item:2',fixture,0]])?.activeSkills.defender,false);
});

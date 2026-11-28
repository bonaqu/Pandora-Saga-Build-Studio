import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const env={};
Function('window',read('pandora-os-character-calculator.js'))(env);
const C=env.PandoraOSCalculator;
const classes=JSON.parse(read('data/os/classes.json'));
const items=JSON.parse(read('data/os/items.json'));
const souls=JSON.parse(read('data/os/souls.json'));
const unison=JSON.parse(read('data/os/unison.json'));
const attrs={vit:17,str:13,agi:14,dex:15,spi:16,int:12};
const zeros={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const input=(classData,level,records)=>({
 classData,raceData:attrs,jobData:zeros,allocation:zeros,level,records
});

test('Hero Book base tolerates null gear across all 28 classes and levels 1..55',()=>{
 let compared=0;
 for(const [jobKey,classData] of Object.entries(classes))
  for(let level=1;level<=55;level++){
   const expected=C.base(input(classData,level,[]));
   const actual=C.base(input(classData,level,null));
   assert.ok(expected&&Number.isFinite(expected.hp)&&Number.isFinite(expected.mp),
    jobKey+' level '+level+' reference calculation');
   assert.deepEqual(actual,expected,jobKey+' level '+level+' null gear');
   compared++;
  }
 assert.equal(compared,1540);
});

test('corrupt outer equipment containers are equivalent to an empty list',()=>{
 const classData=classes.CLERIC;
 const expected=C.base(input(classData,45,[]));
 for(const records of [undefined,null,false,true,0,42,'item:13041',
   {},{length:1},{0:['item:13041',items['13041'],0]},
   new Set([['item:13041',items['13041'],0]]),new Uint8Array([0,1])]){
  assert.deepEqual(C.base(input(classData,45,records)),expected,
   'non-array '+Object.prototype.toString.call(records));
 }
});

test('damaged neighboring saved tuples cannot erase a legitimate item or Soul',()=>{
 const valid=[
  ['item:13041',items['13041'],0],
  ['soul:100001',souls['100001'],0]
 ];
 const malformed=[null,undefined,false,5,'malformed',{},[],
  ['item:13041'],['soul:100001',souls['100001']],...valid];
 const base=input(classes.CLERIC,45,valid);
 const expected=C.base({...base,unisonCatalog:unison});
 const actual=C.base({...base,records:malformed,unisonCatalog:unison});
 assert.ok(expected&&actual&&expected.hp>0);
 assert.deepEqual(actual,expected);
});

test('empty default, malformed and normal gear leave base numeric formulas unchanged',()=>{
 const shared=input(classes.WARRIOR,45,[]);
 const absent=C.base({...shared,records:undefined});
 const empty=C.base(shared);
 assert.deepEqual(absent,empty);
 assert.deepEqual(C.base({...shared,records:[]}),empty);
 const equipped=C.base({...shared,records:[['item:13041',items['13041'],0]]});
 assert.ok(equipped&&Number.isFinite(equipped.hp)&&Number.isFinite(equipped.mp));
 assert.equal(equipped.hp, C.base({...shared,
  records:[null,['item:13041',items['13041'],0]]}).hp);
});

test('shield eligibility ignores broken neighbors without disabling a real shield',()=>{
 const shield={id:1,slot:'shield',AC:40,name:'Щит'};
 const common={stats:attrs,level:45,jobKey:'KNIGHT',
  combatBuffs:{combatDefender:true},weapon:{W:48}};
 const valid=[['item:1',shield,0]];
 const baseline=C.combatPreview({...common,records:valid});
 const withDamage=C.combatPreview({...common,records:[
  null,undefined,5,{},[],['item:1',shield],...valid
 ]});
 assert.ok(baseline&&baseline.activeSkills.defender,
  'a valid equipped shield still enables defender');
 assert.deepEqual(withDamage,baseline);
 assert.equal(C.combatPreview({...common,records:[
  null,{},['item:1',shield]
 ]})?.activeSkills.defender,false,
  'a partial shield tuple is not equipped armor');
});

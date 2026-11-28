import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const env={};
Function('window',read('pandora-os-character-calculator.js'))(env);
const C=env.PandoraOSCalculator;
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const attrs={vit:17,str:13,agi:14,dex:15,spi:16,int:12};
const zeros={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const data=(classData,level)=>({classData,raceData:attrs,jobData:zeros,
 allocation:{str:2},level});

test('official game race and job source stats are numeric integers, not coerced booleans',()=>{
 const keys=['vit','str','agi','dex','spi','int'];
 let checked=0;
 for(const map of [tables.raceInit,tables.jobInit])
  for(const record of Object.values(map))
   for(const key of keys){
    assert.ok(Number.isSafeInteger(record[key]),key);
    checked++;
   }
 assert.equal(checked,60);
});

test('28 classes x 55 levels: valid numeric strings preserve exact complete results',()=>{
 let compared=0;
 const stringValues=x=>Object.fromEntries(Object.entries(x).map(([k,v])=>[k,String(v)]));
 for(const [job,cls] of Object.entries(classes))
  for(let level=1;level<=55;level++){
   const input=data(cls,level),expected=C.base(input);
   const fromStrings=C.base({...input,
    raceData:stringValues(attrs),jobData:stringValues(zeros),allocation:{str:'2'}});
   assert.ok(expected&&fromStrings,job+' L'+level);
   assert.deepEqual(fromStrings,expected,job+' L'+level);
   compared++;
  }
 assert.equal(compared,1540);
});

test('malformed race and job stats cannot fabricate STR with Number(true/null/[7])',()=>{
 const input=data(classes.WARRIOR,45);
 for(const value of [true,false,null,[],[7],{},'']){
  for(const field of ['raceData','jobData']){
   const vector={...(field==='raceData'?attrs:zeros),str:value};
   assert.equal(C.base({...input,[field]:vector}),null,
    field+' invalid '+String(value));
  }
 }
});

test('a malformed allocated point never counts as one or seven spent points',()=>{
 const input=data(classes.WARRIOR,45);
 for(const value of [true,false,[7],{},'1.2',-1,'bad']){
  assert.equal(C.base({...input,allocation:{str:value}}),null,
   'invalid spent '+String(value));
 }
 for(const empty of [null,undefined,'','  ']){
  const expected=C.base({...input,allocation:{}});
  assert.deepEqual(C.base({...input,allocation:{str:empty}}),expected);
 }
});

test('malformed supplemental bonus cannot grant phantom stats; numeric text remains valid',()=>{
 const input=data(classes.WARRIOR,45);
 const basic=C.base(input);
 assert.equal(basic.stats.str,15);
 for(const value of [true,false,[7],{},' ',null,undefined]){
  const restored=C.base({...input,supplementalFlat:{str:value}});
  assert.equal(restored?.stats?.str,15,'invalid flat '+String(value));
  assert.equal(restored?.hp,basic.hp);
  assert.equal(restored?.mp,basic.mp);
 }
 const real=C.base({...input,supplementalFlat:{str:7}});
 const text=C.base({...input,supplementalFlat:{str:'7'}});
 assert.equal(real.stats.str,22);
 assert.deepEqual(text,real);
});

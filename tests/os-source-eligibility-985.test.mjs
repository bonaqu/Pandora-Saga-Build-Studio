import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const env={};
Function('window',read('pandora-os-character-calculator.js'))(env);
Function('window',read('pandora-studio-equipment-rules.js'))(env);
const C=env.PandoraOSCalculator,R=env.PandoraStudioRules;
const items=JSON.parse(read('data/os/items.json'));
const souls=JSON.parse(read('data/os/souls.json'));
const forth=JSON.parse(read('data/os/itemForth.json'));
const sets=JSON.parse(read('data/os/unison.json'));
const jobs=Object.keys(JSON.parse(read('data/os/classes.json')));
const ctx=(item,job='WARRIOR',level=55)=>({slot:item.slot,job,level});

test('bad item levels and class flags cannot create usable equipment',()=>{
 const source=items['1'];
 assert.ok(source&&R.equipment(source,ctx(source,'WARRIOR',55)).allowed);
 for(const bad of ['40',true,false,undefined,NaN,Infinity,-1,1.5,{},[]]){
  const item={...source,level:bad};
  const result=R.equipment(item,ctx(item,'WARRIOR',55));
  assert.equal(result.allowed,false,'invalid source level '+String(bad));
  assert.ok(result.missing.some(message=>message.includes('уровень предмета')));
 }
 for(const classes of [null,undefined,[],{}, {WARRIOR:0},
  {WARRIOR:false},{WARRIOR:'1'},{WARRIOR:-1}]){
  const item={...source,classes};
  assert.equal(R.equipment(item,ctx(item,'WARRIOR',55)).allowed,false,
   'unverified class grant '+JSON.stringify(classes));
 }
 const inherited=Object.create({WARRIOR:1});
 assert.equal(R.equipment({...source,classes:inherited},
  ctx(source,'WARRIOR',55)).allowed,false,
  'inherited prototype values cannot authorize an item');
 for(const level of [null,undefined,'55',false,0,NaN,1.5])
  assert.equal(R.equipment(source,ctx(source,'WARRIOR',level)).allowed,false,
   'invalid hero level '+String(level));
 const arrow=items['65002'];
 assert.equal(arrow.level,null);
 assert.equal(R.equipment(arrow,ctx(arrow,'WARRIOR',1)).allowed,true,
  'source level-free ammunition must remain eligible');
});

test('canonical 1140-item eligibility agrees across 28 jobs and levels 1,45,50,55',()=>{
 let compared=0;
 for(const item of Object.values(items)){
  assert.ok(item&&Number.isSafeInteger(item.id));
  assert.ok(item.level===null||Number.isSafeInteger(item.level));
  for(const job of jobs)for(const level of [1,45,50,55]){
   const expected=item.classes?.[job]===1&&
    (item.level===null||item.level<=level);
   assert.equal(R.equipment(item,ctx(item,job,level)).allowed,expected,
    'item '+item.id+' '+job+' level '+level);
   compared++;
  }
 }
 assert.equal(compared,1140*28*4);
});

test('malformed structured effects never crash or promote free-form upgrade prose',()=>{
 const id=777,desc='За каждые 2 единицы улучшения: ОЗ +30';
 const valid={id,desc,effects:[
  null,false,{}, {func:'EP_STRENGTH_CONST',a:1}]};
 const normal=C.sourceEffects('item:'+id,valid,7,null);
 assert.ok(normal.some(e=>e.func==='EP_STRENGTH_CONST'&&e.a===1));
 assert.ok(normal.some(e=>e.func==='EP_MAXLIFE_CONST'&&e.a===90));
 for(const bad of [{corrupted:true},'broken',42,null]){
  const record={id,desc,effects:bad};
  assert.doesNotThrow(()=>C.sourceEffects('item:'+id,record,7,null));
  assert.deepEqual(C.sourceEffects('item:'+id,record,7,null),[]);
  assert.equal(C.gatherEffects([['item:'+id,record,7]]).health.hp,0);
 }
 const protectedBase={id,desc,effects:[
  {func:'EP_MAXLIFE_CONST',a:30,min:7,max:10},null]};
 const gated=C.sourceEffects('item:'+id,protectedBase,7,null);
 assert.equal(gated.filter(e=>e.func==='EP_MAXLIFE_CONST').length,1,
  'do not double count when valid structured upgrade already provides it');
});

test('set identity and numeric companion keys must match the canonical catalog',()=>{
 const ids=['14094',...sets['14094'].members.map(String)];
 const records=ids.map(id=>['item:'+id,items[id],0]);
 const real=C.unisonPreview({records,catalog:sets});
 assert.ok(real.active.some(set=>set.id===14094));
 const forged={...sets['14094'],id:12081};
 const mismatched=C.unisonPreview({records,catalog:{14094:forged}});
 assert.equal(mismatched.supplemental.length,0);
 const noIdentity={...sets['14094']};
 delete noIdentity.id;
 assert.equal(C.unisonPreview({records,catalog:{14094:noIdentity}}).supplemental.length,0);
 const stringMember={...sets['14094'],members:['17034']};
 assert.equal(C.unisonPreview({records,catalog:{14094:stringMember}}).supplemental.length,0);
 const malformed=[null,false,{},[],...records];
 assert.doesNotThrow(()=>C.unisonPreview({records:malformed,catalog:sets}));
 assert.equal(C.unisonPreview({records:malformed,catalog:sets})
  .active.find(x=>x.id===14094)?.companionCount,1);
});

test('unchanged structured effects across all 1255 items/Souls and grade 0..10',()=>{
 let samples=0;
 for(const [kind,catalog] of [['item',items],['soul',souls]])
  for(const [id,record] of Object.entries(catalog)){
   assert.equal(String(record.id),id);
   for(let grade=0;grade<=10;grade++){
    const effects=C.sourceEffects(kind+':'+id,record,grade,forth);
    assert.ok(Array.isArray(effects)&&effects.every(e=>
     e&&typeof e.func==='string'));
    samples++;
   }
  }
 assert.equal(samples,(1140+115)*11);
});

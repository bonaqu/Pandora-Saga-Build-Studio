import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const host={};
Function('window',read('pandora-studio-remaked-buffs.js'))(host);
Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator,B=host.PandoraRemakedBuffs;
const combat={attack:{walkingBase:219},accuracy:{base:123},dodge:{base:134}};
const inspect=source=>C.alliedRecipientPreviews({skillCatalog:source,combat});
const entries=[
 {id:320001001,key:'warCry',ep:'EP_DAMAGERATE_CONST',value:10},
 {id:100055001,key:'massConcentration',ep:'EP_TOHIT_CONST',value:20},
 {id:260006001,key:'windAssist',ep:'EP_AVOIDANCE_CONST',value:15},
 {id:320004001,key:'windBlessing',ep:'EP_MOVESPEED_SCALE',value:40},
 {id:330004001,key:'divineBlessing',ep:'EP_MAGIC_RESISTANCE_CONST',value:25},
 {id:320002001,key:'blessedRepose',ep:'EP_HEAL_TIME_SCALE',value:90}
];
const set=(source,id,ep,index,value)=>{
 const fx=source[String(id)]?.funcs?.find(row=>row.ep===ep);
 assert.ok(fx,id+' '+ep);
 fx.fv1[index]=value;
};

test('six current official source magnitudes agree with previously modeled recipient numbers',()=>{
 const snapshot=JSON.stringify(skills);
 const out=inspect(skills);
 assert.deepEqual(out.warCry,{base:219,bonus:10+Math.floor(219*.20)});
 assert.deepEqual(out.massConcentration,{base:123,bonus:Math.floor(20+123*.15)});
 assert.deepEqual(out.windAssist,{base:134,bonus:Math.floor(15+134*.15)});
 assert.deepEqual(out.windBlessing,{bonus:40});
 assert.deepEqual(out.divineBlessing,{bonus:25});
 assert.deepEqual(out.blessedRepose,{bonus:90});
 for(const row of entries){
  assert.deepEqual(skills[row.id].funcs.find(f=>f.ep===row.ep).fv1,
   [0,0,0,row.value]);
 }
 assert.deepEqual(B.applied({selected:[100055001,330004001,320002001],skills}),{
  thirdEye:{flat:20,percent:15},providence:{magic:25},
  blessedRepose:{manaRecoverySpeed:90}
 });
 assert.equal(JSON.stringify(skills),snapshot);
});

test('each changed same-shape OS constant reaches both Book preview and selected Remaked buff',()=>{
 for(const item of entries){
  const modified=structuredClone(skills);
  set(modified,item.id,item.ep,3,item.value+1);
  const before=inspect(skills)[item.key],after=inspect(modified)[item.key];
  assert.ok(after&&before,item.key);
  assert.equal(after.bonus,before.bonus+1,item.key+' applies its official new constant');
  if(item.id===100055001)
   assert.equal(B.applied({selected:[item.id],skills:modified}).thirdEye.flat,21);
  if(item.id===330004001)
   assert.equal(B.applied({selected:[item.id],skills:modified}).providence.magic,26);
  if(item.id===320002001)
   assert.equal(B.applied({selected:[item.id],skills:modified})
    .blessedRepose.manaRecoverySpeed,91);
 }
 for(const [id,ep,original] of [
  [320001001,'EP_DAMAGERATE_SCALE',20],
  [100055001,'EP_TOHIT_SCALE',15],
  [260006001,'EP_AVOIDANCE_SCALE',15]
 ]){
  const modified=structuredClone(skills);
  set(modified,id,ep,3,original+1);
  const key=entries.find(x=>x.id===id).key;
  const actual=inspect(modified)[key].bonus;
  const base=key==='warCry'?219:key==='massConcentration'?123:134;
  const flat=key==='warCry'?10:key==='massConcentration'?20:15;
  const expected=key==='warCry'?
   flat+Math.floor(base*(original+1)/100):
   Math.floor(flat+base*(original+1)/100);
  assert.equal(actual,expected,key+' new rate');
  if(key==='massConcentration')
   assert.equal(B.applied({selected:[id],skills:modified}).thirdEye.percent,16);
 }
});

test('new FV dependencies and source kind are rejected, without poisoning other ally effects',()=>{
 for(const item of entries){
  const invalid=structuredClone(skills);
  const f=invalid[String(item.id)].funcs.find(row=>row.ep===item.ep);
  f.fv2[0]=1;
  assert.equal(inspect(invalid)[item.key],null,item.key+' FV2');
  const level=structuredClone(skills);
  level[String(item.id)].funcs.find(row=>row.ep===item.ep).fv1[1]=1;
  assert.equal(inspect(level)[item.key],null,item.key+' unknown level coefficient');
  const direction=structuredClone(skills);
  direction[String(item.id)].funcs.find(row=>row.ep===item.ep).dir='CASTER';
  assert.equal(inspect(direction)[item.key],null,item.key+' direction');
  const unrecognized=structuredClone(skills);
  unrecognized[String(item.id)].funcs.find(row=>row.ep===item.ep).fv1[3]=101;
  assert.equal(inspect(unrecognized)[item.key],null,item.key+' out-of-contract amount');
  const other=entries.find(x=>x.id!==item.id);
  assert.ok(inspect(invalid)[other.key],other.key+' remains independent');
  if(item.id===100055001){
   assert.equal(B.applied({selected:[item.id],skills:invalid}).thirdEye,undefined);
  }
  if(item.id===330004001)
   assert.equal(B.applied({selected:[item.id],skills:invalid}).providence,undefined);
  if(item.id===320002001)
   assert.equal(B.applied({selected:[item.id],skills:invalid}).blessedRepose,undefined);
 }
});

test('all 28 jobs x Lv1–55: recipient-model preview is independent of caster class',()=>{
 let checked=0;
 const source=JSON.stringify(skills);
 const original=inspect(skills);
 for(const [job,klass] of Object.entries(classes))for(let level=1;level<=55;level++){
  assert.ok(klass.branchCaps);
  assert.deepEqual(inspect(skills),original,job+'/'+level);
  checked++;
 }
 assert.equal(checked,1540);
 assert.equal(JSON.stringify(skills),source);
});

test('Hero Book never pins old 20/15/90 text after the official catalog changes',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/const restKnown=Number\.isSafeInteger\(allyPreviews\.blessedRepose\?\.bonus\)/);
 assert.match(book,/allyPreviews\.massConcentration\.bonus/);
 assert.match(book,/allyPreviews\.divineBlessing\.bonus/);
 assert.match(book,/allyPreviews\.blessedRepose\.bonus/);
 assert.doesNotMatch(book,/const restKnown=osVector\(320002001/);
 assert.doesNotMatch(book,/Accuracy \+20 and \+15%/);
 assert.doesNotMatch(book,/Скорость восстановления ОМ союзников \+90 инд/);
});

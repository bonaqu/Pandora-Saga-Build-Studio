import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const host={};
Function('window',read('pandora-studio-remaked-buffs.js'))(host);
const B=host.PandoraRemakedBuffs;
const sourceIds=[260008001,260002001,213702001];
const context={skills,jobKey:'SNIPER',level:45,weapon:{kind:'CROSSBOW'},
 branchMasteries:{warding:41},branchCaps:classes.SNIPER.branchCaps,
 stats:{vit:50,str:48,agi:75,dex:64,int:35,spi:50}};
const get=(id,c=context)=>B.selfBuffSourcePreview({id,...c});

test('three official OS self-buffs share the real numeric apply gate with Book copy',()=>{
 const original=JSON.stringify(skills);
 const expected=[
  [260008001,100,'EP_AVOIDANCE_CONST','avoidance','dodge'],
  [260002001,30,'EP_MOVESPEED_SCALE','lightness','movement'],
  [213702001,30,'EP_ATTACKINTERVAL_SCALE','swiftArrow','attackSpeed']
 ];
 for(const [id,value,ep,resultKey,amountKey] of expected){
  assert.deepEqual(get(id),{id,amount:value,ep,
   source:'current OS FV1[3]',modelOnly:true,verified:false});
  assert.equal(get(id).amount,B.applied({...context,selected:[id]})[resultKey][amountKey]);
 }
 assert.equal(JSON.stringify(skills),original,'OS source records are immutable');
 assert.equal(get(999999001),null);
});

test('all supported source variants replay through both applied results and one Book model',()=>{
 for(const id of sourceIds){
  const modified=structuredClone(skills);
  const primary=modified[String(id)].funcs[0];
  const baseline=get(id).amount;
  primary.fv1[3]=baseline+7;
  assert.equal(get(id,{...context,skills:modified})?.amount,baseline+7);
  const copied=structuredClone(modified);
  copied[String(id)].funcs[0].fv2[3]=1;
  assert.equal(get(id,{...context,skills:copied}),null,
   'new FV2 cannot use an old number');
  const extra=structuredClone(modified);
  extra[String(id)].funcs.push({...extra[String(id)].funcs[0]});
  assert.equal(get(id,{...context,skills:extra}),null,
   'new extra game action fails closed');
  const unknown=structuredClone(modified);
  unknown[String(id)].funcs[0].fv1[2]=1;
  assert.equal(get(id,{...context,skills:unknown}),null,
   'unsupported mastery coefficient fails closed');
 }
 const alteredLost=structuredClone(skills);
 alteredLost['260008001'].funcs[1].fv1[3]=3;
 assert.equal(get(260008001,{...context,skills:alteredLost}),null);
 const alteredStop=structuredClone(skills);
 alteredStop['213702001'].funcs[1].ep='EP_UNKNOWN_FUTURE';
 assert.equal(get(213702001,{...context,skills:alteredStop}),null);
});

test('class, weapon, level, mastery gating and complete OS source contract fail closed',()=>{
 assert.equal(get(260008001,{...context,branchMasteries:{warding:40}}),null);
 assert.equal(get(260002001,{...context,jobKey:'WARRIOR',branchCaps:classes.WARRIOR.branchCaps}),null);
 assert.equal(get(260002001,{...context,level:11}),null);
 assert.equal(get(213702001,{...context,weapon:{kind:'BOW'}}),null);
 assert.equal(get(213702001,{...context,level:34}),null);
 for(const id of sourceIds){
  const snapshot=structuredClone(skills);
  snapshot[String(id)].reqs.push({branch:'warding',amount:3});
  assert.equal(get(id,{...context,skills:snapshot}),null);
 }
});

test('Hero Book never repeats static OS magnitudes in its player-visible self-buff summaries',()=>{
 const src=read('pandora-studio-hero-book.js');
 assert.match(src,/selfBuffSourcePreview\?\.\(\{/);
 assert.match(src,/heroJobKey,heroLevel,heroMasteries,heroBranchCaps,heroWeaponKind,heroHasShield,\s*\.\.\.copyOptions\}\);/);
 assert.match(src,/260008001:buffEffectText\(260008001\)/);
 assert.match(src,/260002001:buffEffectText\(260002001\)/);
 assert.match(src,/213702001:buffEffectText\(213702001\)/);
 assert.doesNotMatch(src,/260008001:english\?'Evasion \+100'/);
 assert.doesNotMatch(src,/213702001:\['Ускоряет стрельбу из арбалета на 30%/);
 assert.doesNotMatch(src,/260002001:\['Скорость передвижения \+30%/);
 assert.match(src,/Коэффициент OS для этого билда не рассчитан/);
});

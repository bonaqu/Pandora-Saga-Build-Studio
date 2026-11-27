import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const source=(id,mutate)=>{const copy={...skills,[id]:structuredClone(skills[id])};
 mutate(copy[id]);return copy};
const range=(catalog,id,rank=65,opts={})=>{
 const job=id===213605001?'SNIPER':'PREDATOR';
 return C.skillAttackRangePreview({skillCatalog:catalog,jobKey:job,
  level:id===213605001?45:50,
  branchMasteries:{archery:rank},branchCaps:classes[job].branchCaps,
  weapon:{slot:'weapon',kind:'CROSSBOW'},...opts});
};
const sniper=(catalog=skills,rank=65,opts={})=>{
 const preview=C.scalingSkillPreview({skillCatalog:catalog,jobKey:'SNIPER',
  level:55,branchMasteries:{archery:rank},branchCaps:classes.SNIPER.branchCaps,
  stats:{vit:50,str:70,agi:60,dex:55,spi:80,int:40},
  combat:{attack:{walkingBase:160},defense:{directRaw:80},
   accuracy:{base:100},dodge:{base:125}},
  weaponKind:'CROSSBOW',...opts});
 return preview.offense.find(row=>row.id===213605001);
};
const coeff=(row,ep)=>row?.coefficientModels?.find(x=>x.ep===ep);

test('current data has two distinct paired range/carry skills, not permanent range',()=>{
 assert.equal(Object.keys(classes).length,28);
 for(const id of [213605001,213703001]){
  const s=skills[id];
  const a=s.funcs.find(x=>x.ep==='EP_ATTACKRANGE_CONST');
  const b=s.funcs.find(x=>x.ep==='EP_ATTACKCARRY_CONST');
  assert.deepEqual(a.fv1,b.fv1);
  assert.deepEqual(a.fv2,b.fv2);
  assert.deepEqual(a.fv2,[0,0,0,0]);
  assert.deepEqual(range(skills,id).rejected,[]);
  assert.equal(range(skills,id).rows[0].sourceOnly,true);
  assert.equal(range(skills,id).rows[0].finalSkillRange,null);
  assert.equal(range(skills,id).appliedToPermanentRange,false);
 }
 assert.equal(range(skills,213605001).rows[0].sourceBonus,395);
 assert.equal(range(skills,213703001,55).rows[0].sourceBonus,595);
});

test('both mirrored FV1 range components update exactly once on supported changes',()=>{
 let checked=0;
 for(const id of [213605001,213703001])for(const [position,increment] of [
  [2,25],[3,40]
 ]){
  const next=source(id,s=>{
   for(const fx of s.funcs)if(['EP_ATTACKRANGE_CONST','EP_ATTACKCARRY_CONST']
    .includes(fx.ep))fx.fv1[position]+=increment;
  });
  const rank=id===213605001?65:55;
  const before=range(skills,id,rank).rows[0];
  const after=range(next,id,rank);
  assert.deepEqual(after.rejected,[]);
  assert.equal(after.rows.length,1);
  const a=next[id].funcs.find(x=>x.ep==='EP_ATTACKRANGE_CONST').fv1;
  assert.equal(after.rows[0].sourceBonus,a[3]+Math.floor(rank*a[2]/100));
  assert.equal(after.rows[0].finalSkillRange,null);
  assert.equal(after.rows[0].sourceMasteryPart,Math.floor(rank*a[2]/100));
  assert.ok(after.rows[0].sourceBonus>=before.sourceBonus);
  assert.equal(after.rows[0].available,true);
  checked++;
 }
 assert.equal(checked,4);
});

test('Sniper attack and accuracy models derive independent current FV1 channels',()=>{
 const original=sniper();
 assert.equal(original.amount,63);
 assert.equal(coeff(original,'EP_DAMAGERATE_SCALE')?.amount,39);
 assert.equal(coeff(original,'EP_TOHIT_CONST')?.amount,39);
 const attack=source(213605001,s=>{s.funcs[0].fv1[3]+=5});
 const modeled=sniper(attack);
 assert.equal(coeff(modeled,'EP_DAMAGERATE_SCALE')?.amount,44);
 assert.equal(modeled.amount,71);
 assert.equal(modeled.modelOnly,true);
 assert.equal(modeled.uncertain,true);
 const hit=source(213605001,s=>{s.funcs[1].fv1[2]+=5});
 const targeted=sniper(hit);
 assert.equal(coeff(targeted,'EP_TOHIT_CONST')?.amount,
  20+Math.floor(65*35/100));
 assert.equal(targeted.amount,original.amount,
  'An accuracy-only FV must not inflate the modeled physical attack');
});

test('new effects, control changes, unsupported FV1 and mismatched pairs fail closed',()=>{
 const mutations=[
  s=>{s.funcs.push(structuredClone(s.funcs[0]))},
  s=>{s.funcs[2].fv1[3]++},
  s=>{s.funcs[3].fv1[2]++},
  s=>{s.funcs[0].fv1[1]=7},
  s=>{s.funcs[0].fv1[2]=-1},
  s=>{s.funcs[1].fv1[3]=0.5},
  s=>{s.funcs[2].fv2[3]=5},
  s=>{s.funcs[4].fv1[3]=2},
  s=>{s.funcs[5].fv2[2]=0},
  s=>{s.funcs[0].dir='CASTER'},
  s=>{s.branchRaw='OTHER'},
  s=>{s.powerStat='STR'},
  s=>{s.reqLevel=10},
  s=>{s.weaponUse.push('UNKNOWN_WEAPON')}
 ];
 for(const mutate of mutations){
  const next=source(213605001,mutate);
  const out=range(next,213605001);
  assert.deepEqual(out.rows,[],mutate.toString());
  assert.deepEqual(out.rejected,[213605001],mutate.toString());
  assert.equal(sniper(next),undefined,mutate.toString());
 }
 const predatorCases=[
  s=>{s.funcs[2].fv1[3]++},
  s=>{s.funcs[0].fv1[3]++},
  s=>{s.funcs[1].fv2[2]=1},
  s=>{s.funcs[1].fv1[2]=2001},
  s=>{s.funcs[1].ep='EP_NEW_RANGE'},
  s=>{s.powerStat='DEX'}
 ];
 for(const mutate of predatorCases){
  const next=source(213703001,mutate);
  assert.deepEqual(range(next,213703001,55).rows,[],mutate.toString());
 }
});

test('class, level, cap and weapon gates still protect all range results',()=>{
 const a=range(skills,213605001,65,{level:44});
 assert.equal(a.rows[0].available,false);
 assert.equal(range(skills,213605001,65,{weapon:null}).rows[0].available,false);
 assert.deepEqual(C.skillAttackRangePreview({
  skillCatalog:skills,jobKey:'WARRIOR',level:55,
  branchMasteries:{archery:65},branchCaps:classes.WARRIOR.branchCaps,
  weapon:{slot:'weapon',kind:'CROSSBOW'}
 }).rows,[]);
 const high=range(skills,213703001,10000);
 assert.equal(high.rows[0].available,false);
 assert.equal(high.rows[0].sourceBonus,null);
 assert.equal(sniper(skills,65,{weaponKind:'BARE_HAND'})?.available,false);
});

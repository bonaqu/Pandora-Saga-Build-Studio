import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json')),classes=JSON.parse(read('data/os/classes.json')),host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const stats={vit:50,str:70,agi:60,dex:55,spi:80,int:45};
const combat={attack:{walkingBase:160},defense:{directRaw:80},accuracy:{base:100},dodge:{base:130}};
const mastery={slash:40,thrust:10,brush:20,blow:5,defense:10,blessing:50};
const source=(job,skillCatalog=skills,options={})=>{
 const result=C.scalingSkillPreview({skillCatalog,jobKey:job,level:45,
  branchMasteries:mastery,branchCaps:classes[job].branchCaps,
  stats,combat,hasShield:true,weaponKind:'1H_AXE',...options});
 return result.offense;
};
const find=(job,id,catalog=skills,opts={})=>source(job,catalog,opts).find(row=>row.id===id);
const change=(id,index,mutate)=>{const copy=structuredClone(skills);mutate(copy[id].funcs[index],copy[id]);return copy};

test('Despair uses exact OS three-effect root and total five-lane trained MELEE, not Slash',()=>{
 const sourceBefore=JSON.stringify(skills),combatBefore=JSON.stringify(combat);
 const row=find('JUGGERNAUT',100058001);
 assert.ok(row);
 assert.equal(row.modelOnly,true);
 assert.equal(row.uncertain,true);
 assert.equal(row.coefficientModels.length,1);
 // 40+10+20+5+10=85 green MELEE; OS current [0,0,35,40].
 assert.equal(row.coefficientModels[0].amount,40+Math.floor(85*.35));
 assert.equal(row.amount,Math.ceil(160*(40+Math.floor(85*.35))/100));
 assert.equal(row.available,true);
 const zero=find('JUGGERNAUT',100058001,skills,{
  branchMasteries:{slash:0,thrust:0,brush:0,blow:0,defense:0}});
 assert.equal(zero?.coefficientModels[0].amount,40);
 const mixed=find('JUGGERNAUT',100058001,skills,{
  branchMasteries:{slash:40,thrust:11,brush:20,blow:5,defense:10}});
 assert.equal(mixed?.coefficientModels[0].amount,70);
 const changed=change(100058001,0,e=>{e.fv1[2]=40;e.fv1[3]=45});
 const updated=find('JUGGERNAUT',100058001,changed);
 assert.equal(updated?.coefficientModels[0].amount,79);
 assert.equal(updated?.amount,127);
 assert.equal(JSON.stringify(skills),sourceBefore);
 assert.equal(JSON.stringify(combat),combatBefore);
});

test('Despair must reject changed side-effects, any FV2 or fake classes',()=>{
 const absent=()=>{
  for(const [index,fn] of [
   [0,e=>{e.fv1[0]=1}],[0,e=>{e.fv1[1]=5}],
   [0,e=>{e.fv2[0]=1}],[1,e=>{e.fv1[3]=99}],
   [1,e=>{e.dir='CASTER'}],[1,e=>{e.fv2[3]=1}],
   [2,e=>{e.fv1[3]=1}],[2,e=>{e.ep='EP_UNKNOWN'}]
  ]){
   assert.equal(find('JUGGERNAUT',100058001,change(100058001,index,fn)),undefined,
    'Reject unreviewed Despair root effect '+index);
  }
 };
 absent();
 const expanded=structuredClone(skills);
 expanded[100058001].funcs.push({ep:'EP_EXTRA',dir:'TARGET',
  fv1:[0,0,0,1],fv2:[0,0,0,0]});
 assert.equal(find('JUGGERNAUT',100058001,expanded),undefined);
 expanded[100058001].funcs.pop();
 expanded[100058001].classes.MAGE=1;
 assert.equal(find('JUGGERNAUT',100058001,expanded),undefined);
 const bad={...mastery,slash:999};
 assert.equal(find('JUGGERNAUT',100058001,skills,{branchMasteries:bad}),undefined);
});

test('all three Enchantment target FV1 channels replay from current OS and never apply to hero',()=>{
 const unchanged=JSON.stringify(skills);
 const row=find('ENCHANTER',320011001);
 assert.ok(row);assert.equal(row.amount,null);assert.equal(row.modelOnly,true);
 assert.equal(row.uncertain,true);
 assert.deepEqual(row.coefficientModels.map(x=>x.amount),[36,14,20]);
 assert.ok(row.coefficientModels.every(x=>x.confidence==='coefficient-model'));
 assert.match(row.detailRu,/не подтверждено/);
 const revised=change(320011001,0,e=>{e.fv1[0]=25;e.fv1[2]=30;e.fv1[3]=12});
 assert.deepEqual(find('ENCHANTER',320011001,revised)?.coefficientModels.map(x=>x.amount),[47,14,20]);
 const second=change(320011001,1,e=>{e.fv1[2]=15});
 assert.deepEqual(find('ENCHANTER',320011001,second)?.coefficientModels.map(x=>x.amount),[36,16,20]);
 const third=change(320011001,2,e=>{e.fv1[3]=12});
 assert.deepEqual(find('ENCHANTER',320011001,third)?.coefficientModels.map(x=>x.amount),[36,14,22]);
 assert.equal(JSON.stringify(skills),unchanged);
});
test('Enchantment rejects new mechanics and preserves class/access gate across 28 classes',()=>{
 for(const index of [0,1,2]){
  for(const fn of [
   e=>{e.dir='CASTER'},
   e=>{e.fv2[0]=1},
   e=>{e.fv1[1]=1},
   e=>{e.fv1[3]=-1}
  ])assert.equal(find('ENCHANTER',320011001,change(320011001,index,fn)),undefined);
 }
 const plus=structuredClone(skills);
 plus[320011001].funcs.push({ep:'EP_EXTRA',dir:'TARGET',fv1:[0,0,0,1],fv2:[0,0,0,0]});
 assert.equal(find('ENCHANTER',320011001,plus),undefined);
 for(const job of Object.keys(classes)){
  const rows=source(job);
  if(job==='ENCHANTER')assert.equal(rows.filter(row=>row.id===320011001).length,1);
  else assert.ok(!rows.some(row=>row.id===320011001),'No class leak: '+job);
  if(job!=='JUGGERNAUT')assert.ok(!rows.some(row=>row.id===100058001),'No Despair leak: '+job);
 }
 const low=find('ENCHANTER',320011001,skills,{level:1});
 assert.ok(low);assert.equal(low.available,false);
 assert.match(low.reasonEn,/Requires level 45/);
});

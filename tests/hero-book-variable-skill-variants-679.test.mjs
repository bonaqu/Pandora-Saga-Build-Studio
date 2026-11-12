import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const stats={vit:40,str:70,agi:60,dex:50,spi:65,int:60};
const combat={attack:{walkingBase:150},defense:{directRaw:80},accuracy:{base:95},dodge:{base:108}};
const rows=(jobKey,{level=50,mastery={},catalog=skills}={})=>
 C.scalingSkillPreview({skillCatalog:catalog,jobKey,level,stats,combat,
  branchMasteries:mastery,branchCaps:classes[jobKey].branchCaps});
const selected=(list,id)=>list.some(x=>x.id===id);

test('class-specific scaling skills appear with unknown magnitudes, not made-up damage',()=>{
 for(const [job,id] of [['JUGGERNAUT',100058001],
  ['PREDATOR',213703001],['ASSASSIN',233200101],
  ['WARLOCK',410000101]]){
  const result=rows(job);
  const item=result.offense.find(x=>x.id===id);
  assert.ok(item,job+' must contain the actual varying skill '+id);
  if(id===100058001){
   assert.ok(Number.isFinite(item.amount),'Desperation has a Remaked/OS estimate');
   assert.equal(item.modelOnly,true);
  }else assert.equal(item.amount,null,id+' final magnitude stays unknown');
  assert.equal(item.uncertain,true);
  assert.equal(selected(rows('WARRIOR').offense,id),false);
 }
 const locked=rows('PREDATOR',{level:49}).offense.find(x=>x.id===213703001);
 assert.equal(locked?.available,false,'theoretical preview retains its level requirement');
 assert.match(locked?.reason||'',/50/);
});

test('poison shows exactly one eligible green mastery variant and respects class caps',()=>{
 const novice=rows('PREDATOR',{level:45,mastery:{alchemy:12}}).offense;
 assert.equal(selected(novice,220001001),true);
 assert.equal(selected(novice,220001003),false);
 const advanced=rows('PREDATOR',{level:50,mastery:{alchemy:61}}).offense;
 assert.equal(selected(advanced,220001001),false);
 assert.equal(selected(advanced,220001003),true);
 assert.equal(selected(rows('WARRIOR',{mastery:{alchemy:61}}).offense,220001003),false);
});

test('Conjurer level 50 selects current OS shield and wind trail variants only',()=>{
 const before=rows('CONJURER',{level:49,mastery:{embody:35}}).defense;
 const after=rows('CONJURER',{level:50,mastery:{embody:35}}).defense;
 for(const [oldId,newId] of [[420002001,420002002],[420004001,420004002]]){
  assert.equal(selected(before,oldId),true);
  assert.equal(selected(before,newId),false);
  assert.equal(selected(after,oldId),false);
  const row=after.find(x=>x.id===newId);
  assert.equal(row?.amount,null);
  assert.equal(row?.available,true);
 }
});

test('tampered OS vectors hide relevant skill without weakening others',()=>{
 const altered=structuredClone(skills);
 altered['100058001'].funcs.find(x=>x.ep==='EP_DAMAGERATE_SCALE').fv1[2]=999;
 const original=rows('JUGGERNAUT').offense;
 const invalid=rows('JUGGERNAUT',{catalog:altered}).offense;
 assert.equal(selected(original,100058001),true);
 assert.equal(selected(invalid,100058001),false);
});

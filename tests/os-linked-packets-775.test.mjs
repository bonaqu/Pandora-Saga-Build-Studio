import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-studio-target-damage.js'))(host);
const D=host.PandoraOSTargetDamage;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const monsters=JSON.parse(read('data/os/monsters.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const itemForth=JSON.parse(read('data/os/itemForth.json'));
const unison=JSON.parse(read('data/os/unison.json'));
const english=JSON.parse(read('data/os/strings.en.json'));
const modifiers=rate=>({combat:{spellDamageEquipmentRate:rate,priestSong:{}},priestApplied:{}});
const fixture=(jobKey,masteries={},overrides={})=>({
 skillCatalog:skills,classes,jobKey,level:45,masteries,
 branchCaps:classes[jobKey].branchCaps,
 stats:{dex:70,int:80,spi:50},
 tables,itemForth,unison,equipment:[],modifiers:modifiers(0),...overrides
});
const calc=(job,masteries,overrides)=>D.supportedSkillHits(fixture(job,masteries,overrides));
const get=(hits,id)=>hits.find(x=>x.skillId===id);
const value=hit=>[hit?.min,hit?.average,hit?.max];
const specIds=[240002001,410014001,410014003,410022001,420007001,
 430001003,430052002,430053003,430056001];
test('Nine linked action paths are source-locked, one direct hit per current hero',()=>{
 assert.deepEqual(D.linkedSpells.slice(0,specIds.length).map(p=>p.id),specIds);
 const targets=[
  ['DISTURBANCE',{trap:60},240002001,[11,56,84],'physical'],
  ['WARLOCK',{element:70},410014001,[3,17,26],'cold'],
  ['WARLOCK',{element:90},410014003,[6,27,40],'cold'],
  ['WARLOCK',{element:70},410022001,[3,26,47],'lightning'],
  ['CONJURER',{embody:61},420007001,[6,27,34],'charm'],
  ['CALAMITY',{darkness:70},430001003,[10,52,75],'dark'],
  ['CALAMITY',{darkness:70},430052002,[1,5,9],'dark'],
  ['CALAMITY',{darkness:70},430053003,[4,21,32],'dark'],
  ['CALAMITY',{darkness:70},430056001,[6,27,34],'poison']
 ];
 for(const [job,masteries,id,triplet,element] of targets){
  const hit=get(calc(job,masteries),id);
  assert.deepEqual(value(hit),triplet,'OS hit for '+id);
  assert.equal(hit.hitKind,'direct-part');
  assert.equal(hit.element,element);
  assert.equal(hit.monsterId,22104);
  assert.equal(hit.heroInt,80);
  assert.equal(hit.heroMastery,masteries[skills[String(id)].branch]);
  assert.equal(english.skills[String(id)].n.length>0,true);
  assert.equal(monsters['22104'].resists[element],D.target.resists[element]);
 }
 assert.equal(get(calc('WARLOCK',{element:90}),410004001),undefined);
});
test('Linked payload path rejects changed root, child, status, prereq and damage vectors',()=>{
 for(const spec of D.linkedSpells.slice(0,specIds.length)){
  const root=spec.path[0];
  const job=spec.id===240002001?'DISTURBANCE':
   spec.id===420007001?'CONJURER':
   [430001003,430052002,430053003,430056001].includes(spec.id)?
   'CALAMITY':'WARLOCK';
  const branchMasteries=job==='DISTURBANCE'?{trap:60}:job==='CONJURER'?
   {embody:61}:job==='CALAMITY'?{darkness:70}:{element:90};
  assert.ok(get(calc(job,branchMasteries),root.id),'baseline '+root.id);
  for(const node of spec.path){
   const bad=structuredClone(skills),entry=bad[String(node.id)];
   entry.funcs[0].fv1[3]+=1;
   assert.equal(get(calc(job,branchMasteries,{skillCatalog:bad}),root.id),
    undefined,'mutation fails: '+node.id);
  }
  const wrong=structuredClone(skills);
  wrong[String(spec.path[1].id)].damage.slotIndex=99;
  assert.equal(get(calc(job,branchMasteries,{skillCatalog:wrong}),root.id),undefined);
  const brokenRoot=structuredClone(skills);
  brokenRoot[String(root.id)].prereq=123456;
  assert.equal(get(calc(job,branchMasteries,{skillCatalog:brokenRoot}),root.id),undefined);
 }
});
test('Eligibility: area variants at lv45 only for Calamity; over-cap skills hidden',()=>{
 const basic=calc('CALAMITY',{darkness:70},{level:44});
 assert.equal(get(basic,430001003),undefined);
 assert.equal(get(basic,430052002),undefined);
 assert.equal(get(basic,430053003),undefined);
 const advanced=calc('CALAMITY',{darkness:70},{level:45});
 for(const id of [430001003,430052002,430053003])
  assert.ok(get(advanced,id));
 const warlock=calc('WARLOCK',{darkness:70,element:55});
 for(const id of [430001003,430052002,430053003])
  assert.equal(get(warlock,id),undefined);
 assert.equal(get(calc('WARLOCK',{element:70}),410014003),undefined);
 assert.ok(get(calc('WARLOCK',{element:90}),410014003));
 assert.equal(get(calc('CONJURER',{embody:60}),420007001),undefined);
 assert.ok(get(calc('CONJURER',{embody:61}),420007001));
 assert.equal(get(calc('DISTURBANCE',{trap:25}),240002001),undefined);
 assert.ok(get(calc('DISTURBANCE',{trap:26}),240002001));
 assert.equal(get(calc('CALAMITY',{darkness:53}),430056001),undefined);
});
test('Physical trap uses OS NONE→physical 30% spread; poison uses -25% target resist',()=>{
 const trap=get(calc('DISTURBANCE',{trap:60}),240002001);
 const poison=get(calc('CALAMITY',{darkness:70}),430056001);
 assert.equal(trap.element,'physical');
 assert.equal(poison.element,'poison');
 assert.equal(D.target.resists.poison,-25);
 const poisonGear=[{record:{id:801101,slot:'weapon',effects:[
  {func:'EP_ELEMENT_DAMAGE_SCALE_POISON',a:90}]},
  issue:[],refinement:0,souls:[],gem:null}];
 const baseline=calc('CALAMITY',{darkness:70});
 const boosted=calc('CALAMITY',{darkness:70},{equipment:poisonGear});
 assert.ok(get(boosted,430056001).max>get(baseline,430056001).max);
 assert.equal(get(boosted,430053003).max,get(baseline,430053003).max);
 assert.deepEqual(D.equippedElementalEffects({equipment:poisonGear,itemForth,unison}),
  {general:0,fire:0,penetration:0,poison:90});
 const invalid=calc('CALAMITY',{darkness:70},{modifiers:modifiers(50)});
 assert.deepEqual(invalid,[]);
});
test('One Book row per upgraded skill: no duplicate name or invented status-tick total',()=>{
 const book=read('pandora-studio-hero-book.js');
 for(const id of specIds)assert.match(book,new RegExp(String(id)));
 assert.match(book,/const upgradedRoots=new Set/);
 assert.match(book,/relevantBase=groupName/);
 assert.match(book,/relevantHits=groupName/);
 assert.match(book,/прямой удар/);
 assert.doesNotMatch(book,/stage-material-actions|function materialSkillResults\(/);
 const effects=calc('CALAMITY',{darkness:70});
 for(const [base,upgrade] of [[430001001,430001003],
  [430052001,430052002],[430053001,430053003]]){
  assert.ok(get(effects,base));
  assert.ok(get(effects,upgrade));
  assert.equal(skills[String(upgrade)].prereq,base);
  assert.deepEqual(value(get(effects,base)),value(get(effects,upgrade)),
   'Upgraded area skill keeps one per-target packet; area count is not multiplied');
 }
 assert.equal(get(effects,410004001),undefined);
});

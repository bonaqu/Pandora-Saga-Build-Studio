import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-studio-remaked-buffs.js'))(host);
Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator,B=host.PandoraRemakedBuffs;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const zero={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const source={classData:classes.MAGE,
 raceData:{vit:40,str:50,agi:30,dex:20,spi:70,int:15},
 jobData:zero,allocation:zero,level:45};
const hero=attrs=>C.base({...source,attributeBuffs:attrs||{},
 combatContext:{jobKey:'MAGE',skillCatalog:skills,branchMasteries:{},
  weapon:{id:1001,kind:'1H_SWORD',W:90},weaponGrade:0}});
const toggle=id=>({remakedSkillIds:[id]});

test('allied recipient preview derives attack, accuracy and evasion from THIS hero',()=>{
 const c=hero().combat,values=C.alliedRecipientPreviews({skillCatalog:skills,combat:c});
 assert.ok(c.attack.walkingBase>0);
 assert.deepEqual(values.warCry,{
  base:c.attack.walkingBase,bonus:10+Math.floor(c.attack.walkingBase*.20)});
 assert.deepEqual(values.massConcentration,{
  base:c.accuracy.base,bonus:Math.floor(20+c.accuracy.base*.15)});
 assert.deepEqual(values.windAssist,{
  base:c.dodge.base,bonus:Math.floor(15+c.dodge.base*.15)});
 assert.equal(values.windBlessing.bonus,40);
 assert.equal(values.divineBlessing.bonus,25);
 assert.equal(values.blessedRepose.bonus,90);
});

test('a MAGE can receive War Cry and wind buffs without learning allied masteries',()=>{
 const base=hero(),cry=hero({combatWarCry:true});
 assert.equal(cry.combat.attack.known-base.combat.attack.known,
  10+Math.floor(base.combat.attack.walkingBase*.20));
 const assist=hero({combatWindAssist:true});
 assert.equal(assist.combat.dodge.known-base.combat.dodge.known,
  Math.floor(15+base.combat.dodge.base*.15));
 const wind=hero({combatWindBlessing:true});
 assert.equal(wind.combat.movementSpeed.known-base.combat.movementSpeed.known,40);
});

test('other independently toggled allies add accuracy and MP recovery once',()=>{
 const base=hero(),group=hero(toggle(100055001));
 const expected=Math.floor(20+base.combat.accuracy.base*.15);
 assert.equal(group.combat.accuracy.known-base.combat.accuracy.known,expected);
 const rest=hero(toggle(320002001));
 assert.equal(rest.regeneration.mp.total-base.regeneration.mp.total,90);
 assert.equal(rest.regeneration.hp.total,base.regeneration.hp.total);
 assert.deepEqual(B.applied({selected:[330004001],skills}).providence,{magic:25});
});

test('Inspiration selection changes received cast-time percentage, not the caster skill tree',()=>{
 const base=hero(),buff=hero(toggle(320006001));
 assert.equal(base.combat.castTime.known,100);
 assert.equal(buff.combat.castTime.known,50);
 assert.equal(buff.combat.castTime.allyReduction,50);
 assert.deepEqual(buff.stats,base.stats);
 assert.equal(buff.combat.castingSpeed.known,base.combat.castingSpeed.known);
 const corrupted=structuredClone(skills);
 corrupted['320006001'].funcs[1].fv2[0]=1;
 assert.equal(C.alliedInspirationPreview({skillCatalog:corrupted}),null);
 const bad=C.base({...source,attributeBuffs:toggle(320006001),
  combatContext:{jobKey:'MAGE',skillCatalog:corrupted,branchMasteries:{}}});
 assert.equal(bad.combat.castTime.known,100);
});

test('Natural Recovery uses hypothetical caster level and is not standing MP regeneration',()=>{
 const values=[
  [20,2],[21,2],[29,2],[30,3],[45,4],[49,4],[50,5],[55,5]
 ];
 for(const [level,mp] of values){
  const r=C.alliedNaturalRecoveryPreview({skillCatalog:skills,casterLevel:level});
  assert.equal(r?.mpPerPulse,mp);
  assert.equal(r?.intervalSourceValue,2);
 }
 for(const level of [1,19,56,20.5])assert.equal(
  C.alliedNaturalRecoveryPreview({skillCatalog:skills,casterLevel:level}),null);
 const base=hero(),selected=hero({...toggle(330005001),allyNaturalLevel:30});
 assert.equal(base.allyNaturalRecovery,null);
 assert.equal(selected.allyNaturalRecovery.mpPerPulse,3);
 assert.equal(selected.regeneration.mp.total,base.regeneration.mp.total);
 assert.equal(selected.mp,base.mp);
 const corrupt=structuredClone(skills);
 corrupt['330005001'].funcs[0].fv1[1]=11;
 assert.equal(C.alliedNaturalRecoveryPreview({skillCatalog:corrupt,casterLevel:45}),null);
});

test('unknown OS secondary vectors never silently alter allied recipient effects',()=>{
 const changed=structuredClone(skills);
 changed['100055001'].funcs[1].fv2[0]=1;
 assert.equal(B.applied({selected:[100055001],skills:changed}).thirdEye,undefined);
 assert.equal(C.alliedRecipientPreviews({skillCatalog:changed,combat:hero().combat})
  .massConcentration,null);
 const other=structuredClone(skills);
 other['330004001'].funcs[0].fv2[3]=1;
 assert.equal(B.applied({selected:[330004001],skills:other}).providence,undefined);
 const winds=structuredClone(skills);
 winds['260006001'].funcs[0].fv2[3]=1;
 assert.equal(C.supportSkillSource(winds,'windAssist'),null);
 assert.equal(C.supportSkillAvailability({
  selected:{combatWindAssist:true},skillCatalog:winds,jobKey:'MAGE',level:45})
  .windAssist,false);
 const cry=structuredClone(skills);
 cry['320001001'].funcs[1].fv2[1]=1;
 assert.equal(C.combatSkillSource(cry,'warCry'),null);
 assert.equal(C.activeCombatSkills({selected:{combatWarCry:true},
  skillCatalog:cry,jobKey:'MAGE',level:45}).warCry,false);
});

test('Book counts selected buff checkboxes, not stored allied caster fields',()=>{
 const book=read('pandora-studio-hero-book.js');
 const from=book.indexOf(' const guildSelected=Number(buffs.guildLevel)>0;');
 const to=book.indexOf(' const status=make(',from);
 assert.ok(from>=0&&to>from);
 const count=Function('buffs','vitalsBuffs','remakedBuffRows',
  book.slice(from,to)+'\nreturn configured;');
 const profile={priestEnabled:true,priestClass:'ENCHANTER',priestSpi:134,
  priestBlessing:90,priestHymn:30,priestExorcism:26,
  allyPeaceSpi:134,allyPeaceHymn:30,allyNaturalLevel:45};
 assert.equal(count(profile,{},[]),0);
 assert.equal(count({...profile,remakedSkillIds:[330005001]}, {},
  [{id:330005001,selected:true,existing:false,available:true}]),1);
 assert.equal(count({...profile,remakedSkillIds:[330005001],allyNaturalLevel:55}, {},
  [{id:330005001,selected:true,existing:false,available:true}]),1);
 assert.match(book,/data-book-setting':'allyNaturalLevel'/);
 assert.match(book,/alliedRecipientPreviews\?\.\(/);
 assert.match(book,/allyNaturalRecovery/);
});

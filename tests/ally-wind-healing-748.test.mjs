import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-studio-remaked-buffs.js'))(host);
Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const zero={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const source={classData:classes.MAGE,
 raceData:{vit:40,str:50,agi:30,dex:20,spi:70,int:15},
 jobData:zero,allocation:zero,level:45};
const hero=(buffs={},customSkills=skills,customClasses=classes)=>C.base({
 ...source,attributeBuffs:buffs,
 combatContext:{jobKey:'MAGE',skillCatalog:customSkills,
  allyClasses:customClasses,branchMasteries:{}}});

test('Free Wind: the 200-point temporary buff can be cast by SNIPER, not the receiving mage',()=>{
 const skill=skills['260010001'];
 assert.equal(skill.name,'Вольный ветер');
 assert.deepEqual(skill.reqs,[{branch:'warding',amount:66}]);
 assert.equal(classes.SNIPER.branchCaps.warding,90);
 const applicable=Object.keys(classes).filter(job=>
  skill.classes?.[job]===1&&
  skill.reqs.every(req=>classes[job].branchCaps?.[req.branch]>=req.amount));
 assert.deepEqual(applicable,['SNIPER']);
 const effect=C.alliedFreeWindPreview({skillCatalog:skills,classCatalog:classes});
 assert.equal(effect?.bonus,200);
 assert.equal(effect?.endsOnMapChange,true);
 const without=hero(),withWind=hero({combatFreeWind:true});
 assert.equal(withWind.combat.movementSpeed.freeWind,200);
 assert.equal(withWind.combat.movementSpeed.known-without.combat.movementSpeed.known,200);
 assert.deepEqual(withWind.stats,without.stats);
});

test('Free Wind + Wind Blessing present separate bonuses without guessing joint stacking',()=>{
 const withBoth=hero({combatFreeWind:true,combatWindBlessing:true});
 assert.equal(withBoth.combat.movementSpeed.active,40);
 assert.equal(withBoth.combat.movementSpeed.freeWind,200);
 assert.equal(withBoth.combat.movementSpeed.unknownStacking,true);
 assert.equal(withBoth.combat.movementSpeed.known,null);
 assert.equal(withBoth.combat.movementSpeed.town,null);
 assert.equal(hero({combatWindBlessing:true}).combat.movementSpeed.known,
  hero().combat.movementSpeed.known+40);
});

test('Free Wind source guard rejects moved, extended and rank-inaccessible variants',()=>{
 const changed=structuredClone(skills);
 changed['260010001'].funcs[1].fv2[3]=1;
 assert.equal(C.alliedFreeWindPreview({skillCatalog:changed,classCatalog:classes}),null);
 assert.equal(hero({combatFreeWind:true},changed).combat.movementSpeed.freeWind,0);
 const extra=structuredClone(skills);
 extra['260010001'].funcs.push(extra['260010001'].funcs[0]);
 assert.equal(C.alliedFreeWindPreview({skillCatalog:extra,classCatalog:classes}),null);
 const below=structuredClone(classes);
 below.SNIPER.branchCaps.warding=65;
 assert.equal(C.alliedFreeWindPreview({skillCatalog:skills,classCatalog:below}),null);
 assert.equal(hero({combatFreeWind:true},skills,below).combat.movementSpeed.freeWind,0);
});

test('Allied CLERIC Regeneration and Restoration use only source values and caster inputs',()=>{
 const preview=C.alliedHpPulsePreview({skillCatalog:skills,classCatalog:classes,
  casterLevel:45,casterSpi:134,casterHealing:41});
 assert.equal(preview.regeneration?.hpPerPulse,31);
 assert.equal(preview.restoration?.hpPerPulse,35);
 assert.equal(preview.regeneration?.required,21);
 assert.equal(preview.restoration?.required,41);
 assert.equal(preview.restoration?.intervalSourceValue,2);
 const low=C.alliedHpPulsePreview({skillCatalog:skills,classCatalog:classes,
  casterLevel:45,casterSpi:134,casterHealing:21});
 assert.equal(low.regeneration?.hpPerPulse,29);
 assert.equal(low.restoration,undefined);
 const max=C.alliedHpPulsePreview({skillCatalog:skills,classCatalog:classes,
  casterLevel:55,casterSpi:134,casterHealing:90});
 assert.equal(max.regeneration?.hpPerPulse,37);
 assert.equal(max.restoration?.hpPerPulse,37);
 const over=C.alliedHpPulsePreview({skillCatalog:skills,classCatalog:classes,
  casterLevel:45,casterSpi:134,casterHealing:91});
 assert.equal(over,null);
});

test('Legacy allied-healing settings no longer affect the current hero',()=>{
 const baseline=hero();
 const historic=hero({allyRegeneration:true,allyRestoration:true,
  allyHealingLevel:45,allyHealingSpi:134,allyHealingMastery:41});
 assert.deepEqual(historic.allyHealing,{regeneration:null,restoration:null});
 assert.equal(historic.hp,baseline.hp);
 assert.equal(historic.regeneration.hp.total,baseline.regeneration.hp.total);
 assert.deepEqual(historic.stats,baseline.stats);
 assert.deepEqual(historic.periodicRecovery,baseline.periodicRecovery);
});

test('HP source perturbations fail closed, including interval and all 4 FV1 slots',()=>{
 const changed=structuredClone(skills);
 changed['310002001'].funcs[0].fv2[3]=3;
 const after=C.alliedHpPulsePreview({
  skillCatalog:changed,classCatalog:classes,casterLevel:45,casterSpi:134,
  casterHealing:41});
 assert.equal(after.regeneration,undefined);
 assert.equal(after.restoration.hpPerPulse,35);
 const other=structuredClone(skills);
 other['310022001'].funcs[0].fv1[2]=7;
 const missing=C.alliedHpPulsePreview({
  skillCatalog:other,classCatalog:classes,casterLevel:45,casterSpi:134,
  casterHealing:41});
 assert.equal(missing.restoration,undefined);
 assert.equal(missing.regeneration.hpPerPulse,31);
});

test('Hero Book renders self-healing but not ally healing controls',()=>{
 const book=read('pandora-studio-hero-book.js');
 const app=read('pandora-studio-app.js');
 assert.doesNotMatch(book,/stage-ally-hp-fields/);
 assert.doesNotMatch(book,/Регенерация от союзника/);
 assert.match(book,/const healingRows=\[...spells,...periodicHeals\]/);
 assert.match(book,/!directIds.has\(row.id\)/);
 assert.match(book,/combatFreeWind/);
 assert.match(app,/allyHealingLevel/);
 const start=book.indexOf(' const guildSelected=Number(buffs.guildLevel)>0;');
 const stop=book.indexOf(' const status=make(',start);
 assert.ok(start>=0&&stop>start);
 const count=Function('buffs','vitalsBuffs','remakedBuffRows',
  book.slice(start,stop)+'\nreturn configured;');
 assert.equal(count({allyRegeneration:true,allyRestoration:true,
  allyHealingLevel:45,allyHealingSpi:134,allyHealingMastery:41}, {},[]),0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const Ctx={};Function('window',read('pandora-os-character-calculator.js'))(Ctx);
const C=Ctx.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const races=JSON.parse(read('data/os/racialPassives.json'));
const items=JSON.parse(read('data/os/items.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const stats={vit:40,str:50,agi:70,dex:35,spi:30,int:50};
const concrete=(id,weapon)=>C.racialWeaponPreview({racialPassiveId:id,
 skillCatalog:skills,weapon});
const testCatalog=[
 {id:900010001,race:'HUMAN',kind:'oneHanded',flat:10,percent:12,
  matches:[21,601,1001,1801],misses:[401,801,2201]},
 {id:900030002,race:'DWARF',kind:'axeBlunt',flat:10,percent:12,
  matches:[601,801,1001,1201],misses:[21,401,2201]},
 {id:900050002,race:'ENKIDU',kind:'twoHanded',flat:0,percent:12,
  matches:[401,801,1201,2201],misses:[21,601,1001]}
];

test('three racial weapon skills use the correct OS source IDs, TARGET fv1/fv2 and race ownership',()=>{
 for(const spec of testCatalog){
  const skill=skills[String(spec.id)];
  assert.ok(races[spec.race].skills.includes(spec.id),spec.race);
  assert.equal(skill.id,spec.id);
  assert.equal(skill.skillType,'PASSIVE');
  const effects=skill.funcs.filter(f=>f.ep==='EP_SKILL_EQUIP_DAMAGERATE'&&f.dir==='TARGET');
  assert.equal(effects.length,1);
  assert.equal(effects[0].fv1[3],spec.flat);
  assert.equal(effects[0].fv2[3],spec.percent);
  const result=concrete(spec.id,items[spec.matches[0]]);
  assert.deepEqual([result.id,result.kind,result.flat,result.percent],
   [spec.id,spec.kind,spec.flat,spec.percent]);
  assert.equal(result.matchesCategory,true);
  assert.equal(result.verified,false);
 }
});

test('one-handed, axe/blunt and two-handed source categories remain distinct',()=>{
 for(const spec of testCatalog){
  for(const id of spec.matches)
   assert.equal(concrete(spec.id,items[id]).matchesCategory,true,
    spec.race+' compatible '+id);
  for(const id of spec.misses)
   assert.equal(concrete(spec.id,items[id]).matchesCategory,false,
    spec.race+' incompatible '+id);
  assert.equal(concrete(spec.id,null).matchesCategory,null);
  assert.equal(concrete(spec.id,{slot:'weapon',kind:'BOW',twoHanded:null}).matchesCategory,null);
  assert.equal(concrete(spec.id,{slot:'shield',kind:'BOW',twoHanded:true}).matchesCategory,null);
 }
});

test('source-backed racial weapon bonuses contribute to final ATK only for matching weapons',()=>{
 for(const spec of testCatalog){
  const weapon=items[spec.matches[0]],opts={stats,level:40,
   weapon,jobKey:'WARRIOR',skillCatalog:skills};
  const before=C.combatPreview(opts),after=C.combatPreview({...opts,racialPassiveId:spec.id});
  assert.ok(after.racialWeapon);
  assert.equal(after.racialWeapon.flat,spec.flat);
  assert.equal(after.racialWeapon.percent,spec.percent);
  const expected=spec.flat+Math.ceil(before.attack.raw*spec.percent/100);
  assert.equal(after.attack.racialBonus,expected);
  assert.equal(after.attack.known,before.attack.known+expected,
   'Matching passive changes final ATK using the Legacy per-bonus ceiling');
  const wrong=C.combatPreview({...opts,weapon:items[spec.misses[0]],racialPassiveId:spec.id});
  const wrongBase=C.combatPreview({...opts,weapon:items[spec.misses[0]]});
  assert.equal(wrong.attack.known,wrongBase.attack.known,
   'Incompatible weapon must not receive the racial bonus');
  assert.equal(after.attackSpeed.known,before.attackSpeed.known);
  const entry=C.base({classData:classes.WARRIOR,
   raceData:tables.raceInit[spec.race],jobData:tables.jobInit.WARRIOR,
   allocation:{vit:0,str:0,agi:0,dex:0,spi:0,int:0},level:20,
   combatContext:{weapon,jobKey:'WARRIOR',skillCatalog:skills},
   potionContext:{racialPassiveId:spec.id}});
  assert.equal(entry.combat.racialWeapon.id,spec.id);
  assert.equal(entry.combat.racialWeapon.matchesCategory,true);
 }
});

test('Enkidu Dragoon Strong arms raises attack for a two-handed spear',()=>{
 const spear=items[2201],opts={stats,level:45,jobKey:'DRAGOON',
  weapon:spear,skillCatalog:skills,weaponPlus:tables.weaponPlus,weaponGrade:3};
 assert.equal(spear.twoHanded,true);
 const none=C.combatPreview(opts);
 const strong=C.combatPreview({...opts,racialPassiveId:900050002});
 assert.equal(strong.racialWeapon.matchesCategory,true);
 const expected=Math.ceil(none.attack.raw*12/100);
 assert.equal(strong.attack.racialBonus,expected);
 assert.equal(strong.attack.known,none.attack.known+expected);
 assert.equal(C.combatPreview({...opts,racialPassiveId:900050003}).attack.known,
  none.attack.known,'Changing Enkidu passive must remove the attack bonus');
 const oneHand=items[21],oneOpts={...opts,weapon:oneHand,weaponGrade:0};
 assert.equal(C.combatPreview({...oneOpts,racialPassiveId:900050002}).attack.known,
  C.combatPreview(oneOpts).attack.known,'No bonus on incompatible weapon');
});

test('racial passives require exact server weaponUse, not all two-handed weapons',()=>{
 const bogus={slot:'weapon',kind:'UNLISTED_TWO_HANDED',twoHanded:true,W:80};
 assert.equal(concrete(900050002,bogus).matchesCategory,false);
 assert.equal(concrete(900050002,items[1483]).matchesCategory,true,
  'Verified +8 Zephyr spear is a POLE_ARM allowed by Strong arms');
 assert.equal(concrete(900010001,items[1483]).matchesCategory,false);
 const changed=structuredClone(skills[900050002]);
 changed.weaponUse=['2H_SWORD'];
 assert.equal(C.racialWeaponPreview({racialPassiveId:900050002,
  skillCatalog:{...skills,[changed.id]:changed},weapon:items[1483]}).matchesCategory,false);
 const damaged=structuredClone(skills[900050002]);
 delete damaged.weaponUse;
 assert.equal(C.racialWeaponPreview({racialPassiveId:900050002,
  skillCatalog:{...skills,[damaged.id]:damaged},weapon:items[1483]}),null);
});

test('missing and damaged OS skill source never creates a guessed weapon bonus',()=>{
 assert.equal(concrete(900040001,items[21]),null);
 assert.equal(C.racialWeaponPreview({racialPassiveId:900010001}),null);
 for(const spec of testCatalog){
  const skill=structuredClone(skills[spec.id]);
  const row=skill.funcs.find(f=>f.ep==='EP_SKILL_EQUIP_DAMAGERATE');
  row.fv1[3]=null;
  assert.equal(C.racialWeaponPreview({racialPassiveId:spec.id,
   skillCatalog:{...skills,[spec.id]:skill},weapon:items[spec.matches[0]]}),null);
  const duplicate=structuredClone(skills[spec.id]);
  duplicate.funcs.push({...duplicate.funcs[0]});
  assert.equal(C.racialWeaponPreview({racialPassiveId:spec.id,
   skillCatalog:{...skills,[spec.id]:duplicate}}),null);
 }
});

test('Hero Book labels racial values as source preview, not completed attack totals',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.doesNotMatch(book,/if\(cm\.racialWeapon\)/);
 assert.match(book,/row\('АТК','ATK',c.attack\?\.known,'',clientAttack\)/);
 assert.ok(concrete(900010001,items[21]));
 assert.equal(concrete(900010001,items[21]).verified,false);
 assert.match(book,/function attackChapterGroups\(calc\)/);
 assert.equal(concrete(900010001,items[401]).matchesCategory,false);
});

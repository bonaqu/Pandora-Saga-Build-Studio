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

test('racial source numbers are available through combat/base without contaminating final ATK',()=>{
 for(const spec of testCatalog){
  const weapon=items[spec.matches[0]],opts={stats,level:40,
   weapon,jobKey:'WARRIOR',skillCatalog:skills};
  const before=C.combatPreview(opts),after=C.combatPreview({...opts,racialPassiveId:spec.id});
  assert.ok(after.racialWeapon);
  assert.equal(after.racialWeapon.flat,spec.flat);
  assert.equal(after.racialWeapon.percent,spec.percent);
  assert.equal(after.attack.known,before.attack.known,
   'weapon bonus has no validated server ATK stacking formula yet');
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
 assert.match(book,/row\('АТК','ATK',c.attack\?\.known\)/);
 assert.ok(concrete(900010001,items[21]));
 assert.equal(concrete(900010001,items[21]).verified,false);
 assert.match(book,/function attackChapterGroups\(calc\)/);
 assert.equal(concrete(900010001,items[401]).matchesCategory,false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const scope={};Function('window','document',read('pandora-studio-hero-book.js'))(
 scope,{documentElement:{lang:'ru'}});
const book=scope.PandoraStageAttributes,calcHost={};
Function('window',read('pandora-os-character-calculator.js'))(calcHost);
const C=calcHost.PandoraOSCalculator;
const items=JSON.parse(read('data/os/items.json'));
const skills=JSON.parse(read('data/os/skills.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const blank={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const character=(raceKey,passiveId,weapon=null)=>C.base({
 classData:classes.WARRIOR,raceData:tables.raceInit[raceKey],
 jobData:tables.jobInit.WARRIOR,allocation:blank,level:45,
 potionContext:{racialPassiveId:passiveId},
 combatContext:{jobKey:'WARRIOR',weapon,skillCatalog:skills}
});
const flatten=groups=>groups.flatMap(group=>group.rows);
test('Modern 43 totals live only in Results; attack/defense use independent keys',()=>{
 const hero=character('ELF',900020002,items[21]);assert.ok(hero);
 const results=book.summaryRows(hero).flatMap(g=>g.rows);
 const offense=flatten(book.attackChapterGroups(hero));
 const defense=flatten(book.defenseChapterGroups(hero));
 assert.equal(results.length,43,'preserve exact 43-field Set.Status matrix');
 assert.equal(new Set(results.map(r=>r.ru)).size,43);
 assert.ok(offense.length>0&&defense.length>0);
 assert.ok(offense.every(r=>!results.some(t=>t.ru===r.ru)));
 assert.ok(defense.every(r=>!results.some(t=>t.ru===r.ru)));
 assert.equal(new Set([...offense,...defense].map(r=>r.key)).size,offense.length+defense.length);
 assert.equal(offense.some(r=>r.value===hero.combat.attack.known&&r.key==='attack'),false);
 assert.ok(defense.some(r=>r.key==='hpRecoveryAmount'&&
  r.value===hero.recoveryAmount.hp.known));
 assert.ok(defense.some(r=>r.key==='resistStatus:stun'));
});
test('race/weapon effects move to Attack once, and incompatible weapon does not activate them',()=>{
 const hero=character('HUMAN',900010001,items[21]);
 assert.equal(hero.combat.racialWeapon.matchesCategory,true);
 const rows=flatten(book.attackChapterGroups(hero));
 assert.deepEqual(rows.filter(r=>r.key.startsWith('racialWeapon')).map(r=>[r.value,r.unit]),
  [[hero.combat.racialWeapon.flat,''],
   [hero.combat.attack.racialBonus-hero.combat.racialWeapon.flat,'']]);
 assert.equal(flatten(book.defenseChapterGroups(hero))
  .filter(r=>r.key.startsWith('racialWeapon')).length,0);
 const incorrect=character('HUMAN',900010001,items[401]);
 assert.equal(incorrect.combat.racialWeapon.matchesCategory,false);
 assert.equal(flatten(book.attackChapterGroups(incorrect))
  .filter(r=>r.key.startsWith('racialWeapon')).length,0);
});
test('Elf RANGE/CARRY is one bow/crossbow bonus, not a melee bonus',()=>{
 const melee=character('ELF',900020002,items[21]);
 assert.equal(melee.attackRange.racialGeneral,500);
 assert.equal(melee.attackRange.racialCarry,500);
 assert.equal(melee.attackRange.racialRanged,0);
 assert.deepEqual(flatten(book.attackChapterGroups(melee))
  .filter(x=>x.key==='racialRange'),[]);
 assert.equal(book.summaryRows(melee)[1].rows.find(x=>x.ru==='Дальн. АТК ближ. боя').value,
  melee.attackRange.totalMelee);
 const ranged=character('ELF',900020002,items[2402]);
 assert.equal(ranged.attackRange.baseRanged,1250);
 assert.equal(ranged.attackRange.totalRanged,1750);
 assert.deepEqual(flatten(book.attackChapterGroups(ranged))
  .filter(x=>x.key==='racialRange').map(x=>x.value),[500]);
 assert.equal(book.summaryRows(ranged)[1].rows.find(x=>x.ru==='Дальн. АТК дальн. боя').value,
  ranged.attackRange.totalRanged);
 const noRace=character('ELF',null,items[2402]);
 assert.equal(noRace.attackRange.totalRanged,1250);
 assert.equal(flatten(book.attackChapterGroups(noRace))
  .filter(x=>x.key==='racialRange').length,0);
});
test('auras, elemental magic and status chances have one offense owner',()=>{
 const hero=character('ELF',null,items[21]);
 const input={...hero,auraDamage:{elements:{fire:{known:11},ice:{known:0}}},
  elementalMagic:{fire:5,ice:0},gemstones:{magic:{fire:13},status:{fire:7}},
  elementalRefinement:{entries:[{itemId:1862,grade:7,element:'fire',rate:8}]},
  combat:{...hero.combat,secondary:{outgoingDebuffDuration:10,debuffSuccess:4}}};
 const attack=flatten(book.attackChapterGroups(input));
 const defense=flatten(book.defenseChapterGroups(input));
 for(const key of ['aura:fire','magicHonor:fire','magicGem:fire',
  'magicRefinement:1862:7','statusChance:fire','debuffDuration','debuffSuccess'])
  assert.equal(attack.filter(x=>x.key===key).length,1,key);
 assert.equal(attack.filter(x=>x.key==='aura:ice').length,0);
 assert.ok(!defense.some(x=>x.key.startsWith('aura:')||x.key.startsWith('magic')));
});
test('defense separates natural regeneration and status resistance from summary totals',()=>{
 const hero=character('ELF',null);
 const defense=flatten(book.defenseChapterGroups(hero));
 const byKey=new Map(defense.map(row=>[row.key,row.value]));
 assert.equal(byKey.get('hpRecoverySpeed'),hero.regeneration.hp.total);
 assert.equal(byKey.get('mpRecoverySpeed'),hero.regeneration.mp.total);
 assert.equal(byKey.get('hpRecoveryAmount'),hero.recoveryAmount.hp.known);
 assert.equal(byKey.get('mpRecoveryAmount'),hero.recoveryAmount.mp.known);
 for(const key of ['stun','numb','tumble','sleep'])
  assert.equal(byKey.get('resistStatus:'+key),hero.resistances.status[key]);
});
test('UI route owns every source of information once; no mirrored result panels',()=>{
 const source=read('pandora-studio-hero-book.js'),css=read('pandora-studio-theme.css');
 assert.match(source,/if\(chosen==='summary'\)summaryPage\(body,modifiers,copyOptions\)/);
 assert.doesNotMatch(source,/mountedBookNotice\(/);
 assert.match(source,/if\(chosen==='attack'\)attackPage\(/);
 assert.match(source,/if\(chosen==='defense'\)defensePage\(/);
 assert.match(source,/if\(chosen==='effects'\)skillEffectsPage\(body,\{modifiers,gameTerms,skillIconForId,/);
 assert.doesNotMatch(source,/stage-combat-quick|independentEffectRows|stage-equipped-items/);
 assert.doesNotMatch(source,/Базовая атака '\+\(rec\.W|Базовая защита '\+\(rec\.AC/);
 assert.doesNotMatch(source,/appendVitalFormulas|appendCombatFormulas/);
 assert.match(css,/\.stage-chapter-entry/);
 assert.match(css,/\.stage-result-section-head/);
});

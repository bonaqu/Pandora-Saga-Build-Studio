import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const racial=JSON.parse(read('data/os/racialPassives.json'));
const cls=JSON.parse(read('data/os/classes.json'));
const root={};
Function('window',read('pandora-os-character-calculator.js'))(root);
const calc=root.PandoraOSCalculator;
const stats={vit:35,str:50,agi:70,dex:35,spi:40,int:30};
const zero={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const result=(id,honorTitle=0)=>calc.combatPreview({
 stats,level:45,jobKey:'WARRIOR',racialPassiveId:id,honorTitle
});
const byId=id=>skills[String(id)];
const target=(id,ep)=>{
 const skill=byId(id);
 assert.ok(skill&&skill.skillType==='PASSIVE',String(id));
 const rows=skill.funcs.filter(f=>f.ep===ep&&f.dir==='TARGET');
 assert.equal(rows.length,1,String(id)+' '+ep);
 return rows[0];
};
const assertRacial=(race,id)=>{
 assert.ok(racial[race]?.skills?.includes(id),race+' / '+id);
};

test('critical passive identities remain attached to the right OS race and source values',()=>{
 assertRacial('ENKIDU',900050003);
 assertRacial('DWARF',900030003);
 assertRacial('RAPIN',900060003);
 assert.equal(target(900050003,'EP_ONHIT_CRITICAL_DAMAGERATE').fv1[3],10);
 assert.deepEqual(target(900030003,'EP_CRITICAL_REGIST').fv1,[0,0,0,5]);
 assert.deepEqual(target(900060003,'EP_CRITICAL_REGIST').fv2,[0,0,0,10]);
});
test('Enkidu critical damage has +10, Dwarf critical resistance -5, Rapin incoming crit damage -10',()=>{
 const normal=result(null),enkidu=result(900050003),
  dwarf=result(900030003),rapin=result(900060003);
 assert.deepEqual([normal.criticalDamage,normal.criticalIncoming,normal.criticalIncomingDamage],
  [100,0,100]);
 assert.deepEqual([enkidu.criticalDamage,enkidu.criticalIncoming,enkidu.criticalIncomingDamage],
  [110,0,100]);
 assert.deepEqual([dwarf.criticalDamage,dwarf.criticalIncoming,dwarf.criticalIncomingDamage],
  [100,-5,100]);
 assert.deepEqual([rapin.criticalDamage,rapin.criticalIncoming,rapin.criticalIncomingDamage],
  [100,0,90]);
 // Honor 8 affects incoming crit once, distinct from each racial passive.
 assert.deepEqual([result(900030003,8).criticalIncoming,
  result(900060003,8).criticalIncomingDamage],[-15,80]);
});
test('Dwarf Stronghearted is three distinct verified TARGET status resistances',()=>{
 assertRacial('DWARF',900030001);
 for(const ep of ['EP_IMMUNE_STUN','EP_IMMUNE_NUMB','EP_IMMUNE_TUMBLE'])
  assert.equal(target(900030001,ep).fv1[3],10);
 const bonus=calc.resistancePreview({stats,bonuses:{},racialPassiveId:900030001});
 assert.equal(bonus.status.stun,10);
 assert.equal(bonus.status.numb,10);
 assert.equal(bonus.status.tumble,10);
 assert.equal(bonus.status.sleep,0);
});
test('Rapin MP recovery speed +18 uses source and stays separate from MP total and equipment',()=>{
 assertRacial('RAPIN',900060002);
 assert.equal(target(900060002,'EP_HEAL_TIME_SCALE').fv1[3],18);
 const opts={classData:cls.MAGE,raceData:stats,jobData:zero,allocation:zero,level:45};
 const plain=calc.base(opts);
 const skill=calc.base({...opts,potionContext:{racialPassiveId:900060002}});
 assert.equal(skill.mp,plain.mp);
 assert.equal(skill.regeneration.mp.base,plain.regeneration.mp.base);
 assert.equal(skill.regeneration.mp.total,plain.regeneration.mp.total+18);
 assert.equal(skill.regeneration.mp.racial,18);
 assert.equal(plain.regeneration.mp.racial,undefined);
 const item={effects:[{func:'EP_HEAL_TIME_SCALE',a:6}]};
 const equipped=calc.base({...opts,potionContext:{racialPassiveId:900060002},
  records:[['item:mp-recovery',item,0]]});
 assert.equal(equipped.regeneration.mp.total,plain.regeneration.mp.total+24);
 assert.equal(equipped.regeneration.mp.equipment,6);
 assert.equal(equipped.regeneration.mp.racial,18);
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/r\?\.mp\?\.total/);
 assert.doesNotMatch(book,/regen\.mp\.racial/);
});

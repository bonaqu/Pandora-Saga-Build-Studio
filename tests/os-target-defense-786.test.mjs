import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-studio-target-damage.js'))(host);
const D=host.PandoraOSTargetDamage;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const monsters=JSON.parse(read('data/os/monsters.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const blank={combat:{spellDamageEquipmentRate:0,priestSong:{}},priestApplied:{}};
const base=(more={})=>({skillCatalog:skills,classes,monsters,tables,
 jobKey:'DISTURBANCE',level:45,branchCaps:classes.DISTURBANCE.branchCaps,
 masteries:{trap:41},stats:{dex:70,int:20},equipment:[],
 itemForth:{},unison:{},modifiers:blank,...more});
const current=more=>D.crawlingTrap(base(more));
const batch=more=>D.supportedSkillHits(base(more));
const hit=(more,id)=>batch(more).find(row=>row.skillId===id);
const patchMonster=(id,edit)=>{
 const copy=structuredClone(monsters);
 edit(copy[String(id)]);
 return copy;
};
const compare=(options,row,edit)=>{
 const selected=options.targetMonsterId||22104;
 const changed=structuredClone(options.monsters||monsters);
 edit(changed[String(selected)]);
 const other=row.skillId===240005001?
  current({...options,monsters:changed}):
  hit({...options,monsters:changed},row.skillId);
 assert.ok(other,JSON.stringify({selected,id:row.skillId}));
 return row.average-other.average;
};
test('OS single-explosion baseline remains 34 / 148 / 194 after all independent defense comparisons',()=>{
 const result=current();
 assert.ok(result);
 assert.deepEqual([result.min,result.average,result.max],[34,148,194]);
 for(const field of ['targetResistanceAverageImpact',
  'targetAbsorptionAverageImpact','targetLevelAverageImpact'])
  assert.ok(Number.isSafeInteger(result[field]));
});
test('monster resistances: independent two-resistance counterfactual uses entire OS hit path',()=>{
 let checked=0;
 for(const id of [22104,11104,11101,600]){
  const o={targetMonsterId:id};
  const h=current(o);
  assert.ok(h);
  assert.equal(h.targetResistanceAverageImpact,
   compare(o,h,m=>{
    m.resists.fire=0;
    m.resists.magic=0;
   }));
  checked++;
 }
 assert.equal(checked,4);
 const vulnerable=current({targetMonsterId:11104});
 assert.ok(vulnerable.targetElementResistance<0);
 assert.ok(vulnerable.targetResistanceAverageImpact>=0,
  'Fire vulnerability can only help this hit at fixed magic resistance');
});
test('intrinsic SPI and magic protection are isolated from level-based absorption',()=>{
 for(const id of [22104,11104,600]){
  const o={targetMonsterId:id};
  const h=current(o);
  assert.ok(h);
  assert.equal(h.targetAbsorptionAverageImpact,
   compare(o,h,m=>{m.spi=0;m.magicProtection=0;}));
 }
 const boosted=patchMonster(22104,m=>{m.magicProtection=18;m.spi=70;});
 const actual=current({monsters:boosted});
 assert.equal(actual.targetAbsorptionAverageImpact,
  compare({targetMonsterId:22104,monsters:boosted},actual,m=>{
   m.spi=0;m.magicProtection=0;
  }),
  'The absorbed damage is compared at the same current build and target gap');
});
test('level offset is compared at equal levels with same target stats and magic resistance',()=>{
 for(const id of [22104,11104,11101,600]){
  const o={targetMonsterId:id,level:45};
  const h=current(o);
  assert.ok(h);
  assert.equal(h.targetLevelAverageImpact,
   compare(o,h,m=>{m.level=45;}));
 }
 assert.equal(current({targetMonsterId:11104,level:51}).targetLevelAverageImpact,0);
});
test('direct spell, trap and linked hit all get independent target-defense deltas',()=>{
 const mage={jobKey:'WARLOCK',level:45,
  branchCaps:classes.WARLOCK.branchCaps,
  masteries:{element:70,darkness:25,exorcism:20,charm:20},
  stats:{dex:65,int:80,spi:50},targetMonsterId:11104};
 const all=batch(mage);
 for(const id of [410001001,410012001,410022001,430001001]){
  const row=all.find(x=>x.skillId===id);
  assert.ok(row,'Expected source-verified hit '+id);
  assert.equal(row.targetResistanceAverageImpact,
   compare(mage,row,m=>{m.resists[row.element]=0;m.resists.magic=0;}));
  assert.equal(row.targetAbsorptionAverageImpact,
   compare(mage,row,m=>{m.spi=0;m.magicProtection=0;}));
  assert.equal(row.targetLevelAverageImpact,
   compare(mage,row,m=>{m.level=45;}));
 }
});
test('all three factors are independent and respond to changed build, item and monster',()=>{
 const ogre=current(),dingo=current({targetMonsterId:11104});
 assert.notDeepEqual([
  ogre.targetResistanceAverageImpact,ogre.targetLevelAverageImpact
 ],[dingo.targetResistanceAverageImpact,dingo.targetLevelAverageImpact]);
 const buffed=current({stats:{dex:110,int:85},masteries:{trap:80},
  targetMonsterId:11104});
 assert.ok(buffed.average>dingo.average);
 assert.equal(buffed.targetResistanceAverageImpact,
  compare({stats:{dex:110,int:85},masteries:{trap:80},
   targetMonsterId:11104},buffed,m=>{
   m.resists.fire=0;m.resists.magic=0;
  }));
 assert.equal(current().average,148,'No stale comparison cache');
});
test('malformed D1 monsters never invent numbers, UI uses actual selected game name',()=>{
 const wrong=patchMonster(11104,m=>{delete m.resists.fire;});
 assert.equal(current({targetMonsterId:11104,monsters:wrong}),null);
 assert.equal(batch({targetMonsterId:11104,monsters:wrong}).length,0);
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/hitResult\.targetElementResistanceAverageImpact/);
 assert.match(book,/hitResult\.targetMagicResistanceAverageImpact/);
 assert.match(book,/hitResult\.targetAbsorptionAverageImpact/);
 assert.match(book,/hitResult\.targetLevelAverageImpact/);
 assert.match(book,/hitResult\.targetNameEn/);
 assert.match(book,/hitResult\.targetName/);
 assert.doesNotMatch(book,/stage-material-actions|function materialSkillResults\(/);
});

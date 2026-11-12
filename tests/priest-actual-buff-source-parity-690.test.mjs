import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator,skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const z={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const source={enabled:true,spi:134,blessing:90,hymn:30};
const ctx=(selected,modified=skills)=>C.base({
 classData:classes.WARRIOR,
 raceData:{vit:40,str:50,agi:30,dex:20,spi:70,int:15},
 jobData:z,allocation:z,level:45,
 attributeBuffs:{priestEnabled:true,priestGratia:true,
  priestLapisMedio:true,remakedSkillIds:selected},
 combatContext:{jobKey:'WARRIOR',skillCatalog:modified,
  branchMasteries:{},externalPriest:source}
});
test('selected active priest DEF and song bonuses equal same source-gated book previews',()=>{
 const cast=C.priestCastPreviews({...source,skills});
 const act=ctx([340001001,340004001]);
 assert.equal(act.combat.defense.priestBonus,cast.lapisMedio);
 assert.equal(act.combat.attackSpeed.priestBonus,cast.gratia);
 assert.equal(act.combat.priestSong.minstrel,cast.minstrel);
 assert.equal(act.combat.priestSong.sageElementDamage,cast.sage);
 assert.deepEqual([cast.lapisMedio,cast.minstrel,cast.sage],[12,24,16]);
});
test('a changed OS Lapis effect cannot inject a stale Remaked buff into character DEF',()=>{
 const forged=structuredClone(skills);
 forged['320008001'].funcs[0].fv1[0]+=1;
 const off=ctx([],forged);
 assert.equal(off.priestCast.lapisMedio,null);
 assert.equal(off.combat.defense.priestBonus,0);
 assert.equal(off.priestCast.gratia,22);
 assert.equal(off.combat.attackSpeed.priestBonus,22);
});
test('unexpected second OS vector term fails closed for previews AND selected effects',()=>{
 const forgeries=[
  ['320007001','EP_ATTACKINTERVAL_SCALE','gratia'],
  ['320008001','EP_ARMORCLASS_CONST','lapisMedio'],
  ['320011001','EP_AURADAMAGE_SCALE','enchantAuraRate'],
  ['330051001','EP_AURAHOLY_CONSTANT','holyWeapon'],
  ['340001003','EP_TOHIT_CONST','minstrel'],
  ['340004003','EP_ELEMENT_DAMAGE_SCALE','sage']
 ];
 for(const [id,ep,key] of forgeries){
  const forged=structuredClone(skills),effect=forged[id].funcs.find(f=>f.ep===ep);
  assert.ok(effect,id+' '+ep);
  effect.fv2[0]=1;
  const cast=C.priestCastPreviews({...source,skills:forged});
  assert.equal(cast[key],null,'unsupported OS fv2 must not be silently ignored: '+id);
  const applied=ctx([330051001,320011001,340001001,340004001],forged);
  if(key==='gratia')assert.equal(applied.combat.attackSpeed.priestBonus,0);
  if(key==='lapisMedio')assert.equal(applied.combat.defense.priestBonus,0);
  if(key==='holyWeapon')assert.equal(applied.auraDamage.elements.light,undefined);
  if(key==='enchantAuraRate')assert.equal(applied.priestApplied.priestEnchantment,null);
  if(key==='minstrel')assert.equal(applied.combat.priestSong.minstrel,0);
  if(key==='sage')assert.equal(applied.combat.priestSong.sageElementDamage,0);
 }
});
test('multiple independent priests or altered source cannot change character by preview alone',()=>{
 const original=JSON.stringify(skills);
 const off=C.base({
  classData:classes.WARRIOR,
  raceData:{vit:40,str:50,agi:30,dex:20,spi:70,int:15},
  jobData:z,allocation:z,level:45,
  attributeBuffs:{priestEnabled:true,priestGratia:false,priestLapisMedio:false,
   remakedSkillIds:[]},
  combatContext:{jobKey:'WARRIOR',skillCatalog:skills,
   branchMasteries:{},externalPriest:source}
 });
 assert.equal(off.combat.defense.priestBonus,0);
 assert.equal(off.combat.attackSpeed.priestBonus,0);
 assert.equal(off.combat.priestSong.sageElementDamage,0);
 assert.equal(JSON.stringify(skills),original);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scope={};
for(const p of ['pandora-studio-remaked-buffs.js','pandora-os-character-calculator.js'])
 Function('window',read(p))(scope);
const C=scope.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const zero={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const originalCaster={enabled:true,jobKey:'ENCHANTER',
 classCaps:classes.ENCHANTER.branchCaps,
 spi:134,blessing:90,hymn:30,exorcism:26};
function hero({selected=[],caster=originalCaster,skillCatalog=skills,
 buffs={},raceData=null}={}){
 return C.base({
  classData:classes.WARRIOR,
  raceData:raceData||{vit:40,str:50,agi:30,dex:20,spi:70,int:15},
  jobData:zero,allocation:zero,level:45,
  attributeBuffs:{priestEnabled:true,remakedSkillIds:selected,...buffs},
  combatContext:{jobKey:'WARRIOR',skillCatalog,
   branchMasteries:{},externalPriest:caster}});
}
test('Sage Song reduces recipient cooldown INDEX, not cast speed or speculative seconds',()=>{
 const a=hero(),b=hero({selected:[340004001]});
 const source=C.priestCastPreviews({...originalCaster,skills});
 assert.ok(a?.combat&&b?.combat);
 assert.equal(source.sageCooldownDelta,-47);
 assert.equal(source.sage,16);
 assert.equal(b.combat.priestSong.sageElementDamage,source.sage);
 assert.equal(b.combat.priestSong.sageCooldownDelta,source.sageCooldownDelta);
 assert.equal(b.combat.cooldownParts.base,a.combat.cooldown);
 assert.equal(b.combat.cooldownParts.sageSong,source.sageCooldownDelta);
 assert.equal(b.combat.cooldown,a.combat.cooldown+source.sageCooldownDelta);
 assert.equal(b.combat.castTime.known,a.combat.castTime.known);
 assert.equal(b.combat.castingSpeed.known,a.combat.castingSpeed.known);
 assert.equal(b.combat.cooldownParts.verified,false);
 assert.ok(b.combat.cooldownParts.excluded.includes('final per-skill cooldown seconds'));
});
test('caster SPR and Hymn affect Sage Song on same recipient; inactive or ineligible caster does not',()=>{
 const low=hero({selected:[340004001],caster:{...originalCaster,spi:80,hymn:30}});
 const high=hero({selected:[340004001],caster:{...originalCaster,spi:180,hymn:60}});
 assert.ok(high.combat.priestSong.sageElementDamage>
  low.combat.priestSong.sageElementDamage);
 assert.ok(high.combat.cooldown<low.combat.cooldown);
 for(const caster of [
  {...originalCaster,enabled:false},
  {...originalCaster,blessing:70},
  {...originalCaster,hymn:29},
  {...originalCaster,jobKey:'WARRIOR',classCaps:classes.WARRIOR.branchCaps}
 ]){
  const none=hero(),testResult=hero({selected:[340004001],caster});
  assert.equal(testResult.combat.cooldown,none.combat.cooldown);
  assert.equal(testResult.combat.priestSong.sageElementDamage,0);
 }
});
test('a modified OS BENCH vector cannot keep stale Sage Song cooldown bonus',()=>{
 const forged=structuredClone(skills);
 const row=forged['340004003'].funcs.find(x=>x.ep==='EP_SKILL_BENCH_FIN');
 row.fv1[2]++;
 const check=C.priestCastPreviews({...originalCaster,skills:forged});
 assert.equal(check.sageCooldownDelta,null);
 const baseline=hero();
 const result=hero({selected:[340004001],skillCatalog:forged});
 assert.equal(result.combat.cooldown,baseline.combat.cooldown);
 assert.equal(result.combat.priestSong.sageCooldownDelta,0);
});
test('Enchantment modifies current weapon aura and elemental spell damage, NOT general physical attack',()=>{
 const buff=hero({selected:[320011001]});
 const none=hero();
 const preview=C.priestCastPreviews({...originalCaster,skills});
 assert.ok(preview.enchantAuraRate>0);
 assert.ok(preview.enchantAuraFlat>0);
 assert.ok(preview.enchantElementRate>0);
 assert.equal(buff.priestApplied.priestEnchantment?.rate,preview.enchantAuraRate);
 assert.equal(buff.priestApplied.priestEnchantment?.flat,preview.enchantAuraFlat);
 assert.equal(buff.priestApplied.priestEnchantment?.magicRate,preview.enchantElementRate);
 assert.equal(buff.combat.attack?.known,none.combat.attack?.known);
 assert.equal(buff.combat.magicAttack?.known,none.combat.magicAttack?.known);
 const funcs=skills['320011001'].funcs.map(x=>x.ep);
 assert.deepEqual(funcs,['EP_AURADAMAGE_SCALE','EP_AURADAMAGE_CONST',
  'EP_ELEMENT_DAMAGE_SCALE']);
 assert.ok(!funcs.some(ep=>ep==='EP_DAMAGERATE_CONST'||ep==='EP_DAMAGERATE_SCALE'));
});
test('Enchantment fails closed if existing aura or elemental source changes',()=>{
 for(const ep of ['EP_AURADAMAGE_SCALE','EP_AURADAMAGE_CONST',
  'EP_ELEMENT_DAMAGE_SCALE']){
  const forged=structuredClone(skills);
  forged['320011001'].funcs.find(x=>x.ep===ep).fv1[3]+=1;
  const result=hero({selected:[320011001],skillCatalog:forged});
  assert.equal(result.priestApplied.priestEnchantment,null,ep);
 }
});
test('recipient base, NOT caster attack, drives War Cry, Mass Focus and Speedy Gale',()=>{
 const basic=hero();
 const altered=hero({raceData:{vit:40,str:90,agi:100,dex:75,spi:70,int:15}});
 assert.ok(basic?.combat&&altered?.combat);
 const get=value=>C.alliedRecipientPreviews({skillCatalog:skills,combat:value.combat});
 const before=get(basic),after=get(altered);
 for(const key of ['warCry','massConcentration','windAssist']){
  assert.ok(before[key]&&after[key],key);
  assert.ok(after[key].base>before[key].base,key);
  assert.ok(after[key].bonus>before[key].bonus,key);
 }
 assert.equal(before.warCry.bonus,10+Math.floor(before.warCry.base*.2));
 assert.equal(before.massConcentration.bonus,Math.floor(20+before.massConcentration.base*.15));
 assert.equal(before.windAssist.bonus,Math.floor(15+before.windAssist.base*.15));
 assert.deepEqual(before.divineBlessing,{bonus:25});
 assert.deepEqual(after.divineBlessing,{bonus:25});
});
test('selected received allies apply only to current character and Book keeps six separate pages',()=>{
 const base=hero();
 const cry=hero({buffs:{combatWarCry:true}});
 const focus=hero({selected:[100055001]});
 const wind=hero({buffs:{combatWindAssist:true}});
 const magic=hero({selected:[330004001]});
 assert.ok(cry.combat.attack.known>base.combat.attack.known);
 assert.ok(focus.combat.accuracy.known>base.combat.accuracy.known);
 assert.ok(wind.combat.dodge.known>base.combat.dodge.known);
 assert.ok(magic.resistances.elements.magic>base.resistances.elements.magic);
 const book=read('pandora-studio-hero-book.js');
 const app=read('pandora-studio-app.js');
 assert.match(book,/\['buffs','Усиления'\],\['effects','Эффекты умений'\]/);
 assert.match(book,/section\('Усиления от союзников','Ally buffs','party'\)/);
 assert.match(book,/section\('Усиления жреца','Priest buffs'\)/);
 const start=book.indexOf('function skillEffectsPage('),end=book.indexOf('function attackChapterGroups(',start);
 const effects=book.slice(start,end);
 assert.doesNotMatch(effects,/stage-skill-party-effects|Усиления союзников для этого героя/);
 assert.doesNotMatch(effects,/damageAgainstEnemy|stageBookDamageTarget|targetMonster/);
 assert.doesNotMatch(app,/ensureOgreSource|selectedDamageTargetId|targetSkillDamages/);
 assert.match(effects,/scalingSkillPreview\?\.\(/);
});

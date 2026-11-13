// Pandora Saga OS elemental-skill damage, current-build-only projection.
// Independently expressed from the public Pandora Saga OS BuildCalculator
// (assets/BuildCalculator-DBaXruFa.js, 2026-11-14), no historical
// Remaked MATK shortcut. The current Game OS data are source-gated.
(function(root){
'use strict';
const target=Object.freeze({
 id:22104,name:'Гигантский огр',nameEn:'Ogre Bouncer',level:53,
 life:6126,vit:32,spi:18,ac:15,magicProtection:0,
 resists:{fire:0,dark:-25,magic:17}
});
const n=v=>Number.isSafeInteger(v)&&v>=0;
const trunc=Math.trunc;
const floor=Math.floor;
const even=x=>{
 if(!Number.isFinite(x))return NaN;
 const lo=floor(x),fraction=x-lo;
 return fraction<0.5?lo:fraction>0.5?lo+1:lo%2===0?lo:lo+1;
};
const elementalKeys=new Set(['EP_ELEMENT_DAMAGE_SCALE',
 'EP_ELEMENT_DAMAGE_SCALE_FIRE',
 'EP_ELEMENT_BONUS']);
const sourceEffect=(sum,e,weapon)=>{
 if(!e||!elementalKeys.has(e.func))return true;
 const grade=weapon?.refinement??0;
 // Mirror the character sheet: source ranges apply to both equipment
 // and socketed Souls, even when the catalog is owner-edited.
 if((e.min!=null&&!Number.isSafeInteger(e.min))||
    (e.max!=null&&!Number.isSafeInteger(e.max)))return false;
 if((e.min!=null&&grade<e.min)||(e.max!=null&&grade>e.max))return true;
 if(!Number.isFinite(e.a))return false;
 if(e.func==='EP_ELEMENT_DAMAGE_SCALE_FIRE'){
  // OS item 1862 has a conditional bonus for *fire-refined* weapon only.
  if(weapon?.record?.id===1862&&weapon?.gem?.element!=='fire')return true;
  sum.fire+=e.a;
 }else if(e.func==='EP_ELEMENT_BONUS')sum.penetration+=e.a;
 else sum.general+=e.a;
 return true;
};
function equippedElementalEffects({equipment=[],itemForth={},unison={}}={}){
 if(!Array.isArray(equipment)||!itemForth||!unison)return null;
 const out={general:0,fire:0,penetration:0},items=new Map();
 for(const slot of equipment){
  if(slot?.issue?.length)continue;
  const rec=slot?.record,grade=slot?.refinement??0;
  if(!n(rec?.id)||!n(grade)||grade>10)return null;
  if(typeof rec.slot!=='string')return null;
  items.set(String(rec.id),slot);
  // OS Forth rows are cumulative snapshots, sometimes only at +2,+4,+6.
  // Reuse the nearest reached tier, exactly as sourceEffects does in the
  // main character calculator; don't require an explicit +3/+5/+7 row.
  const levels=itemForth[String(rec.id)];
  if(levels!=null&&(typeof levels!=='object'||Array.isArray(levels)))return null;
  let nearest=-1;
  for(const [key,rows] of Object.entries(levels||{})){
   const step=Number(key);
   if(Number.isSafeInteger(step)&&step>=1&&step<=grade&&
      Array.isArray(rows)&&step>nearest)nearest=step;
  }
  const rules=nearest<0?[]:levels[String(nearest)];
  if(!Array.isArray(rec.effects)&&rec.effects!=null)return null;
  for(const e of [...(rec.effects||[]),...rules]){
   if(!sourceEffect(out,e,slot))return null;
  }
  for(const soul of slot.souls||[]){
   if(!n(soul?.id)||!Array.isArray(soul.effects))return null;
   for(const e of soul.effects)if(!sourceEffect(out,e,slot))return null;
  }
 }
 for(const [id,slot] of items){
  const set=unison[id];
  if(!set)continue;
  if(!Array.isArray(set.members)||!Array.isArray(set.rows))return null;
  // The root is not its own companion; de-duplicate repeated member IDs.
  const members=[...new Set(set.members.map(String).filter(key=>key!==id))];
  const count=members.filter(key=>items.has(key)).length;
  const grade=slot.refinement??0;
  for(const row of set.rows){
   if(count<row.minC||count>row.maxC||
    grade<row.minL||grade>row.maxL)continue;
   if(!elementalKeys.has(row.func))continue;
   if(!row.a||!Number.isFinite(row.a.f)||!Number.isFinite(row.a.p)||
    !Number.isFinite(row.a.c)||row.a.f!==0||
    !row.b||Object.values(row.b).some(v=>v!==0))return null;
   const a=row.a.c+row.a.p*grade;
   if(!sourceEffect(out,{func:row.func,a},slot))return null;
  }
 }
 return out;
}
function monsterLevelModifier(level,monster,lvModify){
 if(!Array.isArray(lvModify)||lvModify.length<2||
  !n(level)||level<1||!n(monster.level))return null;
 const delta=monster.level-level;
 const zero={magicAc:0,magicProtection:0,magicDamageReduction:0};
 if(delta<lvModify[0].diff)return zero;
 const rows=lvModify,tail=rows.at(-1),before=rows.at(-2);
 let row=rows.slice(0,-1).find(x=>x.diff===delta);
 if(!row){
  if(tail.diff!==-1)return null;
  const d=delta-before.diff;
  row={
   magicDef:before.magicDef+tail.magicDef*d,
   magicProtection:before.magicProtection+tail.magicProtection*d,
   resistRate:before.resistRate+tail.resistRate*d
  };
 }
 const scaling=n(monster.lvMod)?monster.lvMod:100;
 if(![row.magicDef,row.magicProtection,row.resistRate].every(Number.isFinite))
  return null;
 return {magicAc:trunc(row.magicDef*scaling/100),
  magicProtection:trunc(row.magicProtection*scaling/100),
  magicDamageReduction:trunc(row.resistRate*scaling/100)};
}
function sourceSkill(skillCatalog,classes,jobKey,level,mastery,caps){
 const rootSkill=skillCatalog?.['240005001'],bolt=skillCatalog?.['240005002'],
  blast=skillCatalog?.['240005003'];
 const job=classes?.[jobKey],cap=caps?.trap;
 if(jobKey!=='DISTURBANCE'||job?.id!=='DISTURBANCE'||
  !n(level)||level<1||level>55||
  !n(cap)||cap>100||cap!==job.branchCaps?.trap||
  !n(mastery)||mastery>cap||mastery<41||
  rootSkill?.id!==240005001||rootSkill.learnable!==true||
  rootSkill.classes?.[jobKey]!==1||rootSkill.branch!=='trap'||
  rootSkill.reqs?.length!==1||
  rootSkill.reqs[0].branch!=='trap'||rootSkill.reqs[0].amount!==41||
  level<rootSkill.charLevel||rootSkill.skillType!=='POINT'||
  rootSkill.mana!==33||
  bolt?.id!==240005002||bolt.learnable!==false||
  blast?.id!==240005003||blast.learnable!==false||
  blast.branch!=='trap'||blast.powerStat!=='DEX'||
  blast.element!=='FIRE'||blast.damage?.kernel!=='element'||
  blast.damage.slotIndex!==0)return null;
 const rootFx=rootSkill.funcs,boltFx=bolt.funcs,fx=blast.funcs;
 const exact=(row,code,dir,a,b)=>
  row?.ep===code&&row?.dir===dir&&
  JSON.stringify(row.fv1)===JSON.stringify(a)&&
  JSON.stringify(row.fv2)===JSON.stringify(b);
 if(rootSkill.powerStat!=='DEX'||rootSkill.element!=='NONE'||
  bolt.skillType!=='BOLT'||bolt.element!=='NONE'||
  bolt.powerStat!=='DEX'||bolt.damage!==null||
  blast.skillType!=='SPHERE'||
  rootFx?.length!==2||boltFx?.length!==1||fx?.length!==1||
  !exact(rootFx[0],'EP_CONSUME_ITEM','CASTER',
   [0,0,0,65007],[0,0,0,2])||
  !exact(rootFx[1],'EP_SKILL_EXEC','TARGET',
   [0,0,0,240005002],[0,0,0,0])||
  !exact(boltFx[0],'EP_SKILL_EXEC','TARGET',
   [0,0,0,240005003],[0,0,0,0])||
  !exact(fx[0],'EP_ELEMENT_DAMAGE','TARGET',
   [680,0,350,155],[0,0,0,0]))return null;
 return rootSkill;
}
// Explicit source snapshots. Extra non-damage effects are checked but NEVER
// counted as additional damage, poison ticks, healing or repeated casts.
const directSpells=Object.freeze([
 {id:410001001,branch:'element',kind:'BOLT',element:'FIRE',
  stat:'INT',req:0,charLevel:1,slot:0,effects:[
   ['EP_ELEMENT_DAMAGE','TARGET',[122,0,60,23],[0,0,0,0]]]},
 {id:430001001,branch:'darkness',kind:'ENEMY',element:'DARK',
  stat:'INT',req:21,charLevel:0,slot:1,effects:[
   ['EP_LIFE_ABSORB','CASTER',[0,0,0,50],[0,0,0,0]],
   ['EP_ELEMENT_DAMAGE','TARGET',[180,0,80,40],[0,0,0,0]]]},
 {id:430052001,branch:'darkness',kind:'ENEMY',element:'DARK',
  stat:'SPI',req:8,charLevel:0,slot:0,effects:[
   ['EP_ELEMENT_DAMAGE','TARGET',[5,0,5,15],[0,0,0,0]],
   ['EP_CAUSE_POISON','TARGET',[180,0,180,40],[0,0,30,70]]]}
]);
function sourceDirectSpell({skillCatalog,classes,jobKey,level,masteries={},
 branchCaps={}},spec){
 const skill=skillCatalog?.[String(spec.id)],job=classes?.[jobKey];
 const cap=branchCaps[spec.branch],trained=masteries[spec.branch]??0;
 if(!skill||!job||job.id!==jobKey||!n(level)||level<1||level>55||
  !n(cap)||cap<spec.req||cap>100||job.branchCaps?.[spec.branch]!==cap||
  !n(trained)||trained>cap||trained<spec.req||
  skill.id!==spec.id||skill.learnable!==true||
  skill.classes?.[jobKey]!==1||skill.branch!==spec.branch||
  skill.skillType!==spec.kind||skill.element!==spec.element||
  skill.powerStat!==spec.stat||skill.charLevel!==spec.charLevel||
  level<skill.charLevel||skill.damage?.kernel!=='element'||
  skill.damage.slotIndex!==spec.slot||
  !Array.isArray(skill.reqs)||skill.reqs.length!==(spec.req?1:0)||
  (spec.req&&(skill.reqs[0]?.branch!==spec.branch||
   skill.reqs[0]?.amount!==spec.req))||
  !Array.isArray(skill.funcs)||skill.funcs.length!==spec.effects.length)
  return null;
 for(let i=0;i<spec.effects.length;i++){
  const fx=skill.funcs[i],expected=spec.effects[i];
  if(fx?.ep!==expected[0]||fx.dir!==expected[1]||
   JSON.stringify(fx.fv1)!==JSON.stringify(expected[2])||
   JSON.stringify(fx.fv2)!==JSON.stringify(expected[3]))return null;
 }
 return skill;
}
// Matches the OS public BuildCalculator's Et -> kt -> Ie -> ve -> Tt
// single elemental damage packet. A repeated or delayed subskill is NOT a
// complete cast total and is deliberately excluded from these previews.
function elementalHit(options={},spec=null){
 const {skillCatalog,classes,jobKey,level,masteries={},
  branchCaps={},stats={},equipment=[],tables={},itemForth={},unison={},
  modifiers=null}=options;
 const isTrap=!spec,skill=isTrap?
  sourceSkill(skillCatalog,classes,jobKey,level,masteries.trap,branchCaps):
  sourceDirectSpell(options,spec);
 if(!skill||!n(stats.int)||!Array.isArray(tables.lvModify)||
  !tables.magicPlus)return null;
 const effectSkill=isTrap?skillCatalog['240005003']:skill;
 const powerKey={DEX:'dex',INT:'int',SPI:'spi'}[effectSkill.powerStat];
 const element=effectSkill.element?.toLowerCase();
 const masteryKey=isTrap?'trap':spec.branch;
 const mastery=masteries[masteryKey]??0;
 const effect=effectSkill.funcs?.[effectSkill.damage?.slotIndex];
 const spread={fire:10,dark:25}[element];
 if(!powerKey||!n(stats[powerKey])||!n(mastery)||!n(spread)||
  effect?.ep!=='EP_ELEMENT_DAMAGE'||effect.dir!=='TARGET'||
  !Array.isArray(effect.fv1)||effect.fv1.length!==4||
  !effect.fv1.every(n)||!Array.isArray(effect.fv2)||
  JSON.stringify(effect.fv2)!=='[0,0,0,0]'||
  !Number.isFinite(target.resists[element]))return null;
 const equipmentEffects=equippedElementalEffects({equipment,itemForth,unison});
 if(!equipmentEffects)return null;
 // The sheet must agree with the equipment damage rate: never silently
 // use forged or obsolete item bonuses.
 const knownGear=modifiers?.combat?.spellDamageEquipmentRate;
 if(!Number.isFinite(knownGear)||
  Math.abs(equipmentEffects.general-knownGear)>0.001)return null;
 const sage=modifiers?.combat?.priestSong?.sageElementDamage||0;
 const enchant=modifiers?.priestApplied?.priestEnchantment?.magicRate||0;
 if(!Number.isFinite(sage)||!Number.isFinite(enchant))return null;
 const bonusRate=equipmentEffects.general+
  (element==='fire'?equipmentEffects.fire:0)+sage+enchant;
 // EP_ELEMENT_BONUS pierces FIRE/COLD/LIGHTNING, but not DARK resistance.
 const penetration=element==='fire'?equipmentEffects.penetration:0;
 const weapon=equipment.find(x=>x?.record?.slot==='weapon'&&!x?.issue?.length);
 let magicGemRate=0,magicGemFlat=0;
 if(weapon?.gem?.type==='magical'&&weapon.gem.element===element){
  const grade=weapon.refinement??0,plus=tables.magicPlus[String(grade)];
  if(grade>0&&(!n(grade)||grade>10||
   !Number.isFinite(plus?.ratio)||!Number.isFinite(plus?.flat)))return null;
  if(grade>0){magicGemRate=plus.ratio;magicGemFlat=plus.flat;}
 }
 const fv=effect.fv1;
 const param=floor(fv[0]*stats[powerKey]/1000)+
  floor(fv[1]*level/1000)+floor(fv[2]*mastery/1000)+fv[3];
 const intStep=even(stats.int/10),powerFactor=100+
  intStep*intStep/5+trunc(stats.int/5);
 const basePower=even(powerFactor*param/100);
 const variation=trunc(basePower*spread/100);
 const sourcePoints=[basePower-variation,basePower-variation/2,basePower];
 const gap=monsterLevelModifier(level,target,tables.lvModify);
 if(!gap)return null;
 const resistanceMagic=trunc(target.resists.magic/2);
 const resistanceElement=target.resists[element]-penetration;
 const absorption=even(target.spi*0.5)+target.magicProtection+
  gap.magicProtection;
 const apply=base=>{
  let amount=trunc(base*(100-gap.magicAc)/100);
  amount+=magicGemFlat+trunc(amount*(bonusRate+magicGemRate)/100);
  amount=Math.max(1,amount);
  const effective=trunc(amount*
   (100-resistanceMagic-resistanceElement)/100)-absorption;
  return effective<0?1:effective;
 };
 const [normalMin,normalAvg,normalMax]=sourcePoints.map(apply);
 let min=normalMin,average=normalAvg,max=normalMax;
 if(gap.magicDamageReduction>0){
  const fraction=gap.magicDamageReduction/100;
  const weakened=x=>Math.max(1,trunc(x/5));
  average=Math.round(average*(1-fraction)+weakened(average)*fraction);
  min=weakened(min);
 }
 if(![min,average,max].every(n)||min>max||average>max||
  average<min)return null;
 return {skillId:skill.id,monsterId:target.id,
  targetName:target.name,targetNameEn:target.nameEn,
  min,average,max,element,heroDex:stats.dex,heroInt:stats.int,
  trapMastery:isTrap?mastery:undefined,
  heroPowerKey:powerKey,heroPower:stats[powerKey],
  heroMasteryKey:masteryKey,heroMastery:mastery,
  basePower,bonusRate,magicGemRate,magicGemFlat,
  gearDamageRate:equipmentEffects.general,
  levelPenalty:gap.magicDamageReduction,
  model:'Pandora Saga OS public BuildCalculator / one elemental hit'};
}
function crawlingTrap(options={}){return elementalHit(options);}
function supportedSkillHits(options={}){
 const hits=[],trap=crawlingTrap(options);
 if(trap)hits.push(trap);
 for(const spell of directSpells){
  const result=elementalHit(options,spell);
  if(result)hits.push(result);
 }
 return hits;
}
root.PandoraOSTargetDamage=Object.freeze({crawlingTrap,supportedSkillHits,
 directSpells,equippedElementalEffects,monsterLevelModifier,roundEven:even,target});
})(typeof window==='undefined'?globalThis:window);

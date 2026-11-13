// Pandora Saga OS elemental-skill damage, current-build-only projection.
// Independently expressed from the public Pandora Saga OS BuildCalculator
// (assets/BuildCalculator-DBaXruFa.js, 2026-11-14), no historical
// Remaked MATK shortcut. The current Game OS data are source-gated.
(function(root){
'use strict';
const target=Object.freeze({
 id:22104,name:'Гигантский огр',nameEn:'Ogre Bouncer',level:53,
 life:6126,vit:32,spi:18,ac:15,magicProtection:0,
 resists:{fire:0,magic:17}
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
 'EP_ELEMENT_DAMAGE_SCALE_CONST','EP_ELEMENT_DAMAGE_SCALE_FIRE',
 'EP_ELEMENT_BONUS']);
const sourceEffect=(sum,e,weapon)=>{
 if(!e||!elementalKeys.has(e.func))return true;
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
  const owned=rec.slot!=='invalid';
  if(!owned)return null;
  items.set(String(rec.id),slot);
  const rules=Array.isArray(itemForth[String(rec.id)]?.[String(grade)])?
   itemForth[String(rec.id)][String(grade)]:[];
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
  const count=set.members.filter(x=>items.has(String(x))).length;
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
 if(rootFx?.length!==2||rootFx[0]?.ep!=='EP_CONSUME_ITEM'||
  rootFx[0]?.fv1?.[3]!==65007||rootFx[0]?.fv2?.[3]!==2||
  rootFx[1]?.ep!=='EP_SKILL_EXEC'||rootFx[1]?.fv1?.[3]!==240005002||
  boltFx?.length!==1||boltFx[0]?.ep!=='EP_SKILL_EXEC'||
  boltFx[0]?.fv1?.[3]!==240005003||
  fx?.length!==1||fx[0]?.ep!=='EP_ELEMENT_DAMAGE'||
  fx[0]?.dir!=='TARGET'||JSON.stringify(fx[0].fv1)!=='[680,0,350,155]'||
  JSON.stringify(fx[0].fv2)!=='[0,0,0,0]')return null;
 return rootSkill;
}
// Applies the current OS publicly shipped ELEMENT damage steps, including
// target magic resistance, elemental absorption and level-gap mob effects.
// The result is min/average/max skill-hit damage, not a hit-chance forecast.
function crawlingTrap({skillCatalog,classes,jobKey,level,masteries={},
 branchCaps={},stats={},equipment=[],tables={},itemForth={},unison={},
 modifiers=null}={}){
 const mastery=masteries.trap;
 if(!sourceSkill(skillCatalog,classes,jobKey,level,mastery,branchCaps)||
  !n(stats.dex)||!n(stats.int)||!n(mastery)||
  !Array.isArray(tables.lvModify)||!tables.magicPlus)return null;
 const equipmentEffects=equippedElementalEffects({equipment,itemForth,unison});
 if(!equipmentEffects)return null;
 // Cross-check the existing character-sheet calculator's full equipment set
 // (including Souls and unison) before trusting this separate damage path.
 const knownGear=modifiers?.combat?.spellDamageEquipmentRate;
 if(!Number.isFinite(knownGear)||
  Math.abs(equipmentEffects.general-knownGear)>0.001)return null;
 // The Book's source-dependent caster selections are already validated by
 // PandoraOSCalculator.base; use only the values it actively applies.
 const sage=modifiers?.combat?.priestSong?.sageElementDamage||0;
 const enchant=modifiers?.priestApplied?.priestEnchantment?.magicRate||0;
 if(!Number.isFinite(sage)||!Number.isFinite(enchant))return null;
 const bonusRate=equipmentEffects.general+equipmentEffects.fire+sage+enchant;
 const penetration=equipmentEffects.penetration;
 const weapon=equipment.find(x=>x?.record?.slot==='weapon'&&!x?.issue?.length);
 let magicGemRate=0,magicGemFlat=0;
 if(weapon?.gem?.type==='magical'&&weapon.gem.element==='fire'){
  const grade=weapon.refinement??0,plus=tables.magicPlus[String(grade)];
  if(grade>0&&(!n(grade)||grade>10||
   !Number.isFinite(plus?.ratio)||!Number.isFinite(plus?.flat)))return null;
  if(grade>0){magicGemRate=plus.ratio;magicGemFlat=plus.flat;}
 }
 const fv=[680,0,350,155],param=floor(fv[0]*stats.dex/1000)+
  floor(fv[1]*level/1000)+floor(fv[2]*mastery/1000)+fv[3];
 const intStep=even(stats.int/10),powerFactor=100+
  intStep*intStep/5+trunc(stats.int/5);
 const basePower=even(powerFactor*param/100);
 const variation=trunc(basePower/10);
 const sourcePoints=[basePower-variation,basePower-variation/2,basePower];
 const gap=monsterLevelModifier(level,target,tables.lvModify);
 if(!gap)return null;
 const resistanceMagic=trunc(target.resists.magic/2);
 const resistanceFire=target.resists.fire-penetration;
 const absorption=even(target.spi*0.5)+target.magicProtection+
  gap.magicProtection;
 const apply=base=>{
  let amount=trunc(base*(100-gap.magicAc)/100);
  amount+=magicGemFlat+trunc(amount*(bonusRate+magicGemRate)/100);
  amount=Math.max(1,amount);
  const effective=trunc(amount*(100-resistanceMagic-resistanceFire)/100)-
   absorption;
  return Math.max(0,effective);
 };
 const [normalMin,normalAvg,normalMax]=sourcePoints.map(apply);
 let min=normalMin,average=normalAvg,max=normalMax;
 if(gap.magicDamageReduction>0){
  const fraction=gap.magicDamageReduction/100;
  const weakened=x=>Math.max(1,trunc(x/5));
  average=Math.round(average*(1-fraction)+weakened(average)*fraction);
  min=weakened(min);
 }
 if(![min,average,max].every(n)||min>max||average>max)return null;
 return {skillId:240005001,monsterId:target.id,
  targetName:target.name,targetNameEn:target.nameEn,
  min,average,max,element:'fire',heroDex:stats.dex,heroInt:stats.int,
  trapMastery:mastery,basePower,bonusRate,magicGemRate,magicGemFlat,
  levelPenalty:gap.magicDamageReduction,
  model:'Pandora Saga OS public BuildCalculator / element target kernel'};
}
root.PandoraOSTargetDamage=Object.freeze({crawlingTrap,
 equippedElementalEffects,monsterLevelModifier,roundEven:even,target});
})(typeof window==='undefined'?globalThis:window);

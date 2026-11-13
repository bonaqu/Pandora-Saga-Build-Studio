(function(root){
'use strict';
// Current-build requirement notes only; the Encyclopedia owns full skill data.
// Do not confuse trained GREEN mastery with spent skill-tree points.
const MELEE=Object.freeze(['slash','thrust','brush','blow','defense']);
const good=n=>Number.isSafeInteger(n)&&n>=0;
const group=(values,caps)=>{
 let sum=0;
 for(const key of MELEE){
  const cap=caps?.[key],rank=values?.[key]??0;
  if(!good(cap)||!good(rank)||rank>cap)return null;
  sum+=rank;
 }
 return sum;
};
function requirements({id,skillCatalog,jobKey,level=1,
 branchMasteries={},branchCaps={},branchLabels={},englishBranches={}}={}){
 const record=skillCatalog?.[String(id)];
 if(record?.id!==Number(id)||record?.learnable!==true||
  record?.classes?.[jobKey]!==1||!Array.isArray(record.reqs))return null;
 const linesRu=[],linesEn=[],steps=[];
 if(good(record.charLevel)&&record.charLevel>0){
  linesRu.push('Уровень героя: '+level+' / '+record.charLevel);
  linesEn.push('Hero level: '+level+' / '+record.charLevel);
  steps.push({type:'level',current:level,required:record.charLevel});
 }
 for(const req of record.reqs){
  if(!good(req?.amount)||typeof req.branch!=='string')return null;
  const isMelee=record.branchRaw==='MELEE'&&
   record.branch==='martial'&&req.branch==='martial';
  const trained=isMelee?group(branchMasteries,branchCaps):
   branchMasteries[req.branch]??0;
  const cap=isMelee?group(branchCaps,branchCaps):branchCaps[req.branch];
  if(!good(cap)||!good(trained)||trained>cap)return null;
  const label=isMelee?(branchLabels.melee||'Ближний бой'):
   branchLabels[req.branch]||req.branch;
  const labelEn=isMelee?(englishBranches.melee||'Melee'):
   englishBranches[req.branch]||req.branch;
  linesRu.push('Освоенное мастерство «'+label+'»: '+trained+' / '+req.amount);
  linesEn.push('Trained '+labelEn+' mastery: '+trained+' / '+req.amount);
  steps.push({type:isMelee?'melee':'branch',branch:req.branch,
   current:trained,required:req.amount,cap});
 }
 if(!linesRu.length)return null;
 return {id:record.id,linesRu,linesEn,steps};
}
// This is a count from the character's FULL calculated MP and the OS BASE
// cost, not the current in-game MP or a promise about discounts / regeneration.
function baseManaBudget({maxMana,baseCost}={}){
 if(!Number.isSafeInteger(maxMana)||maxMana<0||
  !Number.isSafeInteger(baseCost)||baseCost<=0)return null;
 return {casts:Math.floor(maxMana/baseCost),remainder:maxMana%baseCost,
  maxMana,baseCost,baseOnly:true,usesCurrentMana:false};
}
// Source-gated base action metadata for currently available numeric effects.
// This is the game's recorded activation cost/timing, never adjusted by
// unknown server-side discounts, speed rules, or repeated-toggle behavior.
const actionTypes=new Set(['MYSELF','ALLY','PARTY_ALL','POINT','ENEMY',
 'BOLT','TOGGLE','RADIATION']);
function sourceAction({skillCatalog,skillId,jobKey,level,available,
 branchCaps={},branchMasteries={}}={}){
 if(available!==true||!Number.isSafeInteger(skillId)||
  typeof jobKey!=='string'||!good(level))return null;
 const record=skillCatalog?.[String(skillId)];
 if(record?.id!==skillId||record.learnable!==true||
  record.classes?.[jobKey]!==1||!actionTypes.has(record.skillType)||
  !Number.isSafeInteger(record.charLevel)||record.charLevel>level||
  !Number.isSafeInteger(record.mana)||record.mana<0||
  !Number.isFinite(record.cast)||record.cast<0||
  !Number.isFinite(record.cooldown)||record.cooldown<0||
  !Array.isArray(record.funcs)||record.funcs.length===0||
  !Array.isArray(record.reqs))return null;
 // A skill can be listed for all classes while its mastery gate remains
 // unreachable for most of them. Validate the CURRENT GREEN trained
 // mastery and real class limits instead of trusting raw classes alone.
 for(const req of record.reqs){
  if(!good(req?.amount)||typeof req.branch!=='string')return null;
  const melee=record.branchRaw==='MELEE'&&record.branch==='martial'&&
   req.branch==='martial';
  const cap=melee?group(branchCaps,branchCaps):branchCaps?.[req.branch];
  const trained=melee?group(branchMasteries,branchCaps):
   (branchMasteries?.[req.branch]??0);
  if(!good(cap)||!good(trained)||trained>cap||trained<req.amount||
   req.amount>cap)return null;
 }
 return {skillId,skillType:record.skillType,mana:record.mana,
  cast:record.cast,cooldown:record.cooldown,
  baseOnly:true,serverFinalUnverified:true};
}

/* Current hero active skill: the same OS + Remaked Status_78 Inspiration
 * 50% cast model used by healing. No invented speed or rounding rules. */
function inspiredCastTime({action,castTime}={}){
 if(action?.baseOnly!==true||!Number.isFinite(action.cast)||
  action.cast<=0||!Number.isFinite(action.cooldown)||action.cooldown<0||
  !Number.isSafeInteger(action.mana)||action.mana<0)return null;
 if(castTime?.known!==50||castTime.allyReduction!==50||
  typeof castTime.source!=='string'||
  !castTime.source.includes("Remaked Calc('CastSPD')"))return null;
 return {baseSeconds:action.cast,seconds:action.cast/2,percent:50};
}

/*
 * Character-specific projection of source-checked crafting/trap actions.
 * Rows MUST come from craftingSkillPreview / trapSkillCostPreview; this
 * second gate checks exact OS items and skill ownership before rendering.
 */
function materialAction({kind,row,skillCatalog,items,jobKey,level,
 branchCaps={},branchMasteries={}}={}){
 if(!['craft','trap'].includes(kind)||row?.requirementsMet!==true||
  !Number.isSafeInteger(row.id))return null;
 const action=sourceAction({skillCatalog,skillId:row.id,jobKey,level,
  available:true,branchCaps,branchMasteries});
 if(!action||!['MYSELF','POINT'].includes(action.skillType)||
  (kind==='craft'&&action.skillType!=='MYSELF')||
  (kind==='trap'&&action.skillType!=='POINT'))return null;
 const skill=skillCatalog[String(row.id)];
 const materials=kind==='craft'?row.uses:
  [{id:row.itemId,quantity:row.count}];
 if(!Array.isArray(materials)||!materials.length||
  !materials.every(x=>Number.isSafeInteger(x?.id)&&x.id>0&&
   Number.isSafeInteger(x.quantity)&&x.quantity>0&&
   items?.[String(x.id)]?.id===x.id))return null;
 const effect=(f,ep,id,count)=>f?.ep===ep&&
  ['CASTER','TARGET'].includes(f.dir)&&
  Array.isArray(f.fv1)&&f.fv1.length===4&&
  Array.isArray(f.fv2)&&f.fv2.length===4&&
  f.fv1.every((v,i)=>v===(i===3?id:0))&&
  f.fv2.every((v,i)=>v===(i===3?count:0));
 const consumed=skill.funcs.filter(f=>f?.ep==='EP_CONSUME_ITEM');
 if(consumed.length!==materials.length||
  !materials.every((x,i)=>effect(consumed[i],'EP_CONSUME_ITEM',
   x.id,x.quantity)))return null;
 let produces=null;
 if(kind==='craft'){
  const output=row.produces;
  if(!Number.isSafeInteger(output?.id)||output.id<1||
   !Number.isSafeInteger(output.quantity)||output.quantity<1||
   items?.[String(output.id)]?.id!==output.id||
   skill.funcs.length!==materials.length+1||
   !effect(skill.funcs[skill.funcs.length-1],'EP_ADDITION_ITEM',
    output.id,output.quantity))return null;
  produces={id:output.id,quantity:output.quantity};
 }else{
  const children=skill.funcs.filter(f=>f?.ep==='EP_SKILL_EXEC');
  if(!Number.isSafeInteger(row.linkedEffectId)||
   children.length!==1||children[0]?.fv1?.[3]!==row.linkedEffectId)
   return null;
 }
 return {kind,skillId:row.id,materials:materials.map(x=>({...x})),
  produces,mana:action.mana,cast:action.cast,cooldown:action.cooldown,
  sourceOnly:true};
}
/* Counts from FULL calculated MP; inputs are costs per cast, NOT inventory. */
function materialUseBudget({action,maxMana}={}){
 if(!action||!Array.isArray(action.materials))return null;
 const budget=baseManaBudget({maxMana,baseCost:action.mana});
 if(!budget)return null;
 const materials=[];
 for(const row of action.materials){
  if(!Number.isSafeInteger(row?.id)||row.id<1||
   !Number.isSafeInteger(row.quantity)||row.quantity<1||
   !Number.isSafeInteger(row.quantity*budget.casts))return null;
  materials.push({id:row.id,quantity:row.quantity*budget.casts});
 }
 return {casts:budget.casts,remainder:budget.remainder,
  maxMana:budget.maxMana,materials,baseOnly:true};
}

/* The next extra use from this hero's full MP, always at the OS base cost. */
function nextManaUse({maxMana,baseCost}={}){
 const budget=baseManaBudget({maxMana,baseCost});
 if(!budget)return null;
 const required=(budget.casts+1)*baseCost;
 if(!Number.isSafeInteger(required)||required<=budget.maxMana)return null;
 return {casts:budget.casts,maxMana,required,
  missing:required-maxMana,baseOnly:true};
}
/* Current-build total healing of ONE receiver, not extra party targets or
 * periodically repeating effects. A validated current-hero heal preview is
 * required before aggregation. */
function directHealingBudget({row,action,maxMana}={}){
 if(row?.available!==true||row?.breakdown?.kind!=='direct'||
  row?.skillId!==action?.skillId||
  !Number.isSafeInteger(row.amount)||row.amount<=0||
  !Number.isSafeInteger(row.skillId))return null;
 const budget=baseManaBudget({maxMana,baseCost:action.mana});
 if(!budget||budget.casts<=0)return null;
 const total=row.amount*budget.casts;
 if(!Number.isSafeInteger(total)||total<row.amount)return null;
 return {amount:row.amount,total,casts:budget.casts,maxMana,
  remainder:budget.remainder,baseOnly:true};
}
root.PandoraBookSkillThresholds=Object.freeze({
 requirements,baseManaBudget,nextManaUse,directHealingBudget,
 sourceAction,inspiredCastTime,materialAction,materialUseBudget,MELEE
});
})(typeof window==='undefined'?globalThis:window);

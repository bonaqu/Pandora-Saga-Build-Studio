(function(root){
'use strict';
// Current-build requirement notes only; the Encyclopedia owns full skill data.
// Do not confuse trained GREEN mastery with spent skill-tree points.
const MELEE=Object.freeze(['slash','thrust','brush','blow','defense']);
const PARENT=Object.freeze([[100101001,3],[111201001,35],
 [100056001,70],[100057001,100]]);
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
function nextMelee({skillCatalog,jobKey,branchMasteries={},branchCaps={},
 englishSkills={}}={}){
 const current=group(branchMasteries,branchCaps);
 const cap=group(branchCaps,branchCaps);
 if(current===null||cap===null)return null;
 const matches=PARENT.filter(([id,threshold])=>{
  const rec=skillCatalog?.[String(id)];
  return rec?.id===id&&rec.learnable===true&&
   rec.classes?.[jobKey]===1&&rec.branchRaw==='MELEE'&&
   rec.branch==='martial'&&rec.reqs?.length===1&&
   rec.reqs[0]?.branch==='martial'&&rec.reqs[0]?.amount===threshold&&
   cap>=threshold;
 });
 const next=matches.find(([,required])=>required>current);
 if(!next)return null;
 const [id,required]=next,skill=skillCatalog[String(id)];
 return {id,required,current,remaining:required-current,cap,
  nameRu:skill.name,nameEn:englishSkills?.[String(id)]?.n||skill.name,
  sourceOnly:true,learned:false};
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
root.PandoraBookSkillThresholds=Object.freeze({
 requirements,nextMelee,baseManaBudget,sourceAction,inspiredCastTime,MELEE
});
})(typeof window==='undefined'?globalThis:window);

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
root.PandoraBookSkillThresholds=Object.freeze({requirements,nextMelee,MELEE});
})(typeof window==='undefined'?globalThis:window);

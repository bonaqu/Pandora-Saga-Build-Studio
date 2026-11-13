(function(root){
'use strict';
// Encyclopedic, read-only projection of already source-verified OS models.
// The Book must not repeat general catalog mechanics as character statistics.
// Do not infer final damage, proc chance, duration or actual inventory.
const methods=Object.freeze([
 ['complexSkillSourcePreview',null],
 ['statusApplicationPreview',null],
 ['enemyDebuffPreview',null],
 ['tacticalSkillPreview',null],
 ['rangedAmmoPreview',{weaponKind:'BOW'}],
 ['rangedAmmoPreview',{weaponKind:'CROSSBOW'}],
 ['combatTechniquePreview',{weaponKind:'2H_SWORD'}],
 ['specializedSkillPreview',null],
 ['supportEffectPreview',null],
 ['situationalSkillPreview',{weaponKind:'LANCE'}],
 ['skillExecutionChains',null],
 ['skillExecutionChains',{onHit:true}],
 ['craftingSkillPreview',null],
 ['trapSkillCostPreview',null],
 ['songSkillPreview',null]
]);
const cache=new WeakMap();
function rowsOf(result){
 if(!result||typeof result!=='object')return [];
 return ['rows','defense','magic','help','stealth','other'].flatMap(
  key=>Array.isArray(result[key])?result[key]:[]);
}
function inspect({skillCatalog,classes,id,calculator}={}){
 const skill=skillCatalog?.[String(id)];
 if(!skill||skill.id!==Number(id)||!skill.learnable||
  !classes||typeof classes!=='object'||!calculator)return null;
 const old=cache.get(skillCatalog);
 if(old?.classes===classes&&old?.calculator===calculator&&old.values.has(skill.id))
  return old.values.get(skill.id);
 const store=old?.classes===classes&&old?.calculator===calculator?old:
  {classes,calculator,values:new Map()};
 if(store!==old)cache.set(skillCatalog,store);
 const jobs=Object.keys(classes).filter(job=>
  skill.classes?.[job]===1&&classes[job]?.branchCaps);
 const notes=[],paths=[],extra=[];
 for(const jobKey of jobs){
  const caps=classes[jobKey].branchCaps;
  const opts={skillCatalog,jobKey,level:55,branchCaps:caps,branchMasteries:caps};
  for(const [method,more] of methods){
   if(typeof calculator[method]!=='function')continue;
   const result=calculator[method]({...opts,...(more||{})});
   for(const row of rowsOf(result)){
    if(row?.id!==skill.id)continue;
    if((row.noteRu||row.noteEn)&&!notes.some(
     n=>n.ru===row.noteRu&&n.en===row.noteEn))
     notes.push({ru:row.noteRu||'',en:row.noteEn||''});
    if(Array.isArray(row.paths))for(const path of row.paths){
     if(!Array.isArray(path)||path[0]!==skill.id||
      !path.every(n=>Number.isSafeInteger(n)&&skillCatalog[String(n)]))continue;
     const key=path.join(':');
     if(!paths.some(p=>p.join(':')===key))paths.push(path);
    }
    if(Array.isArray(row.uses)&&row.produces&&
     !extra.some(item=>item.type==='recipe'))
     extra.push({type:'recipe',uses:row.uses,produces:row.produces});
    if(Number.isSafeInteger(row.count)&&row.count>0&&
     method==='trapSkillCostPreview'&&!extra.some(x=>x.type==='trap'))
     extra.push({type:'trap',count:row.count,itemId:65007});
    if(Number.isSafeInteger(row.requiredItemCount)&&
     Number.isSafeInteger(row.requiredItemId)&&
     !extra.some(x=>x.type==='requiredItem'))
     extra.push({type:'requiredItem',count:row.requiredItemCount,
      itemId:row.requiredItemId});
    if(Number.isSafeInteger(row.specialResourceValue)&&
     !extra.some(x=>x.type==='resource'))
     extra.push({type:'resource',value:row.specialResourceValue});
   }
  }
  // Every qualifying class uses the same verified source effects. A single
  // complete set of notes avoids repeated scans of all 28 class snapshots.
  if(notes.length&&paths.length)break;
 }
 const result=notes.length||paths.length||extra.length?
  {notes,paths,extra,sourceOnly:true,finalAmount:null}:null;
 store.values.set(skill.id,result);
 return result;
}
root.PandoraWikiSkillInsights=Object.freeze({inspect});
})(typeof window==='undefined'?globalThis:window);

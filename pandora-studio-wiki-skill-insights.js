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
// Some OS entries advertise learnable=true but have no class acquisition
// path or require mastery beyond every current class cap. Present their
// source-limited status ONLY in Wiki, never as a build buff or final effect.
function accessNotice(skill,skillCatalog,classes){
 if(skill.id===260006002){
  const main=skillCatalog?.['260006001'];
  const effects=record=>(record?.funcs||[]).map(f=>
   [f.ep,f.dir,f.fv1,f.fv2]);
  if(skill.learnable!==true||skill.skillType!=='MYSELF'||
   skill.branch!=='exorcism'||Object.keys(skill.classes||{}).length||
   !main||main.id!==260006001||!main.learnable||
   main.skillType!=='PARTY_ALL'||main.branch!=='exorcism'||
   !Object.values(main.classes||{}).some(Boolean)||
   skill.funcs?.length!==2||
   effects(skill).some((row,i)=>row[0]!==[
    'EP_AVOIDANCE_CONST','EP_AVOIDANCE_SCALE'][i]||
    row[1]!=='TARGET'||JSON.stringify(row[2])!==JSON.stringify([0,0,0,15])||
    JSON.stringify(row[3])!==JSON.stringify([0,0,0,0]))||
   JSON.stringify(effects(skill))!==JSON.stringify(effects(main)))
   return null;
  return {kind:'no-class-variant',relatedSkillId:260006001,
   ru:'У этой версии умения нет профессий, которым она назначена в текущих данных игры. У основного «Помощь ветра» есть список профессий и тот же эффект. Не следует прибавлять его второй раз; отдельный способ изучения этой версии не подтверждён.',
   en:'This skill variant has no assigned classes in current game data. The main Speedy Gale skill has classes and the same effect. Do not stack this variant as a second bonus; a separate learning path is not verified.'};
 }
 if(skill.id!==300001001&&skill.id!==300002001)return null;
 const physical=skill.id===300001001;
 const effect=skill.funcs?.[0];
 const expected=physical?'EP_SPECIAL_WARDING':'EP_ELEMENT_BARRIER';
 const value=physical?[0,0,0,100]:[0,0,0,1];
 if(skill.learnable!==true||skill.skillType!=='ENEMY'||
  skill.branch!=='benevolence'||skill.branchRaw!=='PRAYER'||
  skill.reqs?.length!==1||skill.reqs[0]?.branch!=='benevolence'||
  skill.reqs[0]?.amount!==102||skill.funcs?.length!==1||
  effect?.ep!==expected||effect?.dir!=='TARGET'||
  JSON.stringify(effect.fv1)!==JSON.stringify(value)||
  JSON.stringify(effect.fv2)!==JSON.stringify(physical?[0,0,0,1]:[0,0,0,0]))
  return null;
 const permitted=Object.entries(skill.classes||{}).filter(([,allowed])=>allowed===1);
 if(!permitted.length||permitted.some(([job])=>
  !Number.isSafeInteger(classes[job]?.branchCaps?.benevolence)))return null;
 const max=Math.max(...permitted.map(([job])=>classes[job].branchCaps.benevolence));
 if(max>=102)return null;
 return {kind:'above-class-cap',required:102,maximum:max,
  ru:'По игровым данным для изучения требуется мастерство «Исцеление» 102, а наибольший предел профессии в текущем каталоге — '+max+'. Обычный путь изучения с такими пределами недоступен. Особые способы получения этого умения не подтверждены.',
  en:'The game files require Healing mastery 102, but the highest class limit in the current catalog is '+max+'. Ordinary learning is not possible within these caps. Special acquisition methods are unverified.'};
}
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
 const notice=accessNotice(skill,skillCatalog,classes);
 // These exceptional source records have no ordinary playable build.
 // Don't run 28 exhaustive model inspectors just to render an access note.
 if(notice){
  const result={notes:[],paths:[],extra:[],accessNotice:notice,
   sourceOnly:true,finalAmount:null};
  store.values.set(skill.id,result);return result;
 }
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
  if(notes.length||paths.length||extra.length)break;
 }
 const result=notes.length||paths.length||extra.length?
  {notes,paths,extra,sourceOnly:true,finalAmount:null}:null;
 store.values.set(skill.id,result);
 return result;
}
root.PandoraWikiSkillInsights=Object.freeze({inspect});
})(typeof window==='undefined'?globalThis:window);

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
// Two OS Toxify variants had a verified material cost but no Wiki evidence.
// Pin the complete skill action signature: any drift disables this insight,
// rather than inventing an item, count, damage, or duration.
function poisonItemSource(skill){
 const upgraded=skill.id===220001003;
 if(skill.id!==220001001&&!upgraded)return null;
 const rank=upgraded?61:12,previous=upgraded?220001001:null;
 const same=(f,ep,dir,fv1,fv2)=>
  f?.ep===ep&&f?.dir===dir&&
  JSON.stringify(f.fv1)===JSON.stringify(fv1)&&
  JSON.stringify(f.fv2)===JSON.stringify(fv2);
 const zero=[0,0,0,0];
 if(skill.learnable!==true||skill.skillType!=='MYSELF'||
  skill.branch!=='alchemy'||skill.charLevel!==0||
  skill.prereq!==previous||skill.mana!==15||skill.cast!==2||
  skill.cooldown!==10||skill.reqs?.length!==1||
  skill.reqs[0]?.branch!=='alchemy'||skill.reqs[0]?.amount!==rank||
  skill.funcs?.length!==3||
  !same(skill.funcs[0],'EP_AURAPOISON_CONSTANT','TARGET',
   upgraded?[0,10,15,6]:[0,10,5,5],zero)||
  !same(skill.funcs[1],'EP_CONSUME_ITEM','CASTER',
   [0,0,0,50056],[0,0,0,1])||
  !same(skill.funcs[2],'EP_LOST_CHANGE_WEAPON','TARGET',zero,zero))
  return null;
 return {notes:[{
  ru:'Эффект яда прекращается при смене оружия.',
  en:'The poison effect ends when changing weapons.'
 }],paths:[],extra:[{type:'requiredItem',count:1,itemId:50056}],
  sourceOnly:true,finalAmount:null};
}
// Four OS hymns launch an area action and then a recipient-side effect.
// This source whitelist documents links, not server timing or final combat.
const hymnProofs=Object.freeze({
 340001001:{area:340001002,final:340001003,req:[['hymn',8]],
  previous:null,move:0,mana:30,effects:[
   ['EP_TOHIT_CONST',[13,0,13,4]],['EP_AVOIDANCE_CONST',[13,0,13,4]]],
  ru:'Создаёт область, повышающую точность и уклонение союзников.',
  en:'Creates an area that raises allies’ accuracy and evasion.'},
 340001004:{area:340001005,final:340001006,req:[['hymn',8]],
  previous:340001001,move:225,mana:30,effects:[
   ['EP_TOHIT_CONST',[13,0,13,4]],['EP_AVOIDANCE_CONST',[13,0,13,4]]],
  ru:'Улучшенная версия создаёт область, повышающую точность и уклонение союзников, а также ускоряет исполнителя.',
  en:'Upgraded song: raises allies’ accuracy and evasion in an area and increases the performer’s movement speed.'},
 340003001:{area:340003002,final:340003003,
  req:[['benevolence',61],['hymn',30]],previous:null,move:225,mana:33,
  effects:[['EP_DAMAGE_CLEAR',[60,0,30,10]]],
  ru:'Создаёт область с защитой союзников от слабых попаданий.',
  en:'Creates an area that protects allies from weak hits.'},
 340004001:{area:340004002,final:340004003,
  req:[['blessing',71],['hymn',30]],previous:null,move:225,mana:33,
  effects:[['EP_SKILL_BENCH_FIN',[-28,0,-17,-5]],
   ['EP_ELEMENT_DAMAGE_SCALE',[8,0,8,4]]],
  ru:'Создаёт область, усиливающую стихийный урон и сокращающую перезарядку умений союзников.',
  en:'Creates an area that boosts allies’ elemental damage and shortens skill cooldowns.'}
});
function hymnChainEvidence(skill,catalog,classes){
 const p=hymnProofs[skill.id];if(!p)return null;
 const zero=[0,0,0,0];
 const same=(f,ep,dir,v1,v2=zero)=>f?.ep===ep&&f.dir===dir&&
  JSON.stringify(f.fv1)===JSON.stringify(v1)&&
  JSON.stringify(f.fv2)===JSON.stringify(v2);
 if(skill.learnable!==true||skill.skillType!=='TOGGLE'||
  skill.branch!=='hymn'||skill.charLevel!==0||
  skill.prereq!==p.previous||skill.mana!==p.mana||
  skill.cast!==0||skill.cooldown!==5||
  JSON.stringify(skill.reqs?.map(r=>[r.branch,r.amount]))!==JSON.stringify(p.req)||
  skill.funcs?.length!==4||
  !same(skill.funcs[0],'EP_SKILL_EXEC_COUNT','TARGET',
   [0,0,0,p.area],[0,0,0,4])||
  !same(skill.funcs[1],'EP_MOVESPEED_CONST','CASTER',[0,0,p.move,0])||
  !same(skill.funcs[2],'EP_TOGGLE','CASTER',[0,0,-20,50],[0,0,0,5])||
  !same(skill.funcs[3],'EP_STATE_CHANT','CASTER',zero)||
  (p.previous!=null&&catalog?.[String(p.previous)]?.id!==p.previous))
  return null;
 // Raw classes lists can be broad; at least one current job must meet
 // ALL of the genuine acquisition caps. The open build is irrelevant here.
 if(!Object.entries(classes||{}).some(([job,entry])=>
  skill.classes?.[job]===1&&p.req.every(([branch,rank])=>
   Number.isSafeInteger(entry?.branchCaps?.[branch])&&
   entry.branchCaps[branch]>=rank)))return null;
 const area=catalog?.[String(p.area)],end=catalog?.[String(p.final)];
 if(area?.id!==p.area||area.learnable!==false||
  area.skillType!=='SPHERE'||area.branch!=='hymn'||
  area.funcs?.length!==1||
  !same(area.funcs[0],'EP_SKILL_EXEC','TARGET',[0,0,0,p.final])||
  end?.id!==p.final||end.learnable!==false||
  end.skillType!=='ALLY'||end.branch!=='hymn'||
  end.funcs?.length!==p.effects.length||
  !p.effects.every(([ep,vector],i)=>
   same(end.funcs[i],ep,'TARGET',vector)))return null;
 return {notes:[{ru:p.ru,en:p.en}],paths:[[skill.id,p.area,p.final]],
  extra:[],pathKind:'hymn',sourceOnly:true,finalAmount:null};
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
 const poison=poisonItemSource(skill);
 if(poison){
  store.values.set(skill.id,poison);
  return poison;
 }
 const hymn=hymnChainEvidence(skill,skillCatalog,classes);
 if(hymn){
  store.values.set(skill.id,hymn);
  return hymn;
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
 // A trap needs BOTH a valid execution chain and the strict, complete
 // source proof used by trapSkillCostPreview. Generic execution graphs alone
 // do not prove a trap's resulting effect.
 const trapVerified=extra.some(x=>x.type==='trap')&&
  paths.some(path=>path.length>=2&&path[0]===skill.id&&
   path.every((nodeId,index)=>index===0||
    skillCatalog[String(nodeId)]?.learnable===false));
 const result=notes.length||paths.length||extra.length?
  {notes,paths,extra,
   ...(trapVerified?{pathKind:'trap'}:{}),
   sourceOnly:true,finalAmount:null}:null;
 store.values.set(skill.id,result);
 return result;
}
root.PandoraWikiSkillInsights=Object.freeze({inspect});
})(typeof window==='undefined'?globalThis:window);

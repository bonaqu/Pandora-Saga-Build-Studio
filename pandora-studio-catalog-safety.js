(function(root){
'use strict';
// The current game's level cap is catalog information, never the Build Studio
// character planner limit. Check the ACTUAL production models on staged D1
// datasets before publish and on public D1 data after publish.
const MAX_LEVEL=55;
const configuredMax=()=>root.PandoraLevelProgression?.maxLevel()??MAX_LEVEL;
const EXPECTED=Object.freeze({
 45:[432,104],46:[446,107],47:[460,110],48:[474,113],
 49:[488,116],50:[504,119],51:[512,122],52:[520,125],
 53:[528,128],54:[536,131],55:[544,134]
});
const NAMES=Object.freeze({vit:['ВЫН','VIT'],str:['СИЛ','STR'],
 agi:['ЛВК','AGI'],dex:['СНР','DEX'],spi:['ДУХ','SPI'],int:['ИНТ','INT']});
const keys=Object.keys(NAMES);
const validObject=value=>value&&typeof value==='object'&&!Array.isArray(value);
const number=value=>Number.isFinite(value)?value:null;

function check(data){
 const issues=[];
 const attributes=root.PandoraAttributeProgression;
 const skills=root.PandoraSkillProgression;
 const calculator=root.PandoraOSCalculator;
 const tables=data?.tables,classes=data?.classes;
 if(!attributes||!skills||!calculator?.classBase)
  return {ok:false,issues:['Не подключены расчётные модули героя.']};
 if(!validObject(tables)||!validObject(classes))
  return {ok:false,issues:['Нет таблиц или профессий для проверки персонажей.']};
 if(!validObject(tables.abilityPoint)||!validObject(tables.raceInit)||
    !validObject(tables.jobInit))
  return {ok:false,issues:['В каталоге отсутствуют таблицы прокачки персонажа.']};
 // Source levelCap may be 45, 50 or another server value. It must NOT
 // restrict the independent planner. Legacy 2–55 source completeness stays required.
 for(let level=2;level<=55;level++){
  if(!Number.isSafeInteger(tables.abilityPoint[String(level)])||
     tables.abilityPoint[String(level)]<0){
   issues.push('Нет корректных игровых данных для '+level+'-го уровня.');
   break;
  }
 }
 // Historical 45–55 baselines hold unless the owner has intentionally
 // published a different CAS-protected progression table in D1.
 if(!root.PandoraLevelProgression||root.PandoraLevelProgression.isDefault())
  for(const [raw,[expectedStats,expectedSkills]] of Object.entries(EXPECTED)){
   const level=Number(raw),attributePoints=attributes.budget(level);
   const skillPoints=skills.spending(tables.abilityPoint,level,{}).total;
   if(attributePoints!==expectedStats||skillPoints!==expectedSkills)
    issues.push('На '+level+'-м уровне начисления отличаются от закреплённых: '+
     String(attributePoints)+' / '+String(skillPoints)+
     ' вместо '+expectedStats+' / '+expectedSkills+'.');
  }
 const max=configuredMax(),actualPoints=attributes.budget(max);
 const actualSkills=skills.spending(tables.abilityPoint,max,{}).total;
 if(!Number.isSafeInteger(actualPoints)||!Number.isSafeInteger(actualSkills))
  issues.push('Нельзя рассчитать очки для максимального уровня '+max+'.');
 const races=Object.keys(tables.raceInit);
 if(!races.length||!Object.keys(classes).length)
  issues.push('Нет происхождений или профессий для проверки.');
 // Exercise the real published models for early, mid and endgame builds;
 // a successful level-55 check alone cannot prove progression at 15 or 45.
 // The planner cap is independent of the current game-server level cap.
 const sampleLevels=[...new Set([1,15,30,45,max].filter(level=>level<=max))];
 for(const level of sampleLevels){
  const expected=attributes.budget(level);
  for(const [klass,definition] of Object.entries(classes)){
   const rootClass=definition?.baseClass||klass;
   for(const race of races){
    const sample=attributes.snapshot({
     tables,race,klass:rootClass,level,
     added:[0,0,0,0,0,0],caps:definition?.statCaps
    });
    const hp=sample&&calculator.classBase(definition?.hp,level,sample.values[0],'vit');
    const mp=sample&&calculator.classBase(definition?.mp,level,sample.values[4],'spi');
    if(!sample||sample.total!==expected||!Number.isFinite(hp)||!Number.isFinite(mp)){
     issues.push('Не рассчитан герой '+klass+' / '+race+' на '+level+'-м уровне.');
     if(issues.length>=8)break;
    }
   }
   if(issues.length>=8)break;
  }
  if(issues.length>=8)break;
 }
 return {ok:issues.length===0,issues,levelCap:tables.levelCap,
  plannerMax:max,attributesAt55:attributes.budget(55),
  skillsAt55:skills.spending(tables.abilityPoint,55,{}).total,
  attributesAtMax:actualPoints,skillsAtMax:actualSkills};
}

function project(data,hero){
 if(!hero||!Number.isInteger(hero.level)||hero.level<1||hero.level>configuredMax()||
    !hero.race||!hero.klass)return null;
 const definition=data?.classes?.[hero.klass];
 if(!definition)return {error:'Профессия персонажа отсутствует в выбранном каталоге.'};
 const added=keys.map(key=>Number(hero.stats?.[key]||0));
 const snap=root.PandoraAttributeProgression.snapshot({
  tables:data.tables,race:hero.race,klass:definition.baseClass||hero.klass,
  level:hero.level,added,caps:definition.statCaps
 });
 const points=root.PandoraSkillProgression.spending(
  data.tables?.abilityPoint,hero.level,hero.points);
 if(!snap||points.total===null)
  return {error:'Для этого персонажа не удалось пересчитать очки на выбранных данных.'};
 const hp=root.PandoraOSCalculator.classBase(definition.hp,hero.level,snap.values[0],'vit');
 const mp=root.PandoraOSCalculator.classBase(definition.mp,hero.level,snap.values[4],'spi');
 if(!Number.isFinite(hp)||!Number.isFinite(mp))
  return {error:'Не удалось вычислить базовые ОЗ/ОМ персонажа.'};
 return {level:hero.level,attributeBudget:snap.total,
  attributeRemaining:snap.remaining,skillBudget:points.total,
  skillRemaining:points.remaining,baseHp:hp,baseMp:mp,
  stats:Object.fromEntries(keys.map((key,i)=>[key,snap.values[i]])),
  branchCaps:definition.branchCaps||{}};
}

function compare(before,after,hero){
 if(!hero)return {hasHero:false,changes:[],warning:null};
 const old=project(before,hero),next=project(after,hero);
 if(!old||!next)return {hasHero:false,changes:[],warning:null};
 if(old.error||next.error)
  return {hasHero:true,changes:[],warning:next.error||old.error};
 const changes=[];
 const add=(key,ru,en,a,b)=>{
  if(a!==b)changes.push({key,ru,en,before:a,after:b});
 };
 for(const [key,[ru,en]] of Object.entries(NAMES))
  add('stat:'+key,ru,en,old.stats[key],next.stats[key]);
 for(const [key,ru,en] of [
  ['attributeBudget','Всего очков характеристик','Total attribute points'],
  ['attributeRemaining','Свободные очки характеристик','Unspent attribute points'],
  ['skillBudget','Всего очков умений','Total skill points'],
  ['skillRemaining','Свободные очки умений','Unspent skill points'],
  ['baseHp','Базовые ОЗ без предметов и усилений','Base HP without gear/buffs'],
  ['baseMp','Базовые ОМ без предметов и усилений','Base MP without gear/buffs']
 ])add(key,ru,en,old[key],next[key]);
 const branches=new Set([...Object.keys(old.branchCaps),...Object.keys(next.branchCaps)]);
 for(const key of branches)if(Number(hero.points?.[key]||0)>0)
  add('branch:'+key,'Предел мастерства · '+key,'Mastery cap · '+key,
    old.branchCaps[key]??null,next.branchCaps[key]??null);
 return {hasHero:true,changes,warning:null,level:hero.level};
}

// Before publication classify *changes*, not just JSON schema validity.
// A matching source shape does not prove that the calculator interprets a
// newly introduced gameplay effect. Lists are intentionally bounded for UI.
function compatibility(before,after){
 const issues={verified:[],sourceOnly:[],needsReview:[]},totals={
  verified:0,sourceOnly:0,needsReview:0};
 const add=(kind,key,title)=>{
  totals[kind]++;
  if(issues[kind].length<6)issues[kind].push({key,title});
 };
 const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
 const keys=new Set([...Object.keys(before||{}),...Object.keys(after||{})]);
 for(const dataset of keys){
  const oldData=before?.[dataset],newData=after?.[dataset];
  if(same(oldData,newData))continue;
  if(dataset==='classes'){
   // Class names are editorial; HP/MP/stat limits and base race mapping
   // are exercised by check(). Other class chains are not automatically
   // proven by numerical HP/MP parity.
   const ids=new Set([...Object.keys(oldData||{}),...Object.keys(newData||{})]);
   for(const id of ids){
    const old=oldData?.[id],now=newData?.[id];
    if(same(old,now))continue;
    const name=String(now?.name||old?.name||id).slice(0,90);
    if(!old||!now){
     add('needsReview','class:'+id,name+' · добавлена или удалена профессия');
     continue;
    }
    const changed=[...new Set([...Object.keys(old),...Object.keys(now)])]
     .filter(field=>!same(old[field],now[field]));
    const textual=['name','nameEn','desc','descEn'];
    const modeled=['hp','mp','statCaps','baseClass'];
    if(changed.every(field=>textual.includes(field)))
     add('sourceOnly','class:'+id,name+' · изменён текст');
    else if(changed.every(field=>modeled.includes(field)||textual.includes(field)))
     add('verified','class:'+id,name+' · проверены базовые расчёты ОЗ/ОМ и характеристик');
    else add('needsReview','class:'+id,name+' · изменились связи или пределы мастерства');
   }
   continue;
  }
  if(dataset==='tables'){
   const fields=new Set([...Object.keys(oldData||{}),...Object.keys(newData||{})]);
   for(const field of fields){
    if(same(oldData?.[field],newData?.[field]))continue;
    if(['abilityPoint','raceInit','jobInit'].includes(field))
     add('verified','table:'+field,'Игровые таблицы · '+field+' · базовая прокачка проверена');
    else if(['levelCap','expCap'].includes(field))
     add('sourceOnly','table:'+field,'Игровые таблицы · '+field+' · сведения сервера');
    else add('needsReview','table:'+field,'Игровые таблицы · '+field+' · боевые/игровые коэффициенты');
   }
   continue;
  }
  if(dataset==='skills'){
   const ids=new Set([...Object.keys(oldData||{}),...Object.keys(newData||{})]);
   for(const id of ids){
    const old=oldData?.[id],now=newData?.[id];
    if(same(old,now))continue;
    const name=String(now?.name||old?.name||id).slice(0,90);
    if(!old||!now||!same(old.funcs,now.funcs)){
     add('needsReview','skill:'+id,name+' · изменены игровые эффекты');
    }else if(!same(old.damage,now.damage)||!same(old.weaponUse,now.weaponUse)||
      // A prerequisite chain or the stat driving the effect can change
      // the actual result without changing funcs/FV vectors.
      !same(old.prereq,now.prereq)||!same(old.powerStat,now.powerStat)||
      !same(old.skillType,now.skillType)||!same(old.element,now.element)||
      !same(old.aoe,now.aoe)||!same(old.rangeFromWeapon,now.rangeFromWeapon)){
     add('needsReview','skill:'+id,name+' · изменены условия действия или источник урона');
    }else{
     add('sourceOnly','skill:'+id,name+' · обновлены условия/описание навыка');
    }
   }
   continue;
  }
  if(dataset==='items'||dataset==='souls'||dataset==='racialPassives'){
   const ids=new Set([...Object.keys(oldData||{}),...Object.keys(newData||{})]);
   for(const id of ids){
    const old=oldData?.[id],now=newData?.[id];
    if(same(old,now))continue;
    const name=String(now?.name||old?.name||id).slice(0,90);
    const looksTextual=old&&now&&
     // A text-only edit must not be treated as a changed gameplay modifier.
     same(Object.fromEntries(Object.entries(old).filter(([k])=>
      !['name','nameEn','desc','descEn'].includes(k))),
     Object.fromEntries(Object.entries(now).filter(([k])=>
      !['name','nameEn','desc','descEn'].includes(k))));
    add(looksTextual?'sourceOnly':'needsReview',dataset+':'+id,
     name+(looksTextual?' · тексты':' · свойства/эффекты'));
   }
   continue;
  }
  add('sourceOnly',dataset,'Раздел «'+dataset+'»: структурно проверенные данные');
 }
 return {totals,samples:issues,requiresMechanicReview:totals.needsReview>0};
}

// Re-run EXISTING calculator models against both source snapshots, before D1.
// These are deterministic representative projections (no equipment, no buffs),
// not game-server damage measurements. A previously displayed numeric result
// must not silently disappear after updating a skill's source contract.
function replaySkills(before,after){
 const changed=new Set();
 const oldSkills=before?.skills||{},newSkills=after?.skills||{};
 const fields=['funcs','damage','weaponUse','prereq','powerStat','skillType',
  'element','aoe','rangeFromWeapon','classes','charLevel','reqs',
  'reqLevel','branch','branchRaw','isLevelBased','learnable'];
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 for(const id of new Set([...Object.keys(oldSkills),...Object.keys(newSkills)])){
  const prev=oldSkills[id],next=newSkills[id];
  if(!prev||!next||fields.some(field=>!same(prev[field],next[field])))
   changed.add(id);
 }
 // Updated class caps can invalidate an unchanged, otherwise modeled skill.
 const oldClasses=before?.classes||{},newClasses=after?.classes||{};
 const alteredJobs=new Set([...Object.keys(oldClasses),...Object.keys(newClasses)]
  .filter(job=>!same(oldClasses[job],newClasses[job])));
 if(alteredJobs.size)
  for(const [id,skill] of Object.entries(oldSkills))
   if([...alteredJobs].some(job=>skill?.classes?.[job]))changed.add(id);
 if(!changed.size)return {ok:true,changedSkills:0,scenarios:0,
  previouslyModeled:0,retained:0,lost:0,unmodeled:0,samples:[],errors:[]};
 const calc=root.PandoraOSCalculator;
 if(!calc||!['base','scalingSkillPreview','healingSpellsPreview','periodicRecoveryPreview',
  'resistanceSkillChoices'].every(name=>typeof calc[name]==='function'))
  return {ok:false,changedSkills:changed.size,scenarios:0,
   previouslyModeled:0,retained:0,lost:0,unmodeled:changed.size,samples:[],
   errors:['Не подключены проверенные расчётные модели навыков.']};
 const scenarios=[{level:15,allocation:{},},{level:45,allocation:
  {vit:6,str:12,agi:6,dex:12,spi:10,int:12}},
  {level:55,allocation:{vit:10,str:18,agi:10,dex:18,spi:14,int:18}}];
 const equipment=[['BARE_HAND',false],['1H_SWORD',true],['CROSSBOW',false],['STAFF',false]];
 const measure=data=>{
  const found=new Map(),errors=[];
  let count=0;
  const classes=data?.classes||{},tables=data?.tables||{},skills=data?.skills||{};
  const human=tables.raceInit?.HUMAN;
  if(!human)return {found,count,errors:['Нет данных расы человека для проверочных билдов.']};
  for(const [job,definition] of Object.entries(classes)){
   if(![...changed].some(id=>skills[id]?.classes?.[job]))continue;
   const origin=tables.jobInit?.[definition?.baseClass||job];
   const caps=definition?.branchCaps;
   if(!origin||!caps){errors.push('Нет исходных характеристик или мастерства '+job);continue}
   const mastery=Object.fromEntries(Object.entries(caps).map(([key,value])=>
    [key,Number.isSafeInteger(value)&&value>=0?value:0]));
   for(const scenario of scenarios){
    const {level,allocation}=scenario;
    const base=calc.base({classData:definition,raceData:human,jobData:origin,
     allocation,level,records:[],combatContext:{jobKey:job}});
    if(!base?.stats||!base?.combat){
     errors.push('Не удалось рассчитать контрольного героя '+job+' / '+level);
     continue;
    }
    count++;
    const write=(id,module,detail,value)=>{
     if(!changed.has(String(id))||!Number.isFinite(value))return;
     found.set([id,module,job,level,detail].join('|'),{
      id:String(id),job,level,module,detail,value});
    };
    for(const [weaponKind,hasShield] of equipment){
     const result=calc.scalingSkillPreview({skillCatalog:skills,jobKey:job,level,
      branchCaps:caps,branchMasteries:mastery,stats:base.stats,combat:base.combat,
      weaponKind,hasShield});
     if(!result||!['offense','defense','movement','utility'].every(key=>
      Array.isArray(result[key]))){
      errors.push('Нет расчёта умений '+job+' / '+level);continue;
     }
     for(const group of ['offense','defense','movement','utility'])
      for(const row of result[group]){
       if(row?.available===false)continue;
       write(row.id,'skill-effects',weaponKind,row.amount);
      }
    }
    const healing=calc.healingSpellsPreview({skillCatalog:skills,jobKey:job,level,
     benevolenceCap:mastery.benevolence||0,
     benevolence:mastery.benevolence||0,int:base.stats.int,spi:base.stats.spi,
     healingPercent:100});
    for(const row of healing?.rows||[])
     if(row.available)write(row.skillId,'healing','no-equipment',row.amount);
    const periodic=calc.periodicRecoveryPreview({skillCatalog:skills,jobKey:job,level,
     benevolenceCap:mastery.benevolence||0,benevolence:mastery.benevolence||0,
     spi:base.stats.spi});
    for(const row of periodic?.rows||[])
     if(row.available)write(row.id,'periodic-recovery','no-equipment',row.amount);
   }
  }
  // Target-side signed resistances have a separate, source-gated inspector.
  // They are not automatically equipped as self-buffs or final hit chances.
  for(const row of calc.resistanceSkillChoices(skills)||[]){
   if(!changed.has(String(row?.id)))continue;
   const values=Object.values(row.effects||{});
   if(!values.length||!values.every(Number.isFinite))continue;
   found.set([row.id,'target-resistance'].join('|'),{
    id:String(row.id),job:'target',level:null,module:'target-resistance',
    detail:'recipient',value:JSON.stringify(row.effects)});
  }
  return {found,count,errors};
 };
 let prior,next;
 try{prior=measure(before);next=measure(after)}
 catch(error){
  return {ok:false,changedSkills:changed.size,scenarios:0,
   previouslyModeled:0,retained:0,lost:0,unmodeled:changed.size,samples:[],
   errors:['Ошибка контрольного пересчёта: '+String(error?.message||error).slice(0,160)]};
 }
 const lost=[],retained=[];
 for(const [key,old] of prior.found){
  const latest=newSkills[old.id];
  // Removed skills, classes and newly restricted skill levels are source
  // changes, not a silent regression in an unchanged numeric formula.
  if(!latest||old.job!=='target'&&
   (!latest.classes?.[old.job]||Number(latest.charLevel||0)>old.level))
   continue;
  if(next.found.has(key))retained.push(old);
  else lost.push(old);
 }
 const recognized=new Set([...prior.found.values(),...next.found.values()].map(x=>x.id));
 const problems=[...prior.errors,...next.errors];
 return {ok:lost.length===0&&problems.length===0,
  changedSkills:changed.size,scenarios:prior.count+next.count,
  previouslyModeled:prior.found.size,retained:retained.length,
  lost:lost.length,unmodeled:[...changed].filter(id=>!recognized.has(id)).length,
  samples:lost.slice(0,5).map(row=>({...row,name:String(
   newSkills[row.id]?.name||oldSkills[row.id]?.name||row.id).slice(0,75)})),
  errors:problems.slice(0,5)};
}

root.PandoraCatalogSafety=Object.freeze({MAX_LEVEL,EXPECTED,check,project,compare,compatibility,replaySkills});
})(typeof window==='undefined'?globalThis:window);

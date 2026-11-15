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
 // Exercise real attribute and basic HP/MP models for every race/class pair;
 // the checks never assume the server levelCap is the planner maximum.
 for(const [klass,definition] of Object.entries(classes)){
  const rootClass=definition?.baseClass||klass;
  for(const race of races){
   const sample=attributes.snapshot({
    tables,race,klass:rootClass,level:max,
    added:[0,0,0,0,0,0],caps:definition?.statCaps
   });
   const hp=sample&&calculator.classBase(definition?.hp,max,sample.values[0],'vit');
   const mp=sample&&calculator.classBase(definition?.mp,max,sample.values[4],'spi');
   if(!sample||sample.total!==actualPoints||!Number.isFinite(hp)||!Number.isFinite(mp)){
    issues.push('Не рассчитан герой '+klass+' / '+race+' на '+max+'-м уровне.');
    if(issues.length>=8)break;
   }
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
  if(dataset==='classes'||dataset==='tables'){
   add('verified',dataset,dataset==='classes'?'Профессии: базовые ОЗ/ОМ и ограничения':
    'Таблицы: очки характеристик и умений');
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
    }else if(!same(old.damage,now.damage)||!same(old.weaponUse,now.weaponUse)){
     add('needsReview','skill:'+id,name+' · изменена механика урона или оружия');
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
root.PandoraCatalogSafety=Object.freeze({MAX_LEVEL,EXPECTED,check,project,compare,compatibility});
})(typeof window==='undefined'?globalThis:window);

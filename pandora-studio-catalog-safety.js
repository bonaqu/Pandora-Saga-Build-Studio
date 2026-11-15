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

// A source item's physical W or armor AC is a supported numeric input, not
// a newly invented EP formula. Only direct W/AC changes with every other
// gameplay field intact can be confirmed by the existing calculator.
// This proves model compatibility, NOT actual server damage/mitigation.
function replaySimpleEquipmentChange(id,old,now,before,after){
 const C=root.PandoraOSCalculator;
 if(!old||!now||String(old.id)!==String(id)||String(now.id)!==String(id)||
  !C||typeof C.weaponAttackPreview!=='function'||
  typeof C.defensePreview!=='function'||typeof C.sourceEffects!=='function')
  return false;
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const editorial=['name','nameEn','desc','descEn','sourceDesc'];
 const changed=[...new Set([...Object.keys(old),...Object.keys(now)])]
  .filter(key=>!same(old[key],now[key]));
 if(!changed.some(field=>['W','AC'].includes(field))||
  changed.some(field=>!['W','AC',...editorial].includes(field)))return false;
 // Narrative fallback can contain numeric refinement. Treat any change
 // in actual sourceEffects at ANY grade as a separate mechanism risk.
 for(let grade=0;grade<=10;grade++)
  if(!same(C.sourceEffects('item:'+id,old,grade,before?.itemForth),
   C.sourceEffects('item:'+id,now,grade,after?.itemForth)))return false;
 if(changed.includes('W')){
  if(old.slot!=='weapon'||now.slot!=='weapon'||
   !Number.isFinite(old.W)||!Number.isFinite(now.W))return false;
  for(const str of [20,50,100])for(const grade of [0,5,10]){
   const a=C.weaponAttackPreview({str,weapon:old,grade,
    weaponPlus:before?.tables?.weaponPlus});
   const b=C.weaponAttackPreview({str,weapon:now,grade,
    weaponPlus:after?.tables?.weaponPlus});
   if(!Number.isFinite(a?.known)||!Number.isFinite(b?.known))return false;
  }
 }
 if(changed.includes('AC')){
  const slots=['shield','head','body','gloves','legs','feet'];
  if(!slots.includes(old.slot)||old.slot!==now.slot||
   !Number.isFinite(old.AC)||!Number.isFinite(now.AC))return false;
  for(const grade of [0,5,10]){
   const a=C.defensePreview({records:[['item:'+id,old,grade]],
    itemForth:before?.itemForth});
   const b=C.defensePreview({records:[['item:'+id,now,grade]],
    itemForth:after?.itemForth});
   if(!Number.isFinite(a?.known)||!Number.isFinite(b?.known))return false;
  }
 }
 return true;
}
function sourceEquipmentEffectsChanged(id,old,now,before,after){
 const C=root.PandoraOSCalculator;
 const text=String(old?.desc||old?.sourceDesc||'')+' '+
  String(now?.desc||now?.sourceDesc||'');
 // In a partial/headless caller without the module, fail closed only for
 // narrative refinement wording; plain descriptions stay editorial.
 if(typeof C?.sourceEffects!=='function')
  return /За каждые\s+\d+\s+единиц[ыу]\s+улучшения|При улучшении на\s*\+\d+/i.test(text);
 for(let grade=0;grade<=10;grade++)
  if(JSON.stringify(C.sourceEffects('item:'+id,old,grade,before?.itemForth))!==
     JSON.stringify(C.sourceEffects('item:'+id,now,grade,after?.itemForth)))
   return true;
 return false;
}


// Prove that a concrete source EP amount is consumed by an EXISTING numeric
// calculator path. Unknown EP codes, boolean flags and procs do not qualify.
// A secondary-effect inspector returns a source parameter, not final damage.
function modeledEquipmentEffect(source,record,grade,effect){
 const C=root.PandoraOSCalculator;
 if(!Number.isFinite(effect?.a)||typeof effect?.func!=='string'||
  !C||!['gatherEffects','equippedCombatModifiers','secondaryEffectsPreview',
    'defensePreview'].every(name=>typeof C[name]==='function'))return false;
 if(Number.isFinite(effect.min)&&grade<effect.min ||
    Number.isFinite(effect.max)&&grade>effect.max)return false;
 const isolated={id:record?.id,slot:record?.slot,AC:record?.AC,
  effects:[effect]};
 const rows=[[source,isolated,grade]],matches=entry=>
  entry?.source===source&&entry?.func===effect.func&&entry?.value===effect.a;
 if(C.gatherEffects(rows).trace.some(matches))return true;
 if(C.equippedCombatModifiers(rows).traces.some(entry=>
  entry?.source===source&&entry?.ep===effect.func&&entry?.value===effect.a))
  return true;
 if(C.secondaryEffectsPreview({records:rows}).traces.some(entry=>
  entry?.source===source&&entry?.ep===effect.func&&
  Number.isFinite(entry?.value)))return true;
 if(!['EP_ARMORCLASS_CONST','EP_ARMORCLASS_SCALE'].includes(effect.func))
  return false;
 // A Soul can boost armor while its own AC is intentionally ignored.
 // Supply a separate baseline armor piece to exercise the *real* model.
 const context=[['item:999999',{id:999999,slot:'body',name:'Контрольная броня',
  AC:100,effects:[]},0],...rows];
 const defense=C.defensePreview({records:context});
 if(!Number.isFinite(defense?.known))return false;
 return effect.func==='EP_ARMORCLASS_CONST'?
  Number.isFinite(defense.equipment):
  defense.percentParts.some(row=>row.source===source&&row.rate===effect.a);
}

// An effect amount-only update is data-driven when its exact EP channel is
// already modeled and its direction, grade bounds and other semantics stay
// unchanged. Validate each changed row at every grade where it is active.
function replayNumericEquipmentAmounts(dataset,id,old,now){
 const C=root.PandoraOSCalculator;
 if(!old||!now||String(old.id)!==String(id)||String(now.id)!==String(id)||
  !C||!Array.isArray(old.effects)||!Array.isArray(now.effects)||
  old.effects.length===0||old.effects.length!==now.effects.length)return false;
 const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
 const editorial=dataset==='souls'?['name','nameEn','desc','descEn']:
  ['name','nameEn'];
 const fields=new Set([...Object.keys(old),...Object.keys(now)]);
 if([...fields].some(field=>field!=='effects'&&!editorial.includes(field)&&
  !same(old[field],now[field])))return false;
 const source=(dataset==='souls'?'soul:':'item:')+id;
 let changed=0;
 for(let i=0;i<old.effects.length;i++){
  const a=old.effects[i],b=now.effects[i];
  if(same(a,b))continue;
  if(!validObject(a)||!validObject(b)||
    !Number.isFinite(a.a)||!Number.isFinite(b.a)||a.a===b.a||
    [...new Set([...Object.keys(a),...Object.keys(b)])]
     .some(key=>key!=='a'&&!same(a[key],b[key])))return false;
  let exercised=false;
  for(let grade=0;grade<=10;grade++){
   if(Number.isFinite(a.min)&&grade<a.min ||
      Number.isFinite(a.max)&&grade>a.max)continue;
   if(!modeledEquipmentEffect(source,old,grade,a)||
      !modeledEquipmentEffect(source,now,grade,b))return false;
   exercised=true;
  }
  if(!exercised)return false;
  changed++;
 }
 return changed>0;
}

// Read-only effect-contract replay on every changed item/Soul/Forth source.
// Explicit removal of a gameplay effect remains a reviewable source change.
// However, replacing an already numeric EP with an unknown new EP must stop
// publication; merely clicking the risk checkbox cannot recover its bonus.
function replayEquipmentEffects(before,after){
 const C=root.PandoraOSCalculator;
 const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
 const affected=new Map();
 for(const dataset of ['items','souls']){
  for(const id of new Set([...Object.keys(before?.[dataset]||{}),
    ...Object.keys(after?.[dataset]||{})])){
   if(!same(before?.[dataset]?.[id],after?.[dataset]?.[id]))
    affected.set(dataset+':'+id,{dataset,id});
  }
 }
 for(const id of new Set([...Object.keys(before?.itemForth||{}),
  ...Object.keys(after?.itemForth||{})]))
  if(!same(before?.itemForth?.[id],after?.itemForth?.[id]))
   affected.set('items:'+id,{dataset:'items',id});
 if(!affected.size)return {ok:true,changedSources:0,scenarios:0,
  oldModeled:0,retained:0,lost:0,unknown:0,samples:[],errors:[]};
 if(!C||!['sourceEffects','gatherEffects','equippedCombatModifiers',
  'secondaryEffectsPreview','defensePreview'].every(name=>
   typeof C[name]==='function'))
  return {ok:false,changedSources:affected.size,scenarios:0,oldModeled:0,
   retained:0,lost:0,unknown:0,samples:[],errors:[
    'Не подключены расчётные модули предметов и душ.']};
 const lost=[],seen=new Set(),errors=[];
 let scenarios=0,oldModeled=0,retained=0,unknown=0;
 try{
  for(const {dataset,id} of affected.values()){
   const old=before?.[dataset]?.[id],now=after?.[dataset]?.[id];
   if(!old||!now)continue; // Explicit deletion/addition, not a hidden model failure.
   const source=(dataset==='souls'?'soul:':'item:')+id;
   for(let grade=0;grade<=10;grade++){
    const prior=C.sourceEffects(source,old,grade,before?.itemForth);
    const next=C.sourceEffects(source,now,grade,after?.itemForth);
    if(same(prior,next))continue;
    scenarios++;
    // Count effects per EP, not just existence. A second copy of a
    // supported EP must not disappear merely because the first survived.
    const modeledCounts=new Map();
    for(const effect of prior){
     if(!modeledEquipmentEffect(source,old,grade,effect))continue;
     modeledCounts.set(effect.func,(modeledCounts.get(effect.func)||0)+1);
    }
    for(const [ep,count] of modeledCounts){
     oldModeled+=count;
     const sameCode=next.filter(row=>row?.func===ep);
     const kept=sameCode.filter(row=>
      modeledEquipmentEffect(source,now,grade,row)).length;
     retained+=Math.min(count,kept);
     if(kept>=count)continue;
     // Explicit removal is a reviewable change in the game source, not
     // a claim that a new unknown code is supported by the calculator.
     const replacement=next.find(row=>!prior.some(prev=>prev?.func===row?.func));
     const unknownReplacement=replacement&&
      !modeledEquipmentEffect(source,now,grade,replacement);
     if(kept===sameCode.length&&!unknownReplacement)continue;
     const key=source+':'+ep+':'+grade;
     if(seen.has(key))continue;
     seen.add(key);
     lost.push({key:source,name:String(now.name||old.name||id).slice(0,90),
      grade,previous:ep,next:replacement?.func||ep});
    }
    for(const effect of next)
     if(!prior.some(row=>same(row,effect))&&
      !modeledEquipmentEffect(source,now,grade,effect))unknown++;
   }
  }
 }catch(error){
  errors.push('Контроль эффектов экипировки: '+
   String(error?.message||error).slice(0,140));
 }
 return {ok:lost.length===0&&errors.length===0,changedSources:affected.size,
  scenarios,oldModeled,retained,lost:lost.length,unknown,
  samples:lost.slice(0,5),errors};
}


// Additive Forth refinement can be data-only when its *existing* effect
// identity, step boundaries, direction and every nonnumeric field are stable.
// Both old and new 0..10 snapshots must pass the active numeric calculator;
// unknown procs and newly introduced step semantics stay review-only.
function verifiedForthAmountChanges(id,oldForth,newForth,before,after){
 const C=root.PandoraOSCalculator;
 const item=before?.items?.[id],updated=after?.items?.[id];
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 if(!C?.sourceEffects||!item||!updated||
  String(item.id)!==String(id)||!same(item,updated)||
  !validObject(oldForth)||!validObject(newForth))return false;
 const grades=Object.keys(oldForth).sort((a,b)=>Number(a)-Number(b));
 if(!grades.length||!same(grades,
  Object.keys(newForth).sort((a,b)=>Number(a)-Number(b))))return false;
 let changed=0;
 const source='item:'+id;
 for(const level of grades){
  if(!Number.isSafeInteger(Number(level))||Number(level)<1||
   Number(level)>10||String(Number(level))!==level)return false;
  const oldRows=oldForth[level],newRows=newForth[level];
  if(!Array.isArray(oldRows)||!Array.isArray(newRows)||
   oldRows.length!==newRows.length)return false;
  for(let i=0;i<oldRows.length;i++){
   const a=oldRows[i],b=newRows[i];
   if(same(a,b))continue;
   if(!validObject(a)||!validObject(b)||
    !Number.isFinite(a.a)||!Number.isFinite(b.a)||a.a===b.a||
    [...new Set([...Object.keys(a),...Object.keys(b)])].some(key=>
     key!=='a'&&!same(a[key],b[key])))return false;
   if(!modeledEquipmentEffect(source,item,Number(level),a)||
    !modeledEquipmentEffect(source,updated,Number(level),b))return false;
   changed++;
  }
 }
 if(!changed)return false;
 for(let grade=0;grade<=10;grade++){
  const a=C.sourceEffects(source,item,grade,before.itemForth);
  const b=C.sourceEffects(source,updated,grade,after.itemForth);
  if(a.length!==b.length)return false;
  for(let i=0;i<a.length;i++){
   if(same(a[i],b[i]))continue;
   if(!validObject(a[i])||!validObject(b[i])||
    !Number.isFinite(a[i].a)||!Number.isFinite(b[i].a)||
    [...new Set([...Object.keys(a[i]),...Object.keys(b[i])])]
     .some(key=>key!=='a'&&!same(a[i][key],b[i][key])))return false;
   if(!modeledEquipmentEffect(source,item,grade,a[i])||
    !modeledEquipmentEffect(source,updated,grade,b[i]))return false;
  }
 }
 return true;
}


// An explicitly registered coefficient preview can read a revised FV1 number
// with no code change. Before saying "model supported", prove that BOTH
// source shapes match the calculator's exact declared contract and that its
// actual old/new preview changes on an eligible class + mastery combination.
// Other skills still need review even when their FV arrays look similar.
function verifiedDynamicSkillFV(id,old,now,before,after){
 const C=root.PandoraOSCalculator,contract=C?.dynamicSkillContracts?.[id];
 if(!contract||!old||!now||old.id!==now.id||String(old.id)!==String(id)||
  !C?.dynamicSkillSourceMatches||!C?.scalingSkillPreview||
  !C.dynamicSkillSourceMatches(old,contract.ep,contract.fv1)||
  !C.dynamicSkillSourceMatches(now,contract.ep,contract.fv1))return false;
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const fields=new Set([...Object.keys(old),...Object.keys(now)]);
 if([...fields].some(key=>!['funcs','name','nameEn','desc','descEn'].includes(key)&&
  !same(old[key],now[key])))return false;
 const prev=old.funcs[0],next=now.funcs[0];
 if(same(prev.fv1,next.fv1)||
  [...new Set([...Object.keys(prev),...Object.keys(next)])]
   .some(key=>key!=='fv1'&&!same(prev[key],next[key]))||
  old.funcs.length!==now.funcs.length||
  old.funcs.slice(1).some((record,i)=>!same(record,now.funcs[i+1])))
  return false;
 // Only the stat, mastery and constant lanes already consumed by this
 // specific coefficient model can move. The reserved FV1[1] stays zero.
 if(prev.fv1[1]!==next.fv1[1]||
  contract.fv1[0]===0&&prev.fv1[0]!==next.fv1[0]||
  contract.fv1[2]===0&&prev.fv1[2]!==next.fv1[2])return false;
 const stats={vit:80,str:100,agi:100,dex:90,spi:100,int:100};
 const combat={attack:{walkingBase:200},defense:{directRaw:100},
  accuracy:{base:140},dodge:{base:120}};
 const get=(catalog,job,level,caps,masteries)=>{
  const model=C.scalingSkillPreview({skillCatalog:catalog,jobKey:job,level,
   branchCaps:caps,branchMasteries:masteries,stats,combat,
   weaponKind:'BARE_HAND',hasShield:true});
  const row=[...(model.offense||[]),...(model.defense||[]),
   ...(model.movement||[]),...(model.utility||[])].find(x=>String(x.id)===id);
  const models=row?.coefficientModels||[];
  // A multi-effect skill is only safe when EVERY independently modeled
  // dependent vector remains present, not just its primary coefficient.
  if(!models.some(x=>x.ep===contract.ep&&Number.isFinite(x.amount))||
   !contract.additional.every(effect=>!effect.modeled||
    models.some(x=>x.ep===effect.ep&&Number.isFinite(x.amount))))return null;
  return Number.isFinite(row?.amount)?row.amount:null;
 };
 const classes=before?.classes||{};
 for(const [job,klass] of Object.entries(classes)){
  if(!old.classes?.[job]||!now.classes?.[job]||
   !after?.classes?.[job])continue;
  const caps=klass?.branchCaps;
  if(!validObject(caps)||!Number.isSafeInteger(caps[contract.branch])||
   caps[contract.branch]<=0)continue;
  const masters=Object.fromEntries(Object.entries(caps).map(([key,value])=>
   [key,Number.isSafeInteger(value)&&value>=0?value:0]));
  for(const level of [45,55]){
   const a=get(before.skills,job,level,caps,masters);
   const b=get(after.skills,job,level,after.classes[job]?.branchCaps,masters);
   if(Number.isFinite(a)&&Number.isFinite(b)&&a!==b)return true;
  }
 }
 return false;
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
    if(!old||!now){
     add('needsReview','skill:'+id,name+' · добавлен или удалён навык');
    }else if(!same(old.funcs,now.funcs)){
     const dynamic=verifiedDynamicSkillFV(id,old,now,before,after);
     add(dynamic?'verified':'needsReview','skill:'+id,
      name+(dynamic?' · проверено изменение FV действующей формулой':
       ' · изменены игровые эффекты'));
    }else if([...new Set([...Object.keys(old),...Object.keys(now)])]
     .some(field=>!['name','nameEn','desc','descEn','iconId'].includes(field)&&
      !same(old[field],now[field]))){
     // Explicit allow-list for presentation changes; new/unrecognized
     // gameplay fields (including cast/cooldown/mana) fail closed.
     add('needsReview','skill:'+id,
      name+' · изменены игровые параметры, механика или доступность');
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
    const numerical=(dataset==='items'&&
     replaySimpleEquipmentChange(id,old,now,before,after))||
     ((dataset==='items'||dataset==='souls')&&
     replayNumericEquipmentAmounts(dataset,id,old,now));
    const narrativeChanged=dataset==='items'&&looksTextual&&
     sourceEquipmentEffectsChanged(id,old,now,before,after);
    const category=numerical?'verified':
     looksTextual&&!narrativeChanged?'sourceOnly':'needsReview';
    add(category,dataset+':'+id,
     name+(numerical?' · известные числовые бонусы рассчитаны моделью':
      category==='sourceOnly'?' · тексты':
      narrativeChanged?' · текст меняет бонусы заточки':
      ' · свойства/эффекты'));
   }
   continue;
  }
  if(dataset==='itemForth'){
   const ids=new Set([...Object.keys(oldData||{}),...Object.keys(newData||{})]);
   for(const id of ids){
    const a=oldData?.[id],b=newData?.[id];
    if(same(a,b))continue;
    const name=String(after?.items?.[id]?.name||before?.items?.[id]?.name||id).slice(0,90);
    const numeric=verifiedForthAmountChanges(id,a,b,before,after);
    add(numeric?'verified':'needsReview','itemForth:'+id,
     name+(numeric?' · известные бонусы заточки рассчитаны':
      ' · изменена механика улучшения'));
   }
  }else if(['unison','expertise'].includes(dataset))
   add('needsReview',dataset,'Раздел «'+dataset+'»: изменены игровые бонусы или мастерство');
  else add('sourceOnly',dataset,'Раздел «'+dataset+'»: структурно проверенные данные');
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
 // Track any gameplay-field changes, including previously overlooked timing,
 // cost and future unknown fields; ignore only user-visible presentation.
 const displayOnly=new Set(['name','nameEn','desc','descEn','iconId']);
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 for(const id of new Set([...Object.keys(oldSkills),...Object.keys(newSkills)])){
  const prev=oldSkills[id],next=newSkills[id];
  if(!prev||!next||[...new Set([...Object.keys(prev),...Object.keys(next)])]
   .some(field=>!displayOnly.has(field)&&!same(prev[field],next[field])))
   changed.add(id);
 }
 // Updated class caps can invalidate an unchanged, otherwise modeled skill.
 const oldClasses=before?.classes||{},newClasses=after?.classes||{};
 const alteredJobs=new Set([...Object.keys(oldClasses),...Object.keys(newClasses)]
  .filter(job=>!same(oldClasses[job],newClasses[job])));
 if(alteredJobs.size)
  for(const [id,skill] of Object.entries(oldSkills))
   if([...alteredJobs].some(job=>skill?.classes?.[job]))changed.add(id);
 // Prerequisites are only ONE kind of skill relationship. Internal
 // EP_SKILL_EXEC / on-hit actions and toggle/song stage IDs frequently have
 // no class and no prereq, yet their source controls a modeled parent.
 // Traverse the union of OLD and CANDIDATE signed ID graphs in both
 // directions, so a child-only edit always replays its owning skill.
 const relatives=new Map();
 const link=(a,b)=>{
  if(a===b)return;
  if(!relatives.has(a))relatives.set(a,new Set());
  if(!relatives.has(b))relatives.set(b,new Set());
  relatives.get(a).add(b);
  relatives.get(b).add(a);
 };
 // The three additional IDs are pinned by existing source-signature
 // inspectors: diffusion, parry counter, and shield/block break. Do not
 // treat arbitrary non-skill FV values as a graph edge.
 const linkedEP=new Set(['EP_SKILL_EXEC','EP_ONHIT_SKILL_EXEC',
  'EP_ONHIT_SKILL_EXEC_CHANGE_BA','EP_SKILL_EXEC_COUNT',
  'EP_SKILL_EXEC_DIFFUSION','EP_SKILL_PARRY_COUNTER',
  'EP_ATTACK_BLOCK_BREAK']);
 for(const skills of [oldSkills,newSkills])
  for(const [id,record] of Object.entries(skills)){
   if(Number.isSafeInteger(record?.prereq)&&record.prereq>0&&
    skills[String(record.prereq)])
    link(id,String(record.prereq));
   for(const effect of record?.funcs||[]){
    if(!linkedEP.has(effect?.ep))continue;
    const linked=effect?.fv1?.[3];
    if(Number.isSafeInteger(linked)&&linked>0&&skills[String(linked)])
     link(id,String(linked));
   }
  }
 // Preserve the explicitly edited IDs for actionable regression reports.
 // A single internal effect can otherwise drown in the five sampled parents.
 const directlyChanged=new Set(changed);
 const pending=[...changed];
 for(let i=0;i<pending.length;i++)
  for(const relative of relatives.get(pending[i])||[])
   if(!changed.has(relative)){
    changed.add(relative);
    pending.push(relative);
   }
 // Consumables may invoke unlearnable skills without a class/prereq.
 // Inspect both old and selected item->skill source links, and explicitly
 // changed item effects. These are source-only descriptions, NOT proof
 // that the server actually applies a skill or cures a status.
 const changedItems=new Set();
 const oldItems=before?.items||{},newItems=after?.items||{};
 if(before?.items&&after?.items){
  const links=item=>(item?.effects||[]).filter(e=>
   ['EP_SKILL_EXEC','EP_SKILL_EXEC_BALM'].includes(e?.func)&&
   e.dir==='TARGET'&&Number.isSafeInteger(e.a)&&e.a>0)
   .map(e=>String(e.a));
  for(const id of new Set([...Object.keys(oldItems),...Object.keys(newItems)])){
   const old=oldItems[id],now=newItems[id];
   if(!old||!now)continue;
   const sourceLinks=[...links(old),...links(now)];
   const itemEffectsChanged=!same(old.effects,now.effects);
   const relevant=itemEffectsChanged&&(
    sourceLinks.length>0||(old.effects||[]).some(e=>
     typeof e?.func==='string'&&e.func.startsWith('EP_RECOVERY_'))||
    (now.effects||[]).some(e=>
     typeof e?.func==='string'&&e.func.startsWith('EP_RECOVERY_')));
   if(relevant||sourceLinks.some(key=>changed.has(key)))
    changedItems.add(String(id));
  }
 }
 if(!changed.size&&!changedItems.size)return {ok:true,changedSkills:0,scenarios:0,
  previouslyModeled:0,retained:0,lost:0,unmodeled:0,samples:[],errors:[]};
 const calc=root.PandoraOSCalculator;
 if(!calc||!['base','scalingSkillPreview','healingSpellsPreview','periodicRecoveryPreview',
  'resistanceSkillChoices','alliedRecipientPreviews','priestCastPreviews',
  'trapSkillCostPreview','craftingSkillPreview','rangedAmmoPreview',
  'supportEffectPreview','situationalSkillPreview',
  'consumableSkillPreview','statusCurePreview',
  'complexSkillSourcePreview','statusApplicationPreview','enemyDebuffPreview',
  'tacticalSkillPreview','combatTechniquePreview','specializedSkillPreview',
  'songSkillPreview','skillExecutionChains']
  .every(name=>typeof calc[name]==='function'))
  return {ok:false,changedSkills:changed.size,scenarios:0,
   previouslyModeled:0,retained:0,lost:0,unmodeled:changed.size,samples:[],
   errors:['Не подключены проверенные расчётные модели навыков.']};
 const scenarios=[{level:15,allocation:{},},{level:45,allocation:
  {vit:6,str:12,agi:6,dex:12,spi:10,int:12}},
  {level:55,allocation:{vit:10,str:18,agi:10,dex:18,spi:14,int:18}}];
 const equipment=[['BARE_HAND',false],['1H_SWORD',true],['CROSSBOW',false],['STAFF',false]];
 // A recipient can receive buffs from ANOTHER class. These verified,
 // source-gated previews must be replayed independently of hero job access.
 // Each listed ID is consumed by the CURRENT calculator implementation;
 // song stages are explicit links rather than guessed prereq relationships.
 const recipientSources=[
  ['warCry',[320001001]],['massConcentration',[100055001]],
  ['windAssist',[260006001]],['windBlessing',[320004001]],
  ['divineBlessing',[330004001]],['blessedRepose',[320002001]]
 ];
 const priestSources=[
  ['gratia',[320007001]],['lapisMedio',[320008001]],
  ['encouragement',[320012001]],['groupBarrier',[320003001]],
  ['holyWeapon',[330051001]],['holyEnhanced',[330051001,320011001]],
  ['enchantAuraRate',[320011001]],['enchantAuraFlat',[320011001]],
  ['enchantElementRate',[320011001]],
  ['peaceful',[340003001,340003002,340003003]],
  ['minstrel',[340001001,340001002,340001003]],
  ['sage',[340004001,340004002,340004003]],
  ['sageCooldownDelta',[340004001,340004002,340004003]]
 ];
 const watches=(sources)=>sources.some(([,ids])=>
  ids.some(id=>changed.has(String(id))));
 const replayRecipient=watches(recipientSources),
  replayPriest=watches(priestSources);
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
   // Compare the *existence* of source-proven Encyclopedia rows as
   // evidence, never as numeric damage, chance, duration, or buffs.
   // Use the calculator's existing exact source-signature guards instead
   // of duplicating their EP/FV contracts in the publication layer.
   // Level 55 is an inspection boundary, NOT a server level-cap claim.
   const evidence=(module,result,groups,variant='standard')=>{
    if(!result||groups.some(group=>!Array.isArray(result[group]))){
     errors.push('Нет проверки исходных эффектов '+module+' / '+job);
     return;
    }
    for(const group of groups)
     for(const row of result[group]){
      if(!Number.isSafeInteger(row?.id)||!changed.has(String(row.id)))continue;
      const detail=group+':'+variant;
      found.set([row.id,module,job,detail].join('|'),{
       id:String(row.id),job,level:55,module,detail,
       value:1,evidence:'source-only'});
    }
    count++;
   };
   const inspectArgs={skillCatalog:skills,jobKey:job,level:55,
    branchCaps:caps,branchMasteries:mastery};
   for(const [module,method,groups,extra] of [
    ['source-complex-spell','complexSkillSourcePreview',['rows'],{}],
    ['source-target-status','statusApplicationPreview',['rows'],{}],
    ['source-enemy-debuff','enemyDebuffPreview',['rows'],{}],
    ['source-tactical-action','tacticalSkillPreview',['rows'],{}],
    ['source-combat-technique','combatTechniquePreview',['rows'],
     {weaponKind:'2H_SWORD'}],
    ['source-specialized-defense-magic','specializedSkillPreview',
     ['defense','magic'],{}],
    ['source-support-action','supportEffectPreview',['help','magic'],{}],
    ['source-situational-action','situationalSkillPreview',
     ['stealth','other'],{}],
    ['source-song-chain','songSkillPreview',['rows'],{}],
    ['source-execution-chain','skillExecutionChains',['rows'],{}],
    ['source-onhit-execution','skillExecutionChains',['rows'],{onHit:true}],
    ['source-ammunition-action','rangedAmmoPreview',['rows'],
     {weaponKind:'BOW'}]
   ]){
    evidence(module,calc[method]({...inspectArgs,...extra}),groups,
     extra.onHit?'on-hit':extra.weaponKind||'standard');
   }
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
       // A null aggregate does NOT mean its individual effect coefficients
       // are unknown. Protect each model (EP) against silent disappearance.
       write(row.id,'skill-effects',weaponKind,row.amount);
       for(const model of row.coefficientModels||[])
        if(typeof model.ep==='string')
         write(row.id,'skill-effect-coefficient',
          weaponKind+':'+model.ep,model.amount);
      }
    }
    // Encyclopedia material consumption is a numeric source projection,
    // not invented skill damage. If an internal unlearnable action changes,
    // its learnable root must not silently lose the exact trap cost or
    // the signed level-50 improved variant.
    const traps=calc.trapSkillCostPreview({skillCatalog:skills,jobKey:job,level,
     branchCaps:caps,branchMasteries:mastery});
    if(!traps||!Array.isArray(traps.rows)){
     errors.push('Нет источниковых расчётов материалов ловушек '+job+' / '+level);
    }else for(const row of traps.rows){
     write(row.id,'trap-material','item:'+row.itemId,row.count);
     if(row.level50Variant)
      write(row.id,'trap-level-50','linked:'+
       row.level50Variant.linkedEffectId,row.level50Variant.itemCount);
    }
    // These source-only/ingredient inspectors already exist in the
    // Encyclopedia. Record their signed quantitative PARAMETERS (not final
    // damage, proc chance, inventory ownership, or crafting success).
    const recipes=calc.craftingSkillPreview({skillCatalog:skills,jobKey:job,
     level,branchCaps:caps,branchMasteries:mastery});
    if(!Array.isArray(recipes?.rows))
     errors.push('Нет исходных рецептов '+job+' / '+level);
    else for(const row of recipes.rows){
     for(const ingredient of row.uses||[])
      write(row.id,'source-recipe-ingredient','item:'+ingredient.id,
       ingredient.quantity);
     if(row.produces)
      write(row.id,'source-recipe-output','item:'+row.produces.id,
       row.produces.quantity);
    }
    for(const weaponKind of ['BOW','CROSSBOW']){
     const ammo=calc.rangedAmmoPreview({skillCatalog:skills,jobKey:job,
      level,branchCaps:caps,branchMasteries:mastery,weaponKind});
     if(!Array.isArray(ammo?.rows))
      errors.push('Нет исходных данных расхода стрел '+job+' / '+level);
     else for(const row of ammo.rows)
      write(row.id,'source-ammunition',weaponKind,row.ammoCount);
    }
    const support=calc.supportEffectPreview({skillCatalog:skills,jobKey:job,
     level,branchCaps:caps,branchMasteries:mastery});
    if(!support||!Array.isArray(support.help)||!Array.isArray(support.magic))
     errors.push('Нет источниковых данных усилений '+job+' / '+level);
    else for(const row of [...support.help,...support.magic])
     if(Number.isSafeInteger(row.requiredItemId)&&row.requiredItemId>0)
      write(row.id,'source-support-material','item:'+row.requiredItemId,
       row.requiredItemCount);
    const situation=calc.situationalSkillPreview({skillCatalog:skills,jobKey:job,
     level,branchCaps:caps,branchMasteries:mastery});
    if(!situation||!Array.isArray(situation.stealth)||
     !Array.isArray(situation.other))
     errors.push('Нет источниковых данных особых действий '+job+' / '+level);
    else for(const row of [...situation.stealth,...situation.other]){
     if(Number.isSafeInteger(row.requiredItemId)&&row.requiredItemId>0)
      write(row.id,'source-situational-material','item:'+row.requiredItemId,
       row.requiredItemCount);
     write(row.id,'source-special-resource','source-value',
      row.specialResourceValue);
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
  // Evaluate the actual recipient/caster calculation engines on stable
  // independent control inputs. These are projections, NOT live combat claims.
  // "target" avoids treating a party buff as a self-learned class skill.
  const keep=(group,sources,values,scenario)=>{
   for(const [field,owners] of sources){
    const item=values?.[field];
    const amount=item&&typeof item==='object'?item.bonus:item;
    if(!Number.isFinite(amount))continue;
    for(const id of owners){
     if(!changed.has(String(id)))continue;
     const detail=field+':'+scenario;
     found.set([id,group,detail].join('|'),{
      id:String(id),job:'target',level:null,module:group,detail,value:amount
     });
    }
   }
  };
  if(replayRecipient||replayPriest)for(const [index,delta] of [0,25,70].entries()){
   if(replayRecipient){
    keep('ally-recipient',recipientSources,calc.alliedRecipientPreviews({
     skillCatalog:skills,combat:{
      attack:{walkingBase:180+delta},accuracy:{base:135+delta},
      dodge:{base:110+delta}
     }
    }),index);
    count++;
   }
   if(replayPriest){
    keep('priest-cast',priestSources,calc.priestCastPreviews({
     skills,spi:80+delta,blessing:65+delta,
     hymn:45+delta,exorcism:40
    }),index);
    count++;
   }
  }
  // A label-only item change never becomes a new game mechanic.
  // A missing/altered linked potion or proven cure must be reported before D1.
  if(changedItems.size){
   const skillsLinks=calc.consumableSkillPreview({items:data?.items,skills});
   const cure=calc.statusCurePreview({items:data?.items,skills});
   if(!Array.isArray(skillsLinks?.rows)||!Array.isArray(cure?.rows))
    errors.push('Нет проверки связанных расходников и снятия состояний.');
   else{
    const record=(id,module,detail)=>{
     if(!changedItems.has(String(id)))return;
     const key=['item:'+id,module,detail].join('|');
     found.set(key,{id:'item:'+id,job:'item',level:null,module,detail,value:1});
    };
    for(const row of skillsLinks.rows)
     for(const linked of row.skills||[])
      record(row.id,'source-item-skill','skill:'+linked.id);
    for(const row of cure.rows)
     for(const condition of row.conditionsEn||[])
      record(row.id,'source-item-cure',String(condition));
    count++;
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
  const itemProof=old.job==='item';
  const latest=itemProof?newItems[old.id.slice(5)]:newSkills[old.id];
  // Explicit removals and changed class/level permissions remain separate
  // owner-review changes; they are not silently counted as formula regressions.
  if(!latest||!itemProof&&old.job!=='target'&&
   (!latest.classes?.[old.job]||Number(latest.charLevel||0)>old.level))
   continue;
  if(next.found.has(key))retained.push(old);
  else lost.push(old);
 }
 // Show distinct, actionable recipient effects first. Without this,
 // five repeated hero/equipment scenarios hid the actual missing ally buff.
 const representatives=[],seenSamples=new Set();
 for(const row of [
  ...lost.filter(x=>directlyChanged.has(x.id)&&
   (x.module==='ally-recipient'||x.module==='priest-cast')),
  ...lost.filter(x=>directlyChanged.has(x.id)),
  ...lost.filter(x=>x.module==='ally-recipient'||x.module==='priest-cast'),
  ...lost
 ]){
  const signature=[row.id,row.module,
   row.module==='ally-recipient'||row.module==='priest-cast'?
    row.detail.split(':')[0]:row.detail].join('|');
  if(seenSamples.has(signature))continue;
  seenSamples.add(signature);representatives.push(row);
  if(representatives.length>=5)break;
 }
 const recognized=new Set([...prior.found.values(),...next.found.values()].map(x=>x.id));
 const problems=[...prior.errors,...next.errors];
 return {ok:lost.length===0&&problems.length===0,
  changedSkills:changed.size,scenarios:prior.count+next.count,
  previouslyModeled:prior.found.size,retained:retained.length,
  lost:lost.length,
  lostSourceOnly:lost.filter(row=>row.evidence==='source-only').length,
  lostCalculated:lost.filter(row=>row.evidence!=='source-only').length,
  unmodeled:[...changed].filter(id=>!recognized.has(id)).length,
  samples:representatives.map(row=>({...row,name:String(
   row.job==='item'?
    newItems[row.id.slice(5)]?.name||oldItems[row.id.slice(5)]?.name||row.id:
    newSkills[row.id]?.name||oldSkills[row.id]?.name||row.id).slice(0,75)})),
  errors:problems.slice(0,5)};
}

root.PandoraCatalogSafety=Object.freeze({MAX_LEVEL,EXPECTED,check,project,compare,compatibility,replaySkills,replayEquipmentEffects});
})(typeof window==='undefined'?globalThis:window);

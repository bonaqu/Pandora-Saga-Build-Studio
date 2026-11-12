(function(root){
'use strict';
// Original Remaked js/ini.js Set.Buff has 39 entries: 36 skill effects and
// 3 rune toggles. Only the 36 independently matched OS primary skill IDs
// belong here. The 3 runes have no validated current-OS equivalents.
// [Legacy flag, current OS skill ID, recipient scope, existing Book control]
const raw=[
 ['0_7',320001001,'party','combatWarCry'],
 ['0_8',330004001,'party'],
 ['6_2',320004001,'party','combatWindBlessing'],
 ['6_3',100055001,'party'],
 ['14_0',320002001,'party'],
 ['14_1',320005001,'party','lifeSign'],
 ['14_2',320011001,'party'],
 ['15_1',260006001,'party','combatWindAssist'],
 ['1_4',100054001,'self','combatConcentration'],
 ['3_2',142051001,'self'],
 ['5_5',168052001,'self'],
 ['11_3',260005001,'self'],
 ['11_6',260008001,'self'],
 ['0_9',100052001,'self','combatRage'],
 ['0_10',100053001,'self','combatDefender'],
 ['0_11',100058001,'self'],
 ['7_0',213702001,'self'],
 ['7_1',213605001,'self'],
 ['11_0',260002001,'self'],
 ['8_1',220001001,'self'],
 ['20_3',430051001,'self'],
 ['14_3',320007001,'party','priestGratia'],
 ['14_4',320008001,'party','priestLapisMedio'],
 ['14_6',320003001,'party'],
 ['14_8',320006001,'party'],
 ['14_9',320012001,'party','priestEncouragement'],
 ['15_0',330005001,'party'],
 ['15_8',330051001,'party'],
 ['16_0',340001001,'party'],
 ['16_2',340003001,'party'],
 ['16_3',340004001,'party'],
 ['18_8',410003001,'party','resistanceSkillIds'],
 ['18_9',410015001,'party','resistanceSkillIds'],
 ['18_10',410025001,'party','resistanceSkillIds'],
 ['20_7',430054001,'party','resistanceSkillIds'],
 ['21_7',440005501,'party','resistanceSkillIds']
];
const definitions=Object.freeze(raw.map(([flag,id,scope,existing])=>
 Object.freeze({flag,id,scope,existing:existing||null})));
const byId=new Map(definitions.map(row=>[row.id,row]));
const readableWeapon=record=>{
 const kinds=record?.weaponUse;
 if(!Array.isArray(kinds)||!kinds.length)return null;
 if(kinds.every(kind=>kind==='1H_AXE'||kind==='2H_AXE'))
  return ['Нужен топор','Requires an axe'];
 if(kinds.length===1&&kinds[0]==='CROSSBOW')
  return ['Нужен арбалет','Requires a crossbow'];
 if(kinds.every(kind=>kind==='BOW'||kind==='CROSSBOW'))
  return ['Нужен лук или арбалет','Requires a bow or crossbow'];
 return ['Не подходит выбранное оружие','Current weapon is incompatible'];
};
function enabled(row,{skills={},jobKey=null,level=1,weapon=null,branchMasteries={},
 branchLabels={},englishBranches={}}={}){
 const source=skills?.[String(row.id)];
 if(!source||Number(source.id)!==row.id||
  !Array.isArray(source.funcs)||!source.funcs.some(effect=>effect.dir==='TARGET'))
  return {allowed:false,ru:'Умение не найдено в игровом каталоге',
   en:'Skill is unavailable in the game catalog'};
 // A group/target spell may be cast BY a different party member.
 // Recipient eligibility MUST NOT be tested against caster class, level,
 // trained mastery, or weapon. Only self-cast skills need those checks.
 if(row.scope==='party')return {allowed:true,ru:'',en:''};
 if(!source.classes?.[jobKey])return {allowed:false,
  ru:'Недоступно для этой профессии',en:'Unavailable to this class'};
 if(!Number.isInteger(level)||level<Number(source.charLevel||0))
  return {allowed:false,ru:'Требуется уровень '+source.charLevel,
   en:'Requires level '+source.charLevel};
 if(source.learnable===false||source.prereq!=null)
  return {allowed:false,ru:'Умение пока не доступно герою',
   en:'This skill is not yet available to your hero'};
 if(!Array.isArray(source.reqs))return {allowed:false,
  ru:'Требования умения не уточнены',en:'Skill requirements are unknown'};
 for(const req of source.reqs){
  if(typeof req?.branch!=='string'||!Number.isInteger(req.amount))
   return {allowed:false,ru:'Требования умения не уточнены',
    en:'Skill requirements are unknown'};
  if(Number(branchMasteries?.[req.branch]??0)<req.amount){
   const ru=branchLabels[req.branch]||req.branch;
   const en=englishBranches[req.branch]||ru;
   return {allowed:false,ru:'Требуется мастерство «'+ru+'»: '+req.amount,
    en:'Requires '+en+' mastery '+req.amount};
  }
 }
 const kinds=source.weaponUse;
 if(Array.isArray(kinds)&&kinds.length&&
  !kinds.includes(weapon?.kind??'BARE_HAND')){
  const [ru,en]=readableWeapon(source);
  return {allowed:false,ru,en};
 }
 return {allowed:true,ru:'',en:''};
}
// Do not infer an active effect from its name: these three source-gated
// constant effects are present in both the 2026 OS catalogue and Remaked's
// legacy buff slots. The game-client stacking order remains unverified.
const numericIds=new Set([100055001,330004001,142051001,260005001,260008001,
 260002001,213702001,320002001]);
function exactConstant(record,ep,expected){
 const found=(record?.funcs||[]).filter(row=>row.ep===ep&&row.dir==='TARGET');
 return found.length===1&&Array.isArray(found[0].fv1)&&
  found[0].fv1.length===4&&found[0].fv1.every((v,i)=>v===[0,0,0,expected][i])&&
  Array.isArray(found[0].fv2)&&found[0].fv2.length===4&&
  found[0].fv2.every(v=>v===0);
}
function choices({skills={},englishSkills={},jobKey=null,level=1,weapon=null,
 branchMasteries={},branchLabels={},englishBranches={},selected=[]}={}){
 const active=new Set(selectedIds(selected));
 return definitions.map(row=>{
  const record=skills[String(row.id)];
  const gate=enabled(row,{skills,jobKey,level,weapon,branchMasteries,
   branchLabels,englishBranches});
  return {...row,name:record?.name||'',nameEn:englishSkills[String(row.id)]?.n||
   record?.name||'',description:record?.desc||'',
   selected:active.has(row.id),available:gate.allowed,
   reason:gate.ru,reasonEn:gate.en,
   counted:numericIds.has(row.id)};
 });
}
function selectedIds(value){
 if(!Array.isArray(value))return[];
 return [...new Set(value.filter(id=>Number.isSafeInteger(id)&&
  byId.has(id)&&!byId.get(id).existing))].sort((a,b)=>a-b);
}
function effect(record,ep){
 if(!record?.funcs)return null;
 const rows=record.funcs.filter(x=>x.ep===ep&&x.dir==='TARGET');
 if(rows.length!==1||!Number.isFinite(rows[0].fv1?.[3]))return null;
 return rows[0].fv1[3];
}
function applied({selected=[],skills={},jobKey=null,level=1,weapon=null,
 branchMasteries={}}={}){
 const chosen=new Set(selectedIds(selected)),result={};
 for(const row of definitions){
  if(!chosen.has(row.id)||!numericIds.has(row.id))continue;
  const gate=enabled(row,{skills,jobKey,level,weapon,branchMasteries});
  if(!gate.allowed)continue;
  const record=skills[String(row.id)];
  if(row.id===100055001){
   const flat=effect(record,'EP_TOHIT_CONST'),
    percent=effect(record,'EP_TOHIT_SCALE');
   if(flat===20&&percent===15)result.thirdEye={flat,percent};
  }else if(row.id===330004001){
   const magic=effect(record,'EP_MAGIC_RESISTANCE_CONST');
   if(magic===25)result.providence={magic};
  }else if(row.id===142051001){
   const critical=effect(record,'EP_CRITICALRATE_CONST');
   if(critical===10)result.coldBlood={critical};
  }else if(row.id===260005001){
   const dodge=effect(record,'EP_AVOIDANCE_CONST');
   if(dodge===10)result.quickStep={dodge};
  }else if(row.id===260008001){
   const dodge=effect(record,'EP_AVOIDANCE_CONST');
   if(dodge===100)result.avoidance={dodge};
  }else if(row.id===260002001){
   // Remaked Flag 11_0, Calc(MoveSPD): additive +30 speed index.
   if(exactConstant(record,'EP_MOVESPEED_SCALE',30))
    result.lightness={movement:30};
  }else if(row.id===213702001){
   // Same OS EP_ATTACKINTERVAL_SCALE channel as the existing Lunge preview.
   if(exactConstant(record,'EP_ATTACKINTERVAL_SCALE',30))
    result.swiftArrow={attackSpeed:30};
  }else if(row.id===320002001){
   // An allied buff, never gated by the receiving hero's priest class.
   // This is a recovery-speed index, NOT +90 MP per tick.
   if(exactConstant(record,'EP_HEAL_TIME_SCALE',90))
    result.blessedRepose={manaRecoverySpeed:90};
  }
 }
 return result;
}
root.PandoraRemakedBuffs=Object.freeze({definitions,choices,enabled,selectedIds,applied});
})(typeof window==='undefined'?globalThis:window);

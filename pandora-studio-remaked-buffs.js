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
// The same six current-OS recipient roots are cast by another character.
// Source quantities may change while this access shape stays supported.
// Class, level, prerequisite or root-identity drift must fail closed instead
// of allowing the recipient to apply a free/invalid buff.
const osPartySourceAccess=Object.freeze({
 320001001:{branch:'martial',level:28,classes:['DRAGOON','GLADIATOR','JUGGERNAUT']},
 100055001:{branch:'archery',level:28,classes:['AGENT','ASSASSIN','DISTURBANCE']},
 260006001:{branch:'exorcism',level:28,classes:['ASCETIC','EXORCIST','MONK']},
 320004001:{branch:'archery',level:28,classes:['ARCHER','PREDATOR','SNIPER']},
 330004001:{branch:'martial',level:28,classes:['GENERAL','KNIGHT','PALADIN']},
 320002001:{branch:'blessing',level:20,classes:['CLERIC','ENCHANTER','PRIEST']}
});
function currentOsPartyAccess(record,id){
 const access=osPartySourceAccess[id];
 if(!access)return true;
 const assigned=Object.keys(record?.classes||{}).sort();
 return record?.id===id&&record.learnable===true&&
  record.prereq===null&&record.charLevel===access.level&&
  record.branch===access.branch&&
  Array.isArray(record.reqs)&&record.reqs.length===0&&
  assigned.length===access.classes.length&&assigned.every((key,index)=>
   key===access.classes[index]&&record.classes[key]===1);
}

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
 branchCaps=null,branchLabels={},englishBranches={}}={}){
 const source=skills?.[String(row.id)];
 if(!source||Number(source.id)!==row.id||
  !Array.isArray(source.funcs)||!source.funcs.some(effect=>effect.dir==='TARGET'))
  return {allowed:false,ru:'Умение не найдено в игровом каталоге',
   en:'Skill is unavailable in the game catalog'};
 // A group/target spell may be cast BY a different party member.
 // Recipient eligibility MUST NOT be tested against caster class, level,
 // trained mastery, or weapon. Only self-cast skills need those checks.
 if(row.scope==='party'){
  const sourceAccess=source.learnable===true&&source.prereq===null&&
   Number.isSafeInteger(source.charLevel)&&source.charLevel>=0&&
   source.charLevel<=55&&Array.isArray(source.reqs)&&
   source.reqs.every(req=>typeof req?.branch==='string'&&req.branch.length>0&&
    Number.isSafeInteger(req.amount)&&req.amount>=0)&&
   Object.values(source.classes||{}).some(v=>v===1)&&
   currentOsPartyAccess(source,row.id);
  return sourceAccess?{allowed:true,ru:'',en:''}:{allowed:false,
   ru:'Источник союзного умения изменён — требуется проверка',
   en:'Allied skill source changed — verification required'};
 }
 if(!source.classes?.[jobKey])return {allowed:false,
  ru:'Недоступно для этой профессии',en:'Unavailable to this class'};
 // Source class assignment is broader than actual trainable branch caps.
 // A hypothetical 41 Warding on a Warrior (max 5) cannot activate a buff.
 if(branchCaps&&typeof branchCaps==='object'&&source.branch){
  const limit=branchCaps[source.branch],trained=branchMasteries?.[source.branch]??0;
  if(!Number.isSafeInteger(limit)||limit<=0||
   !Number.isSafeInteger(trained)||trained<0||trained>limit)
   return {allowed:false,ru:'Мастерство превышает предел профессии',
    en:'Skill mastery exceeds class cap'};
 }
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
// Both the source Evasion bonus and its two-hit end condition must match OS.
function verifiedAvoidance(record){
 return record?.id===260008001&&record.skillType==='MYSELF'&&
  record.learnable===true&&Array.isArray(record.funcs)&&
  record.funcs.length===2&&exactConstant(record,'EP_AVOIDANCE_CONST',100)&&
  exactConstant(record,'EP_LOST_WARDING_DAMAGE',2);
}
function choices({skills={},englishSkills={},jobKey=null,level=1,weapon=null,
 branchMasteries={},branchCaps=null,branchLabels={},englishBranches={},selected=[]}={}){
 const active=new Set(selectedIds(selected));
 return definitions.map(row=>{
  const record=skills[String(row.id)];
  const gate=enabled(row,{skills,jobKey,level,weapon,branchMasteries,
   branchCaps,branchLabels,englishBranches});
  return {...row,name:record?.name||'',nameEn:englishSkills[String(row.id)]?.n||
   record?.name||'',description:record?.desc||'',
   selected:active.has(row.id),available:gate.allowed,
   reason:gate.ru,reasonEn:gate.en,
   counted:numericIds.has(row.id)&&numericSourceAvailable(record,row.id)};
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
function scalingEffect(record,ep,values){
 const rows=(record?.funcs||[]).filter(f=>f?.ep===ep&&f?.dir==='TARGET');
 return rows.length===1&&Array.isArray(rows[0].fv1)&&
  rows[0].fv1.length===4&&rows[0].fv1.every((v,i)=>v===values[i])&&
  Array.isArray(rows[0].fv2)&&rows[0].fv2.length===4&&
  rows[0].fv2.every(v=>v===0);
}
// Same signed, flat TARGET FV1 form as the independent Hero Book inspector.
// A changed official number may flow through; any new unknown channel fails.
function sourceConstant(record,ep){
 const rows=(record?.funcs||[]).filter(f=>f?.ep===ep&&f.dir==='TARGET');
 if(rows.length!==1)return null;
 const f=rows[0],v=f.fv1;
 if(!Array.isArray(v)||v.length!==4||!v.every(Number.isSafeInteger)||
  v.slice(0,3).some(n=>n!==0)||v[3]<0||v[3]>100||
  !Array.isArray(f.fv2)||f.fv2.length!==4||
  f.fv2.some(n=>n!==0))return null;
 return v[3];
}
// Book's modeled/pending status must agree with the actual applied-source
// guard; a corrupted current-OS FV cannot be advertised as an active number.
function numericSourceAvailable(record,id){
 if(!currentOsPartyAccess(record,id))return false;
 if(id===260008001)return verifiedAvoidance(record);
 if(id===100055001)return record?.skillType==='PARTY_ALL'&&
  record.funcs?.length===2&&
  sourceConstant(record,'EP_TOHIT_CONST')!==null&&
  sourceConstant(record,'EP_TOHIT_SCALE')!==null;
 if(id===330004001)return record?.skillType==='PARTY_ALL'&&
  record.funcs?.length===1&&
  sourceConstant(record,'EP_MAGIC_RESISTANCE_CONST')!==null;
 if(id===320002001)return record?.skillType==='PARTY_ALL'&&
  record.funcs?.length===1&&
  sourceConstant(record,'EP_HEAL_TIME_SCALE')!==null;
 return true;
}
// Current OS adds caster-mastery/recipient-attribute coefficient terms
// to two legacy toggles marked "not implemented" in archived Remaked.
// These are source-coefficient MODELS, not observed server action results.
function applied({selected=[],skills={},jobKey=null,level=1,weapon=null,
 branchMasteries={},branchCaps=null,stats={}}={}){
 const chosen=new Set(selectedIds(selected)),result={};
 for(const row of definitions){
  if(!chosen.has(row.id)||!numericIds.has(row.id))continue;
  const gate=enabled(row,{skills,jobKey,level,weapon,branchMasteries,branchCaps});
  if(!gate.allowed)continue;
  const record=skills[String(row.id)];
  if(row.id===100055001){
   // Both independent target effects and their FV2 vectors must match.
   // A corrupted or expanded source must not silently alter hero accuracy.
   if(record.skillType==='PARTY_ALL'&&record.funcs.length===2){
    const flat=sourceConstant(record,'EP_TOHIT_CONST');
    const percent=sourceConstant(record,'EP_TOHIT_SCALE');
    if(flat!==null&&percent!==null)result.thirdEye={flat,percent};
   }
  }else if(row.id===330004001){
   if(record.skillType==='PARTY_ALL'&&record.funcs.length===1){
    const magic=sourceConstant(record,'EP_MAGIC_RESISTANCE_CONST');
    if(magic!==null)result.providence={magic};
   }
  }else if(row.id===142051001){
   const rank=branchMasteries?.brush;
   if(scalingEffect(record,'EP_CRITICALRATE_CONST',[0,0,20,10])&&
    Number.isSafeInteger(rank)&&rank>=0&&rank<=100)
    result.coldBlood={critical:10+Math.floor(rank*20/100),modeled:true};
  }else if(row.id===260005001){
   const rank=branchMasteries?.warding,agi=stats?.agi;
   if(scalingEffect(record,'EP_AVOIDANCE_CONST',[5,0,15,10])&&
    Number.isSafeInteger(rank)&&rank>=0&&rank<=100&&
    Number.isSafeInteger(agi)&&agi>=0&&agi<=500)
    result.quickStep={dodge:10+Math.floor(agi*5/100)+
     Math.floor(rank*15/100),modeled:true};
  }else if(row.id===260008001){
   if(verifiedAvoidance(record))result.avoidance={dodge:100};
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
   if(record.skillType==='PARTY_ALL'&&record.funcs.length===1){
    const manaRecoverySpeed=sourceConstant(record,'EP_HEAL_TIME_SCALE');
    if(manaRecoverySpeed!==null)result.blessedRepose={manaRecoverySpeed};
   }
  }
 }
 return result;
}
root.PandoraRemakedBuffs=Object.freeze({definitions,choices,enabled,selectedIds,applied});
})(typeof window==='undefined'?globalThis:window);

(function rulesImpl(root){
"use strict";
const n=(v,def=0)=>Number.isFinite(Number(v))?Number(v):def;
function branchCap(classes,job,branch){
 // The class and its branch limit must be real own numeric source fields.
 // String, boolean, array and inherited values cannot grant spendable skills.
 if(!classes||typeof classes!=='object'||Array.isArray(classes)||
  !Object.hasOwn(classes,job))return null;
 const caps=classes[job]?.branchCaps;
 if(!caps||typeof caps!=='object'||Array.isArray(caps)||
  !Object.hasOwn(caps,branch))return null;
 const value=caps[branch];
 return Number.isSafeInteger(value)&&value>=0?value:null;
}
function readiness(skill,{job,level,points}={}){
const missing=[],unknown=[],gates=[];
if(!skill||typeof skill!=='object'||Array.isArray(skill)||
 !Number.isSafeInteger(skill.id)||skill.id<=0)
 return{status:"unknown",missing,unknown:["Нет данных навыка"],gates};
if(!skill.classes||typeof skill.classes!=='object'||
 Array.isArray(skill.classes)||!Object.hasOwn(skill.classes,job)||
 skill.classes[job]!==1)missing.push("Недоступно этому классу");
if(!Number.isSafeInteger(skill.charLevel)||skill.charLevel<0)
 unknown.push("Некорректный уровень навыка");
else if(!Number.isSafeInteger(level)||level<1)
 unknown.push("Некорректный уровень героя");
else if(skill.charLevel>level)missing.push("Уровень "+skill.charLevel);
if(Array.isArray(skill.reqs))for(const req of skill.reqs){
if(!req||typeof req.branch!=='string'||!req.branch.trim()||
 !Number.isSafeInteger(req.amount)||req.amount<0){
 unknown.push("Неизвестное требование ветки");continue;
}
const raw=points?.[req.branch],current=raw==null?0:raw,required=req.amount;
if(!Number.isSafeInteger(current)||current<0){
 unknown.push("Некорректное мастерство ветки");continue;
}
gates.push({branch:req.branch,current,required,met:current>=required});
if(current<required)missing.push(req.branch+" "+current+"/"+required);
}else unknown.push("Неизвестный формат требований");
if(skill.learnable!==true)unknown.push("Не изучается обычным распределением очков");
if(skill.prereq)unknown.push("Дополнительное условие не проверено");
if(!Number.isSafeInteger(skill.reqLevel)||skill.reqLevel<0||
 skill.reqLevel>0)unknown.push("Требование reqLevel ещё не подтверждено");
return {status:missing.length?"locked":unknown.length?"unknown":"eligible",missing,unknown,gates};
}
function equipment(item,{job,level,slot}={}){
const missing=[];if(!item)return{allowed:false,missing:["Нет данных"]};
// A caller choosing an equipment slot cannot equip a record with NO slot
 // (e.g. consumables or unrelated mount items), regardless of class flags.
 if(slot&&item.slot!==slot)missing.push("Другой слот");
// An absent or falsified class/level field must not grant an item to a hero.
// A null required item level is the explicit level-free form (e.g. arrows).
if(!item.classes||typeof item.classes!=='object'||Array.isArray(item.classes)||
   !Object.hasOwn(item.classes,job)||item.classes[job]!==1)
 missing.push("Не подходит классу");
const heroLevelValid=Number.isSafeInteger(level)&&level>=1;
if(!heroLevelValid)missing.push("Некорректный уровень героя");
if(item.level!==null&&(!Number.isSafeInteger(item.level)||item.level<0))
 missing.push("Некорректный уровень предмета");
else if(heroLevelValid&&item.level!==null&&item.level>level)
 missing.push("Требуется уровень "+item.level);
return {allowed:!missing.length,missing};
}
root.PandoraStudioRules=Object.freeze({branchCap,readiness,equipment});
})(typeof window==='undefined'?globalThis:window);

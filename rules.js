(function rulesImpl(root){
"use strict";
const n=(v,def=0)=>Number.isFinite(Number(v))?Number(v):def;
function branchCap(classes,job,branch){const caps=classes?.[job]?.branchCaps;if(!caps||!Object.hasOwn(caps,branch))return null;const v=n(caps[branch],-1);return Number.isInteger(v)&&v>=0?v:null}
function readiness(skill,{job,level,points}={}){
const missing=[],unknown=[],gates=[];
if(!skill)return{status:"unknown",missing,unknown:["Нет данных навыка"],gates};
if(skill.classes&&!Object.hasOwn(skill.classes,job))missing.push("Недоступно этому классу");
if(n(skill.charLevel)>n(level))missing.push("Уровень "+skill.charLevel);
if(Array.isArray(skill.reqs))for(const req of skill.reqs){
if(!req||typeof req.branch!=="string"||!Number.isFinite(Number(req.amount))){unknown.push("Неизвестное требование ветки");continue}
const current=n(points?.[req.branch]),required=n(req.amount);
gates.push({branch:req.branch,current,required,met:current>=required});
if(current<required)missing.push(req.branch+" "+current+"/"+required);
}else if(skill.reqs!=null)unknown.push("Неизвестный формат требований");
if(skill.learnable===false)unknown.push("Не изучается обычным распределением очков");
if(skill.prereq)unknown.push("Дополнительное условие не проверено");
if(n(skill.reqLevel)>0)unknown.push("Требование reqLevel ещё не подтверждено");
return {status:missing.length?"locked":unknown.length?"unknown":"eligible",missing,unknown,gates};
}
function equipment(item,{job,level,slot}={}){
const missing=[];if(!item)return{allowed:false,missing:["Нет данных"]};
if(item.slot&&slot&&item.slot!==slot)missing.push("Другой слот");
if(item.classes&&!Object.hasOwn(item.classes,job))missing.push("Не подходит классу");
if(n(item.level)>n(level))missing.push("Требуется уровень "+item.level);
return {allowed:!missing.length,missing};
}
root.PandoraStudioRules=Object.freeze({branchCap,readiness,equipment});
})(typeof window==='undefined'?globalThis:window);

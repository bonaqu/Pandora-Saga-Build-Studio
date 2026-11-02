(function(root){
'use strict';
// Read-only, locale-safe catalog inspector. This is NOT a damage simulator:
// the OS skill packets contain conditional effects and multi-parameter
// formulas whose runtime semantics have not all been validated.
function create({catalog={},jobKey=null,level=1,innate={},trained={},lang='ru',branchLabels={}}={}){
 if(!catalog||typeof catalog!=='object'||!Number.isInteger(level)||level<1)return null;
 const records=[];
 for(const skill of Object.values(catalog)){
  if(!skill||skill.learnable!==true||!skill.classes?.[jobKey]||!skill.id)continue;
  const charLevel=Number(skill.charLevel||0);
  const reqs=Array.isArray(skill.reqs)?skill.reqs:[];
  const checks=reqs.map(req=>{
   const amount=Number(req.amount);
   const current=Math.max(0,Number(innate[req.branch]||0))+
    Math.max(0,Number(trained[req.branch]||0));
   return {branch:req.branch,amount,current,met:Number.isFinite(amount)&&current>=amount};
  });
  const classLevelReady=Number.isFinite(charLevel)&&level>=charLevel;
  const available=classLevelReady&&checks.every(x=>x.met);
  const cast=Number.isFinite(skill.cast)?skill.cast:null;
  const cooldown=Number.isFinite(skill.cooldown)?skill.cooldown:null;
  const mana=Number.isFinite(skill.mana)?skill.mana:null;
  const english=lang==='en';
  const missing=[...(classLevelReady?[]:[(english?'Level ':'Уровень ')+charLevel]),
   ...checks.filter(x=>!x.met).map(x=>
    (english?'Branch ':'Ветка ')+
    (typeof branchLabels?.[x.branch]==='string'&&branchLabels[x.branch].trim()?
     branchLabels[x.branch]:x.branch)+' '+x.current+'/'+x.amount)];
  records.push({
   id:String(skill.id),name:String(skill.name||'Навык'),desc:String(skill.desc||''),
   available,requirement:missing.join(' · '),cast,cooldown,mana,
   damageKernel:skill.damage?.kernel??null,damageSlot:skill.damage?.slotIndex??null,
   effectCount:Array.isArray(skill.funcs)?skill.funcs.length:0,
   skillType:skill.skillType||null,branch:skill.branch||null,
   confirmedDamage:false
  });
 }
 records.sort((a,b)=>Number(b.available)-Number(a.available)||
  a.name.localeCompare(b.name,'ru')||Number(a.id)-Number(b.id));
 return {records,total:records.length,available:records.filter(x=>x.available).length,
  excluded:['weapon requirements','temporary skill-state conditions',
   'per-target resistance and mitigation','exact damage kernels'],
  verified:false,source:'Current Pandora Saga OS skills.json'};
}
root.PandoraSkillResults=Object.freeze({create});
})(typeof window==='undefined'?globalThis:window);

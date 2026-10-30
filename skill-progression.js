(function(root){
'use strict';
// Potential = points from level-ups allocated into the skill branch.
// Adeptness = mastery trained by using skills, limited by Potential.
// Sources: Remaked js/ini.js and modern/skill-controls.js, historical Pandora Saga wiki.
const PRAYER=['benevolence','blessing','exorcism','hymn'];
const INSPIRED=new Set(['PRIEST','CLERIC','ENCHANTER']);
function value(raw){const n=Number(raw);return Number.isInteger(n)&&n>0?n:0}
function potential(state,key){return value(state?.points?.[key])}
function trained(state,key){
 const max=potential(state,key);
 if(state?.masteryAuto!==false)return max;
 const raw=state?.mastery&&Object.hasOwn(state.mastery,key)?value(state.mastery[key]):0;
 return Math.min(max,raw);
}
function setPotential(state,key,n){
 if(!Number.isInteger(n)||n<0)return false;
 state.points??={};state.points[key]=n;
 if(state.masteryAuto===false&&state.mastery&&Object.hasOwn(state.mastery,key))
  state.mastery[key]=Math.min(n,value(state.mastery[key]));
 return true;
}
function setTrained(state,key,n){
 if(!Number.isInteger(n)||n<0||n>potential(state,key))return false;
 state.mastery??={};state.mastery[key]=n;return true;
}
function setAuto(state,on,keys){
 if(!on&&state.masteryAuto!==false){
  state.mastery??={};
  for(const key of keys)state.mastery[key]=trained(state,key);
 }
 state.masteryAuto=Boolean(on);
}
function prayerAdeptness(state){return PRAYER.reduce((n,key)=>n+trained(state,key),0)}
// Legacy-only preview: Remaked js/calc.js Calc('SPR') grants
// 1 + floor(prayer group Adeptness / 10) to Priest/Cleric/Enchanter.
// Not independently validated for the current Pandora Saga OS server.
function legacyPrayerSpirit(job,state){
 return INSPIRED.has(job)?1+Math.floor(prayerAdeptness(state)/10):0;
}
function spending(table,level,points){
 const max=Number(level);
 const spent=Object.entries(points||{}).reduce((sum,[key,n])=>sum+(key==='race'?0:value(n)),0);
 if(!table||!Number.isInteger(max)||max<1)return {total:null,spent,remaining:null};
 let total=0;
 for(let lv=2;lv<=max;lv++){
  const x=table[String(lv)];
  if(!Number.isInteger(x)||x<0)return {total:null,spent,remaining:null};
  total+=x;
 }
 return {total,spent,remaining:total-spent};
}
function canAllocate(table,level,points,key,cap,amount){
 const budget=spending(table,level,points),current=value(points?.[key]);
 if(!Number.isInteger(amount)||amount<0)return false;
 if(amount<=current)return true; // allow partial refunds in over-budget old builds
 return budget.total!==null&&Number.isInteger(cap)&&cap>=0&&
  amount<=cap&&budget.spent-current+amount<=budget.total;
}
root.PandoraSkillProgression=Object.freeze({
 potential,trained,setPotential,setTrained,setAuto,spending,canAllocate,
 prayerAdeptness,legacyPrayerSpirit,PRAYER
});
})(typeof window==='undefined'?globalThis:window);

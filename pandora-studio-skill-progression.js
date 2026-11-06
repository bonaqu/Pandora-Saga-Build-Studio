(function(root){
'use strict';
// Potential = points from level-ups allocated into the skill branch.
// Adeptness = mastery trained by using skills, limited by Potential.
// Sources: Remaked js/ini.js and modern/skill-controls.js, historical Pandora Saga wiki.
const PRAYER=['benevolence','blessing','exorcism','hymn'];
const MAGIC=['element','embody','darkness','charm'];
const TECHNIQUE=['archery','alchemy','assassin','trap','warding'];
const MELEE=['slash','thrust','brush','blow','defense'];
const INSPIRED=new Set(['PRIEST','CLERIC','ENCHANTER']);
function value(raw){
 // Keep legacy numeric text, but never let JSON booleans, arrays or objects
 // coerce into synthetic invested points or trained mastery.
 if(typeof raw!=='number'&&typeof raw!=='string')return 0;
 if(typeof raw==='string'&&!/^\+?\d+(?:\.0+)?$/.test(raw.trim()))return 0;
 const n=Number(raw);
 return Number.isSafeInteger(n)&&n>0?n:0;
}
function potential(state,key){return value(state?.points?.[key])}
// The innate (already trained) green points belong to the root profession
// and exist even with ZERO free skill points on a new level-1 character.
// They are not skill allocations and cannot be refunded.
function branchBase(innate,key){return value(innate?.[key])}
// Remaked Status.Skill[i] is [innate green, trained green, base potential,
// invested free points]. The currently trainable limit is P + invested;
// neither innate mastery nor base potential consumes level-up points.
function branchPotential(state,key,innate={},caps={}){
 const cap=Number(caps?.[key]);
 return Number.isSafeInteger(cap)&&cap>=0&&caps&&Object.hasOwn(caps,key)?
  cap+potential(state,key):branchBase(innate,key)+potential(state,key);
}
function trainedLimit(state,key,innate={},caps={}){
 return Math.max(0,branchPotential(state,key,innate,caps)-branchBase(innate,key));
}
function trained(state,key,innate={},caps={}){
 const max=trainedLimit(state,key,innate,caps);
 if(state?.masteryAuto!==false)return max;
 const raw=state?.mastery&&Object.hasOwn(state.mastery,key)?value(state.mastery[key]):0;
 return Math.min(max,raw);
}
function branchMastery(state,key,innate={},caps={}){
 return branchBase(innate,key)+trained(state,key,innate,caps);
}
function setPotential(state,key,n,innate={},caps={}){
 if(!Number.isInteger(n)||n<0)return false;
 state.points??={};state.points[key]=n;
 if(state.masteryAuto===false&&state.mastery&&Object.hasOwn(state.mastery,key))
  state.mastery[key]=Math.min(trainedLimit(state,key,innate,caps),value(state.mastery[key]));
 return true;
}
function setTrained(state,key,n,innate={},caps={}){
 if(!Number.isInteger(n)||n<0||n>trainedLimit(state,key,innate,caps))return false;
 state.mastery??={};state.mastery[key]=n;return true;
}
function setAuto(state,on,keys,innate={},caps={}){
 if(!on&&state.masteryAuto!==false){
  state.mastery??={};
  for(const key of keys)state.mastery[key]=trained(state,key,innate,caps);
 }
 state.masteryAuto=Boolean(on);
}
// Legacy js/create.js: Status.Skill[i][0] is innate base Adeptness from
// Skill.D/baseClass; Status.Skill[i][1] is additionally trained green mastery.
// BOTH contribute to derivative skill passives. Neither is the blue Potential.
// OS tables.json jobInit.<baseClass>.branches matches legacy innate branch values.
function groupAdeptness(state,branchKeys,innate={},caps={}){
 return branchKeys.reduce((sum,key)=>sum+branchMastery(state,key,innate,caps),0);
}
function prayerAdeptness(state,innate={},caps={}){return groupAdeptness(state,PRAYER,innate,caps)}
function combatMasteries(state,innate={},caps={}){
 return {melee:groupAdeptness(state,MELEE,innate,caps),
  magic:groupAdeptness(state,MAGIC,innate,caps),
  techniqueInnate:TECHNIQUE.reduce((n,key)=>n+branchBase(innate,key),0),
  techniqueTrained:TECHNIQUE.reduce((n,key)=>n+trained(state,key,innate,caps),0)};
}
// Remaked Calc('SPR'): 1 + floor((innate prayer + trained prayer) / 10),
// active only for Priest/Cleric/Enchanter. Current OS parity remains unverified.
function legacyPrayerSpirit(job,state,innate={},caps={}){
 return INSPIRED.has(job)?1+Math.floor(prayerAdeptness(state,innate,caps)/10):0;
}
// Remaked js/bonus.js BPt[level][1] is the source for spendable skill points.
// The OS abilityPoint table has different values (e.g. L2=2 rather than 1),
// so it is used only as a catalog-readiness check, never as this budget.
function skillGrant(level){
 if(!Number.isInteger(level)||level<2||level>55)return 0;
 return level<=10?1:level<=20?2:3;
}
function spending(table,level,points){
 const max=Number(level);
 const spent=Object.entries(points||{}).reduce((sum,[key,n])=>sum+(key==='race'?0:value(n)),0);
 if(!table||!Number.isInteger(max)||max<1||max>55)return {total:null,spent,remaining:null};
 let total=0;
 for(let lv=2;lv<=max;lv++){
  const existing=table[String(lv)];
  if(!Number.isInteger(existing)||existing<0)return {total:null,spent,remaining:null};
  total+=skillGrant(lv);
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
 potential,trained,branchBase,branchPotential,branchMastery,trainedLimit,
 setPotential,setTrained,setAuto,skillGrant,spending,canAllocate,
 groupAdeptness,prayerAdeptness,legacyPrayerSpirit,combatMasteries,PRAYER,MAGIC,TECHNIQUE,MELEE
});
})(typeof window==='undefined'?globalThis:window);

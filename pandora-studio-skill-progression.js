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
// OS jobInit.<root>.branches are STARTING BRANCH POINTS (D), not green mastery.
// The live-game first-level Warrior has Slash 5, Thrust 2, Cleave 5,
// Heavy 2, Defense 4, Archery 1, but zero trained green before using skills.
// Modern/Legacy Remaked historically interpret Status.Skill[i][0] as innate
// Adeptness. The live game observation takes precedence for Build Studio.
const TRACK_MAX=90;
function branchBase(innate,key){return Math.min(TRACK_MAX,value(innate?.[key]))}
function classLimit(key,caps={}){
 const n=Number(caps?.[key]);
 return Number.isSafeInteger(n)&&n>=0&&Object.hasOwn(caps,key)?
  Math.min(TRACK_MAX,n):null;
}
// Effective allocated branch value = class start D + level-up allocations.
// Class cap is a HARD limit, not green mastery and not a free point grant.
function branchPotential(state,key,innate={},caps={}){
 const base=branchBase(innate,key),added=potential(state,key);
 const limit=classLimit(key,caps);
 if(limit===0)return 0;
 return Math.min(limit??TRACK_MAX,base+added);
}
function trainedLimit(state,key,innate={},caps={}){
 return branchPotential(state,key,innate,caps);
}
// Older (0.389 and earlier) saved *explicit* manual mastery fields contained
// "additional green above innate". Convert those fields for display, but
// absence of manual mastery now means true zero, not innate mastery.
function storedManual(state,key,innate={},caps={}){
 const raw=state?.mastery;
 if(!raw||!Object.hasOwn(raw,key))return 0;
 const saved=value(raw[key]);
 const absolute=state?.masteryFormat===2?saved:saved+branchBase(innate,key);
 return Math.min(trainedLimit(state,key,innate,caps),absolute);
}
function trained(state,key,innate={},caps={}){
 const max=trainedLimit(state,key,innate,caps);
 return state?.masteryAuto!==false?max:storedManual(state,key,innate,caps);
}
function branchMastery(state,key,innate={},caps={}){
 return trained(state,key,innate,caps);
}
function migrateMastery(state,innate={},caps={}){
 if(state?.masteryFormat===2)return;
 if(!state.mastery||typeof state.mastery!=='object'||Array.isArray(state.mastery))state.mastery={};
 const prev=Object.fromEntries(Object.keys(state.mastery).map(key=>[
  key,storedManual(state,key,innate,caps)]));
 state.mastery=prev;state.masteryFormat=2;
}
function setPotential(state,key,n,innate={},caps={}){
 if(!Number.isInteger(n)||n<0)return false;
 const limit=classLimit(key,caps),base=branchBase(innate,key);
 const previous=potential(state,key);
 // Old saved builds can always refund, even if their allocation exceeds the
 // new class cap. Never permit *new* allocations past 90 or class limit.
 if(n>previous&&(n>TRACK_MAX-base||limit===0||limit!==null&&n>Math.max(0,limit-base)))
  return false;
 migrateMastery(state,innate,caps);
 state.points??={};state.points[key]=n;
 // On a refund trained green cannot remain above allocated branch level.
 if(state.mastery&&Object.hasOwn(state.mastery,key))
  state.mastery[key]=Math.min(trainedLimit(state,key,innate,caps),value(state.mastery[key]));
 return true;
}
function setTrained(state,key,n,innate={},caps={}){
 if(!Number.isInteger(n)||n<0||n>trainedLimit(state,key,innate,caps))return false;
 migrateMastery(state,innate,caps);
 state.mastery??={};state.mastery[key]=n;return true;
}
function setAuto(state,on,keys=[],innate={},caps={}){
 migrateMastery(state,innate,caps);
 state.masteryAuto=Boolean(on);
}
// Only actual green mastery contributes to passive bonuses and skill effects.
function groupAdeptness(state,branchKeys,innate={},caps={}){
 return branchKeys.reduce((sum,key)=>sum+branchMastery(state,key,innate,caps),0);
}
// The parent MELEE group aggregates trained green of five subbranches.
function meleeGroupCap(caps={}){
 return MELEE.reduce((sum,key)=>sum+(classLimit(key,caps)??0),0);
}
function meleeGroupTrained(state,innate={},caps={}){
 return groupAdeptness(state,MELEE,innate,caps);
}
function prayerAdeptness(state,innate={},caps={}){return groupAdeptness(state,PRAYER,innate,caps)}
function combatMasteries(state,innate={},caps={}){
 return {melee:groupAdeptness(state,MELEE,innate,caps),
  magic:groupAdeptness(state,MAGIC,innate,caps),
  // Legacy ACC formula distinguishes an innate component. Current live-game
  // starting allocations are NOT innate green: feed 0 and all real green
  // through the trained /10 term instead.
  techniqueInnate:0,techniqueTrained:groupAdeptness(state,TECHNIQUE,innate,caps)};
}
// Remaked includes a +1 class baseline for Inspiration, followed by +1 for
// every ten real green Prayer points. Live OS parity of the baseline is
// tracked separately; never count untrained starting branch points as green.
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
 potential,trained,branchBase,branchPotential,branchMastery,trainedLimit,classLimit,migrateMastery,TRACK_MAX,
 setPotential,setTrained,setAuto,skillGrant,spending,canAllocate,
 groupAdeptness,meleeGroupCap,meleeGroupTrained,prayerAdeptness,legacyPrayerSpirit,combatMasteries,PRAYER,MAGIC,TECHNIQUE,MELEE
});
})(typeof window==='undefined'?globalThis:window);

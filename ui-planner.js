(function(root){
"use strict";
// UX-only helpers; no inferred game formulas or unverified race lore.
function raceHasGender(races,index){
 const race=races?.[index];
 return Boolean(race&&race[2]&&race[3]&&race[2]!==race[3]);
}
function normalizeGender(races,index,value){
 return raceHasGender(races,index)&&Number(value)===1?1:0;
}
function equippable(records,slot,job,level,check){
 return (records||[]).filter(item=>item&&item.slot===slot&&
  item.isCostumeOverlay!==true&&!String(item.kind||'').startsWith('DECO_')&&
  Boolean(check(item,{slot,job,level})?.allowed));
}
root.PandoraUIPlanner=Object.freeze({raceHasGender,normalizeGender,equippable});
})(typeof window==='undefined'?globalThis:window);

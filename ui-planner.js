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
// Astir outfit IDs and descriptions are copied from the local OS item catalog.
// Do not generalize these rules to unknown outfits or claim server verification.
function isAstirDress(item){return item?.slot==='body'&&Number(item.id)>=12611&&Number(item.id)<=12618}
function isAstirMale(item){return Number(item?.id)>=12601&&Number(item?.id)<=12608||
 Number(item?.id)>=13601&&Number(item?.id)<=13608}
function raceCompatible(item,race,gender){
 if(isAstirDress(item))return race===3||race===5||(race===0||race===1)&&gender===0;
 if(isAstirMale(item))return race===4||race===5||(race===0||race===1)&&gender===1;
 return true;
}
root.PandoraUIPlanner=Object.freeze({raceHasGender,normalizeGender,equippable,isAstirDress,isAstirMale,raceCompatible});
})(typeof window==='undefined'?globalThis:window);

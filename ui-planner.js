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
// Permit selecting future equipment as a plan, without allowing its bonuses
// below the real source-level requirement. No items above planning level 55.
function planningEquippable(records,slot,job,currentLevel,check){
 if(!Number.isInteger(currentLevel)||currentLevel<1||currentLevel>55)return [];
 return equippable(records,slot,job,55,check);
}
// Only explicit, source-backed outfit families have race/gender restrictions.
// Astir outfits use the game's established single-portrait race exceptions.
const astirSlots=Object.freeze({126:'body',136:'legs',146:'gloves',156:'feet'});
const tailoredSlots=Object.freeze({115:'head',125:'body',135:'legs',145:'gloves',155:'feet'});
function family(item,table){
 const id=Number(item?.id),group=Math.trunc(id/100);
 return Number.isSafeInteger(id)&&table[group]===item?.slot?{group,variant:id%100}:null;
}
function isAstirDress(item){
 const part=family(item,astirSlots);
 return part?.group===126&&part.variant>=11&&part.variant<=18;
}
function isAstirMale(item){
 const part=family(item,astirSlots);
 return !!part&&part.variant>=1&&part.variant<=8;
}
function astirFemale(item){
 const part=family(item,astirSlots);
 return !!part&&part.variant>=11&&part.variant<=18;
}
function tailoredRestriction(item){
 const part=family(item,tailoredSlots);
 if(!part)return null;
 const variant=part.variant;
 if(part.group===115&&![2,12,22,32].includes(variant))return null;
 if(part.group!==115&&![1,2,11,12,21,22,31,32].includes(variant))return null;
 const series=Math.trunc(variant/10);
 return {race:series>=2?1:0,gender:series%2===0?1:0};
}
function raceCompatible(item,race,gender){
 const tailored=tailoredRestriction(item);
 if(tailored)return race===tailored.race&&gender===tailored.gender;
 if(astirFemale(item))return race===3||race===5||(race===0||race===1)&&gender===0;
 if(isAstirMale(item))return race===4||race===5||(race===0||race===1)&&gender===1;
 return true;
}
root.PandoraUIPlanner=Object.freeze({raceHasGender,normalizeGender,equippable,planningEquippable,isAstirDress,isAstirMale,raceCompatible});
})(typeof window==='undefined'?globalThis:window);

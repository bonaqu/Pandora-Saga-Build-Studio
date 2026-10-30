(function(root){
'use strict';
const tabs=Object.freeze(['race','class','stats']);
// The old four-tab UI persisted 'passive' or 'level'. Recover them without losing a saved build.
function tab(value){return value==='class'?'class':value==='stats'||value==='level'?'stats':'race'}
function selectRace(state,race,gender){
 if(!state||!Number.isInteger(race)||race<0||race>5||![0,1].includes(gender))
  throw new RangeError('Invalid race or portrait');
 return {...state,race,gender, racialPassiveId:race===state.race?state.racialPassiveId:null};
}
function statLimit(classes,jobKey,code){
 const raw=classes?.[jobKey]?.statCaps?.[code];
 return raw!=null&&Number.isFinite(Number(raw))?Math.max(0,Math.trunc(Number(raw))):null;
}
function allowedStat(value,cap){
 return Number.isInteger(value)&&value>=0&&value<=(cap??999);
}
root.PandoraOriginModel=Object.freeze({tabs,tab,selectRace,statLimit,allowedStat});
})(typeof window==='undefined'?globalThis:window);

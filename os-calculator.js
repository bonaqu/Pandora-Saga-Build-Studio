(function(root){
'use strict';
// PREVIEW ONLY: Current Pandora Saga OS class and gametable coefficients.
// Rounding/order and all gear/Soul/buff effects require independent live parity.
const keys=['vit','str','agi','dex','spi','int'];
function base({classData,raceData,jobData,allocation,level}={}){
 if(!classData||!raceData||!jobData||!Number.isInteger(level)||level<1)return null;
 const stats={};
 for(const key of keys){
  const race=Number(raceData[key]),job=Number(jobData[key]),spend=Number(allocation?.[key]||0);
  if(!Number.isFinite(race)||!Number.isFinite(job)||!Number.isInteger(spend)||spend<0)return null;
  stats[key]=race+job+spend;
 }
 const hp=classData.hp,mp=classData.mp;
 if(!hp||!mp)return null;
 const vals=[hp.base,hp.lv,hp.vit,mp.base,mp.lv,mp.spi].map(Number);
 if(!vals.every(Number.isFinite))return null;
 const hpRaw=hp.base+level*hp.lv+stats.vit*hp.vit;
 const mpRaw=mp.base+level*mp.lv+stats.spi*mp.spi;
 return {hp:Math.round(hpRaw),mp:Math.round(mpRaw),hpRaw,mpRaw,stats,
  source:'Pandora Saga OS classes.json + tables.json snapshot',
  verified:false,excluded:['equipment','souls','buffs','passives','enhancement','guild','honor']};
}
root.PandoraOSCalculator=Object.freeze({base});
})(typeof window==='undefined'?globalThis:window);

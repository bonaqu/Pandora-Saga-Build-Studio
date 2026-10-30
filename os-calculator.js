(function(root){
'use strict';
// Pandora Saga OS public calculator parity, 2026-10-11 source audit.
// See Pandora-Saga-Simulator-remaked/docs/CALCULATION_PARITY_AUDIT_2026-10-11.md.
// Supports flat item/Soul ability + HP/MP effects; does NOT claim complete stats.
const keys=['vit','str','agi','dex','spi','int'];
const keyByEffect={EP_VITARITY_CONST:'vit',EP_STRENGTH_CONST:'str',EP_AGILITY_CONST:'agi',
 EP_DEXTERITY_CONST:'dex',EP_SPIRITUAL_CONST:'spi',EP_INTELIGENCE_CONST:'int'};
function halfToEven(value){
 if(!Number.isFinite(value))return null;
 const lower=Math.floor(value),fraction=value-lower;
 return fraction<0.5?lower:fraction>0.5?lower+1:lower%2===0?lower:lower+1;
}
function effectiveAbility(basic,flat=0,percent=0){
 if(![basic,flat,percent].every(Number.isFinite))return null;
 return Math.max(1,basic+flat+Math.floor(basic*percent/100));
}
const bonusByEffect=Object.freeze({
 EP_FIRE_RESISTANCE_CONST:'fire',EP_COLD_RESISTANCE_CONST:'ice',
 EP_LIGHTNING_RESISTANCE_CONST:'lightning',EP_POISON_RESISTANCE_CONST:'poison',
 EP_CHARM_RESISTANCE_CONST:'charm',EP_HOLY_RESISTANCE_CONST:'light',
 EP_DARK_RESISTANCE_CONST:'dark',EP_MAGIC_RESISTANCE_CONST:'magic',
 EP_TOHIT_CONST:'accuracy',EP_AVOIDANCE_CONST:'dodge',
 EP_CRITICALRATE_CONST:'criticalChance'
});
function gatherEffects(records=[]){
 const flat=Object.fromEntries(keys.map(k=>[k,0]));
 const health={hp:0,mp:0},bonuses={},ignored=new Set(),trace=[];
 for(const [source,record,grade] of records){
  for(const eff of record?.effects||[]){
   if(Number.isFinite(eff.min)&&grade<eff.min)continue;
   if(Number.isFinite(eff.max)&&grade>eff.max)continue;
   const value=Number(eff.a),key=keyByEffect[eff.func];
   if(!Number.isFinite(value)){ignored.add(eff.func);continue}
   if(key)flat[key]+=value;
   else if(eff.func==='EP_MAXLIFE_CONST')health.hp+=value;
   else if(eff.func==='EP_MAXMANA_CONST')health.mp+=value;
   else if(bonusByEffect[eff.func]){
    const name=bonusByEffect[eff.func];bonuses[name]=(bonuses[name]||0)+value;
   }else {ignored.add(eff.func);continue}
   trace.push({source,func:eff.func,value});
  }
 }
 return {flat,health,bonuses,ignored:[...ignored],trace};
}
function base({classData,raceData,jobData,allocation,level,records=[]}={}){
 if(!classData||!raceData||!jobData||!Number.isInteger(level)||level<1)return null;
 const effects=gatherEffects(records),basic={},stats={};
 for(const key of keys){
  const race=Number(raceData[key]),job=Number(jobData[key]),spent=Number(allocation?.[key]||0);
  if(!Number.isFinite(race)||!Number.isFinite(job)||!Number.isInteger(spent)||spent<0)return null;
  basic[key]=race+job+spent;
  stats[key]=effectiveAbility(basic[key],effects.flat[key],0);
 }
 const hp=classData.hp,mp=classData.mp;
 if(!hp||!mp||![hp.base,hp.lv,hp.vit,mp.base,mp.lv,mp.spi].every(Number.isFinite))return null;
 const hpRaw=hp.base+level*hp.lv+stats.vit*hp.vit;
 const mpRaw=mp.base+level*mp.lv+stats.spi*mp.spi;
 return {hp:halfToEven(hpRaw)+effects.health.hp,mp:halfToEven(mpRaw)+effects.health.mp,
  hpRaw,mpRaw,stats,basic,effects,rounding:'halfToEven',
  source:'Pandora Saga OS coefficients and publicly audited calculator rounding',
  verified:false,excluded:['percent effects','conditional item upgrades','set bonuses','active/passive skills','group/guild buffs','honor']};
}
root.PandoraOSCalculator=Object.freeze({base,halfToEven,effectiveAbility,gatherEffects});
})(typeof window==='undefined'?globalThis:window);

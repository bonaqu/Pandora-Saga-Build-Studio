(function(root){
'use strict';
// Formula source: Pandora Saga OS class coefficients, cross-checked with
// Pandora-Saga-Simulator-remaked/modern/current-vitals.js (Modern 4.25+).
// Game-client formula coverage is NOT complete without all enhancement/set/skill sources.
const keys=['vit','str','agi','dex','spi','int'];
const keyByEffect={EP_VITARITY_CONST:'vit',EP_STRENGTH_CONST:'str',EP_AGILITY_CONST:'agi',
 EP_DEXTERITY_CONST:'dex',EP_SPIRITUAL_CONST:'spi',EP_INTELIGENCE_CONST:'int'};
const percentByEffect={EP_MAXLIFE_SCALE:'hp',EP_MAXMANA_SCALE:'mp'};
const guildRates=Object.freeze([0,2,4,6,9,12,15]);
const bonusByEffect=Object.freeze({
 EP_FIRE_RESISTANCE_CONST:'fire',EP_COLD_RESISTANCE_CONST:'ice',
 EP_LIGHTNING_RESISTANCE_CONST:'lightning',EP_POISON_RESISTANCE_CONST:'poison',
 EP_CHARM_RESISTANCE_CONST:'charm',EP_HOLY_RESISTANCE_CONST:'light',
 EP_DARK_RESISTANCE_CONST:'dark',EP_MAGIC_RESISTANCE_CONST:'magic',
 EP_TOHIT_CONST:'accuracy',EP_AVOIDANCE_CONST:'dodge',
 EP_CRITICALRATE_CONST:'criticalChance'
});
function halfToEven(value){
 if(!Number.isFinite(value))return null;
 const lower=Math.floor(value),fraction=value-lower;
 return fraction<0.5?lower:fraction>0.5?lower+1:lower%2===0?lower:lower+1;
}
function effectiveAbility(basic,flat=0,percent=0){
 if(![basic,flat,percent].every(Number.isFinite))return null;
 return Math.max(1,basic+flat+Math.floor(basic*percent/100));
}
// Match current class-client integer-cents truncation instead of JS float drift.
function classBase(classPart,level,attribute,key){
 if(!classPart||!Number.isInteger(level)||level<1||
   !Number.isFinite(attribute)||attribute<0)return null;
 const parts=[classPart.base,classPart.lv,classPart[key]];
 if(!parts.every(n=>Number.isFinite(n)&&Math.abs(n*100-Math.round(n*100))<1e-6))
  return null;
 const cents=Math.round(classPart.base*100)+level*Math.round(classPart.lv*100)+
  attribute*Math.round(classPart[key]*100);
 return Math.floor(cents/100);
}
function gatherEffects(records=[]){
 const flat=Object.fromEntries(keys.map(k=>[k,0]));
 const health={hp:0,mp:0},percent={hp:[],mp:[]},bonuses={},ignored=new Set(),trace=[];
 for(const [source,record,grade] of records){
  for(const eff of record?.effects||[]){
   if(Number.isFinite(eff.min)&&grade<eff.min)continue;
   if(Number.isFinite(eff.max)&&grade>eff.max)continue;
   const value=Number(eff.a),key=keyByEffect[eff.func];
   if(!Number.isFinite(value)){ignored.add(eff.func);continue}
   if(key)flat[key]+=value;
   else if(eff.func==='EP_MAXLIFE_CONST')health.hp+=value;
   else if(eff.func==='EP_MAXMANA_CONST')health.mp+=value;
   else if(percentByEffect[eff.func])percent[percentByEffect[eff.func]].push({source,value});
   else if(bonusByEffect[eff.func]){
    const name=bonusByEffect[eff.func];bonuses[name]=(bonuses[name]||0)+value;
   }else{ignored.add(eff.func);continue}
   trace.push({source,func:eff.func,value});
  }
 }
 return {flat,health,percent,bonuses,ignored:[...ignored],trace};
}
function bonusFor(kind,base,effects,enhancements){
 const flat=effects.health[kind];
 const percentParts=effects.percent[kind].map(p=>({
  source:p.source,rate:p.value,amount:Math.floor(base*p.value/100)
 }));
 const level=Number(enhancements?.[kind==='hp'?'guildHp':'guildMp']||0);
 if(!Number.isInteger(level)||level<0||level>=guildRates.length)return null;
 const guildRate=guildRates[level];
 const guild=Math.floor(base*guildRate/100);
 const lifeSign=kind==='hp'&&enhancements?.lifeSign===true?
  250+Math.floor(base*15/100):0;
 return {flat,percentParts,guildRate,guild,lifeSign,total:
  flat+percentParts.reduce((sum,x)=>sum+x.amount,0)+guild+lifeSign};
}
function base({classData,raceData,jobData,allocation,level,records=[],
 supplementalFlat={},supplementalSource=null,enhancements={}}={}){
 if(!classData||!raceData||!jobData||!Number.isInteger(level)||level<1)return null;
 const effects=gatherEffects(records),basic={},stats={};
 for(const key of keys){
  const race=Number(raceData[key]),job=Number(jobData[key]),spent=Number(allocation?.[key]||0);
  if(!Number.isFinite(race)||!Number.isFinite(job)||!Number.isInteger(spent)||spent<0)return null;
  basic[key]=race+job+spent;
  stats[key]=effectiveAbility(basic[key],effects.flat[key]+(Number(supplementalFlat[key])||0),0);
 }
 const rawHp=classData.hp,rawMp=classData.mp;
 const hpBase=classBase(rawHp,level,stats.vit,'vit'),mpBase=classBase(rawMp,level,stats.spi,'spi');
 if(hpBase===null||mpBase===null)return null;
 const hpBonus=bonusFor('hp',hpBase,effects,enhancements);
 const mpBonus=bonusFor('mp',mpBase,effects,enhancements);
 if(!hpBonus||!mpBonus)return null;
 return {hp:hpBase+hpBonus.total,mp:mpBase+mpBonus.total,
  hpBase,mpBase,vitalsBonus:{hp:hpBonus,mp:mpBonus},
  hpRaw:rawHp.base+level*rawHp.lv+stats.vit*rawHp.vit,
  mpRaw:rawMp.base+level*rawMp.lv+stats.spi*rawMp.spi,
  stats,basic,effects,supplementalFlat,supplementalSource,
  rounding:'floor-class-cents',source:'Pandora Saga OS / Modern current-vitals class formula',
  verified:false,excluded:['unstructured refinement bonuses','unpublished set effects',
    'unverified passive and conditional skills','other group/temporary buffs']};
}
root.PandoraOSCalculator=Object.freeze({
 base,classBase,bonusFor,halfToEven,effectiveAbility,gatherEffects,guildRates
});
})(typeof window==='undefined'?globalThis:window);

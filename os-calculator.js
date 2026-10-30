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
// Parse only the explicit improvement clauses in the preserved OS item text.
// These bonuses are absent from the base effects array; unknown prose is ignored.
function refinementEffects(record,grade){
 if(!record||!Number.isInteger(grade)||grade<1||typeof record.desc!=='string')return [];
 const result=[],candidates=[
  [/ОЗ\s*([+-])\s*(\d+)\s*(%)?/g,'hp'],
  [/ОМ\s*([+-])\s*(\d+)\s*(%)?/g,'mp'],
  [/ВЫН\s*([+-])\s*(\d+)/g,'vit'],
  [/СД\s*([+-])\s*(\d+)/g,'spi']
 ];
 const kinds={hp:['EP_MAXLIFE_CONST','EP_MAXLIFE_SCALE'],
  mp:['EP_MAXMANA_CONST','EP_MAXMANA_SCALE'],
  vit:['EP_VITARITY_CONST'],spi:['EP_SPIRITUAL_CONST']};
 const sections=[
  {match:record.desc.match(/За каждые\s+(\d+)\s+единиц[ыу]\s+улучшения\s*:\s*([\s\S]*?)(?=При улучшении на|За каждые|$)/i),
   count:g=>Math.floor(g/Number(record.desc.match(/За каждые\s+(\d+)/i)?.[1]||Infinity)),index:2},
  {match:record.desc.match(/При улучшении на\s*\+(\d+)\s+и выше\s*:\s*([\s\S]*)/i),
   count:g=>g>=Number(record.desc.match(/При улучшении на\s*\+(\d+)/i)?.[1])?1:0,index:2}
 ];
 for(const part of sections){
  if(!part.match)continue;
  const times=part.count(grade);
  if(!Number.isInteger(times)||times<=0)continue;
  for(const [regexp,kind] of candidates){
   regexp.lastIndex=0;
   for(const match of part.match[part.index].matchAll(regexp)){
    const rate=Boolean(match[3]),func=kinds[kind][rate?1:0];
    if(!func)continue;
    // A structured grade-gated effect takes precedence over textual fallback.
    if((record.effects||[]).some(e=>e.func===func&&Number.isFinite(e.min)&&e.min>0))continue;
    const sign=match[1]==='-'?-1:1;
    result.push({func,a:sign*Number(match[2])*times,fromRefinement:true});
   }
  }
 }
 return result;
}
function gatherEffects(records=[]){
 const flat=Object.fromEntries(keys.map(k=>[k,0]));
 const health={hp:0,mp:0},percent={hp:[],mp:[]},bonuses={},ignored=new Set(),trace=[];
 for(const [source,record,grade] of records){
  const extra=String(source).startsWith('item:')?refinementEffects(record,Number(grade)):[];
  for(const eff of [...(record?.effects||[]),...extra]){
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
// Preserved Remaked js/calc.js attribute rules (Calc STA/STR/AGI/DEX/SPR/INT):
// SelBuffClan_9 adds its selectedIndex to all six attributes;
// Flag.Honor === 1 adds 1 to all six (including SPR in executed formula);
// Flag 14_9 adds floor(InBuff_1 / 10) to STR, AGI and INT.
// Remaked Legacy js/ini.js Skill['Honor'][0..12] and js/calc.js Flag.Honor=1..13.
// A title is mutually exclusive: one active honor at a time.
const honorTitles=Object.freeze([
 ['Нет титула','None',{}],
 ['Стремление к силе','Curiosity to strength',{allAttributes:1}],
 ['Сердце милосердия','Heart of love',{healingSkills:10}],
 ['Путь пламени','Signs of fire',{attackPercent:2,fireMagic:5,fire:10,ice:-15,burn:5}],
 ['Путь льда','Signs of ice',{iceMagic:5,castingResist:2,ice:10,lightning:-15,freeze:5}],
 ['Путь молнии','Signs of lightning',{accuracy:5,lightningMagic:5,fire:-15,lightning:10,knockdown:5}],
 ['Несокрушимая мощь','Raging strong arm',{weaponPhysical:15}],
 ['Гармония всадника','Reconciled rider',{mountedRelease:10}],
 ['Секрет защитника','Guardian secret',{incomingCriticalChance:-10,incomingCriticalDamage:-10}],
 ['Путь тьмы','Signs of darkness',{light:-5,dark:10,charm:5,mentalState:6}],
 ['Путь света','Signs of light',{light:10,dark:-5,magic:3,physicalState:6}],
 ['Крепкое тело','Solid body',{potionRecovery:5,defense:5,incomingPhysical:-5}],
 ['Секрет акробата','Acrobat secret',{accuracy:-10,dodge:10,rangedDodge:3}],
 ['Секрет мастера меча','Swordsman secret',{accuracy:10,dodge:-10,frontAttack:10}]
].map(([ru,en,effects],id)=>Object.freeze({id,ru,en,effects:Object.freeze(effects)})));
function selectedHonor(options={}){
 const raw=options.honorTitle;
 const id=raw==null?(options.honorCuriosity===true?1:0):raw;
 return Number.isInteger(id)&&id>=0&&id<honorTitles.length?honorTitles[id]:null;
}
function potionRecovery({vit,records=[],honorTitle=0,runeJoEun=false}={}){
 if(!Number.isFinite(vit)||vit<0||!Number.isInteger(honorTitle)||
  honorTitle<0||honorTitle>=honorTitles.length)return null;
 const base=100+Math.floor(vit*vit*2/1000),honor=honorTitle===11?5:0;
 let equipment=0;
 for(const [,record,grade] of records){
  for(const effect of record?.effects||[]){
   if(effect.func!=='EP_MASTERY_POTION')continue;
   if(Number.isFinite(effect.min)&&grade<effect.min)continue;
   if(Number.isFinite(effect.max)&&grade>effect.max)continue;
   if(Number.isFinite(effect.a))equipment+=effect.a;
  }
 }
 const rune=runeJoEun===true?5:0;
 return {percent:base+honor+equipment+rune,base,honor,equipment,rune,
  excluded:['unmapped profession Alchemy modifier','unmapped skill-level recovery modifier']};
}
function attributeBuffBonus(options={}){
 const out=Object.fromEntries(keys.map(k=>[k,0])),trace=[];
 const selected=selectedHonor(options);
 if(!selected)return null;
 const guild=Number(options.guildAll??0);
 if(!Number.isInteger(guild)||guild<0||guild>6)return null;
 if(guild){
  for(const key of keys)out[key]+=guild;
  trace.push({source:'Remaked SelBuffClan_9',amount:guild,keys:keys.slice()});
 }
 if(selected.id===1){
  for(const key of keys)out[key]++;
  trace.push({source:'Remaked Honor=1',amount:1,keys:keys.slice()});
 }
 if(options.proelium===true){
  const potion=Number(options.proeliumPotency??0);
  if(!Number.isFinite(potion)||potion<0||potion>100)return null;
  const extra=Math.floor(potion/10);
  for(const key of ['str','agi','int'])out[key]+=extra;
  if(extra)trace.push({source:'Remaked Flag 14_9 / InBuff_1',amount:extra,keys:['str','agi','int']});
 }
 return {flat:out,trace,honor:selected};
}
function base({classData,raceData,jobData,allocation,level,records=[],
 supplementalFlat={},supplementalSource=null,enhancements={},attributeBuffs={}}={}){
 if(!classData||!raceData||!jobData||!Number.isInteger(level)||level<1)return null;
 const effects=gatherEffects(records),basic={},stats={},extra=attributeBuffBonus(attributeBuffs);
 if(!extra)return null;
 for(const key of keys){
  const race=Number(raceData[key]),job=Number(jobData[key]),spent=Number(allocation?.[key]||0);
  if(!Number.isFinite(race)||!Number.isFinite(job)||!Number.isInteger(spent)||spent<0)return null;
  basic[key]=race+job+spent;
  stats[key]=effectiveAbility(basic[key],effects.flat[key]+extra.flat[key]+(Number(supplementalFlat[key])||0),0);
 }
 const rawHp=classData.hp,rawMp=classData.mp;
 const hpBase=classBase(rawHp,level,stats.vit,'vit'),mpBase=classBase(rawMp,level,stats.spi,'spi');
 if(hpBase===null||mpBase===null)return null;
 const hpBonus=bonusFor('hp',hpBase,effects,enhancements);
 const mpBonus=bonusFor('mp',mpBase,effects,enhancements);
 if(!hpBonus||!mpBonus)return null;
 const potion=potionRecovery({vit:stats.vit,records,honorTitle:extra.honor.id,
  runeJoEun:attributeBuffs?.runeJoEun===true});
 return {hp:hpBase+hpBonus.total,mp:mpBase+mpBonus.total,
  hpBase,mpBase,vitalsBonus:{hp:hpBonus,mp:mpBonus},
  hpRaw:rawHp.base+level*rawHp.lv+stats.vit*rawHp.vit,
  mpRaw:rawMp.base+level*rawMp.lv+stats.spi*rawMp.spi,
  stats,basic,effects,honor:extra.honor,potion,attributeBuffs:{flat:extra.flat,trace:extra.trace},supplementalFlat,supplementalSource,
  rounding:'floor-class-cents',source:'Pandora Saga OS / Modern current-vitals class formula',
  verified:false,excluded:['unstructured refinement bonuses','unpublished set effects',
    'unverified passive and conditional skills','other group/temporary buffs']};
}
root.PandoraOSCalculator=Object.freeze({
 base,classBase,bonusFor,halfToEven,effectiveAbility,gatherEffects,refinementEffects,attributeBuffBonus,guildRates,honorTitles,selectedHonor,potionRecovery
});
})(typeof window==='undefined'?globalThis:window);

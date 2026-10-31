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
// Modern Remaked modern/calculator-controls.js 4.23: original 14 preview slots.
// Identity is confirmed for ten; four remain historical and are hidden from player lists.
const potionSources=Object.freeze([
 [50060,'Мясо','Chunk of Meat'],[50001,'Легкое исцеляющее зелье','Painkiller'],
 [50002,'Слабое исцеляющее зелье','Salve'],[50003,'Простое исцеляющее зелье','Remedy'],
 null,[50061,'Таинственное зелье','Mysterious Potion'],
 [50023,'Подснежник','Hepatica'],null,
 [50062,'Тыквенное печенье','Pumpkin Cookie'],[50065,'Астирская конфета','Astian Candy'],
 [50063,'Вкусное шампанское','Elegant Champagne'],
 [50004,'Сильное исцеляющее зелье','Restoration Potion'],null,null
]);
const potionFixed=Object.freeze([20,60,120,180,450,145,20,25,200,150]);
const potionPercent=Object.freeze([5,15,30,18]);
function potionPreview({enabled=false,potionRate=null,maxHp=null}={}){
 const valid=Number.isFinite(potionRate)&&potionRate>=0&&
  Number.isFinite(maxHp)&&maxHp>=0;
 return potionSources.map((item,i)=>{
  const percent=i>=potionFixed.length;
  const original=percent?potionPercent[i-potionFixed.length]:potionFixed[i];
  let value;
  if(!enabled)value=percent?original+'%':String(original);
  else if(!valid)value=null;
  else if(percent)value=String(Math.floor(maxHp*Math.ceil(original*potionRate)/10000));
  else value=String(Math.floor(original*potionRate/100));
  return {id:item?.[0]??null,ru:item?.[1]||null,en:item?.[2]||null,
   current:Boolean(item),percent,base:original,value,enabled:enabled===true};
 });
}
// Source: Remaked Legacy js/calc.js:90-100 Calc('POT').
// Human's third racial passive, "Знахарство", adds 15%; it is NOT a profession.
// Status.Skill[0][0]+[1] is aggregate *trained* green melee mastery, not blue
// potential plus trained. 10 points bonus per 10 green for warrior lineage Lv12+.
const warriorLineage=new Set(['WARRIOR','GLADIATOR','JUGGERNAUT','DRAGOON','KNIGHT','GENERAL','PALADIN']);
function potionRecovery({vit,records=[],honorTitle=0,runeJoEun=false,
 racialPassiveId=null,jobKey=null,level=null,meleeMastery=null}={}){
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
 const racial=racialPassiveId===900010003?15:0;
 if(meleeMastery!==null&&(!Number.isInteger(meleeMastery)||meleeMastery<0))return null;
 const mastery=warriorLineage.has(jobKey)&&Number.isInteger(level)&&level>=12
  ?Math.floor((meleeMastery??0)/10)*10:0;
 return {percent:base+honor+equipment+rune+racial+mastery,
  base,honor,equipment,rune,racial,mastery,
  source:'Remaked Legacy Calc(POT); verified OS racial ID 900010003',
  excluded:['non-legacy/current-server conditional recovery modifiers']};
}
// Remaked Legacy js/calc.js RES* formulas: only confirmed base terms,
// chosen Honor, selected racial passive and structured OS equipment effects.
// Active casts, guild resistances, gem conditions and other buffs are excluded.
function resistancePreview({stats={},bonuses={},honorTitle=0,racialPassiveId=null}={}){
 if(!Number.isFinite(stats.vit)||!Number.isFinite(stats.spi)||
  !Number.isInteger(honorTitle)||honorTitle<0||honorTitle>=honorTitles.length)return null;
 const title=honorTitles[honorTitle].effects,elementKeys=[
  'fire','ice','lightning','poison','charm','light','dark','magic'
 ];
 const racial={
  charm:racialPassiveId===900020003?20:0, // Elf: Стойкость разума
  physicalState:racialPassiveId===900010002?15:0, // Human: Приспособляемость
  incomingPhysical:racialPassiveId===900050001?-10:0, // Enkidu: Каменная кожа
  incomingMagic:racialPassiveId===900060001?-10:0 // Lapin: Антимагия
 };
 const elements={};
 for(const key of elementKeys){
  const equip=Number(bonuses[key]??0);
  if(!Number.isFinite(equip))return null;
  elements[key]=equip+(Number(title[key])||0)+(Number(racial[key])||0);
 }
 return {elements,
  states:{
   physical:Math.floor(stats.vit/28)*7+(Number(title.physicalState)||0)+racial.physicalState,
   mental:Math.floor(stats.spi/28)*7+(Number(title.mentalState)||0)
  },
  mitigation:{
   physical:(Number(title.incomingPhysical)||0)+racial.incomingPhysical,
   magic:racial.incomingMagic
  },
  verified:false,excluded:['active skills','conditional passives','other guild bonuses','missing equipment effects']};
}
// Remaked calc.js LPRecSPD / MPRecSPD: natural recovery *speed indices*.
// Guild 3 and 4: +5/+8; guild 8 Healing: +10/+20/+30 to both.
// These are not HP/MP per tick; no inferred time unit or conversion.
function regenerationPreview({stats={},guild={}}={}){
 if(!Number.isFinite(stats.vit)||!Number.isFinite(stats.spi))return null;
 const recovery=[0,5,8],healing=[0,10,20,30];
 const keys=['guildLifeRecovery','guildManaRecovery','guildHealing'];
 const levels=keys.map((key,i)=>guild[key]??0);
 if(levels.some((value,i)=>!Number.isInteger(value)||value<0||value>=(i===2?healing.length:recovery.length)))return null;
 const common=healing[levels[2]];
 const hpBase=Math.floor(stats.vit/10),mpBase=Math.floor(stats.spi/10);
 return {
  hp:{base:hpBase,guild:recovery[levels[0]],healing:common,
   total:hpBase+recovery[levels[0]]+common},
  mp:{base:mpBase,guild:recovery[levels[1]],healing:common,
   total:mpBase+recovery[levels[1]]+common},
  verified:false,excluded:['equipment effects','active skill modifiers']};
}
// Legacy Remaked Calc('ATK','ACC','Dodge','Cri') direct base terms; current
// OS equipment W/weaponPlus uses its own (different at +7..10) refinement table.
// Excludes unported active buffs/weapon-specific Soul effects; not a final OS stat.
function weaponAttackPreview({str,weapon=null,grade=0,weaponPlus=null,honorTitle=0}={}){
 if(!Number.isFinite(str)||str<0||!Number.isInteger(grade)||grade<0||grade>10||
  !Number.isInteger(honorTitle)||honorTitle<0||honorTitle>=honorTitles.length)return null;
 const physical=Math.floor(str/2);
 if(!weapon)return {known:physical+1,unarmed:true,physical,
  weaponDamage:0,refinement:0,strengthRate:0,honor:0,verified:false};
 const damage=weapon.W;
 if(!Number.isFinite(damage)||damage<0)return null;
 let refinement=0;
 if(grade){
  const tier=weaponPlus?.[grade]||weaponPlus?.[String(grade)];
  if(!tier||!Number.isFinite(tier.ratio)||!Number.isFinite(tier.flat))return null;
  refinement=Math.floor(damage*tier.ratio/100)+tier.flat;
 }
 const table=[[130,.9],[120,.75],[110,.6],[100,.5],[90,.4],[80,.32],
  [70,.24],[60,.18],[50,.12],[40,.08],[30,.04],[20,.02]];
 const strengthRate=table.find(([threshold])=>str>=threshold)?.[1]??0;
 const raw=physical+damage+refinement+(damage+refinement)*strengthRate;
 const honor=honorTitle===3?Math.floor(raw*.02):0;
 return {known:Math.ceil(raw+honor),raw,unarmed:false,physical,
  weaponDamage:damage,refinement,strengthRate,honor,verified:false};
}
// Remaked Legacy Calc('DEF'): raw equipped armor class contributes first;
// all armor enhancement and active-skill multipliers remain outside this preview.
function defensePreview({records=[],honorTitle=0}={}){
 if(!Array.isArray(records)||!Number.isInteger(honorTitle)||
  honorTitle<0||honorTitle>=honorTitles.length)return null;
 let armor=0,equipment=0;
 for(const [source,record,grade] of records){
  if(!record||typeof record!=='object')continue;
  // Only equipped items carry the armor-class field. Souls provide effects
  // but their own item metadata must never inflate physical armor totals.
  if(String(source).startsWith('item:')&&record.AC!=null){
   if(!Number.isFinite(record.AC))return null;
   armor+=record.AC;
  }
  for(const e of record.effects||[]){
   if(e.func!=='EP_ARMORCLASS_CONST')continue;
   if(Number.isFinite(e.min)&&grade<e.min)continue;
   if(Number.isFinite(e.max)&&grade>e.max)continue;
   if(!Number.isFinite(e.a))return null;
   equipment+=e.a;
  }
 }
 const honor=honorTitle===11?5:0;
 return {armor,equipment,honor,known:armor+equipment+honor,
  verified:false,excluded:['armor refinement scaling','Defender and Raging Soul active skills',
   'conditional item/set multipliers','OS server damage mitigation']};
}
// Source-backed equipment modifiers from current OS item/Soul structured EP codes.
 // Apply Remaked's ceil(base * rate / 100) separately to every source effect.
 // Deliberately ignore unstructured gear description text and conditional skills.
function equippedCombatModifiers(records=[]){
 const out={attackFlat:0,attackPercent:[],accuracyPercent:[],
  attackSpeedFlat:0,manaDiscount:0,traces:[]};
 if(!Array.isArray(records))return null;
 const lookup={EP_DAMAGERATE_CONST:'attackFlat',
  EP_SKILL_EQUIP_DAMAGERATE:'attackFlat',
  EP_DAMAGERATE_SCALE:'attackPercent',EP_TOHIT_SCALE:'accuracyPercent',
  EP_ATTACKINTERVAL_SCALE:'attackSpeedFlat',
  EP_RACE_MANA_COSTCUT:'manaDiscount'};
 for(const [source,record,grade] of records){
  if(!record||typeof record!=='object'||!Array.isArray(record.effects))continue;
  for(const effect of record.effects){
   const target=lookup[effect.func];
   if(!target)continue;
   if(Number.isFinite(effect.min)&&grade<effect.min)continue;
   if(Number.isFinite(effect.max)&&grade>effect.max)continue;
   const amount=effect.a;
   if(!Number.isFinite(amount))continue;
   if(target==='attackFlat'||target==='attackSpeedFlat'||target==='manaDiscount')
    out[target]+=amount;
   else out[target].push({source,rate:amount});
   out.traces.push({source,ep:effect.func,value:amount});
  }
 }
 return out;
}
function combatPreview({stats={},level=null,bonuses={},honorTitle=0,racialPassiveId=null,
 weapon=null,weaponGrade=0,weaponPlus=null,records=[]}={}){
 if(!Number.isInteger(level)||level<1||
  !['dex','agi','str'].every(key=>Number.isFinite(stats[key])&&stats[key]>=0)||
  !Number.isInteger(honorTitle)||honorTitle<0||honorTitle>=honorTitles.length)return null;
 const title=honorTitles[honorTitle].effects,read=key=>{
  const n=bonuses[key]??0;return Number.isFinite(n)?n:null;
 };
 const accEquip=read('accuracy'),evEquip=read('dodge'),critEquip=read('criticalChance');
 if(accEquip===null||evEquip===null||critEquip===null)return null;
 // Direct Remaked Legacy stepped AGI-to-Dodge table, not a linear coefficient.
 const dodgeSteps=[[140,98],[130,85],[120,72],[110,61],[100,50],[90,41],
  [80,32],[70,25],[60,18],[50,13],[40,8],[30,5],[20,2],[10,1]];
 const dodgeStep=dodgeSteps.find(([threshold])=>stats.agi>=threshold)?.[1]??0;
 const accuracyBase=level+stats.dex,dodgeBase=level+stats.agi+dodgeStep;
 const critBase=1+Math.floor(stats.dex/10);
 const accuracy=accuracyBase+accEquip+(title.accuracy||0);
 const dodge=dodgeBase+evEquip+(title.dodge||0);
 // Current OS EP_CRITICALRATE_CONST (Myrine +5) differs from old Remaked +2.
 const critical=critBase+critEquip+(racialPassiveId===900040001?5:0);
 // Current OS race skills are percentage effects; rounding/effect stage is
 // unknown, so do not fold them into the Legacy flat accuracy/dodge subtotal.
 const racialRate={accuracy:racialPassiveId===900040002?10:0,
  dodge:racialPassiveId===900040003?5:0};
 const attack=weaponAttackPreview({str:stats.str,weapon,grade:weaponGrade,
  weaponPlus,honorTitle});
 const defense=defensePreview({records,honorTitle});
 const equipped=equippedCombatModifiers(records);
 if(!defense||!equipped)return null;
 const atkPct=attack?equipped.attackPercent.map(e=>({
  ...e,bonus:Math.ceil((attack.raw??attack.known)*e.rate/100)})):[];
 const atkExtras=equipped.attackFlat+atkPct.reduce((sum,e)=>sum+e.bonus,0);
 const effectiveAttack=attack?{...attack,flatEquipment:equipped.attackFlat,
  percentEquipment:atkPct,
  known:Math.ceil((attack.raw??attack.known)+attack.honor+atkExtras)}:null;
 const accuracyPercent=equipped.accuracyPercent.map(e=>({
  ...e,bonus:Math.ceil(accuracyBase*e.rate/100)}));
 const accuracyBonus=accuracyPercent.reduce((sum,e)=>sum+e.bonus,0);
 // Legacy Calc('ATKSPD'): 100 + 2*floor(AGI/10) +
 // 3*floor(AGI/20) + floor(AGI/10); typed as a speed index, not hits/sec.
 const speedBase=100+3*Math.floor(stats.agi/10)+3*Math.floor(stats.agi/20);
 const attackSpeed={base:speedBase,equipment:equipped.attackSpeedFlat,
  known:speedBase+equipped.attackSpeedFlat,verified:false};
 // Legacy Calc('CastSPD'): 100 + 5*floor(DEX/10), without temporary casts.
 const castingSpeed={base:100+5*Math.floor(stats.dex/10),
  verified:false,excluded:['active spell buffs','unknown Soul conditions']};
 // Legacy Calc('ReduceMP'): 100-floor(INT^2/1000). OS Elf
 // EP_RACE_MANA_COSTCUT 900020001 = 15; equipped same-EP reductions stack.
 const intReduction=Number.isFinite(stats.int)&&stats.int>=0?
  Math.floor(stats.int*stats.int/1000):null;
 const elfReduction=racialPassiveId===900020001?15:0;
 const manaCost=intReduction===null?null:{
  base:100-intReduction,intReduction,racial:elfReduction,
  equipment:equipped.manaDiscount,
  remaining:100-intReduction-elfReduction-equipped.manaDiscount,
  verified:false,excluded:['gear enhancement-dependent zero-valued effects',
   'conditional active skill discounts']};
 return {attack:effectiveAttack,defense,attackSpeed,castingSpeed,manaCost,
  accuracy:{base:accuracyBase,equipment:accEquip,
   percentage:accuracyPercent,honor:title.accuracy||0,
   known:accuracy+accuracyBonus},
  dodge:{base:dodgeBase,agilityStep:dodgeStep,equipment:evEquip,
   honor:title.dodge||0,known:dodge},
  critical:{base:critBase,equipment:critEquip,
   racial:racialPassiveId===900040001?5:0,known:critical},
  racialRate,verified:false,
  excluded:['active combat skills','class offensive passives','other conditional Souls and sets',
   'mounted penalties','current OS percent-bonus rounding']};
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
 supplementalFlat={},supplementalSource=null,enhancements={},attributeBuffs={},
 potionContext={},combatContext={}}={}){
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
  runeJoEun:attributeBuffs?.runeJoEun===true,level,...potionContext});
 const resistances=resistancePreview({stats,bonuses:effects.bonuses,
  honorTitle:extra.honor.id,racialPassiveId:potionContext?.racialPassiveId});
 const regeneration=regenerationPreview({stats,guild:attributeBuffs});
 const combat=combatPreview({stats,level,bonuses:effects.bonuses,records,
  honorTitle:extra.honor.id,racialPassiveId:potionContext?.racialPassiveId,...combatContext});
 // An unavailable weapon/armor preview must NEVER erase otherwise valid HP/MP.
 if(!resistances||!regeneration)return null;
 return {hp:hpBase+hpBonus.total,mp:mpBase+mpBonus.total,
  hpBase,mpBase,vitalsBonus:{hp:hpBonus,mp:mpBonus},
  hpRaw:rawHp.base+level*rawHp.lv+stats.vit*rawHp.vit,
  mpRaw:rawMp.base+level*rawMp.lv+stats.spi*rawMp.spi,
  stats,basic,effects,honor:extra.honor,potion,resistances,regeneration,combat,
  attributeBuffs:{flat:extra.flat,trace:extra.trace},supplementalFlat,supplementalSource,
  rounding:'floor-class-cents',source:'Pandora Saga OS / Modern current-vitals class formula',
  verified:false,excluded:['unstructured refinement bonuses','unpublished set effects',
    'unverified passive and conditional skills','other group/temporary buffs']};
}
root.PandoraOSCalculator=Object.freeze({
 base,classBase,bonusFor,halfToEven,effectiveAbility,gatherEffects,refinementEffects,attributeBuffBonus,guildRates,honorTitles,selectedHonor,potionRecovery,potionPreview,resistancePreview,regenerationPreview,combatPreview,weaponAttackPreview,defensePreview,equippedCombatModifiers
});
})(typeof window==='undefined'?globalThis:window);

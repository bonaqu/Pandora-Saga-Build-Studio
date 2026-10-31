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
 EP_CRITICALRATE_CONST:'criticalChance',
 EP_IMMUNE_VIT_TYPE:'physicalStatus',EP_IMMUNE_SPI_TYPE:'mentalStatus',
 EP_IMMUNE_BURN:'burn',EP_IMMUNE_STUN:'stun',
 EP_IMMUNE_NUMB:'numb',EP_IMMUNE_TUMBLE:'tumble',
 EP_IMMUNE_KNOCKBACK:'knockback',EP_IMMUNE_SLEEP:'sleep',
 EP_IMMUNE_SILENCE:'silence',EP_IMMUNE_EVIL:'evil',
 EP_IMMUNE_CURSE:'curse',EP_IMMUNE_DISEASE:'disease',
 EP_IMMUNE_RAVING:'madness',EP_BLOCK_BREAK_RESIST:'blockBreak',
 EP_CRITICAL_REGIST:'incomingCriticalReduction'
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
// Official current OS itemForth level snapshots override narrative parsing.
function sourceEffects(source,record,grade,itemForth=null){
 if(!record||typeof record!=='object')return [];
 const primary=Array.isArray(record.effects)?record.effects:[];
 if(!String(source).startsWith('item:'))return primary;
 const snapshot=itemForth?.[String(record.id)]?.[String(grade)];
 if(Array.isArray(snapshot))return [...primary,...snapshot];
 return [...primary,...refinementEffects(record,Number(grade))];
}

// Current OS unison.json defines companion item IDs and root-item improvement
// thresholds. Count companions excluding root, as the actual item descriptions
// specify; grade applies to the set's root item. Only known linear coefficients
// (f=0, b=0) are numeric. Status-type zero codes remain named effects, not
// invented resistance percentages.
function unisonPreview({records=[],catalog=null}={}){
 const active=[],supplemental=[],pending=[];
 if(!catalog||typeof catalog!=='object'||!Array.isArray(records))
  return {active,supplemental,pending};
 const equipped=new Map();
 for(const [source,item,grade] of records){
  if(!String(source).startsWith('item:')||!item||!Number.isInteger(item.id))continue;
  equipped.set(String(item.id),{item,grade});
 }
 for(const [id,set] of Object.entries(catalog)){
  if(!Array.isArray(set?.members)||!Array.isArray(set?.rows))continue;
  const root=equipped.get(id);
  if(!root||!Number.isInteger(root.grade))continue;
  const companionIds=[...new Set(set.members.map(String))];
  const count=companionIds.filter(key=>equipped.has(key)).length;
  const matched=companionIds.filter(key=>equipped.has(key));
  const effects=[],conditions=[];
  for(const row of set.rows){
   if(!Number.isInteger(row.minC)||!Number.isInteger(row.maxC)||
    !Number.isInteger(row.minL)||!Number.isInteger(row.maxL)||
    count<row.minC||count>row.maxC||
    root.grade<row.minL||root.grade>row.maxL)continue;
   const a=row.a,b=row.b;
   if(!a||!b||a.f!==0||
    !Number.isFinite(a.p)||!Number.isFinite(a.c)||
    b.f!==0||b.p!==0||b.c!==0){
    pending.push({id,func:row.func});continue;
   }
   const value=a.p*root.grade+a.c;
   if(!Number.isFinite(value)||typeof row.func!=='string')continue;
   if(row.func==='EP_PROTECTION_TUMBLE'){
    conditions.push({func:row.func,label:'Защита от падения'});
    continue;
   }
   effects.push({func:row.func,a:value,b:0,fromUnison:true});
  }
  if(effects.length||conditions.length){
   active.push({id:Number(id),name:root.item.name||'Комплект',
    companionCount:count,required:companionIds.length,matched,
    grade:root.grade,effects,conditions});
   if(effects.length)supplemental.push(['set:'+id,
    {name:root.item.name||'Комплект',effects},root.grade]);
  }
 }
 return {active,supplemental,pending};
}
function gatherEffects(records=[],itemForth=null){
 const flat=Object.fromEntries(keys.map(k=>[k,0]));
 const health={hp:0,mp:0},percent={hp:[],mp:[]},bonuses={},ignored=new Set(),trace=[];
 for(const [source,record,grade] of records){
  for(const eff of sourceEffects(source,record,grade,itemForth)){
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
 ['Сила познания','Curiosity to strength',{allAttributes:1}],
 ['Золотое сердце','Heart of love',{healingSkills:10}],
 ['Том огня','Signs of fire',{attackPercent:2,fireMagic:5,fire:10,ice:-15,burn:5}],
 ['Том льда','Signs of ice',{iceMagic:5,castingResist:2,ice:10,lightning:-15,freeze:5}],
 ['Том грозы','Signs of lightning',{accuracy:5,lightningMagic:5,fire:-15,lightning:10,knockdown:5}],
 ['Бешенство','Raging strong arm',{weaponPhysical:15}],
 ['Мастер наездника','Reconciled rider',{mountedRelease:10}],
 ['Тайна стража','Guardian secret',{incomingCriticalChance:-10,incomingCriticalDamage:-10}],
 ['Том тьмы','Signs of darkness',{light:-5,dark:10,charm:5,mentalState:6}],
 ['Том света','Signs of light',{light:10,dark:-5,magic:3,physicalState:6}],
 ['Сила воли','Solid body',{potionRecovery:5,defense:5,incomingPhysical:-5}],
 ['Невероятная ловкость','Acrobat secret',{accuracy:-10,dodge:10,rangedDodge:3}],
 ['Мастер боя','Swordsman secret',{accuracy:10,dodge:-10,frontAttack:10}]
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
 racialPassiveId=null,jobKey=null,level=null,meleeMastery=null,itemForth=null}={}){
 if(!Number.isFinite(vit)||vit<0||!Number.isInteger(honorTitle)||
  honorTitle<0||honorTitle>=honorTitles.length)return null;
 const base=100+Math.floor(vit*vit*2/1000),honor=honorTitle===11?5:0;
 let equipment=0;
 for(const [source,record,grade] of records){
  for(const effect of sourceEffects(source,record,grade,itemForth)){
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
// Current OS skill 260007001 requires Warding 26 and supplies exactly
// three TARGET resistance effects. The duplicate CASTER Numb is not additive.
function wardingStatusPassive({jobKey=null,wardingMastery=0,wardingCap=null,skillCatalog=null}={}){
 if(!Number.isInteger(wardingMastery)||wardingMastery<26||
  !Number.isInteger(wardingCap)||wardingCap<26||
  wardingMastery>wardingCap||!jobKey||!skillCatalog)return null;
 const skill=skillCatalog['260007001'];
 if(skill?.skillType!=='PASSIVE'||skill.branch!=='warding'||
  !skill.classes?.[jobKey]||
  !skill.reqs?.some(req=>req.branch==='warding'&&req.amount===26))return null;
 const values={},keys={EP_IMMUNE_STUN:'stun',EP_IMMUNE_NUMB:'numb',EP_IMMUNE_TUMBLE:'tumble'};
 for(const [ep,key] of Object.entries(keys)){
  const matches=skill.funcs?.filter(row=>row.ep===ep&&row.dir==='TARGET')||[];
  if(matches.length!==1||!Number.isFinite(matches[0].fv1?.[3]))return null;
  values[key]=matches[0].fv1[3];
 }
 return values;
}
// Remaked Legacy js/calc.js RES* formulas: only confirmed base terms,
// chosen Honor, selected racial passive and structured OS equipment effects.
// Active casts, guild resistances, gem conditions and other buffs are excluded.
function resistancePreview({stats={},bonuses={},honorTitle=0,racialPassiveId=null,
 jobKey=null,wardingMastery=0,wardingCap=null,skillCatalog=null}={}){
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
 const statusKeys=['burn','stun','numb','tumble','knockback','sleep',
  'silence','evil','curse','disease','madness','blockBreak'];
 const status={},passive=wardingStatusPassive({jobKey,wardingMastery,wardingCap,skillCatalog});
 const honorStatus={burn:honorTitle===3?5:0,numb:honorTitle===4?5:0,
  tumble:honorTitle===5?5:0};
 const dwarfStatus=racialPassiveId===900030001?{stun:10,tumble:10}:{};
 for(const key of statusKeys){
  const amount=Number(bonuses[key]??0);
  if(!Number.isFinite(amount))return null;
  status[key]=amount+(honorStatus[key]||0)+(dwarfStatus[key]||0)+(passive?.[key]||0);
 }
 for(const key of elementKeys){
  const equip=Number(bonuses[key]??0);
  if(!Number.isFinite(equip))return null;
  elements[key]=equip+(Number(title[key])||0)+(Number(racial[key])||0);
 }
 return {elements,status,wardingPassive:passive,
  states:{
   physical:Math.floor(stats.vit/28)*7+(Number(title.physicalState)||0)+
    racial.physicalState+(Number(bonuses.physicalStatus)||0),
   mental:Math.floor(stats.spi/28)*7+(Number(title.mentalState)||0)+
    (Number(bonuses.mentalStatus)||0)
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
// Legacy Calc('LPSkill','LPRec','MPRec'): the ordinary standing recovery
// amount and healing-skill efficiency are independent from speed indices.
function recoveryAmountPreview({maxHp,maxMp,stats={}}={}){
 if(!Number.isFinite(maxHp)||maxHp<0||!Number.isFinite(maxMp)||maxMp<0||
  !Number.isFinite(stats.vit)||stats.vit<0||
  !Number.isFinite(stats.spi)||stats.spi<0)return null;
 return {hp:{maxContribution:Math.floor(maxHp/35),
   attributeContribution:Math.floor(stats.vit/3),
   known:Math.floor(maxHp/35)+Math.floor(stats.vit/3)},
  mp:{maxContribution:Math.floor(maxMp/25),
   attributeContribution:Math.floor(stats.spi/3),
   known:Math.floor(maxMp/25)+Math.floor(stats.spi/3)},
  source:"Remaked Legacy LPRec/MPRec standing values",verified:false,
  excluded:['conditional recovery effects','sitting recovery']};
}
function healingSkillPreview({honorTitle=0,records=[],itemForth=null}={}){
 if(!Number.isInteger(honorTitle)||honorTitle<0||honorTitle>=honorTitles.length)return null;
 let equipment=0;
 for(const [source,record,grade] of records)
  for(const effect of sourceEffects(source,record,grade,itemForth)){
   if(effect.func!=='EP_CAST_HEAL_LIFE_SCALE')continue;
   if(Number.isFinite(effect.min)&&grade<effect.min)continue;
   if(Number.isFinite(effect.max)&&grade>effect.max)continue;
   if(Number.isFinite(effect.a))equipment+=effect.a;
  }
 const honor=honorTitle===2?10:0;
 return {base:100,honor,equipment,percent:100+honor+equipment,verified:false,
  excluded:['active healing skills','special healing conversions']};
}
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
function defensePreview({records=[],honorTitle=0,itemForth=null}={}){
 if(!Array.isArray(records)||!Number.isInteger(honorTitle)||
  honorTitle<0||honorTitle>=honorTitles.length)return null;
 let armor=0,equipment=0,refinement=0,armorPieces=0;
 const percentage=[];
 const enhanceable=new Set(['shield','head','body','gloves','legs','feet']);
 for(const [source,record,grade] of records){
  if(!record||typeof record!=='object')continue;
  // Only equipped items carry the armor-class field. Souls provide effects
  // but their own item metadata must never inflate physical armor totals.
  if(String(source).startsWith('item:')&&record.AC!=null){
   if(!Number.isFinite(record.AC))return null;
   armor+=record.AC;
   // Exact Legacy equip.js Sh/He/To/Gl/Ku/Bo equipment rules.
   // Only a literal legacy empty-name sentinel is excluded. Localized names
   // MUST NOT change numerical calculations (RU/EN or punctuation).
   if(enhanceable.has(record.slot)&&record.name!=='-'){
    if(!Number.isInteger(grade)||grade<0||grade>10)return null;
    refinement+=Math.floor(grade*1.5);armorPieces++;
   }
  }
  for(const e of sourceEffects(source,record,grade,itemForth)){
   if(e.func!=='EP_ARMORCLASS_CONST'&&e.func!=='EP_ARMORCLASS_SCALE')continue;
   if(Number.isFinite(e.min)&&grade<e.min)continue;
   if(Number.isFinite(e.max)&&grade>e.max)continue;
   if(!Number.isFinite(e.a))return null;
   if(e.func==='EP_ARMORCLASS_CONST')equipment+=e.a;
   else percentage.push({source,rate:e.a});
  }
 }
 const direct=armor+equipment+refinement;
 const percentParts=percentage.map(e=>({...e,bonus:Math.ceil(direct*e.rate/100)}));
 const percentBonus=percentParts.reduce((sum,x)=>sum+x.bonus,0);
 const honor=honorTitle===11?5:0;
 return {armor,equipment,refinement,armorPieces,honor,percentParts,
  percentBonus,known:direct+percentBonus+honor,
  verified:false,excluded:['other armor conditional multipliers',
   'Defender and Raging Soul active skills','OS server damage mitigation']};
}
// Source-backed equipment modifiers from current OS item/Soul structured EP codes.
 // Apply Remaked's ceil(base * rate / 100) separately to every source effect.
 // Deliberately ignore unstructured gear description text and conditional skills.
function equippedCombatModifiers(records=[],itemForth=null){
 const out={attackFlat:0,attackPercent:[],accuracyPercent:[],
  attackSpeedFlat:0,manaDiscount:0,movement:0,skillDelay:0,
  backAttackRate:0,elementDamageRate:0,castInterruptResist:0,
  mpRecoveryRate:0,skillDelayFinal:0,traces:[]};
 if(!Array.isArray(records))return null;
 const lookup={EP_DAMAGERATE_CONST:'attackFlat',
  EP_SKILL_EQUIP_DAMAGERATE:'attackFlat',
  EP_DAMAGERATE_SCALE:'attackPercent',EP_TOHIT_SCALE:'accuracyPercent',
  EP_ATTACKINTERVAL_SCALE:'attackSpeedFlat',
  EP_RACE_MANA_COSTCUT:'manaDiscount',EP_MOVESPEED_SCALE:'movement',
  EP_SKILL_DELAY:'skillDelay',EP_ATTACK_BACKATK_RATE:'backAttackRate',
  EP_ELEMENT_DAMAGE_SCALE:'elementDamageRate',
  EP_CASTINGCANCEL_RESISTANCE_CONST:'castInterruptResist',
  EP_HEAL_TIME_SCALE:'mpRecoveryRate',
  EP_SKILL_DELAY_FIN:'skillDelayFinal'};
 for(const [source,record,grade] of records){
  if(!record||typeof record!=='object')continue;
  for(const effect of sourceEffects(source,record,grade,itemForth)){
   const target=lookup[effect.func];
   if(!target)continue;
   if(Number.isFinite(effect.min)&&grade<effect.min)continue;
   if(Number.isFinite(effect.max)&&grade>effect.max)continue;
   const amount=effect.a;
   if(!Number.isFinite(amount))continue;
   if(target==='attackPercent'||target==='accuracyPercent')
    out[target].push({source,rate:amount});
   else out[target]+=amount;
   out.traces.push({source,ep:effect.func,value:amount});
  }
 }
 return out;
}

// Remaked Modern 4.x enhancement-effects.js EFFECT_MAP. These source-backed
// gear effects target their original Legacy result slots; never infer a
// damage packet, triggered skill, or percentage effect from an arbitrary EP.
const secondaryEffectTargets=Object.freeze({
 EP_ONDAMAGE_FIN_DAMAGE_CONST:'incomingPhysicalFlat',
 EP_ONDAMAGE_FIN_DAMAGE_SCALE:'incomingPhysicalPercent',
 EP_ONDAMAGE_ELEM_SCALE:'incomingMagicPercent',
 EP_AURADAMAGE_CONST:'auraFlat',
 EP_AURADAMAGE_SCALE:'auraPercent',
 EP_SKILL_BENCH:'cooldown',
 EP_RESTMAP_MOVESPEED_SCALE:'townMovement',
 EP_BADEFFECT_TIME_CAST_SCALE:'outgoingDebuffDuration',
 EP_BADEFFECT_TIME_SCALE:'incomingDebuffDurationReduction',
 EP_ONDAMAGE_REFLECTION:'physicalReflection',
 EP_BUFF_TOHIT_SCALE:'debuffSuccess',
 EP_SPECIAL_WARDING_TYPE2:'damageNegation',
 EP_HEAL_TIME_SCALE:'manaRecoverySpeed',
 EP_SKILL_DELAY:'castSpeedReduction',
 EP_SKILL_DELAY_FIN:'castSpeedFinal'
});
function secondaryEffectsPreview({records=[],itemForth=null}={}){
 if(!Array.isArray(records))return null;
 const stats=Object.fromEntries(Object.values(secondaryEffectTargets).map(x=>[x,0]));
 const traces=[];
 for(const [source,record,grade] of records){
  for(const effect of sourceEffects(source,record,grade,itemForth)){
   const field=secondaryEffectTargets[effect.func];
   if(!field)continue;
   if((Number.isFinite(effect.min)&&grade<effect.min)||
      (Number.isFinite(effect.max)&&grade>effect.max))continue;
   if(!Number.isFinite(effect.a))continue;
   // These two effects are explicitly 'negate' in Remaked's EFFECT_MAP.
   const amount=['EP_BADEFFECT_TIME_SCALE','EP_SKILL_DELAY'].includes(effect.func)?
    -effect.a:effect.a;
   stats[field]+=amount;
   traces.push({source,ep:effect.func,field,value:amount});
  }
 }
 return {...stats,traces};
}
// Legacy MATK step table: INT does not scale linearly.
const magicSteps=[[115,50],[110,49],[105,41],[100,40],[95,35.25],
 [90,34.25],[85,29.75],[80,28.75],[75,24.75],[70,23.75],
 [65,20.25],[60,19.25],[55,16],[50,15],[45,12.25],[40,11.25],
 [35,8.75],[30,7.75],[25,5.75],[20,4.75],[15,3],[10,2],[5,1]];
const magicLineage=new Set(['WIZARD','WARLOCK','CONJURER']);
const meleeLineage=new Set(['GLADIATOR','JUGGERNAUT','DRAGOON']);
const archerLineage=new Set(['ARCHER','SNIPER','PREDATOR']);
const knightLineage=new Set(['KNIGHT','GENERAL','PALADIN']);
const warriorBuffClasses=new Set(['WARRIOR','GLADIATOR','JUGGERNAUT','DRAGOON','KNIGHT','GENERAL','PALADIN']);
// The four current OS toggles have fixed, ID-backed skill records. When an
// OS catalog is supplied, validate both access and EP effect values against it.
const combatSkillIds=Object.freeze({
 lunge:100051001,warCry:320001001,raging:100052001,defender:100053001,
 concentration:100054001
});
const combatSkillRequirements=Object.freeze({
 lunge:['EP_ATTACKINTERVAL_SCALE'],
 warCry:['EP_DAMAGERATE_CONST','EP_DAMAGERATE_SCALE'],
 raging:['EP_DAMAGERATE_SCALE','EP_ARMORCLASS_SCALE'],
 defender:['EP_DAMAGERATE_SCALE','EP_ARMORCLASS_SCALE'],
 concentration:['EP_TOHIT_CONST']
});
const combatSkillDefaults=Object.freeze({
 lunge:{EP_ATTACKINTERVAL_SCALE:15},
 warCry:{EP_DAMAGERATE_CONST:10,EP_DAMAGERATE_SCALE:20},
 raging:{EP_DAMAGERATE_SCALE:30,EP_ARMORCLASS_SCALE:-60},
 defender:{EP_DAMAGERATE_SCALE:-20,EP_ARMORCLASS_SCALE:40},
 concentration:{EP_TOHIT_CONST:100}
});
function combatSkillSource(skillCatalog,kind){
 if(!skillCatalog)return {effects:combatSkillDefaults[kind],fromCatalog:false};
 const skill=skillCatalog[String(combatSkillIds[kind])];
 if(!skill||!Array.isArray(skill.funcs))return null;
 const effects={};
 for(const name of combatSkillRequirements[kind]){
  const rows=skill.funcs.filter(x=>x.ep===name&&x.dir==='TARGET');
  if(rows.length!==1||!Array.isArray(rows[0].fv1))return null;
  const value=rows[0].fv1[3];
  if(!Number.isFinite(value)||Math.abs(value)>100)return null;
  effects[name]=value;
 }
 return {effects,fromCatalog:true,record:skill};
}

const evasionLineage=new Set(['AGENT','ASSASSIN','DISTURBANCE']);

// Two further OS skill records match explicit live effects and retained Remaked
// ACC/Dodge/MoveSPD formulas. Only opt-in selections can affect the build.
const supportSkillIds=Object.freeze({windAssist:260006001,windBlessing:320004001});
const supportRequirements=Object.freeze({
 windAssist:['EP_AVOIDANCE_CONST','EP_AVOIDANCE_SCALE'],
 windBlessing:['EP_MOVESPEED_SCALE']
});
function supportSkillSource(skillCatalog,kind){
 const record=skillCatalog?.[String(supportSkillIds[kind])];
 if(!record||!Array.isArray(record.funcs)||!supportRequirements[kind])return null;
 const values={};
 for(const ep of supportRequirements[kind]){
  const found=record.funcs.filter(x=>x.ep===ep&&x.dir==='TARGET');
  if(found.length!==1||!Number.isFinite(found[0].fv1?.[3])||
   Math.abs(found[0].fv1[3])>100)return null;
  values[ep]=found[0].fv1[3];
 }
 return {record,values};
}
function supportSkillAvailability({selected={},skillCatalog=null,jobKey=null,level=1,
 branchMasteries={}}={}){
 const result={windAssist:false,windBlessing:false};
 for(const [kind,setting] of [['windAssist','combatWindAssist'],
  ['windBlessing','combatWindBlessing']]){
  const source=supportSkillSource(skillCatalog,kind);
  const skill=source?.record;
  const requirementValid=Array.isArray(skill?.reqs)&&skill.reqs.every(req=>
   typeof req?.branch==='string'&&Number.isInteger(req.amount)&&req.amount>=0&&
   Number(branchMasteries?.[req.branch]??0)>=req.amount);
  result[kind]=Boolean(selected?.[setting]===true&&skill?.classes?.[jobKey]&&
   Number.isInteger(skill.charLevel)&&level>=skill.charLevel&&
   skill.learnable!==false&&skill.prereq==null&&requirementValid);
 }
 return result;
}
function magicAttackPreview({int,jobKey=null,magicMastery=0,weapon=null,guildArouse=0}={}){
 if(!Number.isFinite(int)||int<0||
  !Number.isInteger(magicMastery)||magicMastery<0||
  !Number.isInteger(guildArouse)||guildArouse<0||guildArouse>3)return null;
 const step=magicSteps.find(([n])=>int>=n)?.[1]??0;
 const passive=magicLineage.has(jobKey)?10+Math.floor(magicMastery/10):0;
 // Remaked Legacy Cursed Rod / Iron Staff / Might Staff exceptions.
 // Current OS uses stable IDs; names are translated by the RU/EN selector.
 const staffId=Number(weapon?.id);
 const staff=weapon?.kind==='WAND'?10:weapon?.kind==='STAFF'?
  (staffId===2841?20:(staffId===2802||staffId===2812)?0:15):0;
 const guild=[0,2,4,6][guildArouse],exact=100+step+passive+staff+guild;
 return {known:exact>=100?Math.floor(exact*10)/10:exact,
  base:100,intelligence:step,passive,staff,guild,verified:false};
}
// Strictly opt-in skill effects. Gate every buff by current OS class and
// character level, not by the presence of an unchecked saved toggle.
function activeCombatSkills({selected={},jobKey=null,level=1,hasShield=false,
 weapon=null,skillCatalog=null,branchMasteries={}}={}){
 const permitted=(key,selectedKey,legacyClasses,minLevel)=>{
  if(selected?.[selectedKey]!==true)return false;
  if(skillCatalog){
   const source=combatSkillSource(skillCatalog,key);
   const record=source?.record;
   if(!source||!record?.classes?.[jobKey]||
    !Number.isInteger(record.charLevel)||level<record.charLevel)return false;
   // A branch-gated skill is not learned until the green Adeptness
   // requirement is met. Potential/blue points do not substitute for it.
   if(!Array.isArray(record.reqs)||!record.reqs.every(req=>
    typeof req.branch==='string'&&Number.isInteger(req.amount)&&req.amount>=0&&
    Number(branchMasteries?.[req.branch]??0)>=req.amount))return false;
   if(record.prereq!=null)return false; // unverified prerequisites fail closed
   // OS skill 100051001 (Lunge) explicitly lists compatible weapon kinds.
   // With no equipped weapon the source lists BARE_HAND as a valid kind.
   if(key==='lunge'&&Array.isArray(record.weaponUse)&&record.weaponUse.length&&
    !record.weaponUse.includes(weapon?.kind??'BARE_HAND'))return false;
   return true;
  }
  return legacyClasses.has(jobKey)&&level>=minLevel;
 };
 const warCry=permitted('warCry','combatWarCry',meleeLineage,28);
 const raging=permitted('raging','combatRage',meleeLineage,35);
 const defender=permitted('defender','combatDefender',knightLineage,35)&&hasShield&&!raging;
 const lunge=permitted('lunge','combatLunge',warriorBuffClasses,18);
 const concentration=permitted('concentration','combatConcentration',new Set(),0);
 return {warCry,raging,defender,lunge,concentration};
}
function combatPreview({stats={},level=null,bonuses={},honorTitle=0,racialPassiveId=null,
 weapon=null,weaponGrade=0,weaponPlus=null,records=[],itemForth=null,
 jobKey=null,meleeMastery=0,magicMastery=0,techniqueInnate=0,
 techniqueTrained=0,guildArouse=0,combatBuffs={},skillCatalog=null,
 branchMasteries={}}={}){
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
 if(![techniqueInnate,techniqueTrained,meleeMastery,magicMastery]
  .every(v=>Number.isInteger(v)&&v>=0))return null;
 // Executed Legacy ACC/Dodge: floor(innate + trained/10), not
 // floor((innate + trained)/10). Do not silently fix original precedence.
 const hunterEye=archerLineage.has(jobKey)?
  10+Math.floor(techniqueInnate+techniqueTrained/10):0;
 const quickStep=evasionLineage.has(jobKey)?
  10+Math.floor(techniqueInnate+techniqueTrained/10):0;
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
 const defense=defensePreview({records,honorTitle,itemForth});
 const equipped=equippedCombatModifiers(records,itemForth);
 const secondary=secondaryEffectsPreview({records,itemForth});
 if(!defense||!equipped||!secondary)return null;
 const actives=activeCombatSkills({selected:combatBuffs,jobKey,level,skillCatalog,weapon,branchMasteries,
  hasShield:records.some(([source,record])=>String(source).startsWith('item:')&&
   record?.slot==='shield')});
 const supportSkills=supportSkillAvailability({selected:combatBuffs,skillCatalog,jobKey,level,
  branchMasteries});
 const supportSkillValues=Object.fromEntries(Object.keys(supportSkillIds).map(kind=>
  [kind,supportSkillSource(skillCatalog,kind)?.values||{}]));
 const activeValues=Object.fromEntries(Object.keys(combatSkillIds).map(kind=>[
  kind,combatSkillSource(skillCatalog,kind)?.effects||{}]));
 const effect=(kind,ep)=>activeValues[kind][ep]??0;
 const baseAtk=attack?.raw??attack?.known??null;
 const guildRate=[0,.02,.04,.06][guildArouse];
 if(guildRate===undefined)return null;
 const guildAtk=baseAtk===null?null:Math.ceil(baseAtk*guildRate);
 const activeAtk=baseAtk===null?null:
  (actives.warCry?effect('warCry','EP_DAMAGERATE_CONST')+
   Math.ceil(baseAtk*effect('warCry','EP_DAMAGERATE_SCALE')/100):0)+
  (actives.raging?Math.ceil(baseAtk*effect('raging','EP_DAMAGERATE_SCALE')/100):0)+
  (actives.defender?Math.floor(baseAtk*effect('defender','EP_DAMAGERATE_SCALE')/100):0);
 const directDef=defense.armor+defense.refinement+defense.equipment;
 const activeDef=(actives.raging?Math.ceil(directDef*effect('raging','EP_ARMORCLASS_SCALE')/100):0)+
  (actives.defender?Math.floor(directDef*effect('defender','EP_ARMORCLASS_SCALE')/100):0);
 const effectiveDefense={...defense,activeBonus:activeDef,
  known:defense.known+activeDef};
 const atkPct=attack?equipped.attackPercent.map(e=>({
  ...e,bonus:Math.ceil((attack.raw??attack.known)*e.rate/100)})):[];
 const atkExtras=equipped.attackFlat+atkPct.reduce((sum,e)=>sum+e.bonus,0);
 const effectiveAttack=attack?{...attack,flatEquipment:equipped.attackFlat,
  percentEquipment:atkPct,activeBonus:activeAtk,guildBonus:guildAtk,
  known:Math.ceil((attack.raw??attack.known)+attack.honor+atkExtras+
   activeAtk+guildAtk)}:null;
 const accuracyPercent=equipped.accuracyPercent.map(e=>({
  ...e,bonus:Math.ceil(accuracyBase*e.rate/100)}));
 const accuracyBonus=accuracyPercent.reduce((sum,e)=>sum+e.bonus,0);
 // Legacy Calc('ATKSPD'): 100 + 2*floor(AGI/10) +
 // 3*floor(AGI/20) + floor(AGI/10); typed as a speed index, not hits/sec.
 const speedBase=100+3*Math.floor(stats.agi/10)+3*Math.floor(stats.agi/20);
 const attackSpeed={base:speedBase,equipment:equipped.attackSpeedFlat,
  lunge:actives.lunge?effect('lunge','EP_ATTACKINTERVAL_SCALE'):0,
  known:speedBase+equipped.attackSpeedFlat+
   (actives.lunge?effect('lunge','EP_ATTACKINTERVAL_SCALE'):0),verified:false};
 // Legacy Calc('CastSPD'): 100 + 5*floor(DEX/10), without temporary casts.
 const castingBase=100+5*Math.floor(stats.dex/10);
 const castingEquipment=secondary.castSpeedReduction+secondary.castSpeedFinal;
 const castingSpeed={base:castingBase,equipment:castingEquipment,
  known:castingBase+castingEquipment,
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
 const magicAttack=magicAttackPreview({int:stats.int,jobKey,magicMastery,
  weapon,guildArouse});
 // Current OS EP_ELEMENT_DAMAGE_SCALE often represents the same staff bonus
 // already counted as +10/+15 above. Expose it, never double-add it to MATK.
 const spellDamageEquipmentRate=equipped.elementDamageRate;
 const castInterruption=equipped.castInterruptResist+(title.castingResist||0);
 const windMove=supportSkills.windBlessing?
  supportSkillValues.windBlessing.EP_MOVESPEED_SCALE:0;
 const movementSpeed={base:100,equipment:equipped.movement,
  active:windMove,known:100+equipped.movement+windMove,
  townEquipment:secondary.townMovement,
  town:100+equipped.movement+windMove+secondary.townMovement,verified:false};
 const skillDelayEquipment=equipped.skillDelay;
 const skillDelayFinalEquipment=equipped.skillDelayFinal;
 const mpRecoveryEquipmentRate=equipped.mpRecoveryRate;
 const backAttackEquipmentRate=equipped.backAttackRate;
 const weaponPhysical=(meleeLineage.has(jobKey)?1+Math.floor(meleeMastery/10):0)
  +(title.weaponPhysical||0);
 const backAttack=15,frontAttack=title.frontAttack||0;
 const cooldown=Number.isFinite(stats.int)?100-2*Math.floor(stats.int/10)+secondary.cooldown:null;
 const criticalDamage=100,criticalIncoming=(title.incomingCriticalChance||0)-
  (Number(bonuses.incomingCriticalReduction)||0);
 const criticalIncomingDamage=100+(title.incomingCriticalDamage||0);
 return {attack:effectiveAttack,magicAttack,defense:effectiveDefense,activeSkills:actives,
  activeSkillValues:activeValues,secondary,supportSkills,supportSkillValues,
  guildArouse,guildAtk,attackSpeed,castingSpeed,manaCost,
  weaponPhysical,backAttack,frontAttack,cooldown,
  spellDamageEquipmentRate,castInterruption,movementSpeed,skillDelayEquipment,
  skillDelayFinalEquipment,mpRecoveryEquipmentRate,backAttackEquipmentRate,
  criticalDamage,criticalIncoming,criticalIncomingDamage,
  accuracy:{base:accuracyBase,equipment:accEquip,passive:hunterEye,
   percentage:accuracyPercent,honor:title.accuracy||0,
   activeBonus:actives.concentration?effect('concentration','EP_TOHIT_CONST'):0,
   known:accuracy+accuracyBonus+hunterEye+
    (actives.concentration?effect('concentration','EP_TOHIT_CONST'):0)},
  dodge:{base:dodgeBase,agilityStep:dodgeStep,equipment:evEquip,
   passive:quickStep,honor:title.dodge||0,
   windAssist:supportSkills.windAssist?Math.floor(
    supportSkillValues.windAssist.EP_AVOIDANCE_CONST+
    dodgeBase*supportSkillValues.windAssist.EP_AVOIDANCE_SCALE/100):0,
   known:dodge+quickStep+(supportSkills.windAssist?Math.floor(
    supportSkillValues.windAssist.EP_AVOIDANCE_CONST+
    dodgeBase*supportSkillValues.windAssist.EP_AVOIDANCE_SCALE/100):0)},
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



// Current OS Soul codes: source-backed creature-specific damage modifiers.
const osTargetFamilies=Object.freeze({
 502:{key:'animal',name:'животных'},504:{key:'devil',name:'демонов'},
 505:{key:'immortal',name:'нежити'},508:{key:'reptilian',name:'ящеров'},
 511:{key:'ghost',name:'призраков'},512:{key:'golem',name:'големов'}
});
function targetResistancePreview({records=[],itemForth=null}={}){
 if(!Array.isArray(records))return null;
 const entries=[];
 for(const [source,record,grade] of records){
  if(!record||!Number.isInteger(grade))continue;
  for(const effect of sourceEffects(source,record,grade,itemForth)){
   const race=osTargetFamilies[effect?.b];
   if(effect?.func!=='EP_ONDAMAGE_FDS_RACE'||!race||
    !Number.isFinite(effect.a)||!Number.isInteger(effect.b))continue;
   if((Number.isFinite(effect.min)&&grade<effect.min)||
      (Number.isFinite(effect.max)&&grade>effect.max))continue;
   entries.push({key:race.key,name:race.name,raceId:effect.b,
    change:effect.a,source:String(record.name||source)});
  }
 }
 // No aggregation: duplicate Soul stacking and OS damage packets are unverified.
 return {entries,verified:false,source:'Pandora Saga OS EP_ONDAMAGE_FDS_RACE'};
}

// Conditional skill procs: report actual OS triggers without assuming a successful hit.
const procTriggers=Object.freeze({
 EP_ONHIT_SKILL_EXEC:'При ударе',
 EP_ONHIT_STUN:'При физической атаке',
 EP_ONHIT_SKILL_EXEC_ATTACKER:'При ударе',
 EP_ONDAMAGE_SKILL_EXEC:'При получении урона',
 EP_ONDAMAGE_SKILL_EXEC_ATTACKER:'При получении урона',
 EP_ONDAMAGE_ELEM_SKILL_EXEC:'При получении стихийного урона'
});
function conditionalProcPreview({records=[],itemForth=null,skills=null}={}){
 if(!Array.isArray(records))return null;
 const entries=[];
 for(const [source,record,grade] of records){
  if(!record||!Number.isInteger(grade))continue;
  for(const effect of sourceEffects(source,record,grade,itemForth)){
   const trigger=procTriggers[effect?.func];
   if(!trigger||!Number.isInteger(effect.a)||!Number.isFinite(effect.b))continue;
   if((Number.isFinite(effect.min)&&grade<effect.min)||
      (Number.isFinite(effect.max)&&grade>effect.max))continue;
   const isStun=effect.func==='EP_ONHIT_STUN';
   const skill=isStun?null:skills?.[String(effect.a)];
   const recordDescription=String(record.desc||'');
   // If item text says 4% but source b says 5, do not present a fabricated certainty.
   const labelChance=recordDescription.match(/(\d+(?:[.,]\d+)?)\s*%\s*(?:шанс|вероятност)/i);
   const namedChance=labelChance?Number(labelChance[1].replace(',','.')):null;
   const sourceChance=effect.b>=0&&effect.b<=100?effect.b:null;
   const mismatch=namedChance!==null&&sourceChance!==null&&namedChance!==sourceChance;
   entries.push({trigger,skillId:isStun?null:effect.a,
    skillName:isStun?'Оглушение':String(skill?.name||'Особый эффект'),
    chance:mismatch?null:sourceChance,source:String(record.name||source),
    disputedChance:mismatch,code:effect.func});
  }
 }
 return {entries,verified:false};
}

// Current OS equipment-sourced earned-experience preview, not a combat stat.
function experienceBonusPreview({records=[],itemForth=null}={}){
 if(!Array.isArray(records))return null;
 const entries=[];
 for(const [source,record,grade] of records){
  if(!record||!Number.isInteger(grade))continue;
  for(const effect of sourceEffects(source,record,grade,itemForth)){
   if(effect?.func!=='EP_VOLUME_EXP'||!Number.isFinite(effect.a))continue;
   if((Number.isFinite(effect.min)&&grade<effect.min)||
      (Number.isFinite(effect.max)&&grade>effect.max))continue;
   entries.push({source:String(record.name||source),percent:effect.a});
  }
 }
 return {entries,verified:false};
}

// Classify item effects by what THIS calculator can genuinely support.
// A code being present in OS does not mean it has been included in a stat.
// Keep conditional procs and unmapped effects visible, not silently counted.
const calculatedCodes=new Set([
 ...Object.keys(keyByEffect),...Object.keys(percentByEffect),...Object.keys(bonusByEffect),
 'EP_MAXLIFE_CONST','EP_MAXMANA_CONST',
 'EP_ARMORCLASS_CONST','EP_ARMORCLASS_SCALE',
 ...Object.keys(secondaryEffectTargets),
 'EP_MASTERY_POTION','EP_CAST_HEAL_LIFE_SCALE',
 'EP_DAMAGERATE_CONST','EP_SKILL_EQUIP_DAMAGERATE','EP_DAMAGERATE_SCALE',
 'EP_TOHIT_SCALE','EP_ATTACKINTERVAL_SCALE','EP_RACE_MANA_COSTCUT'
]);
const previewCodes=new Set([
 'EP_MOVESPEED_SCALE','EP_SKILL_DELAY','EP_SKILL_DELAY_FIN',
 'EP_ATTACK_BACKATK_RATE','EP_ELEMENT_DAMAGE_SCALE','EP_ONDAMAGE_FDS_RACE','EP_VOLUME_EXP',
 'EP_CASTINGCANCEL_RESISTANCE_CONST','EP_HEAL_TIME_SCALE'
]);
function effectCoverage({records=[],itemForth=null}={}){
 const counts={calculated:0,preview:0,conditional:0,missing:0,inactive:0};
 const pending=[],sources=new Set();
 for(const [source,record,grade] of records){
  if(!record)continue;
  const label=String(record.name||source||'Предмет');
  for(const effect of sourceEffects(source,record,grade,itemForth)){
   if(!effect||typeof effect.func!=='string')continue;
   sources.add(String(source));
   if((Number.isFinite(effect.min)&&grade<effect.min)||
    (Number.isFinite(effect.max)&&grade>effect.max)){
    counts.inactive++;continue;
   }
   const ep=effect.func;
   let type=calculatedCodes.has(ep)?'calculated':
    previewCodes.has(ep)?'preview':
    /^EP_(ONHIT|ONDAMAGE|SKILL_EXEC|RANDOM_BOX|PLAYER_ATTACK|DESTINED|DESTINE)/.test(ep)?
    'conditional':'missing';
   if(!Number.isFinite(effect.a)&&type==='calculated')type='missing';
   counts[type]++;
   if(type==='conditional'||type==='missing'){
    const cause=type==='conditional'?'Условное боевое срабатывание':
     'Пока нет подтверждённой формулы';
    if(!pending.some(x=>x.item===label&&x.type===type))
     pending.push({item:label,type,reason:cause});
   }
  }
 }
 return {counts,total:counts.calculated+counts.preview+counts.conditional+
  counts.missing+counts.inactive,sources:sources.size,
  pending:pending.slice(0,25),additionalPending:Math.max(0,pending.length-25),
  verified:false,source:'Current Pandora Saga OS structured equipment/Soul/Forth effects'};
}
// Executed Remaked Legacy Calc('FirstAid'/'Heal'/'HealingAura'/
// 'Sanctuary'/'Restoration') from js/calc.js Flag[5].
// Spell unlocks are informative gates. Exact current OS server damage/heal
// packets remain unverified; show unavailable spells as theoretical previews.
const healingJobs=new Set(['ACOLYTE','PRIEST','CLERIC','ENCHANTER','ASCETIC','MONK','EXORCIST']);
function healingSpellsPreview({level,int,spi,benevolence=0,healingPercent=100,
 jobKey=null}={}){
 if(!Number.isInteger(level)||level<1||level>55||
  ![int,spi,benevolence,healingPercent].every(n=>Number.isFinite(n)&&n>=0))
  return null;
 const cleric=jobKey==='CLERIC'&&level>=50;
 const calc=(raw)=>Math.floor(raw*healingPercent/100);
 const firstAid=cleric?25+level*2.5+benevolence*2.8+int*3:
  25+level*2.5+benevolence*1.4+int;
 const heal=cleric?105+level*2+benevolence*5+int*10:
  50+level*2+benevolence*3+int*6;
 const aura=cleric?150+level*2+benevolence*4+int*8.5:
  150+level*2+benevolence*3+int*6;
 const sanctuary=100+level*2+benevolence*2+int*2;
 const restore=7+Math.floor(benevolence/10)+Math.floor(spi/5);
 return {
  formulaSource:'Remaked Legacy js/calc.js, Flag[5], Status.LSk',
  clericLevel50:cleric,verified:false,rows:[
   {id:'firstAid',name:'Первая помощь',amount:calc(firstAid),available:benevolence>=8,
    requires:'Мастерство исцеления 8',scaledBySkill:true},
   {id:'heal',name:'Лечение',amount:calc(heal),
    available:healingJobs.has(jobKey)&&level>=18,
    requires:'Ветвь аколита, уровень 18',scaledBySkill:true},
   {id:'healingAura',name:'Массовое исцеление',amount:calc(aura),
    available:benevolence>=54,requires:'Мастерство исцеления 54',
    scaledBySkill:true},
   {id:'sanctuary',name:'Храм',amount:calc(sanctuary),
    available:jobKey==='CLERIC'&&level>=45,
    requires:'Клирик, уровень 45',scaledBySkill:true},
   {id:'restoration',name:'Восстановление',amount:restore,
    available:benevolence>=41,requires:'Мастерство исцеления 41',
    scaledBySkill:false}
  ],notes:'Восстановление — периодическая величина; множитель лечения навыками не применяется.'};
}
// Two-second healing spell previews from Remaked Legacy LPsec/MPsec.
// The source values are never added to natural regeneration or current HP/MP.
// Availability is gated by current OS skill IDs and actual trained mastery.


// Explicit current OS item EP_HEAL_MANA(_RATE) and EP_HEAL_LIFE(_RATE).
// These are used-on-demand values, never a bonus to maximum HP/MP or passive regen.
// Remaked POT scaling is established for HP; mana POT scaling remains unverified.
const displayedRecoveryIds=Object.freeze([50006,50007,50008,50009,50061,50063,50025,70027]);
function consumableRecoveryPreview({items=null,maxHp=null,maxMp=null,potionRate=null,
 applyHpPotionBonus=false}={}){
 if(!items||typeof items!=='object'||!Number.isFinite(maxHp)||maxHp<0||
  !Number.isFinite(maxMp)||maxMp<0||
  (applyHpPotionBonus&&(!Number.isFinite(potionRate)||potionRate<0)))return null;
 const rows=[];
 for(const id of displayedRecoveryIds){
  const item=items[String(id)];
  if(!item||!Array.isArray(item.effects))continue;
  const effects=[];
  let hp=0,mp=0;
  for(const effect of item.effects){
   const {func,a}=effect;
   if(!['EP_HEAL_LIFE','EP_HEAL_LIFE_RATE',
     'EP_HEAL_MANA','EP_HEAL_MANA_RATE'].includes(func)||
     !Number.isFinite(a)||a<0)continue;
   const isHp=func.startsWith('EP_HEAL_LIFE'),rate=func.endsWith('_RATE');
   const maximum=isHp?maxHp:maxMp;
   // Percent sources use the current maximum mana / health, not current mana.
   const basic=rate?Math.floor(maximum*a/100):a;
   const hpBoost=isHp&&applyHpPotionBonus;
   const adjusted=hpBoost?(rate?
    Math.floor(maximum*Math.ceil(a*potionRate)/10000):
    Math.floor(a*potionRate/100)):basic;
   effects.push({func,amount:a,rate,basic,adjusted,kind:isHp?'hp':'mp'});
   if(isHp)hp+=adjusted;
   else mp+=adjusted;
  }
  if(effects.some(x=>x.kind==='mp'))
   rows.push({id,name:item.name||'Предмет',hp,mp,
    effects,source:'Pandora Saga OS item effects',verified:false});
 }
 return {rows,verified:false};
}

function periodicRecoveryPreview({level,benevolence=0,jobKey=null,skillCatalog=null}={}){
 if(!Number.isInteger(level)||level<1||level>55||
  !Number.isInteger(benevolence)||benevolence<0||typeof jobKey!=='string')
  return null;
 const candidates=[
  {id:310002001,key:'regenerate',amount:15+Math.floor(level/10)+Math.floor(benevolence/10),
   kind:'hp',name:'Регенерация'},
  {id:310022001,key:'restoration',amount:7+Math.floor(level/5)+Math.floor(benevolence/10),
   kind:'hp',name:'Восстановление'},
  {id:330005001,key:'natural',amount:5,kind:'mp',name:'Природное восстановление'}
 ];
 const rows=[];
 for(const candidate of candidates){
  const skill=skillCatalog?.[String(candidate.id)];
  if(!skill?.classes?.[jobKey]||!Array.isArray(skill.reqs))continue;
  const requirementsValid=skill.reqs.every(req=>
   req?.branch==='benevolence'&&Number.isInteger(req.amount)&&req.amount>=0);
  const eligible=requirementsValid&&Number.isInteger(skill.charLevel)&&
   level>=skill.charLevel&&skill.prereq==null&&skill.learnable!==false;
  const required=skill.reqs.reduce((max,req)=>
   req?.branch==='benevolence'&&Number.isInteger(req.amount)?
    Math.max(max,req.amount):max,0);
  rows.push({...candidate,available:eligible&&benevolence>=required,
   required,skillLevel:skill.charLevel,verified:false});
 }
 return {rows,verified:false,source:'Remaked Legacy js/calc.js:1009-1026'};
}

// Historical Remaked Legacy js/equip.js weapon-gem switch for enhancement +1..+10.
// Some values were marked provisional (未) in the archival source; expose them as
// *historical previews*, never silently merge into current OS server ATK/MATK.
const legacyPhysicalAuras=Object.freeze([
 null,
 [3,1,5,1,4,4],[4,2,6,2,5,5],[5,3,8,3,7,7],
 [7,5,11,5,9,9],[9,6,14,6,12,12],[9,6,14,6,12,12],
 [9,11,23,6,20,20],[9,6,14,7,20,20],
 [9,6,14,7,20,20],[9,6,14,7,20,20]
]);
const legacyMagicAuras=Object.freeze([0,1,2,4,7,10,14,19,25,32,40]);
const legacyGemElements=Object.freeze(['fire','ice','lightning','poison','light','dark','rainbow']);

// Preserved Remaked Legacy Calc('Velox'...'ToxicAura') branch previews.
// These are read-only magnitudes: never apply to combat stats merely because
// the hero's level/mastery is high. The corresponding spell must be selected
// and its current OS identity verified before it becomes an active buff.
function legacyBuffPreview({spi,blessing=0,hymn=0,alchemy=0}={}){
 if(![spi,blessing,hymn,alchemy].every(n=>Number.isInteger(n)&&n>=0))return null;
 const quotient=(value,parts)=>Math.floor(value/(100/parts));
 const next=(step,parts)=>Math.ceil((step+1)*(100/parts));
 const gratiaStep=quotient(spi,6),lapisSpirit=quotient(spi,3),
  lapisBlessing=quotient(blessing,4),
  holyStep=quotient(spi,6),gloomStep=quotient(spi,8),
  enchantSpirit4=spi>=101?4:quotient(spi,4),
  enchantSpirit5=quotient(spi,5),
  minstrelSpirit=quotient(spi,13),minstrelHymn=quotient(hymn,13),
  sageSpirit=quotient(spi,8),sageHymn=quotient(hymn,8);
 return {
  gratia:{value:5+Math.floor(gratiaStep*1.9),nextSpi:next(gratiaStep,6)},
  lapisMedio:{value:5+lapisSpirit+lapisBlessing,nextSpi:next(lapisSpirit,3)},
  groupBarrier:{value:-(10+Math.floor(blessing/5))},
  holyWeapon:{value:holyStep,nextSpi:next(holyStep,6)},
  gloomyEffect:{value:gloomStep,nextSpi:next(gloomStep,8)},
  enchantEnhance:{value:10+Math.floor(blessing/5)},
  enchantMagic:{value:enchantSpirit4+enchantSpirit5,
   nextSpi:Math.min(next(enchantSpirit4,4),next(enchantSpirit5,5))},
  minstrelSong:{value:5+minstrelSpirit+minstrelHymn,
   nextSpi:next(minstrelSpirit,13)},
  sageSong:{value:sageSpirit+sageHymn,nextSpi:next(sageSpirit,8)},
  toxify:{value:quotient(alchemy,5)},
  toxicAura:{value:quotient(alchemy,15)}
 };
}
function gemstonePreview(loadouts=[]){
 if(!Array.isArray(loadouts))return null;
 const results=[],uncertain=[];
 const physicalSlots=new Set(['weapon','shield','head','body','gloves','legs','feet']);
 const names={fire:'Огонь',ice:'Лёд',lightning:'Молния',poison:'Яд',
  light:'Свет',dark:'Тьма',rainbow:'Радуга'};
 for(const entry of loadouts){
  if(!entry||!physicalSlots.has(entry.slot)||!entry.gem)continue;
  const {slot,grade,gem}=entry;
  if(!Number.isInteger(grade)||grade<0||grade>10||
   !['physical','magical'].includes(gem.type)||
   !legacyGemElements.includes(gem.element))continue;
  if(!grade)continue;
  const item={slot,grade,itemId:entry.itemId,type:gem.type,element:gem.element,
   name:names[gem.element],aura:0,magic:0,resistance:{},statusChance:0};
  if(gem.element==='rainbow'){
   uncertain.push({itemId:entry.itemId,slot,reason:'Особый радужный самоцвет зависит от списка уникального оружия'});
   continue;
  }
  if(slot==='weapon'){
   const index=legacyGemElements.indexOf(gem.element);
   if(gem.type==='physical'){
    item.aura=legacyPhysicalAuras[grade][index]||0;
    // Legacy equip.js: status infliction grade on physical fire / ice / poison.
    if(['fire','ice','poison'].includes(gem.element))item.statusChance=grade;
   }else item.magic=legacyMagicAuras[grade];
  }else if(gem.element==='light'){
   const amount=Math.floor(grade/2);
   item.resistance={fire:amount,ice:amount,lightning:amount};
  }else if(gem.element==='dark')item.resistance={charm:grade};
  else item.resistance={[gem.element]:grade};
  results.push(item);
 }
 const resistance={},auras={},magic={},status={};
 for(const row of results){
  for(const [key,value] of Object.entries(row.resistance))
   resistance[key]=(resistance[key]||0)+value;
  if(row.aura)auras[row.element]=(auras[row.element]||0)+row.aura;
  if(row.magic)magic[row.element]=(magic[row.element]||0)+row.magic;
  if(row.statusChance)status[row.element]=(status[row.element]||0)+row.statusChance;
 }
 return {items:results,uncertain,auras,magic,resistance,status,verified:false,
  source:'Pandora-Saga-Simulator-remaked/js/equip.js, legacy weapon/armor gem switches',
  excluded:['current OS server gem rules','special rainbow weapon exceptions',
   'gem-dependent Soul passives','conditional procs and damage conversion']};
}

// Remaked Calc('MATKFire'...'MATKDark'): element-specific bonuses are
// independent of the global elemental weapon/staff rate. Honor titles are
// exclusive, so exactly one source-specific +5 can be in this preview.
function elementalMagicPreview({honorTitle=0}={}){
 const title=honorTitles[honorTitle]?.effects;
 if(!title)return null;
 return {fire:title.fireMagic||0,ice:title.iceMagic||0,
  lightning:title.lightningMagic||0,poison:0,light:0,dark:0};
}
// The executed Remaked Legacy Calc('DAMAura' through 'DAMDark') combines
// elemental weapon aura, shared flat aura and percent enhancement separately.
// It only adds shared flat aura when that element already has a base aura.
// Do not convert this to direct attack or a simulated OS damage packet.
function auraDamagePreview({gemstones=null,records=[],itemForth=null}={}){
 const extras=secondaryEffectsPreview({records,itemForth});
 if(!extras||!gemstones||typeof gemstones.auras!=='object')return null;
 const names=['fire','ice','lightning','poison','light','dark'],elements={};
 for(const element of names){
  const base=Number(gemstones.auras[element]||0);
  if(!Number.isFinite(base)||base===0)continue;
  const flat=extras.auraFlat;
  const percent=Math.ceil(base*extras.auraPercent/100);
  elements[element]={base,flat,percent,known:base+flat+percent};
 }
 return {elements,sharedFlat:extras.auraFlat,rate:extras.auraPercent,
  source:'Remaked Legacy: Calc(DAMAura,DAMFire,DAMIce,DAMLightning,DAMPoison,DAMLight,DAMDark)',
  verified:false};
}
function mountedReleasePreview({jobKey,ridingMastery=0,honorTitle=0}={}){
 // Remaked js/calc.js:555–566, Calc('RelHorse').
 if(typeof jobKey!=='string'||!Number.isInteger(ridingMastery)||ridingMastery<0||
  !Number.isInteger(honorTitle)||honorTitle<0||honorTitle>=honorTitles.length)return null;
 const jobBase=jobKey==='DRAGOON'||jobKey==='PALADIN'?50:
  jobKey==='PREDATOR'?30:jobKey==='CALAMITY'?40:10;
 const honor=honorTitle===7?10:0;
 return {known:jobBase+ridingMastery+honor,jobBase,mastery:ridingMastery,honor,
  verified:false,source:"Remaked js/calc.js:555–566"};
}
function base({classData,raceData,jobData,allocation,level,records=[],itemForth=null,
 consumableItems=null,
 unisonCatalog=null,supplementalFlat={},supplementalSource=null,
 enhancements={},attributeBuffs={},potionContext={},combatContext={},gemSelections=[]}={}){
 if(!classData||!raceData||!jobData||!Number.isInteger(level)||level<1)return null;
 const unison=unisonPreview({records,catalog:unisonCatalog});
 const combinedRecords=[...records,...unison.supplemental];
 const effects=gatherEffects(combinedRecords,itemForth),basic={},stats={},extra=attributeBuffBonus(attributeBuffs);
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
 const potion=potionRecovery({vit:stats.vit,records:combinedRecords,honorTitle:extra.honor.id,
  level,itemForth,...potionContext,runeJoEun:false});
 const resistances=resistancePreview({stats,bonuses:effects.bonuses,
  honorTitle:extra.honor.id,racialPassiveId:potionContext?.racialPassiveId,
  jobKey:combatContext.jobKey,wardingMastery:combatContext.wardingMastery,
  wardingCap:classData.branchCaps?.warding,skillCatalog:combatContext.skillCatalog});
 const regeneration=regenerationPreview({stats,guild:attributeBuffs});
 const gemstones=gemstonePreview(gemSelections);
 const otherEquipment=secondaryEffectsPreview({records:combinedRecords,itemForth});
 const targetResistance=targetResistancePreview({records:combinedRecords,itemForth});
 const procPreview=conditionalProcPreview({records:combinedRecords,itemForth,skills:combatContext.skillCatalog});
 const experienceBonus=experienceBonusPreview({records:combinedRecords,itemForth});
 if(otherEquipment&&resistances){
  resistances.mitigation.physical+=otherEquipment.incomingPhysicalPercent;
  resistances.mitigation.magic+=otherEquipment.incomingMagicPercent;
  resistances.mitigation.physicalFlat=otherEquipment.incomingPhysicalFlat;
  resistances.incomingDebuffDurationReduction=
   otherEquipment.incomingDebuffDurationReduction;
  resistances.physicalReflection=otherEquipment.physicalReflection;
  resistances.damageNegation=otherEquipment.damageNegation;
 }
 if(otherEquipment&&regeneration){
  regeneration.mp.equipment=otherEquipment.manaRecoverySpeed;
  regeneration.mp.total+=otherEquipment.manaRecoverySpeed;
 }
 // Armor gemstone resistances have an exact Remaked rule. Apply these to the
 // displayed elemental defense totals once; aura and spell damage stay
 // independent from physical attack and require no invented damage formula.
 if(resistances&&gemstones){
  for(const [key,amount] of Object.entries(gemstones.resistance))
   resistances.elements[key]=(resistances.elements[key]||0)+amount;
  resistances.gemstones={...gemstones.resistance};
 }
 const auraDamage=auraDamagePreview({gemstones,records:combinedRecords,itemForth});
 const elementalMagic=elementalMagicPreview({honorTitle:extra.honor.id});
 const mountedRelease=mountedReleasePreview({jobKey:combatContext.jobKey,
  ridingMastery:combatContext.ridingMastery??0,honorTitle:extra.honor.id});
 const legacyBuffs=legacyBuffPreview({spi:stats.spi,
  blessing:combatContext.legacyBuffMasteries?.blessing??0,
  hymn:combatContext.legacyBuffMasteries?.hymn??0,
  alchemy:combatContext.legacyBuffMasteries?.alchemy??0});
 const coverage=effectCoverage({records:combinedRecords,itemForth});
 const recoveryAmount=recoveryAmountPreview({maxHp:hpBase+hpBonus.total,
  maxMp:mpBase+mpBonus.total,stats});
 const healingSkill=healingSkillPreview({honorTitle:extra.honor.id,records:combinedRecords,itemForth});
 const healingSpells=healingSkill?healingSpellsPreview({
  level,int:stats.int,spi:stats.spi,
  benevolence:combatContext.benevolenceMastery??0,
  jobKey:combatContext.jobKey,healingPercent:healingSkill.percent
 }):null;
 const consumableRecovery=consumableRecoveryPreview({
  items:consumableItems,maxHp:hpBase+hpBonus.total,
  maxMp:mpBase+mpBonus.total,potionRate:potion?.percent??null,
  applyHpPotionBonus:attributeBuffs?.potionEffectsEnabled===true
 });
 const periodicRecovery=periodicRecoveryPreview({
  level,benevolence:combatContext.benevolenceMastery??0,
  jobKey:combatContext.jobKey,skillCatalog:combatContext.skillCatalog
 });
 const combat=combatPreview({stats,level,bonuses:effects.bonuses,records:combinedRecords,itemForth,
  guildArouse:attributeBuffs?.guildArouse??0,
  combatBuffs:attributeBuffs,
  honorTitle:extra.honor.id,racialPassiveId:potionContext?.racialPassiveId,...combatContext});
 // An unavailable weapon/armor preview must NEVER erase otherwise valid HP/MP.
 if(!resistances||!regeneration)return null;
 return {hp:hpBase+hpBonus.total,mp:mpBase+mpBonus.total,
  hpBase,mpBase,vitalsBonus:{hp:hpBonus,mp:mpBonus},
  hpRaw:rawHp.base+level*rawHp.lv+stats.vit*rawHp.vit,
  mpRaw:rawMp.base+level*rawMp.lv+stats.spi*rawMp.spi,
  stats,basic,effects,honor:extra.honor,potion,resistances,targetResistance,procPreview,experienceBonus,regeneration,legacyBuffs,otherEquipment,
  recoveryAmount,healingSkill,healingSpells,periodicRecovery,consumableRecovery,combat,gemstones,auraDamage,elementalMagic,mountedRelease,unison,coverage,
  attributeBuffs:{flat:extra.flat,trace:extra.trace},supplementalFlat,supplementalSource,
  rounding:'floor-class-cents',source:'Pandora Saga OS / Modern current-vitals class formula',
  verified:false,excluded:['unstructured refinement bonuses','unpublished set effects',
    'unverified passive and conditional skills','other group/temporary buffs']};
}
root.PandoraOSCalculator=Object.freeze({
 base,classBase,bonusFor,halfToEven,effectiveAbility,gatherEffects,refinementEffects,attributeBuffBonus,guildRates,honorTitles,selectedHonor,potionRecovery,potionPreview,resistancePreview,regenerationPreview,combatPreview,weaponAttackPreview,defensePreview,equippedCombatModifiers,magicAttackPreview,sourceEffects,activeCombatSkills,combatSkillIds,combatSkillSource,supportSkillIds,supportSkillSource,supportSkillAvailability,
 recoveryAmountPreview,healingSkillPreview,healingSpellsPreview,periodicRecoveryPreview,consumableRecoveryPreview,gemstonePreview,legacyBuffPreview,secondaryEffectsPreview,auraDamagePreview,elementalMagicPreview,mountedReleasePreview,unisonPreview,effectCoverage,targetResistancePreview,conditionalProcPreview,experienceBonusPreview,wardingStatusPassive
});
})(typeof window==='undefined'?globalThis:window);

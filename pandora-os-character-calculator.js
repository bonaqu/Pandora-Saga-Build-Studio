(function(root){
'use strict';
// Formula source: current game server class coefficients, cross-checked with
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
function classBaseComponents(classPart,level,attribute,key){
 if(!classPart||!Number.isInteger(level)||level<1||
   !Number.isFinite(attribute)||attribute<0)return null;
 const parts=[classPart.base,classPart.lv,classPart[key]];
 if(!parts.every(n=>Number.isFinite(n)&&Math.abs(n*100-Math.round(n*100))<1e-6))
  return null;
 const cents=Math.round(classPart.base*100)+level*Math.round(classPart.lv*100)+
  attribute*Math.round(classPart[key]*100);
 return {constant:classPart.base,levelRate:classPart.lv,attributeRate:classPart[key],
  level,attribute,rawCents:cents,base:Math.floor(cents/100)};
}
function classBase(classPart,level,attribute,key){
 return classBaseComponents(classPart,level,attribute,key)?.base??null;
}
// Parse only the explicit improvement clauses in the preserved OS item text.
// These bonuses are absent from the base effects array; unknown prose is ignored.
function refinementEffects(record,grade){
 // Keep numeric fallback stable when a localized item description replaces RU text.
 const description=record?.sourceDesc??record?.desc;
 if(!record||!Number.isInteger(grade)||grade<1||typeof description!=='string')return [];
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
  {match:description.match(/За каждые\s+(\d+)\s+единиц[ыу]\s+улучшения\s*:\s*([\s\S]*?)(?=При улучшении на|За каждые|$)/i),
   count:g=>Math.floor(g/Number(description.match(/За каждые\s+(\d+)/i)?.[1]||Infinity)),index:2},
  {match:description.match(/При улучшении на\s*\+(\d+)\s+и выше\s*:\s*([\s\S]*)/i),
   count:g=>g>=Number(description.match(/При улучшении на\s*\+(\d+)/i)?.[1])?1:0,index:2}
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
// Official OS itemForth rows are cumulative breakpoint snapshots: a +3
// bonus remains at +4 and +5, until a new breakpoint appears. The checked-in
// 162 items never remove a previous effect channel at a higher breakpoint.
// [] is authoritative zero below the first step; null means no OS Forth row.
function forthSnapshotAtGrade(itemForth,id,grade){
 const byGrade=itemForth?.[String(id)];
 if(!byGrade||typeof byGrade!=='object'||Array.isArray(byGrade))return null;
 let nearest=-1;
 for(const [key,rows] of Object.entries(byGrade)){
  const level=Number(key);
  if(!Number.isSafeInteger(level)||level<1||level>grade||
   !Array.isArray(rows)||level<=nearest)continue;
  nearest=level;
 }
 return nearest<0?[]:byGrade[String(nearest)];
}
function sourceEffects(source,record,grade,itemForth=null){
 if(!record||typeof record!=='object'||
  !Number.isInteger(grade)||grade<0||grade>10)return [];
 const key=String(source);
 // A stored/imported record may contain a stale ID after a catalog update.
 // The source and the canonical item/Soul record must agree before any
 // effects (including HP and MP) are used in character calculations.
 const exact=key.match(/^(item|soul):(\d+)$/);
 if(exact&&Number.isSafeInteger(record.id)&&
  String(record.id)!==exact[2])return [];
 // Imported or owner-edited structured data can be incomplete. A null
 // row must never crash the stat rebuild or be interpreted as an effect.
 const safeRows=rows=>Array.isArray(rows)?rows.filter(row=>
  row&&typeof row==='object'&&typeof row.func==='string'):[];
 const primary=safeRows(record.effects);
 if(!key.startsWith('item:'))return primary;
 // A Forth snapshot is tied to the official ID, not to a synthetic record
 // label; otherwise arbitrary imported records could inherit the grade
 // bonuses of an unrelated equipment entry.
 const canonical=Number.isSafeInteger(record.id)&&
  key==='item:'+record.id;
 const snapshot=canonical?forthSnapshotAtGrade(itemForth,record.id,grade):null;
 if(Array.isArray(snapshot))return [...primary,...safeRows(snapshot)];
 // Only an item without a structured Forth record uses narrative fallback;
 // never double count it alongside the official cumulative grade snapshots.
 return [...primary,...refinementEffects(record,grade)];
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
  // Invalid or mismatched imported records must never count as set pieces.
  // Equipment eligibility (slot, class, race, level) is checked upstream.
  if(!item||!Number.isInteger(item.id)||item.id<0||
   String(source)!=='item:'+item.id||
   !Number.isInteger(grade)||grade<0||grade>10)continue;
  equipped.set(String(item.id),{item,grade});
 }
 for(const [id,set] of Object.entries(catalog)){
  if(!Array.isArray(set?.members)||!Array.isArray(set?.rows))continue;
  const root=equipped.get(id);
  if(!root)continue;
  // The item itself cannot also count as one of its set companions.
  const companionIds=[...new Set(set.members.map(String).filter(key=>key!==id))];
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
   // Explicit OS effect numeric fields are numbers. Coercing null, "" or
   // true to 0/1 silently disagreed with effectCoverage's own source audit.
   const value=eff?.a,key=Object.hasOwn(keyByEffect,eff?.func)?
    keyByEffect[eff.func]:null;
   if(!Number.isFinite(value)){ignored.add(eff?.func);continue}
   if(key)flat[key]+=value;
   else if(eff.func==='EP_MAXLIFE_CONST')health.hp+=value;
   else if(eff.func==='EP_MAXMANA_CONST')health.mp+=value;
   else if(Object.hasOwn(percentByEffect,eff.func))
    percent[percentByEffect[eff.func]].push({source,value});
   else if(Object.hasOwn(bonusByEffect,eff.func)){
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
 if(!Number.isSafeInteger(wardingMastery)||wardingMastery<26||
  !Number.isSafeInteger(wardingCap)||wardingCap<26||
  wardingMastery>wardingCap||!jobKey||!skillCatalog)return null;
 const skill=skillCatalog['260007001'];
 if(skill?.id!==260007001||skill.learnable!==true||
  skill.skillType!=='PASSIVE'||skill.branch!=='warding'||
  skill.charLevel!==0||skill.prereq!==null||!skill.classes?.[jobKey]||
  !Array.isArray(skill.reqs)||skill.reqs.length!==1||
  skill.reqs[0]?.branch!=='warding'||skill.reqs[0]?.amount!==26||
  !Array.isArray(skill.funcs))return null;
 const keys={EP_IMMUNE_STUN:'stun',EP_IMMUNE_NUMB:'numb',EP_IMMUNE_TUMBLE:'tumble'};
 const values={};
 for(const [ep,key] of Object.entries(keys)){
  // CASTER Numb is not another TARGET effect.
  const rows=skill.funcs.filter(x=>x.ep===ep&&x.dir==='TARGET');
  if(rows.length!==1||!Array.isArray(rows[0].fv1)||
   !Array.isArray(rows[0].fv2)||rows[0].fv1.length!==4||
   rows[0].fv2.length!==4||
   rows[0].fv1.some((v,i)=>v!==(i===3?15:0))||
   rows[0].fv2.some(v=>v!==0))return null;
  values[key]=15;
 }
 return values;
}
// Remaked Legacy js/calc.js RES* formulas: only confirmed base terms,
// chosen Honor, selected racial passive and structured OS equipment effects.
// Active casts, guild resistances, gem conditions and other buffs are excluded.
// Only explicitly enabled, source-backed TARGET elemental resistance spells.
// Learnability applies to the caster, not necessarily this character: ENEMY
// skills model an incoming status, never a permanent self passive.
const skillResistanceKeys=Object.freeze({
 EP_FIRE_RESISTANCE_CONST:'fire',EP_COLD_RESISTANCE_CONST:'ice',
 EP_LIGHTNING_RESISTANCE_CONST:'lightning',EP_POISON_RESISTANCE_CONST:'poison',
 EP_CHARM_RESISTANCE_CONST:'charm',EP_HOLY_RESISTANCE_CONST:'light',
 EP_DARK_RESISTANCE_CONST:'dark',EP_MAGIC_RESISTANCE_CONST:'magic'
});
function resistanceSkillChoices(catalog=null){
 if(!catalog||typeof catalog!=='object')return [];
 const choices=[];
 for(const [key,skill] of Object.entries(catalog)){
  if(!Number.isSafeInteger(skill?.id)||String(skill.id)!==key||
   skill.learnable!==true||
   !['ALLY','PARTY_ALL','ENEMY'].includes(skill.skillType)||
   typeof skill.name!=='string'||!Array.isArray(skill.funcs))continue;
  const effects={};
  let incompatible=false;
  for(const effect of skill.funcs){
   const stat=skillResistanceKeys[effect?.ep];
   if(!stat)continue;
   // Current OS resistance spells expose absolute TARGET FV1[3] only.
   // A changed FV2, direction or duplicate row invalidates the ENTIRE
   // signed +/- spell; partial effects would mislead character builds.
   if(effect.dir!=='TARGET'||!Array.isArray(effect.fv1)||
    effect.fv1.length!==4||!effect.fv1.every(Number.isSafeInteger)||
    effect.fv1.slice(0,3).some(n=>n!==0)||
    !Array.isArray(effect.fv2)||effect.fv2.length!==4||
    effect.fv2.some(n=>n!==0)||Object.hasOwn(effects,stat)){
    incompatible=true;
    break;
   }
   effects[stat]=effect.fv1[3];
  }
  if(incompatible||!Object.keys(effects).length)continue;
  choices.push({id:skill.id,name:skill.name,skillType:skill.skillType,
   incoming:skill.skillType==='ENEMY',effects});
 }
 return choices.sort((a,b)=>a.id-b.id);
}
function resistanceSkillPreview({skillCatalog=null,selected=[]}={}){
 const all=resistanceSkillChoices(skillCatalog),chosen=new Set(
  Array.isArray(selected)?selected.filter(Number.isSafeInteger):[]);
 const bonuses={},rows=[];
 // Divine Blessing is a separate buff and a historical alias in older
 // saves; the five elemental resistance spells are mutually exclusive.
 const divine=all.find(s=>s.id===330004001&&chosen.has(s.id));
 const elemental=all.find(s=>s.id!==330004001&&chosen.has(s.id));
 for(const choice of [divine,elemental].filter(Boolean)){
  rows.push(choice);
  for(const [key,value] of Object.entries(choice.effects))
   bonuses[key]=(bonuses[key]||0)+value;
 }
 return {bonuses,rows,verified:false};
}
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
 // OS skill 900030001 (Stronghearted): Stun, Numb/Frozen and Tumble each +10.
 const dwarfStatus=racialPassiveId===900030001?{stun:10,numb:10,tumble:10}:{};
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
// OS game-client parity: apply STR% to unrefined weapon W before adding OS
// physical refinement. Legacy included refinement in the STR multiplier,
// overestimating ATK. Unsupported secondary effects remain unverified.
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
 // Current OS BuildCalculator uses floor(floor(STR/10)^2/2)% (not a capped table).
 const decade=Math.floor(str/10),strengthPercent=Math.floor(decade*decade/2);
 const strengthRate=strengthPercent/100;
 const scaledWeapon=Math.floor(damage*(100+strengthPercent)/100);
 const raw=physical+scaledWeapon+refinement;
 const honor=honorTitle===3?Math.floor(raw*.02):0;
 return {known:raw+honor,raw,unarmed:false,physical,
  weaponDamage:damage,scaledWeapon,refinement,strengthRate,honor,verified:false};
}
// Current game's news #4: all forgeable armor and shields now gain +1.2
// DEF per enhancement level, replacing the archival +1.5. Keep tenths as
// integers until the equipped total is known; separately flooring each
// piece would discard fractional contributions accumulated across items.
const ARMOR_REFINEMENT_TENTHS_PER_LEVEL=12;
function defensePreview({records=[],honorTitle=0,itemForth=null}={}){
 if(!Array.isArray(records)||!Number.isInteger(honorTitle)||
  honorTitle<0||honorTitle>=honorTitles.length)return null;
 let armor=0,equipment=0,refinementTenths=0,armorPieces=0;
 const percentage=[];
 const enhanceable=new Set(['shield','head','body','gloves','legs','feet']);
 for(const [source,record,grade] of records){
  if(!record||typeof record!=='object')continue;
  // Only equipped items carry the armor-class field. Souls provide effects
  // but their own item metadata must never inflate physical armor totals.
  if(String(source).startsWith('item:')&&record.AC!=null){
   if(!Number.isFinite(record.AC))return null;
   armor+=record.AC;
   // The six OS forgeable armor slots: shield, helmet, body, gloves,
   // leggings, boots. Localized names must never influence numbers.
   // Legacy '-' is an absent-piece sentinel, not equipped armor.
   if(enhanceable.has(record.slot)&&record.name!=='-'){
    if(!Number.isInteger(grade)||grade<0||grade>10)return null;
    refinementTenths+=grade*ARMOR_REFINEMENT_TENTHS_PER_LEVEL;armorPieces++;
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
 const refinementRaw=refinementTenths/10;
 const refinement=Math.floor(refinementTenths/10);
 const directRaw=armor+equipment+refinementRaw;
 // Keep fractional defense through the full assembly, then truncate.
 const percentParts=percentage.map(e=>({...e,bonus:Math.ceil(directRaw*e.rate/100)}));
 const percentBonus=percentParts.reduce((sum,x)=>sum+x.bonus,0);
 const honor=honorTitle===11?5:0;
 const raw=directRaw+percentBonus+honor;
 return {armor,equipment,refinement,refinementRaw,refinementTenths,
  directRaw,raw,armorPieces,honor,percentParts,
  percentBonus,known:Math.floor(raw),
  verified:false,excluded:['other armor conditional multipliers',
   'Defender and Raging Soul active skills','OS server damage mitigation']};
}
// Character-sheet minimum ATK is now reproduced by 41 independently observed
// client ranges across a spear, pike, two crossbows, and a sword.
// Unlike the published OS web combat preview, the character sheet floors
// the PEN/green-mastered percentage before flooring the loss from maximum.
// These live vectors support the model but do not prove all possible skills
// and PEN-altering effects; unknown source inputs fail closed.
// Empirical game-client character-sheet MIN ATK (2026-11-10):
// Two floors are required. The published web combat preview instead rounds
// the intermediate percent to nearest-even, which fails observed client ATK.
// This uses the weapon's own PEN, not a constant or an item-specific lookup.
// Active trained green mastery comes from branchMasteries, already capped by
// PandoraSkillProgression.branchMastery; learned blue potential is not used.
// No minimum is reported if inputs/weapon category cannot be established.
const characterAttackBranch=Object.freeze({
 '1H_SWORD':'slash','2H_SWORD':'slash','1H_TRUMP_WEAPON':'slash',
 '1H_AXE':'brush','2H_AXE':'brush',
 '1H_BLUNT_WEAPON':'blow','2H_BLUNT_WEAPON':'blow','WAND':'blow','STAFF':'blow',
 'POLE_ARM':'thrust','LANCE':'thrust',
 'BOW':'archery','CROSSBOW':'archery',
 '2H_TRUMP_WEAPON':'assassin',
 'BARE_HAND':'martial','MARTIAL_WEAPON':'martial'
});
function characterSheetPhysicalAttackRange({maximum=null,weapon=null,branchMasteries={}}={}){
 const branch=characterAttackBranch[weapon?.kind];
 const mastery=branch?branchMasteries?.[branch]:undefined;
 const pen=weapon?.PEN;
 if(!branch||!Number.isSafeInteger(maximum)||maximum<0||
  !Number.isSafeInteger(pen)||pen<0||
  !Number.isSafeInteger(mastery)||mastery<0)return null;
 const rate=Math.floor(100*pen/(200+6*mastery));
 if(!Number.isSafeInteger(rate)||rate<0||rate>100)return null;
 const minimum=maximum-Math.floor(maximum*rate/100);
 return {minimum,maximum,rate,pen,mastery,branch};
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
 if(!Number.isInteger(level)||level<1||level>55)return result;
 for(const [kind,setting] of [['windAssist','combatWindAssist'],
  ['windBlessing','combatWindBlessing']]){
  const source=supportSkillSource(skillCatalog,kind);
  const skill=source?.record;
  // Both wind skills can be cast by an ally. Requirements gate the caster,
  // not the hero receiving the chosen party effect.
  result[kind]=Boolean(selected?.[setting]===true&&source&&
   skill?.id===supportSkillIds[kind]&&skill.learnable!==false&&
   skill.prereq==null&&Number.isInteger(skill.charLevel)&&
   skill.charLevel>=0&&skill.charLevel<=55&&
   Array.isArray(skill.reqs)&&skill.reqs.every(req=>
    typeof req?.branch==='string'&&Number.isInteger(req.amount)&&req.amount>=0));
 }
 return result;
}
function magicAttackPreview({int,jobKey=null,magicMastery=0,weapon=null,guildArouse=0,
 weaponGrade=0,weaponEnhancementType='physical',magicPlus=null}={}){
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
 const guild=[0,2,4,6][guildArouse],baseExact=100+step+passive+staff+guild;
 // OS news #4: magical weapon refinement adds MATK percent points from
 // tables.magicPlus[grade].ratio. The source's additional "flat" column is
 // a different undocumented field; never count it as a second MATK bonus.
 const magical=weaponEnhancementType==='magical'&&weapon?.slot==='weapon'&&weaponGrade>0;
 const tier=magical?magicPlus?.[String(weaponGrade)]:null;
 const refinement=magical?(Number.isFinite(tier?.ratio)?tier.ratio:null):0;
 const exact=refinement===null?null:baseExact+refinement;
 return {known:exact===null?null:(exact>=100?Math.floor(exact*10)/10:exact),
  base:100,intelligence:step,passive,staff,guild,refinement,
  beforeRefinement:baseExact,verified:false};
}
// Strictly opt-in skill effects. Gate every buff by current OS class and
// character level, not by the presence of an unchecked saved toggle.
function activeCombatSkills({selected={},jobKey=null,level=1,hasShield=false,
 weapon=null,skillCatalog=null,branchMasteries={}}={}){
 const validLevel=Number.isInteger(level)&&level>=1&&level<=55;
 const permitted=(key,selectedKey,legacyClasses,minLevel)=>{
  if(!validLevel||selected?.[selectedKey]!==true)return false;
  if(skillCatalog){
   const source=combatSkillSource(skillCatalog,key);
   const record=source?.record;
   if(!source||!record?.classes?.[jobKey]||
    !Number.isInteger(record.charLevel)||level<record.charLevel||
    record.learnable===false||record.prereq!=null)return false;
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
 // An ally's War Cry affects any party member. Retain fallback only
 // for calculator fixtures without a current OS skill catalog.
 const warCry=validLevel&&selected?.combatWarCry===true&&
  (skillCatalog?(()=>{
   const rec=combatSkillSource(skillCatalog,'warCry')?.record;
   return Boolean(rec?.id===combatSkillIds.warCry&&rec.learnable!==false&&
    rec.prereq==null&&Number.isInteger(rec.charLevel)&&
    rec.charLevel>=0&&rec.charLevel<=55&&Array.isArray(rec.reqs)&&
    rec.reqs.every(req=>typeof req?.branch==='string'&&
     Number.isInteger(req.amount)&&req.amount>=0));
  })():meleeLineage.has(jobKey)&&level>=28);
 const raging=permitted('raging','combatRage',meleeLineage,35);
 const defender=permitted('defender','combatDefender',knightLineage,35)&&hasShield&&!raging;
 const lunge=permitted('lunge','combatLunge',warriorBuffClasses,18);
 const concentration=permitted('concentration','combatConcentration',new Set(),0);
 return {warCry,raging,defender,lunge,concentration};
}
// Current OS racial weapon passives expose independent flat and percentage
// channels of EP_SKILL_EQUIP_DAMAGERATE. Remaked Legacy Calc('ATK') adds the
// weapon-matched flat amount and ceil(base ATK * rate / 100) to final ATK.
// Weapon categorisation is a source-property comparison, not a statement
// about all mounted, magical or skill-specific combat restrictions.
const racialWeaponRules=Object.freeze({
 900010001:Object.freeze({kind:'oneHanded',ru:'Бойцовский дух',en:'Fighting spirit'}),
 900030002:Object.freeze({kind:'axeBlunt',ru:'Дух цверга',en:'Dwarven spirit'}),
 900050002:Object.freeze({kind:'twoHanded',ru:'Сильные руки',en:'Strong arms'})
});
const axeBluntKinds=new Set(['1H_AXE','2H_AXE','1H_BLUNT_WEAPON','2H_BLUNT_WEAPON']);
function racialWeaponPreview({racialPassiveId=null,skillCatalog=null,weapon=null}={}){
 const rule=racialWeaponRules[racialPassiveId];
 if(!rule||!skillCatalog||typeof skillCatalog!=='object')return null;
 const skill=skillCatalog[String(racialPassiveId)];
 if(skill?.id!==Number(racialPassiveId)||skill.skillType!=='PASSIVE'||
  !Array.isArray(skill.funcs))return null;
 const matches=skill.funcs.filter(row=>row.ep==='EP_SKILL_EQUIP_DAMAGERATE'&&
  row.dir==='TARGET');
 if(matches.length!==1)return null;
 const effect=matches[0],flat=effect.fv1?.[3],percent=effect.fv2?.[3];
 if(!Number.isFinite(flat)||!Number.isFinite(percent)||flat<0||percent<0)return null;
 const validWeapon=weapon?.slot==='weapon'&&typeof weapon.kind==='string'&&
  typeof weapon.twoHanded==='boolean';
 // The game catalog declares the allowed weapon kinds explicitly; a blanket
 // twoHanded test accepts unsupported kinds and misses future rule changes.
 const allowedKinds=Array.isArray(skill.weaponUse)&&skill.weaponUse.length>0&&
  skill.weaponUse.every(kind=>typeof kind==='string')?skill.weaponUse:null;
 if(!allowedKinds)return null;
 const matchesCategory=!validWeapon?null:allowedKinds.includes(weapon.kind)&&
  (rule.kind==='oneHanded'?weapon.twoHanded===false:
   rule.kind==='twoHanded'?weapon.twoHanded===true:
    axeBluntKinds.has(weapon.kind));
 return {id:skill.id,ru:rule.ru,en:rule.en,kind:rule.kind,
  flat,percent,weaponKind:validWeapon?weapon.kind:null,
  matchesCategory,verified:false,source:'current OS skills.json',
  excluded:['server attack-stage rounding','mounted restrictions',
   'magic and skill damage interactions','weapon class-specific exceptions']};
}
// Defensive-skill previews use current OS records, not translations or
// estimated end-of-combat formulas. Source-only magnitudes are distinguished
// from actually enabled effects. A null number means mastery scaling or
// state-machine behavior cannot yet be calculated exactly.
const defensivePreviewSkillIds=Object.freeze([
 100053001,100057001,168052001,260001001,260005001,
 260008001,168055001,920120001
]);
const defensiveEffectIds=Object.freeze(new Set([
 'EP_DAMAGERATE_SCALE','EP_ARMORCLASS_SCALE','EP_AVOIDANCE_CONST',
 'EP_AVOIDANCE_SCALE','EP_PROTECTION_NUMB','EP_PROTECTION_TUMBLE',
 'EP_PROTECTION_MOVEBAN','EP_CRITICAL_SAFE','EP_BLOCK_ATK'
]));
function defensiveSkillPreview({skillCatalog=null,jobKey=null,level=1,
 branchMasteries={},weaponKind='BARE_HAND',hasShield=false,
 branchLabels={},englishBranches={}}={}){
 if(!skillCatalog||typeof skillCatalog!=='object'||typeof jobKey!=='string'||
  !Number.isInteger(level)||level<1)return [];
 return defensivePreviewSkillIds.flatMap(id=>{
  const record=skillCatalog[String(id)];
  if(!record||record.id!==id||!record.classes?.[jobKey]||
   !['MYSELF','TOGGLE','PASSIVE'].includes(record.skillType))return [];
  const effects=(record.funcs||[]).filter(f=>f?.dir==='TARGET'&&
   defensiveEffectIds.has(f.ep));
  if(!effects.length)return [];
  const reasons=[],reasonsEn=[];
  if(Number(record.charLevel||0)>level){
   reasons.push('Требуется уровень '+record.charLevel);
   reasonsEn.push('Requires level '+record.charLevel);
  }
  for(const req of record.reqs||[]){
   if(!req||typeof req.branch!=='string'||!Number.isInteger(req.amount))continue;
   if(Number(branchMasteries?.[req.branch]||0)<req.amount){
    reasons.push('Требуется мастерство «'+
     (branchLabels[req.branch]||req.branch)+'»: '+req.amount);
    reasonsEn.push('Requires '+(englishBranches[req.branch]||req.branch)+
     ' mastery '+req.amount);
   }
  }
  if(Array.isArray(record.weaponUse)&&record.weaponUse.length&&
   !record.weaponUse.includes(weaponKind)){
   reasons.push('Не подходит экипированное оружие');
   reasonsEn.push('Equipped weapon is incompatible');
  }
  // Bastion is shield-only in activeCombatSkills as well. The raw skill
  // record has no weaponUse restriction, so enforce the same equipped-shield
  // condition here instead of misleading the player with an available label.
  if(id===100053001&&!hasShield){
   reasons.push('Необходимо экипировать щит');
   reasonsEn.push('A shield must be equipped');
  }
  if(record.learnable===false||record.prereq!=null){
   reasons.push('Изучение умения не подтверждено');
   reasonsEn.push('Skill learning not confirmed');
  }
  const values=effects.map(f=>({
   ep:f.ep,
   // Only source constants with zero coefficients may be shown as exact
   // static magnitudes; conditional or scaled magnitudes stay unknown.
   amount:Array.isArray(f.fv1)&&f.fv1.length===4&&
    f.fv1.every(Number.isFinite)&&f.fv1.slice(0,3).every(x=>x===0)?
    f.fv1[3]:null,
   coefficients:Array.isArray(f.fv1)?f.fv1.slice():[]
  }));
  return [{id,name:record.name,description:record.desc||'',
   type:record.skillType,available:reasons.length===0,
   reason:reasons.join(' · '),reasonEn:reasonsEn.join(' · '),
   minimumLevel:record.charLevel||0,requirements:record.reqs||[],
   effects:values,source:'Current game skill catalog'}];
 });
}
// A narrowly bounded **hypothesis**, not a final elemental spell damage
// formula. The Legacy spell-damage kernel was not available for independent
// OS confirmation. Only six learnable source identities with a zero fv1[1]
// term qualify; other elemental spells have a different vector structure.
const modeledElementalSpellBranches=Object.freeze({
 410001001:'element',410002001:'element',410004001:'element',
 430001001:'darkness',430052001:'darkness',430053001:'darkness'
});
function elementalSpellCoefficientPreview({skillCatalog,jobKey,level,
 branchMasteries={},branchCaps={},branchLabels={},englishBranches={},stats={}}={}){
 if(!skillCatalog||typeof skillCatalog!=='object'||Array.isArray(skillCatalog)||
  typeof jobKey!=='string'||!Number.isSafeInteger(level)||level<1||level>55)
  return [];
 const intelligence=stats?.int;
 if(!Number.isSafeInteger(intelligence)||intelligence<0||intelligence>1000)
  return [];
 const out=[];
 for(const [key,branch] of Object.entries(modeledElementalSpellBranches)){
  const id=Number(key),skill=skillCatalog[key];
  if(!skill||skill.id!==id||skill.learnable!==true||
   skill.prereq!=null||skill.branch!==branch||
   !skill.classes?.[jobKey]||
   !['BOLT','RADIATION','ENEMY'].includes(skill.skillType)||
   !Array.isArray(skill.reqs)||!Array.isArray(skill.funcs))continue;
  const cap=branchCaps?.[branch],rank=branchMasteries?.[branch]??0;
  if(!Number.isSafeInteger(cap)||cap<=0||
   !Number.isSafeInteger(rank)||rank<0||rank>cap||
   !skill.reqs.every(req=>req?.branch===branch&&
    Number.isSafeInteger(req.amount)&&req.amount>=0&&
    req.amount<=cap))continue;
  const effects=skill.funcs.filter(effect=>
   effect?.ep==='EP_ELEMENT_DAMAGE'&&effect.dir==='TARGET');
  if(effects.length!==1)continue;
  const {fv1,fv2}=effects[0];
  if(!Array.isArray(fv1)||fv1.length!==4||
   !fv1.every(Number.isSafeInteger)||fv1[1]!==0||
   fv1[0]<0||fv1[0]>350||fv1[2]<0||fv1[2]>350||
   fv1[3]< -100||fv1[3]>500||
   !Array.isArray(fv2)||fv2.length!==4||fv2.some(n=>n!==0))continue;
  // Remaked coefficient-pattern preview: floor each contribution separately.
  // The server's actual final elemental damage stages remain unverified.
  const fromInt=Math.floor(intelligence*fv1[0]/100);
  const fromMastery=Math.floor(rank*fv1[2]/100);
  const amount=fv1[3]+fromInt+fromMastery;
  if(!Number.isSafeInteger(amount))continue;
  const reasons=[],reasonsEn=[];
  if(level<Number(skill.charLevel||0)){
   reasons.push('Требуется уровень '+skill.charLevel);
   reasonsEn.push('Requires level '+skill.charLevel);
  }
  for(const req of skill.reqs)if(rank<req.amount){
   reasons.push('Требуется мастерство «'+(branchLabels[branch]||branch)+'»: '+req.amount);
   reasonsEn.push('Requires '+(englishBranches[branch]||branch)+' mastery: '+req.amount);
  }
  const secondary=skill.funcs.some(effect=>effect.ep!=='EP_ELEMENT_DAMAGE');
  out.push({id,name:skill.name,description:skill.desc||'',
   amount:null,unit:'',available:reasons.length===0,
   reason:reasons.join(' · '),reasonEn:reasonsEn.join(' · '),
   uncertain:true,recipient:false,
   detailRu:'Предположение по INT и мастерству: точный урон, сопротивление цели, округление и '+
    (secondary?'дополнительные эффекты не подтверждены':'порядок применения не подтверждены'),
   detailEn:'INT and mastery assumption; final damage, target resistance, rounding and '+
    (secondary?'secondary effects unverified':'application order unverified'),
   coefficientModels:[{ep:'EP_ELEMENT_DAMAGE',
    labelRu:'Расчётная основа заклинания',labelEn:'Modeled spell basis',
    amount,unit:'',confidence:'coefficient-model',
    roundingParts:{base:fv1[3],int:fromInt,mastery:fromMastery,
     method:'floor-components'}}],
   source:'current OS elemental spell source; provisional INT/mastery hypothesis'});
 }
 return out.sort((a,b)=>a.id-b.id);
}
// Direct strike coefficient projections for currently learnable OS skills.
// The source coefficient is NOT a final damage number: hit count, weapon,
// target defense, procs and stage rounding remain explicitly unknown.
function directStrikeCoefficientPreview({skillCatalog,jobKey,level,
 branchMasteries={},branchCaps={},branchLabels={},englishBranches={},
 weaponKind='BARE_HAND'}={}){
 if(!skillCatalog||typeof skillCatalog!=='object'||Array.isArray(skillCatalog)||
  typeof jobKey!=='string'||!Number.isSafeInteger(level)||level<1||level>55)
  return [];
 const entries=Object.values(skillCatalog),output=[];
 const branchRank=b=>Number(branchMasteries?.[b]??0);
 const cap=b=>Number(branchCaps?.[b]??0);
 const validRecord=s=>s?.learnable===true&&
  Number.isSafeInteger(s.id)&&s.id>0&&
  skillCatalog[String(s.id)]===s&&s.classes?.[jobKey]&&
  typeof s.branch==='string'&&Number.isSafeInteger(cap(s.branch))&&
  cap(s.branch)>0&&
  Array.isArray(s.reqs)&&s.reqs.every(req=>typeof req?.branch==='string'&&
   Number.isSafeInteger(req.amount)&&req.amount>=0&&
   Number.isSafeInteger(cap(req.branch))&&cap(req.branch)>=req.amount)&&
  ['ENEMY','BOLT','BREATH','RADIATION','SPHERE'].includes(s.skillType);
 // Validate the strike effect and its triggering attack as one source
 // signature, including successor validity before suppressing a predecessor.
 const strikeVector=s=>{
  const hit=(s?.funcs||[]).filter(x=>x?.ep==='EP_ONHIT_DAMAGE_SCALE'&&
   x?.dir==='CASTER');
  if(hit.length!==1||!Array.isArray(hit[0].fv1)||
   hit[0].fv1.length!==4||
   !hit[0].fv1.every(Number.isSafeInteger)||
   !Array.isArray(hit[0].fv2)||
   hit[0].fv2.length!==4||hit[0].fv2.some(x=>x!==0))return null;
  const [statPart,reserved,masteryPart,constant]=hit[0].fv1;
  if(statPart!==0||reserved!==0||masteryPart<0||masteryPart>100||
   constant< -100||constant>150)return null;
  if(!(s.funcs||[]).some(x=>
   ['EP_PLAYER_ATTACK','EP_PLAYER_ATTACK2'].includes(x?.ep)&&
   x?.dir==='TARGET'))return null;
  return {masteryPart,constant};
 };
 for(const s of entries){
  if(!validRecord(s))continue;
  const rank=branchRank(s.branch);
  if(!Number.isSafeInteger(rank)||rank<0||rank>cap(s.branch))continue;
  const vector=strikeVector(s);
  if(!vector)continue;
  const {masteryPart,constant}=vector;
  if(s.prereq!=null){
   const previous=skillCatalog[String(s.prereq)];
   if(!previous||previous.id!==s.prereq||previous.learnable!==true||
    previous.branch!==s.branch)continue;
   // An advanced skill is a REPLACEMENT, not an extra theoretical rank:
   // show it only after its current OS level/mastery conditions are met.
   if(level<Number(s.charLevel||0)||
    s.reqs.some(req=>branchRank(req.branch)<req.amount))continue;
  }
  // A learned successor with the same supported source family replaces
  // its predecessor, as in Double Slash -> Cut. It does not add a second hit.
  const upgraded=entries.some(next=>next?.prereq===s.id&&
   validRecord(next)&&strikeVector(next)&&next.branch===s.branch&&
   level>=Number(next.charLevel||0)&&
   next.reqs.every(req=>branchRank(req.branch)>=req.amount));
  if(upgraded)continue;
  const coefficient=constant+Math.floor(rank*masteryPart/100);
  if(!Number.isSafeInteger(coefficient))continue;
  const reasons=[],reasonsEn=[];
  if(level<Number(s.charLevel||0)){
   reasons.push('Требуется уровень '+s.charLevel);
   reasonsEn.push('Requires level '+s.charLevel);
  }
  for(const req of s.reqs)if(branchRank(req.branch)<req.amount){
   reasons.push('Требуется мастерство «'+(branchLabels[req.branch]||req.branch)+'»: '+req.amount);
   reasonsEn.push('Requires '+(englishBranches[req.branch]||req.branch)+' mastery: '+req.amount);
  }
  if(Array.isArray(s.weaponUse)&&s.weaponUse.length&&
   !s.weaponUse.includes(weaponKind)){
   reasons.push('Не подходит экипированное оружие');
   reasonsEn.push('Incompatible equipped weapon');
  }
  output.push({id:s.id,name:s.name,description:s.desc||'',
   amount:null,unit:'',available:reasons.length===0,
   reason:reasons.join(' · '),reasonEn:reasonsEn.join(' · '),
   uncertain:true,recipient:false,
   detailRu:'Сила удара рассчитана по параметрам умения. Итоговый урон по противнику и число попаданий пока неизвестны.',
   detailEn:'Estimated strike strength from skill data. Final damage and hit count against the target are not known yet.',
   coefficientModels:[{
    ep:'EP_ONHIT_DAMAGE_SCALE',labelRu:'Сила удара (расчёт)',
    labelEn:'Estimated strike strength',amount:coefficient,unit:'%',
    confidence:'coefficient-model'}],
   source:'current OS skill attack effect coefficient model'});
 }
 return output.sort((a,b)=>a.id-b.id);
}
// Hero Book Skill Effects is a READ-ONLY magnitude inspector, NOT active
// skill toggles. Only build-dependent outcomes belong here. Whitelisted
// source vectors are cross-checked against the live OS catalog; unknown
// rounding never becomes an invented number. An unavailable skill can still
// show its theoretical value, like the five Healing previews.
// Source-only OS resource/target effects. Do not add to permanent totals.
const utilitySkillRules=[
 {id:100061001,type:'MYSELF',branch:'martial',lv:50,byLevel:true,req:null,
  expected:[['EP_BENCHTIME_CUT',[0,0,0,50]],['EP_CONSUME_LIFE_SCALE',[0,0,0,30]]],
  parts:[['Сокращение перезарядки','Cooldown reduction',50,'%'],
   ['Расход ОЗ','HP cost',30,'%']]},
 {id:440008001,type:'ENEMY',branch:'charm',lv:0,byLevel:false,req:33,
  expected:[['EP_AVOIDANCE_CONST',[0,0,0,-40]],['EP_AVOIDANCE_SCALE',[0,0,-25,-25]]],
  parts:[['Уклонение · константа','Evasion · constant',-40,''],
   ['Уклонение · базовый коэффициент','Evasion · base coefficient',-25,''],
   ['Уклонение · коэффициент мастерства','Evasion · mastery coefficient',-25,'']]},
 {id:440006001,type:'ENEMY',branch:'charm',lv:45,byLevel:true,req:null,
  expected:[['EP_STOP_TIME',[0,0,0,0]],['EP_HEAL_LIFE_FIN_SCALE',[0,0,-50,-50]]],
  parts:[['Лечение · базовый коэффициент','Healing · base coefficient',-50,''],
   ['Лечение · коэффициент мастерства','Healing · mastery coefficient',-50,'']]}
];
function utilitySkillSourcePreview({skillCatalog=null,jobKey=null,level=1,
 branchMasteries={},branchCaps={},branchLabels={},englishBranches={}}={}){
 if(!skillCatalog||typeof jobKey!=='string'||!Number.isSafeInteger(level)||
  level<1||level>55)return [];
 const out=[];
 for(const rule of utilitySkillRules){
  const s=skillCatalog[String(rule.id)];
  if(s?.id!==rule.id||s.learnable!==true||s.skillType!==rule.type||
   s.branch!==rule.branch||s.charLevel!==rule.lv||
   s.isLevelBased!==rule.byLevel||s.prereq!==null||
   s.classes?.[jobKey]!==1||!Array.isArray(s.reqs)||
   s.reqs.length!==(rule.req===null?0:1)||
   (rule.req!==null&&(s.reqs[0]?.branch!==rule.branch||
    s.reqs[0]?.amount!==rule.req))||
   !Array.isArray(s.funcs)||s.funcs.length!==rule.expected.length)continue;
  // Reject whole record on any missing, changed, duplicated or mistargeted EP.
  const exact=rule.expected.every(([ep,v])=>{
   const rows=s.funcs.filter(f=>f?.ep===ep);
   return rows.length===1&&rows[0].dir==='TARGET'&&
    Array.isArray(rows[0].fv1)&&rows[0].fv1.length===4&&
    rows[0].fv1.every((n,i)=>n===v[i])&&
    Array.isArray(rows[0].fv2)&&rows[0].fv2.length===4&&
    rows[0].fv2.every(n=>n===0);
  });
  if(!exact)continue;
  const cap=branchCaps?.[rule.branch],rank=branchMasteries?.[rule.branch]??0;
  if(!Number.isSafeInteger(cap)||cap<0||
   (rule.req!==null&&cap<rule.req))continue;
  const reasons=[],reasonsEn=[];
  if(!Number.isSafeInteger(rank)||rank<0||rank>cap){
   reasons.push('Мастерство вне пределов профессии');
   reasonsEn.push('Mastery exceeds class limit');
  }
  if(level<rule.lv){
   reasons.push('Требуется уровень '+rule.lv);
   reasonsEn.push('Requires level '+rule.lv);
  }
  if(rule.req!==null&&(!Number.isSafeInteger(rank)||rank<rule.req)){
   reasons.push('Требуется мастерство «'+
    (branchLabels?.[rule.branch]||rule.branch)+'»: '+rule.req);
   reasonsEn.push('Requires '+
    (englishBranches?.[rule.branch]||branchLabels?.[rule.branch]||rule.branch)+
    ' mastery: '+rule.req);
  }
  const hostile=rule.type==='ENEMY';
  out.push({id:s.id,name:s.name,description:s.desc||'',amount:null,unit:'',
   available:reasons.length===0,reason:reasons.join(' · '),
   reasonEn:reasonsEn.join(' · '),recipient:false,hostile,
   modelOnly:true,uncertain:true,
   sourceParameters:rule.parts.map(([labelRu,labelEn,amount,unit])=>({
    labelRu,labelEn,amount,unit,confidence:'source-parameter'})),
   detailRu:hostile?
    'Умение действует на цель; итоговое уклонение, лечение и сочетание эффектов пока не установлены':
    'Итоговый расход ОЗ и время перезарядки умения пока не установлены',
   detailEn:hostile?
    'Skill affects the target; final evasion, healing and combined effects remain unknown':
    'Final HP cost and cooldown calculation are not known yet',
   source:'Current OS effect vectors, source parameters only'});
 }
 return out;
}

// Read-only OS skill movement parameter family. The Remaked MoveSPD
// +30/+40 terms are already applied elsewhere; OS +200, negative toggles
// and enemy debuffs have no proven duration, stacking or final-speed stage.
const movementSkillRules=Object.freeze([
 [168002001,'TOGGLE_RADIATION','defense','CASTER',null,-1],
 [168002003,'TOGGLE_RADIATION','defense','CASTER',168002001,-1],
 [230002001,'TOGGLE','assassin','TARGET',null,-1],
 [230002005,'TOGGLE','assassin','TARGET',230002001,-1],
 [260002001,'MYSELF','warding','TARGET',null,1],
 [260003001,'MYSELF','warding','TARGET',0,1],
 [260010001,'ALLY','warding','TARGET',null,1],
 [320004001,'ALLY','archery','TARGET',null,1],
 [320009001,'ENEMY','blessing','TARGET',null,-1]
]);
function movementSkillSourcePreview({skillCatalog=null,jobKey=null,level=1,
 branchMasteries={},branchCaps={},branchLabels={},englishBranches={}}={}){
 if(!skillCatalog||typeof jobKey!=='string'||!Number.isSafeInteger(level)||
  level<1||level>55)return [];
 const result=[];
 for(const [id,type,branch,direction,prereq,sign] of movementSkillRules){
  const record=skillCatalog[String(id)];
  if(record?.id!==id||record.learnable!==true||record.skillType!==type||
   record.branch!==branch||record.prereq!==prereq||
   !Array.isArray(record.reqs)||!Array.isArray(record.funcs)||
   !Number.isSafeInteger(record.charLevel)||record.charLevel<0||
   record.charLevel>55)continue;
  if(prereq!==null&&prereq!==0){
   const parent=skillCatalog[String(prereq)];
   if(parent?.id!==prereq||parent.learnable!==true||
    parent.name!==record.name||parent.skillType!==type||
    !parent.classes?.[jobKey])continue;
  }
  const effects=record.funcs.filter(f=>f?.ep==='EP_MOVESPEED_SCALE');
  if(effects.length!==1||effects[0].dir!==direction)continue;
  const effect=effects[0],v=effect.fv1;
  if(!Array.isArray(v)||v.length!==4||!v.every(Number.isSafeInteger)||
   v.slice(0,3).some(n=>n!==0)||v[3]*sign<=0||Math.abs(v[3])>300||
   !Array.isArray(effect.fv2)||effect.fv2.length!==4||
   effect.fv2.some(n=>n!==0))continue;
  const recipient=type==='ALLY',hostile=type==='ENEMY',
   cap=Number(branchCaps?.[branch]??0);
  if(!recipient&&(!record.classes?.[jobKey]||
   !Number.isSafeInteger(cap)||cap<=0))continue;
  if(!record.reqs.every(req=>typeof req?.branch==='string'&&
   Number.isSafeInteger(req.amount)&&req.amount>=0&&
   (recipient||(Number.isSafeInteger(branchCaps[req.branch])&&
    branchCaps[req.branch]>=req.amount))))continue;
  const reasons=[],reasonsEn=[],rank=Number(branchMasteries?.[branch]??0);
  if(!recipient){
   if(!Number.isSafeInteger(rank)||rank<0||rank>cap){
    reasons.push('Мастерство вне пределов профессии');
    reasonsEn.push('Mastery exceeds the class limit');
   }
   if(level<record.charLevel){
    reasons.push('Требуется уровень '+record.charLevel);
    reasonsEn.push('Requires level '+record.charLevel);
   }
   for(const req of record.reqs)if(Number(branchMasteries?.[req.branch]??0)<req.amount){
    const ru=branchLabels[req.branch]||req.branch;
    const en=englishBranches[req.branch]||ru;
    reasons.push('Требуется мастерство «'+ru+'»: '+req.amount);
    reasonsEn.push('Requires '+en+' mastery: '+req.amount);
   }
  }
  const ruScope=hostile?'на противнике':direction==='CASTER'?'на применяющем':
   recipient?'на союзнике':'на персонаже';
  const enScope=hostile?'on the enemy':direction==='CASTER'?'on the caster':
   recipient?'on an ally':'on the character';
  result.push({id,name:record.name,description:record.desc||'',amount:v[3],
   unit:'',available:reasons.length===0,reason:reasons.join(' · '),
   reasonEn:reasonsEn.join(' · '),recipient,hostile,modelOnly:true,uncertain:true,
   detailRu:'Изменение скорости '+ruScope+' по данным умения;'+
    ' итоговая скорость, длительность и сочетание эффектов пока неизвестны',
   detailEn:'Skill changes speed '+enScope+
    '; final speed, duration and combined effects are not known yet',
   source:'current OS EP_MOVESPEED_SCALE; source magnitude only'});
 }
 return result;
}

function scalingSkillPreview({skillCatalog=null,jobKey=null,level=1,
 branchMasteries={},branchCaps={},branchLabels={},englishBranches={},
 stats={},combat=null,weaponKind='BARE_HAND',hasShield=false}={}){
 const result={offense:[],defense:[],movement:[],utility:[],verified:false,
  source:'Remaked SkillView floors and current OS skill effect vectors'};
 if(!skillCatalog||!combat||typeof jobKey!=='string'||
  !Number.isInteger(level)||level<1||level>55)return result;
 const validStat=key=>Number.isFinite(stats[key])&&stats[key]>=0;
 const skill=id=>skillCatalog[String(id)];
 const exact=(record,ep,values)=>{
  const rows=(record?.funcs||[]).filter(f=>f?.dir==='TARGET'&&f.ep===ep);
  return rows.length===1&&Array.isArray(rows[0].fv1)&&
   rows[0].fv1.length===4&&rows[0].fv1.every((n,i)=>n===values[i])&&
   Array.isArray(rows[0].fv2)&&rows[0].fv2.length===4&&
   rows[0].fv2.every((n,i)=>n===(
    ep==='EP_SKILL_EXEC_COUNT'?[0,0,0,4]:
    ['EP_MANA_SHIELD','EP_CASTINGCANCEL_RESISTANCE_CONST'].includes(ep)?
     [0,0,0,15]:[0,0,0,0])[i]);
 };
 const mastery=branch=>Number(branchMasteries?.[branch]??0);
 const cap=branch=>Number(branchCaps?.[branch]??0);
 // Never auto-translate or approximate official OS mastery names.
 // The app passes Russian meta.branchLabels and English strings.en.branches.
 const branchName=(key,english=false)=>{
  const label=(english?englishBranches:branchLabels)?.[key];
  return typeof label==='string'&&label.trim()?label.trim():key;
 };
 // Source-backed, READ-ONLY coefficient projections for OS skill effects.
 // Interpretation of fv1: [attribute %, reserved, mastery %, constant] matches
 // the known Remaked coefficient families. Unknown server rounding/stacking is
 // explicitly NOT asserted: these models never feed character/combat totals.
 const coefficientModel=(id,ep,statKey,branch,labelRu,labelEn,unit='')=>{
  const matches=(skill(id)?.funcs||[]).filter(f=>f?.ep===ep&&f?.dir==='TARGET');
  if(matches.length!==1)return null;
  const f=matches[0],v=f.fv1;
  if(!Array.isArray(v)||v.length!==4||
   !v.every(Number.isSafeInteger)||v[1]!==0||
   !Array.isArray(f.fv2)||f.fv2.length!==4||
   !f.fv2.every(Number.isSafeInteger))return null;
  if((!statKey&&v[0]!==0)||(!branch&&v[2]!==0))return null;
  const stat=statKey?stats[statKey]:0;
  const rank=branch?mastery(branch):0;
  if(!Number.isSafeInteger(stat)||stat<0||
   !Number.isSafeInteger(rank)||rank<0||
   (branch&&(!Number.isSafeInteger(cap(branch))||
    cap(branch)<=0||rank>cap(branch))))return null;
  const amount=v[3]+Math.floor(stat*v[0]/100)+
   Math.floor(rank*v[2]/100);
  if(!Number.isSafeInteger(amount))return null;
  return {ep,labelRu,labelEn,amount,unit,
   // Model assumption, not a confirmed server result.
   confidence:'coefficient-model'};
 };
 const seen=new Set();
 const add=(id,group,required,compute,options={})=>{
  const record=skill(id);
  const predecessor=options.predecessor==null?null:skill(options.predecessor);
  const sourceChainValid=options.predecessor==null?record?.prereq==null:
   record?.prereq===options.predecessor&&predecessor?.id===options.predecessor&&
   predecessor?.learnable===true&&predecessor?.name===record?.name&&
   predecessor?.skillType===record?.skillType&&
   predecessor?.classes?.[jobKey]===1;
  if(!record||Number(record.id)!==id||record.learnable!==true||
   !sourceChainValid||!Array.isArray(record.reqs)||
   !Array.isArray(record.funcs)||!required.every(([ep,coeff])=>exact(record,ep,coeff))||
   seen.has(id))return;
  const recipient=options.recipient===true;
  if(!recipient&&!record.classes?.[jobKey])return;
  if(!recipient&&record.reqs.some(req=>typeof req?.branch!=='string'||
   !Number.isInteger(req.amount)||req.amount<0||cap(req.branch)<req.amount))return;
  if(!recipient&&options.branch&&!cap(options.branch))return;
  if(!recipient&&options.song===true&&!songSkillPreview({
   skillCatalog,jobKey,level,branchMasteries,branchCaps}).rows.some(x=>x.id===id))return;
  const issues=[],issuesEn=[];
  // An impossible allocation may still have a mathematically valid source
  // coefficient. It must never show as a usable skill for this profession.
  if(!recipient&&options.branch&&
   (!Number.isSafeInteger(mastery(options.branch))||
    mastery(options.branch)<0||mastery(options.branch)>cap(options.branch)))
   {issues.push('Мастерство превышает предел профессии');
    issuesEn.push('Mastery exceeds class maximum');}
  if(!recipient&&level<Number(record.charLevel||0)){
   issues.push('Требуется уровень '+record.charLevel);
   issuesEn.push('Requires level '+record.charLevel);
  }
  if(!recipient)for(const req of record.reqs){
   if(mastery(req.branch)<req.amount){
    issues.push('Требуется мастерство «'+branchName(req.branch)+'»: '+req.amount);
    issuesEn.push('Requires '+branchName(req.branch,true)+' mastery: '+req.amount);
   }
  }
  if(!recipient&&Array.isArray(record.weaponUse)&&record.weaponUse.length&&
   !record.weaponUse.includes(weaponKind)){
   issues.push('Не подходит оружие');
   issuesEn.push('Incompatible weapon');
  }
  if(!recipient&&options.shield&&!hasShield){
   issues.push('Нужен щит');
   issuesEn.push('Requires shield');
  }
  const amount=compute();
  if(amount!==null&&(!Number.isFinite(amount)||!Number.isSafeInteger(amount)))return;
  result[group].push({id,name:record.name,description:record.desc||'',
   amount,unit:options.unit||'',available:issues.length===0,
   reason:issues.join(' · '),reasonEn:issuesEn.join(' · '),recipient,
   detailRu:options.detailRu||'',detailEn:options.detailEn||'',
   uncertain:amount===null||options.modelOnly===true,
   modelOnly:options.modelOnly===true,
   coefficientModels:Array.isArray(options.models)?
    options.models.filter(x=>x?.confidence==='coefficient-model'):[],
   source:'Remaked + OS skill catalog'});
  seen.add(id);
 };
 const baseAtk=combat.attack?.mountedBase??combat.attack?.walkingBase;
 const unmountedAtk=combat.attack?.walkingBase;
 const baseDef=combat.defense?.directRaw;
 const dodgeBase=combat.dodge?.base;
 const accuracyBase=combat.accuracy?.base;
 const pct=(base,percent,round=Math.floor)=>
  Number.isFinite(base)?round(base*percent/100):null;
 const manual=()=>null;
 // Party effects whose size uses the receiving hero's current stats.
 add(320001001,'offense',[
  ['EP_DAMAGERATE_CONST',[0,0,0,10]],
  ['EP_DAMAGERATE_SCALE',[0,0,0,20]]
 ],()=>Number.isFinite(unmountedAtk)?10+Math.floor(unmountedAtk*.20):null,
 {recipient:true,unit:' ATK',detailRu:'Прибавка при применении к этому герою',
  detailEn:'Calculated for this recipient when cast'});
 add(100055001,'offense',[
  ['EP_TOHIT_CONST',[0,0,0,20]],
  ['EP_TOHIT_SCALE',[0,0,0,15]]
 ],()=>Number.isFinite(accuracyBase)?Math.floor(20+accuracyBase*.15):null,
 {recipient:true,unit:'',detailRu:'Точность получателя',
  detailEn:'Recipient accuracy bonus'});
 add(260006001,'defense',[
  ['EP_AVOIDANCE_CONST',[0,0,0,15]],
  ['EP_AVOIDANCE_SCALE',[0,0,0,15]]
 ],()=>Number.isFinite(dodgeBase)?Math.floor(15+dodgeBase*.15):null,
 {recipient:true,detailRu:'Уклонение получателя',
  detailEn:'Recipient evasion bonus'});
 // Purify is a two-step current OS cast. The root triggers a distinct
 // internal TARGET resistance effect; +100 is NOT permanent character status
 // resistance, nor proof of duration, proc probability or a server hit roll.
 const purify=skill(310014001),inner=skill(310014002);
 const purifyChain=purify?.id===310014001&&purify.learnable===true&&
  purify.name==='Полное исцеление'&&purify.skillType==='ALLY'&&
  purify.branch==='benevolence'&&purify.prereq==null&&
  Array.isArray(purify.reqs)&&purify.reqs.length===1&&
  purify.reqs[0]?.branch==='benevolence'&&purify.reqs[0]?.amount===71&&
  Array.isArray(purify.funcs)&&purify.funcs.length===2&&
  inner?.id===310014002&&inner.learnable===false&&
  inner.name===purify.name&&inner.skillType==='ALLY'&&
  Array.isArray(inner.funcs)&&inner.funcs.length===2&&
  exact(inner,'EP_IMMUNE_VIT_TYPE',[0,0,0,100])&&
  exact(inner,'EP_IMMUNE_SPI_TYPE',[0,0,0,100]);
 if(purifyChain)add(310014001,'defense',[
  ['EP_RECOVERY_HEALTH',[0,0,0,0]],
  ['EP_SKILL_EXEC',[0,0,0,310014002]]
 ],manual,{recipient:true,modelOnly:true,
  models:[
   {ep:'EP_IMMUNE_VIT_TYPE',labelRu:'Состояния тела',labelEn:'Body ailments',
    amount:100,unit:'',confidence:'coefficient-model'},
   {ep:'EP_IMMUNE_SPI_TYPE',labelRu:'Состояния духа',labelEn:'Mind ailments',
    amount:100,unit:'',confidence:'coefficient-model'}
  ],
  detailRu:'Полное исцеление при наложении союзником. Эти значения не прибавляются к постоянным сопротивлениям героя',
  detailEn:'Purify from an ally. These values are not permanent status resistance bonuses'});
 // Personal combat effects: previews use the unbuffed weapon/armor/dodge
 // kernel already available in the calculator, without activating anything.
 add(100052001,'offense',[
  ['EP_DAMAGERATE_SCALE',[0,0,0,30]]
 ],()=>pct(unmountedAtk,30,Math.ceil),
 {unit:' АТК',detailRu:'От базовой физической атаки',
  detailEn:'From base physical attack'});
 add(100053001,'defense',[
  ['EP_ARMORCLASS_SCALE',[0,0,0,40]],
  ['EP_DAMAGERATE_SCALE',[0,0,0,-20]]
 ],()=>pct(baseDef,40),
 {shield:true,unit:' защиты',detailRu:'Прибавка от базовой защиты; атака снижается на 20%',
  detailEn:'From base defense; attack is reduced by 20%'});
 add(100057001,'defense',[
  ['EP_DAMAGERATE_SCALE',[0,0,0,-50]]
 ],()=>pct(unmountedAtk,-50),
 {unit:' АТК',detailRu:'Снижение от базовой атаки; защитные состояния не имеют числовой шкалы',
  detailEn:'Attack penalty from base attack; protection states are not numeric'});
 add(168052001,'defense',[
  ['EP_AVOIDANCE_SCALE',[0,0,0,-50]]
 ],()=>pct(dodgeBase,-50),
 {unit:' уклонения',detailRu:'Снижение от базового уклонения; защита от крита не является числом',
  detailEn:'Reduced base evasion; critical protection is not a numeric magnitude'});
 // Warding 26 is applied to Defense separately. Skill Effects is read-only,
 // and reuses the identical three-TARGET source gate, ignoring CASTER Numb.
 const wardingProof=wardingStatusPassive({jobKey,wardingMastery:26,
  wardingCap:cap('warding'),skillCatalog});
 if(wardingProof)add(260007001,'defense',[
  ['EP_IMMUNE_STUN',[0,0,0,15]],
  ['EP_IMMUNE_NUMB',[0,0,0,15]],
  ['EP_IMMUNE_TUMBLE',[0,0,0,15]]
 ],()=>wardingProof.stun,{branch:'warding',unit:' сопротивления',
  detailRu:'По +15 к оглушению, заморозке и падению',
  detailEn:'+15 each to stun, numb and tumble resistance'});
 // Selected buffs already use these two OS coefficient vectors and the
 // matching floor stages. Share those exact results with Skill Effects.
 const quickDodge=coefficientModel(260005001,'EP_AVOIDANCE_CONST',
  'agi','warding','Уклонение','Evasion');
 add(260005001,'defense',[
  ['EP_AVOIDANCE_CONST',[5,0,15,10]]
 ],()=>quickDodge?.amount??null,{branch:'warding',modelOnly:true,
  unit:' уклонения',models:[quickDodge],
  detailRu:'ПРВ и мастерство уклонения',
  detailEn:'AGI and Warding mastery'});
 const skillRangeSource=skillAttackRangePreview({skillCatalog,jobKey,level,
  branchMasteries,branchCaps,weapon:{slot:'weapon',kind:weaponKind}});
 const verifiedRangeSource=id=>skillRangeSource.rows.some(row=>row.id===id);
 if(verifiedRangeSource(213605001))add(213605001,'offense',[
  ['EP_DAMAGERATE_SCALE',[0,0,30,20]],
  ['EP_TOHIT_CONST',[0,0,30,20]]
 ],()=>Number.isFinite(unmountedAtk)?
   Math.ceil(unmountedAtk*(20+Math.floor(mastery('archery')*.30))/100):null,
 {branch:'archery',modelOnly:true,unit:' АТК',
  models:[
   coefficientModel(213605001,'EP_DAMAGERATE_SCALE',null,'archery',
    'Усиление атаки (расчёт)','Estimated attack bonus','%'),
   coefficientModel(213605001,'EP_TOHIT_CONST',null,'archery',
    'Точность','Accuracy'),
   coefficientModel(213605001,'EP_ATTACKRANGE_CONST',null,'archery',
    'Прибавка дальности (расчёт)','Estimated range bonus')
  ],
  detailRu:'Зависит от мастерства стрельбы; величина не подтверждена',
  detailEn:'Depends on Archery mastery; magnitude unverified'});
 const coldBlood=coefficientModel(142051001,'EP_CRITICALRATE_CONST',
  null,'brush','Шанс критического удара','Critical chance','%');
 add(142051001,'offense',[
  ['EP_CRITICALRATE_CONST',[0,0,20,10]]
 ],()=>coldBlood?.amount??null,{branch:'brush',modelOnly:true,
  unit:'%',models:[coldBlood],
  detailRu:'Мастерство рубящих',detailEn:'Cleaving mastery'});
 // The same poison enchant has a mastery-61 OS variant. Show only the
 // version the current green mastery can actually cast, never both at once.
 if(mastery('alchemy')>=61)
  add(220001003,'offense',[
   ['EP_AURAPOISON_CONSTANT',[0,10,15,6]]
  ],()=>5+1+Math.floor(level*.10)+Math.floor(mastery('alchemy')*.15),
 {branch:'alchemy',predecessor:220001001,modelOnly:true,
  unit:' урона ядом',
  detailRu:'Усиленный яд · мастерство алхимии 61; итоговый урон ауры не подтверждён',
   detailEn:'Advanced poison, Alchemy 61; aura damage magnitude unverified'});
 else
  add(220001001,'offense',[
   ['EP_AURAPOISON_CONSTANT',[0,10,5,5]]
  ],()=>5+Math.floor(level*.10)+Math.floor(mastery('alchemy')*.05),
 {branch:'alchemy',modelOnly:true,unit:' урона ядом (модель)',
  detailRu:'Зависит от мастерства алхимии; итоговый урон ауры не подтверждён',
   detailEn:'Depends on Alchemy mastery; poison aura damage unverified'});
 // Elemental Absorption: this value is the source-scaled protection
 // parameter, not a claim about enemy damage or the final mitigation packet.
 const absorbParameter=coefficientModel(330002001,'EP_ABSOLUTE_MAGIC',
  'spi','exorcism','Поглощение стихий','Elemental absorption');
 add(330002001,'defense',[
  ['EP_ABSOLUTE_MAGIC',[20,0,20,10]]
 ],()=>absorbParameter?.amount??null,{branch:'exorcism',modelOnly:true,
  unit:'',models:[absorbParameter],
  detailRu:'Параметр защиты от огня, льда и молнии',
  detailEn:'Protection parameter against fire, ice and lightning'});
 // Conjurer level 50 receives distinct OS source variants; show one rank
 // per skill identity instead of duplicating a legacy and advanced row.
 const conjurerUpgrade=jobKey==='CONJURER'&&level>=50;
 const shieldId=conjurerUpgrade?420002002:420002001;
 const shieldParameter=coefficientModel(shieldId,'EP_MANA_SHIELD',
  null,'embody','Сила щита','Shield strength');
 add(shieldId,'defense',[
  ['EP_MANA_SHIELD',conjurerUpgrade?[0,0,20,10]:[0,0,10,10]]
 ],()=>shieldParameter?.amount??null,{branch:'embody',modelOnly:true,
  predecessor:conjurerUpgrade?420002001:null,
  unit:'',models:[shieldParameter],
  detailRu:'Сила магического щита от Воплощения',
  detailEn:'Magic shield strength from Embodiment mastery'});
 const windTrailId=conjurerUpgrade?420004002:420004001;
 const windTrailParameter=coefficientModel(windTrailId,
  'EP_CASTINGCANCEL_RESISTANCE_CONST','spi','embody',
  'Сопротивление прерыванию','Cast interruption resistance');
 add(windTrailId,'defense',[
  ['EP_CASTINGCANCEL_RESISTANCE_CONST',
   conjurerUpgrade?[15,0,15,1]:[10,0,10,1]]
 ],()=>windTrailParameter?.amount??null,{branch:'embody',modelOnly:true,
  predecessor:conjurerUpgrade?420004001:null,
  unit:'',models:[windTrailParameter],
  detailRu:'СД и мастерство Воплощения',
  detailEn:'SPI and Embodiment mastery'});
 add(320011001,'offense',[
  ['EP_AURADAMAGE_SCALE',[20,0,20,10]],
  ['EP_AURADAMAGE_CONST',[5,0,10,5]],
  ['EP_ELEMENT_DAMAGE_SCALE',[0,0,20,10]]
 ],manual,{branch:'blessing',
  models:[
   coefficientModel(320011001,'EP_AURADAMAGE_SCALE','spi','blessing',
    'Коэффициент ауры','Aura scaling','%'),
   coefficientModel(320011001,'EP_AURADAMAGE_CONST','spi','blessing',
    'Добавка к ауре','Aura flat parameter'),
   coefficientModel(320011001,'EP_ELEMENT_DAMAGE_SCALE',null,'blessing',
    'Коэффициент стихийного урона','Elemental damage scaling','%')
  ],
  detailRu:'Зависит от СД и Благословения; итоговое сложение ещё не подтверждено',
  detailEn:'Depends on SPI and Blessing; stacking unverified'});
 // Further independently verified VARIABLE self-cast effect vectors.
 // Current OS proves scaling but not damage packet semantics; do not
 // manufacture arithmetic by assuming a fixed per-point denominator.
 add(100058001,'offense',[
  ['EP_DAMAGERATE_SCALE',[0,0,35,40]]
 ],()=>Number.isFinite(unmountedAtk)?
  Math.ceil(unmountedAtk*(40+Math.floor(mastery('slash')*.35))/100):null,
 {modelOnly:true,unit:' АТК',
  models:[coefficientModel(100058001,'EP_DAMAGERATE_SCALE',
   null,'slash','Коэффициент физической атаки','Physical attack scaling','%')],
  detailRu:'Отчаянье: предполагаемая прибавка к атаке зависит от мастерства; получаемый урон +100%',
  detailEn:'Desperation: estimated attack gain depends on mastery; incoming damage +100%'});
 // Swift Arrow is an attack-interval enhancement with fixed OS source
 // [0,0,0,30], not direct +30 weapon damage. The displayed percentage is
 // the skill effect coefficient; no unproven firing-frequency conversion.
 add(213702001,'offense',[
  ['EP_ATTACKINTERVAL_SCALE',[0,0,0,30]]
 ],()=>30,{modelOnly:true,branch:'archery',unit:'% скорости стрельбы',
  detailRu:'Стремительная стрела: +30% к скорости стрельбы; точная частота атак пока неизвестна',
  detailEn:'Swift Arrow: +30% firing speed bonus; actual firing rate is not known yet'});
 // Self-cast Dark Aura uses the modern OS source vector rather than the
 // historical Remaked 73–206 tier table (a different ruleset).
 // An exact NEXT breakpoint can be derived from the OS coefficient [8,0,0,15].
 // This is a threshold of the model, not verified on the live server.
 const darkAuraTier=Number.isSafeInteger(stats.spi)&&stats.spi>=0?
  Math.floor(stats.spi*8/100):null;
 const darkAuraNextSpi=darkAuraTier===null?null:
  Math.ceil((darkAuraTier+1)*100/8);
 add(430051001,'offense',[
  ['EP_AURADARK_CONSTANT',[8,0,0,15]]
 ],()=>darkAuraTier===null?null:15+darkAuraTier,
 {branch:'darkness',modelOnly:true,unit:' урона тьмой',
  detailRu:'Тёмная аура: 15 + целая часть от 8% СД'+
   (darkAuraNextSpi===null?'':'; следующий порог СД: '+darkAuraNextSpi)+
   '',
  detailEn:'Dark Aura: 15 + whole-number part of 8% Spirit'+
   (darkAuraNextSpi===null?'':'; next SPI breakpoint: '+darkAuraNextSpi)+
   ''});
 // For multi-projectile attacks the source exposes multiple independent
 // coefficients. Never fold a secondary hit modifier into the character ATK,
 // infer shot count damage, or treat a range field as confirmed metres.
 if(verifiedRangeSource(213703001))add(213703001,'offense',[
  ['EP_DOUBLE_MISSILE',[20,0,30,-85]],
  ['EP_ATTACKRANGE_CONST',[0,0,900,100]],
  ['EP_ATTACKCARRY_CONST',[0,0,900,100]]
 ],manual,{branch:'archery',
  models:[
   coefficientModel(213703001,'EP_DOUBLE_MISSILE','str','archery',
    'Изменение силы выстрела','Projectile strength change'),
   coefficientModel(213703001,'EP_ATTACKRANGE_CONST',null,'archery',
    'Прибавка дальности (расчёт)','Estimated range bonus'),
   // Paired carry data is validated but not displayed as another bonus.
  ],
  detailRu:'Повторный выстрел из арбалета: сила и дальность от СИЛ и Стрельбы',
  detailEn:'Second crossbow shot: STR and Archery scaling'});
 // The follow-up attack changes with Assassin mastery. Its coefficient is
 // available; actual second-hit damage and triggering remain separate.
 add(233200101,'offense',[
  ['EP_INCREASE_ATTACK',[0,0,45,-100]]
 ],manual,{branch:'assassin',
  models:[coefficientModel(233200101,'EP_INCREASE_ATTACK',null,'assassin',
   'Сила повторного удара (расчёт)','Estimated follow-up hit strength')],
  detailRu:'Дополнительный удар при подходящем оружии от мастерства Убийства',
  detailEn:'Follow-up hit from Assassination mastery with compatible weapon'});
 const concentrationRate=coefficientModel(410000101,
  'EP_ELEMENT_DAMAGE_SCALE',null,'element',
  'Сила следующей магической атаки','Next elemental spell rate','%');
 add(410000101,'offense',[
  ['EP_ELEMENT_DAMAGE_SCALE',[0,0,30,20]],
  ['EP_ELEMENT_BONUS',[0,0,0,30]]
 ],()=>concentrationRate?.amount??null,{branch:'element',modelOnly:true,
  unit:'% к стихийному урону',models:[concentrationRate],
  detailRu:'Усиление следующей магической атаки от мастерства Стихий',
  detailEn:'Next spell enhancement from Elemental mastery'});
 // Legacy SkillView uses separate floor steps. For these entries the current
 // OS fv1 preserves the coefficient roles while updating the flat constant.
 add(320007001,'offense',[
  ['EP_ATTACKINTERVAL_SCALE',[10,0,5,5]]
 ],()=>validStat('spi')?5+Math.floor(stats.spi*.10)+Math.floor(mastery('blessing')*.05):null,
 {branch:'blessing',unit:' инд.',detailRu:'СД и мастерство Благословения',
  detailEn:'SPI and Blessing mastery'});
 add(320008001,'defense',[
  ['EP_ARMORCLASS_CONST',[3,0,4,5]]
 ],()=>validStat('spi')?5+Math.floor(stats.spi*.03)+Math.floor(mastery('blessing')*.04):null,
 {branch:'blessing',unit:' защиты',detailRu:'СД и мастерство Благословения',
  detailEn:'SPI and Blessing mastery'});
 add(320003001,'defense',[
  ['EP_ONDAMAGE_FIN_DAMAGE_SCALE',[0,0,-20,-10]]
 ],()=>-10-Math.floor(mastery('blessing')/5),
 {branch:'blessing',unit:'%',detailRu:'Снижение получаемого урона от мастерства Благословения',
  detailEn:'Damage received reduction from Blessing mastery'});
 add(320012001,'offense',[
  ['EP_STRENGTH_CONST',[0,0,10,0]],
  ['EP_AGILITY_CONST',[0,0,10,0]],
  ['EP_INTELIGENCE_CONST',[0,0,10,0]]
 ],()=>Math.floor(mastery('blessing')/10),
 {branch:'blessing',unit:' к СИЛ, ПРВ и ИНТ',
  detailRu:'Прибавка к трём характеристикам от Благословения',
  detailEn:'Bonus to STR, AGI and INT from Blessing mastery'});
 add(330051001,'offense',[
  ['EP_AURAHOLY_CONSTANT',[6,0,0,2]]
 ],()=>validStat('spi')?2+Math.floor(stats.spi*.06):null,
 {branch:'exorcism',unit:' урона светом',detailRu:'От СД заклинателя',
  detailEn:'From caster SPI'});
 add(430051001,'offense',[
  ['EP_AURADARK_CONSTANT',[8,0,0,15]]
 ],()=>validStat('spi')?15+Math.floor(stats.spi*.08):null,
 {branch:'darkness',unit:' урона тьмой',detailRu:'От СД заклинателя',
  detailEn:'From caster SPI'});
 // The real song is a three-hop effect chain; never trust a forged inner
 // record. The validated ROOT skill name provides the on-page identity.
 const songAvailable=id=>songSkillPreview({skillCatalog,jobKey,level,
  branchMasteries,branchCaps}).rows.some(row=>row.id===id);
 if(songAvailable(340001001)&&exact(skill(340001003),'EP_TOHIT_CONST',[13,0,13,4])&&
  exact(skill(340001003),'EP_AVOIDANCE_CONST',[13,0,13,4])){
  add(340001001,'offense',[
   ['EP_SKILL_EXEC_COUNT',[0,0,0,340001002]]
  ],()=>validStat('spi')?4+Math.floor(stats.spi*.13)+
   Math.floor(mastery('hymn')*.13):null,
  {song:true,branch:'hymn',unit:' точности и уклонения',
   detailRu:'СД и мастерство Песнопения',detailEn:'SPI and Hymn mastery'});
 }
 if(songAvailable(340004001)&&exact(skill(340004003),'EP_ELEMENT_DAMAGE_SCALE',[8,0,8,4])){
  add(340004001,'offense',[
   ['EP_SKILL_EXEC_COUNT',[0,0,0,340004002]]
  ],()=>validStat('spi')?4+Math.floor(stats.spi*.08)+
   Math.floor(mastery('hymn')*.08):null,
  {song:true,branch:'hymn',unit:'% стихийного урона',
   detailRu:'СД и мастерство Песнопения',detailEn:'SPI and Hymn mastery'});
 }
 for(const strike of directStrikeCoefficientPreview({
  skillCatalog,jobKey,level,branchMasteries,branchCaps,weaponKind,
  branchLabels,englishBranches
 })){
  if(!seen.has(strike.id))result.offense.push(strike);
 }
 for(const spell of elementalSpellCoefficientPreview({
  skillCatalog,jobKey,level,branchMasteries,branchCaps,stats,
  branchLabels,englishBranches
 })){
  if(!seen.has(spell.id))result.offense.push(spell);
 }
 result.movement=movementSkillSourcePreview({skillCatalog,jobKey,level,
  branchMasteries,branchCaps,branchLabels,englishBranches});
 result.utility=utilitySkillSourcePreview({skillCatalog,jobKey,level,
  branchMasteries,branchCaps,branchLabels,englishBranches});
 return result;
}

// Source-only class passive: EP_ONHIT_FIN_DAMAGE_CONST describes per-hit
// final damage, not the character-sheet ATK total. The server's hit kernel
// is not verified; show its availability without manufacturing a flat bonus.
function incredibleStrengthPreview({skillCatalog=null,jobKey=null,level=null}={}){
 const skill=skillCatalog?.['910110001'];
 if(!skill||skill.id!==910110001||skill.skillType!=='PASSIVE'||
  skill.learnable!==true||!skill.classes?.[jobKey]||
  !Number.isInteger(level)||level<skill.charLevel||
  !Array.isArray(skill.reqs)||skill.reqs.length!==0||
  !Array.isArray(skill.funcs)||skill.funcs.length!==1)return null;
 const row=skill.funcs[0];
 if(row.ep!=='EP_ONHIT_FIN_DAMAGE_CONST'||row.dir!=='TARGET'||
  !Array.isArray(row.fv1)||row.fv1.length!==4||
  !row.fv1.every(Number.isFinite))return null;
 return {id:skill.id,applies:true,effect:row.ep,
  sourceParameters:row.fv1.slice(),addsAttack:0,
  source:'current OS skills.json',verified:false};
}
function combatPreview({stats={},level=null,bonuses={},honorTitle=0,racialPassiveId=null,
 weapon=null,weaponGrade=0,weaponPlus=null,magicPlus=null,
 weaponEnhancementType='physical',records=[],itemForth=null,
 jobKey=null,meleeMastery=0,magicMastery=0,techniqueInnate=0,
 techniqueTrained=0,guildArouse=0,combatBuffs={},skillCatalog=null,
 priestEffects={},branchMasteries={},branchCaps=null,ridingMastery=0}={}){
 if(!Number.isInteger(level)||level<1||level>55||
  !['dex','agi','str'].every(key=>Number.isFinite(stats[key])&&stats[key]>=0)||
  !Number.isInteger(honorTitle)||honorTitle<0||honorTitle>=honorTitles.length)return null;
 // Remaked Calc(ATK/ACC/Dodge/MoveSPD/CastSPD/Cooldown) uses a
 // class/riding/honor-dependent percentage while Flag[7] is enabled.
 // Keep the unmounted path byte-for-byte numerically identical.
 const mounted=combatBuffs?.mounted===true;
 const mountedStatus=mountedReleasePreview({jobKey,ridingMastery,honorTitle});
 if(mounted&&!mountedStatus)return null;
 const mountedRate=mounted?Math.min(100,Math.max(0,mountedStatus.known))/100:1;
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
 const otherBuffs=root.PandoraRemakedBuffs?.applied({
  selected:combatBuffs?.remakedSkillIds,skills:skillCatalog,jobKey,level,
  weapon,branchMasteries,branchCaps,stats})||{};
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
 const critical=critBase+critEquip+(racialPassiveId===900040001?5:0)+
  (otherBuffs.coldBlood?.critical||0);
 // Current OS race skills are percentage effects; rounding/effect stage is
 // unknown, so do not fold them into the Legacy flat accuracy/dodge subtotal.
 const racialRate={accuracy:racialPassiveId===900040002?10:0,
  dodge:racialPassiveId===900040003?5:0};
 const racialWeapon=racialWeaponPreview({racialPassiveId,skillCatalog,weapon});
 const incredibleStrength=incredibleStrengthPreview({skillCatalog,jobKey,level});
 const attack=weaponAttackPreview({str:stats.str,weapon,
  grade:weaponEnhancementType==='magical'?0:weaponGrade,
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
 const walkingBaseAtk=attack?.raw??attack?.known??null;
 const baseAtk=walkingBaseAtk===null?null:
  (mounted?Math.ceil(walkingBaseAtk*mountedRate):walkingBaseAtk);
 const guildRate=[0,.02,.04,.06][guildArouse];
 if(guildRate===undefined)return null;
 const guildAtk=baseAtk===null?null:Math.ceil(baseAtk*guildRate);
 const activeAtk=baseAtk===null?null:
  (actives.warCry?effect('warCry','EP_DAMAGERATE_CONST')+
   Math.floor(baseAtk*effect('warCry','EP_DAMAGERATE_SCALE')/100):0)+
  (actives.raging?Math.ceil(baseAtk*effect('raging','EP_DAMAGERATE_SCALE')/100):0)+
  (actives.defender?Math.floor(baseAtk*effect('defender','EP_DAMAGERATE_SCALE')/100):0);
 const directDef=defense.directRaw;
 const activeDef=(actives.raging?Math.ceil(directDef*effect('raging','EP_ARMORCLASS_SCALE')/100):0)+
  (actives.defender?Math.floor(directDef*effect('defender','EP_ARMORCLASS_SCALE')/100):0);
 const priestDefense=Math.max(0,Number(priestEffects?.lapisMedio)||0);
 const effectiveDefense={...defense,activeBonus:activeDef,
  priestBonus:priestDefense,raw:defense.raw+activeDef+priestDefense,
  known:mounted?null:Math.floor(defense.raw+activeDef+priestDefense)};
 const atkPct=attack?equipped.attackPercent.map(e=>({
  ...e,bonus:Math.ceil(baseAtk*e.rate/100)})):[];
 const atkExtras=equipped.attackFlat+atkPct.reduce((sum,e)=>sum+e.bonus,0);
 // Racial percentage uses the weapon+refinement base, before unrelated
 // flat equipment ATK/buffs. Real client confirms integer truncation.
 const racialAttackBonus=baseAtk!==null&&racialWeapon?.matchesCategory===true?
  racialWeapon.flat+Math.floor(baseAtk*racialWeapon.percent/100):0;
 const effectiveAttack=attack?{...attack,flatEquipment:equipped.attackFlat,
  walkingBase:walkingBaseAtk,mountedBase:mounted?baseAtk:null,
  percentEquipment:atkPct,racialBonus:racialAttackBonus,
  activeBonus:activeAtk,guildBonus:guildAtk,
  known:Math.ceil(baseAtk+(mounted&&honorTitle===3?Math.floor(baseAtk*.02):attack.honor)+atkExtras+
   racialAttackBonus+activeAtk+guildAtk)}:null;
 const accuracyPercent=equipped.accuracyPercent.map(e=>({
  ...e,bonus:Math.ceil(accuracyBase*e.rate/100)}));
 const accuracyBonus=accuracyPercent.reduce((sum,e)=>sum+e.bonus,0);
 // Legacy Calc('ATKSPD'): 100 + 2*floor(AGI/10) +
 // 3*floor(AGI/20) + floor(AGI/10); typed as a speed index, not hits/sec.
 const speedBase=100+3*Math.floor(stats.agi/10)+3*Math.floor(stats.agi/20);
 const priestSpeed=Math.max(0,Number(priestEffects?.gratia)||0);
 const priestMinstrel=Number.isFinite(priestEffects?.minstrel)?
  Math.max(0,Number(priestEffects.minstrel)):0;
 const swiftArrow=otherBuffs.swiftArrow?.attackSpeed||0;
 const attackSpeed={base:speedBase,equipment:equipped.attackSpeedFlat,
  lunge:actives.lunge?effect('lunge','EP_ATTACKINTERVAL_SCALE'):0,
  swiftArrow,priestBonus:priestSpeed,
  known:(mounted?null:speedBase+equipped.attackSpeedFlat+priestSpeed+swiftArrow+
   (actives.lunge?effect('lunge','EP_ATTACKINTERVAL_SCALE'):0)),verified:false};
 // Legacy Calc('CastSPD'): 100 + 5*floor(DEX/10), without temporary casts.
 const castingBase=100+5*Math.floor(stats.dex/10);
 const castingEquipment=secondary.castSpeedReduction+secondary.castSpeedFinal;
 const castingSpeed={base:castingBase,equipment:castingEquipment,
  known:(mounted?100+Math.ceil((castingBase-100)*mountedRate):castingBase)+castingEquipment,
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
  weapon,weaponGrade,weaponEnhancementType,magicPlus,guildArouse});
 // Current OS EP_ELEMENT_DAMAGE_SCALE often represents the same staff bonus
 // already counted as +10/+15 above. Expose it, never double-add it to MATK.
 const spellDamageEquipmentRate=equipped.elementDamageRate;
 const castInterruption=equipped.castInterruptResist+(title.castingResist||0);
 const windMove=supportSkills.windBlessing?
  supportSkillValues.windBlessing.EP_MOVESPEED_SCALE:0;
 const lightness=otherBuffs.lightness?.movement||0;
 const movementSpeed={base:100,equipment:equipped.movement,
  active:windMove,lightness,
  known:(mounted?Math.ceil(100*mountedRate):100)+equipped.movement+windMove+lightness,
  townEquipment:secondary.townMovement,
  town:100+equipped.movement+windMove+lightness+secondary.townMovement,verified:false};
 const skillDelayEquipment=equipped.skillDelay;
 const skillDelayFinalEquipment=equipped.skillDelayFinal;
 const mpRecoveryEquipmentRate=equipped.mpRecoveryRate;
 const backAttackEquipmentRate=equipped.backAttackRate;
 const weaponPhysical=(meleeLineage.has(jobKey)?1+Math.floor(meleeMastery/10):0)
  +(title.weaponPhysical||0);
 const backAttack=15,frontAttack=title.frontAttack||0;
 const cooldown=Number.isFinite(stats.int)?100+
  (mounted?Math.ceil(-2*Math.floor(stats.int/10)*mountedRate):
   -2*Math.floor(stats.int/10))+secondary.cooldown:null;
 // Remaked Calc('ACC') writes the regular and front accuracy from the
 // same computed subtotal, plus independent EquipOpt[63] for front. Current
 // OS data has no verified front-only field mapping, so the explicitly
 // supported front component equals regular accuracy (not a new buff).
 const accuracyKnown=accuracy+
  (mounted?Math.ceil(accuracyBase*mountedRate)-accuracyBase:0)+accuracyBonus+hunterEye+
  (actives.concentration?effect('concentration','EP_TOHIT_CONST'):0)+
  (otherBuffs.thirdEye?Math.floor(otherBuffs.thirdEye.flat+
   accuracyBase*otherBuffs.thirdEye.percent/100):0)+priestMinstrel;
 const observedDodge=dodge+
  (mounted?Math.ceil(dodgeBase*mountedRate)-dodgeBase:0)+quickStep+
  (supportSkills.windAssist?Math.floor(
  supportSkillValues.windAssist.EP_AVOIDANCE_CONST+
  dodgeBase*supportSkillValues.windAssist.EP_AVOIDANCE_SCALE/100):0)+
  (otherBuffs.quickStep?.dodge||0)+(otherBuffs.avoidance?.dodge||0)+priestMinstrel;
 // Distinct from OS web-calculator combat damage: the observed client
 // character sheet floors both the PEN/mastery percentage and the final gap.
 // Leave the minimum unavailable if the weapon or actual green is unknown.
 const clientRange=characterSheetPhysicalAttackRange({
  maximum:effectiveAttack?.known??null,weapon,branchMasteries});
 const attackWithRange=effectiveAttack?
  {...effectiveAttack,minimum:clientRange?.minimum??null,
   minimumVerified:clientRange!==null,
   minimumSpreadPercent:clientRange?.rate??null}:null;
 const frontAccuracy={known:accuracyKnown,positionalBonus:0,verified:false,
  source:"Remaked Calc('ACC'), Status_62 / Status_63",
  excluded:['unmapped front-only item and skill effects']};
 // Remaked Calc('EVARange') has an explicit +3 from Honor 12.
 // Keep separate from Dodge and Myrine overall avoidance scaling.
 const rangedEvasion={known:title.rangedDodge||0,honor:title.rangedDodge||0,
  verified:false,source:"Remaked Calc('EVARange'), Status_67",
  excluded:['unmapped equipment and status-based ranged evasion']};
 // Remaked Calc('CastSPD') displays the 100% cast-time index unless
 // Flag 14_8 is active. That spell is not presently modeled by an
 // independently verified OS buff, so this is a Legacy baseline only.
 const castTime={known:100,base:100,verified:false,
  source:"Remaked Calc('CastSPD'), Status_78",
  excluded:['legacy Flag 14_8 and current game active cast-time changes']};
 // Exact TARGET passive effects from OS skills.json:
 // Enkidu 900050003: EP_ONHIT_CRITICAL_DAMAGERATE fv1[3]=10.
 // Dwarf 900030003: EP_CRITICAL_REGIST fv1[3]=5 (incoming crit chance).
 // Rapin 900060003: EP_CRITICAL_REGIST fv2[3]=10 (incoming crit damage).
 // These are mutually exclusive racial selections, not always-on race traits.
 const criticalDamage=100+(racialPassiveId===900050003?10:0);
 const criticalIncoming=(title.incomingCriticalChance||0)-
  (Number(bonuses.incomingCriticalReduction)||0)-
  (racialPassiveId===900030003?5:0);
 const criticalIncomingDamage=100+(title.incomingCriticalDamage||0)-
  (racialPassiveId===900060003?10:0);
 return {attack:attackWithRange,magicAttack,defense:effectiveDefense,activeSkills:actives,
  racialWeapon,incredibleStrength,
  priestSong:{minstrel:priestMinstrel,
   sageElementDamage:Number(priestEffects?.sageElementDamage)||0,
   verified:false,source:'Remaked SPR/Hymn scaling + current OS skill function'},
  activeSkillValues:activeValues,secondary,supportSkills,supportSkillValues,
  guildArouse,guildAtk,attackSpeed,castingSpeed,castTime,manaCost,
  frontAccuracy,rangedEvasion,
  weaponPhysical,backAttack,frontAttack,cooldown,
  mounted:{enabled:mounted,rate:mountedStatus?.known??null,verified:false,
   source:'Remaked Legacy Calc: Flag[7]'},
  spellDamageEquipmentRate,castInterruption,movementSpeed,skillDelayEquipment,
  skillDelayFinalEquipment,mpRecoveryEquipmentRate,backAttackEquipmentRate,
  criticalDamage,criticalIncoming,criticalIncomingDamage,otherBuffs,
  accuracy:{base:accuracyBase,equipment:accEquip,passive:hunterEye,
   percentage:accuracyPercent,honor:title.accuracy||0,
   activeBonus:actives.concentration?effect('concentration','EP_TOHIT_CONST'):0,
   thirdEye:otherBuffs.thirdEye?Math.floor(otherBuffs.thirdEye.flat+
    accuracyBase*otherBuffs.thirdEye.percent/100):0,
   minstrel:priestMinstrel,known:accuracyKnown},
  dodge:{base:dodgeBase,agilityStep:dodgeStep,equipment:evEquip,
   passive:quickStep,honor:title.dodge||0,
   windAssist:supportSkills.windAssist?Math.floor(
    supportSkillValues.windAssist.EP_AVOIDANCE_CONST+
    dodgeBase*supportSkillValues.windAssist.EP_AVOIDANCE_SCALE/100):0,
   additionalSelf:(otherBuffs.quickStep?.dodge||0)+(otherBuffs.avoidance?.dodge||0),
   minstrel:priestMinstrel,known:observedDodge},
  critical:{base:critBase,equipment:critEquip,
   racial:racialPassiveId===900040001?5:0,
   coldBlood:otherBuffs.coldBlood?.critical||0,known:critical},
  racialRate,verified:false,
  excluded:['active combat skills','class offensive passives','other conditional Souls and sets',
   'mounted penalties','current OS percent-bonus rounding']};
}
// Remaked Skill[0][14][9] = Ободрение / Battle Prayer, NOT a potion.
function encouragementBonus(options={},context={}){
 const priest=context.externalPriest,skill=context.skillCatalog?.['320012001'];
 if(options.priestEnabled!==true||options.priestEncouragement!==true||
  priest?.enabled!==true||![priest.spi,priest.blessing,priest.hymn].every(n=>
   Number.isSafeInteger(n)&&n>=0&&n<=500)||priest.blessing<61||
  skill?.id!==320012001||skill.name!=='Ободрение'||
  skill.skillType!=='ALLY'||skill.learnable!==true||
  !Array.isArray(skill.reqs)||skill.reqs.length!==1||
  skill.reqs[0].branch!=='blessing'||skill.reqs[0].amount!==61||
  !Array.isArray(skill.funcs)||skill.funcs.length!==3)return 0;
 const expected=['EP_STRENGTH_CONST','EP_AGILITY_CONST','EP_INTELIGENCE_CONST'];
 if(!expected.every(ep=>skill.funcs.some(f=>f.ep===ep&&f.dir==='TARGET'&&
  JSON.stringify(f.fv1)==='[0,0,10,0]')))return 0;
 // The historical Remaked formula uses priest Blessing, not the hero's stat.
 return Math.floor(priest.blessing/10);
}
function attributeBuffBonus(options={},context={}){
 const out=Object.fromEntries(keys.map(k=>[k,0])),trace=[];
 const selected=selectedHonor(options);
 if(!selected)return null;
 const guild=Number(options.guildAll??0);
 if(!Number.isInteger(guild)||guild<0||guild>6)return null;
 if(guild){
  for(const key of keys)out[key]+=guild;
  trace.push({source:'Remaked SelBuffClan_9',amount:guild,keys:keys.slice()});
 }
 const encouragement=encouragementBonus(options,context);
 if(encouragement){
  for(const key of ['str','agi','int'])out[key]+=encouragement;
  trace.push({source:'Ободрение / Remaked Skill[0][14][9]',
   amount:encouragement,keys:['str','agi','int']});
 }
 if(selected.id===1){
  for(const key of keys)out[key]++;
  trace.push({source:'Remaked Honor=1',amount:1,keys:keys.slice()});
 }
 return {flat:out,trace,honor:selected};
}



// Creature damage reductions are source-backed, not a license to apply an
// arbitrary same-shaped effect or equate today's OS families with Remaked.
const osTargetFamilies=Object.freeze({
 502:{key:'animal',name:'животных',nameEn:'animals'},
 504:{key:'devil',name:'демонов',nameEn:'demons'},
 505:{key:'immortal',name:'нежити',nameEn:'undead'},
 508:{key:'reptilian',name:'ящеров',nameEn:'reptiles'},
 511:{key:'ghost',name:'призраков',nameEn:'ghosts'},
 // Source EN explicitly says "Unliving"; its equivalence to old
 // Remaked RESInanimate is NOT proven by the numeric OS family ID.
 512:{key:'golem',name:'големов',nameEn:'unliving creatures'}
});
const osCreatureSoulProof=Object.freeze({
 103029:{raceId:502,ru:'Урон, наносимый животными, -3%.',
  en:'Damage Reduction against Animals +3%'},
 103030:{raceId:504,ru:'Урон, наносимый демонами, -3%.',
  en:'Damage Reduction against Demons +3%'},
 103031:{raceId:505,ru:'Урон, наносимый нежитью, -3%.',
  en:'Damage Reduction against Undead +3%'},
 103032:{raceId:508,ru:'Урон, наносимый ящерами, -3%.',
  en:'Damage Reduction against Reptiles +3%'},
 103033:{raceId:511,ru:'Урон, наносимый призраками, -3%.',
  en:'Damage Reduction against Ghosts +3%'},
 103034:{raceId:512,ru:'Урон, наносимый големами, -3%.',
  en:'Damage Reduction against Unliving +3%'}
});
function targetResistancePreview({records=[],itemForth=null}={}){
 const entries=[];
 if(!Array.isArray(records))return {entries,verified:false};
 for(const row of records){
  if(!Array.isArray(row)||row.length<3)continue;
  const [source,record,grade]=row;
  const proof=osCreatureSoulProof[record?.id];
  if(!proof||!Number.isInteger(record.id)||
   source!=='soul:'+record.id||
   !Number.isInteger(grade)||grade<0||grade>10||
   !Array.isArray(record.slots)||!record.slots.includes('body')||
   ![proof.ru,proof.en].includes(String(record.desc||'').trim()))continue;
  // All six original sources have one grade-bound SELF effect. Fail
  // closed on a forged extra event, swapped family, direction or range.
  const effects=sourceEffects(source,record,grade,itemForth);
  if(effects.length!==1)continue;
  const effect=effects[0];
  if(effect.func!=='EP_ONDAMAGE_FDS_RACE'||
   effect.dir!=='SELF'||effect.b!==proof.raceId||
   effect.a!==-3||effect.min!==0||effect.max!==10)continue;
  const family=osTargetFamilies[proof.raceId];
  entries.push({key:family.key,name:family.name,nameEn:family.nameEn,
   raceId:proof.raceId,change:-3,source:String(record.name||source)});
 }
 // No aggregation: duplicate Soul stacking and OS damage packets are unverified.
 return {entries,verified:false,source:'current game server EP_ONDAMAGE_FDS_RACE'};
}

// Nine official OS cloak records activate a separate passive only on battle
// maps. This is intentionally an informational situational preview: the normal
// HP, attribute, armor and resistance totals remain map-neutral.
const battleMapCloakSkills=Object.freeze({
 18022:500000044,18023:500000045,18024:500000046,
 18025:500000044,18026:500000045,18027:500000046,
 18028:500000044,18029:500000045,18030:500000046
});
const battleMapCloakTiers=Object.freeze({
 500000044:Object.freeze({all:2,armor:1,hp:300,resistance:0,magic:0}),
 500000045:Object.freeze({all:3,armor:3,hp:1000,resistance:0,magic:0}),
 500000046:Object.freeze({all:5,armor:5,hp:2000,resistance:5,magic:10})
});
function battleMapCloakPreview({records=[],skills=null,itemForth=null}={}){
 const entries=[];
 if(!Array.isArray(records)||!skills||typeof skills!=='object')
  return {entries,verified:false};
 for(const [source,record,grade] of records){
  if(!record||!Number.isInteger(record.id)||
   !Object.hasOwn(battleMapCloakSkills,record.id)||
   source!=='item:'+record.id||record.slot!=='cloak'||
   !Number.isInteger(grade)||grade<0||grade>10)continue;
  const skillId=battleMapCloakSkills[record.id],expected=battleMapCloakTiers[skillId];
  const mapProcs=sourceEffects(source,record,grade,itemForth).filter(effect=>
   effect?.func==='EP_SKILL_EXEC_MAPIN'&&
   (!Number.isFinite(effect.min)||grade>=effect.min)&&
   (!Number.isFinite(effect.max)||grade<=effect.max));
  if(mapProcs.length!==1||mapProcs[0].a!==skillId||
   mapProcs[0].b!==7||mapProcs[0].dir!=='TARGET')continue;
  // Never infer map support from effect ID alone; both original locales
  // explicitly say these cloak bonuses are battle-map-only.
  const desc=String(record.desc||'');
  const isRu=desc.includes('Действует только на военных картах.')&&
   desc.includes('Защита +'+expected.armor+', ОЗ +'+expected.hp+
    ', все характеристики +'+expected.all+'.');
  const isEn=desc.includes('Effective only on battle maps.')&&
   desc.includes('Defense +'+expected.armor+', HP +'+expected.hp+
    ', all stats +'+expected.all+'.');
  if(!isRu&&!isEn)continue;
  if(expected.resistance&&!(isRu?
   desc.includes('Сопротивляемость всем видам урона +'+expected.resistance+
    ', магии +'+expected.magic+'.'):
   desc.includes('Resistance to all damage types +'+expected.resistance+
    ', Magic +'+expected.magic+'.')))continue;
  const skill=skills[String(skillId)];
  if(!skill||Number(skill.id)!==skillId||!Array.isArray(skill.funcs))continue;
  const effects={
   EP_ABILITY_ALL_CONST:expected.all,
   EP_ARMORCLASS_CONST:expected.armor,
   EP_MAXLIFE_CONST:expected.hp,
   EP_LOST_MAPCHANGE:0,
   ...(expected.resistance?{
    EP_ALL_RESISTANCE_CONST:expected.resistance,
    EP_MAGIC_RESISTANCE_CONST:expected.magic}: {})
  };
  if(skill.funcs.length!==Object.keys(effects).length||
   Object.entries(effects).some(([ep,value])=>{
    const found=skill.funcs.filter(row=>row.ep===ep&&row.dir==='TARGET');
    return found.length!==1||found[0].fv1?.[3]!==value;
   }))continue;
  entries.push({source:String(record.name||source),itemId:record.id,skillId,
   all:expected.all,armor:expected.armor,hp:expected.hp,
   resistance:expected.resistance,magic:expected.magic,
   verified:false});
 }
 return {entries,verified:false,condition:'battle maps only',
  source:'current game server EP_SKILL_EXEC_MAPIN and catalog skill effects'};
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
const procTriggersEn=Object.freeze({
 EP_ONHIT_SKILL_EXEC:'On hit',
 EP_ONHIT_STUN:'On physical attack',
 EP_ONHIT_SKILL_EXEC_ATTACKER:'On hit',
 EP_ONDAMAGE_SKILL_EXEC:'On taking damage',
 EP_ONDAMAGE_SKILL_EXEC_ATTACKER:'On taking damage',
 EP_ONDAMAGE_ELEM_SKILL_EXEC:'On taking elemental damage'
});
// Identity must include the catalog source AND every relevant proc field.
// Names are localized/display-only and cannot safely identify distinct items.
const procIdentity=(source,effect)=>JSON.stringify([
 String(source),effect.func,effect.a,effect.b,effect.dir??null
]);
function conditionalProcPreview({records=[],itemForth=null,skills=null}={}){
 if(!Array.isArray(records))return null;
 const entries=[];
 for(const [source,record,grade] of records){
  if(!record||!Number.isInteger(grade)||grade<0||grade>10)continue;
  for(const effect of sourceEffects(source,record,grade,itemForth)){
   const trigger=procTriggers[effect?.func];
   if(!trigger||!Number.isInteger(effect.a)||!Number.isFinite(effect.b))continue;
   if((Number.isFinite(effect.min)&&grade<effect.min)||
      (Number.isFinite(effect.max)&&grade>effect.max))continue;
   const isStun=effect.func==='EP_ONHIT_STUN';
   const skill=isStun?null:skills?.[String(effect.a)];
   const recordDescription=String(record.desc||'');
   // RU/EN source descriptions both describe rates. If two distinct rates
   // appear on one item, never assume which event each percentage belongs to.
   const textRates=[...recordDescription.matchAll(/(\d+(?:[.,]\d+)?)\s*%\s*(?:шанс|вероятност|chance|probabilit)/gi)]
    .map(match=>Number(match[1].replace(',','.')));
   const distinctRates=[...new Set(textRates)];
   const namedChance=distinctRates.length===1?distinctRates[0]:null;
   const sourceChance=effect.b>=0&&effect.b<=100?effect.b:null;
   // The EN catalog sometimes concatenates an adjacent attribute and proc
   // percentage (e.g. "INT +24% Chance" means INT +2 and a 4% chance).
   // Exact source/skill/action corroboration takes precedence over the loose
   // prose number heuristic. Uncorroborated mismatches remain disputed.
   const corroborated=matchesCorroboratedProc(source,record,effect);
   const mismatch=!corroborated&&namedChance!==null&&sourceChance!==null&&
    namedChance!==sourceChance;
   entries.push({trigger,triggerEn:procTriggersEn[effect.func],skillId:isStun?null:effect.a,
    skillName:isStun?'Оглушение':String(skill?.name||'Особый эффект'),
    skillNameEn:isStun?'Stun':String(skill?.name||'Special effect'),
    chance:corroborated?sourceChance:null,source:String(record.name||source),
    disputedChance:mismatch,code:effect.func,
    procIdentity:procIdentity(source,effect)});
  }
 }
 return {entries,verified:false};
}

// Current OS equipment-sourced earned-experience preview, not a combat stat.
function experienceBonusPreview({records=[],itemForth=null}={}){
 if(!Array.isArray(records))return null;
 const entries=[];
 for(const [source,record,grade] of records){
  if(!record||!Number.isInteger(grade)||grade<0||grade>10)continue;
  for(const effect of sourceEffects(source,record,grade,itemForth)){
   if(effect?.func!=='EP_VOLUME_EXP'||!Number.isFinite(effect.a))continue;
   if((Number.isFinite(effect.min)&&grade<effect.min)||
      (Number.isFinite(effect.max)&&grade>effect.max))continue;
   entries.push({source:String(record.name||source),percent:effect.a});
  }
 }
 return {entries,verified:false};
}

// Only selected, source-identical OS racial passives. The live skill catalog
// is required: if an effect changes, do not silently keep a stale constant.
// An EP_RACE_CARRY pair is metadata, never an extra range bonus. Conditional
// survivability is a skill-source preview, never guaranteed HP or block.
function racialUtilityPreview({racialPassiveId=null,skillCatalog=null}={}){
 if(!skillCatalog||typeof skillCatalog!=='object')return null;
 const rule=racialPassiveId===900020002?
  {id:900020002,eps:['EP_RACE_RANGE','EP_RACE_CARRY']}:racialPassiveId===900030001?
  {id:900030001,eps:['EP_RACE_TOUGH_HEART']}:null;
 if(!rule)return null;
 const skill=skillCatalog[String(rule.id)];
 if(skill?.id!==rule.id||skill.skillType!=='PASSIVE'||
  !Array.isArray(skill.funcs))return null;
 const values={};
 for(const ep of rule.eps){
  const matches=skill.funcs.filter(f=>f.ep===ep&&f.dir==='TARGET');
  if(matches.length!==1||!Array.isArray(matches[0].fv1)||
   matches[0].fv1.length<4||!Number.isFinite(matches[0].fv1[3])||
   matches[0].fv1[3]<0)return null;
  values[ep]=matches[0].fv1[3];
 }
 if(rule.id===900020002){
  // Both fields are separately emitted by OS. They describe the same
  // selected passive, not two independent additions to shooting distance.
  if(values.EP_RACE_RANGE!==values.EP_RACE_CARRY)return null;
  return {id:rule.id,range:{general:values.EP_RACE_RANGE,
   carry:values.EP_RACE_CARRY},survival:null,verified:false};
 }
 return {id:rule.id,range:null,
  survival:{chance:values.EP_RACE_TOUGH_HEART,
   trigger:'conditional survival',verified:false},verified:false};
}

// Two class-specific OS skill effects affect shooting distance only while
// their own action is in force. The source vector is a modeled bonus, never
// the permanent weapon reach or a proven final skill-specific distance.
const skillRangeProofs=Object.freeze([
 {id:213605001,job:'SNIPER',level:45,type:'TOGGLE',
  weapons:['BOW','CROSSBOW'],effects:[
   ['EP_DAMAGERATE_SCALE',[0,0,30,20],[0,0,0,0]],
   ['EP_TOHIT_CONST',[0,0,30,20],[0,0,0,0]],
   ['EP_ATTACKRANGE_CONST',[0,0,300,200],[0,0,0,0]],
   ['EP_ATTACKCARRY_CONST',[0,0,300,200],[0,0,0,0]],
   ['EP_UNABLE_MOVE',[0,0,0,0],[0,0,0,0]],
   ['EP_TOGGLE',[0,0,0,3],[0,0,-1,2]]
  ]},
 {id:213703001,job:'PREDATOR',level:50,type:'MYSELF',
  weapons:['CROSSBOW'],effects:[
   ['EP_DOUBLE_MISSILE',[20,0,30,-85],[0,0,0,0]],
   ['EP_ATTACKRANGE_CONST',[0,0,900,100],[0,0,0,0]],
   ['EP_ATTACKCARRY_CONST',[0,0,900,100],[0,0,0,0]]
  ]}
]);
function skillAttackRangePreview({skillCatalog=null,jobKey=null,level=1,
 branchMasteries={},branchCaps={},weapon=null}={}){
 const output={rows:[],rejected:[],verified:false,
  appliedToPermanentRange:false};
 if(!skillCatalog||typeof jobKey!=='string'||
  !Number.isSafeInteger(level)||level<1||level>55)return output;
 const mastery=branchMasteries?.archery;
 const cap=branchCaps?.archery;
 for(const proof of skillRangeProofs){
  if(proof.job!==jobKey)continue;
  const s=skillCatalog[String(proof.id)];
  const sourceValid=s?.id===proof.id&&s.learnable===true&&
   s.prereq===null&&s.charLevel===proof.level&&
   s.isLevelBased===true&&s.skillType===proof.type&&
   s.branch==='archery'&&s.classes?.[jobKey]===1&&
   Object.keys(s.classes||{}).length===1&&
   Array.isArray(s.reqs)&&s.reqs.length===0&&
   Array.isArray(s.weaponUse)&&
   s.weaponUse.length===proof.weapons.length&&
   s.weaponUse.every((kind,i)=>kind===proof.weapons[i])&&
   Array.isArray(s.funcs)&&s.funcs.length===proof.effects.length&&
   proof.effects.every(([ep,fv1,fv2],i)=>{
    const f=s.funcs[i];
    return f?.ep===ep&&f.dir==='TARGET'&&
     Array.isArray(f.fv1)&&f.fv1.length===4&&
     f.fv1.every((n,j)=>n===fv1[j])&&
     Array.isArray(f.fv2)&&f.fv2.length===4&&
     f.fv2.every((n,j)=>n===fv2[j]);
   });
  if(!sourceValid){output.rejected.push(proof.id);continue}
  const range=s.funcs.find(f=>f.ep==='EP_ATTACKRANGE_CONST');
  const paired=s.funcs.find(f=>f.ep==='EP_ATTACKCARRY_CONST');
  // Carry is a mirror of range, never a second additive value.
  if(!range||!paired||range.fv1.some((n,i)=>n!==paired.fv1[i])||
   range.fv2.some((n,i)=>n!==paired.fv2[i])){
   output.rejected.push(proof.id);continue;
  }
  const legal=Number.isSafeInteger(mastery)&&mastery>=0&&
   Number.isSafeInteger(cap)&&cap>0&&mastery<=cap;
  const fromMastery=legal?Math.floor(mastery*range.fv1[2]/100):null;
  const magnitude=fromMastery===null?null:range.fv1[3]+fromMastery;
  const reasonsRu=[],reasonsEn=[];
  if(level<proof.level){reasonsRu.push('Нужен уровень '+proof.level);
   reasonsEn.push('Requires level '+proof.level)}
  if(!legal){reasonsRu.push('Нужно допустимое мастерство стрельбы');
   reasonsEn.push('Requires valid Ranged mastery')}
  if(weapon?.slot!=='weapon'||!proof.weapons.includes(weapon?.kind)){
   reasonsRu.push(proof.weapons.length===1?'Нужен арбалет':'Нужен лук или арбалет');
   reasonsEn.push(proof.weapons.length===1?'Requires a crossbow':'Requires a bow or crossbow');
  }
  output.rows.push({id:proof.id,name:s.name,
   sourceBonus:magnitude,sourceConstant:range.fv1[3],
   sourceMasteryPart:fromMastery,mode:proof.type==='TOGGLE'?'toggle':'use',
   available:reasonsRu.length===0,
   reasonRu:reasonsRu.join(' · '),reasonEn:reasonsEn.join(' · '),
   sourceOnly:true,finalSkillRange:null,
   appliedToPermanentRange:false});
 }
 return output;
}
// These two OS effects are explicit additions to attack/bow range, not
// complete weapon range formulas. Their paired *_CARRY effects are separate
// server fields and must not silently double the displayed distance bonus.
const rangeEffectKeys=Object.freeze({EP_RACE_RANGE:'general',EP_BOW_RANGE:'bow'});
function attackRangePreview({records=[],itemForth=null,weapon=null,racialEffects=null}={}){
 if(!Array.isArray(records))return null;
 const totals={general:0,bow:0},entries=[];
 for(const [source,record,grade] of records){
  if(!record||!Number.isInteger(grade)||grade<0||grade>10)continue;
  for(const effect of sourceEffects(source,record,grade,itemForth)){
   const key=rangeEffectKeys[effect?.func];
   if(!key||!Number.isFinite(effect.a)||
    (Number.isFinite(effect.min)&&grade<effect.min)||
    (Number.isFinite(effect.max)&&grade>effect.max))continue;
   totals[key]+=effect.a;
   entries.push({source:String(record.name||source),kind:key,amount:effect.a});
  }
 }
 // Combine the OS weapon base with direct flat modifiers for a useful
 // build-planning total. The full live combat-engine stacking is unverified.
 // Mirrored *_CARRY fields are never an additional distance bonus.
 const kind=weapon?.kind;
 const ranged=kind==='BOW'||kind==='CROSSBOW';
 const validWeapon=weapon?.slot==='weapon'&&
  Number.isFinite(weapon.range)&&weapon.range>0;
 const racialGeneral=racialEffects?.range?.general??0;
 const racialCarry=racialEffects?.range?.carry??0;
 // Elf Eagle Eye explicitly applies only to bows and crossbows.
 const racialRanged=validWeapon&&ranged&&racialEffects?.id===900020002&&
  Number.isFinite(racialGeneral)&&racialGeneral===racialCarry?
  racialGeneral:0;
 const baseMelee=validWeapon&&!ranged?weapon.range:null;
 const baseRanged=validWeapon&&ranged?weapon.range:null;
 const totalMelee=baseMelee===null?null:baseMelee+totals.general;
 const totalRanged=baseRanged===null?null:
  baseRanged+totals.general+totals.bow+racialRanged;
 return {...totals,entries,racialGeneral,racialCarry,racialRanged,
  baseMelee,baseRanged,totalMelee,totalRanged,
  equipmentMelee:totals.general,equipmentRanged:totals.general+totals.bow,
  baseOnly:validWeapon,verified:false};
}

// Source-backed conditional properties; no chance, tick rate or damage packet is inferred.
// The scanner receives ONLY currently eligible equipped items and Souls from base().
const specialEquipmentRules=Object.freeze({
 EP_ALL_CRITICAL:Object.freeze({
  ru:'Получаемые физические атаки — критические удары',
  en:'Incoming physical attacks are critical hits'
 }),
 EP_RACE_TOUGH_HEART:Object.freeze({
  ru:'«Упрямое сердце»: условное срабатывание',
  en:'Stronghearted: conditional trigger'
 }),
 EP_HEAL_LIFE_REGENERATOR:Object.freeze({
  ru:'Постепенное уменьшение ОЗ от предмета',
  en:'Gradual HP loss caused by equipment'
 }),
 // Verified exact current OS item 11552; a conditional evasion chance,
 // never an additive bonus to the regular Dodge stat.
 EP_DESTINE_WARDING:Object.freeze({
  ru:'Шанс уклониться от физической атаки +3%',
  en:'Physical attack evasion chance +3%'
 })
});
// Only effects whose chance and action are explicitly corroborated by BOTH
// the official OS item/Soul description and its structured chance field.
// Do not generalize this list to unverified EP_ONHIT records: for example,
// Vampire Soul's description says 4%, while its source chance is 5%.
const confirmedOnHitRules=Object.freeze({
 'item:422':Object.freeze({id:422,func:'EP_ONHIT_SKILL_EXEC',a:500000015,b:9,dir:'TARGET',
  sourcePhrase:'При атаке есть 9% шанс сбить противника с ног',sourcePhraseEn:'Attacks have a 9% chance to knock the enemy off their feet',
  ru:'При атаке: 9% шанс сбить противника с ног',
  en:'On attack: 9% chance to knock down the target'}),
 'item:1041':Object.freeze({id:1041,func:'EP_ONHIT_SKILL_EXEC',a:500000002,b:9,dir:'TARGET',
  sourcePhrase:'При атаке есть 9% шанс оглушить противника',sourcePhraseEn:'On attack, it has a 9% chance to stun the foe',
  ru:'При атаке: 9% шанс оглушить противника',
  en:'On attack: 9% chance to stun the target'}),
 'item:1211':Object.freeze({id:1211,func:'EP_ONHIT_SKILL_EXEC',a:500000015,b:4,dir:'TARGET',
  sourcePhrase:'При физической атаке 4% шанс Уронить врага',sourcePhraseEn:'4% Chance to Knock Down on Physical Attack',
  ru:'При физической атаке: 4% шанс уронить врага',
  en:'On physical attack: 4% chance to knock down the target'}),
 'item:2802':Object.freeze({id:2802,func:'EP_ONHIT_STUN',a:3,b:4,dir:'TARGET',
  sourcePhrase:'При физической атаке 4% шанс Оглушить врага',sourcePhraseEn:'4% Chance to Stun on Physical Attack',
  ru:'При физической атаке: 4% шанс оглушить врага',
  en:'On physical attack: 4% chance to stun the target'}),
 'soul:101010':Object.freeze({id:101010,func:'EP_ONHIT_SKILL_EXEC',a:500000002,b:4,dir:'SELF',
  sourcePhrase:'4% вероятность оглушить цель при атаке',sourcePhraseEn:'4% chance to inflict Stun with a successful attack',
  ru:'При атаке: 4% шанс оглушить цель',
  en:'On attack: 4% chance to stun the target'}),
 'soul:101011':Object.freeze({id:101011,func:'EP_ONHIT_SKILL_EXEC',a:500000003,b:4,dir:'SELF',
  sourcePhrase:'4% вероятность ослабить цель при атаке',sourcePhraseEn:'4% chance to inflict Weaken with a successful attack',
  ru:'При атаке: 4% шанс ослабить цель',
  en:'On attack: 4% chance to weaken the target'}),
 'soul:101012':Object.freeze({id:101012,func:'EP_ONHIT_SKILL_EXEC',a:500000001,b:4,dir:'SELF',
  sourcePhrase:'4% вероятность усыпить цель при атаке',sourcePhraseEn:'4% chance to inflict Sleep with a successful attack',
  ru:'При атаке: 4% шанс усыпить цель',
  en:'On attack: 4% chance to put the target to sleep'}),
 'soul:101021':Object.freeze({id:101021,func:'EP_ONHIT_SKILL_EXEC',a:500000004,b:4,dir:'SELF',
  sourcePhrase:'4% вероятность отравить цель при атаке',sourcePhraseEn:'4% chance to inflict Poison with a successful attack',
  ru:'При атаке: 4% шанс отравить цель',
  en:'On attack: 4% chance to poison the target'}),
 'soul:101022':Object.freeze({id:101022,func:'EP_ONHIT_SKILL_EXEC',a:500000000,b:5,dir:'SELF',
  sourcePhrase:'5% вероятность замедлить цель при атаке',sourcePhraseEn:'5% chance to reduce target\'s Movement Speed with a successful attack',
  ru:'При атаке: 5% шанс замедлить цель',
  en:'On attack: 5% chance to slow the target'})
});
// Current OS text explicitly names the physical-damage trigger and 8% Gust chance.
// Keep this separate from on-hit effects; never claim a server-verified proc roll.
const corroboratedProcRules=Object.freeze({
 ...confirmedOnHitRules,
 'item:15082':Object.freeze({id:15082,func:'EP_ONDAMAGE_SKILL_EXEC',
  a:260003001,b:8,dir:'TARGET',
  sourcePhrase:'При получении физического урона есть 8% вероятность получения эффекта порыва',
  sourcePhraseEn:"When taking physical damage, there's an 8% chance of gaining a Surge effect.",
  ru:'При получении физического урона: 8% шанс получить «Порыв»',
  en:'On taking physical damage: 8% chance to trigger Dash'})
});
// Fully anchored OS-only descriptions. A matching EP code on another item is
// not evidence that its gameplay effect or trigger is identical.
const corroboratedSpecialRules=Object.freeze({
 'soul:103013':Object.freeze({id:103013,func:'EP_ALL_CRITICAL',a:0,b:0,dir:'SELF',
  sourcePhrase:'Все получаемые атаки будут критическими ударами',
  sourcePhraseEn:'All enemy physical attacks become critical hits'}),
 'soul:103019':Object.freeze({id:103019,func:'EP_RACE_TOUGH_HEART',a:5,b:0,dir:'SELF',
  sourcePhrase:"Вероятность срабатывания умения 'Упрямое сердце' при 5% ОЗ",
  sourcePhraseEn:'5% chance to activate Stronghearted when LP reaches 0'}),
 'item:2841':Object.freeze({id:2841,func:'EP_HEAL_LIFE_REGENERATOR',a:-20,b:5,dir:'TARGET',
  sourcePhrase:'Постепенное уменьшение ОЗ',sourcePhraseEn:'Gradual HP loss'}),
 'item:11552':Object.freeze({id:11552,func:'EP_DESTINE_WARDING',a:3,b:null,dir:'TARGET',
  sourcePhrase:'Шанс уклониться от физической атаки +3%',
  sourcePhraseEn:'Physical Attack Evasion Chance +3%'})
});
const matchesOriginalDescription=(record,rule)=>typeof record?.desc==='string'&&
 (record.desc.includes(rule.sourcePhrase)||
  (rule.sourcePhraseEn&&record.desc.includes(rule.sourcePhraseEn)));
function matchesCorroboratedProc(source,record,effect){
 const rule=Object.hasOwn(corroboratedProcRules,String(source))?
  corroboratedProcRules[String(source)]:null;
 return Boolean(rule&&Number(record?.id)===rule.id&&
  effect?.func===rule.func&&effect.a===rule.a&&effect.b===rule.b&&
  effect.dir===rule.dir&&matchesOriginalDescription(record,rule));
}
function specialEquipmentPreview({records=[],itemForth=null}={}){
 if(!Array.isArray(records))return null;
 const entries=[];
 for(const [source,record,grade] of records){
  if(!record||!Number.isInteger(grade)||grade<0||grade>10)continue;
  for(const effect of sourceEffects(source,record,grade,itemForth)){
   if(!effect)continue;
   if((Number.isFinite(effect.min)&&grade<effect.min)||
      (Number.isFinite(effect.max)&&grade>effect.max))continue;
   const proc=Object.hasOwn(corroboratedProcRules,String(source))?
    corroboratedProcRules[String(source)]:null;
   if(proc&&matchesCorroboratedProc(source,record,effect)){
    entries.push({code:effect.func,source:String(record.name||source),
     ru:proc.ru,en:proc.en,verified:false,
     procIdentity:procIdentity(source,effect)});
    continue;
   }
   const precise=Object.hasOwn(corroboratedSpecialRules,String(source))?
    corroboratedSpecialRules[String(source)]:null;
   if(!precise||record.id!==precise.id||
      effect.func!==precise.func||effect.a!==precise.a||
      effect.b!==precise.b||effect.dir!==precise.dir||
      !matchesOriginalDescription(record,precise))continue;
   const labels=specialEquipmentRules[effect.func];
   entries.push({code:effect.func,source:String(record.name||source),
    ru:labels.ru,en:labels.en,
    // No arbitrary chance, frequency or damage value is presented.
    verified:false});
  }
 }
 return {entries,verified:false,source:'current game server item/Soul descriptions'};
}

// The hero book already shows a precise verified-description preview for these
// procs. Avoid repeating the same event as a separate generic proc summary.
function deduplicateProcDescriptions(generic,precise){
 if(!generic?.entries?.length||!precise?.entries?.length)return generic;
 const described=new Map();
 for(const entry of precise.entries){
  if(typeof entry.procIdentity!=='string')continue;
  described.set(entry.procIdentity,(described.get(entry.procIdentity)||0)+1);
 }
 return {...generic,entries:generic.entries.filter(entry=>{
  const remaining=described.get(entry.procIdentity)||0;
  if(!remaining)return true;
  described.set(entry.procIdentity,remaining-1);
  return false;
 })};
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
 'EP_ATTACK_BACKATK_RATE','EP_ELEMENT_DAMAGE_SCALE',
 'EP_ELEMENT_DAMAGE_SCALE_FIRE','EP_ONDAMAGE_FDS_RACE','EP_VOLUME_EXP',
 'EP_CASTINGCANCEL_RESISTANCE_CONST','EP_HEAL_TIME_SCALE',
 'EP_RACE_RANGE','EP_BOW_RANGE',
 'EP_ALL_CRITICAL','EP_RACE_TOUGH_HEART','EP_HEAL_LIFE_REGENERATOR'
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
  verified:false,source:'Current game server structured equipment/Soul/Forth effects'};
}
// Executed Remaked Legacy Calc('FirstAid'/'Heal'/'HealingAura'/
// 'Sanctuary'/'Restoration') from js/calc.js Flag[5].
// Spell unlocks are informative gates. Exact current OS server damage/heal
// packets remain unverified; show unavailable spells as theoretical previews.
// Remaked computes magnitudes; the OS skill catalogue decides whether the
// corresponding spell is available to this character. Keep these independent.
const healingSourceSpecs=Object.freeze({
 firstAid:Object.freeze({standard:[310001001,'ALLY',0,8,null,[100,250,140,25]],
  cleric:[310001002,'ALLY',50,8,310001001,[300,250,280,25]],
  ep:'EP_HEAL_LIFE',nameEn:'First Aid'}),
 heal:Object.freeze({standard:[310004001,'ALLY',18,0,null,[600,200,300,50]],
  cleric:[310004002,'ALLY',50,0,310004001,[1000,300,500,50]],
  ep:'EP_HEAL_LIFE',nameEn:'Heal'}),
 healingAura:Object.freeze({standard:[310021001,'PARTY_ALL',0,54,null,[600,200,300,150]],
  cleric:[310021002,'PARTY_ALL',50,54,310021001,[850,200,400,150]],
  ep:'EP_HEAL_LIFE',nameEn:'Healing Aura'}),
 sanctuary:Object.freeze({standard:[310023001,'POINT',45,0,null,[0,0,0,310023002]],
  ep:'EP_SKILL_EXEC',nameEn:'Sanctuary'}),
 restoration:Object.freeze({standard:[310022001,'PARTY_ALL',0,41,null,[20,5,5,5]],
  ep:'EP_HEAL_LIFE_REGENERATOR',nameEn:'Restoration'})
});
function healingSourceGate({id,cleric,jobKey,level,benevolence,benevolenceCap,
 skillCatalog}){
 const spec=healingSourceSpecs[id];
 const [skillId,type,requiredLevel,requiredMastery,prereq,effectValues]=
  cleric&&spec?.cleric?spec.cleric:(spec?.standard||[]);
 const skill=skillCatalog?.[String(skillId)];
 if(!skill||Number(skill.id)!==skillId||skill.skillType!==type||
  !Number.isInteger(benevolenceCap)||benevolenceCap<0||
  !Number.isInteger(benevolence)||benevolence<0||
  benevolence>benevolenceCap||requiredMastery>benevolenceCap||
  benevolence<requiredMastery||!skill.classes?.[jobKey]||
  skill.learnable!==true||skill.charLevel!==requiredLevel||
  level<requiredLevel||skill.prereq!==prereq||
  !Array.isArray(skill.reqs)||skill.reqs.length!==(requiredMastery?1:0)||
  (requiredMastery&&(skill.reqs[0]?.branch!=='benevolence'||
   skill.reqs[0]?.amount!==requiredMastery))||
  !Array.isArray(skill.funcs)||skill.funcs.length!==1)return null;
 const effect=skill.funcs[0];
 const expectedFV2=id==='restoration'?[0,0,0,2]:[0,0,0,0];
 if(effect.ep!==spec.ep||effect.dir!=='TARGET'||
  !Array.isArray(effect.fv1)||effect.fv1.length!==4||
  effect.fv1.some((n,i)=>n!==effectValues[i])||
  !Array.isArray(effect.fv2)||effect.fv2.length!==4||
  effect.fv2.some((n,i)=>n!==expectedFV2[i]))return null;
 if(prereq!=null&&!skillCatalog?.[String(prereq)])return null;
 if(id==='sanctuary'){
  const linked=skillCatalog?.['310023002'];
  if(Number(linked?.id)!==310023002||!Array.isArray(linked.funcs)||
   linked.funcs.length!==1||linked.funcs[0].ep!=='EP_HEAL_LIFE'||
   linked.funcs[0].dir!=='TARGET'||
   JSON.stringify(linked.funcs[0].fv1)!=='[200,0,200,100]'||
   JSON.stringify(linked.funcs[0].fv2)!=='[0,0,0,0]')return null;
 }
 return skillId;
}
function healingSpellsPreview({level,int,spi,benevolence=0,healingPercent=100,
 jobKey=null,skillCatalog=null,benevolenceCap=null}={}){
 if(!Number.isInteger(level)||level<1||level>55||
  ![int,spi,benevolence,healingPercent].every(n=>Number.isFinite(n)&&n>=0))
  return null;
 const cleric=jobKey==='CLERIC'&&level>=50;
 // Remaked Healing-view stages, CURRENT OS coefficients [INT,level,mastery,
 // constant]. The archival enhanced Heal and Sanctuary level terms are stale.
 // Preserve raw fractions until the final skill-healing percentage floor.
 const fv=key=>{
  if(key==='sanctuary')return [200,0,200,100]; // OS triggered 310023002
  const spec=healingSourceSpecs[key];
  const option=cleric&&spec?.cleric?spec.cleric:spec?.standard;
  return option?.[5]??null;
 };
 const calc=key=>{
  const v=fv(key);
  if(!Array.isArray(v)||v.length!==4||!v.every(Number.isFinite))return null;
  const raw=v[3]+int*v[0]/100+level*v[1]/100+
   benevolence*v[2]/100;
  return Math.floor(raw*healingPercent/100);
 };
 // OS periodic FV1=[SPI%,level%,Healing%,flat]. Remaked's independent
 // component floors survive; FV2[3]=2 is NOT assigned an unknown tick time.
 const recoveryFV=healingSourceSpecs.restoration.standard[5];
 const restore=recoveryFV[3]+Math.floor(spi*recoveryFV[0]/100)+
  Math.floor(level*recoveryFV[1]/100)+
  Math.floor(benevolence*recoveryFV[2]/100);
 const rows=[
  {id:'firstAid',name:'Первая помощь',amount:calc('firstAid'),requires:'Мастерство исцеления 8',
   requiresEn:'Healing mastery 8',scaledBySkill:true},
  {id:'heal',name:'Лечение',amount:calc('heal'),requires:'Ветвь аколита, уровень 18',
   requiresEn:'Acolyte class, level 18',scaledBySkill:true},
  {id:'healingAura',name:'Массовое исцеление',amount:calc('healingAura'),
   requires:'Мастерство исцеления 54',requiresEn:'Healing mastery 54',scaledBySkill:true},
  {id:'sanctuary',name:'Храм',amount:calc('sanctuary'),
   requires:'Клирик, уровень 45',requiresEn:'Cleric class, level 45',scaledBySkill:true},
  {id:'restoration',name:'Восстановление',amount:restore,
   requires:'Мастерство исцеления 41',requiresEn:'Healing mastery 41',scaledBySkill:false}
 ];
 for(const row of rows){
  const skillId=healingSourceGate({id:row.id,cleric,jobKey,level,benevolence,
   benevolenceCap,skillCatalog});
  row.skillId=skillId;
  row.nameEn=healingSourceSpecs[row.id].nameEn;
  row.available=skillId!==null;
 }
 return {formulaSource:'Remaked Healing-view stages + current OS FV1; triggered Sanctuary 310023002',
  clericLevel50:cleric,verified:false,rows,
  notes:'Восстановление — периодическая величина; множитель лечения навыками не применяется.'};
}
// Real OS used-on-demand cleansing items. Their effects remove named
// conditions; no numeric healing, duration or server-side cooldown is inferred.
const statusCureCodes=Object.freeze({
 EP_RECOVERY_BURN:'Ожоги',
 EP_RECOVERY_CURSE:'Слабость и проклятие',
 EP_RECOVERY_RAVING:'Безумие',
 EP_RECOVERY_DISEASE:'Болезнь',
 EP_RECOVERY_NUMB:'Заморозка',
 EP_RECOVERY_POISON:'Яд',
 EP_RECOVERY_SILENCE:'Немота'
});
const statusCureCodesEn=Object.freeze({
 EP_RECOVERY_BURN:'Burn',EP_RECOVERY_CURSE:'Weakness and curse',
 EP_RECOVERY_RAVING:'Madness',EP_RECOVERY_DISEASE:'Disease',
 EP_RECOVERY_NUMB:'Freeze',EP_RECOVERY_POISON:'Poison',
 EP_RECOVERY_SILENCE:'Silence'
});

function statusCurePreview({items=null,skills=null}={}){
 if(!items||typeof items!=='object'||Array.isArray(items))return null;
 const rows=[];
 for(const [key,item] of Object.entries(items)){
  const id=Number(key);
  if(!Number.isSafeInteger(id)||id<0||!item||!Array.isArray(item.effects))continue;
  const targeted=item.effects.filter(e=>e?.dir==='TARGET');
  const conditions=[...new Set(targeted.filter(e=>
   Object.hasOwn(statusCureCodes,e.func)).map(e=>statusCureCodes[e.func]))];
  const conditionsEn=[...new Set(targeted.filter(e=>
   Object.hasOwn(statusCureCodesEn,e.func)).map(e=>statusCureCodesEn[e.func]))];
  // An on-use item can trigger a cleansing skill instead of having an
  // EP_RECOVERY_* modifier. Only a resolved EP_REMOVE_BAD_EFFECT proves it.
  if(targeted.some(e=>e.func==='EP_SKILL_EXEC'&&
   Number.isSafeInteger(e.a)&&skills?.[String(e.a)]?.funcs?.some(f=>
    f.ep==='EP_REMOVE_BAD_EFFECT'&&f.dir==='TARGET'))){
   conditions.push('Один отрицательный эффект');
   conditionsEn.push('One negative status effect');
  }
  if(conditions.length)rows.push({id,name:String(item.name||id),
   conditions:[...new Set(conditions)],conditionsEn:[...new Set(conditionsEn)]});
 }
 rows.sort((a,b)=>a.id-b.id);
 return {rows,verified:false};
}

// The OS catalogue contains two explicit non-healing poison consumables.
// Their EP_DESTINED_POISON a=50 is an unknown server parameter, NOT a proven
// percent chance, tick damage or duration. Expose only a neutral warning.
const knownPoisonConsumables=Object.freeze([50022,50056]);
function harmfulConsumablePreview({items=null}={}){
 const rows=[];
 if(!items||typeof items!=='object'||Array.isArray(items))
  return {rows,verified:false};
 for(const id of knownPoisonConsumables){
  const item=items[String(id)];
  if(item?.id!==id||item.kind!=='POTION'||
   !Array.isArray(item.effects))continue;
  const poison=item.effects.filter(e=>e?.func==='EP_DESTINED_POISON'&&
   e.dir==='TARGET'&&Number.isFinite(e.a));
  if(poison.length!==1||item.effects.some(e=>
   ['EP_HEAL_LIFE','EP_HEAL_LIFE_RATE','EP_HEAL_MANA','EP_HEAL_MANA_RATE']
    .includes(e?.func)))continue;
  rows.push({id,name:String(item.name||id),sourceValue:poison[0].a,
   verified:false});
 }
 return {rows,verified:false,
  source:'current OS items.json EP_DESTINED_POISON',
  excluded:['poison damage','duration','server activation chance']};
}

// Current OS consumables may trigger a *catalogued* skill when used. Display
// their direct skill IDs, not invented buff amounts, durations or active effects.
function consumableSkillPreview({items=null,skills=null}={}){
 const rows=[];
 if(!items||typeof items!=='object'||Array.isArray(items)||
  !skills||typeof skills!=='object'||Array.isArray(skills))return {rows,verified:false};
 for(const [key,item] of Object.entries(items)){
  const id=Number(key);
  if(!Number.isSafeInteger(id)||id<0||item?.id!==id||
   !['POTION','BALM'].includes(item.kind)||!Array.isArray(item.effects))continue;
  const triggered=[],seen=new Set();
  for(const effect of item.effects){
   if(!['EP_SKILL_EXEC','EP_SKILL_EXEC_BALM'].includes(effect?.func)||
    effect.dir!=='TARGET'||!Number.isSafeInteger(effect.a)||
    effect.a<1||seen.has(effect.a))continue;
   const skill=skills[String(effect.a)];
   if(!skill||Number(skill.id)!==effect.a||typeof skill.name!=='string'||
    !skill.name.trim()||!Array.isArray(skill.funcs))continue;
   triggered.push({id:effect.a,name:skill.name});
   seen.add(effect.a);
  }
  if(triggered.length)rows.push({id,name:String(item.name||id),
   kind:item.kind,skills:triggered});
 }
 rows.sort((a,b)=>a.id-b.id);
 return {rows,verified:false,source:'current game server consumable EP_SKILL_EXEC / EP_SKILL_EXEC_BALM'};
}

// Two-second spell recovery previews from Remaked Legacy Calc('LPsec'/'MPsec').
// The source's InBuff_0 input is SPI (not character level). Use the actual
// effective SPI after equipment, racial stats, and chosen attribute buffs.
// These historical pulse values are never added to natural HP/MP or server HP/MP.
// Availability is gated by current OS skill IDs and actual trained mastery.


// Explicit current OS item EP_HEAL_MANA(_RATE) and EP_HEAL_LIFE(_RATE).
// These are used-on-demand values, never a bonus to maximum HP/MP or passive regen.
// Remaked POT scaling is established for HP; mana POT scaling remains unverified.

function consumableRecoveryPreview({items=null,maxHp=null,maxMp=null,potionRate=null,
 applyHpPotionBonus=false}={}){
 if(!items||typeof items!=='object'||!Number.isFinite(maxHp)||maxHp<0||
  !Number.isFinite(maxMp)||maxMp<0||
  (applyHpPotionBonus&&(!Number.isFinite(potionRate)||potionRate<0)))return null;
 const rows=[],healthRows=[],allRows=[];
 for(const [key,item] of Object.entries(items)){
  const id=Number(key);
  if(!Number.isSafeInteger(id)||id<0||item?.kind!=='POTION'||
   !Array.isArray(item.effects))continue;
  const effects=[];
  let hp=0,mp=0;
  for(const effect of item.effects){
   const {func,a}=effect||{};
   if(!['EP_HEAL_LIFE','EP_HEAL_LIFE_RATE',
     'EP_HEAL_MANA','EP_HEAL_MANA_RATE'].includes(func)||
     effect.dir!=='TARGET'||!Number.isFinite(a)||a<0)continue;
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
  if(!effects.length)continue;
  const entry={id,name:item.name||'Предмет',hp,mp,
   effects,source:'current game server item effects',verified:false};
  allRows.push(entry);
  if(effects.some(x=>x.kind==='mp'))rows.push(entry);
  else healthRows.push(entry);
 }
 const sort=(a,b)=>a.id-b.id;
 rows.sort(sort);healthRows.sort(sort);allRows.sort(sort);
 return {rows,healthRows,allRows,verified:false};
}

// Preserve historical LPsec/MPsec formula magnitudes while proving that the
// corresponding current OS skill is genuine and accessible to this class.
const periodicSkillProof=Object.freeze({
 310002001:{skillType:'ALLY',charLevel:0,required:21,ep:'EP_HEAL_LIFE_REGENERATOR',
  fv1:[10,10,10,10],fv2:[0,0,0,2]},
 310022001:{skillType:'PARTY_ALL',charLevel:0,required:41,ep:'EP_HEAL_LIFE_REGENERATOR',
  fv1:[20,5,5,5],fv2:[0,0,0,2]},
 330005001:{skillType:'ALLY',charLevel:20,required:0,ep:'EP_HEAL_MANA_REGENERATOR',
  fv1:[0,10,0,0],fv2:[0,0,0,2]}
});
const naturalManaJobs=new Set(['ASCETIC','MONK','EXORCIST']);
function periodicSourceMatches(skill,proof){
 if(!skill||!proof||skill.learnable!==true||skill.prereq!==null||
  skill.skillType!==proof.skillType||skill.charLevel!==proof.charLevel||
  !Array.isArray(skill.reqs)||skill.reqs.length!==(proof.required?1:0)||
  (proof.required&&(skill.reqs[0]?.branch!=='benevolence'||
   skill.reqs[0]?.amount!==proof.required))||
  !Array.isArray(skill.funcs)||skill.funcs.length!==1)return false;
 const effect=skill.funcs[0];
 return effect?.ep===proof.ep&&effect?.dir==='TARGET'&&
  [effect.fv1,effect.fv2].every((vector,i)=>Array.isArray(vector)&&
   vector.length===4&&vector.every((value,index)=>
    value===(i===0?proof.fv1:proof.fv2)[index]));
}
function periodicRecoveryPreview({level,spi,benevolence=0,jobKey=null,
 skillCatalog=null,benevolenceCap=null}={}){
 if(!Number.isInteger(level)||level<1||level>55||
  !Number.isFinite(spi)||spi<0||
  !Number.isInteger(benevolence)||benevolence<0||typeof jobKey!=='string')
  return null;
 // Current OS periodic event FV1: [SPI%, level%, Healing%, constant].
 // Calculate each component with the existing Remaked floor semantics;
 // never claim FV2[3]=2 proves live tick interval or duration.
 const osMagnitude=id=>{
  const v=periodicSkillProof[id].fv1;
  return v[3]+Math.floor(spi*v[0]/100)+Math.floor(level*v[1]/100)+
   Math.floor(benevolence*v[2]/100);
 };
 const candidates=[
  {id:310002001,key:'regenerate',amount:osMagnitude(310002001),
   kind:'hp',name:'Регенерация'},
  {id:310022001,key:'restoration',amount:osMagnitude(310022001),
   kind:'hp',name:'Восстановление'},
  {id:330005001,key:'natural',amount:osMagnitude(330005001),
   kind:'mp',name:'Природное восстановление'}
 ];
 const rows=[];
 for(const candidate of candidates){
  const proof=periodicSkillProof[candidate.id],skill=skillCatalog?.[String(candidate.id)];
  // A mutated ID, direction or effect vector is not a verified skill.
  if(!skill?.classes?.[jobKey]||skill.id!==candidate.id||
   !periodicSourceMatches(skill,proof))continue;
  if(candidate.kind==='mp'&&!naturalManaJobs.has(jobKey))continue;
  const capValid=Number.isInteger(benevolenceCap)&&benevolenceCap>=proof.required;
  if(candidate.kind==='hp'&&!capValid)continue;
  const validAllocation=Number.isInteger(benevolenceCap)&&benevolenceCap>=0&&
   benevolence<=benevolenceCap;
  // MP regeneration is unrelated to Healing mastery; invalid unrelated
  // mastery should not block its verified, class-appropriate level-20 skill.
  const available=level>=proof.charLevel&&(
   candidate.kind==='mp'||validAllocation&&benevolence>=proof.required);
  rows.push({...candidate,available,required:proof.required,
   skillLevel:proof.charLevel,verified:false});
 }
 return {rows,verified:false,source:'Remaked independent floors + source-validated OS SPI/level/mastery FV1; tick timing unverified'};
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

// Explicit, source-checked chains for the three current OS hymn toggles.
// A learnable song invokes an area spell, which in turn applies a distinct
// recipient effect. These previews never assume that a toggle is enabled.
const songChains=Object.freeze([
 {key:'minstrel',id:340001001,middle:340001002,last:340001003,
  ru:'Песнь поэта',en:"Minstrel's Song",
  description:'Повышает точность и уклонение игроков в области действия.',
  descriptionEn:'Raises accuracy and evasion of players in the area.',
  requirements:{hymn:8},
  root:[['EP_SKILL_EXEC_COUNT','TARGET',[0,0,0,340001002]],
   ['EP_MOVESPEED_CONST','CASTER',[0,0,0,0]],
   ['EP_TOGGLE','CASTER',[0,0,-20,50]],
   ['EP_STATE_CHANT','CASTER',[0,0,0,0]]],
  final:[['EP_TOHIT_CONST','TARGET',[13,0,13,4]],
   ['EP_AVOIDANCE_CONST','TARGET',[13,0,13,4]]]},
 {key:'peaceful',id:340003001,middle:340003002,last:340003003,
  ru:'Песнь мира',en:'Peaceful Hymn',
  description:'Игроки в области действия не получают урон ниже заданного порога.',
  descriptionEn:'Players in the area take no damage below a set threshold.',
  requirements:{benevolence:61,hymn:30},
  root:[['EP_SKILL_EXEC_COUNT','TARGET',[0,0,0,340003002]],
   ['EP_MOVESPEED_CONST','CASTER',[0,0,225,0]],
   ['EP_TOGGLE','CASTER',[0,0,-20,50]],
   ['EP_STATE_CHANT','CASTER',[0,0,0,0]]],
  final:[['EP_DAMAGE_CLEAR','TARGET',[60,0,30,10]]]},
 {key:'sage',id:340004001,middle:340004002,last:340004003,
  ru:'Песнь чар',en:"Sage's Song",
  description:'Усиливает атакующие заклинания и сокращает перезарядку умений.',
  descriptionEn:'Strengthens attack spells and shortens skill cooldowns.',
  requirements:{blessing:71,hymn:30},
  root:[['EP_SKILL_EXEC_COUNT','TARGET',[0,0,0,340004002]],
   ['EP_MOVESPEED_CONST','CASTER',[0,0,225,0]],
   ['EP_TOGGLE','CASTER',[0,0,-20,50]],
   ['EP_STATE_CHANT','CASTER',[0,0,0,0]]],
  final:[['EP_SKILL_BENCH_FIN','TARGET',[-28,0,-17,-5]],
   ['EP_ELEMENT_DAMAGE_SCALE','TARGET',[8,0,8,4]]]}
]);
function songFunctionsMatch(funcs,expected){
 return Array.isArray(funcs)&&funcs.length===expected.length&&
  expected.every(([ep,dir,values])=>funcs.some(row=>
   row?.ep===ep&&row?.dir===dir&&
   Array.isArray(row.fv1)&&row.fv1.length===values.length&&
   row.fv1.every((value,index)=>value===values[index])));
}
function songSourceMatches(catalog,spec){
 const root=catalog?.[String(spec.id)],
  middle=catalog?.[String(spec.middle)],last=catalog?.[String(spec.last)];
 if(!root||root.id!==spec.id||root.skillType!=='TOGGLE'||
  root.learnable!==true||root.prereq!==null||root.charLevel!==0||
  !Array.isArray(root.reqs)||root.reqs.length!==Object.keys(spec.requirements).length||
  !Object.entries(spec.requirements).every(([branch,amount])=>root.reqs.some(req=>
   req?.branch===branch&&req?.amount===amount))||
  !songFunctionsMatch(root.funcs,spec.root))return false;
 if(!middle||middle.id!==spec.middle||middle.skillType!=='SPHERE'||
  middle.learnable!==false||!Array.isArray(middle.reqs)||middle.reqs.length||
  !songFunctionsMatch(middle.funcs,[['EP_SKILL_EXEC','TARGET',[0,0,0,spec.last]]]))return false;
 if(!last||last.id!==spec.last||last.skillType!=='ALLY'||
  last.learnable!==false||!Array.isArray(last.reqs)||last.reqs.length||
  !songFunctionsMatch(last.funcs,spec.final))return false;
 return true;
}
function songSkillPreview({skillCatalog=null,jobKey=null,level=1,
 branchMasteries={},branchCaps={}}={}){
 const rows=[];
 if(!Number.isInteger(level)||level<1||level>55||!skillCatalog||
  typeof skillCatalog!=='object'||typeof jobKey!=='string')return {rows,verified:false};
 for(const spec of songChains){
  const requirements=Object.entries(spec.requirements).map(([branch,amount])=>({branch,amount}));
  const capsValid=requirements.every(({branch,amount})=>
   Number.isInteger(branchCaps?.[branch])&&branchCaps[branch]>=amount);
  if(!capsValid)continue; // Never offer an impossible song for this class.
  const root=skillCatalog[String(spec.id)];
  if(!root?.classes?.[jobKey]||!songSourceMatches(skillCatalog,spec))continue;
  const masteryValid=requirements.every(({branch})=>
   Number.isInteger(branchMasteries?.[branch])&&branchMasteries[branch]>=0&&
   branchMasteries[branch]<=branchCaps[branch]);
  const available=masteryValid&&requirements.every(({branch,amount})=>
   branchMasteries[branch]>=amount);
  rows.push({id:spec.id,key:spec.key,name:spec.ru,nameEn:spec.en,
   description:spec.description,descriptionEn:spec.descriptionEn,
   requirements,available,active:false,verified:false});
 }
 return {rows,verified:false,condition:'skill must be activated in game'};
}

// Guild level unlock order from Remaked localization/guild-skills.v1.json,
// not inferred from the player's character level. This models the passive
// effects that the existing OS calculator knows how to apply. Physical/magic
// damage reduction and EXP are exposed separately, not added to unknown math.
function guildPassiveAtLevel(level=0){
 if(!Number.isInteger(level)||level<0||level>12)return null;
 const hp=[0,0,1,1,2,2,3,3,4,4,5,5,5][level];
 const regen=[0,0,0,0,1,1,1,1,2,2,2,2,2][level];
 const reduction=level>=10?6:level>=6?3:0;
 const exp=[0,2,2,3,3,4,4,5,5,6,6,6,6][level];
 return Object.freeze({level,guildHp:hp,guildMp:hp,guildLifeRecovery:regen,
  guildManaRecovery:regen,physicalReduction:reduction,magicReduction:reduction,experience:exp});
}
// Preserved Remaked Legacy Calc('Velox'...'ToxicAura') branch previews.
// These are read-only magnitudes: never apply to combat stats merely because
// the hero's level/mastery is high. The corresponding spell must be selected
// and its current OS identity verified before it becomes an active buff.
// Read-only external-priest per-cast magnitudes. The exact Remaked floor
// rules are retained, but every coefficient and constant is checked against
// current OS data. No selection flag or combat mutation is involved.
function priestCastPreviews({spi,blessing,hymn,exorcism=26,skills=null}={}){
 const result={gratia:null,lapisMedio:null,encouragement:null,
  groupBarrier:null,holyWeapon:null,minstrel:null,sage:null,
  peaceful:null,enchantAuraRate:null,enchantAuraFlat:null,
  enchantElementRate:null,holyEnhanced:null,verified:false};
 if(![spi,blessing,hymn,exorcism].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=500)||
  !skills||typeof skills!=='object')return result;
 const exact=(id,ep,values)=>{
  const source=skills[String(id)];
  const effects=(source?.funcs||[]).filter(f=>f?.dir==='TARGET'&&f.ep===ep);
  return source?.id===id&&effects.length===1&&
   Array.isArray(effects[0].fv1)&&effects[0].fv1.length===4&&
   effects[0].fv1.every((v,i)=>v===values[i])&&
   Array.isArray(effects[0].fv2)&&effects[0].fv2.length===4&&
   effects[0].fv2.every(v=>v===0);
 };
 if(exact(320007001,'EP_ATTACKINTERVAL_SCALE',[10,0,5,5]))
  result.gratia=5+Math.floor(spi*10/100)+Math.floor(blessing*5/100);
 if(exact(320008001,'EP_ARMORCLASS_CONST',[3,0,4,5]))
  result.lapisMedio=5+Math.floor(spi*3/100)+Math.floor(blessing*4/100);
 if(['EP_STRENGTH_CONST','EP_AGILITY_CONST','EP_INTELIGENCE_CONST']
  .every(ep=>exact(320012001,ep,[0,0,10,0])))
  result.encouragement=Math.floor(blessing/10);
 if(exact(320003001,'EP_ONDAMAGE_FIN_DAMAGE_SCALE',[0,0,-20,-10]))
  result.groupBarrier=-10-Math.floor(blessing/5);
 if(exorcism>=26&&exact(330051001,'EP_AURAHOLY_CONSTANT',[6,0,0,2]))
  result.holyWeapon=2+Math.floor(spi*6/100);
 // OS Enchantment is THREE independent caster-driven vectors. Historical
 // Remaked Calc('DAMAura') uses base+flat+ceil(base×rate/100) for auras.
 // The resulting combination remains a labeled source-derived model.
 if(exact(320011001,'EP_AURADAMAGE_SCALE',[20,0,20,10])&&
  exact(320011001,'EP_AURADAMAGE_CONST',[5,0,10,5])&&
  exact(320011001,'EP_ELEMENT_DAMAGE_SCALE',[0,0,20,10])){
  result.enchantAuraRate=10+Math.floor(spi*.20)+Math.floor(blessing*.20);
  result.enchantAuraFlat=5+Math.floor(spi*.05)+Math.floor(blessing*.10);
  result.enchantElementRate=10+Math.floor(blessing*.20);
  if(Number.isFinite(result.holyWeapon))
   result.holyEnhanced=result.holyWeapon+result.enchantAuraFlat+
    Math.ceil(result.holyWeapon*result.enchantAuraRate/100);
 }
 const peaceful=songChains.find(x=>x.id===340003001);
 if(peaceful&&songSourceMatches(skills,peaceful)&&
  exact(340003003,'EP_DAMAGE_CLEAR',[60,0,30,10]))
  result.peaceful=10+Math.floor(spi*.60)+Math.floor(hymn*.30);
 const minstrel=songChains.find(x=>x.id===340001001);
 if(songSourceMatches(skills,minstrel)&&
  exact(340001003,'EP_TOHIT_CONST',[13,0,13,4])&&
  exact(340001003,'EP_AVOIDANCE_CONST',[13,0,13,4]))
  result.minstrel=4+Math.floor(spi*13/100)+Math.floor(hymn*13/100);
 const sage=songChains.find(x=>x.id===340004001);
 if(songSourceMatches(skills,sage)&&
  exact(340004003,'EP_ELEMENT_DAMAGE_SCALE',[8,0,8,4]))
  result.sage=4+Math.floor(spi*8/100)+Math.floor(hymn*8/100);
 return result;
}
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
  encouragement:{value:Math.floor(blessing/10)},
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
  const item={slot,grade,itemId:entry.itemId,type:slot==='weapon'?gem.type:'physical',element:gem.element,
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
// The present OS itemForth.json contains a dedicated grade-dependent fire
// magic property on Fire Dagger of Scorching Heat (item 1862, +7..+10).
// Its source description explicitly requires fire-element refinement. Only
// show the structured source preview when that exact equipped weapon has a
// fire gem at the same grade. Never add this to generic MATK or Honor magic:
// the live server's final stacking and Phoenix proc remain unverified.
function elementalRefinementPreview({records=[],itemForth=null,gemSelections=[]}={}){
 const entries=[],seen=new Set();
 if(!Array.isArray(records)||!Array.isArray(gemSelections)||
  !itemForth||typeof itemForth!=='object')return {entries,verified:false};
 for(const [source,item,grade] of records){
  if(item?.id!==1862||source!=='item:1862'||item.slot!=='weapon'||
   !Number.isInteger(grade)||grade<7||grade>10||seen.has(item.id))continue;
  const hasFireGem=gemSelections.some(row=>row?.slot==='weapon'&&
   row.itemId===item.id&&row.grade===grade&&row.gem?.element==='fire'&&
   ['physical','magical'].includes(row.gem?.type));
  if(!hasFireGem)continue;
  const gradeEffects=forthSnapshotAtGrade(itemForth,item.id,grade);
  if(!Array.isArray(gradeEffects))continue;
  const matches=gradeEffects.filter(e=>e?.func==='EP_ELEMENT_DAMAGE_SCALE_FIRE');
  if(matches.length!==1||!Number.isFinite(matches[0].a)||
   matches[0].a<0||matches[0].b!==0)continue;
  seen.add(item.id);
  entries.push({itemId:item.id,source:'itemForth.json',grade,
   element:'fire',rate:matches[0].a,gemElement:'fire',
   verified:false});
 }
 return {entries,verified:false,
  excluded:['final fire magic attack stacking','Phoenix proc trigger and damage',
   'current server gemstone type restrictions']};
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
 if(!classData||!raceData||!jobData||!Number.isInteger(level)||level<1||level>55)return null;
 const unison=unisonPreview({records,catalog:unisonCatalog});
 const combinedRecords=[...records,...unison.supplemental];
 const effects=gatherEffects(combinedRecords,itemForth),basic={},stats={},extra=attributeBuffBonus(attributeBuffs,{externalPriest:combatContext.externalPriest,skillCatalog:combatContext.skillCatalog});
 if(!extra)return null;
 for(const key of keys){
  const race=Number(raceData[key]),job=Number(jobData[key]),spent=Number(allocation?.[key]||0);
  if(!Number.isFinite(race)||!Number.isFinite(job)||!Number.isInteger(spent)||spent<0)return null;
  basic[key]=race+job+spent;
  stats[key]=effectiveAbility(basic[key],effects.flat[key]+extra.flat[key]+(Number(supplementalFlat[key])||0),0);
 }
 const rawHp=classData.hp,rawMp=classData.mp;
 const hpFormula=classBaseComponents(rawHp,level,stats.vit,'vit');
 const mpFormula=classBaseComponents(rawMp,level,stats.spi,'spi');
 const hpBase=hpFormula?.base??null,mpBase=mpFormula?.base??null;
 if(hpBase===null||mpBase===null)return null;
 const hpBonus=bonusFor('hp',hpBase,effects,enhancements);
 const mpBonus=bonusFor('mp',mpBase,effects,enhancements);
 if(!hpBonus||!mpBonus)return null;
 const potion=potionRecovery({vit:stats.vit,records:combinedRecords,honorTitle:extra.honor.id,
  level,itemForth,...potionContext,runeJoEun:false});
 // Saved pre-670 Divine Blessing resistance selections remain valid.
 // Consolidate its single effect under Allied Buffs without double counting.
 const oldDivineBlessing=Array.isArray(attributeBuffs?.resistanceSkillIds)&&
  attributeBuffs.resistanceSkillIds.includes(330004001);
 const mergedBuffIds=new Set(Array.isArray(attributeBuffs?.remakedSkillIds)?
  attributeBuffs.remakedSkillIds:[]);
 if(oldDivineBlessing)mergedBuffIds.add(330004001);
 const resistanceSkills=resistanceSkillPreview({
  skillCatalog:combatContext.skillCatalog,
  selected:root.PandoraRemakedBuffs?.applied?
   (attributeBuffs.resistanceSkillIds||[]).filter(id=>id!==330004001):
   (attributeBuffs.resistanceSkillIds||[])
 });
 const resistanceBonuses={...effects.bonuses};
 const groupBuffs=root.PandoraRemakedBuffs?.applied({
  selected:[...mergedBuffIds],skills:combatContext.skillCatalog,
  jobKey:combatContext.jobKey,level,weapon:combatContext.weapon,
  branchMasteries:combatContext.branchMasteries})||{};
 if(groupBuffs.providence)
  resistanceBonuses.magic=(Number(resistanceBonuses.magic)||0)+groupBuffs.providence.magic;
 for(const [key,value] of Object.entries(resistanceSkills.bonuses))
  resistanceBonuses[key]=(resistanceBonuses[key]||0)+value;
 const resistances=resistancePreview({stats,bonuses:resistanceBonuses,
  honorTitle:extra.honor.id,racialPassiveId:potionContext?.racialPassiveId,
  jobKey:combatContext.jobKey,wardingMastery:combatContext.wardingMastery,
  wardingCap:classData.branchCaps?.warding,skillCatalog:combatContext.skillCatalog});
 const regeneration=regenerationPreview({stats,guild:attributeBuffs});
 const gemstones=gemstonePreview(gemSelections);
 const otherEquipment=secondaryEffectsPreview({records:combinedRecords,itemForth});
 const targetResistance=targetResistancePreview({records:combinedRecords,itemForth});
 const rawProcPreview=conditionalProcPreview({records:combinedRecords,itemForth,skills:combatContext.skillCatalog});
 const experienceBonus=experienceBonusPreview({records:combinedRecords,itemForth});
 // Guild passives are selected together at a guild level, not just displayed
 // as a reference. Their mitigation and EXP effects are independent of HP/MP.
 const guildLevel=Number(attributeBuffs?.guildLevel||0);
 const guildPassives=guildPassiveAtLevel(guildLevel);
 // Manual mode lets players choose every passive independently. Use the
 // published OS guild-skill ranks; automatic mode uses the Remaked unlocks.
 const guildManualRate=(key,values)=>{
  const rank=Number(attributeBuffs?.[key]||0);
  return Number.isInteger(rank)&&rank>=0&&rank<values.length?values[rank]:0;
 };
 const guildPhysical=guildLevel>0?(guildPassives?.physicalReduction||0):
  guildManualRate('guildPhysicalReduction',[0,3,6,10]);
 const guildMagical=guildLevel>0?(guildPassives?.magicReduction||0):
  guildManualRate('guildMagicReduction',[0,3,6,10]);
 const guildExperience=guildLevel>0?(guildPassives?.experience||0):
  guildManualRate('guildExperience',[0,2,3,4,5,6,7,8,10]);
 if(resistances){
  resistances.mitigation.physical-=guildPhysical;
  resistances.mitigation.magic-=guildMagical;
 }
 if(guildExperience>0&&experienceBonus)
  experienceBonus.entries.push({source:'Гильдия · Опыт',
   percent:guildExperience});
 const battleMapCloaks=battleMapCloakPreview({
  records:combinedRecords,itemForth,skills:combatContext.skillCatalog
 });
 const specialEquipment=specialEquipmentPreview({records:combinedRecords,itemForth});
 const procPreview=deduplicateProcDescriptions(rawProcPreview,specialEquipment);
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
 // This selected PARTY_ALL skill increases the recovery-speed index, not the
 // quantity of MP restored per tick. Keep equipment and ally sources separate.
 if(regeneration&&groupBuffs.blessedRepose){
  regeneration.mp.allyBuff=groupBuffs.blessedRepose.manaRecoverySpeed;
  regeneration.mp.total+=groupBuffs.blessedRepose.manaRecoverySpeed;
 }
 // OS Rapin passive 900060002: EP_HEAL_TIME_SCALE fv1[3]=18.
 // This is an MP recovery *speed* index, not MP gained per tick.
 if(regeneration&&potionContext?.racialPassiveId===900060002){
  regeneration.mp.racial=18;
  regeneration.mp.total+=18;
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
 const racialEffects=racialUtilityPreview({
  racialPassiveId:potionContext?.racialPassiveId,
  skillCatalog:combatContext.skillCatalog
 });
 const attackRange=attackRangePreview({records:combinedRecords,itemForth,
  weapon:combatContext.weapon,racialEffects});
 const skillAttackRange=skillAttackRangePreview({
  skillCatalog:combatContext.skillCatalog,jobKey:combatContext.jobKey,
  level,branchMasteries:combatContext.branchMasteries,
  branchCaps:classData.branchCaps,weapon:combatContext.weapon
 });
 const elementalMagic=elementalMagicPreview({honorTitle:extra.honor.id});
 const elementalRefinement=elementalRefinementPreview({
  records:combinedRecords,itemForth,gemSelections
 });
 const mountedRelease=mountedReleasePreview({jobKey:combatContext.jobKey,
  ridingMastery:combatContext.ridingMastery??0,honorTitle:extra.honor.id});
 const priest=combatContext.externalPriest;
 const priestActive=priest?.enabled===true;
 // External priest stats can come from an older or corrupted local build.
 // Only valid nonnegative integers may supply combat buffs.
 const priestValid=priestActive&&[priest.spi,priest.blessing,priest.hymn]
  .every(n=>Number.isSafeInteger(n)&&n>=0&&n<=500);
 const priestCast=priestCastPreviews({
  spi:priest?.spi,blessing:priest?.blessing,hymn:priest?.hymn,
  exorcism:priest?.exorcism??26,skills:combatContext.skillCatalog
 });
 const legacyBuffs=legacyBuffPreview({
  spi:priestValid?priest.spi:stats.spi,
  blessing:priestValid?priest.blessing:combatContext.legacyBuffMasteries?.blessing??0,
  hymn:priestValid?priest.hymn:combatContext.legacyBuffMasteries?.hymn??0,
  alchemy:combatContext.legacyBuffMasteries?.alchemy??0
 })||legacyBuffPreview({spi:0});
 const songSkills=songSkillPreview({skillCatalog:combatContext.skillCatalog,
  jobKey:combatContext.jobKey,level,
  branchMasteries:combatContext.branchMasteries,
  branchCaps:classData.branchCaps});
 const coverage=effectCoverage({records:combinedRecords,itemForth});
 const recoveryAmount=recoveryAmountPreview({maxHp:hpBase+hpBonus.total,
  maxMp:mpBase+mpBonus.total,stats});
 const healingSkill=healingSkillPreview({honorTitle:extra.honor.id,records:combinedRecords,itemForth});
 const healingSpells=healingSkill?healingSpellsPreview({
  level,int:stats.int,spi:stats.spi,
  benevolence:combatContext.benevolenceMastery??0,
  jobKey:combatContext.jobKey,healingPercent:healingSkill.percent,
  benevolenceCap:classData.branchCaps?.benevolence??null,
  skillCatalog:combatContext.skillCatalog
 }):null;
 const statusCures=statusCurePreview({items:consumableItems,skills:combatContext.skillCatalog});
 const harmfulConsumables=harmfulConsumablePreview({items:consumableItems});
 const consumableSkills=consumableSkillPreview({
  items:consumableItems,skills:combatContext.skillCatalog
 });
 const consumableRecovery=consumableRecoveryPreview({
  items:consumableItems,maxHp:hpBase+hpBonus.total,
  maxMp:mpBase+mpBonus.total,potionRate:potion?.percent??null,
  applyHpPotionBonus:attributeBuffs?.potionEffectsEnabled===true
 });
 const periodicRecovery=periodicRecoveryPreview({
  level,spi:stats.spi,benevolence:combatContext.benevolenceMastery??0,
  jobKey:combatContext.jobKey,skillCatalog:combatContext.skillCatalog,
  benevolenceCap:classData.branchCaps?.benevolence??null
 });
 // OS skill 320007001 requires Blessing 8; 320008001 requires Blessing 12.
 // A previously selected checkbox must not bypass these requirements.
 // Current OS spell-effect records carry a new constant term relative to
 // historic Remaked. Keep its floor-by-stat structure, but use the OS source
 // parameters instead of hardcoding the historical +5 or +0 offsets.
 // Active songs must use the SAME current-OS-source-gated values as the
 // priest skill rows; a syntactically valid but different effect vector must
 // not become an unintended attack-speed, accuracy or magic-damage bonus.
 const chosenPriestSong=new Set(Array.isArray(attributeBuffs?.remakedSkillIds)?
  attributeBuffs.remakedSkillIds:[]);
 // The two current OS coefficients extend the original Remaked step formula:
 // barrier EP_ONDAMAGE_FIN_DAMAGE_SCALE [0,0,-20,-10] and holy aura
 // EP_AURAHOLY_CONSTANT [6,0,0,2]. Only the receiving hero's explicitly
 // selected external-priest buff is applied, never all available spells.
 const priestSourceMatches=(id,ep,expected)=>{
  const record=combatContext.skillCatalog?.[String(id)];
  if(Number(record?.id)!==id)return false;
  const matches=(record?.funcs||[]).filter(x=>x?.ep===ep&&x.dir==='TARGET');
  return matches.length===1&&Array.isArray(matches[0].fv1)&&
   matches[0].fv1.length===expected.length&&
   matches[0].fv1.every((v,i)=>v===expected[i])&&
   Array.isArray(matches[0].fv2)&&matches[0].fv2.length===4&&
   matches[0].fv2.every(v=>v===0);
 };
 // Remaked SkillView uses floor steps from caster stats/mastery. Modern OS
 // changes Gratia to [10,0,5,5]; the historical nested 6%*1.9 shortcut
 // must not be used for an active buff with the new OS coefficients.
 const gratiaPreview=priestValid&&priest.blessing>=8&&
  priestSourceMatches(320007001,'EP_ATTACKINTERVAL_SCALE',[10,0,5,5])?
  5+Math.floor(priest.spi*10/100)+Math.floor(priest.blessing*5/100):null;
 const groupBarrier=priestValid&&priest.blessing>=26&&
  chosenPriestSong.has(320003001)&&
  priestSourceMatches(320003001,'EP_ONDAMAGE_FIN_DAMAGE_SCALE',[0,0,-20,-10])?
  -10-Math.floor(priest.blessing/5):0;
 const holyWeapon=priestValid&&combatContext.weapon&&
  chosenPriestSong.has(330051001)&&
  Number.isSafeInteger(priestCast.holyWeapon)?
  priestCast.holyWeapon:0;
 const priestEnchantment=priestValid&&
  chosenPriestSong.has(320011001)&&
  Number.isFinite(priestCast.enchantAuraRate)&&
  Number.isFinite(priestCast.enchantAuraFlat)&&
  Number.isFinite(priestCast.enchantElementRate)?{
   rate:priestCast.enchantAuraRate,
   flat:priestCast.enchantAuraFlat,
   magicRate:priestCast.enchantElementRate,
   verified:false,model:'Remaked aura stages with current OS effect coefficients'
  }:null;
 if(resistances&&groupBarrier){
  resistances.mitigation.physical+=groupBarrier;
  resistances.mitigation.magic+=groupBarrier;
  resistances.mitigation.priestGroupBarrier=groupBarrier;
 }
 if(auraDamage&&holyWeapon){
  const previous=auraDamage.elements.light;
  auraDamage.elements.light={
   base:previous?.base||0,flat:previous?.flat||0,percent:previous?.percent||0,
   priestHoly:holyWeapon,known:(previous?.known||0)+holyWeapon
  };
 }
 // Enhance Enchantment raises EXISTING elemental weapon auras. Do not
 // create aura damage for a weapon that has no corresponding aura.
 if(auraDamage&&priestEnchantment&&combatContext.weapon){
  for(const [element,entry] of Object.entries(auraDamage.elements)){
   if(!Number.isFinite(entry?.known)||entry.known<=0)continue;
   const boost=Math.ceil(entry.known*priestEnchantment.rate/100);
   auraDamage.elements[element]={
    ...entry,priestEnhanceFlat:priestEnchantment.flat,
    priestEnhanceRate:priestEnchantment.rate,
    priestEnhanceBonus:priestEnchantment.flat+boost,
    known:entry.known+priestEnchantment.flat+boost,
    modeled:true
   };
  }
 }
 const priestApplied={groupBarrier,holyWeapon,gratiaPreview,priestEnchantment,
  source:'Remaked floor steps guarded by current OS TARGET coefficients',
  verified:false};
 const priestEffects=priestActive?{
  gratia:attributeBuffs?.priestGratia===true&&Number.isFinite(gratiaPreview)?
   gratiaPreview:0,
  lapisMedio:priestValid&&priest.blessing>=12&&
   attributeBuffs?.priestLapisMedio===true&&
   Number.isFinite(priestCast.lapisMedio)?
   priestCast.lapisMedio:0,
  minstrel:priestValid&&priest.hymn>=8&&
   chosenPriestSong.has(340001001)&&
   Number.isFinite(priestCast.minstrel)?priestCast.minstrel:0,
  sageElementDamage:priestValid&&priest.hymn>=30&&priest.blessing>=71&&
   chosenPriestSong.has(340004001)&&
   Number.isFinite(priestCast.sage)?priestCast.sage:0
 }:{};
 // Gem-type selection determines which weapon enhancement table is active.
 // A saved older build without a chosen gem preserves the legacy physical
 // fallback; a typed magical gem must not also receive physical weaponPlus.
 const weaponGem=gemSelections.find(row=>row?.slot==='weapon'&&
  row.itemId===combatContext.weapon?.id&&row.grade===combatContext.weaponGrade);
 const weaponEnhancementType=weaponGem?.gem?.type||
  combatContext.weaponEnhancementType||'physical';
 const combat=combatPreview({stats,level,bonuses:effects.bonuses,records:combinedRecords,itemForth,
  priestEffects,
  guildArouse:attributeBuffs?.guildArouse??0,
  combatBuffs:attributeBuffs,
  honorTitle:extra.honor.id,racialPassiveId:potionContext?.racialPassiveId,
  ...combatContext,branchCaps:classData.branchCaps,weaponEnhancementType});
 // An unavailable weapon/armor preview must NEVER erase otherwise valid HP/MP.
 if(!resistances||!regeneration)return null;
 return {hp:hpBase+hpBonus.total,mp:mpBase+mpBonus.total,
  hpBase,mpBase,vitalsBonus:{hp:hpBonus,mp:mpBonus},
  vitalFormulas:{hp:hpFormula,mp:mpFormula},resistanceSkills,
  hpRaw:rawHp.base+level*rawHp.lv+stats.vit*rawHp.vit,
  mpRaw:rawMp.base+level*rawMp.lv+stats.spi*rawMp.spi,
  stats,basic,effects,honor:extra.honor,potion,resistances,targetResistance,procPreview,experienceBonus,battleMapCloaks,specialEquipment,regeneration,legacyBuffs,priestApplied,priestCast,songSkills,otherEquipment,
  recoveryAmount,healingSkill,healingSpells,periodicRecovery,consumableRecovery,consumableSkills,statusCures,harmfulConsumables,combat,gemstones,auraDamage,attackRange,skillAttackRange,racialEffects,elementalMagic,elementalRefinement,mountedRelease,unison,coverage,
  attributeBuffs:{flat:extra.flat,trace:extra.trace},supplementalFlat,supplementalSource,
  rounding:'floor-class-cents',source:'current game server / Modern current-vitals class formula',
  verified:false,excluded:['unstructured refinement bonuses','unpublished set effects',
    'unverified passive and conditional skills','other group/temporary buffs']};
}
// Current OS skill-execution graph: links are not automatic combat bonuses.
function skillExecutionChains({skillCatalog=null,jobKey=null,level=1,onHit=false,
 branchMasteries={},branchCaps={},branchLabels={},englishBranches={},
 weaponKind='BARE_HAND'}={}){
 const out={rows:[],rejected:[],verified:false,
  source:onHit?'OS on-hit links; chance not proven':'OS execution links; timing and damage not verified'};
 if(!skillCatalog||typeof jobKey!=='string'||!Number.isSafeInteger(level)||
  level<1||level>55)return out;
 const rootEP=onHit?'EP_ONHIT_SKILL_EXEC':'EP_SKILL_EXEC';
 // The four current OS on-hit sources are distinct identity bindings.
 // Merely pointing to another existing ID is NOT evidence for that skill.
 const onHitSources=Object.freeze({
  100103001:{child:100103050,dir:'CASTER',fv2:[0,0,0,100]},
  142502001:{child:142502050,dir:'CASTER',fv2:[0,0,0,100]},
  213607001:{child:213607002,dir:'CASTER',fv2:[0,0,15,15]},
  430057001:{child:430057002,dir:'TARGET',fv2:[0,0,50,30]}
 });
 const get=id=>{
  const r=skillCatalog[String(id)];
  return Number.isSafeInteger(id)&&id>0&&r?.id===id&&Array.isArray(r.funcs)?r:null;
 };
 const trace=(id,visited)=>{
  if(visited.has(id)||visited.size>=12)return null;
  const s=get(id);if(!s)return null;
  const seen=new Set(visited);seen.add(id);
  // Conditional on-hit root, then any ordinary OS internal child links.
  const calls=s.funcs.filter(f=>f?.ep===(onHit&&visited.size===0?rootEP:'EP_SKILL_EXEC'));
  if(!calls.length)return [[id]];
  if(onHit&&visited.size===0&&calls.length!==1)return null;
  const paths=[];
  for(const f of calls){
   const a=f?.fv1,b=f?.fv2;
   const hit=onHit&&visited.size===0;
   // Current OS on-hit descriptors: these are raw source bytes, NOT
   // a guaranteed percentage chance, duration or number of strikes.
   const expected=hit?onHitSources[id]:null;
   const child=hit?get(a?.[3]):null;
   // An existing but unrelated internal skill is not the expected trigger.
   const onHitIdentity=!hit||(expected&&a?.[3]===expected.child&&
    child?.learnable===false&&child.name===s.name&&child.branch===s.branch);
   const directionOK=hit?f.dir===expected?.dir:f.dir==='TARGET';
   const fv2OK=hit?
    Array.isArray(b)&&b.length===4&&expected?.fv2.every((n,i)=>n===b[i]):
    Array.isArray(b)&&b.length===4&&
     (b.every(x=>x===0)||(b[0]===0&&b[1]===0&&b[2]===9&&b[3]===9));
   if(!onHitIdentity||!directionOK||!Array.isArray(a)||a.length!==4||
    a.slice(0,3).some(x=>x!==0)||!Number.isSafeInteger(a[3])||a[3]<=0||
    !fv2OK)return null;
   const children=trace(a[3],seen);
   if(!children)return null;
   for(const path of children){
    paths.push([id,...path]);
    if(paths.length>32)return null;
   }
  }
  return paths;
 };
 for(const idString of Object.keys(skillCatalog).sort((a,b)=>Number(a)-Number(b))){
  const id=Number(idString),s=get(id);
  if(!s||idString!==String(id)||s.learnable!==true||!s.classes?.[jobKey]||
   !s.funcs.some(f=>f?.ep===rootEP))continue;
  if(!Array.isArray(s.reqs)||!s.reqs.every(r=>typeof r?.branch==='string'&&
   Number.isSafeInteger(r.amount)&&r.amount>=0))continue;
  if(s.reqs.some(r=>!Number.isFinite(branchCaps?.[r.branch])||
   branchCaps[r.branch]<r.amount))continue;
  if(Number.isSafeInteger(s.prereq)&&s.prereq>0){
   const parent=get(s.prereq);
   if(!parent||parent.learnable!==true||!parent.classes?.[jobKey])continue;
  }
  const paths=trace(id,new Set());
  if(!paths){out.rejected.push(id);continue;}
  const ru=[],en=[];
  if(level<Number(s.charLevel||0)){
   ru.push('Нужен уровень '+s.charLevel);
   en.push('Requires level '+s.charLevel);
  }
  for(const r of s.reqs){
   const points=Number(branchMasteries?.[r.branch]??0);
   if(Number.isSafeInteger(points)&&points>=r.amount&&
    points<=branchCaps[r.branch])continue;
   ru.push('Нужно мастерство «'+(branchLabels?.[r.branch]||r.branch)+'»: '+r.amount);
   en.push('Requires '+(englishBranches?.[r.branch]||r.branch)+' mastery: '+r.amount);
  }
  if(Array.isArray(s.weaponUse)&&s.weaponUse.length&&!s.weaponUse.includes(weaponKind)){
   ru.push('Не подходит оружие');en.push('Incompatible weapon');
  }
  const edges=new Set();
  for(const path of paths)for(let i=1;i<path.length;i++)edges.add(path[i-1]+':'+path[i]);
  out.rows.push({id,name:s.name,paths,linkCount:edges.size,
   trigger:onHit?'on-hit':'cast',
   requirementsMet:ru.length===0,reasonRu:ru.join(' · '),reasonEn:en.join(' · '),
   sourceOnly:true});
 }
 return out;
}
// Exact OS crafting ingredients and output counts, not server cast success.
const craftRecipes=Object.freeze([
 {id:220002001,branch:'alchemy',rank:8,uses:[[50022,'CASTER',1],[65011,'CASTER',1]],out:[50056,'TARGET',1]},
 {id:220003001,branch:'alchemy',rank:26,uses:[[50021,'CASTER',1],[65011,'CASTER',1]],out:[50057,'TARGET',1]},
 {id:220004001,branch:'alchemy',rank:41,uses:[[50025,'TARGET',1],[50024,'TARGET',1],[65011,'TARGET',1]],out:[50061,'TARGET',1]},
 {id:320010001,branch:'blessing',rank:41,uses:[[65011,'CASTER',1]],out:[50059,'TARGET',1]}
]);
function craftingSkillPreview({skillCatalog=null,jobKey=null,level=1,
 branchCaps={},branchMasteries={},branchLabels={},englishBranches={}}={}){
 const out={rows:[],rejected:[],verified:false,
  source:'current OS skill recipe IDs; quantities exact, inventory unverified'};
 if(!skillCatalog||typeof jobKey!=='string'||!Number.isSafeInteger(level)||
  level<1||level>55)return out;
 for(const recipe of craftRecipes){
  const skill=skillCatalog[String(recipe.id)];
  if(skill?.id!==recipe.id||skill.learnable!==true||
   skill.skillType!=='MYSELF'||skill.prereq!==null||skill.charLevel!==0||
   skill.branch!==recipe.branch||!skill.classes?.[jobKey]||
   !Array.isArray(skill.reqs)||skill.reqs.length!==1||
   skill.reqs[0]?.branch!==recipe.branch||
   skill.reqs[0]?.amount!==recipe.rank||
   !Array.isArray(skill.funcs))continue;
  const cap=branchCaps?.[recipe.branch];
  if(!Number.isSafeInteger(cap)||cap<recipe.rank)continue;
  const rows=[...recipe.uses.map(([id,dir,qty])=>({
   ep:'EP_CONSUME_ITEM',id,dir,qty})),{
   ep:'EP_ADDITION_ITEM',id:recipe.out[0],dir:recipe.out[1],qty:recipe.out[2]}];
  const equal=(f,x)=>f?.ep===x.ep&&f.dir===x.dir&&
   Array.isArray(f.fv1)&&f.fv1.length===4&&
   f.fv1.every((n,i)=>n===(i===3?x.id:0))&&
   Array.isArray(f.fv2)&&f.fv2.length===4&&
   f.fv2.every((n,i)=>n===(i===3?x.qty:0));
  // All source IDs, directions, quantities and the number of effects
  // must match. A mutated/extended recipe must not show a partial result.
  if(skill.funcs.length!==rows.length||!rows.every((x,i)=>equal(skill.funcs[i],x))){
   out.rejected.push(recipe.id);continue;
  }
  const rank=branchMasteries?.[recipe.branch];
  const legal=Number.isSafeInteger(rank)&&rank>=0&&rank<=cap;
  const ready=legal&&rank>=recipe.rank;
  out.rows.push({id:skill.id,name:skill.name,
   uses:recipe.uses.map(([id,,quantity])=>({id,quantity})),
   produces:{id:recipe.out[0],quantity:recipe.out[2]},
   requirementsMet:ready,ingredientsChecked:false,
   reasonRu:ready?'':legal?'Нужно мастерство «'+
    (branchLabels?.[recipe.branch]||recipe.branch)+'»: '+recipe.rank:
    'Мастерство выходит за пределы профессии',
   reasonEn:ready?'':legal?'Requires '+
    (englishBranches?.[recipe.branch]||recipe.branch)+' mastery: '+recipe.rank:
    'Mastery exceeds the class limit',sourceOnly:true});
 }
 return out;
}
// Exact OS trap item costs; never infer trigger probability or damage.
const trapSkillCostSources=Object.freeze([
 [240001001,16,1,240001050,true],
 [240002001,26,1,240002050,true],
 [240005001,41,2,240005002,false],
 [240008001,71,1,240008002,true],
 [240010001,61,1,240010002,true]
]);
// Current OS triggered trap actions, matched as complete source vectors.
// These are descriptions of source effects, NOT proven activation odds,
// final damage, duration or a server resistance roll.
const trapOutcomeProofs=Object.freeze({
 "240001001": {
  "ru": "Ограничение движения цели",
  "en": "Restricts target movement",
  "resistanceKey": null,
  "nodes": [
   {
    "id": 240001050,
    "branch": "trap",
    "skillType": "CIRCLE",
    "funcs": [
     {
      "ep": "EP_DONT_MOVE",
      "dir": "TARGET",
      "fv1": [
       20,
       0,
       0,
       10
      ],
      "fv2": [
       0,
       0,
       0,
       0
      ]
     },
     {
      "ep": "EP_LOST_MAPCHANGE",
      "dir": "CASTER",
      "fv1": [
       0,
       0,
       0,
       0
      ],
      "fv2": [
       0,
       0,
       0,
       0
      ]
     }
    ]
   }
  ]
 },
 "240002001": {
  "ru": "Стихийный урон и отталкивание",
  "en": "Elemental damage and knockback",
  "resistanceKey": "knockback",
  "nodes": [
   {
    "id": 240002050,
    "branch": "trap",
    "skillType": "CIRCLE",
    "funcs": [
     {
      "ep": "EP_ELEMENT_DAMAGE",
      "dir": "TARGET",
      "fv1": [
       350,
       100,
       70,
       50
      ],
      "fv2": [
       0,
       0,
       0,
       0
      ]
     },
     {
      "ep": "EP_CAUSE_KNOCKBACK",
      "dir": "TARGET",
      "fv1": [
       0,
       0,
       0,
       200
      ],
      "fv2": [
       0,
       0,
       0,
       1
      ]
     }
    ]
   }
  ]
 },
 "240005001": {
  "ru": "Стихийный урон",
  "en": "Elemental damage",
  "resistanceKey": null,
  "nodes": [
   {
    "id": 240005002,
    "branch": "trap",
    "skillType": "BOLT",
    "funcs": [
     {
      "ep": "EP_SKILL_EXEC",
      "dir": "TARGET",
      "fv1": [
       0,
       0,
       0,
       240005003
      ],
      "fv2": [
       0,
       0,
       0,
       0
      ]
     }
    ]
   },
   {
    "id": 240005003,
    "branch": "trap",
    "skillType": "SPHERE",
    "funcs": [
     {
      "ep": "EP_ELEMENT_DAMAGE",
      "dir": "TARGET",
      "fv1": [
       680,
       0,
       350,
       155
      ],
      "fv2": [
       0,
       0,
       0,
       0
      ]
     }
    ]
   }
  ]
 },
 "240008001": {
  "ru": "Уменьшение ОМ цели",
  "en": "Reduces target MP",
  "resistanceKey": null,
  "nodes": [
   {
    "id": 240008002,
    "branch": "trap",
    "skillType": "CIRCLE",
    "funcs": [
     {
      "ep": "EP_LOSSMANA_MAXMANA",
      "dir": "TARGET",
      "fv1": [
       0,
       0,
       80,
       30
      ],
      "fv2": [
       0,
       0,
       0,
       0
      ]
     }
    ]
   }
  ]
 },
 "240010001": {
  "ru": "Ограничение движения и создание препятствия",
  "en": "Restricts movement and creates an obstacle",
  "resistanceKey": null,
  "nodes": [
   {
    "id": 240010002,
    "branch": "trap",
    "skillType": "CIRCLE",
    "funcs": [
     {
      "ep": "EP_SKILL_EXEC",
      "dir": "TARGET",
      "fv1": [
       0,
       0,
       0,
       240010003
      ],
      "fv2": [
       0,
       0,
       0,
       0
      ]
     },
     {
      "ep": "EP_DONT_MOVE",
      "dir": "TARGET",
      "fv1": [
       0,
       0,
       0,
       1
      ],
      "fv2": [
       0,
       0,
       0,
       0
      ]
     }
    ]
   },
   {
    "id": 240010003,
    "branch": "embody",
    "skillType": "POINT",
    "funcs": [
     {
      "ep": "EP_POP_MAPOBJ_ROUND",
      "dir": "TARGET",
      "fv1": [
       0,
       0,
       0,
       1001
      ],
      "fv2": [
       3000,
       0,
       3000,
       2000
      ]
     },
     {
      "ep": "EP_POP_MAPOBJ_ROUND",
      "dir": "TARGET",
      "fv1": [
       0,
       0,
       0,
       1001
      ],
      "fv2": [
       3000,
       0,
       3000,
       2000
      ]
     },
     {
      "ep": "EP_POP_MAPOBJ_ROUND",
      "dir": "TARGET",
      "fv1": [
       0,
       0,
       0,
       1001
      ],
      "fv2": [
       3000,
       0,
       3000,
       2000
      ]
     },
     {
      "ep": "EP_POP_MAPOBJ_ROUND",
      "dir": "TARGET",
      "fv1": [
       0,
       0,
       0,
       1001
      ],
      "fv2": [
       3000,
       0,
       3000,
       2000
      ]
     }
    ]
   }
  ]
 }
});
function trapOutcomeMatches(catalog,root,proof){
 if(!proof||!Array.isArray(proof.nodes))return false;
 return proof.nodes.every(p=>{
  const s=catalog[String(p.id)];
  return s?.id===p.id&&s.name===root.name&&s.learnable===false&&
   s.prereq===null&&s.charLevel===0&&s.branch===p.branch&&
   s.skillType===p.skillType&&Array.isArray(s.reqs)&&s.reqs.length===0&&
   Array.isArray(s.funcs)&&s.funcs.length===p.funcs.length&&
   p.funcs.every((expected,i)=>{
    const got=s.funcs[i];
    return got?.ep===expected.ep&&got.dir===expected.dir&&
     Array.isArray(got.fv1)&&got.fv1.length===4&&
     got.fv1.every((v,j)=>v===expected.fv1[j])&&
     Array.isArray(got.fv2)&&got.fv2.length===4&&
     got.fv2.every((v,j)=>v===expected.fv2[j]);
   });
 });
}

/* A distinct nonlearnable level-50 source record, not a verified
   automatic replacement for the regular Plant Mine. */
function trapLevel50Source({catalog,root,jobKey,level,rank,cap,same,make}){
 if(root?.id!==240002001||jobKey!=='DISTURBANCE')return null;
 const variant=catalog['240002002'],child=catalog['240002051'];
 const expected=[
  make('EP_CONSUME_ITEM','CASTER',65007,1),
  make('EP_SKILL_EXEC','TARGET',240002051,0),
  make('EP_CANCEL_TRAP','CASTER',240002050,0)
 ];
 const effects=[
  {ep:'EP_ELEMENT_DAMAGE',dir:'TARGET',fv1:[450,100,300,50],fv2:[0,0,0,0]},
  {ep:'EP_CAUSE_KNOCKBACK',dir:'TARGET',fv1:[0,0,0,200],fv2:[0,0,0,1]}
 ];
 if(variant?.id!==240002002||variant.name!==root.name||
  variant.skillType!=='POINT'||variant.learnable!==false||
  variant.prereq!==root.id||variant.charLevel!==50||
  variant.branch!=='trap'||variant.reqLevel!==26||
  variant.classes?.DISTURBANCE!==1||
  Object.keys(variant.classes||{}).length!==1||
  !Array.isArray(variant.reqs)||variant.reqs.length!==1||
  variant.reqs[0]?.branch!=='trap'||variant.reqs[0]?.amount!==26||
  variant.mana!==root.mana||variant.cast!==root.cast||
  variant.cooldown!==root.cooldown||variant.motion!==root.motion||
  variant.range!==root.range||variant.rangeFromWeapon!==root.rangeFromWeapon||
  !Array.isArray(variant.aoe)||!Array.isArray(root.aoe)||
  variant.aoe.length!==root.aoe.length||
  variant.aoe.some((v,i)=>v!==root.aoe[i])||
  !Array.isArray(variant.funcs)||variant.funcs.length!==expected.length||
  !expected.every((row,i)=>same(variant.funcs[i],row))||
  child?.id!==240002051||child.name!==root.name||
  child.skillType!=='CIRCLE'||child.learnable!==false||
  child.branch!=='trap'||child.charLevel!==0||child.prereq!==null||
  !Array.isArray(child.reqs)||child.reqs.length!==0||
  !Array.isArray(child.aoe)||child.aoe.length!==2||
  child.aoe[0]!==200||child.aoe[1]!==500||
  child.damage?.kernel!=='element'||child.damage?.slotIndex!==0||
  !Array.isArray(child.funcs)||child.funcs.length!==effects.length||
  !effects.every((row,i)=>same(child.funcs[i],row)))return null;
 return {requiredLevel:50,levelMet:level>=50,masteryMet:
  Number.isSafeInteger(rank)&&Number.isSafeInteger(cap)&&rank>=26&&rank<=cap,
  itemCount:1,linkedEffectId:240002051,
  sourceEffectRu:'Более сильный стихийный удар; отталкивание остаётся',
  sourceEffectEn:'Stronger elemental attack; knockback remains',
  activationVerified:false,damageVerified:false,sourceOnly:true};
}
function trapSkillCostPreview({skillCatalog=null,jobKey=null,level=1,
 branchCaps={},branchMasteries={},branchLabels={},englishBranches={}}={}){
 const result={rows:[],rejected:[],verified:false,
  source:'Current OS trap material costs; damage, inventory and activation unverified'};
 if(!skillCatalog||typeof jobKey!=='string'||!Number.isSafeInteger(level)||
  level<1||level>55)return result;
 const make=(ep,dir,id,n)=>({ep,dir,fv1:[0,0,0,id],fv2:[0,0,0,n]});
 const same=(f,x)=>f?.ep===x.ep&&f.dir===x.dir&&
  Array.isArray(f.fv1)&&f.fv1.length===4&&f.fv1.every((v,i)=>v===x.fv1[i])&&
  Array.isArray(f.fv2)&&f.fv2.length===4&&f.fv2.every((v,i)=>v===x.fv2[i]);
 // The linked effect must itself pass the strict full-source graph audit.
 const chains=skillExecutionChains({skillCatalog,jobKey,level,branchCaps,
  branchMasteries,branchLabels,englishBranches});
 for(const [id,required,count,childId,cancel] of trapSkillCostSources){
  const record=skillCatalog[String(id)],cap=branchCaps?.trap;
  if(record?.id!==id||record.learnable!==true||record.skillType!=='POINT'||
   record.branch!=='trap'||record.prereq!==null||record.charLevel!==0||
   !record.classes?.[jobKey]||!Array.isArray(record.reqs)||
   record.reqs.length!==1||record.reqs[0]?.branch!=='trap'||
   record.reqs[0]?.amount!==required||
   !Number.isSafeInteger(cap)||cap<required)continue;
  const expected=[
   make('EP_CONSUME_ITEM','CASTER',65007,count),
   make('EP_SKILL_EXEC','TARGET',childId,0),
   ...(cancel?[make('EP_CANCEL_TRAP','CASTER',childId,0)]:[])
  ];
  const child=skillCatalog[String(childId)];
  const path=chains.rows.find(x=>x.id===id);
  if(!Array.isArray(record.funcs)||record.funcs.length!==expected.length||
   !expected.every((x,i)=>same(record.funcs[i],x))||
   child?.id!==childId||child.name!==record.name||
   !path||!path.paths.some(p=>p[1]===childId)||
   !trapOutcomeMatches(skillCatalog,record,trapOutcomeProofs[id])){
   result.rejected.push(id);continue;
  }
  const rank=branchMasteries?.trap;
  const legal=Number.isSafeInteger(rank)&&rank>=0&&rank<=cap;
  const ready=legal&&rank>=required;
  const level50Variant=trapLevel50Source({
   catalog:skillCatalog,root:record,jobKey,level,rank,cap,same,make});
  result.rows.push({id,name:record.name,itemId:65007,count,
   linkedEffectId:childId,requirementsMet:ready,
   ...(level50Variant?{level50Variant}:{}),
   sourceEffectRu:trapOutcomeProofs[id].ru,
   sourceEffectEn:trapOutcomeProofs[id].en,
   statusResistanceKey:trapOutcomeProofs[id].resistanceKey,
   inventoryChecked:false,sourceOnly:true,
   reasonRu:ready?'':legal?'Нужно мастерство «'+
    (branchLabels?.trap||'Ловушки')+'»: '+required:
    'Мастерство выходит за пределы профессии',
   reasonEn:ready?'':legal?'Requires '+
    (englishBranches?.trap||'Trap')+' mastery: '+required:
    'Mastery exceeds the class limit'});
 }
 return result;
}
// Four source-verified target effects. They do NOT modify hero's own
// attack, defense, accuracy or MP and are not final target-side formulas.
const enemyDebuffJobs=Object.freeze(["WARRIOR","GLADIATOR","KNIGHT","JUGGERNAUT","DRAGOON","GENERAL","PALADIN","SCOUT","ARCHER","AGENT","SNIPER","PREDATOR","ASSASSIN","DISTURBANCE","ACOLYTE","PRIEST","ASCETIC","CLERIC","ENCHANTER","MONK","EXORCIST","MAGE","WIZARD","DARKROAR","WARLOCK","CONJURER","JESTER","CALAMITY"]);
const enemyDebuffProofs=Object.freeze([{"id":440001001,"branch":"charm","rank":8,"element":"CHARM","stat":"SPI","ru":"Уменьшает силу атаки противника","en":"Reduces the enemy's attack strength","noteRu":"Величина ослабления зависит от Чар и СД. Точный итог на цели пока неизвестен.","noteEn":"The weakening depends on Confusion mastery and Spirit. Final target effect is not known yet.","effects":[["EP_DAMAGERATE_SCALE","TARGET",[-10,0,-10,-30],[0,0,0,0]],["EP_DAMAGERATE_CONST","TARGET",[-10,0,-10,-30],[0,0,0,0]]]},{"id":440007001,"branch":"charm","rank":26,"element":"CHARM","stat":"SPI","ru":"Уменьшает защиту противника","en":"Reduces the enemy's defense","noteRu":"На защиту влияют два разных эффекта умения. Точное итоговое снижение неизвестно.","noteEn":"Two distinct skill effects affect defense. The exact final reduction is unknown.","effects":[["EP_ARMORCLASS_CONST","TARGET",[0,0,0,-25],[0,0,0,0]],["EP_ARMORCLASS_SCALE","TARGET",[0,0,-25,-25],[0,0,0,0]]]},{"id":260004001,"branch":"warding","rank":21,"element":"NONE","stat":"AGI","ru":"Уменьшает точность противника","en":"Reduces the enemy's accuracy","noteRu":"Сила ослабления зависит от мастерства «Уклонение». Точное значение на цели неизвестно.","noteEn":"The effect depends on Evasion mastery. The exact change on the target is unknown.","effects":[["EP_TOHIT_CONST","TARGET",[0,0,-50,-30],[0,0,0,0]]]},{"id":440005001,"branch":"charm","rank":21,"element":"CHARM","stat":"SPI","ru":"Уменьшает ОМ противника","en":"Reduces the enemy's MP","noteRu":"Умение воздействует на ОМ цели. Точное количество потерянных ОМ пока неизвестно.","noteEn":"The skill affects the target's MP. The exact amount of MP lost is not known yet.","effects":[["EP_MINDDAMAGE","TARGET",[70,10,40,15],[0,0,0,0]]]}]);
function enemyDebuffPreview({skillCatalog=null,jobKey=null,level=1,
 branchMasteries={},branchCaps={},branchLabels={},englishBranches={}}={}){
 const out={rows:[],rejected:[],verified:false,targetSideOnly:true};
 if(!skillCatalog||!enemyDebuffJobs.includes(jobKey)||
  !Number.isSafeInteger(level)||level<1||level>55)return out;
 for(const proof of enemyDebuffProofs){
  const cap=branchCaps?.[proof.branch];
  if(!Number.isSafeInteger(cap)||cap<proof.rank)continue;
  const skill=skillCatalog[String(proof.id)];
  const classes=skill?.classes||{};
  const valid=skill?.id===proof.id&&skill.learnable===true&&
   skill.prereq===null&&skill.skillType==='ENEMY'&&
   skill.branch===proof.branch&&skill.element===proof.element&&
   skill.powerStat===proof.stat&&skill.charLevel===0&&
   skill.isLevelBased===false&&skill.reqLevel===proof.rank&&
   skill.rangeFromWeapon===false&&skill.weaponUse===null&&
   skill.damage===null&&classes[jobKey]===1&&
   Object.keys(classes).length===enemyDebuffJobs.length&&
   enemyDebuffJobs.every(job=>classes[job]===1)&&
   Array.isArray(skill.reqs)&&skill.reqs.length===1&&
   skill.reqs[0]?.branch===proof.branch&&
   skill.reqs[0]?.amount===proof.rank&&
   Array.isArray(skill.funcs)&&skill.funcs.length===proof.effects.length&&
   proof.effects.every(([ep,dir,fv1,fv2],i)=>{
    const f=skill.funcs[i];
    return f?.ep===ep&&f.dir===dir&&Array.isArray(f.fv1)&&
     f.fv1.length===4&&f.fv1.every((n,j)=>n===fv1[j])&&
     Array.isArray(f.fv2)&&f.fv2.length===4&&
     f.fv2.every((n,j)=>n===fv2[j]);
   });
  if(!valid){out.rejected.push(proof.id);continue}
  const mastery=branchMasteries?.[proof.branch];
  const legal=Number.isSafeInteger(mastery)&&mastery>=0&&mastery<=cap;
  const ready=legal&&mastery>=proof.rank;
  const labelRu=branchLabels?.[proof.branch]||'Мастерство';
  const labelEn=englishBranches?.[proof.branch]||labelRu;
  out.rows.push({id:proof.id,name:skill.name,description:skill.desc||'',
   summaryRu:proof.ru,summaryEn:proof.en,
   noteRu:proof.noteRu,noteEn:proof.noteEn,
   requirementsMet:ready,
   reasonRu:ready?'':legal?'Нужно мастерство «'+labelRu+'»: '+proof.rank:
    'Мастерство выходит за пределы профессии',
   reasonEn:ready?'':legal?'Requires '+labelEn+' mastery: '+proof.rank:
    'Mastery exceeds the class limit',
   sourceOnly:true,targetSideOnly:true,
   finalAmount:null,appliedToHero:false});
 }
 return out;
}
// Six pinned learnable OS roots with state effects: descriptions only,
// never guaranteed status chance, duration, target mitigation or damage.
const statusApplicationProofs=Object.freeze([{"id":142501101,"type":"RADIATION","branch":"blow","level":0,"reqs":[["blow",41],["exorcism",21]],"status":["Оглушение","Stun","stun"],"blocking":false,"funcs":[["EP_CAUSE_STUN","TARGET",[0,0,0,4],[30,0,50,30]]]},{"id":168005001,"type":"ENEMY","branch":"defense","level":0,"reqs":[["defense",31]],"status":["Падение","Knockdown","tumble"],"blocking":true,"funcs":[["EP_CANCEL_BLOCKING","CASTER",[0,0,0,0],[0,0,0,0]],["EP_CAUSE_TUMBLE","TARGET",[0,0,0,3],[0,0,0,75]],["EP_SKILL_EXEC","TARGET",[0,0,0,168005050],[0,0,0,0]],["EP_SKILL_MARCH","CASTER",[0,0,0,500],[0,0,0,0]]]},{"id":410013001,"type":"ENEMY","branch":"charm","level":0,"reqs":[["charm",41]],"status":["Заморозка","Freeze","numb"],"blocking":false,"funcs":[["EP_CAUSE_NUMB","TARGET",[0,0,0,15],[40,0,40,50]]]},{"id":410021001,"type":"ENEMY","branch":"element","level":12,"reqs":[],"status":["Падение","Knockdown","tumble"],"blocking":false,"funcs":[["EP_ELEMENT_DAMAGE","TARGET",[40,30,70,22],[0,0,0,0]],["EP_CAUSE_TUMBLE","TARGET",[0,0,0,2],[0,0,0,100]]]},{"id":420003001,"type":"ENEMY","branch":"charm","level":0,"reqs":[["charm",12]],"status":["Сон","Sleep","sleep"],"blocking":false,"funcs":[["EP_ELEMENT_DAMAGE","TARGET",[40,30,70,27],[0,0,0,0]],["EP_CAUSE_SLEEP","TARGET",[0,0,0,20],[40,0,40,40]]]},{"id":430052001,"type":"ENEMY","branch":"darkness","level":0,"reqs":[["darkness",8]],"status":["Яд","Poison",null],"blocking":false,"funcs":[["EP_ELEMENT_DAMAGE","TARGET",[5,0,5,15],[0,0,0,0]],["EP_CAUSE_POISON","TARGET",[180,0,180,40],[0,0,30,70]]]}]);
function statusApplicationPreview({skillCatalog=null,jobKey=null,level=1,
 branchMasteries={},branchCaps={},branchLabels={},englishBranches={}}={}){
 const out={rows:[],rejected:[],verified:false};
 if(!skillCatalog||typeof jobKey!=='string'||!Number.isSafeInteger(level)||level<1||level>55)return out;
 for(const proof of statusApplicationProofs){
  const s=skillCatalog[String(proof.id)];
  if(s?.id!==proof.id||s.learnable!==true||s.prereq!==null||
   s.skillType!==proof.type||s.branch!==proof.branch||s.charLevel!==proof.level||
   !s.classes?.[jobKey]||!Array.isArray(s.reqs)||s.reqs.length!==proof.reqs.length||
   !proof.reqs.every(([branch,amount],i)=>s.reqs[i]?.branch===branch&&s.reqs[i]?.amount===amount)||
   proof.reqs.some(([branch,amount])=>!Number.isSafeInteger(branchCaps?.[branch])||branchCaps[branch]<amount))continue;
  const valid=Array.isArray(s.funcs)&&s.funcs.length===proof.funcs.length&&
   proof.funcs.every((fv,i)=>{
    const f=s.funcs[i];
    return f?.ep===fv[0]&&f.dir===fv[1]&&
     Array.isArray(f.fv1)&&f.fv1.length===4&&f.fv1.every((x,j)=>x===fv[2][j])&&
     Array.isArray(f.fv2)&&f.fv2.length===4&&f.fv2.every((x,j)=>x===fv[3][j]);
   });
  if(!valid){out.rejected.push(proof.id);continue;}
  const reasonRu=[],reasonEn=[];
  if(level<proof.level){reasonRu.push('Требуется уровень '+proof.level);reasonEn.push('Requires level '+proof.level);}
  for(const [branch,amount] of proof.reqs){
   const rank=branchMasteries?.[branch],cap=branchCaps?.[branch];
   if(Number.isSafeInteger(rank)&&rank>=amount&&rank<=cap)continue;
   reasonRu.push('Нужно мастерство «'+(branchLabels?.[branch]||branch)+'»: '+amount);
   reasonEn.push('Requires '+(englishBranches?.[branch]||branch)+' mastery: '+amount);
  }
  out.rows.push({id:proof.id,name:s.name,description:s.desc||'',
   linkedStatus:{ru:proof.status[0],en:proof.status[1],key:proof.status[2]},
   requiresBlocking:proof.blocking,requirementsMet:reasonRu.length===0,
   reasonRu:reasonRu.join(' · '),reasonEn:reasonEn.join(' · '),
   sourceOnly:true,targetSideOnly:true});
 }
 return out;
}
// Complex element attacks and status cures without invented damage or odds.
// Full source signature is intentionally pinned to current OS records:
// different FV1[1] and state effects cannot use the simple spell kernel.
const complexSkillSources=Object.freeze([
 {id:330001001,kind:'elemental',type:'BOLT',branch:'exorcism',level:0,
  reqs:[['exorcism',8]],effects:[['EP_ELEMENT_DAMAGE','TARGET',[120,50,30,15],[0,0,0,0]]]},
 {id:410011001,kind:'elemental',type:'BOLT',branch:'element',level:0,
  reqs:[['element',8]],effects:[
   ['EP_ELEMENT_DAMAGE','TARGET',[60,30,30,14],[0,0,0,0]],
   ['EP_CAUSE_NUMB','TARGET',[0,0,0,4],[0,0,0,100]]]},
 {id:410012001,kind:'elemental',type:'BOLT',branch:'element',level:0,
  reqs:[['element',21]],effects:[
   ['EP_ELEMENT_DAMAGE','TARGET',[250,30,30,55],[0,0,0,0]],
   ['EP_CAUSE_NUMB','TARGET',[0,0,0,7],[0,0,0,200]]]},
 {id:410023001,kind:'elemental',type:'ENEMY',branch:'element',level:20,
  reqs:[],effects:[['EP_ELEMENT_DAMAGE','TARGET',[250,10,250,20],[0,0,0,0]]]},
 {id:300004001,kind:'dispel',type:'ALLY',branch:'benevolence',level:0,
  reqs:[['benevolence',35]],effects:[['EP_REMOVE_BAD_EFFECT','TARGET',[0,0,0,0],[0,0,0,0]]]},
 {id:330003001,kind:'dispel',type:'ALLY',branch:'exorcism',level:0,
  reqs:[['exorcism',41]],effects:[['EP_REMOVE_BAD_EFFECT','TARGET',[0,0,100,0],[0,0,0,15]]]}
]);
function complexSkillSourcePreview({skillCatalog=null,jobKey=null,level=1,
 branchMasteries={},branchCaps={},branchLabels={},englishBranches={}}={}){
 const out={rows:[],rejected:[],verified:false,
  source:'current OS skill effects; not proven final server spell damage'};
 if(!skillCatalog||typeof jobKey!=='string'||!Number.isSafeInteger(level)||
  level<1||level>55)return out;
 const fits=(actual,ref)=>actual?.ep===ref[0]&&actual.dir===ref[1]&&
  Array.isArray(actual.fv1)&&actual.fv1.length===4&&
  actual.fv1.every((v,i)=>v===ref[2][i])&&
  Array.isArray(actual.fv2)&&actual.fv2.length===4&&
  actual.fv2.every((v,i)=>v===ref[3][i]);
 for(const ref of complexSkillSources){
  const r=skillCatalog[String(ref.id)];
  if(r?.id!==ref.id||r.learnable!==true||r.skillType!==ref.type||
   r.branch!==ref.branch||r.prereq!==null||r.charLevel!==ref.level||
   !r.classes?.[jobKey]||!Array.isArray(r.reqs)||
   r.reqs.length!==ref.reqs.length||
   !ref.reqs.every(([branch,amount],i)=>r.reqs[i]?.branch===branch&&
    r.reqs[i]?.amount===amount))continue;
  if(ref.reqs.some(([branch,amount])=>
   !Number.isSafeInteger(branchCaps?.[branch])||
   branchCaps[branch]<amount))continue;
  if(!Array.isArray(r.funcs)||r.funcs.length!==ref.effects.length||
   !ref.effects.every((effect,i)=>fits(r.funcs[i],effect))){
   out.rejected.push(ref.id);continue;
  }
  const ru=[],en=[];
  if(level<ref.level){ru.push('Нужен уровень '+ref.level);en.push('Requires level '+ref.level);}
  for(const [branch,amount] of ref.reqs){
   const rank=branchMasteries?.[branch],cap=branchCaps?.[branch];
   if(Number.isSafeInteger(rank)&&rank>=amount&&rank<=cap)continue;
   ru.push('Нужно мастерство «'+(branchLabels?.[branch]||branch)+'»: '+amount);
   en.push('Requires '+(englishBranches?.[branch]||branch)+' mastery: '+amount);
  }
  out.rows.push({id:ref.id,name:r.name,description:r.desc||'',
   kind:ref.kind,hasSecondaryEffect:ref.effects.length>1,
   sourceEffects:ref.effects.map(x=>x[0]),sourceOnly:true,
   linkedStatus:ref.effects.some(x=>x[0]==='EP_CAUSE_NUMB')?
    {key:'numb',ru:'Заморозка',en:'Freeze'}:null,
   requirementsMet:ru.length===0,
   reasonRu:ru.join(' · '),reasonEn:en.join(' · ')});
 }
 return out;
}

 // Six source-pinned tactical abilities: these are not final server outcomes.
 function sourceVerifiedSkillSignature(s){
  return {
   skillType:s?.skillType??null,element:s?.element??null,learnable:s?.learnable===true,
   mana:s?.mana??null,cast:s?.cast??null,cooldown:s?.cooldown??null,motion:s?.motion??null,
   range:s?.range??null,rangeFromWeapon:s?.rangeFromWeapon===true,aoe:s?.aoe??null,
   branch:s?.branch??null,reqLevel:s?.reqLevel??null,charLevel:s?.charLevel??null,
   isLevelBased:s?.isLevelBased===true,prereq:s?.prereq??null,powerStat:s?.powerStat??null,
   classes:Object.entries(s?.classes||{}).filter(([,v])=>v===1).map(([k])=>k).sort(),
   reqs:Array.isArray(s?.reqs)?s.reqs.map(x=>[x.branch,x.amount]):null,
   funcs:Array.isArray(s?.funcs)?s.funcs.map(f=>[f.ep,f.dir,f.fv1,f.fv2]):null,
   damage:s?.damage??null,weaponUse:s?.weaponUse??null
  };
 }
 const tacticalSkillProofs=Object.freeze([{"id":100000501,"signature":{"skillType":"ENEMY","element":null,"learnable":true,"mana":10,"cast":0,"cooldown":15,"motion":0,"range":2500,"rangeFromWeapon":false,"aoe":[0,0],"branch":"martial","reqLevel":0,"charLevel":5,"isLevelBased":true,"prereq":null,"powerStat":"STR","classes":["DRAGOON","GENERAL","GLADIATOR","JUGGERNAUT","KNIGHT","PALADIN","WARRIOR"],"reqs":[],"funcs":[["EP_SKILL_TARGET_ATTENTION","TARGET",[0,0,0,1],[0,0,0,100]]],"damage":null,"weaponUse":null}},{"id":100001001,"signature":{"skillType":"ENEMY","element":null,"learnable":true,"mana":12,"cast":0,"cooldown":10,"motion":0,"range":2500,"rangeFromWeapon":false,"aoe":[0,0],"branch":"martial","reqLevel":0,"charLevel":20,"isLevelBased":true,"prereq":null,"powerStat":"STR","classes":["GENERAL","KNIGHT","PALADIN"],"reqs":[],"funcs":[["EP_SKILL_TARGET_ATTENTION","TARGET",[0,0,0,10],[0,0,0,100]]],"damage":null,"weaponUse":null}},{"id":100002001,"signature":{"skillType":"PARTY_SINGLE","element":null,"learnable":true,"mana":16,"cast":4,"cooldown":10,"motion":0,"range":2000,"rangeFromWeapon":false,"aoe":[0,0],"branch":"defense","reqLevel":54,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"STR","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["defense",54]],"funcs":[["EP_SKILL_SUBSTITUTE","TARGET",[0,0,0,2000],[0,0,0,0]],["EP_LOST_DIST","TARGET",[0,0,0,2000],[0,0,0,0]],["EP_LOST_DIST_CASTER","CASTER",[0,0,0,2000],[0,0,0,0]],["EP_LOST_MAPCHANGE","TARGET",[0,0,0,0],[0,0,0,0]],["EP_LOST_EFFECT","TARGET",[0,0,0,0],[0,0,0,0]],["EP_CANCEL_IDENTITY","TARGET",[0,0,0,0],[0,0,0,0]]],"damage":null,"weaponUse":null}},{"id":100002002,"signature":{"skillType":"PARTY_SINGLE","element":null,"learnable":true,"mana":16,"cast":4,"cooldown":0.5,"motion":0,"range":2500,"rangeFromWeapon":false,"aoe":[0,0],"branch":"defense","reqLevel":54,"charLevel":50,"isLevelBased":false,"prereq":100002001,"powerStat":"STR","classes":["GENERAL"],"reqs":[["defense",54]],"funcs":[["EP_SKILL_SUBSTITUTE","TARGET",[0,0,0,2500],[0,0,0,0]],["EP_LOST_DIST","TARGET",[0,0,0,2500],[0,0,0,0]],["EP_LOST_DIST_CASTER","CASTER",[0,0,0,2500],[0,0,0,0]],["EP_LOST_MAPCHANGE","TARGET",[0,0,0,0],[0,0,0,0]],["EP_LOST_EFFECT","TARGET",[0,0,0,0],[0,0,0,0]],["EP_CANCEL_IDENTITY","TARGET",[0,0,0,0],[0,0,0,0]]],"damage":null,"weaponUse":null}},{"id":420006001,"signature":{"skillType":"POINT","element":null,"learnable":true,"mana":79,"cast":5,"cooldown":120,"motion":1.5,"range":300,"rangeFromWeapon":false,"aoe":[0,0],"branch":"embody","reqLevel":50,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"INT","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["embody",50]],"funcs":[["EP_POP_MAPOBJ","TARGET",[0,0,0,1000],[3000,0,3000,2000]]],"damage":null,"weaponUse":null}},{"id":420006002,"signature":{"skillType":"POINT","element":null,"learnable":true,"mana":79,"cast":5,"cooldown":20,"motion":1.5,"range":300,"rangeFromWeapon":false,"aoe":[0,0],"branch":"embody","reqLevel":50,"charLevel":50,"isLevelBased":false,"prereq":420006001,"powerStat":"INT","classes":["CONJURER"],"reqs":[["embody",50]],"funcs":[["EP_POP_MAPOBJ","TARGET",[0,0,0,1000],[3000,0,3000,2000]]],"damage":null,"weaponUse":null}}]);
 function tacticalSkillPreview({skillCatalog=null,jobKey=null,level=1,
  branchMasteries={},branchCaps={},branchLabels={},englishBranches={}}={}){
  const out={rows:[],rejected:[],verified:false,sourceOnly:true};
  if(!skillCatalog||typeof jobKey!=='string'||!Number.isSafeInteger(level)||
   level<1||level>55)return out;
  for(const proof of tacticalSkillProofs){
   if(!proof.signature.classes.includes(jobKey))continue;
   const skill=skillCatalog[String(proof.id)];
   const parent=proof.signature.prereq&&tacticalSkillProofs.find(
    x=>x.id===proof.signature.prereq);
   if(!skill||skill.id!==proof.id||
    JSON.stringify(sourceVerifiedSkillSignature(skill))!==JSON.stringify(proof.signature)||
    (parent&&JSON.stringify(sourceVerifiedSkillSignature(
     skillCatalog[String(parent.id)]))!==JSON.stringify(parent.signature))){
    out.rejected.push(proof.id);continue;
   }
   if(proof.signature.reqs.some(([branch,amount])=>
    !Number.isSafeInteger(branchCaps?.[branch])||branchCaps[branch]<amount))continue;
   const ru=[],en=[];
   if(level<skill.charLevel){
    ru.push('Нужен уровень '+skill.charLevel);
    en.push('Requires level '+skill.charLevel);
   }
   for(const [branch,amount] of proof.signature.reqs){
    const rank=branchMasteries?.[branch],cap=branchCaps?.[branch];
    if(Number.isSafeInteger(rank)&&rank>=amount&&rank<=cap)continue;
    ru.push('Нужно мастерство «'+(branchLabels?.[branch]||branch)+'»: '+amount);
    en.push('Requires '+(englishBranches?.[branch]||branch)+' mastery: '+amount);
   }
   out.rows.push({id:proof.id,name:skill.name,description:skill.desc||'',
    mana:skill.mana,cooldown:skill.cooldown,prerequisiteId:skill.prereq,
    requirementsMet:ru.length===0,reasonRu:ru.join(' · '),reasonEn:en.join(' · '),
    sourceOnly:true,finalAmount:null,appliedToHero:false});
  }
  return out;
 }

 // Bow-only OS ammunition sources. Count is a catalog parameter, not an
 // inventory deduction or a final target-hit calculation.
 const rangedAmmoProofs=Object.freeze([{"id":213603002,"root":{"skillType":"ENEMY","element":"NONE","learnable":true,"mana":32,"cast":2,"cooldown":10,"motion":1,"range":5000,"rangeFromWeapon":false,"aoe":[0,0],"branch":"archery","reqLevel":61,"charLevel":0,"isLevelBased":false,"prereq":213603001,"powerStat":"DEX","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["archery",61]],"funcs":[["EP_SKILL_EXEC","TARGET",[0,0,0,213603003],[0,0,0,0]],["EP_CONSUME_AMMO","CASTER",[0,0,0,0],[0,0,0,1]]],"damage":null,"weaponUse":["BOW"]},"childId":213603003,"child":{"skillType":"SPHERE","element":"NONE","learnable":false,"mana":0,"cast":0,"cooldown":0,"motion":0,"range":5000,"rangeFromWeapon":false,"aoe":[600,0],"branch":"archery","reqLevel":0,"charLevel":0,"isLevelBased":true,"prereq":null,"powerStat":"DEX","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[],"funcs":[["EP_ONDAMAGE_FIN_DAMAGE_SCALE","TARGET",[0,0,30,-20],[0,0,0,0]],["EP_PLAYER_ATTACK2","TARGET",[0,0,0,1],[0,0,0,0]]],"damage":{"kernel":"physical","slotIndex":1},"weaponUse":["BOW"]},"parentId":213603001,"parent":{"skillType":"SPHERE","element":"NONE","learnable":true,"mana":15,"cast":1,"cooldown":5,"motion":1,"range":5000,"rangeFromWeapon":false,"aoe":[600,1],"branch":"archery","reqLevel":26,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"DEX","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["archery",26]],"funcs":[["EP_ONHIT_DAMAGE_SCALE","CASTER",[0,0,10,-20],[0,0,0,0]],["EP_PLAYER_ATTACK2","TARGET",[0,0,0,1],[0,0,0,0]],["EP_CONSUME_AMMO","CASTER",[0,0,0,0],[0,0,0,1]]],"damage":{"kernel":"physical","slotIndex":1},"weaponUse":["BOW"]},"noteRu":"Связанное действие поражает цель несколько раз. Точные число попаданий и урон не установлены.","noteEn":"The linked action can hit repeatedly. Final damage and number of hits are not confirmed."},{"id":213608001,"root":{"skillType":"POINT","element":"FIRE","learnable":true,"mana":41,"cast":1,"cooldown":15,"motion":1,"range":4000,"rangeFromWeapon":false,"aoe":[0,0],"branch":"archery","reqLevel":0,"charLevel":50,"isLevelBased":true,"prereq":null,"powerStat":"STR","classes":["SNIPER"],"reqs":[],"funcs":[["EP_SKILL_EXEC","TARGET",[0,0,0,213608002],[0,0,0,0]],["EP_CONSUME_AMMO","CASTER",[0,0,0,0],[0,0,0,1]]],"damage":null,"weaponUse":["BOW"]},"childId":213608002,"child":{"skillType":"SPHERE","element":"FIRE","learnable":false,"mana":0,"cast":0,"cooldown":0,"motion":0,"range":0,"rangeFromWeapon":false,"aoe":[400,1],"branch":"archery","reqLevel":0,"charLevel":0,"isLevelBased":true,"prereq":null,"powerStat":"STR","classes":[],"reqs":[],"funcs":[["EP_CAUSE_BURN","TARGET",[0,0,0,5],[0,0,0,100]],["EP_ELEMENT_DAMAGE","TARGET",[0,0,80,60],[0,0,0,0]]],"damage":{"kernel":"element","slotIndex":1},"weaponUse":["BOW"]},"parentId":null,"parent":null,"noteRu":"Связанное действие предусматривает огненное поражение и поджог. Итоговый урон и вероятность не установлены.","noteEn":"The linked action has fire damage and burning. Final damage and chance are not confirmed."},{"id":213700501,"root":{"skillType":"ENEMY","element":"NONE","learnable":true,"mana":18,"cast":0,"cooldown":30,"motion":0.8,"range":4000,"rangeFromWeapon":false,"aoe":[0,0],"branch":"archery","reqLevel":50,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"DEX","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["archery",50],["assassin",21]],"funcs":[["EP_SKILL_EXEC","TARGET",[0,0,0,213700550],[0,0,0,0]],["EP_CONSUME_AMMO","CASTER",[0,0,0,0],[0,0,0,1]]],"damage":null,"weaponUse":["BOW"]},"childId":213700550,"child":{"skillType":"BOLT","element":"NONE","learnable":false,"mana":0,"cast":0,"cooldown":0,"motion":0,"range":4000,"rangeFromWeapon":false,"aoe":[12000,4800],"branch":"archery","reqLevel":0,"charLevel":0,"isLevelBased":true,"prereq":null,"powerStat":"STR","classes":[],"reqs":[],"funcs":[["EP_ONHIT_KNOCKBACK","CASTER",[0,0,0,300],[0,0,0,100]],["EP_ONHIT_FIN_DAMAGE_SCALE","CASTER",[0,0,70,50],[0,0,0,0]],["EP_PLAYER_ATTACK2","TARGET",[0,0,0,1],[0,0,0,0]]],"damage":{"kernel":"physical","slotIndex":2},"weaponUse":null},"parentId":null,"parent":null,"noteRu":"Связанное действие предусматривает отталкивание при попадании. Итоговый урон и вероятность не установлены.","noteEn":"The linked action includes knockback on hit. Final damage and chance are not confirmed."}]);
 // Fully pinned current OS source records for standard and crossbow-only shots.
// Exact ammunition counts are catalog inputs, not guaranteed number of hits.
// Linked silence effects are validated as independent internal actions.
const expandedRangedAmmoProofs=Object.freeze([{"id":213602001,"root":{"skillType":"BOLT","element":"NONE","learnable":true,"mana":12,"cast":0,"cooldown":15,"motion":0.4,"range":4000,"rangeFromWeapon":false,"aoe":[10000,4800],"branch":"archery","reqLevel":12,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"DEX","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["archery",12]],"funcs":[["EP_ONHIT_POISON","CASTER",[0,200,400,40],[0,0,0,50]],["EP_PLAYER_ATTACK","TARGET",[0,0,0,1],[0,0,0,0]],["EP_CONSUME_AMMO","CASTER",[0,0,0,0],[0,0,0,1]]],"damage":{"kernel":"physical","slotIndex":1},"weaponUse":["BOW","CROSSBOW"]},"linked":[],"noteRu":"Выстрел с возможным отравлением. Итоговый урон, вероятность и длительность яда не рассчитаны.","noteEn":"A shot that can inflict poison. Final damage, poison chance and duration are not calculated."},{"id":213603501,"root":{"skillType":"BOLT","element":"NONE","learnable":true,"mana":33,"cast":0,"cooldown":10,"motion":0.3,"range":4000,"rangeFromWeapon":false,"aoe":[10000,4800],"branch":"archery","reqLevel":54,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"DEX","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["archery",54]],"funcs":[["EP_SKILL_EXEC_CHANGE","TARGET",[0,0,0,213603511],[0,0,0,18]],["EP_SKILL_EXEC","TARGET",[0,0,0,213603521],[0,0,0,0]],["EP_CONSUME_AMMO","CASTER",[0,0,0,0],[0,0,0,1]]],"damage":null,"weaponUse":["BOW","CROSSBOW"]},"linked":[{"id":213603511,"signature":{"skillType":"ENEMY","element":"NONE","learnable":false,"mana":0,"cast":0,"cooldown":0,"motion":0,"range":4000,"rangeFromWeapon":false,"aoe":[0,0],"branch":"archery","reqLevel":0,"charLevel":0,"isLevelBased":true,"prereq":null,"powerStat":"DEX","classes":[],"reqs":[],"funcs":[["EP_ONHIT_DAMAGE_SCALE","CASTER",[0,0,30,30],[0,0,0,0]],["EP_PLAYER_ATTACK","TARGET",[0,0,0,1],[0,0,0,0]],["EP_CAUSE_SILENCE","TARGET",[0,0,0,20],[0,0,40,60]]],"damage":{"kernel":"physical","slotIndex":1},"weaponUse":["BOW","CROSSBOW"]}},{"id":213603521,"signature":{"skillType":"ENEMY","element":"NONE","learnable":false,"mana":0,"cast":0,"cooldown":0,"motion":0,"range":4000,"rangeFromWeapon":false,"aoe":[0,0],"branch":"archery","reqLevel":0,"charLevel":0,"isLevelBased":true,"prereq":null,"powerStat":"DEX","classes":[],"reqs":[],"funcs":[["EP_PLAYER_ATTACK","TARGET",[0,0,0,1],[0,0,0,0]],["EP_CAUSE_SILENCE","TARGET",[0,0,0,3],[0,0,20,35]]],"damage":{"kernel":"physical","slotIndex":0},"weaponUse":["BOW","CROSSBOW"]}}],"noteRu":"Выстрел с возможной немотой. В игре предусмотрены два связанных действия; вероятность и длительность не рассчитаны.","noteEn":"A shot that can inflict silence. Two linked actions are recorded; chance and duration are not calculated."},{"id":213701001,"root":{"skillType":"ENEMY","element":null,"learnable":true,"mana":20,"cast":0,"cooldown":15,"motion":1,"range":1250,"rangeFromWeapon":false,"aoe":[0,0],"branch":"archery","reqLevel":41,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"STR","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["archery",41],["trap",21]],"funcs":[["EP_DAMAGERATE_SCALE","CASTER",[0,0,0,-20],[0,0,0,0]],["EP_MULTI_MISSILE","CASTER",[0,0,0,2],[0,0,0,2]],["EP_CONSUME_AMMO","CASTER",[0,0,0,0],[0,0,0,5]]],"damage":null,"weaponUse":["CROSSBOW"]},"linked":[],"noteRu":"По игровой записи расходуются пять боеприпасов; это не означает пять гарантированных попаданий.","noteEn":"The game record consumes five rounds; this does not guarantee five hits."}]);
function rangedAmmoPreview({skillCatalog=null,jobKey=null,level=1,
  branchMasteries={},branchCaps={},weaponKind='BARE_HAND',
  branchLabels={},englishBranches={}}={}){
  const out={rows:[],rejected:[],verified:false,sourceOnly:true};
  if(!skillCatalog||typeof jobKey!=='string'||!Number.isSafeInteger(level)||
   level<1||level>55)return out;
  for(const proof of [...rangedAmmoProofs,...expandedRangedAmmoProofs]){
   if(!proof.root.classes.includes(jobKey))continue;
   const source=skillCatalog[String(proof.id)];
   const child=proof.childId?skillCatalog[String(proof.childId)]:null;
   const parent=proof.parentId?skillCatalog[String(proof.parentId)]:null;
   const childrenExact=proof.linked?
    proof.linked.every(entry=>{
     const linked=skillCatalog[String(entry.id)];
     return linked?.id===entry.id&&
      JSON.stringify(sourceVerifiedSkillSignature(linked))===JSON.stringify(entry.signature);
    }):
    child?.id===proof.childId&&
     JSON.stringify(sourceVerifiedSkillSignature(child))===JSON.stringify(proof.child);
   const exact=source?.id===proof.id&&
    JSON.stringify(sourceVerifiedSkillSignature(source))===JSON.stringify(proof.root)&&
    childrenExact&&
    (!proof.parentId||(parent?.id===proof.parentId&&
     JSON.stringify(sourceVerifiedSkillSignature(parent))===JSON.stringify(proof.parent)));
   if(!exact){out.rejected.push(proof.id);continue;}
   if(proof.root.reqs.some(([branch,amount])=>
    !Number.isSafeInteger(branchCaps?.[branch])||branchCaps[branch]<amount))continue;
   const ammo=source.funcs.filter(f=>f.ep==='EP_CONSUME_AMMO'&&f.dir==='CASTER');
   if(ammo.length!==1||!Number.isSafeInteger(ammo[0].fv2[3])||ammo[0].fv2[3]<1){
    out.rejected.push(proof.id);continue;
   }
   const ru=[],en=[];
   if(level<source.charLevel){
    ru.push('Нужен уровень '+source.charLevel);en.push('Requires level '+source.charLevel);
   }
   for(const [branch,amount] of proof.root.reqs){
    const rank=branchMasteries?.[branch],cap=branchCaps?.[branch];
    if(Number.isSafeInteger(rank)&&rank>=amount&&rank<=cap)continue;
    ru.push('Нужно мастерство «'+(branchLabels?.[branch]||branch)+'»: '+amount);
    en.push('Requires '+(englishBranches?.[branch]||branch)+' mastery: '+amount);
   }
   if(!proof.root.weaponUse?.includes(weaponKind)){
    const bowOnly=proof.root.weaponUse?.length===1&&proof.root.weaponUse[0]==='BOW';
    const crossbowOnly=proof.root.weaponUse?.length===1&&proof.root.weaponUse[0]==='CROSSBOW';
    ru.push(bowOnly?'Требуется лук':crossbowOnly?'Требуется арбалет':'Требуется лук или арбалет');
    en.push(bowOnly?'Requires a bow':crossbowOnly?'Requires a crossbow':'Requires a bow or crossbow');
   }
   out.rows.push({id:proof.id,name:source.name,description:source.desc||'',
    ammoCount:ammo[0].fv2[3],mana:source.mana,cooldown:source.cooldown,
    prerequisiteId:proof.parentId??null,linkedEffectId:proof.childId??null,
    linkedEffectIds:proof.linked?proof.linked.map(entry=>entry.id):[proof.childId],
    noteRu:proof.noteRu,noteEn:proof.noteEn,requirementsMet:ru.length===0,
    reasonRu:ru.join(' · '),reasonEn:en.join(' · '),
    sourceOnly:true,finalDamage:null,inventoryChecked:false,appliedToHero:false});
  }
  return out;
 }

// Read-only combat skill descriptions; cost, cooldown and gates are from OS.
// Live success rates, mitigation, final damage and durations are not inferred.
const combatTechniqueProofs=Object.freeze([{"id":161201001,"root":{"skillType":"MYSELF","element":"NONE","learnable":true,"mana":9,"cast":0,"cooldown":10,"motion":2,"range":0,"rangeFromWeapon":false,"aoe":[0,0],"branch":"slash","reqLevel":21,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"STR","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["slash",21]],"funcs":[["EP_SKILL_PARRY","TARGET",[0,0,0,0],[0,0,0,0]],["EP_SKILL_PARRY_BENCH","TARGET",[0,0,0,5],[0,0,0,0]]],"damage":null,"weaponUse":["2H_SWORD","POLE_ARM","2H_AXE","2H_BLUNT_WEAPON","2H_TRUMP_WEAPON"]},"childId":null,"child":null,"parentId":null,"parent":null,"noteRu":"Попытка парировать удар. Итоговый шанс не установлен.","noteEn":"Attempts to parry an attack. Final success chance is unknown."},{"id":161202001,"root":{"skillType":"MYSELF","element":"NONE","learnable":true,"mana":12,"cast":0,"cooldown":10,"motion":2,"range":0,"rangeFromWeapon":false,"aoe":[0,0],"branch":"brush","reqLevel":12,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"STR","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["brush",12]],"funcs":[["EP_SKILL_PARRY","TARGET",[0,0,0,161202050],[0,0,0,0]],["EP_LOST_ATK_END","TARGET",[0,0,0,0],[0,0,0,0]],["EP_SKILL_PARRY_COUNTER","TARGET",[0,0,0,161202050],[0,0,0,0]]],"damage":null,"weaponUse":["2H_SWORD","POLE_ARM","2H_AXE","2H_BLUNT_WEAPON","2H_TRUMP_WEAPON"]},"childId":161202050,"child":{"skillType":"ENEMY","element":"NONE","learnable":false,"mana":0,"cast":0,"cooldown":0,"motion":0,"range":0,"rangeFromWeapon":true,"aoe":[0,0],"branch":"slash","reqLevel":0,"charLevel":0,"isLevelBased":true,"prereq":null,"powerStat":"STR","classes":[],"reqs":[],"funcs":[["EP_CRITICAL_ALWAYS","CASTER",[0,0,0,0],[0,0,0,0]],["EP_PLAYER_ATTACK","TARGET",[0,0,0,1],[0,0,0,0]]],"damage":{"kernel":"physical","slotIndex":1},"weaponUse":["1H_SWORD","2H_SWORD","LANCE","POLE_ARM","1H_AXE","2H_AXE","1H_BLUNT_WEAPON","2H_BLUNT_WEAPON","1H_TRUMP_WEAPON","2H_TRUMP_WEAPON","BOW","CROSSBOW","WAND","STAFF"]},"parentId":null,"parent":null,"noteRu":"Парирование с ответным ударом. Итоговый урон не рассчитывается.","noteEn":"Parry with a possible counterattack. Final damage is not calculated."},{"id":168001001,"root":{"skillType":"TOGGLE_RADIATION","element":"NONE","learnable":true,"mana":5,"cast":0,"cooldown":2,"motion":0,"range":0,"rangeFromWeapon":false,"aoe":[1,300],"branch":"defense","reqLevel":8,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"STR","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["defense",8]],"funcs":[["EP_SKILL_BLOCKING","CASTER",[0,0,0,50],[0,0,0,0]],["EP_SKILL_BLOCKING_TARGET","TARGET",[0,0,0,50],[0,0,0,0]],["EP_DESTINE_ONHIT","TARGET",[0,0,0,0],[0,0,0,0]],["EP_LOST_ACTION_BLOCKING","CASTER",[0,0,0,0],[0,0,0,0]],["EP_TOGGLE","CASTER",[0,0,0,2],[0,0,0,2]]],"damage":null,"weaponUse":null},"childId":null,"child":null,"parentId":null,"parent":null,"noteRu":"Блокирование физической атаки. Точный итог защиты неизвестен.","noteEn":"Blocks physical attacks. Final protection is unknown."},{"id":168001003,"root":{"skillType":"TOGGLE_RADIATION","element":"NONE","learnable":true,"mana":5,"cast":0,"cooldown":2,"motion":0,"range":0,"rangeFromWeapon":false,"aoe":[1,300],"branch":"defense","reqLevel":8,"charLevel":45,"isLevelBased":false,"prereq":168001001,"powerStat":"STR","classes":["GENERAL"],"reqs":[["defense",8]],"funcs":[["EP_SKILL_BLOCKING","CASTER",[0,0,0,50],[0,0,0,0]],["EP_SKILL_BLOCKING_TARGET","TARGET",[0,0,0,50],[0,0,0,0]],["EP_DESTINE_ONHIT","TARGET",[0,0,0,0],[0,0,0,0]],["EP_LOST_ACTION_BLOCKING","CASTER",[0,0,0,0],[0,0,0,0]],["EP_TOGGLE","CASTER",[0,0,0,2],[0,0,0,2]],["EP_SKILL_COUNTER_CHARGE","CASTER",[0,0,0,100],[0,0,0,100]]],"damage":null,"weaponUse":null},"childId":null,"child":null,"parentId":168001001,"parent":{"skillType":"TOGGLE_RADIATION","element":"NONE","learnable":true,"mana":5,"cast":0,"cooldown":2,"motion":0,"range":0,"rangeFromWeapon":false,"aoe":[1,300],"branch":"defense","reqLevel":8,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"STR","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["defense",8]],"funcs":[["EP_SKILL_BLOCKING","CASTER",[0,0,0,50],[0,0,0,0]],["EP_SKILL_BLOCKING_TARGET","TARGET",[0,0,0,50],[0,0,0,0]],["EP_DESTINE_ONHIT","TARGET",[0,0,0,0],[0,0,0,0]],["EP_LOST_ACTION_BLOCKING","CASTER",[0,0,0,0],[0,0,0,0]],["EP_TOGGLE","CASTER",[0,0,0,2],[0,0,0,2]]],"damage":null,"weaponUse":null},"noteRu":"Улучшенное блокирование с дополнительным ответным действием. Его итог не рассчитан.","noteEn":"Enhanced blocking with an additional counter action. Final result is not calculated."},{"id":100051001,"root":{"skillType":"MYSELF","element":"NONE","learnable":true,"mana":25,"cast":0,"cooldown":30,"motion":0,"range":0,"rangeFromWeapon":false,"aoe":[0,0],"branch":"martial","reqLevel":0,"charLevel":18,"isLevelBased":true,"prereq":null,"powerStat":"STR","classes":["DRAGOON","GENERAL","GLADIATOR","JUGGERNAUT","KNIGHT","PALADIN","WARRIOR"],"reqs":[],"funcs":[["EP_ATTACKINTERVAL_SCALE","TARGET",[0,0,0,15],[0,0,0,0]],["EP_LOST_CHANGE_WEAPON","TARGET",[0,0,0,0],[0,0,0,0]]],"damage":null,"weaponUse":["BARE_HAND","1H_SWORD","2H_SWORD","LANCE","POLE_ARM","1H_AXE","2H_AXE","1H_BLUNT_WEAPON","2H_BLUNT_WEAPON","1H_TRUMP_WEAPON","2H_TRUMP_WEAPON","WAND","STAFF"]},"childId":null,"child":null,"parentId":null,"parent":null,"noteRu":"Влияет на скорость атаки. Итоговая скорость не рассчитана.","noteEn":"Affects attack speed. Final attack rate is not calculated."},{"id":100054001,"root":{"skillType":"MYSELF","element":null,"learnable":true,"mana":18,"cast":0,"cooldown":20,"motion":0,"range":0,"rangeFromWeapon":false,"aoe":[0,0],"branch":"slash","reqLevel":26,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"STR","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["slash",26]],"funcs":[["EP_TOHIT_CONST","TARGET",[0,0,0,100],[0,0,0,0]],["EP_LOST_ATK_END","TARGET",[0,0,0,0],[0,0,0,0]]],"damage":null,"weaponUse":null},"childId":null,"child":null,"parentId":null,"parent":null,"noteRu":"Повышает точность следующей атаки. Итоговый шанс попадания неизвестен.","noteEn":"Improves accuracy for the next attack. Final hit chance is unknown."},{"id":121705001,"root":{"skillType":"MYSELF","element":null,"learnable":true,"mana":28,"cast":0,"cooldown":90,"motion":0,"range":0,"rangeFromWeapon":false,"aoe":[0,0],"branch":"thrust","reqLevel":35,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"DEX","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["thrust",35]],"funcs":[["EP_ONHIT_UNSEAT","TARGET",[10,0,5,5],[0,0,0,0]]],"damage":null,"weaponUse":null},"childId":null,"child":null,"parentId":null,"parent":null,"noteRu":"При атаке может сбить противника с коня. Точная вероятность неизвестна.","noteEn":"An attack may dismount the target. Actual chance is unknown."},{"id":142503001,"root":{"skillType":"ENEMY","element":"NONE","learnable":true,"mana":22,"cast":0,"cooldown":10,"motion":0,"range":0,"rangeFromWeapon":true,"aoe":[0,0],"branch":"blow","reqLevel":61,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"STR","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["blow",61]],"funcs":[["EP_ATTACK_BLOCK_BREAK","CASTER",[0,0,0,142503002],[0,0,0,0]],["EP_PLAYER_ATTACK","TARGET",[0,0,0,1],[0,0,0,0]]],"damage":{"kernel":"physical","slotIndex":1},"weaponUse":["1H_AXE","2H_AXE","1H_BLUNT_WEAPON","2H_BLUNT_WEAPON","WAND","STAFF"]},"childId":142503002,"child":{"skillType":"ENEMY","element":"NONE","learnable":false,"mana":0,"cast":0,"cooldown":0,"motion":0,"range":0,"rangeFromWeapon":false,"aoe":[0,0],"branch":"blow","reqLevel":0,"charLevel":0,"isLevelBased":true,"prereq":null,"powerStat":"STR","classes":[],"reqs":[],"funcs":[["EP_LEAVE_SHIELD","TARGET",[0,0,0,0],[0,0,0,0]]],"damage":null,"weaponUse":null},"parentId":null,"parent":null,"noteRu":"Удар против блокирующего противника с эффектом на щит. Точный итог не рассчитан.","noteEn":"A strike against a blocking target with a shield effect. Final result is unknown."}]);
function combatTechniquePreview({skillCatalog=null,jobKey=null,level=1,
 branchMasteries={},branchCaps={},weaponKind='BARE_HAND',
 branchLabels={},englishBranches={}}={}){
 const out={rows:[],rejected:[],verified:false,sourceOnly:true};
 if(!skillCatalog||typeof jobKey!=='string'||!Number.isSafeInteger(level)||
  level<1||level>55)return out;
 for(const proof of combatTechniqueProofs){
  if(!proof.root.classes.includes(jobKey))continue;
  const skill=skillCatalog[String(proof.id)];
  const child=proof.childId?skillCatalog[String(proof.childId)]:null;
  const parent=proof.parentId?skillCatalog[String(proof.parentId)]:null;
  const valid=skill?.id===proof.id&&
   JSON.stringify(sourceVerifiedSkillSignature(skill))===JSON.stringify(proof.root)&&
   (!proof.childId||(child?.id===proof.childId&&
    JSON.stringify(sourceVerifiedSkillSignature(child))===JSON.stringify(proof.child)))&&
   (!proof.parentId||(parent?.id===proof.parentId&&
    JSON.stringify(sourceVerifiedSkillSignature(parent))===JSON.stringify(proof.parent)));
  if(!valid){out.rejected.push(proof.id);continue;}
  if(proof.root.reqs.some(([branch,amount])=>
   !Number.isSafeInteger(branchCaps?.[branch])||branchCaps[branch]<amount))continue;
  const ru=[],en=[];
  if(level<skill.charLevel){
   ru.push('Нужен уровень '+skill.charLevel);
   en.push('Requires level '+skill.charLevel);
  }
  for(const [branch,amount] of proof.root.reqs){
   const rank=branchMasteries?.[branch],cap=branchCaps?.[branch];
   if(Number.isSafeInteger(rank)&&rank>=amount&&rank<=cap)continue;
   ru.push('Нужно мастерство «'+(branchLabels?.[branch]||'Мастерство')+'»: '+amount);
   en.push('Requires '+(englishBranches?.[branch]||'mastery')+': '+amount);
  }
  if(proof.root.weaponUse?.length&&!proof.root.weaponUse.includes(weaponKind)){
   ru.push('Требуется подходящее оружие');
   en.push('Requires a compatible weapon');
  }
  out.rows.push({id:proof.id,name:skill.name,description:skill.desc||'',
   mana:skill.mana,cooldown:skill.cooldown,prerequisiteId:proof.parentId,
   noteRu:proof.noteRu,noteEn:proof.noteEn,requirementsMet:ru.length===0,
   reasonRu:ru.join(' · '),reasonEn:en.join(' · '),sourceOnly:true,
   finalAmount:null,appliedToHero:false});
 }
 return out;
}

// Additional blocking variants and magical utility spells. These source
// descriptions never modify stored hero stats or claim final combat rolls.
const specializedSkillProofs=Object.freeze([{"id":168001004,"group":"defense","root":{"skillType":"TOGGLE_RADIATION","element":"NONE","learnable":true,"mana":5,"cast":0,"cooldown":2,"motion":0,"range":0,"rangeFromWeapon":false,"aoe":[1,300],"branch":"defense","reqLevel":8,"charLevel":45,"isLevelBased":false,"prereq":168001001,"powerStat":"STR","classes":["PALADIN"],"reqs":[["defense",8]],"funcs":[["EP_SKILL_BLOCKING","CASTER",[0,0,0,50],[0,0,15,20]],["EP_BLOCK_MAGIC_TARGET","TARGET",[0,0,0,50],[0,0,0,0]],["EP_DESTINE_ONHIT","TARGET",[0,0,0,0],[0,0,0,0]],["EP_LOST_ACTION_BLOCKING","CASTER",[0,0,0,0],[0,0,0,0]],["EP_TOGGLE","CASTER",[0,0,0,2],[0,0,0,2]]],"damage":null,"weaponUse":null},"parentId":168001001,"parent":{"skillType":"TOGGLE_RADIATION","element":"NONE","learnable":true,"mana":5,"cast":0,"cooldown":2,"motion":0,"range":0,"rangeFromWeapon":false,"aoe":[1,300],"branch":"defense","reqLevel":8,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"STR","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["defense",8]],"funcs":[["EP_SKILL_BLOCKING","CASTER",[0,0,0,50],[0,0,0,0]],["EP_SKILL_BLOCKING_TARGET","TARGET",[0,0,0,50],[0,0,0,0]],["EP_DESTINE_ONHIT","TARGET",[0,0,0,0],[0,0,0,0]],["EP_LOST_ACTION_BLOCKING","CASTER",[0,0,0,0],[0,0,0,0]],["EP_TOGGLE","CASTER",[0,0,0,2],[0,0,0,2]]],"damage":null,"weaponUse":null},"childId":null,"child":null,"noteRu":"Особое блокирование для паладина с дополнительным защитным действием. Точный результат не установлен.","noteEn":"Paladin's special blocking includes another defensive action. Final outcome is unknown."},{"id":168002002,"group":"defense","root":{"skillType":"TOGGLE_RADIATION","element":null,"learnable":true,"mana":10,"cast":0,"cooldown":5,"motion":1,"range":0,"rangeFromWeapon":false,"aoe":[1,300],"branch":"defense","reqLevel":41,"charLevel":45,"isLevelBased":false,"prereq":168002001,"powerStat":"STR","classes":["GENERAL"],"reqs":[["defense",41]],"funcs":[["EP_SKILL_BLOCKING","CASTER",[0,0,0,30],[0,0,0,0]],["EP_SKILL_BLOCKING_TARGET","TARGET",[0,0,0,50],[0,0,0,0]],["EP_SKILL_COUNTER_CHARGE","CASTER",[0,0,0,100],[0,0,0,100]],["EP_LOST_ACTION_DEFENSIVE_MARCH","CASTER",[0,0,0,0],[0,0,0,0]],["EP_DESTINE_ONHIT","TARGET",[0,0,0,0],[0,0,0,0]],["EP_TOGGLE","CASTER",[0,0,0,2],[0,0,0,2]]],"damage":null,"weaponUse":null},"parentId":168002001,"parent":{"skillType":"TOGGLE_RADIATION","element":null,"learnable":true,"mana":10,"cast":0,"cooldown":5,"motion":1,"range":0,"rangeFromWeapon":false,"aoe":[1,300],"branch":"defense","reqLevel":41,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"STR","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["defense",41]],"funcs":[["EP_SKILL_BLOCKING","CASTER",[0,0,0,30],[0,0,0,0]],["EP_SKILL_BLOCKING_TARGET","TARGET",[0,0,0,50],[0,0,0,0]],["EP_MOVESPEED_SCALE","CASTER",[0,0,0,-20],[0,0,0,0]],["EP_LOST_ACTION_DEFENSIVE_MARCH","CASTER",[0,0,0,0],[0,0,0,0]],["EP_DESTINE_ONHIT","TARGET",[0,0,0,0],[0,0,0,0]],["EP_TOGGLE","CASTER",[0,0,0,2],[0,0,0,2]]],"damage":null,"weaponUse":null},"childId":null,"child":null,"noteRu":"Улучшенная защита во время движения с ответным действием. Итог защиты неизвестен.","noteEn":"Improved defensive movement with a counter action. Final protection is unknown."},{"id":168003001,"group":"defense","root":{"skillType":"MYSELF","element":"NONE","learnable":true,"mana":14,"cast":0,"cooldown":10,"motion":1,"range":0,"rangeFromWeapon":false,"aoe":[0,0],"branch":"defense","reqLevel":12,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"STR","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["defense",12]],"funcs":[["EP_SKILL_BLOCKING_BASH","TARGET",[0,0,0,100],[0,0,0,0]],["EP_CANCEL_BLOCKING","TARGET",[0,0,0,0],[0,0,0,0]]],"damage":null,"weaponUse":null},"parentId":null,"parent":null,"childId":null,"child":null,"noteRu":"При блокировании может сбить врага с ног. Шанс срабатывания неизвестен.","noteEn":"While blocking, may knock down the opponent. Success chance is unknown."},{"id":168051001,"group":"defense","root":{"skillType":"MYSELF","element":null,"learnable":true,"mana":20,"cast":0,"cooldown":30,"motion":0.5,"range":0,"rangeFromWeapon":false,"aoe":[0,0],"branch":"defense","reqLevel":26,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"STR","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["defense",26]],"funcs":[["EP_SKILL_BLOCKING_AUTO","TARGET",[0,0,0,20],[0,0,30,10]],["EP_DESTINE_ONHIT","TARGET",[0,0,0,0],[0,0,0,0]],["EP_LOST_CHANGE_EQUIP","TARGET",[0,0,0,2],[0,0,0,0]]],"damage":null,"weaponUse":null},"parentId":null,"parent":null,"childId":null,"child":null,"noteRu":"Может автоматически заблокировать удар. Точная вероятность неизвестна.","noteEn":"May block an incoming hit automatically. Actual chance is unknown."},{"id":420001001,"group":"magic","root":{"skillType":"RADIATION","element":null,"learnable":true,"mana":14,"cast":1,"cooldown":7,"motion":1.5,"range":0,"rangeFromWeapon":false,"aoe":[2000,0],"branch":"embody","reqLevel":8,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"INT","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["embody",8]],"funcs":[["EP_DELETE_INVISIBLE","TARGET",[0,0,0,0],[0,0,0,0]]],"damage":null,"weaponUse":null},"parentId":null,"parent":null,"childId":null,"child":null,"noteRu":"Помогает обнаружить невидимого противника. Точные условия обнаружения не рассчитаны.","noteEn":"Reveals hidden enemies. Exact detection conditions are not calculated."},{"id":420001002,"group":"magic","root":{"skillType":"RADIATION","element":null,"learnable":true,"mana":14,"cast":1,"cooldown":4,"motion":1.5,"range":0,"rangeFromWeapon":false,"aoe":[2000,0],"branch":"embody","reqLevel":8,"charLevel":50,"isLevelBased":false,"prereq":420001001,"powerStat":"INT","classes":["CONJURER"],"reqs":[["embody",8]],"funcs":[["EP_DELETE_INVISIBLE","TARGET",[0,0,0,0],[0,0,0,0]],["EP_SKILL_EXEC","TARGET",[0,0,0,420001003],[0,0,0,0]],["EP_CANCEL_SKILL_INVISIBLE","TARGET",[0,0,0,0],[0,0,0,0]]],"damage":null,"weaponUse":null},"parentId":420001001,"parent":{"skillType":"RADIATION","element":null,"learnable":true,"mana":14,"cast":1,"cooldown":7,"motion":1.5,"range":0,"rangeFromWeapon":false,"aoe":[2000,0],"branch":"embody","reqLevel":8,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"INT","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["embody",8]],"funcs":[["EP_DELETE_INVISIBLE","TARGET",[0,0,0,0],[0,0,0,0]]],"damage":null,"weaponUse":null},"childId":420001003,"child":{"skillType":"ENEMY","element":null,"learnable":false,"mana":0,"cast":0,"cooldown":0,"motion":0,"range":0,"rangeFromWeapon":false,"aoe":[0,0],"branch":"embody","reqLevel":0,"charLevel":0,"isLevelBased":true,"prereq":null,"powerStat":"INT","classes":[],"reqs":[],"funcs":[["EP_SEAL_SKILL","TARGET",[0,0,0,230001001],[0,0,0,0]],["EP_SEAL_SKILL","TARGET",[0,0,0,230001002],[0,0,0,0]],["EP_SEAL_SKILL","TARGET",[0,0,0,230002001],[0,0,0,0]],["EP_SEAL_SKILL","TARGET",[0,0,0,230002004],[0,0,0,0]],["EP_SEAL_SKILL","TARGET",[0,0,0,230002005],[0,0,0,0]]],"damage":null,"weaponUse":null},"noteRu":"Улучшенное обнаружение невидимых врагов с дополнительным воздействием на маскировку. Итог неизвестен.","noteEn":"Improved detection with additional effects on concealment. Final result is unknown."},{"id":420005001,"group":"magic","root":{"skillType":"ENEMY","element":"CHARM","learnable":true,"mana":39,"cast":3.5,"cooldown":10,"motion":1.5,"range":2500,"rangeFromWeapon":false,"aoe":[0,0],"branch":"embody","reqLevel":41,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"INT","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["embody",41]],"funcs":[["EP_SKILL_EXEC_DIFFUSION","TARGET",[0,0,0,420005004],[0,0,0,10003]]],"damage":null,"weaponUse":null},"parentId":null,"parent":null,"childId":420005004,"child":{"skillType":"BOLT","element":"CHARM","learnable":false,"mana":0,"cast":0,"cooldown":0,"motion":0,"range":2500,"rangeFromWeapon":false,"aoe":[500,4000],"branch":"embody","reqLevel":0,"charLevel":0,"isLevelBased":true,"prereq":null,"powerStat":"INT","classes":["CONJURER"],"reqs":[],"funcs":[["EP_MAGIC_DAMAGE","TARGET",[125,0,145,55],[0,0,0,0]]],"damage":{"kernel":"material","slotIndex":0},"weaponUse":null},"noteRu":"Магический удар, сила которого зависит от защиты цели. Итоговый урон неизвестен.","noteEn":"Magic attack that depends on the target's defense. Final damage is unknown."},{"id":420005002,"group":"magic","root":{"skillType":"ENEMY","element":"CHARM","learnable":true,"mana":39,"cast":3.5,"cooldown":10,"motion":1.5,"range":2500,"rangeFromWeapon":false,"aoe":[0,0],"branch":"embody","reqLevel":41,"charLevel":50,"isLevelBased":false,"prereq":420005001,"powerStat":"INT","classes":["CONJURER"],"reqs":[["embody",41]],"funcs":[["EP_SKILL_EXEC_DIFFUSION","TARGET",[0,0,0,420005003],[0,0,0,10003]]],"damage":null,"weaponUse":null},"parentId":420005001,"parent":{"skillType":"ENEMY","element":"CHARM","learnable":true,"mana":39,"cast":3.5,"cooldown":10,"motion":1.5,"range":2500,"rangeFromWeapon":false,"aoe":[0,0],"branch":"embody","reqLevel":41,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"INT","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["embody",41]],"funcs":[["EP_SKILL_EXEC_DIFFUSION","TARGET",[0,0,0,420005004],[0,0,0,10003]]],"damage":null,"weaponUse":null},"childId":420005003,"child":{"skillType":"BOLT","element":"CHARM","learnable":false,"mana":0,"cast":0,"cooldown":0,"motion":0,"range":2500,"rangeFromWeapon":false,"aoe":[500,4000],"branch":"embody","reqLevel":0,"charLevel":0,"isLevelBased":true,"prereq":null,"powerStat":"INT","classes":["CONJURER"],"reqs":[],"funcs":[["EP_MAGIC_DAMAGE","TARGET",[200,0,220,55],[0,0,0,0]]],"damage":{"kernel":"material","slotIndex":0},"weaponUse":null},"noteRu":"Улучшенный магический удар с изменёнными исходными параметрами. Итоговый урон неизвестен.","noteEn":"Enhanced magic strike with different source parameters. Final damage is unknown."}]);
function specializedSkillPreview({skillCatalog=null,jobKey=null,level=1,
 branchCaps={},branchMasteries={},branchLabels={},englishBranches={}}={}){
 const out={defense:[],magic:[],rejected:[],verified:false,sourceOnly:true};
 if(!skillCatalog||typeof jobKey!=='string'||!Number.isSafeInteger(level)||
  level<1||level>55)return out;
 for(const proof of specializedSkillProofs){
  if(!proof.root.classes.includes(jobKey))continue;
  const source=skillCatalog[String(proof.id)];
  const parent=proof.parentId?skillCatalog[String(proof.parentId)]:null;
  const child=proof.childId?skillCatalog[String(proof.childId)]:null;
  const valid=source?.id===proof.id&&
   JSON.stringify(sourceVerifiedSkillSignature(source))===JSON.stringify(proof.root)&&
   (!proof.parentId||(parent?.id===proof.parentId&&
    JSON.stringify(sourceVerifiedSkillSignature(parent))===JSON.stringify(proof.parent)))&&
   (!proof.childId||(child?.id===proof.childId&&
    JSON.stringify(sourceVerifiedSkillSignature(child))===JSON.stringify(proof.child)));
  if(!valid){out.rejected.push(proof.id);continue;}
  if(proof.root.reqs.some(([branch,amount])=>
   !Number.isSafeInteger(branchCaps?.[branch])||branchCaps[branch]<amount))continue;
  const ru=[],en=[];
  if(level<source.charLevel){
   ru.push('Нужен уровень '+source.charLevel);
   en.push('Requires level '+source.charLevel);
  }
  for(const [branch,amount] of proof.root.reqs){
   const rank=branchMasteries?.[branch],cap=branchCaps?.[branch];
   if(Number.isSafeInteger(rank)&&rank>=amount&&rank<=cap)continue;
   ru.push('Нужно мастерство «'+(branchLabels?.[branch]||'Мастерство')+'»: '+amount);
   en.push('Requires '+(englishBranches?.[branch]||'mastery')+': '+amount);
  }
  out[proof.group].push({id:proof.id,name:source.name,description:source.desc||'',
   mana:source.mana,cooldown:source.cooldown,prerequisiteId:proof.parentId,
   noteRu:proof.noteRu,noteEn:proof.noteEn,requirementsMet:ru.length===0,
   reasonRu:ru.join(' · '),reasonEn:en.join(' · '),
   sourceOnly:true,finalAmount:null,appliedToHero:false});
 }
 return out;
}

// Source-only support, target exchange, cleansing and dispel rules.
// Inventory counts are source facts; live status rolls remain unknown.
const supportSkillProofs=Object.freeze([{"id":310003001,"group":"help","root":{"skillType":"ALLY","element":null,"learnable":true,"mana":65,"cast":5,"cooldown":30,"motion":1.5,"range":2500,"rangeFromWeapon":false,"aoe":[0,0],"branch":"benevolence","reqLevel":0,"charLevel":35,"isLevelBased":true,"prereq":null,"powerStat":"INT","classes":["CLERIC","ENCHANTER","PRIEST"],"reqs":[],"funcs":[["EP_RAISE_DEAD","TARGET",[5,5,5,5],[0,0,0,0]],["EP_CONSUME_ITEM","CASTER",[0,0,0,50059],[0,0,0,3]],["EP_CANCEL_UNDEAD","TARGET",[0,0,0,0],[0,0,0,0]]],"damage":null,"weaponUse":null},"parentId":null,"parent":null,"childId":null,"child":null,"noteRu":"Возвращает павшего союзника в бой. Количество восстановленных ОЗ не рассчитывается.","noteEn":"Revives a fallen ally. The amount of restored HP is not calculated."},{"id":310011001,"group":"help","root":{"skillType":"ALLY","element":null,"learnable":true,"mana":15,"cast":1,"cooldown":3,"motion":1.5,"range":3500,"rangeFromWeapon":false,"aoe":[0,0],"branch":"benevolence","reqLevel":12,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"INT","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["benevolence",12]],"funcs":[["EP_RECOVERY_POISON","TARGET",[0,0,0,0],[0,0,0,0]]],"damage":null,"weaponUse":null},"parentId":null,"parent":null,"childId":null,"child":null,"noteRu":"Предназначено для снятия отравления с союзника. Итоговое действие на сервере не проверено.","noteEn":"Removes poison from an ally. Exact server outcome is not verified."},{"id":310012001,"group":"help","root":{"skillType":"ALLY","element":null,"learnable":true,"mana":18,"cast":1,"cooldown":3,"motion":1.5,"range":3500,"rangeFromWeapon":false,"aoe":[0,0],"branch":"benevolence","reqLevel":26,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"INT","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["benevolence",26]],"funcs":[["EP_RECOVERY_SLEEP","TARGET",[0,0,0,0],[0,0,0,0]],["EP_RECOVERY_STUN","TARGET",[0,0,0,0],[0,0,0,0]],["EP_RECOVERY_NUMB","TARGET",[0,0,0,0],[0,0,0,0]]],"damage":null,"weaponUse":null},"parentId":null,"parent":null,"childId":null,"child":null,"noteRu":"Предназначено для снятия сна, оглушения и заморозки с союзника.","noteEn":"Removes sleep, stun and freeze from an ally."},{"id":330101001,"group":"help","root":{"skillType":"PARTY_SINGLE","element":null,"learnable":true,"mana":50,"cast":3,"cooldown":0.5,"motion":0,"range":2500,"rangeFromWeapon":false,"aoe":[0,0],"branch":"exorcism","reqLevel":61,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"SPI","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["exorcism",61],["blessing",20]],"funcs":[["EP_SKILL_SUBSTITUTE_MANA","TARGET",[0,0,0,2500],[0,0,0,0]],["EP_LOST_DIST","TARGET",[0,0,0,2500],[0,0,0,0]],["EP_LOST_DIST_HEAL_CASTER","CASTER",[0,0,0,2500],[0,0,0,0]],["EP_LOST_MAPCHANGE","TARGET",[0,0,0,0],[0,0,0,0]],["EP_LOST_EFFECT","TARGET",[0,0,0,0],[0,0,0,0]],["EP_CANCEL_IDENTITY","TARGET",[0,0,0,0],[0,0,0,0]]],"damage":null,"weaponUse":null},"parentId":null,"parent":null,"childId":null,"child":null,"noteRu":"Позволяет союзнику использовать ваши ОМ. Точные правила расхода и длительность не рассчитаны.","noteEn":"Lets an ally use your MP. Exact spending rules and duration are not calculated."},{"id":330071001,"group":"magic","root":{"skillType":"ENEMY","element":null,"learnable":true,"mana":16,"cast":2,"cooldown":10,"motion":1.5,"range":1250,"rangeFromWeapon":false,"aoe":[0,0],"branch":"exorcism","reqLevel":0,"charLevel":45,"isLevelBased":true,"prereq":null,"powerStat":"INT","classes":["EXORCIST"],"reqs":[],"funcs":[["EP_CANCEL_IDENTITY","TARGET",[0,0,0,0],[0,0,0,0]],["EP_MANA_CHANGE","TARGET",[0,0,0,0],[0,0,0,0]],["EP_CANCEL_NOTPT","TARGET",[0,0,0,1],[0,0,0,0]]],"damage":null,"weaponUse":null},"parentId":null,"parent":null,"childId":null,"child":null,"noteRu":"Обмен ОМ с целью. Точные суммы после обмена не рассчитаны.","noteEn":"Swaps MP with the target. Resulting values are not calculated."},{"id":330072001,"group":"magic","root":{"skillType":"ENEMY","element":null,"learnable":true,"mana":21,"cast":1,"cooldown":10,"motion":0,"range":2500,"rangeFromWeapon":false,"aoe":[0,0],"branch":"exorcism","reqLevel":0,"charLevel":50,"isLevelBased":true,"prereq":null,"powerStat":"STR","classes":["EXORCIST"],"reqs":[],"funcs":[["EP_SWAP_EFFECT","TARGET",[0,0,0,0],[0,0,0,0]],["EP_CANCEL_IDENTITY","TARGET",[0,0,0,0],[0,0,0,0]],["EP_CANCEL_NOTPT","TARGET",[0,0,0,1],[0,0,0,0]]],"damage":null,"weaponUse":null},"parentId":null,"parent":null,"childId":null,"child":null,"noteRu":"Обмен магическими эффектами с целью. Итоговый набор эффектов неизвестен.","noteEn":"Swaps magical effects with the target. Final effects are not calculated."},{"id":440002001,"group":"magic","root":{"skillType":"ENEMY","element":"CHARM","learnable":true,"mana":26,"cast":1,"cooldown":15,"motion":1.5,"range":2500,"rangeFromWeapon":false,"aoe":[0,0],"branch":"darkness","reqLevel":33,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"INT","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["darkness",33]],"funcs":[["EP_REMOVE_FINE_EFFECT","TARGET",[0,0,100,0],[0,0,0,15]]],"damage":null,"weaponUse":null},"parentId":null,"parent":null,"childId":null,"child":null,"noteRu":"Снимает положительные магические эффекты цели. Условия успеха не рассчитаны.","noteEn":"Removes positive magic effects from the target. Success conditions are unknown."},{"id":440002002,"group":"magic","root":{"skillType":"ENEMY","element":"CHARM","learnable":true,"mana":26,"cast":1,"cooldown":15,"motion":1.5,"range":2500,"rangeFromWeapon":false,"aoe":[0,0],"branch":"darkness","reqLevel":33,"charLevel":45,"isLevelBased":false,"prereq":440002001,"powerStat":"INT","classes":["CALAMITY"],"reqs":[["darkness",33]],"funcs":[["EP_SKILL_EXEC","TARGET",[0,0,0,440002003],[0,0,0,0]]],"damage":null,"weaponUse":null},"parentId":440002001,"parent":{"skillType":"ENEMY","element":"CHARM","learnable":true,"mana":26,"cast":1,"cooldown":15,"motion":1.5,"range":2500,"rangeFromWeapon":false,"aoe":[0,0],"branch":"darkness","reqLevel":33,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"INT","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["darkness",33]],"funcs":[["EP_REMOVE_FINE_EFFECT","TARGET",[0,0,100,0],[0,0,0,15]]],"damage":null,"weaponUse":null},"childId":440002003,"child":{"skillType":"SPHERE","element":"CHARM","learnable":false,"mana":0,"cast":0,"cooldown":0,"motion":0,"range":0,"rangeFromWeapon":false,"aoe":[250,0],"branch":"darkness","reqLevel":0,"charLevel":0,"isLevelBased":true,"prereq":null,"powerStat":"INT","classes":[],"reqs":[],"funcs":[["EP_REMOVE_FINE_EFFECT","TARGET",[0,0,100,0],[0,0,0,15]]],"damage":null,"weaponUse":null},"noteRu":"Улучшенное рассеивание через связанное игровое действие. Точные условия успеха неизвестны.","noteEn":"Enhanced dispel through a linked action. Exact success conditions are unknown."}]);
function supportEffectPreview({skillCatalog=null,jobKey=null,level=1,
 branchCaps={},branchMasteries={},branchLabels={},englishBranches={}}={}){
 const out={help:[],magic:[],rejected:[],verified:false,sourceOnly:true};
 if(!skillCatalog||typeof jobKey!=='string'||!Number.isSafeInteger(level)||
  level<1||level>55)return out;
 for(const proof of supportSkillProofs){
  if(!proof.root.classes.includes(jobKey))continue;
  const source=skillCatalog[String(proof.id)],
   parent=proof.parentId?skillCatalog[String(proof.parentId)]:null,
   child=proof.childId?skillCatalog[String(proof.childId)]:null;
  const exact=source?.id===proof.id&&
   JSON.stringify(sourceVerifiedSkillSignature(source))===JSON.stringify(proof.root)&&
   (!proof.parentId||(parent?.id===proof.parentId&&
    JSON.stringify(sourceVerifiedSkillSignature(parent))===JSON.stringify(proof.parent)))&&
   (!proof.childId||(child?.id===proof.childId&&
    JSON.stringify(sourceVerifiedSkillSignature(child))===JSON.stringify(proof.child)));
  if(!exact){out.rejected.push(proof.id);continue;}
  if(proof.root.reqs.some(([branch,amount])=>
   !Number.isSafeInteger(branchCaps?.[branch])||branchCaps[branch]<amount))continue;
  const ru=[],en=[];
  if(level<source.charLevel){
   ru.push('Нужен уровень '+source.charLevel);
   en.push('Requires level '+source.charLevel);
  }
  for(const [branch,amount] of proof.root.reqs){
   const rank=branchMasteries?.[branch],cap=branchCaps?.[branch];
   if(Number.isSafeInteger(rank)&&rank>=amount&&rank<=cap)continue;
   ru.push('Нужно мастерство «'+(branchLabels?.[branch]||'Мастерство')+'»: '+amount);
   en.push('Requires '+(englishBranches?.[branch]||'mastery')+': '+amount);
  }
  const consume=source.funcs.filter(f=>f.ep==='EP_CONSUME_ITEM'&&f.dir==='CASTER');
  const sourceItem=proof.id===310003001&&consume.length===1?consume[0]:null;
  if(proof.id===310003001&&(
   !Number.isSafeInteger(sourceItem?.fv1?.[3])||
   !Number.isSafeInteger(sourceItem?.fv2?.[3])||sourceItem.fv2[3]<=0)){
   out.rejected.push(proof.id);continue;
  }
  out[proof.group].push({id:proof.id,name:source.name,
   mana:source.mana,cooldown:source.cooldown,prerequisiteId:proof.parentId,
   requiredItemId:sourceItem?.fv1?.[3]??null,
   requiredItemCount:sourceItem?.fv2?.[3]??null,
   noteRu:proof.noteRu,noteEn:proof.noteEn,requirementsMet:ru.length===0,
   reasonRu:ru.join(' · '),reasonEn:en.join(' · '),
   sourceOnly:true,finalAmount:null,appliedToHero:false,inventoryChecked:false});
 }
 return out;
}

 // Canonical contextual actions: detect, conceal and summon a mount.
 // They never modify permanent hero stats or prove final server outcomes.
 const situationalSkillProofs=Object.freeze([{"id":213606001,"group":"stealth","root":{"skillType":"TOGGLE","element":null,"learnable":true,"mana":44,"cast":0.5,"cooldown":20,"motion":0,"range":0,"rangeFromWeapon":false,"aoe":[0,0],"branch":"archery","reqLevel":0,"charLevel":45,"isLevelBased":true,"prereq":null,"powerStat":"DEX","classes":["PREDATOR"],"reqs":[],"funcs":[["EP_SEE_INVISIBLE","TARGET",[0,0,0,0],[0,0,0,0]],["EP_ONHIT_INVISIBLE_KILLER","TARGET",[0,0,0,100],[0,0,0,0]],["EP_UNABLE_MOVE","TARGET",[0,0,0,0],[0,0,0,0]],["EP_TOGGLE","TARGET",[0,0,0,3],[0,0,-2,3]]],"damage":null,"weaponUse":null},"parentId":null,"parent":null,"noteRu":"Помогает замечать скрытых противников. Во время действия движение ограничено; итоговый урон неизвестен.","noteEn":"Helps spot hidden enemies. Movement is restricted while active; final damage is unknown."},{"id":220007001,"group":"stealth","root":{"skillType":"MYSELF","element":null,"learnable":true,"mana":44,"cast":0.5,"cooldown":20,"motion":0,"range":0,"rangeFromWeapon":false,"aoe":[0,0],"branch":"alchemy","reqLevel":71,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"DEX","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["alchemy",71]],"funcs":[["EP_FIND_TRAP","TARGET",[0,0,0,0],[0,0,0,0]]],"damage":null,"weaponUse":null},"parentId":null,"parent":null,"noteRu":"Помогает обнаруживать вражеские ловушки. Дальность обнаружения и результат не рассчитаны.","noteEn":"Helps reveal enemy traps. Detection range and outcome are not calculated."},{"id":230001001,"group":"stealth","root":{"skillType":"TOGGLE","element":"NONE","learnable":true,"mana":24,"cast":0,"cooldown":3,"motion":0,"range":0,"rangeFromWeapon":false,"aoe":[1,0],"branch":"assassin","reqLevel":0,"charLevel":18,"isLevelBased":true,"prereq":null,"powerStat":"AGI","classes":["AGENT","ARCHER","ASSASSIN","DISTURBANCE","PREDATOR","SCOUT","SNIPER"],"reqs":[],"funcs":[["EP_INVISIBLE","TARGET",[0,0,0,0],[0,0,0,0]],["EP_LOST_ACTION","TARGET",[0,0,0,233001001],[0,0,0,0]],["EP_LOST_ATK_END","TARGET",[0,0,0,0],[0,0,0,0]],["EP_STOP_NATURAL_HEAL","TARGET",[0,0,0,1],[0,0,0,0]],["EP_TOGGLE","TARGET",[0,0,0,2],[0,0,0,2]]],"damage":null,"weaponUse":null},"parentId":null,"parent":null,"noteRu":"Позволяет скрыться, оставаясь на месте. Продолжительность и условия обнаружения не рассчитаны.","noteEn":"Lets you hide while staying still. Duration and detection conditions are not calculated."},{"id":230002004,"group":"stealth","root":{"skillType":"TOGGLE","element":null,"learnable":true,"mana":45,"cast":2,"cooldown":30,"motion":0.5,"range":0,"rangeFromWeapon":false,"aoe":[0,0],"branch":"assassin","reqLevel":0,"charLevel":45,"isLevelBased":true,"prereq":230002001,"powerStat":"AGI","classes":["ASSASSIN"],"reqs":[],"funcs":[["EP_INVISIBLE","TARGET",[0,0,0,0],[0,0,0,0]],["EP_LOST_ACTION_NOTMOVE2","TARGET",[0,0,0,233001001],[0,0,0,0]],["EP_LOST_ATK_END","TARGET",[0,0,0,0],[0,0,0,0]],["EP_HEAL_TIME_SCALE","TARGET",[0,0,0,-80],[0,0,0,0]],["EP_TOGGLE","TARGET",[0,0,0,3],[0,0,0,2]]],"damage":null,"weaponUse":null},"parentId":230002001,"parent":{"skillType":"TOGGLE","element":null,"learnable":true,"mana":45,"cast":2,"cooldown":30,"motion":0.5,"range":0,"rangeFromWeapon":false,"aoe":[1,0],"branch":"assassin","reqLevel":0,"charLevel":20,"isLevelBased":true,"prereq":null,"powerStat":"AGI","classes":["AGENT","ASSASSIN","DISTURBANCE"],"reqs":[],"funcs":[["EP_INVISIBLE","TARGET",[0,0,0,0],[0,0,0,0]],["EP_LOST_ACTION_NOTMOVE","TARGET",[0,0,0,233001001],[0,0,0,0]],["EP_MOVESPEED_SCALE","TARGET",[0,0,0,-20],[0,0,0,0]],["EP_LOST_ATK_END","TARGET",[0,0,0,0],[0,0,0,0]],["EP_STOP_NATURAL_HEAL","TARGET",[0,0,0,1],[0,0,0,0]],["EP_TOGGLE","TARGET",[0,0,0,3],[0,0,0,2]]],"damage":null,"weaponUse":null},"noteRu":"Позволяет передвигаться скрытно. Итоговое восстановление и условия обнаружения не рассчитаны.","noteEn":"Allows movement while hidden. Final recovery and detection conditions are not calculated."},{"id":520000001,"group":"other","root":{"skillType":"MYSELF","element":null,"learnable":true,"mana":22,"cast":3,"cooldown":180,"motion":0,"range":0,"rangeFromWeapon":false,"aoe":[0,0],"branch":"riding","reqLevel":20,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"INT","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["riding",20]],"funcs":[["EP_CANCEL_NEAR_OBB","TARGET",[0,0,0,200],[0,0,0,0]],["EP_HORSE_CALL","TARGET",[0,0,0,0],[0,0,0,0]],["EP_CANCEL_NEAR_OBB","TARGET",[0,0,0,200],[0,0,0,0]]],"damage":null,"weaponUse":null},"parentId":null,"parent":null,"noteRu":"Позволяет вызвать коня там, где доступна верховая езда. Возможность вызова зависит от места.","noteEn":"Summons a mount where riding is allowed. Whether it can be summoned depends on the area."},{"id":100059001,"group":"other","root":{"skillType":"MYSELF","element":null,"learnable":true,"mana":19,"cast":0,"cooldown":9,"motion":0,"range":0,"rangeFromWeapon":false,"aoe":[0,0],"branch":"thrust","reqLevel":0,"charLevel":45,"isLevelBased":true,"prereq":null,"powerStat":"STR","classes":["DRAGOON"],"reqs":[],"funcs":[["EP_SKILL_EXEC","TARGET",[0,0,0,100059004],[0,0,0,0]],["EP_CONSUME_MOMENT","CASTER",[0,0,0,2],[0,0,0,0]]],"damage":null,"weaponUse":["LANCE","POLE_ARM"]},"parentId":null,"parent":null,"linked":[{"id":100059004,"signature":{"skillType":"BREATH","element":null,"learnable":false,"mana":0,"cast":0,"cooldown":0,"motion":0,"range":0,"rangeFromWeapon":false,"aoe":[1000,200],"branch":"thrust","reqLevel":0,"charLevel":0,"isLevelBased":true,"prereq":null,"powerStat":"STR","classes":[],"reqs":[],"funcs":[["EP_SKILL_EXEC_GETON","TARGET",[0,0,0,100059002],[0,0,0,0]],["EP_SKILL_EXEC","TARGET",[0,0,0,100059003],[0,0,0,0]]],"damage":null,"weaponUse":["LANCE","POLE_ARM"]}},{"id":100059002,"signature":{"skillType":"ENEMY","element":null,"learnable":false,"mana":0,"cast":0,"cooldown":0,"motion":0,"range":0,"rangeFromWeapon":true,"aoe":[0,0],"branch":"thrust","reqLevel":0,"charLevel":0,"isLevelBased":true,"prereq":null,"powerStat":"SPI","classes":[],"reqs":[],"funcs":[["EP_ONHIT_DAMAGE_SCALE","CASTER",[0,0,300,50],[0,0,0,0]],["EP_ONHIT_KNOCKBACK","CASTER",[0,0,0,200],[0,0,0,100]],["EP_ONHIT_TUMBLE","CASTER",[0,0,0,100],[0,0,0,0]],["EP_PLAYER_ATTACK","TARGET",[0,0,0,1],[0,0,0,0]]],"damage":{"kernel":"physical","slotIndex":3},"weaponUse":["LANCE","POLE_ARM"]}},{"id":100059003,"signature":{"skillType":"ENEMY","element":null,"learnable":false,"mana":0,"cast":0,"cooldown":0,"motion":0,"range":0,"rangeFromWeapon":true,"aoe":[0,0],"branch":"thrust","reqLevel":0,"charLevel":0,"isLevelBased":true,"prereq":null,"powerStat":"SPI","classes":[],"reqs":[],"funcs":[["EP_ONHIT_DAMAGE_SCALE","CASTER",[0,0,300,50],[0,0,0,0]],["EP_ONHIT_UNSEAT","CASTER",[0,0,40,30],[0,0,0,0]],["EP_PLAYER_ATTACK","TARGET",[0,0,0,1],[0,0,0,0]]],"damage":{"kernel":"physical","slotIndex":2},"weaponUse":["LANCE","POLE_ARM"]}}],"noteRu":"Особая атака всадника с несколькими связанными действиями. Итоговый урон и точный смысл отдельного ресурса не установлены.","noteEn":"A mounted attack with several linked actions. Final damage and exact resource behavior are not established."},{"id":220006001,"group":"other","root":{"skillType":"MYSELF","element":"NONE","learnable":true,"mana":31,"cast":0,"cooldown":30,"motion":0,"range":0,"rangeFromWeapon":false,"aoe":[0,0],"branch":"alchemy","reqLevel":50,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"DEX","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["alchemy",50]],"funcs":[["EP_CONSUME_ITEM","TARGET",[0,0,0,50056],[0,0,0,1]],["EP_ONHIT_CASTING_TARGET","TARGET",[0,0,0,220006002],[0,0,0,100]]],"damage":null,"weaponUse":null},"parentId":null,"parent":null,"linked":[{"id":220006002,"signature":{"skillType":"ALLY","element":"NONE","learnable":false,"mana":0,"cast":0,"cooldown":0,"motion":0,"range":0,"rangeFromWeapon":false,"aoe":[0,0],"branch":"alchemy","reqLevel":0,"charLevel":0,"isLevelBased":true,"prereq":0,"powerStat":"DEX","classes":[],"reqs":[],"funcs":[["EP_SKILL_DELAY_FIN","TARGET",[0,0,0,-100],[0,0,0,0]]],"damage":null,"weaponUse":null}}],"noteRu":"Согласно игровым данным, для действия нужен расходный предмет. Итоговый результат воздействия на противника не установлен.","noteEn":"The game records a required item for the linked attack action. Actual effects on the enemy are not calculated."},{"id":520004001,"group":"other","root":{"skillType":"TOGGLE","element":null,"learnable":true,"mana":5,"cast":0,"cooldown":0,"motion":0,"range":0,"rangeFromWeapon":false,"aoe":[0,0],"branch":"riding","reqLevel":31,"charLevel":0,"isLevelBased":false,"prereq":null,"powerStat":"STR","classes":["ACOLYTE","AGENT","ARCHER","ASCETIC","ASSASSIN","CALAMITY","CLERIC","CONJURER","DARKROAR","DISTURBANCE","DRAGOON","ENCHANTER","EXORCIST","GENERAL","GLADIATOR","JESTER","JUGGERNAUT","KNIGHT","MAGE","MONK","PALADIN","PREDATOR","PRIEST","SCOUT","SNIPER","WARLOCK","WARRIOR","WIZARD"],"reqs":[["riding",31]],"funcs":[["EP_HORSE_PROTECT","TARGET",[0,0,0,0],[0,0,0,0]],["EP_LOST_CHANGE_EQUIP","TARGET",[0,0,0,2],[0,0,0,0]]],"damage":null,"weaponUse":null},"parentId":null,"parent":null,"linked":[],"noteRu":"Защитное действие для коня. Итоговая защита и точные условия действия не рассчитаны.","noteEn":"A protective mount action. Final damage reduction and activation conditions are not calculated."}]);
 function situationalSkillPreview({skillCatalog=null,jobKey=null,level=1,
  branchCaps={},branchMasteries={},branchLabels={},englishBranches={},
  weaponKind='BARE_HAND'}={}){
  const out={stealth:[],other:[],rejected:[],verified:false,sourceOnly:true};
  if(!skillCatalog||typeof jobKey!=='string'||!Number.isSafeInteger(level)||
   level<1||level>55)return out;
  for(const proof of situationalSkillProofs){
   if(!proof.root.classes.includes(jobKey))continue;
   const source=skillCatalog[String(proof.id)],
    parent=proof.parentId?skillCatalog[String(proof.parentId)]:null;
   const linkedExact=!proof.linked||proof.linked.every(entry=>{
    const linked=skillCatalog[String(entry.id)];
    return linked?.id===entry.id&&
     JSON.stringify(sourceVerifiedSkillSignature(linked))===JSON.stringify(entry.signature);
   });
   const exact=source?.id===proof.id&&
    JSON.stringify(sourceVerifiedSkillSignature(source))===JSON.stringify(proof.root)&&
    linkedExact&&
    (!proof.parentId||(parent?.id===proof.parentId&&
     JSON.stringify(sourceVerifiedSkillSignature(parent))===JSON.stringify(proof.parent)));
   if(!exact){out.rejected.push(proof.id);continue;}
   if(proof.root.reqs.some(([branch,amount])=>
    !Number.isSafeInteger(branchCaps?.[branch])||branchCaps[branch]<amount))continue;
   const ru=[],en=[];
   if(level<source.charLevel){
    ru.push('Нужен уровень '+source.charLevel);
    en.push('Requires level '+source.charLevel);
   }
   for(const [branch,amount] of proof.root.reqs){
    const rank=branchMasteries?.[branch],cap=branchCaps?.[branch];
    if(Number.isSafeInteger(rank)&&rank>=amount&&rank<=cap)continue;
    ru.push('Нужно мастерство «'+(branchLabels?.[branch]||'Мастерство')+'»: '+amount);
    en.push('Requires '+(englishBranches?.[branch]||'mastery')+': '+amount);
   }
   if(proof.root.weaponUse?.length&&!proof.root.weaponUse.includes(weaponKind)){
    ru.push('Требуется подходящее оружие');
    en.push('Requires a compatible weapon');
   }
   const item=proof.id===220006001?
    source.funcs.find(f=>f.ep==='EP_CONSUME_ITEM'&&f.fv1?.[3]===50056):null;
   const sourceResource=proof.id===100059001?
    source.funcs.find(f=>f.ep==='EP_CONSUME_MOMENT'):null;
   out[proof.group].push({id:proof.id,name:source.name,
    mana:source.mana,cooldown:source.cooldown,prerequisiteId:proof.parentId,
    requiredItemId:item?.fv1?.[3]??null,
    requiredItemCount:item?.fv2?.[3]??null,
    specialResourceValue:sourceResource?.fv1?.[3]??null,
    inventoryChecked:false,
    noteRu:proof.noteRu,noteEn:proof.noteEn,requirementsMet:ru.length===0,
    reasonRu:ru.join(' · '),reasonEn:en.join(' · '),
    sourceOnly:true,finalAmount:null,appliedToHero:false});
  }
  return out;
 }
root.PandoraOSCalculator=Object.freeze({skillExecutionChains,craftingSkillPreview,trapSkillCostPreview,tacticalSkillPreview,rangedAmmoPreview,combatTechniquePreview,specializedSkillPreview,supportEffectPreview,situationalSkillPreview,statusApplicationPreview,enemyDebuffPreview,complexSkillSourcePreview,priestCastPreviews,movementSkillSourcePreview,utilitySkillSourcePreview,scalingSkillPreview,directStrikeCoefficientPreview,elementalSpellCoefficientPreview,defensiveSkillPreview,resistanceSkillChoices,resistanceSkillPreview,encouragementBonus,guildPassiveAtLevel,
 base,characterSheetPhysicalAttackRange,classBase,classBaseComponents,bonusFor,halfToEven,effectiveAbility,gatherEffects,refinementEffects,attributeBuffBonus,guildRates,honorTitles,selectedHonor,potionRecovery,potionPreview,resistancePreview,regenerationPreview,combatPreview,racialWeaponPreview,incredibleStrengthPreview,weaponAttackPreview,defensePreview,equippedCombatModifiers,magicAttackPreview,sourceEffects,activeCombatSkills,combatSkillIds,combatSkillSource,supportSkillIds,supportSkillSource,supportSkillAvailability,
 recoveryAmountPreview,healingSkillPreview,healingSpellsPreview,periodicRecoveryPreview,consumableRecoveryPreview,consumableSkillPreview,statusCurePreview,harmfulConsumablePreview,gemstonePreview,legacyBuffPreview,songSkillPreview,secondaryEffectsPreview,auraDamagePreview,attackRangePreview,skillAttackRangePreview,racialUtilityPreview,elementalMagicPreview,elementalRefinementPreview,mountedReleasePreview,unisonPreview,effectCoverage,targetResistancePreview,conditionalProcPreview,experienceBonusPreview,battleMapCloakPreview,specialEquipmentPreview,deduplicateProcDescriptions,wardingStatusPassive
});
})(typeof window==='undefined'?globalThis:window);

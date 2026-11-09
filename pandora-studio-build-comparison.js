(function(root){
'use strict';
// A comparison reports saved choices, not a simulated game outcome.
const VITALS=[
 ['guildHp','Гильдия: ОЗ','Guild: HP',0],
 ['guildMp','Гильдия: ОМ','Guild: MP',0],
 ['lifeSign','Знак жизни','Sign of Life',false]
];
const BUFFS=[
 ['guildAll','Гильдия: характеристики','Guild: attributes',0],
 ['guildLifeRecovery','Гильдия: восстановление ОЗ','Guild: HP recovery',0],
 ['guildManaRecovery','Гильдия: восстановление ОМ','Guild: MP recovery',0],
 ['guildHealing','Гильдия: лечение','Guild: healing',0],
 ['guildArouse','Гильдия: пробуждение','Guild: arousal',0],
 // Preserve older build fields for accurate A/B differences without showing
 // an obsolete, non-current game term in either language.
 ['proelium','Прочее усиление','Other enhancement',false],
 ['proeliumPotency','Сила прочего усиления','Other enhancement strength',0],
 ['potionEffectsEnabled','Учитывать эффекты зелий','Include potion effects',false],
 ['combatWarCry','Боевой клич','War Cry',false],
 ['combatRage','Ярость','Rage',false],
 ['combatDefender','Защитная стойка','Defensive stance',false],
 ['combatLunge','Рывок','Lunge',false],
 ['combatWindAssist','Помощь ветра','Wind Assist',false],
 ['combatWindBlessing','Благословение ветра','Wind Blessing',false],
 ['combatConcentration','Сосредоточенность','Concentration',false]
];
const EN_SLOTS=['Weapon','Shield','Helmet','Armor','Gloves','Pants','Boots','Cloak',
 'Ring I','Ring II','Amulet','Belt','Earring I','Earring II'];
function savedItemName(selection,records,{lang='ru',kind='item',englishNames={}}={}){
 if(!selection||selection.id===undefined||selection.id===null)return lang==='en'?'empty':'пусто';
 const id=String(selection.id),numeric=/^[1-9][0-9]{0,14}$/.test(id);
 const record=numeric?records?.[id]:null;
 // The official catalog takes precedence over obsolete names embedded in saved builds.
 // Prefer actual RU/EN source fields. The published English dictionary is
 // verified game data; the saved snapshot's old copied name is last resort.
 const candidate=lang==='en'?(record?.nameEn||englishNames?.[id]?.n||
  record?.name?.en||record?.names?.en||record?.name?.ru||record?.names?.ru||
  record?.name):(record?.name?.ru||record?.names?.ru||record?.name||
  record?.nameEn);
 if(typeof candidate==='string'&&candidate.trim()&&!/^\d+$/.test(candidate.trim()))
  return candidate.trim();
 const legacy=selection?.name;
 if(typeof legacy==='string'&&legacy.trim()&&!/^\d+$/.test(legacy.trim()))
  return legacy.trim().slice(0,80);
 if(!numeric)return lang==='en'?'Unknown selection':'Неизвестный предмет';
 // No internal catalog IDs in the player-facing comparison. The IDs are
 // still retained in saved data and used for detecting changed selections.
 return kind==='soul'?(lang==='en'?'Soul not in catalog':'Душа отсутствует в каталоге'):
  (lang==='en'?'Item not in catalog':'Предмет отсутствует в каталоге');
}
function asValue(v,defaultValue){
 // Absent optional fields inherit their documented legacy defaults.
 // Damaged saved fields must stay unknown rather than silently becoming zero
 // or "Off" in the read-only comparison. Normalize exact decimal strings
 // kept by older select controls without changing the saved snapshot.
 if(v===undefined||v===null||v==='')return defaultValue;
 if(typeof defaultValue==='boolean')return typeof v==='boolean'?v:null;
 const normalized=typeof v==='string'&&/^(0|[1-9][0-9]*)$/.test(v.trim())?
  Number(v):v;
 return Number.isSafeInteger(normalized)&&normalized>=0?normalized:null;
}
// Legacy snapshots may lack fields; malformed numeric payloads stay unknown.
function savedNonnegativeInteger(raw){
 if(raw===undefined||raw===null||raw==='')return 0;
 if(typeof raw!=='number'&&
  (typeof raw!=='string'||!/^(0|[1-9][0-9]*)$/.test(raw.trim())))return null;
 const value=Number(raw);
 return Number.isSafeInteger(value)&&value>=0?value:null;
}
// A malformed saved grade must never impersonate legitimate +0 in A/B.
// Historical builds without an explicit grade are unrefined (+0).
// Identity stays internal: two different damaged values remain different in
// "Differences only", while the player sees only a neutral dash.
// Historical missing values keep their defaults; invalid explicit fields
// stay unknown rather than impersonating a genuine user choice.
function savedGender(snap){
 const raw=snap?.gender;
 if(raw===undefined||raw===null||raw==='')return 0;
 if(raw===0||raw===1)return raw;
 if(typeof raw==='string'&&/^[01]$/.test(raw.trim()))return Number(raw.trim());
 return null;
}
function savedMasteryAuto(snap){
 const raw=snap?.masteryAuto;
 return raw===undefined||raw===null?true:typeof raw==='boolean'?raw:null;
}
function savedHonorTitle(snap){
 const buffs=snap?.attributeBuffs,raw=buffs?.honorTitle;
 if(raw===undefined||raw===null||raw==='')return buffs?.honorCuriosity===true?1:0;
 const value=typeof raw==='string'&&/^(0|[1-9][0-9]*)$/.test(raw.trim())?
  Number(raw.trim()):raw;
 return Number.isSafeInteger(value)&&value>=0?value:null;
}
function identityOf(value){
 try{return JSON.stringify(value)}catch{return 'unreadable'}
}
function savedRefinement(snap,slot,item,calculate){
 if(!item||item.id==null||typeof calculate!=='function')
  return {value:null,identity:null};
 const key=slot+':'+String(item.id),raw=snap?.refinements?.[key];
 if(raw!==undefined&&(!Number.isInteger(raw)||raw<0||raw>10)){
  let original;
  try{original=JSON.stringify(raw)}catch{original='unreadable'}
  return {value:null,identity:'invalid:'+String(original)};
 }
 let grade=null;
 try{grade=calculate(snap,slot,item)}catch{}
 return Number.isInteger(grade)&&grade>=0&&grade<=10?
  {value:grade,identity:'grade:'+grade}:
  {value:null,identity:'unavailable'};
}
// Each saved build must retain its own calculation even if the other fails.
function calculatePair(a,b,calculate,ready=true){
 if(!ready||typeof calculate!=='function')return [null,null];
 return [a,b].map((snapshot,index)=>{
  try{return calculate(snapshot)??null}
  catch(error){
   console.warn('Build comparison: '+(index===0?'A':'B')+
    ' calculation unavailable',error);
   return null;
  }
 });
}
function gemAt(snap,index,enchant){
 const id=snap?.equipment?.[index]?.id;
 if(id===null||id===undefined)return null;
 return enchant?.normalize?.(snap.gems?.[index+':'+id])||null;
}
function gemName(value,language,enchant){
 if(!value)return '—';
 const t=enchant?.types?.find(x=>x.id===value.type);
 const e=enchant?.elements?.find(x=>x.id===value.element);
 if(!t||!e)return '—';
 const type=language==='en'?(t.id==='physical'?'Physical':'Magical'):t.ru;
 return type+' · '+(language==='en'?e.en:e.ru);
}
function describe(a,b,{lang='ru',slotLabels=[],enchant=null,honorTitles=[]}={}){
 const english=lang==='en',rows=[];
 const lbl=(ru,en)=>english?en:ru;
 const arrow=(name,x,y)=>rows.push(name+': '+x+' → '+y);
 const fmt=v=>v===null?'—':typeof v==='boolean'?lbl(v?'вкл':'выкл',v?'on':'off'):String(v);
 const gender=value=>savedGender(value);
 const genderName=value=>value===null?'—':value===1?
  lbl('мужской','male'):lbl('женский','female');
 if(gender(a)!==gender(b))arrow(lbl('Пол персонажа','Character gender'),
  genderName(gender(a)),genderName(gender(b)));
 for(let i=0;i<14;i++){
  const before=gemAt(a,i,enchant),after=gemAt(b,i,enchant);
  if(JSON.stringify(before)===JSON.stringify(after))continue;
  const slot=english?EN_SLOTS[i]:(slotLabels[i]||'Слот '+(i+1));
  arrow(lbl('Самоцвет: ','Gem: ')+slot,
   gemName(before,lang,enchant),gemName(after,lang,enchant));
 }
 for(const [field,ru,en,fallback]of VITALS){
  const before=asValue(a?.vitalsBuffs?.[field],fallback),
   after=asValue(b?.vitalsBuffs?.[field],fallback);
  if(before!==after)arrow(lbl(ru,en),fmt(before),fmt(after));
 }
 for(const [field,ru,en,fallback]of BUFFS){
  const before=asValue(a?.attributeBuffs?.[field],fallback),
   after=asValue(b?.attributeBuffs?.[field],fallback);
  if(before!==after)arrow(lbl(ru,en),fmt(before),fmt(after));
 }
 const titleId=savedHonorTitle;
 const at=titleId(a),bt=titleId(b);
 if(at!==bt){
  const name=id=>{
   if(id===null)return '—';
   const known=honorTitles[id]?.[english?'en':'ru'];
   return typeof known==='string'&&known.trim()?known:
    id===0?lbl('Без титула','None'):
    lbl('Титул отсутствует в каталоге','Honor title unavailable');
  };
  arrow(lbl('Титул чести','Honor title'),name(at),name(bt));
 }
 return rows;
}

/* Structured Build A/B comparison: rendered inside the saved-builds view, not
   a modal. Every computed metric comes from the SAME Hero Book summary matrix.
   Missing game data is unknown, never fabricated as zero. */
function matrixRows(a={},b={},options={}){
 const {lang='ru',races=[],jobs=[],stats=[],statLabels=[],branches=[],slotLabels=[],
  equipment={},souls={},skillCatalog={},englishSkills={},
  englishItems={},englishSouls={},enchant=null,honorTitles=[],
  calcA=null,calcB=null,summaryA=[],summaryB=[],trained=null,
  socketCapacity=null}=options;
 const english=lang==='en',rows=[];
 const label=(ru,en)=>english?en:ru;
 const fmtNumber=value=>{
  const n=Math.round(value*10000)/10000;
  return new Intl.NumberFormat(english?'en-US':'ru-RU',
   {maximumFractionDigits:4}).format(Object.is(n,-0)?0:n);
 };
 const readable=(value,kind)=>{
  if(value===null||value===undefined)return '—';
  if(kind==='number')return typeof value==='number'&&Number.isFinite(value)?
   fmtNumber(value):'—';
  if(kind==='boolean')return value===true?label('Вкл','On'):label('Выкл','Off');
  if(typeof value==='string')return value.trim()||'—';
  if(typeof value==='number'&&Number.isFinite(value))return fmtNumber(value);
  return '—';
 };
 const push=(section,group,key,ru,en,left,right,{kind='text',unit='',identityA,identityB}={})=>{
  const aText=readable(left,kind),bText=readable(right,kind);
  const number=kind==='number'&&typeof left==='number'&&typeof right==='number'&&
   Number.isFinite(left)&&Number.isFinite(right);
  const rawDelta=number?Math.round((right-left)*10000)/10000:null;
  const delta=number?(rawDelta>0?'+':'')+fmtNumber(rawDelta)+unit:null;
  rows.push({section,group,key,label:label(ru,en),a:aText+(aText==='—'?'':unit),
   b:bText+(bText==='—'?'':unit),
   equal:aText===bText&&(identityA===undefined&&identityB===undefined||
    identityA===identityB),delta,
   direction:rawDelta===null?'unavailable':
    rawDelta>0?'up':rawDelta<0?'down':'flat'});
 };
 const section=(ru,en)=>label(ru,en);
 const metadata=section('Персонаж','Character');
 push('character',metadata,'race','Раса','Race',
  races[a.race]?.[english?1:0],races[b.race]?.[english?1:0],
  {identityA:String(a.race??''),identityB:String(b.race??'')});
 const genderName=value=>value===null?null:value===1?
  label('Мужской','Male'):label('Женский','Female');
 const genderA=savedGender(a),genderB=savedGender(b);
 push('character',metadata,'gender','Пол','Gender',
  genderName(genderA),genderName(genderB),{
   identityA:genderA===null?'invalid:'+identityOf(a.gender):String(genderA),
   identityB:genderB===null?'invalid:'+identityOf(b.gender):String(genderB)
  });
 push('character',metadata,'job','Профессия','Class',jobs[a.job],jobs[b.job],
  {identityA:String(a.job??''),identityB:String(b.job??'')});
 push('character',metadata,'level','Уровень','Level',a.level,b.level,{kind:'number'});
 const profile=section('Профиль','Profile');
 const profileText=value=>value===undefined||value===null?'':typeof value==='string'?
  value.slice(0,250):null;
 for(const [key,ru,en] of [['guild','Гильдия','Guild'],['nation','Нация','Nation'],
  ['rank','Ранг','Rank'],['about','О герое','About']])
  push('character',profile,'profile.'+key,ru,en,
   profileText(a.profile?.[key]),profileText(b.profile?.[key]));
 const racialName=value=>{
  const id=value?.racialPassiveId;
  if(id==null)return '—';
  const source=skillCatalog[id],englishName=englishSkills[String(id)]?.n;
  const name=english?(source?.nameEn||englishName||source?.name?.en):
   (source?.name?.ru||source?.name);
  if(typeof name==='string'&&name.trim()&&!/^[0-9]+$/.test(name.trim()))
   return name.trim();
  return label('Расовая пассивка не найдена','Racial passive unavailable');
 };
 push('character',metadata,'racialPassiveId','Расовая пассивка','Racial passive',
  racialName(a),racialName(b),{
   identityA:String(a?.racialPassiveId??''),identityB:String(b?.racialPassiveId??'')
  });
 const invested=section('Распределённые характеристики','Allocated attributes');
 const ability=section('Характеристики с бонусами','Effective attributes');
 const keys=['vit','str','agi','dex','spi','int'];
 for(let i=0;i<keys.length;i++){
  // Keep legacy saved allocation keys; public labels may have changed.
  // AGI is saved under «Ловкость», DEX under «Сноровка», SPI under «Дух».
  const [storedRu,en]=stats[i]||[keys[i].toUpperCase(),keys[i].toUpperCase()];
  const ru=statLabels[i]||storedRu;
  const key=keys[i],from=savedNonnegativeInteger(a.stats?.[storedRu]),
   to=savedNonnegativeInteger(b.stats?.[storedRu]);
  push('character',invested,'points.'+key,ru,en,from,to,{kind:'number'});
  const valueA=calcA?.stats?.[key],valueB=calcB?.stats?.[key];
  push('results',ability,'effective.'+key,ru,en,valueA,valueB,{kind:'number'});
 }
 const totals=section('Результаты расчёта Книги героя','Hero Book results');
 for(let i=0;i<Math.max(summaryA.length,summaryB.length);i++){
  const groupA=summaryA[i],groupB=summaryB[i];
  const group=totals+' · '+label(groupA?.ru||groupB?.ru||'',
   groupA?.en||groupB?.en||'');
  const listA=groupA?.rows||[],listB=groupB?.rows||[];
  for(let j=0;j<Math.max(listA.length,listB.length);j++){
   const left=listA[j],right=listB[j];
   if(!left&&!right)continue;
   const valueA=left?.value,valueB=right?.value,unit=left?.unit||right?.unit||'';
   push('results',group,'result.'+i+'.'+j,left?.ru||right?.ru||'',
    left?.en||right?.en||'',valueA,valueB,{kind:'number',unit});
  }
 }
 // Hero Book displays a verified physical ATK interval (e.g. 50–74).
 // Comparing only its numeric maximum hides changes to trained minimum ATK.
 // Preserve the existing numeric maximum/delta, and add the full interval
 // ONLY for directly verified game-client fixtures. No invented minima.
 const verifiedAttackRange=calc=>{
  const attack=calc?.combat?.attack,min=attack?.minimum,max=attack?.known;
  return attack?.minimumVerified===true&&Number.isFinite(min)&&
   Number.isFinite(max)&&min>=0&&min<=max?min+'–'+max:null;
 };
 const attackRangeA=verifiedAttackRange(calcA),attackRangeB=verifiedAttackRange(calcB);
 if(attackRangeA!==null||attackRangeB!==null)
  push('results',totals+' · '+label('Атака','Attack'),'attack.range',
   'Диапазон АТК','ATK range',attackRangeA,attackRangeB);
 const skillGroup=section('Ветви и мастерство','Branches & mastery');
 const autoA=savedMasteryAuto(a),autoB=savedMasteryAuto(b);
 push('skills',skillGroup,'masteryAuto','Автоматическое мастерство','Automatic mastery',
  autoA,autoB,{kind:'boolean',
   identityA:autoA===null?'invalid:'+identityOf(a.masteryAuto):String(autoA),
   identityB:autoB===null?'invalid:'+identityOf(b.masteryAuto):String(autoB)});
 for(const branch of branches){
  const [id,ru,en]=branch;
  push('skills',skillGroup,'branch.'+id,ru,en,
   savedNonnegativeInteger(a.points?.[id]),
   savedNonnegativeInteger(b.points?.[id]),{kind:'number'});
  if(typeof trained==='function'){
   push('skills',skillGroup,'mastery.'+id,label('Мастерство: ','Mastery: ')+ru,
    'Mastery: '+en,trained(a,id),trained(b,id),{kind:'number'});
  }
 }
 const gearGroup=section('Снаряжение','Equipment');
 const soulGroup=section('Души','Souls');
 const gemGroup=section('Самоцветы','Gems');
 const actualSlot=(i)=>english?EN_SLOTS[i]:(slotLabels[i]||'Слот '+(i+1));
 for(let i=0;i<14;i++){
  const slot=actualSlot(i),x=a.equipment?.[i],y=b.equipment?.[i];
  push('equipment',gearGroup,'gear.'+i,slot,EN_SLOTS[i],
   savedItemName(x,equipment,{lang,englishNames:englishItems}),
   savedItemName(y,equipment,{lang,englishNames:englishItems}),{
    identityA:String(x?.id??''),identityB:String(y?.id??'')
   });
  if(x||y){
   const gradeA=savedRefinement(a,i,x,options.refinement),
    gradeB=savedRefinement(b,i,y,options.refinement);
   push('equipment',gearGroup,'refinement.'+i,'Заточка: '+slot,
    'Refinement: '+EN_SLOTS[i],gradeA.value,gradeB.value,
    {kind:'number',identityA:gradeA.identity,identityB:gradeB.identity});
   // Compare the player's chosen physical copy, not catalog defaults alone.
   const capacityA=typeof socketCapacity==='function'?socketCapacity(a,i,x):null;
   const capacityB=typeof socketCapacity==='function'?socketCapacity(b,i,y):null;
   if(capacityA!==null||capacityB!==null)
    push('equipment',gearGroup,'socketCapacity.'+i,
     'Слоты душ: '+slot,'Soul slots: '+EN_SLOTS[i],
     capacityA,capacityB,{kind:'number'});
  }
  const soulA=Array.isArray(a.souls?.[i])?a.souls[i]:
   a.souls?.[i]?[a.souls[i]]:[];
  const soulB=Array.isArray(b.souls?.[i])?b.souls[i]:
   b.souls?.[i]?[b.souls[i]]:[];
  for(let k=0;k<Math.max(soulA.length,soulB.length);k++)
   push('equipment',soulGroup,'soul.'+i+'.'+k,
    slot+' · '+label('Душа ','Soul ')+(k+1),
    EN_SLOTS[i]+' · Soul '+(k+1),
    savedItemName(soulA[k],souls,{lang,kind:'soul',englishNames:englishSouls}),
    savedItemName(soulB[k],souls,{lang,kind:'soul',englishNames:englishSouls}),{
     identityA:String(soulA[k]?.id??''),identityB:String(soulB[k]?.id??'')
    });
  const unrecognized=label('Самоцвет не распознан','Unrecognized gem');
  const readGem=(snap,item)=>{
   if(item?.id===undefined||item?.id===null)return {text:'—',identity:''};
   const raw=snap?.gems?.[i+':'+item.id];
   if(raw===undefined||raw===null)return {text:'—',identity:''};
   const gem=enchant?.normalize?.(raw)||null;
   const type=gem&&enchant?.types?.find(value=>value.id===gem.type);
   const element=gem&&enchant?.elements?.find(value=>value.id===gem.element);
   if(type&&element)return {text:(english?(type.en||type.id):type.ru)+
    ' · '+(english?element.en:element.ru),
    identity:gem.type+':'+gem.element};
   // Old or damaged selections are not empty sockets. Keep their internal
   // differences discoverable while never displaying raw IDs or payloads.
   let signature;
   try{signature=JSON.stringify(raw)}catch{signature='unreadable'};
   return {text:unrecognized,identity:'unknown:'+String(signature)};
  };
  if(x||y){
   const gemA=readGem(a,x),gemB=readGem(b,y);
   push('equipment',gemGroup,'gem.'+i,'Самоцвет: '+slot,
    'Gem: '+EN_SLOTS[i],gemA.text,gemB.text,
    {identityA:gemA.identity,identityB:gemB.identity});
  }
 }
 const buffGroup=section('Усиления и гильдия','Buffs & guild');
 for(const [key,ru,en,fallback]of VITALS){
  const read=s=>asValue(s.vitalsBuffs?.[key],fallback);
  push('buffs',buffGroup,'vital.'+key,ru,en,read(a),read(b),
   {kind:typeof fallback==='boolean'?'boolean':'number'});
 }
 for(const [key,ru,en,fallback]of BUFFS){
  const read=s=>asValue(s.attributeBuffs?.[key],fallback);
  push('buffs',buffGroup,'buff.'+key,ru,en,read(a),read(b),
   {kind:typeof fallback==='boolean'?'boolean':'number'});
 }
 const priest=section('Усиления жреца','Priest buffs');
 const extras=[
  ['guildLevel','Уровень гильдии','Guild level',0],
  ['priestEnabled','Внешний жрец включён','External priest enabled',false],
  ['priestSpi','Дух жреца','Priest spirit',0],
  ['priestBlessing','Благословение','Blessing',0],
  ['priestHymn','Песнопение','Hymn',0],
  ['priestEncouragement','Ободрение','Encouragement',false],
  ['priestGratia','Знак атаки','Attack blessing',false],
  ['priestLapisMedio','Знак защиты','Defense blessing',false],
  ['priestDarkAura','Тёмная аура','Dark aura',false],
  ['priestHolyWeapon','Священное оружие','Holy weapon',false]
 ];
 for(const [key,ru,en,fallback]of extras){
  const get=s=>asValue(s.attributeBuffs?.[key],fallback);
  push('buffs',priest,'priest.'+key,ru,en,get(a),get(b),
   {kind:typeof fallback==='boolean'?'boolean':'number'});
 }
 const title=id=>{
  if(id===null)return null;
  const known=honorTitles?.[id]?.[english?'en':'ru'];
  return typeof known==='string'&&known.trim()?known:
   id===0?label('Без титула','None'):
   label('Титул отсутствует в каталоге','Honor title unavailable');
 };
 const honorA=savedHonorTitle(a),honorB=savedHonorTitle(b);
 push('buffs',buffGroup,'honorTitle','Титул чести','Honor title',
  title(honorA),title(honorB),{
   identityA:honorA===null?'invalid:'+identityOf(a.attributeBuffs?.honorTitle):String(honorA),
   identityB:honorB===null?'invalid:'+identityOf(b.attributeBuffs?.honorTitle):String(honorB)
  });
 // Never expose internal skill IDs in a player-visible saved-build comparison.
 // Preserve identities separately: two missing source names can still differ.
 const resistanceSkills=s=>{
  const values=s.attributeBuffs?.resistanceSkillIds;
  if(values==null)return {names:'',identity:''};
  if(!Array.isArray(values))return {names:null,identity:'invalid:'+identityOf(values)};
  const ids=values.map(String);
  if(ids.some(id=>!/^[1-9][0-9]*$/.test(id)||
   !Number.isSafeInteger(Number(id))))return {names:null,identity:'invalid:'+identityOf(values)};
  const unique=[...new Set(ids)].sort((x,y)=>Number(x)-Number(y));
  const names=unique.map(id=>{
   const record=skillCatalog[id],official=englishSkills[id];
   const candidates=english?
    [record?.nameEn,official?.n,record?.name?.en,record?.names?.en,
     record?.name?.ru,record?.name]:
    [record?.name?.ru,record?.names?.ru,record?.name,record?.nameEn];
   const found=candidates.find(v=>typeof v==='string'&&v.trim()&&
    !/^[0-9]+$/.test(v.trim()));
   return found?found.trim():label('Умение отсутствует в каталоге','Skill not in catalog');
  });
  return {names:names.join(' · '),identity:unique.join(',')};
 };
 const resistanceA=resistanceSkills(a),resistanceB=resistanceSkills(b);
 push('buffs',buffGroup,'resistanceSkills','Умения сопротивления','Resistance skills',
  resistanceA.names,resistanceB.names,
  {identityA:resistanceA.identity,identityB:resistanceB.identity});
 return rows;
}


// Remaked-style comparison: only the principal calculated results.
// Equipment, skills, allocations and buffs are inputs, not extra table rows.
// The detailed matrixRows API remains available without affecting the UI.
const COMPACT_METRICS=Object.freeze([
 ['hp','ОЗ','HP'],['mp','ОМ','MP'],['attack','АТК','ATK'],
 ['magicAttack','МАТК','MATK'],['defense','Защита','Defense'],
 // These are already calculated by Hero Book. Omitting them would report
 // two genuinely different result sets as identical in compact A/B.
 ['frontAttack','АТК спереди','Front ATK'],
 ['backAttack','АТК сзади','Back ATK'],
 ['meleeRange','Дальн. АТК ближ. боя','Melee range (base)'],
 ['rangedRange','Дальн. АТК дальн. боя','Ranged range (base)'],
 ['physicalFlat','Сопр. физ (ед.)','Physical mitigation (flat)'],
 ['physicalResist','Сопр. физ (%)','Physical damage change'],
 ['magicDamageResist','Сопр. маг. урону','Magic damage change'],
 ['accuracy','Точность','Accuracy'],
 ['frontAccuracy','Точн. спереди','Front accuracy'],
 ['dodge','Уклонение','Evasion'],
 ['rangedEvasion','Укл. дальн. атак','Ranged evasion'],
 ['crit','Шанс крита','Critical chance'],
 ['critResist','Сопр. криту','Critical resistance'],
 ['critDamage','Крит. урон','Critical damage'],
 ['critDamageResist','Получ. крит. урон','Incoming critical damage'],
 ['attackSpeed','Скор. атаки','Attack speed'],
 ['moveSpeed','Скор. движения','Movement speed'],
 ['townSpeed','Скор. в городе','Town movement speed'],
 ['castSpeed','Скор. каста','Casting speed'],
 ['castTime','Сокрщ. времени каста','Cast time'],
 ['cooldown','Откат','Cooldown'],
 ['fire','Сопр. огню','Fire resistance'],['ice','Сопр. льду','Ice resistance'],
 ['lightning','Сопр. молниям','Lightning resistance'],
 ['poison','Сопр. яду','Poison resistance'],
 ['charm','Сопр. чарам','Charm resistance'],
 ['light','Сопр. свету','Light resistance'],
 ['dark','Сопр. тьме','Dark resistance'],
 ['physicalConditions','Сопр. аном. тел.','Physical conditions'],
 ['mentalConditions','Сопр. аном. дух.','Mental conditions'],
 ['magic','Сопр. магии','Magic resistance']
]);
// For damage taken and cooldown modifiers a smaller percentage is favorable.
const LOWER_IS_BETTER=new Set(['physicalResist','magicDamageResist','critDamageResist','cooldown']);
function compactResults(summaryA=[],summaryB=[],{lang='ru'}={}){
 const english=lang==='en';
 const byName=groups=>{
  const map=new Map();
  for(const group of Array.isArray(groups)?groups:[])
   for(const row of Array.isArray(group?.rows)?group.rows:[])
    if(typeof row?.ru==='string'&&!map.has(row.ru))map.set(row.ru,row);
  return map;
 };
 const first=byName(summaryA),second=byName(summaryB);
 const format=new Intl.NumberFormat(english?'en-US':'ru-RU',
  {maximumFractionDigits:4});
 const rounded=value=>Math.round(value*10000)/10000;
 const numeric=row=>typeof row?.value==='number'&&Number.isFinite(row.value)?
  rounded(row.value):null;
 const range=row=>typeof row?.display==='string'&&
  /^[0-9]+(?:\.[0-9]+)?–[0-9]+(?:\.[0-9]+)?$/.test(row.display)?
   row.display:null;
 const shown=(row,value,key,unit)=>value===null?'—':
  key==='attack'&&range(row)?range(row):format.format(value)+unit;
 const changes=[];
 for(const [key,ru,en] of COMPACT_METRICS){
  const a=first.get(ru),b=second.get(ru),left=numeric(a),right=numeric(b);
  // Two unavailable readings are not meaningful differences.
  if(left===null&&right===null)continue;
  const unitA=a?.unit||'',unitB=b?.unit||'';
  const verifiedRangesDiffer=key==='attack'&&range(a)&&range(b)&&
   range(a)!==range(b);
  if(left===right&&unitA===unitB&&!verifiedRangesDiffer)continue;
  const both=left!==null&&right!==null&&unitA===unitB;
  // A difference in the verified minimum cannot be misreported as Δ=0.
  const delta=both&&!(verifiedRangesDiffer&&left===right)?
   rounded(right-left):null;
  // A/B emphasis depends on the meaning of the stat, not the sign of B-A.
  // Missing or non-comparable readings do not claim an advantage.
  let advantage=null;
  if(both&&left!==right){
   const firstBetter=LOWER_IS_BETTER.has(key)?left<right:left>right;
   advantage=firstBetter?'a':'b';
  }else if(both&&verifiedRangesDiffer&&left===right){
   // Equal maximum ATK still allows a verified, stronger minimum.
   const minA=Number(range(a).split('–')[0]);
   const minB=Number(range(b).split('–')[0]);
   if(minA!==minB)advantage=minA>minB?'a':'b';
  }
  changes.push({
   key:'stat.'+key,label:english?en:ru,
   a:shown(a,left,key,unitA),b:shown(b,right,key,unitB),
   advantage,
   delta:delta===null?'—':(delta>0?'+':'')+format.format(delta)+unitA,
   direction:delta===null?'unavailable':
    delta>0?'up':delta<0?'down':'flat'
  });
 }
 return changes;
}

root.PandoraBuildComparison=Object.freeze({describe,savedItemName,matrixRows,compactResults,calculatePair});
})(typeof window==='undefined'?globalThis:window);

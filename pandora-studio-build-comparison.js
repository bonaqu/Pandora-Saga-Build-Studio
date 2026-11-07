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
 return typeof defaultValue==='boolean'?v===true:
  Number.isFinite(v)&&Number.isInteger(v)&&v>=0?v:defaultValue;
}
// Legacy snapshots may lack fields; malformed numeric payloads stay unknown.
function savedNonnegativeInteger(raw){
 if(raw===undefined||raw===null||raw==='')return 0;
 if(typeof raw!=='number'&&
  (typeof raw!=='string'||!/^(0|[1-9][0-9]*)$/.test(raw.trim())))return null;
 const value=Number(raw);
 return Number.isSafeInteger(value)&&value>=0?value:null;
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
 const fmt=v=>typeof v==='boolean'?lbl(v?'вкл':'выкл',v?'on':'off'):String(v);
 const gender=value=>value?.gender===1?1:0;
 if(gender(a)!==gender(b))arrow(lbl('Пол персонажа','Character gender'),
  gender(a)===1?lbl('мужской','male'):lbl('женский','female'),
  gender(b)===1?lbl('мужской','male'):lbl('женский','female'));
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
 const titleId=x=>Number.isInteger(x?.attributeBuffs?.honorTitle)?
  x.attributeBuffs.honorTitle:(x?.attributeBuffs?.honorCuriosity===true?1:0);
 const at=titleId(a),bt=titleId(b);
 if(at!==bt){
  const name=id=>{
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
  races[a.race]?.[english?1:0],races[b.race]?.[english?1:0]);
 push('character',metadata,'gender','Пол','Gender',a.gender===1?
  label('Мужской','Male'):label('Женский','Female'),
  b.gender===1?label('Мужской','Male'):label('Женский','Female'));
 push('character',metadata,'job','Профессия','Class',jobs[a.job],jobs[b.job]);
 push('character',metadata,'level','Уровень','Level',a.level,b.level,{kind:'number'});
 const profile=section('Профиль','Profile');
 for(const [key,ru,en] of [['guild','Гильдия','Guild'],['nation','Нация','Nation'],
  ['rank','Ранг','Rank'],['about','О герое','About']])
  push('character',profile,'profile.'+key,ru,en,
   String(a.profile?.[key]||'').slice(0,250),String(b.profile?.[key]||'').slice(0,250));
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
 push('skills',skillGroup,'masteryAuto','Автоматическое мастерство','Automatic mastery',
  a.masteryAuto!==false,b.masteryAuto!==false,{kind:'boolean'});
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
   push('equipment',gearGroup,'refinement.'+i,'Заточка: '+slot,
    'Refinement: '+EN_SLOTS[i],
    typeof options.refinement==='function'?options.refinement(a,i,x):0,
    typeof options.refinement==='function'?options.refinement(b,i,y):0,{kind:'number'});
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
  const gemLabel=v=>{
   if(!v)return '—';
   const t=enchant?.types?.find(x=>x.id===v.type);
   const e=enchant?.elements?.find(x=>x.id===v.element);
   if(!t||!e)return '—';
   return (english?(t.en||t.id):t.ru)+' · '+(english?e.en:e.ru);
  };
  const getGem=(snap,item)=>{
   if(!item?.id)return null;
   return enchant?.normalize?.(snap.gems?.[i+':'+item.id])||null;
  };
  if(x||y)push('equipment',gemGroup,'gem.'+i,'Самоцвет: '+slot,
   'Gem: '+EN_SLOTS[i],gemLabel(getGem(a,x)),gemLabel(getGem(b,y)));
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
  const known=honorTitles?.[id]?.[english?'en':'ru'];
  return typeof known==='string'&&known.trim()?known:
   id===0?label('Без титула','None'):
   label('Титул отсутствует в каталоге','Honor title unavailable');
 };
 const honorId=s=>Number.isInteger(s.attributeBuffs?.honorTitle)?
  s.attributeBuffs.honorTitle:(s.attributeBuffs?.honorCuriosity===true?1:0);
 const honorA=honorId(a),honorB=honorId(b);
 push('buffs',buffGroup,'honorTitle','Титул чести','Honor title',
  title(honorA),title(honorB),{identityA:String(honorA),identityB:String(honorB)});
 // Never expose internal skill IDs in a player-visible saved-build comparison.
 // Preserve identities separately: two missing source names can still differ.
 const resistanceSkills=s=>{
  const values=s.attributeBuffs?.resistanceSkillIds;
  if(values==null)return {names:'',identity:''};
  if(!Array.isArray(values))return {names:null,identity:null};
  const ids=values.map(String);
  if(ids.some(id=>!/^[1-9][0-9]*$/.test(id)||
   !Number.isSafeInteger(Number(id))))return {names:null,identity:null};
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

root.PandoraBuildComparison=Object.freeze({describe,savedItemName,matrixRows,calculatePair});
})(typeof window==='undefined'?globalThis:window);

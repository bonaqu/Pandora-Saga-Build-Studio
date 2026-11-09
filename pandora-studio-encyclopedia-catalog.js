(function(root){
'use strict';
const keys=Object.freeze([
 'meta','items','monsters','maps','instances','drops','trades','tables','chests','skills','souls','racialPassives'
]);
const isRecord=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function normalize(data){
 if(isRecord(data?.instances))return {...data,instances:Object.values(data.instances)};
 return data;
}
function validateRacialPassives(racialPassives,skills,counts){
 // Shared source integrity boundary for both Origin/builds and Encyclopedia.
 // Do not accept a partial D1 race registry or duplicated passive ownership.
 const expectedRaces=Number(counts?.racialPassives);
 const races=isRecord(racialPassives)?Object.entries(racialPassives):[];
 if(!Number.isSafeInteger(expectedRaces)||expectedRaces<1||
    races.length<expectedRaces)
  throw Error('Неполный каталог расовых пассивок');
 const raceIds=new Set(),ownedPassives=new Set();
 for(const [key,race] of races){
  if(!isRecord(race)||race.key!==key||
    !Number.isSafeInteger(race.raceId)||race.raceId<1||
    raceIds.has(race.raceId)||!Array.isArray(race.skills)||
    !race.skills.length)
   throw Error('Нарушены связи расовых пассивок с каталогом навыков');
  raceIds.add(race.raceId);
  for(const id of race.skills){
   const number=Number(id),skill=skills?.[String(id)];
   if(!Number.isSafeInteger(id)||number<1||ownedPassives.has(number)||
     skill?.skillType!=='PASSIVE'||skill?.branch!=='race')
    throw Error('Нарушены связи расовых пассивок с каталогом навыков');
   ownedPassives.add(number);
  }
 }
 return true;
}
// One validation boundary for the Wiki and the character builder. Both need
// the SAME verified source records before consuming stats, skills or Soul
// effects. This function intentionally does not require Wiki-only datasets.
function validateCharacterCatalog(data){
 for(const kind of ['items','skills','souls']){
  if(!isRecord(data?.[kind]))
   throw Error('Неверный формат каталога: '+kind);
  for(const [key,row] of Object.entries(data[kind]))
   if(!isRecord(row)||Object.hasOwn(row,'id')&&String(row.id)!==key)
    throw Error('Не совпадает идентификатор записи игрового каталога: '+kind);
 }
 // The Hero Path and skill encyclopedia trust these numeric costs and
 // prerequisites. A malformed D1 record must not masquerade as official
 // mana, cooldown, level or mastery requirements. Never invent defaults
 // for fields omitted by an older valid source snapshot.
 const skillBranches=new Set(Object.values(data.skills).map(row=>row.branch)
  .filter(value=>typeof value==='string'&&value.trim()));
 for(const row of Object.values(data.skills)){
  if(typeof row.name!=='string'||!row.name.trim())
   throw Error('Некорректное название умения в игровом каталоге');
  for(const field of ['mana','cast','cooldown','motion','range'])
   if(row[field]!=null&&!(typeof row[field]==='number'&&
    Number.isFinite(row[field])&&row[field]>=0))
    throw Error('Некорректные числовые параметры умения');
  for(const field of ['reqLevel','charLevel'])
   if(row[field]!=null&&!(Number.isSafeInteger(row[field])&&row[field]>=0))
    throw Error('Некорректный порог уровня умения');
  for(const field of ['learnable','rangeFromWeapon'])
   if(row[field]!=null&&typeof row[field]!=='boolean')
    throw Error('Некорректный тип свойства умения');
  if(row.aoe!=null&&!(Array.isArray(row.aoe)&&row.aoe.length===2&&
   row.aoe.every(value=>typeof value==='number'&&
    Number.isFinite(value)&&value>=0)))
   throw Error('Некорректная область действия умения');
  if(row.prereq!=null&&!(Number.isSafeInteger(row.prereq)&&
   row.prereq>=0&&(row.prereq===0||
    Object.hasOwn(data.skills,String(row.prereq)))))
   throw Error('Неизвестное предыдущее умение');
  if(row.reqs!=null&&!(Array.isArray(row.reqs)&&
   row.reqs.every(req=>isRecord(req)&&
    typeof req.branch==='string'&&skillBranches.has(req.branch)&&
    Number.isSafeInteger(req.amount)&&req.amount>=0)))
   throw Error('Некорректные требования ветки умения');
 }
 // The equipment picker, Hero Book and per-copy Soul UI all consume
 // these source item numbers. Reject corrupted D1 values rather than
 // displaying guessed defense, attack, Soul capacity or refinement.
 for(const row of Object.values(data.items)){
  if(typeof row.name!=='string'||!row.name.trim()||
   row.kind!=null&&(typeof row.kind!=='string'||!row.kind.trim()))
   throw Error('Некорректное название или тип предмета');
  if(row.slot!=null&&(typeof row.slot!=='string'||!row.slot.trim()))
   throw Error('Некорректный слот предмета');
  if(row.soulslot!=null&&!(Number.isSafeInteger(row.soulslot)&&
   row.soulslot>=0&&row.soulslot<=3))
   throw Error('Некорректная вместимость душ предмета');
  for(const field of ['AC','PEN','W','atkspeed','block','level','plus','range'])
   if(row[field]!=null&&!(Number.isSafeInteger(row[field])&&
    row[field]>=0&&(field!=='level'||row[field]>0)))
    throw Error('Некорректные числовые характеристики предмета');
  for(const field of ['twoHanded','unobtainable'])
   if(row[field]!=null&&typeof row[field]!=='boolean')
    throw Error('Некорректный флаг предмета');
  if(row.classes!=null&&!isRecord(row.classes))
   throw Error('Некорректные ограничения профессий предмета');
  if(row.effects!=null&&!Array.isArray(row.effects))
   throw Error('Некорректные эффекты предмета');
 }
 // Soul effects and sockets are used by the equipment and Hero Book.
 // A broken nested value in D1 must not be presented as a sourced bonus.
 // Keep absent optional properties absent for older valid snapshots.
 const soulSlots=new Set(['weapon','shield','head','body','gloves','legs','feet','belt']);
 for(const row of Object.values(data.souls)){
  if(typeof row.name!=='string'||!row.name.trim())
   throw Error('Некорректное название души');
  if(row.price!=null&&!(Number.isSafeInteger(row.price)&&row.price>=0))
   throw Error('Некорректная цена души');
  if(row.slots!=null&&!(Array.isArray(row.slots)&&row.slots.length>0&&
   row.slots.every(slot=>typeof slot==='string'&&soulSlots.has(slot))&&
   new Set(row.slots).size===row.slots.length))
   throw Error('Некорректные слоты души');
  if(row.effects!=null){
   if(!Array.isArray(row.effects))
    throw Error('Некорректные эффекты души');
   for(const effect of row.effects){
    if(!isRecord(effect)||typeof effect.func!=='string'||!effect.func.trim()||
     effect.dir!=null&&(typeof effect.dir!=='string'||!effect.dir.trim()))
     throw Error('Некорректный эффект души');
    for(const field of ['a','b','min','max'])
     if(effect[field]!=null&&!(typeof effect[field]==='number'&&
      Number.isFinite(effect[field])))
      throw Error('Некорректное число эффекта души');
    if(effect.min!=null&&effect.max!=null&&effect.min>effect.max)
     throw Error('Некорректный диапазон эффекта души');
   }
  }
 }
 // Check cross-record ownership only after record shape and identity are
 // verified; otherwise a null or mismatched passive skill is misreported as
 // a race-registry defect instead of a broken skills record.
 validateRacialPassives(data.racialPassives,data.skills,data.meta.counts);
 return true;
}
// Character-only sources are not loaded by the Wiki's lighter 12-dataset
// index. Verify these additional D1 records before any Hero calculations,
// without inventing values or changing the official enhancement formulas.
function validateCharacterExtras(data){
 if(!isRecord(data?.classes)||!isRecord(data?.unison)||
  !isRecord(data?.itemForth))
  throw Error('Неверный формат дополнительных таблиц персонажа');
 const finite=value=>typeof value==='number'&&Number.isFinite(value);
 for(const [key,job] of Object.entries(data.classes)){
  if(!isRecord(job)||job.id!==key||typeof job.name!=='string'||!job.name.trim()||
   !isRecord(job.hp)||!isRecord(job.mp)||
   !isRecord(job.statCaps)||!isRecord(job.branchCaps))
   throw Error('Некорректная профессия в игровом каталоге');
  for(const ref of ['parent','baseClass'])
   if(job[ref]!=null&&!(typeof job[ref]==='string'&&
    Object.hasOwn(data.classes,job[ref])))
    throw Error('Некорректная цепочка профессий');
  for(const [kind,properties] of [['hp',['base','lv','vit']],['mp',['base','lv','spi']]])
   for(const property of properties)
    if(!finite(job[kind][property])||job[kind][property]<0)
     throw Error('Некорректные параметры ОЗ/ОМ профессии');
  if(!Object.keys(job.statCaps).length||!Object.keys(job.branchCaps).length)
   throw Error('Неизвестные ограничения профессии');
  for(const value of Object.values(job.statCaps))
   if(!Number.isSafeInteger(value)||value<0||value>99)
    throw Error('Некорректный предел характеристики профессии');
  for(const value of Object.values(job.branchCaps))
   if(!Number.isSafeInteger(value)||value<0||value>1000)
    throw Error('Некорректный предел ветки профессии');
 }
 // Refinement effect keys refer to canonical items, not a separate item.
 // Do not constrain source effect numbers to naive percent ranges: some
 // valid OS effect constants encode flags and are much larger than 100.
 for(const [id,tiers] of Object.entries(data.itemForth)){
  if(!/^[1-9][0-9]{0,14}$/.test(id)||!Object.hasOwn(data.items,id)||
    !isRecord(tiers))
   throw Error('Некорректный предмет таблицы заточки');
  for(const [grade,effects] of Object.entries(tiers)){
   if(!/^(10|[0-9])$/.test(grade)||!Array.isArray(effects))
    throw Error('Некорректная ступень заточки предмета');
   for(const effect of effects){
    if(!isRecord(effect)||typeof effect.func!=='string'||!effect.func.trim())
     throw Error('Некорректный эффект заточки предмета');
    for(const value of ['a','b'])
     if(effect[value]!=null&&!finite(effect[value]))
      throw Error('Некорректный числовой эффект заточки');
   }
  }
 }
 for(const [id,group] of Object.entries(data.unison)){
  if(!isRecord(group)||String(group.id)!==id||
    !/^[1-9][0-9]{0,14}$/.test(id)||
    !Object.hasOwn(data.items,id)||!Array.isArray(group.members)||
    !group.members.length||!Array.isArray(group.rows))
   throw Error('Некорректная группа комплекта');
  const members=new Set();
  for(const member of group.members){
   const key=String(member);
   if(!Number.isSafeInteger(member)||member<1||
    !Object.hasOwn(data.items,key)||members.has(key))
    throw Error('Некорректный предмет комплекта');
   members.add(key);
  }
  for(const row of group.rows){
   if(!isRecord(row)||typeof row.func!=='string'||!row.func.trim()||
    !Number.isSafeInteger(row.minC)||!Number.isSafeInteger(row.maxC)||
    row.minC<0||row.maxC<row.minC||row.maxC>members.size||
    !Number.isSafeInteger(row.minL)||!Number.isSafeInteger(row.maxL)||
    row.minL<0||row.maxL<row.minL||row.maxL>10)
    throw Error('Некорректные условия комплекта');
   for(const coeff of [row.a,row.b]){
    if(!isRecord(coeff)||!['f','p','c'].every(key=>finite(coeff[key])))
     throw Error('Некорректные коэффициенты комплекта');
   }
  }
 }
 return true;
}
// Game tables that drive origin and the Hero Book need explicit source
// integrity checks. Bounds validate JSON structure, NOT undocumented game
// mechanics: signed forge rates and large enhancement constants are valid.
function validateCharacterTables(tables){
 if(!isRecord(tables)||!isRecord(tables.raceInit)||
  !isRecord(tables.jobInit)||!isRecord(tables.abilityPoint)||
  !isRecord(tables.exp)||!isRecord(tables.weaponPlus)||
  !isRecord(tables.magicPlus)||!isRecord(tables.forge))
  throw Error('Неверный формат расчётных таблиц');
 const integer=(value,min=0)=>Number.isSafeInteger(value)&&value>=min;
 const finite=value=>typeof value==='number'&&Number.isFinite(value);
 const attrs=['vit','str','agi','dex','spi','int'];
 for(const [kind,entries] of [['раса',tables.raceInit],
  ['профессия',tables.jobInit]]){
  if(!Object.keys(entries).length)throw Error('Пустая таблица: '+kind);
  for(const row of Object.values(entries)){
   if(!isRecord(row)||!attrs.every(key=>integer(row[key])))
    throw Error('Некорректные начальные характеристики: '+kind);
   if(kind==='профессия'&&(!isRecord(row.branches)||
    !Object.values(row.branches).every(value=>integer(value))))
    throw Error('Некорректное стартовое мастерство профессии');
  }
 }
 const numericKey=key=>/^[1-9][0-9]{0,2}$/.test(key);
 for(const [lv,points] of Object.entries(tables.abilityPoint))
  if(!numericKey(lv)||!integer(points))
   throw Error('Некорректная таблица очков мастерства');
 for(const [lv,record] of Object.entries(tables.exp)){
  if(!numericKey(lv)||!isRecord(record)||
   !['ability','skill','skillLimit'].every(field=>integer(record[field]))||
   !finite(record.expReq)||record.expReq<0)
   throw Error('Некорректная прогрессия персонажа');
 }
 for(const kind of ['weaponPlus','magicPlus'])
  for(const [grade,row] of Object.entries(tables[kind])){
   if(!/^(10|[1-9])$/.test(grade)||!isRecord(row)||
    !finite(row.ratio)||row.ratio<0||!finite(row.flat)||row.flat<0)
    throw Error('Некорректная таблица бонусов заточки');
  }
 const forge=tables.forge;
 if(!Array.isArray(forge.rates)||!Array.isArray(forge.gemTiers)||
  !Array.isArray(forge.hammers)||!isRecord(forge.rework))
  throw Error('Некорректная структура кузницы');
 const grades=new Set();
 for(const row of forge.rates){
  if(!isRecord(row)||!integer(row.plus,1)||row.plus>10||
   grades.has(row.plus)||!finite(row.weapon)||!finite(row.armor))
   throw Error('Некорректные ставки кузницы');
  grades.add(row.plus);
 }
 const tiers=new Set();
 for(const row of forge.gemTiers){
  if(!isRecord(row)||!integer(row.tier,1)||tiers.has(row.tier)||
   !finite(row.rate)||!integer(row.cost))
   throw Error('Некорректные уровни самоцветов');
  tiers.add(row.tier);
  for(const field of ['colors','sample'])
   if(row[field]!=null&&!integer(row[field]))
    throw Error('Некорректные параметры самоцвета');
 }
 for(const hammer of forge.hammers){
  if(!isRecord(hammer)||!integer(hammer.id,1)||
   typeof hammer.effect!=='string'||!hammer.effect.trim())
   throw Error('Некорректный молот кузницы');
  for(const field of ['limit','factor'])
   if(hammer[field]!=null&&!finite(hammer[field]))
    throw Error('Некорректный параметр молота кузницы');
 }
 for(const field of ['pityPerFail','pityCap','durabilityMax',
  'durabilityFallback','repairRestore','repairFee'])
  if(forge.rework[field]!=null&&(!finite(forge.rework[field])||
   forge.rework[field]<0))
   throw Error('Некорректные параметры ремонта и заточки');
 if(tables.levelCap!=null&&!integer(tables.levelCap,1))
  throw Error('Некорректный текущий серверный лимит');
 return true;
}
function validate(input){
 const data=normalize(input);
 if(!isRecord(data)||!isRecord(data.meta)||!isRecord(data.meta.counts))
  throw Error('Каталог не содержит сведений о версии данных');
 for(const key of ['items','monsters','maps','drops','skills','souls'])
  if(!isRecord(data[key]))throw Error('Неверный формат каталога: '+key);
 if(!Array.isArray(data.instances)||!data.instances.every(isRecord))
  throw Error('Неверный формат подземелий');
 if(!isRecord(data.trades)||!Array.isArray(data.trades.trades)||
  !isRecord(data.trades.npcs)||!isRecord(data.trades.mapNames))
  throw Error('Неверный формат обменов NPC');
 if(!isRecord(data.tables)||!Array.isArray(data.tables.zoneDrops))
  throw Error('Неверный формат добычи локаций');
 if(!isRecord(data.chests)||!Array.isArray(data.chests.boxes)||
    !Array.isArray(data.chests.npc))
  throw Error('Неверный формат сундуков');
 for(const key of ['items','monsters','maps','instances','drops','trades','skills','souls']){
  const observed=Array.isArray(data[key])?data[key].length:
   key==='trades'?data.trades.trades.length:Object.keys(data[key]).length;
  const expected=Number(data.meta.counts[key]);
  if(!Number.isSafeInteger(expected)||expected<1||observed<expected)
   throw Error('Неполный каталог '+key+': '+observed+' из '+expected);
 }
 // A source record is reached by its dictionary key in the equipment picker,
 // Wiki links, Soul relations and combat index. A conflicting embedded id
 // would make one card claim to be another, even if counts and cross-links
 // happen to match. Older key-only records remain valid.
 for(const kind of ['items','monsters','skills','souls'])
  for(const [key,row] of Object.entries(data[kind])){
   if(!isRecord(row)||Object.hasOwn(row,'id')&&String(row.id)!==key)
    throw Error('Не совпадает идентификатор записи игрового каталога: '+kind);
  }
 validateCharacterCatalog(data);
 // Monster cards display source HP/level/defenses and resistances
 // as game facts. Never turn malformed D1 numbers into valid-looking
 // values, while retaining legitimate negative resistances (weaknesses).
 for(const row of Object.values(data.monsters)){
  if(typeof row.name!=='string'||!row.name.trim())
   throw Error('Некорректное название монстра');
  for(const field of ['level','life','ac','vit','str','agi','dex','spi','int',
   'warding','magicProtection'])
   if(row[field]!=null&&!(Number.isSafeInteger(row[field])&&
    row[field]>=0&&(field!=='life'||row[field]>0)))
    throw Error('Некорректные характеристики монстра');
  if(row.lvMod!=null&&!Number.isSafeInteger(row.lvMod))
   throw Error('Некорректная модификация уровня монстра');
  if(row.resists!=null){
   if(!isRecord(row.resists))
    throw Error('Некорректные сопротивления монстра');
   for(const [type,value] of Object.entries(row.resists))
    if(!['physical','fire','cold','lightning','poison','charm','magic',
     'holy','dark'].includes(type)||
     !Number.isSafeInteger(value)||value< -1000||value>1000)
     throw Error('Некорректные сопротивления монстра');
  }
 }
 // Wiki indexes dungeons by String(row.id) with Object.fromEntries().
 // Two source rows with the same ID silently overwrite one dungeon card,
 // while a missing/non-numeric ID creates an invalid deep link. Check these
 // BEFORE declaring a D1 snapshot complete, regardless of matching counts.
 const seenInstances=new Set();
 for(const instance of data.instances){
  if(typeof instance.name!=='string'||!instance.name.trim())
   throw Error('Некорректное название подземелья');
  for(const field of ['kind','quest','blurb','blurbRu'])
   if(instance[field]!=null&&typeof instance[field]!=='string')
    throw Error('Некорректный текст подземелья');
  const raw=instance.id,id=String(raw);
  if(!/^[1-9][0-9]{0,14}$/.test(id)||
   !Number.isSafeInteger(Number(id))||seenInstances.has(id))
   throw Error('Повторный или некорректный ID подземелья в игровом каталоге');
  seenInstances.add(id);
 }
 const exists=(records,id)=>id!=null&&Object.hasOwn(records,String(id));
 const item=id=>exists(data.items,id)||exists(data.souls,id);
 const monster=id=>exists(data.monsters,id);
 const map=id=>exists(data.maps,id)||exists(data.trades.mapNames,id);
 const npc=id=>exists(data.trades.npcs,id);
 const requireRef=(valid,relation)=>{
  if(!valid)throw Error('Нарушены связи игрового каталога: '+relation);
 };
 // A string is iterable too, but it is NOT an array of game IDs.
 // Reject broken nested collections before the Wiki silently loses links
 // or interprets a numeric string as several different monster IDs.
 const list=(value,relation)=>{
  requireRef(value==null||Array.isArray(value),'список '+relation);
  return value||[];
 };
 for(const row of Object.values(data.maps)){
  requireRef(isRecord(row)&&typeof row.name==='string'&&row.name.trim(),
   'название локации');
  for(const id of list(row.mobs,'монстров локации'))
   requireRef(monster(id),'монстры локаций');
  list(row.npcs,'NPC локации');
 }
 for(const row of data.instances)
  for(const id of list(row.mobs,'монстров подземелья'))
   requireRef(monster(id),'монстры подземелий');
 for(const [id,group] of Object.entries(data.drops)){
  requireRef(monster(id)&&isRecord(group),'таблица добычи монстра');
  for(const row of [...list(group.d,'обычной добычи'),
    ...list(group.s,'добычи душ')]){
   requireRef(isRecord(row)&&item(row.i),'предмет добычи монстра');
   // Monster loot is displayed as source-backed chance, quantity, refine
   // and possible Soul roll. Reject corrupt numbers; never round a made-up
   // probability or silently drop a broken Soul relation.
   if(row.p!=null)
    requireRef(typeof row.p==='number'&&Number.isFinite(row.p)&&
     row.p>=0&&row.p<=100,'шанс добычи монстра');
   if(row.n!=null)
    requireRef(Number.isSafeInteger(row.n)&&row.n>=1&&row.n<=999999,
     'количество добычи монстра');
   if(row.slotAdd!=null)
    requireRef(Number.isSafeInteger(row.slotAdd)&&row.slotAdd>=0&&
     row.slotAdd<=3,'слоты душ добычи монстра');
   for(const boundary of ['lo','hi'])
    if(row[boundary]!=null)
     requireRef(Number.isSafeInteger(row[boundary])&&
      row[boundary]>=0&&row[boundary]<=1000,
      'границы улучшения добычи монстра');
   if(row.lo!=null&&row.hi!=null)
    requireRef(row.lo<=row.hi,'диапазон улучшения добычи монстра');
   if(row.souls!=null){
    requireRef(Array.isArray(row.souls)&&row.souls.length<=20,
     'список душ добычи монстра');
    for(const pair of row.souls)
     requireRef(Array.isArray(pair)&&pair.length===2&&
      Number.isSafeInteger(pair[0])&&pair[0]>0&&
      Object.hasOwn(data.souls,String(pair[0]))&&
      typeof pair[1]==='number'&&Number.isFinite(pair[1])&&
      pair[1]>=0&&pair[1]<=100,'душа добычи монстра');
   }
  }
 }
 // NPC trade lists preserve recipes individually. A duplicate or absent
 // source recipe ID creates indistinguishable offers despite valid item/NPC
 // links and can survive a simple published-row count check.
 const seenTrades=new Set();
 for(const recipe of data.trades.trades){
  const id=String(recipe?.id);
  requireRef(isRecord(recipe)&&/^[1-9][0-9]{0,14}$/.test(id)&&
   Number.isSafeInteger(Number(id))&&!seenTrades.has(id),
   'повторный или некорректный обмен NPC');
  seenTrades.add(id);
  requireRef(item(recipe.i),'награда обмена NPC');
  // An untrusted published snapshot must not display fractional/negative
  // costs as official gameplay requirements. Missing fields remain unknown
  // to support older source snapshots rather than inventing a price of zero.
  for(const currency of ['exp','gold','honor'])
   if(recipe[currency]!=null)
    requireRef(Number.isSafeInteger(recipe[currency])&&recipe[currency]>=0,
     'стоимость обмена NPC');
  const seenMaterials=new Set();
  for(const material of list(recipe.mats,'материалов обмена')){
   requireRef(isRecord(material)&&item(material.i),'материал обмена NPC');
   const materialId=String(material.i);
   requireRef(!seenMaterials.has(materialId),'повторный материал обмена NPC');
   seenMaterials.add(materialId);
   if(material.n!=null)
    requireRef(Number.isSafeInteger(material.n)&&material.n>=1,
     'количество материала обмена NPC');
  }
  if(recipe.limit!=null)
   requireRef(isRecord(recipe.limit)&&
    Number.isSafeInteger(recipe.limit.n)&&recipe.limit.n>=1&&
    ['daily','weekly','lifetime'].includes(recipe.limit.period),
    'ограничение обмена NPC');
  const seenRecipeNpc=new Set();
  for(const id of list(recipe.npc,'NPC обмена')){
   requireRef(npc(id),'NPC обмена');
   requireRef(!seenRecipeNpc.has(String(id)),'повторный NPC обмена');
   seenRecipeNpc.add(String(id));
  }
 }
 for(const row of Object.values(data.trades.npcs)){
  requireRef(isRecord(row)&&typeof row.name==='string'&&row.name.trim(),
   'название NPC');
  for(const id of list(row.maps,'локаций NPC'))
   requireRef(map(id),'расположение NPC');
 }
 for(const row of Object.values(data.trades.mapNames))
  requireRef(isRecord(row)&&typeof row.name==='string'&&row.name.trim(),
   'название локации NPC');
 // The Encyclopedia merges ordinary and NPC chests by item ID.
 // Duplicate IDs overwrite one card without warning, while a malformed
 // gold-only reward becomes "reward not listed" despite a real source row.
 // Reject BOTH defects before accepting a D1 snapshot as authoritative.
 const seenChests=new Set();
 for(const chest of [...data.chests.boxes,...data.chests.npc]){
  requireRef(isRecord(chest)&&item(chest.i),'сундук');
  const chestId=String(chest.i);
  requireRef(!seenChests.has(chestId),'повторный сундук');
  seenChests.add(chestId);
  if(chest.key!=null)requireRef(item(chest.key),'ключ сундука');
  requireRef(Array.isArray(chest.rolls),'группы наград сундука');
  for(const group of chest.rolls){
   requireRef(Array.isArray(group),'группа наград сундука');
   for(const row of group){
    requireRef(isRecord(row),'награда сундука');
    const hasItem=row.i!=null,hasGold=Object.hasOwn(row,'gold');
    requireRef(hasItem!==hasGold,'тип награды сундука');
    // Keep an unknown source chance unknown. Reject malformed published
    // probabilities and quantities instead of displaying false game facts.
    if(row.p!=null)
     requireRef(typeof row.p==='number'&&Number.isFinite(row.p)&&
      row.p>=0&&row.p<=100,'шанс награды сундука');
    if(hasItem){
     requireRef(item(row.i),'награда сундука');
     if(row.n!=null)
      requireRef(Number.isSafeInteger(row.n)&&row.n>=1&&row.n<=999999,
       'количество награды сундука');
     if(row.plus!=null)
      requireRef(Number.isSafeInteger(row.plus)&&row.plus>=0&&row.plus<=20,
       'заточка награды сундука');
     if(row.soul!=null)
      requireRef(Number.isSafeInteger(row.soul)&&row.soul>=0&&row.soul<=3,
       'слоты душ награды сундука');
    }
    if(hasGold){
     const gold=row.gold;
     requireRef(Object.keys(row).every(key=>key==='gold'||key==='p'),
      'структура золотой награды сундука');
     requireRef(Array.isArray(gold)&&gold.length===2&&
      gold.every(value=>Number.isSafeInteger(value)&&value>=0)&&
      gold[0]<=gold[1],'диапазон золота сундука');
    }
   }
  }
 }
 if(data.chests.masterKey!=null)
  requireRef(item(data.chests.masterKey),'универсальный ключ сундука');
 for(const zone of data.tables.zoneDrops){
  requireRef(isRecord(zone)&&map(zone.map),'место добычи');
  for(const group of list(zone.rows,'добычи локации')){
   requireRef(isRecord(group),'группа добычи локации');
   if(group.mob!=null)requireRef(monster(group.mob),'монстр добычи локации');
   // Base and per-member numbers are source rates, not a guessed summed
   // probability. Keep missing fields unknown for historical snapshots.
   for(const field of ['base','perMember'])
    if(group[field]!=null)
     requireRef(typeof group[field]==='number'&&
      Number.isFinite(group[field])&&group[field]>=0&&
      group[field]<=100,'вероятность добычи локации');
   for(const row of list(group.items,'наград локации')){
    requireRef(isRecord(row)&&item(row.i),'награда добычи локации');
    for(const field of ['lo','hi'])
     if(row[field]!=null)
      requireRef(Number.isSafeInteger(row[field])&&row[field]>=0&&
       row[field]<=1000,'улучшение награды локации');
    if(row.lo!=null&&row.hi!=null)
     requireRef(row.lo<=row.hi,'диапазон улучшения награды локации');
   }
  }
 }
 return data;
}
async function load({api,fetcher,local='./data/os',timeout=12000,preferLocal=false,strict=false}={}){
 if(typeof fetcher!=='function')throw TypeError('fetcher required');
 const remoteBase=String(api||'').replace(/\/$/,'');
 async function batch(remote){
  const snapshots=new Set(),missingSnapshot=[];
  const records=await Promise.all(keys.map(async key=>{
   const url=remote?remoteBase+'/api/catalog/'+key+'.json':
    local.replace(/\/$/,'')+'/'+key+'.json';
   const init={cache:'no-cache'};
   if(typeof AbortSignal!=='undefined'&&typeof AbortSignal.timeout==='function')
    init.signal=AbortSignal.timeout(timeout);
   const response=await fetcher(url,init);
   if(!response?.ok)throw Error(key+' HTTP '+(response?.status??'network'));
   if(remote){
    // A backup JSON with plausible headers must not impersonate D1.
    if(response.headers?.get?.('x-ps-catalog')!=='d1')
     throw Error('Игровой каталог не подтвердил источник D1: '+key);
    const snapshot=response.headers?.get?.('x-ps-catalog-snapshot')||null;
    if(snapshot)snapshots.add(snapshot);else missingSnapshot.push(key);
   }
   return [key,await response.json()];
  }));
  if(remote&&(snapshots.size!==1||missingSnapshot.length))
   throw Error('В ходе загрузки версия опубликованного каталога изменилась');
  return {data:validate(Object.fromEntries(records)),
   source:remote?'d1':'local',snapshot:remote?[...snapshots][0]||null:null};
 }
 if(preferLocal)return batch(false);
 try{
  const loaded=await batch(true);
  // Only localized copy is borrowed from our checked-in OS archive. Never
  // replace remotely updated instance gameplay fields or changed descriptions.
  // Skip the extra request when this catalog has no descriptions to translate.
  if(loaded.data.instances.some(row=>row.blurb&&!row.blurbRu))try{
   const response=await fetcher(local.replace(/\/$/,'')+'/instances.json',{cache:'no-cache'});
   if(response?.ok){
    const rows=await response.json();
    const localRows=new Map((Array.isArray(rows)?rows:Object.values(rows))
     .map(row=>[String(row.id),row]));
    loaded.data.instances=loaded.data.instances.map(instance=>{
     const translated=localRows.get(String(instance.id));
     return !instance.blurbRu&&translated?.blurbRu&&translated.blurb===instance.blurb?
      {...instance,blurbRu:translated.blurbRu}:instance;
    });
   }
  }catch{}
  // D1 is authoritative for gameplay records. The only permitted local
  // complement is source-matched RU instance copy above: never substitute
  // historical monster stats or loot for a validated D1 snapshot.

  return loaded;
 }
 catch(remoteError){
  if(strict)throw remoteError;
  try{return await batch(false)}
  catch(localError){throw Error('Не удалось загрузить согласованный игровой каталог',{
   cause:{remote:remoteError,local:localError}
  })}
 }
}
root.PandoraWikiCatalog=Object.freeze({keys,normalize,validateRacialPassives,validateCharacterCatalog,validateCharacterExtras,validateCharacterTables,validate,load});
})(typeof window==='undefined'?globalThis:window);

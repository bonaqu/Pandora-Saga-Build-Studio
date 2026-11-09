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
 // Check cross-record ownership only after record shape and identity are
 // verified; otherwise a null or mismatched passive skill is misreported as
 // a race-registry defect instead of a broken skills record.
 validateRacialPassives(data.racialPassives,data.skills,data.meta.counts);
 // Wiki indexes dungeons by String(row.id) with Object.fromEntries().
 // Two source rows with the same ID silently overwrite one dungeon card,
 // while a missing/non-numeric ID creates an invalid deep link. Check these
 // BEFORE declaring a D1 snapshot complete, regardless of matching counts.
 const seenInstances=new Set();
 for(const instance of data.instances){
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
  requireRef(isRecord(row),'локация');
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
  for(const material of list(recipe.mats,'материалов обмена')){
   requireRef(isRecord(material)&&item(material.i),'материал обмена NPC');
  }
  for(const id of list(recipe.npc,'NPC обмена'))requireRef(npc(id),'NPC обмена');
 }
 for(const row of Object.values(data.trades.npcs)){
  requireRef(isRecord(row),'карточка NPC');
  for(const id of list(row.maps,'локаций NPC'))
   requireRef(map(id),'расположение NPC');
 }
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
   for(const row of list(group.items,'наград локации')){
    requireRef(isRecord(row),'запись добычи локации');
    if(row.i!=null)requireRef(item(row.i),'награда добычи локации');
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
root.PandoraWikiCatalog=Object.freeze({keys,normalize,validateRacialPassives,validate,load});
})(typeof window==='undefined'?globalThis:window);

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
 if(!isRecord(data.chests)||!Array.isArray(data.chests.boxes))
  throw Error('Неверный формат сундуков');
 // Keep one source-backed ownership check for both the current hero and Wiki.
 validateRacialPassives(data.racialPassives,data.skills,data.meta.counts);
 for(const key of ['items','monsters','maps','instances','drops','trades','skills','souls']){
  const observed=Array.isArray(data[key])?data[key].length:
   key==='trades'?data.trades.trades.length:Object.keys(data[key]).length;
  const expected=Number(data.meta.counts[key]);
  if(!Number.isSafeInteger(expected)||expected<1||observed<expected)
   throw Error('Неполный каталог '+key+': '+observed+' из '+expected);
 }
 const exists=(records,id)=>id!=null&&Object.hasOwn(records,String(id));
 const item=id=>exists(data.items,id)||exists(data.souls,id);
 const monster=id=>exists(data.monsters,id);
 const map=id=>exists(data.maps,id)||exists(data.trades.mapNames,id);
 const npc=id=>exists(data.trades.npcs,id);
 const requireRef=(valid,relation)=>{
  if(!valid)throw Error('Нарушены связи игрового каталога: '+relation);
 };
 for(const row of Object.values(data.maps))
  for(const id of row.mobs||[])requireRef(monster(id),'монстры локаций');
 for(const row of data.instances)
  for(const id of row.mobs||[])requireRef(monster(id),'монстры подземелий');
 for(const [id,group] of Object.entries(data.drops)){
  requireRef(monster(id),'таблица добычи монстра');
  for(const row of [...(group.d||[]),...(group.s||[])])
   if(row.i!=null)requireRef(item(row.i),'предмет добычи монстра');
 }
 for(const recipe of data.trades.trades){
  requireRef(item(recipe.i),'награда обмена NPC');
  for(const material of recipe.mats||[])
   requireRef(item(material.i),'материал обмена NPC');
  for(const id of recipe.npc||[])requireRef(npc(id),'NPC обмена');
 }
 for(const row of Object.values(data.trades.npcs))
  for(const id of row.maps||[])requireRef(map(id),'расположение NPC');
 for(const chest of data.chests.boxes){
  requireRef(item(chest.i),'сундук');
  for(const group of chest.rolls||[])for(const row of group||[])
   if(row.i!=null)requireRef(item(row.i),'награда сундука');
 }
 for(const zone of data.tables.zoneDrops){
  requireRef(map(zone.map),'место добычи');
  for(const group of zone.rows||[]){
   if(group.mob!=null)requireRef(monster(group.mob),'монстр добычи локации');
   for(const row of group.items||[])
    if(row.i!=null)requireRef(item(row.i),'награда добычи локации');
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

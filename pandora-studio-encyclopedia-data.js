(function(root){
"use strict";
// Source-based classification for used-on-demand effect items. Classify by the
// actual OS effect codes rather than names, IDs or a presumed heal amount.
function utilityCategories(item){
 if(item?.slot!=null||!Array.isArray(item?.effects))return [];
 const categories=[],effects=item.effects;
 if(effects.some(effect=>typeof effect?.func==='string'&&
  effect.func.startsWith('EP_RECOVERY_')))categories.push('cure');
 if(effects.some(effect=>/^EP_SKILL_EXEC(?:_|$)/.test(effect?.func||'')))
  categories.push('buff');
 // Currently verified negative item-use effect: poisoning the consumer.
 // EP_DESTINED_POISON a=50 is not a proven chance, damage or duration.
 if(item.kind==='POTION'&&effects.some(effect=>
  effect?.func==='EP_DESTINED_POISON'&&effect.dir==='TARGET'))
  categories.push('harmful');
 return categories;
}
function build(data){
 const sources=new Map(),drops=new Map(),npcTrades=new Map();
 const materialTrades=new Map(),npcLocations=new Map(),zoneLocations=new Map();
 const append=(map,id,row)=>{const k=String(id),list=map.get(k)||[];list.push(row);map.set(k,list)};
 const normalizeSearch=value=>String(value??'').normalize('NFKC').toLocaleLowerCase('ru')
  .replace(/ё/g,'е').replace(/\s+/g,' ').trim();
 const add=(id,entry)=>{const key=String(id);if(!sources.has(key))sources.set(key,[]);sources.get(key).push(entry)};
 for(const [mobId,group] of Object.entries(data.drops||{})){
  const list=[];
  for(const [kind,rows] of [['normal',group.d],['conditional',group.s]])for(const r of rows||[]){
   if(r.i==null)continue;
   const row={type:'monster',id:String(mobId),itemId:String(r.i),kind,percent:typeof r.p==='number'?r.p:null,condition:r.t||null,quantity:r.n??1,slotAdd:r.slotAdd??0};
   list.push(row);add(r.i,row);
  }
  drops.set(String(mobId),list);
 }
 for(const recipe of data.trades?.trades||[])for(const npcId of recipe.npc||[]){
  const id=String(npcId);
  if(!npcTrades.has(id))npcTrades.set(id,[]);
  npcTrades.get(id).push(recipe);
  add(recipe.i,{type:'npc',id,recipe});
 }
 for(const recipe of data.trades?.trades||[])
  for(const id of new Set((recipe.mats||[]).filter(x=>x.i!=null).map(x=>String(x.i))))
   append(materialTrades,id,recipe);
 // City NPCs have separate identities and optional administrator D1 overlays.
 // Never change server trade NPC keys or publish synthetic IDs to OS datasets.
 const astirNpcs={...(root.PandoraAstirLocations?.npcRecords?.()||{}),
  ...(data.townNpcs||{})};
 for(const [id,npc] of Object.entries({...data.trades?.npcs,...astirNpcs}))
  for(const mapId of new Set((npc.maps||[]).map(String)))
   append(npcLocations,mapId,[id,npc]);
 // Explicit, administrator-curated NPC references are indexed like ordinary
 // residents but never modify the NPC's original OS spawn/placement record.
 for(const [mapId,map] of Object.entries(data.maps||{})){
  // Owner-curated loot links remain independent of the game's random drop tables.
  for(const itemId of map.loot||[])
   if(Object.hasOwn(data.items||{},String(itemId)))
    add(itemId,{type:'owner-map',id:mapId,curated:true});
  for(const npcId of map.npcs||[]){
   const npc=(data.trades?.npcs||{})[String(npcId)];
   if(!npc)continue;
   const listed=npcLocations.get(String(mapId))||[];
   if(!listed.some(([id])=>String(id)===String(npcId)))
    append(npcLocations,mapId,[String(npcId),npc]);
  }
 }
 for(const zone of data.tables?.zoneDrops||[])append(zoneLocations,zone.map,zone);
 // Both player-opened boxes and map chests exchanged at a chest master
 // are authoritative reward sources; preserve each roll and chance.
 for(const chest of [...(data.chests?.boxes||[]),...(data.chests?.npc||[])])
  for(const [i,group] of (chest.rolls||[]).entries())
   for(const row of group){
    if(row.i!=null)add(row.i,{type:'chest',id:String(chest.i),roll:i+1,
     percent:typeof row.p==='number'?row.p:null,quantity:row.n??1,
     chestKind:chest.key!=null?'npc':'box'});
   }
 for(const zone of data.tables?.zoneDrops||[])for(const group of zone.rows||[])for(const row of group.items||[]){
  if(row.i!=null)add(row.i,{type:'zone',id:String(zone.map),mobId:group.mob?String(group.mob):null,groupChance:group.base??null,perMember:group.perMember??null,groupSize:group.items.length});
 }
 const ownerNpcItems=new Map(),manualMonsterSources=new Map();
 // Administrator sources extend the encyclopedia graph without altering OS drop tables.
 for(const [itemId,entries] of Object.entries(data.ownerAcquisitions||{})){
  if(!Object.hasOwn(data.items||{},itemId)||!Array.isArray(entries))continue;
  const seen=new Set();
  for(const row of entries.slice(0,24)){
   if(!row||typeof row!=='object'||!['monster','npc'].includes(row.type)||
    typeof row.id!=='string'||!/^[1-9][0-9]{0,14}$/.test(row.id))continue;
   const fingerprint=row.type+':'+row.id;
   if(seen.has(fingerprint))continue;
   seen.add(fingerprint);
   if(row.type==='monster'&&Object.hasOwn(data.monsters||{},row.id)){
    const entry={type:'monster',id:row.id,itemId,kind:'manual',manual:true,
     percent:typeof row.p==='number'?row.p:null,condition:null,quantity:1,slotAdd:0};
    append(drops,row.id,entry);add(itemId,entry);
    append(manualMonsterSources,row.id,itemId);
   }else if(row.type==='npc'&&Object.hasOwn(data.trades?.npcs||{},row.id)){
    const entry={type:'npc',id:row.id,itemId,manual:true};
    add(itemId,entry);append(ownerNpcItems,row.id,{itemId});
   }
  }
 }
 const mobLocations=new Map();
 const addLocation=(mob,entry)=>{
  const id=String(mob),rows=mobLocations.get(id)||[];
  if(!rows.some(row=>row.id===entry.id&&row.type===entry.type))rows.push(entry);
  mobLocations.set(id,rows);
 };
 for(const [id,map] of Object.entries(data.maps||{})){
  const location={type:'map',id,name:map.name};
  for(const mob of map.mobs||[])addLocation(mob,location);
 }
 for(const row of data.instances||[]){
  const location={type:'instance',id:String(row.id),name:row.name};
  for(const mob of row.mobs||[])addLocation(mob,location);
 }
 const maps=root.PandoraAstirLocations?.mapsFrom?.(data.trades?.mapNames,data.maps)||
  {...(data.trades?.mapNames||{}),...(data.maps||{})};
 for(const [id,patch] of Object.entries(data.townMaps||{}))
  maps[id]={...(maps[id]||{}),...patch};
 // The actual item level and class-family name identify leveling reward boxes.
 // Source chest rolls exist only for the earlier boxes; later ones remain
 // browsable without synthesizing contents or changing the OS snapshot.
 const rewardChests=new Map();
 const rewardFamilies={
  'воинов':'warrior','следопытов':'scout','адептов':'acolyte','магов':'mage'
 };
 for(const [id,item] of Object.entries(data.items||{})){
  if(item?.kind!=='TOY'||!Number.isSafeInteger(item.level))continue;
  const match=String(item.name||'').match(/^Шкатулка .+ для (воинов|следопытов|адептов|магов)$/i);
  if(!match)continue;
  rewardChests.set(id,{level:item.level,family:rewardFamilies[match[1].toLowerCase()]});
 }
 const chestRecords=Object.fromEntries(
  [...(data.chests?.boxes||[]),...(data.chests?.npc||[])].map(box=>[String(box.i),box]));
 // All actual item-catalog containers belong to the encyclopedia, even if
 // this OS snapshot has no opening probabilities for them. Storage upgrades
 // ("Большой сундук (7 дней)", etc.) are not loot containers.
 for(const [id,item] of Object.entries(data.items||{})){
  const label=String(item?.name||'');
  if(!/^(?:Сундук(?:\s|$)|Шкатулка(?:\s|$)|Красный сундук$|Зеленый сундук$|Синий сундук$)/i.test(label))continue;
  if(!Object.hasOwn(chestRecords,id))
   chestRecords[id]={i:Number(id),rolls:[],unlistedContents:true};
 }
 for(const id of rewardChests.keys())if(!Object.hasOwn(chestRecords,id))
  chestRecords[id]={i:Number(id),rolls:[],unlistedContents:true};
 // Only explicit source names are linked to named map entries: this is not a
 // claim about drop locations, NPC service availability or opening odds.
 const locationChestNames={
  52001:'Восточная дорога Ветров',52002:'Северная дорога Ветров',
  52003:'Западная дорога Ветров',52004:'Долина Нельштадт',
  52005:'Долина Монтори',52006:'Подножье Горды',
  52007:'Лейбгольдские теснины',52008:'Пустыня Химурарту',
  52009:'Север великой Тамбринской пустыни',
  52011:'Покинутые земли Мальдии'
 };
 const chestLocation=new Map();
 for(const [id,name] of Object.entries(locationChestNames)){
  const found=Object.entries(data.maps||{}).filter(([,map])=>
   normalizeSearch(map.name).includes(normalizeSearch(name))||
   normalizeSearch(name).includes(normalizeSearch(map.name)));
  if(found.length)chestLocation.set(id,found.map(([key])=>key));
 }
 const chapters={
  item:data.items||{},monster:data.monsters||{},map:maps,
  npc:{...(data.trades?.npcs||{}),...astirNpcs},
  chest:chestRecords,
  instance:Object.fromEntries((data.instances||[]).map(x=>[String(x.id),x])),
  skill:data.skills||{},soul:data.souls||{}
 };

 // Preserve all original records for game formulas, links and source relations.
 // Suppress only exact display copies and script-only variants of active skills.
 const entries={},terms={},aliases={},variants={},byName={};
 const zoneMonsterIds=new Set();
 for(const zone of data.tables?.zoneDrops||[])for(const group of zone.rows||[])
  if(group.mob!=null)zoneMonsterIds.add(String(group.mob));
 for(const [type,records] of Object.entries(chapters)){
  const all=Object.entries(records),hidden=new Map(),signatures=new Map();
  const nameGroups=new Map(),monsterTwins=type==='monster'?new Map():null;
  const label=([id,rec])=>type==='chest'?(data.items?.[id]?.name||rec.name):rec.name;
  for(const pair of all){
   const name=normalizeSearch(label(pair));
   if(!name)continue;
   const group=nameGroups.get(name)||[];
   group.push(pair);nameGroups.set(name,group);
   const content=Object.fromEntries(Object.entries(pair[1])
    .filter(([key])=>key!=='id'&&key!=='iconId')
    .sort(([a],[b])=>a.localeCompare(b)));
   const signature=name+'|'+JSON.stringify(content);
   if(monsterTwins){
    const twins=monsterTwins.get(signature)||[];
    twins.push(pair[0]);monsterTwins.set(signature,twins);
   }else if(signatures.has(signature))hidden.set(pair[0],signatures.get(signature));
   else signatures.set(signature,pair[0]);
  }
  if(monsterTwins){
   // A monster's numeric ID is not its encyclopedia identity. Group records
   // only when every stat and name matches, and their recorded drop tables match.
   // Different loot tables must remain separate; location links are unioned.
   const evidence=id=>(drops.get(id)?.length||0)+(mobLocations.get(id)?.length||0)+
    Number(zoneMonsterIds.has(id));
   const richest=ids=>ids.slice().sort((a,b)=>
    evidence(b)-evidence(a)||Number(a)-Number(b))[0];
   for(const ids of monsterTwins.values()){
    if(ids.length<2)continue;
    const withLoot=ids.filter(id=>(drops.get(id)?.length||0)>0);
    if(!withLoot.length){
     const primary=richest(ids);
     for(const id of ids)if(id!==primary)hidden.set(id,primary);
     continue;
    }
    const byLoot=new Map();
    for(const id of withLoot){
     // Manually added acquisitions are sources too: a distinct owner-edit
     // must not disappear when the underlying game drop table happens to match.
     const signature=JSON.stringify([data.drops?.[id]||null,
      manualMonsterSources.get(id)||[]]);
     const matches=byLoot.get(signature)||[];
     matches.push(id);byLoot.set(signature,matches);
    }
    const active=[...byLoot.values()].map(group=>{
     const primary=richest(group);
     for(const id of group)if(id!==primary)hidden.set(id,primary);
     return primary;
    });
    const primary=richest(active);
    for(const id of ids){
     if((drops.get(id)?.length||0)>0)continue;
     // A separate map-only or zone-only creature with no loot is ambiguous
     // when other exact-stat variants DO have loot: preserve that identity.
     if(evidence(id)>0)continue;
     hidden.set(id,primary);
    }
   }
  }
  if(type==='skill')for(const group of nameGroups.values()){
   const branches=new Map();
   for(const pair of group){
    const key=String(pair[1].branch||'');
    const rows=branches.get(key)||[];
    rows.push(pair);branches.set(key,rows);
   }
   for(const rows of branches.values()){
    const primary=rows.find(([,skill])=>skill.learnable===true)?.[0];
    // Without an authoritative playable variant, do not guess which version
    // is current. Keep ambiguous non-learnable records separately.
    if(primary)for(const [id,skill] of rows)
     if(skill.learnable===false&&id!==primary)hidden.set(id,primary);
   }
  }
  const canonical=id=>{
   let key=String(id),hop=0;
   while(hidden.has(key)&&hop++<all.length)key=hidden.get(key);
   return key;
  };
  aliases[type]=new Map(all.map(([id])=>[id,canonical(id)]));
  const groups=new Map();
  for(const [id]of all){
   const key=canonical(id),group=groups.get(key)||[];
   group.push(id);groups.set(key,group);
  }
  variants[type]=groups;
  entries[type]=all.filter(([id])=>canonical(id)===id);
  const names=new Map();
  for(const [id,rec] of entries[type]){
   const labelKey=normalizeSearch(label([id,rec]));
   const row=names.get(labelKey)||[];
   row.push([id,rec]);names.set(labelKey,row);
  }
  byName[type]=names;
  terms[type]=new Map(all.map(([id,rec])=>[
   id,normalizeSearch([label([id,rec]),type==='soul'?data.items?.[id]?.name:null]
    .filter(Boolean).join(' '))
  ]));
 }
 const canonical=(type,id)=>aliases[type]?.get(String(id))||String(id);
 const related=(type,id)=>variants[type]?.get(canonical(type,id))||[String(id)];
 const sameName=(type,id)=>{
  const records=chapters[type]||{},entry=records[String(id)];
  const name=normalizeSearch(type==='chest'?data.items?.[id]?.name:entry?.name);
  if(!name)return [];
  return (byName[type]?.get(name)||[]).filter(([key])=>
   key!==canonical(type,id));
 };
 const uniqueRows=(rows,key)=>[...new Map(rows.map(row=>[key(row),row])).values()];
 const allLocations=id=>uniqueRows(related('monster',id).flatMap(key=>mobLocations.get(key)||[]),
  row=>row.type+':'+row.id);
 const allDrops=id=>uniqueRows(related('monster',id).flatMap(key=>drops.get(key)||[]),
  row=>[row.itemId,row.kind,row.percent,row.condition,row.quantity].join(':'));
 const search=(type,query,displayName)=>{
  const all=entries[type]||[],q=normalizeSearch(query).split(' ').filter(Boolean);
  if(!q.length)return all;
  return all.filter(([id,rec])=>{
   const indexed=terms[type]?.get(id)||'';
   const translated=typeof displayName==='function'?normalizeSearch(displayName(id,rec)):'';
   return q.every(word=>indexed.includes(word)||translated.includes(word));
  });
 };
 return Object.freeze({
  sources:id=>uniqueRows(related('item',id).flatMap(key=>sources.get(key)||[]),
   row=>JSON.stringify(row)),
   drops:allDrops,
  trades:id=>(npcTrades.get(String(id))||[]).slice(),
   ownerNpcItems:id=>(ownerNpcItems.get(String(id))||[]).slice(),
   locations:allLocations,canonical,related,sameName,
  materialUses:id=>uniqueRows(related('item',id).flatMap(key=>materialTrades.get(key)||[]),
   row=>JSON.stringify(row)),
  residents:id=>(npcLocations.get(String(id))||[]).slice(),
  zones:id=>(zoneLocations.get(String(id))||[]).slice(),
  records:type=>chapters[type]||{},rewardChest:id=>rewardChests.get(String(id))||null,
  chestPlaces:id=>(chestLocation.get(String(id))||[]).slice(),
  search,normalize:normalizeSearch,sourceCount:sources.size
 });
}
root.PandoraWikiData=Object.freeze({build,utilityCategories});
})(typeof window==='undefined'?globalThis:window);

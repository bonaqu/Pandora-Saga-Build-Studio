(function(root){
"use strict";
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
   const row={type:'monster',id:String(mobId),itemId:String(r.i),kind,percent:typeof r.p==='number'?r.p:null,condition:r.t||null,quantity:r.n??1};
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
 for(const [id,npc] of Object.entries(data.trades?.npcs||{}))
  for(const mapId of new Set((npc.maps||[]).map(String)))
   append(npcLocations,mapId,[id,npc]);
 for(const zone of data.tables?.zoneDrops||[])append(zoneLocations,zone.map,zone);
 for(const chest of data.chests?.boxes||[])for(const [i,group] of (chest.rolls||[]).entries())for(const row of group){
  if(row.i!=null)add(row.i,{type:'chest',id:String(chest.i),roll:i+1,percent:typeof row.p==='number'?row.p:null,quantity:row.n??1});
 }
 for(const zone of data.tables?.zoneDrops||[])for(const group of zone.rows||[])for(const row of group.items||[]){
  if(row.i!=null)add(row.i,{type:'zone',id:String(zone.map),mobId:group.mob?String(group.mob):null,groupChance:group.base??null,perMember:group.perMember??null,groupSize:group.items.length});
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
 const maps={...(data.trades?.mapNames||{}),...(data.maps||{})};
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
 const chestRecords=Object.fromEntries((data.chests?.boxes||[]).map(box=>[String(box.i),box]));
 for(const id of rewardChests.keys())if(!Object.hasOwn(chestRecords,id))
  chestRecords[id]={i:Number(id),rolls:[],unlistedContents:true};
 const chapters={
  item:data.items||{},monster:data.monsters||{},map:maps,npc:data.trades?.npcs||{},
  chest:chestRecords,
  instance:Object.fromEntries((data.instances||[]).map(x=>[String(x.id),x])),
  skill:data.skills||{},soul:data.souls||{}
 };

 // Preserve all original records for game formulas, links and source relations.
 // Suppress only exact display copies and script-only variants of active skills.
 const entries={},terms={},aliases={},variants={};
 for(const [type,records] of Object.entries(chapters)){
  const all=Object.entries(records),hidden=new Map(),signatures=new Map();
  const nameGroups=new Map();
  const label=([id,rec])=>type==='chest'?(data.items?.[id]?.name||rec.name):rec.name;
  for(const pair of all){
   const name=normalizeSearch(label(pair));
   if(!name)continue;
   const group=nameGroups.get(name)||[];
   group.push(pair);nameGroups.set(name,group);
   const content=Object.fromEntries(Object.entries(pair[1])
    .filter(([key])=>key!=='id'&&key!=='iconId')
    .sort(([a],[b])=>a.localeCompare(b)));
   // Monsters with the same stats but different loot tables may be distinct
   // in-world variants. Do not merge those sources automatically.
   const loot=type==='monster'?data.drops?.[pair[0]]||null:null;
   const signature=name+'|'+JSON.stringify(content)+'|'+JSON.stringify(loot);
   if(signatures.has(signature))hidden.set(pair[0],signatures.get(signature));
   else signatures.set(signature,pair[0]);
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
  return (entries[type]||[]).filter(([key,rec])=>
   key!==canonical(type,id)&&normalizeSearch(
    type==='chest'?data.items?.[key]?.name:rec.name)===name);
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
  sources:id=>(sources.get(String(id))||[]).slice(),
  drops:allDrops,
  trades:id=>(npcTrades.get(String(id))||[]).slice(),locations:allLocations,canonical,related,sameName,
  materialUses:id=>(materialTrades.get(String(id))||[]).slice(),
  residents:id=>(npcLocations.get(String(id))||[]).slice(),
  zones:id=>(zoneLocations.get(String(id))||[]).slice(),
  records:type=>chapters[type]||{},rewardChest:id=>rewardChests.get(String(id))||null,
  search,normalize:normalizeSearch,sourceCount:sources.size
 });
}
root.PandoraWikiData=Object.freeze({build});
})(typeof window==='undefined'?globalThis:window);

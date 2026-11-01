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
 function locations(mobId){
  return (mobLocations.get(String(mobId))||[]).slice();
 }
 const maps={...(data.trades?.mapNames||{}),...(data.maps||{})};
 const chapters={
  item:data.items||{},monster:data.monsters||{},map:maps,npc:data.trades?.npcs||{},
  chest:Object.fromEntries((data.chests?.boxes||[]).map(x=>[String(x.i),x])),
  instance:Object.fromEntries((data.instances||[]).map(x=>[String(x.id),x])),
  skill:data.skills||{},soul:data.souls||{}
 };
 const entries={},terms={};
 for(const [type,records] of Object.entries(chapters)){
  entries[type]=Object.entries(records);
  const index=new Map();
  for(const [id,rec] of entries[type]){
   const relatedItem=type==='chest'||type==='soul'?data.items?.[id]:null;
   const locations=type==='monster'?(mobLocations.get(id)||[]).map(x=>x.name):
    type==='npc'?(rec.maps||[]).map(x=>maps[x]?.name):[];
   index.set(id,normalizeSearch([id,rec.name,rec.desc,rec.blurb,rec.kind,
    rec.level,rec.charLevel,rec.branch,rec.branchRaw,rec.skillType,rec.slot,
    ...(rec.slots||[]),...Object.keys(rec.classes||{}),relatedItem?.name,
    ...locations].filter(x=>x!=null).join(' ')));
  }
  terms[type]=index;
 }
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
  drops:id=>(drops.get(String(id))||[]).slice(),
  trades:id=>(npcTrades.get(String(id))||[]).slice(),locations,
  materialUses:id=>(materialTrades.get(String(id))||[]).slice(),
  residents:id=>(npcLocations.get(String(id))||[]).slice(),
  zones:id=>(zoneLocations.get(String(id))||[]).slice(),
  records:type=>chapters[type]||{},search,sourceCount:sources.size
 });
}
root.PandoraWikiData=Object.freeze({build});
})(typeof window==='undefined'?globalThis:window);

(function(root){
"use strict";
function build(data){
 const sources=new Map(),drops=new Map(),npcTrades=new Map();
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
 for(const chest of data.chests?.boxes||[])for(const [i,group] of (chest.rolls||[]).entries())for(const row of group){
  if(row.i!=null)add(row.i,{type:'chest',id:String(chest.i),roll:i+1,percent:typeof row.p==='number'?row.p:null,quantity:row.n??1});
 }
 for(const zone of data.tables?.zoneDrops||[])for(const group of zone.rows||[])for(const row of group.items||[]){
  if(row.i!=null)add(row.i,{type:'zone',id:String(zone.map),mobId:group.mob?String(group.mob):null,groupChance:group.base??null,perMember:group.perMember??null,groupSize:group.items.length});
 }
 function locations(mobId){
  const found=[];
  for(const [id,map] of Object.entries(data.maps||{}))if(map.mobs?.some(i=>String(i)===String(mobId)))found.push({type:'map',id,name:map.name});
  for(const row of data.instances||[])if(row.mobs?.some(i=>String(i)===String(mobId)))found.push({type:'instance',id:String(row.id),name:row.name});
  return found;
 }
 return Object.freeze({sources:id=>sources.get(String(id))||[],drops:id=>drops.get(String(id))||[],
  trades:id=>npcTrades.get(String(id))||[],locations,sourceCount:sources.size});
}
root.PandoraWikiData=Object.freeze({build});
})(typeof window==='undefined'?globalThis:window);

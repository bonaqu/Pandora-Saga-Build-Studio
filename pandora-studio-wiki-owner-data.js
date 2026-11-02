(function(root){
'use strict';
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x||{},k);
const number=x=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=1000000000;
const id=x=>Number.isSafeInteger(Number(x))&&Number(x)>0&&/^[1-9][0-9]{0,14}$/.test(String(x));
const record=x=>x&&typeof x==='object'&&!Array.isArray(x);
const fields=Object.freeze({
 monster:['name','desc','level','life','ac','magicProtection','warding','str','vit','agi','dex','spi','int','resists'],
 map:['name','nameEn','desc','descEn','mobs'],
 npc:['name','nameEn','desc','descEn','maps','service','serviceEn','grid'],
 instance:['name','blurb','blurbRu','mobs'],
 skill:['name','desc','charLevel','mana','cast','cooldown','range','reqs','prereq','classes'],
 soul:['name','desc','price','slots']
});
const resistKeys=['physical','fire','cold','lightning','poison','charm','magic','holy','dark'];
const slots=['weapon','shield','head','body','gloves','legs','feet','cloak','ring','neck','belt','ear','accessory'];
const checkList=(x,max=1000)=>Array.isArray(x)&&x.length<=max&&new Set(x.map(String)).size===x.length&&x.every(id);
function validPatch(type,patch){
 if(!own(fields,type)||!record(patch))return false;
 const keys=Object.keys(patch);
 if(!keys.length||keys.some(k=>!fields[type].includes(k)))return false;
 return keys.every(k=>{
  const v=patch[k];
  if(['name','nameEn','desc','descEn','blurb','blurbRu','service','serviceEn','grid'].includes(k))
   return typeof v==='string'&&v.length<=2000&&(!['name','nameEn'].includes(k)||Boolean(v.trim()));
  if(k==='resists')return record(v)&&!Object.keys(v).some(key=>
   !resistKeys.includes(key)||!number(v[key])||Math.abs(v[key])>100);
  if(k==='reqs')return Array.isArray(v)&&v.length<=20&&
    new Set(v.map(x=>x?.branch)).size===v.length&&v.every(x=>
     record(x)&&Object.keys(x).length===2&&
     /^[a-z][a-z0-9_-]{0,31}$/.test(x.branch)&&
     Number.isInteger(x.amount)&&x.amount>=0&&x.amount<=1000);
   if(k==='prereq')return v===null||id(v);
   if(k==='classes')return record(v)&&Object.keys(v).length<=28&&
    Object.entries(v).every(([key,n])=>/^[A-Z_]{2,25}$/.test(key)&&n===1);
   if(k==='mobs'||k==='maps')return checkList(v,1000);
  if(k==='slots')return Array.isArray(v)&&v.length<=12&&new Set(v).size===v.length&&v.every(x=>slots.includes(x));
  return number(v)&&v>=0;
 });
}
function validDrops(rows){
 if(!record(rows)||Object.keys(rows).some(k=>!['d','s'].includes(k))||
  !own(rows,'d')||!own(rows,'s'))return false;
 return ['d','s'].every(k=>Array.isArray(rows[k])&&rows[k].length<=200&&rows[k].every(r=>
  record(r)&&id(r.i)&&Object.keys(r).every(p=>['i','p','n','slotAdd','t','lo','hi','souls'].includes(p))&&
  (r.p==null||number(r.p)&&r.p>=0&&r.p<=100)&&
  (r.n==null||Number.isInteger(r.n)&&r.n>=1&&r.n<=999999)&&
  (r.slotAdd==null||Number.isInteger(r.slotAdd)&&r.slotAdd>=0&&r.slotAdd<=3)&&
  (r.t==null||typeof r.t==='string'&&r.t.length<=240)&&
  (r.lo==null||Number.isInteger(r.lo)&&r.lo>=0&&r.lo<=1000)&&
  (r.hi==null||Number.isInteger(r.hi)&&r.hi>=0&&r.hi<=1000)&&
  (r.souls==null||Array.isArray(r.souls)&&r.souls.length<=20&&
   r.souls.every(pair=>Array.isArray(pair)&&pair.length===2&&
    Number.isSafeInteger(pair[0])&&pair[0]>0&&
    Number.isFinite(pair[1])&&pair[1]>=0&&pair[1]<=100))));
}
function validChest(rolls){
 return Array.isArray(rolls)&&rolls.length<=50&&rolls.every(group=>
  Array.isArray(group)&&group.length<=100&&group.every(row=>
   record(row)&&id(row.i)&&Object.keys(row).every(k=>['i','n','p','plus','soul'].includes(k))&&
   (row.p==null||number(row.p)&&row.p>=0&&row.p<=100)&&
   (row.n==null||Number.isInteger(row.n)&&row.n>=1&&row.n<=999999)&&
   (row.plus==null||Number.isInteger(row.plus)&&row.plus>=0&&row.plus<=20)&&
   (row.soul==null||Number.isInteger(row.soul)&&row.soul>=0&&row.soul<=3)));
}
function validSpawns(rows){
 if(!Array.isArray(rows)||rows.length>120)return false;
 const set=new Set();
 return rows.every(row=>{
  if(!record(row)||Object.keys(row).length!==2||!own(row,'type')||!own(row,'id')||
   !['map','instance'].includes(row.type)||!id(row.id))return false;
  const key=row.type+':'+row.id;
  if(set.has(key))return false;set.add(key);return true;
 });
}
// User-curated city-only NPCs and maps use stable non-server IDs.
// These patches live in the existing D1 overrides table, not in source game data.
const virtualMapId=x=>x==='1001004'||/^astir-(?:union|empire|kingdom)$/.test(String(x));
const virtualNpcId=x=>/^astir-npc-(?:union|empire|kingdom)-[a-z0-9-]{1,32}$/.test(String(x));
const homeFromId=x=>'astir-'+String(x).split('-')[2];
function validTownPatch(type,key,patch){
 if(!(type==='map'?virtualMapId(key):type==='npc'&&virtualNpcId(key))||
  !record(patch))return false;
 const keys=Object.keys(patch);
 const allowed=type==='map'?['name','nameEn','desc','descEn']:
  ['name','nameEn','desc','descEn','service','serviceEn','grid','maps'];
 if(!keys.length||keys.some(k=>!allowed.includes(k)))return false;
 return keys.every(k=>k==='maps'?
  Array.isArray(patch.maps)&&patch.maps.length===1&&virtualMapId(patch.maps[0]):
  typeof patch[k]==='string'&&patch[k].length<=(k.startsWith('desc')?2000:240)&&
   (!['name','nameEn'].includes(k)||Boolean(patch[k].trim())));
}
function parse(value){try{return JSON.parse(value)}catch{return null}}
function apply(data,overrides){
 let next=data;const clone=()=>{if(next===data)next={...data}};
 const mut=(type)=>{clone();if(next[type]===data[type])next[type]={...data[type]};return next[type]};
 for(const [key,value] of Object.entries(overrides||{})){
  if(typeof value!=='string')continue;
  let m=/^wikiedit\.(map\.astir-(?:union|empire|kingdom)|npc\.astir-npc-(?:union|empire|kingdom)-[a-z0-9-]{1,32})$/.exec(key);
  if(m){
   const dot=m[1].indexOf('.'),type=m[1].slice(0,dot),idValue=m[1].slice(dot+1),patch=parse(value);
   if(!validTownPatch(type,idValue,patch))continue;
   clone();
   if(type==='map'){
    if(!next.townMaps)next.townMaps={};
    next.townMaps[idValue]={...(next.townMaps[idValue]||{}),...patch,virtual:true};
   }else{
    if(!next.townNpcs)next.townNpcs={};
    const original=root.PandoraAstirLocations?.npcRecords?.()[idValue];
    const existing=next.townNpcs[idValue]||original;
    if(!existing&&!patch.name)continue;
    next.townNpcs[idValue]={...(existing||{id:idValue,name:patch.name,maps:[homeFromId(idValue)],
     source:'owner',virtual:true}),...patch,virtual:true};
   }
   continue;
  }
  m=/^wikiedit\.(monster|map|npc|instance|skill|soul)\.([0-9]{1,15})$/.exec(key);
  if(m){
   const [,type,idValue]=m,patch=parse(value);
   if(!validPatch(type,patch))continue;
   if(type==='instance'){
    const index=(next.instances||[]).findIndex(x=>String(x.id)===idValue);
    if(index<0)continue;
    clone();if(next.instances===data.instances)next.instances=[...data.instances];
    next.instances[index]={...next.instances[index],...patch};continue;
   }
   const collection=type==='npc'?'trades':type==='soul'?'souls':
    type==='skill'?'skills':type==='map'?'maps':'monsters';
   if(type==='npc'){
    if(!own(next.trades?.npcs,idValue))continue;
    clone();if(next.trades===data.trades)next.trades={...data.trades,npcs:{...data.trades.npcs}};
    next.trades.npcs[idValue]={...next.trades.npcs[idValue],...patch};
    continue;
   }
   if(type==='map'&&!own(next.maps,idValue)&&own(next.trades?.mapNames,idValue)){
    clone();
    if(next.trades===data.trades)next.trades={...data.trades,mapNames:{...data.trades.mapNames}};
    next.trades.mapNames[idValue]={...next.trades.mapNames[idValue],...patch};continue;
   }
   if(!own(next[collection],idValue))continue;
   const rows=mut(collection);
   rows[idValue]={...rows[idValue],...patch};continue;
  }
  m=/^dropedit\.([0-9]{1,15})$/.exec(key);
  if(m){
   const patch=parse(value);
   if(!own(data.monsters,m[1])||!validDrops(patch)||!['d','s'].every(k=>
    patch[k].every(x=>own(data.items,x.i))))continue;
   const rows=mut('drops');rows[m[1]]={...rows[m[1]],d:patch.d.map(x=>({...x})),s:patch.s.map(x=>({...x}))};
   continue;
  }
  m=/^chestedit\.([0-9]{1,15})$/.exec(key);
  if(m){
   const rolls=parse(value);
   if(!own(data.items,m[1])||!validChest(rolls)||!rolls.every(g=>g.every(row=>own(data.items,row.i))))continue;
   clone();
   if(next.chests===data.chests)next.chests={...data.chests};
   const isNpc=(data.chests?.npc||[]).some(x=>String(x.i)===m[1]);
   const bucket=isNpc?'npc':'boxes';
   if(next.chests[bucket]===data.chests[bucket])
    next.chests[bucket]=[...(data.chests?.[bucket]||[])];
   const index=next.chests[bucket].findIndex(x=>String(x.i)===m[1]);
   const chest={...(index>=0?next.chests[bucket][index]:{i:Number(m[1])}),
    rolls:rolls.map(g=>g.map(x=>({...x})))};
   if(index>=0)next.chests[bucket][index]=chest;
   else next.chests[bucket].push(chest);
  }
 }
 // Spawn assignments are keyed by monster, so editing from a map or monster page
 // updates one authoritative relation and all reverse indexes together.
 for(const [key,text] of Object.entries(overrides||{})){
  const match=/^spawnedit\.([0-9]{1,15})$/.exec(key);
  if(!match||!own(data.monsters,match[1]))continue;
  const rows=parse(text);
  if(!validSpawns(rows)||!rows.every(x=>x.type==='map'?
   own(data.maps,x.id):(data.instances||[]).some(i=>String(i.id)===String(x.id))))continue;
  const mob=Number(match[1]),wanted=new Set(rows.map(x=>x.type+':'+x.id));
  for(const [mapId,source] of Object.entries(data.maps||{})){
   const original=(next.maps?.[mapId]?.mobs||source.mobs||[]).map(Number);
   const was=original.includes(mob),want=wanted.has('map:'+mapId);
   if(was===want)continue;
   const maps=mut('maps');
   maps[mapId]={...maps[mapId],mobs:want?[...original,mob]:original.filter(n=>n!==mob)};
  }
  for(const original of data.instances||[]){
   const entry=(next.instances||[]).find(x=>String(x.id)===String(original.id))||original;
   const listed=(entry.mobs||[]).map(Number),was=listed.includes(mob),
    want=wanted.has('instance:'+original.id);
   if(was===want)continue;
   clone();if(next.instances===data.instances)next.instances=[...data.instances];
   const index=next.instances.findIndex(x=>String(x.id)===String(original.id));
   if(index>=0)next.instances[index]={...entry,mobs:want?[...listed,mob]:listed.filter(n=>n!==mob)};
  }
 }
 return next;
}
root.PandoraWikiOwnerData=Object.freeze({apply,validPatch,validTownPatch,virtualMapId,virtualNpcId,validDrops,validChest,validSpawns,fields,resistKeys});
})(typeof window==='undefined'?globalThis:window);

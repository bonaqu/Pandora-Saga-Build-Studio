(function(root){
'use strict';
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x||{},k);
const number=x=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=1000000000;
const id=x=>Number.isSafeInteger(Number(x))&&Number(x)>0&&/^[1-9][0-9]{0,14}$/.test(String(x));
const record=x=>x&&typeof x==='object'&&!Array.isArray(x);
const fields=Object.freeze({
 monster:['name','desc','level','life','ac','magicProtection','warding','str','vit','agi','dex','spi','int','resists'],
 map:['name','desc','mobs'],
 npc:['name','desc','maps'],
 instance:['name','blurb','blurbRu','mobs'],
 skill:['name','desc','charLevel','mana','cast','cooldown','range'],
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
  if(['name','desc','blurb','blurbRu'].includes(k))
   return typeof v==='string'&&v.length<=2000&&(k!=='name'||Boolean(v.trim()));
  if(k==='resists')return record(v)&&!Object.keys(v).some(key=>
   !resistKeys.includes(key)||!number(v[key])||Math.abs(v[key])>100);
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
function parse(value){try{return JSON.parse(value)}catch{return null}}
function apply(data,overrides){
 let next=data;const clone=()=>{if(next===data)next={...data}};
 const mut=(type)=>{clone();if(next[type]===data[type])next[type]={...data[type]};return next[type]};
 for(const [key,value] of Object.entries(overrides||{})){
  if(typeof value!=='string')continue;
  let m=/^wikiedit\.(monster|map|npc|instance|skill|soul)\.([0-9]{1,15})$/.exec(key);
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
   clone();if(next.chests===data.chests)next.chests={...data.chests,boxes:[...data.chests.boxes]};
   const index=next.chests.boxes.findIndex(x=>String(x.i)===m[1]);
   const chest={...(index>=0?next.chests.boxes[index]:{i:Number(m[1])}),
    rolls:rolls.map(g=>g.map(x=>({...x})))};
   if(index>=0)next.chests.boxes[index]=chest;
   else next.chests.boxes.push(chest);
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
root.PandoraWikiOwnerData=Object.freeze({apply,validPatch,validDrops,validChest,validSpawns,fields,resistKeys});
})(typeof window==='undefined'?globalThis:window);

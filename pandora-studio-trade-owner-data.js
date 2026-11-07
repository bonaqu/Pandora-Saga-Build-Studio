(function(root){
'use strict';
// Owner NPC trade patches overlay the published catalog, which stays immutable.
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
const id=value=>Number.isSafeInteger(value)&&value>0;
const amount=(value,max=999999999)=>Number.isSafeInteger(value)&&value>=0&&value<=max;
function recipeValid(rec,items,npcs){
 if(!rec||typeof rec!=='object'||Array.isArray(rec)||!id(rec.id)||!id(rec.i)||
  !own(items||{},String(rec.i))||
  Object.keys(rec).some(k=>!['id','i','npc','mats','gold','honor','exp'].includes(k)))return false;
 if(!Array.isArray(rec.npc)||!rec.npc.length||rec.npc.length>24||
  new Set(rec.npc).size!==rec.npc.length||
  rec.npc.some(n=>!id(n)||!own(npcs||{},String(n))))return false;
 if(!Array.isArray(rec.mats)||rec.mats.length>20||
  new Set(rec.mats.map(row=>row?.i)).size!==rec.mats.length||
  rec.mats.some(row=>!row||typeof row!=='object'||Array.isArray(row)||
   Object.keys(row).some(k=>!['i','n'].includes(k))||
   !id(row.i)||!own(items||{},String(row.i))||!amount(row.n,999999)||row.n===0))return false;
 return ['gold','honor','exp'].every(k=>amount(rec[k]));
}
function apply(trades,items,overrides){
 if(!trades||!Array.isArray(trades.trades)||!trades.npcs||!items)return trades;
 const rows=new Map(trades.trades.map(rec=>[String(rec.id),rec]));
 let changed=false;
 for(const [key,text] of Object.entries(overrides||{})){
  const match=/^tradeedit\.([0-9]{1,15})$/.exec(key);
  if(!match||typeof text!=='string')continue;
  let patch;try{patch=JSON.parse(text)}catch{continue}
  if(patch&&patch.deleted===true&&Object.keys(patch).length===1){
   if(rows.delete(match[1]))changed=true;
  }else if(patch&&Object.keys(patch).length===1&&
   recipeValid(patch.recipe,items,trades.npcs)&&String(patch.recipe.id)===match[1]){
   rows.set(match[1],{...patch.recipe,npc:[...patch.recipe.npc],
    mats:patch.recipe.mats.map(row=>({...row}))});changed=true;
  }
 }
 return changed?{...trades,trades:[...rows.values()]}:trades;
}
root.PandoraStudioTradeOwnerData=Object.freeze({recipeValid,apply});
})(typeof window==='undefined'?globalThis:window);

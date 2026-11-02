(function equipPlanHelpers(root){
"use strict";
function asSocketArray(value){
 if(Array.isArray(value))return value.map(x=>x&&typeof x==="object"&&typeof x.id!=="undefined"?x:null);
 if(value&&typeof value==="object"&&typeof value.id!=="undefined")return [value];
 return [];
}
function socketCapacity(record){
 if(!record||record.soulslot===null||record.soulslot===undefined)return null;
 const n=Number(record.soulslot);
 return Number.isInteger(n)&&n>=0&&n<=32?(record.slot&&!supportsSoulSlot(record.slot)?0:n):null;
}
function validSoul(soul,slot){
 return supportsSoulSlot(slot)&&Boolean(soul&&Array.isArray(soul.slots)&&soul.slots.includes(slot));
}
function socketReport(souls,capacity){
 const all=asSocketArray(souls),count=all.filter(Boolean).length;
 const excess=capacity===null?count:all.slice(capacity).filter(Boolean).length;
 return {all,count,excess,capacity,unknown:capacity===null};
}
function refinementKey(slot,item){return item&&typeof item.id!=="undefined"?String(slot)+":"+String(item.id):null}
function refinementValue(refinements,slot,item){
 const key=refinementKey(slot,item),v=key==null?0:refinements?.[key];
 return Number.isInteger(v)&&v>=0&&v<=10?v:0;
}
const FORGE_SLOTS=Object.freeze(new Set(['weapon','shield','head','body','gloves','legs','feet']));
const SOUL_SLOTS=Object.freeze(new Set(['weapon','shield','head','body','gloves','legs','feet','belt']));
function supportsSoulSlot(slot){return SOUL_SLOTS.has(slot)}
function canSocket(slot,record){return supportsSoulSlot(slot)&&socketCapacity(record)>0}
function canRefine(slot){return FORGE_SLOTS.has(slot)}
// A two-handed weapon occupies the shield/offhand. Never erase a saved shield:
// simply defer its effects while a usable two-handed weapon is equipped.
function matchesEquipmentSlot(index,item,slotKeys){
 return Number.isInteger(index)&&index>=0&&Array.isArray(slotKeys)&&
  index<slotKeys.length&&Boolean(item&&typeof item==='object'&&
  item.slot===slotKeys[index]);
}
function occupiesOffhand(weapon,weaponEligible=true){
 return weaponEligible===true&&weapon?.slot==='weapon'&&weapon.twoHanded===true;
}
root.PandoraEquipmentPlan=Object.freeze({asSocketArray,socketCapacity,validSoul,socketReport,refinementKey,refinementValue,canRefine,supportsSoulSlot,canSocket,occupiesOffhand,matchesEquipmentSlot});
})(typeof window==='undefined'?globalThis:window);

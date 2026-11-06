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
// Socket contents belong to the currently equipped physical item, never the
// equipment position itself. A replacement (or removal) invalidates that item's Souls.
// Preserve Souls when the selected catalog item ID has not actually changed.
function clearChangedEquipmentSouls(state,beforeEquipment){
 if(!state||typeof state!=='object')return [];
 const previous=beforeEquipment&&typeof beforeEquipment==='object'?beforeEquipment:{};
 const current=state.equipment&&typeof state.equipment==='object'?state.equipment:{};
 const changed=[];
 for(const slot of new Set([...Object.keys(previous),...Object.keys(current)])){
  const oldId=previous[slot]?.id,nextId=current[slot]?.id;
  if((oldId===null||oldId===undefined?'':String(oldId))===
     (nextId===null||nextId===undefined?'':String(nextId)))continue;
  changed.push(slot);
  if(state.souls&&typeof state.souls==='object')delete state.souls[slot];
  if(state.soulOwners&&typeof state.soulOwners==='object')delete state.soulOwners[slot];
 }
 return changed;
}
// Explicit item identity for Soul slots. Historic builds predate soulOwners; only
// migrate Souls when the current catalog verifies both capacity and compatibility.
function reconcileSoulOwnership(state,equipmentCatalog,soulCatalog){
 if(!state||!equipmentCatalog||!soulCatalog)return false;
 state.souls??={};state.soulOwners??={};
 let changed=false;
 for(const slot of Object.keys(state.souls)){
  const existing=asSocketArray(state.souls[slot]).filter(Boolean);
  if(!existing.length){delete state.souls[slot];delete state.soulOwners[slot];changed=true;continue}
  const equipment=state.equipment?.[slot],id=equipment?.id;
  const item=id==null?null:equipmentCatalog[String(id)];
  if(!item){
   // An unequipped position cannot carry any Souls. Unknown catalog entries
   // are preserved until the source catalog is available again.
   if(id==null){delete state.souls[slot];delete state.soulOwners[slot];changed=true}
   continue;
  }
  const cap=socketCapacity(item);
  const owner=state.soulOwners[slot];
  const compatible=cap!=null&&cap>0&&existing.length<=cap&&
   existing.every(entry=>{
    const soul=soulCatalog[String(entry.id)];
    return !soul||validSoul(soul,item.slot);
   });
  if(!compatible||(owner!=null&&String(owner)!==String(id))){
   delete state.souls[slot];delete state.soulOwners[slot];changed=true;continue;
  }
  if(owner==null){state.soulOwners[slot]=String(id);changed=true}
 }
 for(const slot of Object.keys(state.soulOwners)){
  if(!state.souls[slot]){delete state.soulOwners[slot];changed=true}
 }
 return changed;
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
root.PandoraEquipmentPlan=Object.freeze({asSocketArray,socketCapacity,validSoul,socketReport,clearChangedEquipmentSouls,reconcileSoulOwnership,refinementKey,refinementValue,canRefine,supportsSoulSlot,canSocket,occupiesOffhand,matchesEquipmentSlot});
})(typeof window==='undefined'?globalThis:window);

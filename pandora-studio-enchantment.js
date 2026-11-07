(function(root){
'use strict';
const types=Object.freeze([{id:'physical',ru:'Физический',en:'Nor'},{id:'magical',ru:'Магический',en:'Mag'}]);
const elements=Object.freeze([
{id:'fire',ru:'Огонь',en:'Fire'},{id:'ice',ru:'Лёд',en:'Ice'},
{id:'lightning',ru:'Молния',en:'Thunder'},{id:'poison',ru:'Яд',en:'Poison'},
{id:'light',ru:'Свет',en:'Light'},{id:'dark',ru:'Тьма',en:'Dark'},
{id:'rainbow',ru:'Радуга',en:'Rainbow'}]);
function normalize(v){if(!v||typeof v!=='object')return null;
return types.some(x=>x.id===v.type)&&elements.some(x=>x.id===v.element)?{type:v.type,element:v.element}:null}
const armourSlots=Object.freeze(new Set(['shield','head','body','gloves','legs','feet']));
function normalizeForSlot(slot,value){
 const gem=normalize(value);
 if(!gem)return null;
 return slot==='weapon'?gem:armourSlots.has(slot)?{...gem,type:'physical'}:null;
}
// Keep canonical localized item names; the chosen element lives in the tooltip field.
function equipmentName(name,slot,grade,selection,locale='ru'){
 const base=String(name||'').trim(),rank=Number(grade);
 return base&&Number.isInteger(rank)&&rank>0&&rank<=10?base+' +'+rank:base;
}
function label(v){const choice=normalize(v);if(!choice)return 'не выбраны';
return types.find(x=>x.id===choice.type).ru+' · '+elements.find(x=>x.id===choice.element).ru}
function weaponPreview(baseValue,level,table){
 const value=Number(baseValue),step=table?.[String(level)];
 if(!Number.isFinite(value)||value<0||!Number.isInteger(level)||level<1||level>10||
 !Number.isFinite(step?.ratio)||!Number.isFinite(step?.flat))return null;
 const increment=Math.floor(value*step.ratio/100)+step.flat;
 return {base:value,increment,total:value+increment,source:'OS weaponPlus + legacy rounding assumption',verified:false};
}
// Current OS news #4 publishes the *ratio* for magical weapon enhancement.
// The server also carries a separate "flat" value; its meaning is not
// established by the news and must not be silently added to MATK.
function magicPreview(level,table){
 const step=table?.[String(level)];
 if(!Number.isInteger(level)||level<1||level>10||
  !Number.isFinite(step?.ratio)||step.ratio<0)return null;
 return {grade:level,rate:step.ratio,verified:false};
}
root.PandoraEnchantModel=Object.freeze({types,elements,normalize,normalizeForSlot,equipmentName,label,weaponPreview,magicPreview});
})(typeof window==='undefined'?globalThis:window);

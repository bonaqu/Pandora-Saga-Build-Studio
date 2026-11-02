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
const inflections=Object.freeze({
 fire:['Огн.','огня','Fire','of fire'],
 ice:['Лед.','льда','Ice','of ice'],
 lightning:['Молн.','молний','Lightning','of lightning'],
 poison:['Ядов.','яда','Poison','of poison'],
 light:['Свят.','света','Light','of light'],
 dark:['Темн.','тьмы','Dark','of darkness']
});
function equipmentName(name,slot,grade,selection,locale='ru'){
 const base=String(name||'').trim(),rank=Number(grade);
 if(!base||!Number.isInteger(rank)||rank<=0||rank>10)return base;
 const gem=normalizeForSlot(slot,selection),forms=gem&&inflections[gem.element];
 let result=base;
 if(forms){
  if(slot==='weapon'){
   const prefix=locale==='en'?forms[2]:forms[0];
   if(!result.toLowerCase().startsWith(prefix.toLowerCase()+' '))result=prefix+' '+result;
  }else if(armourSlots.has(slot)){
   const suffix=locale==='en'?forms[3]:forms[1];
   if(!result.toLowerCase().endsWith(' '+suffix.toLowerCase()))result+=' '+suffix;
  }
 }
 return result+' +'+rank;
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
root.PandoraEnchantModel=Object.freeze({types,elements,normalize,normalizeForSlot,equipmentName,label,weaponPreview});
})(typeof window==='undefined'?globalThis:window);

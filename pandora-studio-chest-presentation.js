(function(root){
'use strict';
// Presentation-only interpretation of independent loot groups.
// Never normalize game probabilities, infer missing chances, or mutate the source.

// Descending source-listed chance, then original order for equal or unknown
// entries. Each roll stays in its own independent group; no fake aggregate
// probability, no reordering of the source and no changes to editor indices.
const chanceKey=row=>typeof row?.p==='number'&&Number.isFinite(row.p)?
 row.p:Number.NEGATIVE_INFINITY;
function orderedRewards(entries){
 return (Array.isArray(entries)?entries:[]).map((row,index)=>({index,row}))
  .sort((a,b)=>chanceKey(b.row)-chanceKey(a.row)||a.index-b.index);
}
function orderedGroups(rolls){
 return (Array.isArray(rolls)?rolls:[]).map((entries,index)=>({index,entries}))
  .sort((a,b)=>{
   const high=list=>Math.max(Number.NEGATIVE_INFINITY,
    ...(Array.isArray(list)?list:[]).map(chanceKey));
   return high(b.entries)-high(a.entries)||a.index-b.index;
  });
}
function analyze(rolls,chestIds=[]){
 const boxes=chestIds&&typeof chestIds.has==='function'?chestIds:
  new Set((Array.isArray(chestIds)?chestIds:[]).map(String));
 const records=Array.isArray(rolls)?rolls.map((entries,index)=>({
  index,
  entries:Array.isArray(entries)?entries:[],
  nested:[] 
 })):[];
 for(const record of records){
  record.nested=record.entries.filter(row=>row&&boxes.has(String(row.i)))
   .map(row=>String(row.i));
  record.kind=record.entries.length===1&&record.entries[0]?.p===100?
   'listed-100':record.entries.length>1?'alternatives':'other';
 }
 return {
  listed100:records.filter(record=>record.kind==='listed-100'),
  alternatives:records.filter(record=>record.kind==='alternatives'),
  other:records.filter(record=>record.kind==='other'),
  records,
  nestedCount:records.reduce((sum,record)=>sum+record.nested.length,0)
 };
}
function chance(value,language='ru'){
 if(typeof value!=='number'||!Number.isFinite(value))return language==='en'?
  'Chance not listed':'Шанс не указан';
 return new Intl.NumberFormat(language==='en'?'en-US':'ru-RU',{
  maximumFractionDigits:3
 }).format(value)+'%';
}
// NPC chest rolls also award a source-listed interval of gold instead of
// an item. Show its exact range without inventing an item link or quantity.
function goldLabel(row,language='ru'){
 const values=row?.gold;
 if(!Array.isArray(values)||values.length!==2||
   !values.every(x=>Number.isSafeInteger(x)&&x>=0)||
   values[1]<values[0])return null;
 const fmt=new Intl.NumberFormat(language==='en'?'en-US':'ru-RU');
 const amount=fmt.format(values[0])+(values[1]===values[0]?
  '':'–'+fmt.format(values[1]));
 return (language==='en'?'Gold: ':'Золото: ')+amount;
}
// These are UI-only facets of a chest reward, never a game mechanic. Group
// chances, original editor indices and source records must remain untouched.
const equipmentSlots=Object.freeze([
 'weapon','shield','head','body','gloves','legs','feet',
 'cloak','ring','neck','belt','ear'
]);
const knownSlots=new Set(equipmentSlots);
// Current published catalog contains ETC records with confirmed utility
// descriptions. These are presentation labels only, not effect calculations.
// Unrecognized future ETC records still remain in Materials/Recipes instead
// of being guessed from translated names or unrelated item ID ranges.
const knownUtilityETC=new Set([
 '65004','65006', // return wings / PvP-training ticket
 '90001','90004', // premium service tickets
 '90037','90053', // revival doll / quick return wings
 '90045','90046','90049','90050', // extra inventory tabs
 '90057','90060', // extra storage tabs
 '90080' // apprentice repair hammer
]);
const knownPotionETC=new Set(['90038']); // universal status-curing potion
// Nine source-confirmed celebratory TOY rewards from Ritual Utensils (51049).
// TOY alone is NOT proof of a festival item: it also includes unopened
// level-up boxes and other interactive objects. Do not infer from names.
const knownFestivalTOY=new Set([
 '50027','50028','50029','50030','50036','50038','50039','50040','50041'
]);
const categoryOrder=Object.freeze([
 'equipment','potions','boosts','gems','souls','utility','festival',
 'materials','containers','gold','other'
]);
function rewardCategory(row,items={},souls={},chestIds=new Set()){
 if(Array.isArray(row?.gold))return {type:'gold',slot:null};
 const id=row?.i==null?'':String(row.i);
 if(id&&chestIds?.has?.(id))return {type:'containers',slot:null};
 const item=items?.[id]||null;
 const kind=String(item?.kind||'').toUpperCase();
 if(souls?.[id]||kind==='SOUL')return {type:'souls',slot:null};
 const slot=String(item?.slot||'');
 if(knownSlots.has(slot))return {type:'equipment',slot};
 if(kind==='POTION')return {type:'potions',slot:null};
 if(kind==='BALM')return {type:'boosts',slot:null};
 if(kind==='RUNEGEM')return {type:'gems',slot:null};
 if(kind==='ETC'&&knownPotionETC.has(id))return {type:'potions',slot:null};
 if(kind==='ETC'&&knownUtilityETC.has(id))return {type:'utility',slot:null};
 if(kind==='TOY'&&knownFestivalTOY.has(id))return {type:'festival',slot:null};
 if(kind==='ETC'||kind==='RECIPE')return {type:'materials',slot:null};
 return {type:'other',slot:null};
}
function rewardFilters(rolls,items={},souls={},chestIds=new Set()){
 const types=Object.fromEntries(categoryOrder.map(key=>[key,0]));
 const slots=Object.fromEntries(equipmentSlots.map(key=>[key,0]));
 let total=0;
 for(const group of Array.isArray(rolls)?rolls:[]){
  if(!Array.isArray(group))continue;
  for(const row of group){
   const classified=rewardCategory(row,items,souls,chestIds);
   types[classified.type]++;total++;
   if(classified.slot)slots[classified.slot]++;
  }
 }
 return {total,types,slots};
}
function rewardMatches(category,type='all',slot='all'){
 if(!category||typeof category.type!=='string')return false;
 if(type!=='all'&&category.type!==type)return false;
 return type!=='equipment'||slot==='all'||category.slot===slot;
}

root.PandoraStudioChestPresentation=Object.freeze({analyze,chance,goldLabel,orderedRewards,orderedGroups,rewardCategory,rewardFilters,rewardMatches,equipmentSlots,categoryOrder});
})(typeof window==='undefined'?globalThis:window);

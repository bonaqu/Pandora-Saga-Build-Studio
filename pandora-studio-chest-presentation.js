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
root.PandoraStudioChestPresentation=Object.freeze({analyze,chance,goldLabel,orderedRewards,orderedGroups});
})(typeof window==='undefined'?globalThis:window);

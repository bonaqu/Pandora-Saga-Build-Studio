(function(root){
'use strict';
// Presentation-only interpretation of independent loot groups.
// Never normalize game probabilities, infer missing chances, or mutate the source.
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
root.PandoraStudioChestPresentation=Object.freeze({analyze,chance});
})(typeof window==='undefined'?globalThis:window);

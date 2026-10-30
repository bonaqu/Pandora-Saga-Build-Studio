(function(root){
"use strict";
// A field-by-field snapshot preview. No write operation is triggered here.
function recordMap(name,value){
 if(name==='trades')return Object.fromEntries((value?.trades||[]).map((row,i)=>[String(row.id??i),row]));
 if(name==='instances')return Object.fromEntries((value||[]).map((row,i)=>[String(row.id??i),row]));
 if(name==='strings.en'){
  const result={};
  for(const [section,records] of Object.entries(value||{})){
   if(records&&typeof records==='object'&&!Array.isArray(records))
     for(const[id,entry]of Object.entries(records))result[section+'/'+id]=entry;
   else result[section]=records;
  }
  return result;
 }
 if(name==='tables'||name==='expertise'||name==='chests')return Object.fromEntries(Object.entries(value||{}));
 return value&&typeof value==='object'?value:{};
}
function diff(name,previous,next){
 const before=recordMap(name,previous),after=recordMap(name,next);
 const keys=new Set([...Object.keys(before),...Object.keys(after)]);
 const results={dataset:name,added:[],removed:[],changed:[],previousCount:Object.keys(before).length,currentCount:Object.keys(after).length};
 for(const key of keys){
  if(!(key in before))results.added.push(key);
  else if(!(key in after))results.removed.push(key);
  else if(JSON.stringify(before[key])!==JSON.stringify(after[key]))results.changed.push(key);
 }
 results.total=results.added.length+results.removed.length+results.changed.length;
 return results;
}
root.PandoraCatalogDiff=Object.freeze({diff,recordMap});
})(typeof window==='undefined'?globalThis:window);

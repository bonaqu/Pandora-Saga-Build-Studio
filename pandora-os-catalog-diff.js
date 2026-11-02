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

function stable(value){
 if(Array.isArray(value))return value.map(stable);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])]));
 return value;
}
const equal=(a,b)=>JSON.stringify(stable(a))===JSON.stringify(stable(b));
function summarize(value){
 if(value===undefined)return '—';
 if(value===null)return 'null';
 if(typeof value==='string')return value.length>130?value.slice(0,127)+'…':value;
 if(typeof value!=='object')return String(value);
 const serialized=JSON.stringify(value);
 return serialized.length>145?serialized.slice(0,142)+'…':serialized;
}
function changedFields(before,after){
 const found=[];
 function walk(a,b,prefix,depth){
  if(found.length>=16||equal(a,b))return;
  const plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
  if(plain(a)&&plain(b)&&depth<2){
   for(const key of new Set([...Object.keys(a),...Object.keys(b)])){
    walk(a[key],b[key],prefix?prefix+'.'+key:key,depth+1);
    if(found.length>=16)break;
   }
  }else found.push({field:prefix||'значение',before:summarize(a),after:summarize(b)});
 }
 walk(before,after,'',0);
 return found;
}

function diff(name,previous,next){
 const before=recordMap(name,previous),after=recordMap(name,next);
 const keys=new Set([...Object.keys(before),...Object.keys(after)]);
 const results={dataset:name,added:[],removed:[],changed:[],examples:[],previousCount:Object.keys(before).length,currentCount:Object.keys(after).length};
 for(const key of keys){
  if(!(key in before)){
   results.added.push(key);
   if(results.examples.length<30)results.examples.push({key,kind:'added',fields:changedFields(undefined,after[key])});
  }else if(!(key in after)){
   results.removed.push(key);
   if(results.examples.length<30)results.examples.push({key,kind:'removed',fields:changedFields(before[key],undefined)});
  }else if(!equal(before[key],after[key])){
   results.changed.push(key);
   if(results.examples.length<30)results.examples.push({key,kind:'changed',fields:changedFields(before[key],after[key])});
  }
 }
 results.total=results.added.length+results.removed.length+results.changed.length;
 return results;
}
root.PandoraCatalogDiff=Object.freeze({diff,recordMap,changedFields});
})(typeof window==='undefined'?globalThis:window);

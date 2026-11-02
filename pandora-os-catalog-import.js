(function prepareCatalogImport(root){
"use strict";
const base=["meta","classes","skills","items","souls","monsters","drops","maps","instances","racialPassives","itemForth","unison","trades"];
const serialSources=[["tables","tables"],["expertise","expertise"],["chests","chests"],["stringsEn","strings.en"]];
const files=[...base,...serialSources.map(([,source])=>source)];
const datasets=[...base,"tradeMeta","legacyLocale",...serialSources.map(([dataset])=>dataset)];
function normalize(snapshot,legacy){
 const get=(o,k)=>{if(!o||typeof o!=="object"||Array.isArray(o))throw Error("Invalid dataset "+k);return o};
 get(snapshot,"snapshot");
 const meta=get(snapshot.meta,"meta"),expected=meta.counts||{};
 const result={};result.meta=[{key:"all",value:meta}];
 for(const key of base.slice(1)){
  const input=key==="instances"&&Array.isArray(snapshot[key])?snapshot[key]:get(snapshot[key],key);
  if(key==="trades"){
   if(!Array.isArray(input.trades))throw Error("Missing trade recipes");
   result.trades=input.trades.map((value,i)=>({key:String(i).padStart(6,"0"),value}));
   result.tradeMeta=[{key:"all",value:{npcs:get(input.npcs,"npcs"),mapNames:get(input.mapNames,"mapNames"),limitMeta:get(input.limitMeta,"limitMeta")}}];
  }else result[key]=Array.isArray(input)?input.map((value,i)=>({key:String(value.id??i),value})):Object.entries(input).map(([recordKey,value])=>({key:recordKey,value}));
  if(result[key].length!==Number(expected[key]))throw Error("Incomplete "+key+": "+result[key].length+" of "+expected[key]);
 }
 const localization=get(legacy,"legacy localization");
 if(!localization.game||!localization.ui)throw Error("Legacy language source not found");
 const records=[];
 for(const namespace of ["game","ui"]){
  for(const locale of ["ru","en","jp","tw"]){
   const source=localization[namespace]?.[locale]||{};
   for(const [key,value]of Object.entries(source)){
    if(typeof value!=="string"||!value.trim())continue;
    records.push({key:String(records.length).padStart(6,"0"),value:{namespace,locale,key,text:value,source:"Legacy approved terminology"}});
   }
  }
 }
 if(records.length<1000||records.length>10000)throw Error("Unreasonable localization count");

 const extraCounts={legacyLocale:records.length};
 for(const [dataset,source] of serialSources){
  const value=get(snapshot[source],source);
  if(dataset==="stringsEn"){
   if(value.locale!=="en")throw Error("Not an English translation source");
   for(const group of ["items","skills","monsters","souls","classes"]){
    const exp=Number(meta?.localeCounts?.en?.[group]);
    if(Number.isInteger(exp)&&Object.keys(value[group]||{}).length!==exp)throw Error("Incomplete English translations: "+group);
   }
  }
  const serialized=JSON.stringify(value),segments=[];
  for(let i=0;i<serialized.length;i+=6000){
   segments.push({key:String(segments.length).padStart(6,"0"),value:{chunk:segments.length,data:serialized.slice(i,i+6000)}});
  }
  if(!segments.length)throw Error("No data in "+source);
  result[dataset]=segments;extraCounts[dataset]=segments.length;
 }

 result.legacyLocale=records;
 return {datasets,entries:result,extraCounts,
  counts:Object.fromEntries(datasets.map(k=>[k,result[k].length]))};
}
root.PandoraCatalogImport=Object.freeze({base,files,datasets,normalize});
})(typeof window==='undefined'?globalThis:window);

import {test} from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
const sandbox={window:{}};
vm.runInNewContext(readFileSync(new URL("../catalog-import.js",import.meta.url),"utf8"),sandbox);
const rules=sandbox.window.PandoraCatalogImport;
const datasets=rules.base.filter(n=>n!=="meta");
function fixture(){
 const snapshot={meta:{counts:{}}};
 for(const key of datasets){
   if(key==="trades"){snapshot[key]={trades:[{id:1,i:20}],npcs:{3:{name:"NPC"}},mapNames:{2:{name:"Map"}},limitMeta:{resetHour:4}};snapshot.meta.counts[key]=1;}
   else if(key==="instances"){snapshot[key]=[{id:100,name:"Quest"}];snapshot.meta.counts[key]=1;}
   else{snapshot[key]={100:{id:100,name:key}};snapshot.meta.counts[key]=1;}
 }
 const legacy={game:{ru:{"race.0":"Человек"},en:{"race.0":"Human"}},ui:{ru:{},en:{}}};
 // Fixture-only locale length below production minimum is deliberately rejected.
 return {snapshot,legacy};
}
test("all 15 normalized namespaces have stable names",()=>{
 assert.equal(rules.datasets.length,15);
 assert.ok(rules.datasets.includes("legacyLocale"));
 assert.ok(rules.datasets.includes("tradeMeta"));
});
test("missing localization cannot silently pass",()=>{
 const {snapshot}=fixture();
 assert.throws(()=>rules.normalize(snapshot,{}),/Legacy language source/);
});
test("incomplete source snapshot cannot be published",()=>{
 const {snapshot,legacy}=fixture();
 snapshot.meta.counts.items=2;
 assert.throws(()=>rules.normalize(snapshot,legacy),/Incomplete items/);
});
test("trade and array-based instance records are supported without losing original structure",()=>{
 const {snapshot,legacy}=fixture();
 // Add enough fixture locale keys to satisfy the importer sanity check.
 legacy.game.en=Object.fromEntries(Array.from({length:1000},(_,i)=>["id"+i,"English "+i]));
 const result=rules.normalize(snapshot,legacy);
 assert.equal(result.entries.instances[0].key,"100");
 assert.equal(result.entries.trades[0].value.id,1);
 assert.equal(result.entries.tradeMeta[0].value.npcs[3].name,"NPC");
 assert.equal(result.counts.legacyLocale,1001);
});

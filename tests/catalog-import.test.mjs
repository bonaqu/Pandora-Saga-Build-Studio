import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const sandbox={window:{}};
vm.runInNewContext(readFileSync(new URL('../catalog-import.js',import.meta.url),'utf8'),sandbox);
const rules=sandbox.window.PandoraCatalogImport;
function fixture(){
 const snapshot={meta:{counts:{},localeCounts:{en:{items:1,skills:1,monsters:1,souls:1,classes:1}}}};
 for(const name of rules.base.filter(name=>name!=='meta')){
  if(name==='instances')snapshot[name]=[{id:777,name:'Instance'}];
  else if(name==='trades')snapshot[name]={trades:[{id:1,i:20}],npcs:{3:{name:'NPC'}},mapNames:{2:{name:'Map'}},limitMeta:{resetHour:4}};
  else snapshot[name]={'100':{id:100,name}};
  snapshot.meta.counts[name]=1;
 }
 snapshot.tables={weaponPlus:{1:{flat:2}},zoneDrops:[{map:7,rows:[{mob:1}]}]};
 snapshot.expertise={limit:{WARRIOR:{slash:2}}};
 snapshot.chests={boxes:[{i:8,rolls:[]}],npc:[]};
 snapshot['strings.en']={locale:'en',items:{1:{n:'Sword'}},skills:{2:{n:'Slash'}},monsters:{3:{n:'Monster'}},souls:{4:{n:'Soul'}},classes:{WARRIOR:{n:'Warrior'}},branches:{slash:'Slash'}};
 const legacy={game:{ru:{'race.0':'Человек'},en:{}},ui:{ru:{},en:{}}};
 return {snapshot,legacy};
}
function makeLargeLocale(legacy){
 legacy.game.en=Object.fromEntries(Array.from({length:1000},(_,i)=>['key'+i,'English '+i]));
 return legacy;
}
test('complete catalogue exposes 19 versioned namespaces and 17 source files',()=>{
 assert.equal(rules.datasets.length,19);
 assert.equal(rules.files.length,17);
 assert.ok(rules.datasets.includes('stringsEn'));
});
test('failed or incomplete source is rejected before activation',()=>{
 const {snapshot,legacy}=fixture();
 snapshot.meta.counts.items=2;
 assert.throws(()=>rules.normalize(snapshot,makeLargeLocale(legacy)),/Incomplete items/);
});
test('official EN mappings are checked by per-category counts',()=>{
 const {snapshot,legacy}=fixture();
 snapshot['strings.en'].items={};
 assert.throws(()=>rules.normalize(snapshot,makeLargeLocale(legacy)),/Incomplete English translations: items/);
});
test('trades, instance arrays and other object namespaces preserve data',()=>{
 const {snapshot,legacy}=fixture();
 const result=rules.normalize(snapshot,makeLargeLocale(legacy));
 assert.equal(result.entries.instances[0].key,'777');
 assert.equal(result.entries.trades[0].value.id,1);
 assert.equal(result.entries.tradeMeta[0].value.npcs[3].name,'NPC');
 assert.equal(result.counts.legacyLocale,1001);
});
test('serialized source groups reassemble losslessly',()=>{
 const {snapshot,legacy}=fixture();
 const result=rules.normalize(snapshot,makeLargeLocale(legacy));
 for(const [alias,source] of [['tables','tables'],['expertise','expertise'],['chests','chests'],['stringsEn','strings.en']]){
  assert.deepEqual(JSON.parse(result.entries[alias].map(e=>e.value.data).join('')),snapshot[source]);
 }
});

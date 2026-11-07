import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const window={};
Function('window',readFileSync(
 new URL('../pandora-studio-wiki-owner-data.js',import.meta.url),'utf8'))(window);
const owner=window.PandoraWikiOwnerData;
const base=()=>({
 maps:{},monsters:{},
 trades:{
  npcs:{
   131:{id:131,name:'Старый торговец',maps:[1001004]},
   132:{id:132,name:'Другой торговец',maps:[1001004]}
  },
  mapNames:{
   1001004:{name:'Центральная площадь'},
   1003001:{name:'Королевство'}
  },
  trades:[{id:1,i:300,npc:[131],mats:[],gold:0,honor:0,exp:0}]
 }
});
const changes={
 'wikiedit.map.1001004':JSON.stringify({name:'Новая центральная площадь'}),
 'wikiedit.npc.131':JSON.stringify({name:'Новый торговец'}),
 'wikiedit.npc.132':JSON.stringify({descEn:'A helpful vendor'})
};
const allOrders=[
 Object.entries(changes),
 [...Object.entries(changes)].reverse(),
 [Object.entries(changes)[1],Object.entries(changes)[0],Object.entries(changes)[2]]
];
function freezeSource(source){
 for(const row of Object.values(source.trades.npcs))Object.freeze(row);
 for(const row of Object.values(source.trades.mapNames))Object.freeze(row);
 Object.freeze(source.trades.npcs);
 Object.freeze(source.trades.mapNames);
 Object.freeze(source.trades.trades);
 Object.freeze(source.trades);
 Object.freeze(source);
}

test('canonical NPC and map-name edits never mutate frozen original snapshots in any order',()=>{
 for(const order of allOrders){
  const source=base(),original=JSON.stringify(source);
  freezeSource(source);
  const changed=owner.apply(source,Object.fromEntries(order));
  assert.equal(JSON.stringify(source),original,'The original live OS snapshot must remain unchanged');
  assert.notStrictEqual(changed,source);
  assert.notStrictEqual(changed.trades,source.trades);
  assert.notStrictEqual(changed.trades.npcs,source.trades.npcs,
   'NPC dictionary must be cloned independent of the trade parent');
  assert.notStrictEqual(changed.trades.mapNames,source.trades.mapNames,
   'Map names must be cloned independent of the trade parent');
  assert.equal(changed.trades.npcs[131].name,'Новый торговец');
  assert.equal(changed.trades.npcs[132].descEn,'A helpful vendor');
  assert.equal(changed.trades.mapNames[1001004].name,'Новая центральная площадь');
  assert.equal(changed.trades.mapNames[1001004].ownerLabel,true);
  assert.equal(changed.trades.mapNames[1003001].name,'Королевство');
  assert.equal(changed.trades.npcs[132].name,'Другой торговец');
  assert.strictEqual(changed.trades.trades,source.trades.trades,
   'Unedited recipe references can stay shared');
  assert.deepEqual(changed,owner.apply(source,Object.fromEntries(order)),
   'Repeated reindexing must be deterministic for this order');
 }
});

test('independent NPC and map overlays cannot leak into the next recomputation',()=>{
 const source=base(),before=JSON.stringify(source);
 const npc=owner.apply(source,{'wikiedit.npc.131':changes['wikiedit.npc.131']});
 const map=owner.apply(source,{'wikiedit.map.1001004':changes['wikiedit.map.1001004']});
 assert.equal(npc.trades.npcs[131].name,'Новый торговец');
 assert.equal(map.trades.npcs[131].name,'Старый торговец');
 assert.equal(npc.trades.mapNames[1001004].name,'Центральная площадь');
 assert.equal(map.trades.mapNames[1001004].name,'Новая центральная площадь');
 assert.equal(JSON.stringify(source),before);
 assert.strictEqual(npc.trades.mapNames,source.trades.mapNames);
 assert.strictEqual(map.trades.npcs,source.trades.npcs);
});

test('mixed custom town and canonical NPC/map editing stays source-safe',()=>{
 const source=base();
 source.townMaps={'astir-kingdom':{name:'Территория Королевства'}};
 source.townNpcs={'astir-npc-kingdom-claris':{name:'Кларис',maps:['astir-kingdom']}};
 const before=JSON.stringify(source);
 const changed=owner.apply(source,{
  'wikiedit.npc.astir-npc-kingdom-claris':JSON.stringify({name:'Кларис — мастер сундуков'}),
  'wikiedit.map.astir-kingdom':JSON.stringify({name:'Новая территория'}),
  ...changes
 });
 assert.equal(JSON.stringify(source),before);
 assert.equal(changed.townNpcs['astir-npc-kingdom-claris'].name,'Кларис — мастер сундуков');
 assert.equal(changed.townMaps['astir-kingdom'].name,'Новая территория');
 assert.equal(changed.trades.npcs[131].name,'Новый торговец');
 assert.equal(changed.trades.mapNames[1001004].name,'Новая центральная площадь');
});

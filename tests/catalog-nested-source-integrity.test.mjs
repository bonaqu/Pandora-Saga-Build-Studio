import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const host={};
Function('window',readFileSync(new URL('../pandora-studio-encyclopedia-catalog.js',
 import.meta.url),'utf8'))(host);
const catalog=host.PandoraWikiCatalog;
const keys=catalog.keys;
const original=Object.fromEntries(keys.map(key=>[key,JSON.parse(readFileSync(
 new URL('../data/os/'+key+'.json',import.meta.url),'utf8'))]));
const clean=()=>structuredClone(original);
const mutate=(change)=>{const data=clean();change(data);return data};

test('all live-snapshot originals retain their sourced nested fields',()=>{
 assert.doesNotThrow(()=>catalog.validate(clean()));
 assert.equal(Object.keys(original.souls).length,112);
 assert.equal(Object.keys(original.trades.npcs).length,24);
 assert.equal(original.instances.length,6);
});

test('an invalid Soul socket source cannot turn into an equipment bonus',()=>{
 for(const slots of ['weapon',[],['weapon','weapon'],['weapon','pocket'],[1],{}]){
  const damaged=mutate(data=>{data.souls[101000].slots=slots});
  assert.throws(()=>catalog.validate(damaged),/слоты души/,JSON.stringify(slots));
 }
});

test('Soul effects are type checked before a D1 snapshot is accepted',()=>{
 const invalid=[
  ['price',-1,/цена души/],
  ['name','',/название души/],
  ['effects',{},/эффекты души/],
  ['effects',[null],/эффект души/],
  ['effects',[{func:123}],/эффект души/],
  ['effects',[{func:'EP_TEST',a:'42'}],/число эффекта души/],
  ['effects',[{func:'EP_TEST',a:NaN}],/число эффекта души/],
  ['effects',[{func:'EP_TEST',min:10,max:2}],/диапазон эффекта души/]
 ];
 for(const [field,value,reason] of invalid){
  const damaged=mutate(data=>{data.souls[101000][field]=value});
  assert.throws(()=>catalog.validate(damaged),reason,field);
 }
});

test('optional historical Soul fields stay unknown, not invented',()=>{
 const data=mutate(data=>{
  delete data.souls[101000].slots;
  delete data.souls[101000].effects;
  delete data.souls[101000].price;
 });
 assert.doesNotThrow(()=>catalog.validate(data));
 assert.equal(Object.hasOwn(data.souls[101000],'effects'),false);
});

test('NPC, map and dungeon names and text reject malformed published data',()=>{
 const cases=[
  [data=>{Object.values(data.trades.npcs)[0].name=''},/название NPC/],
  [data=>{Object.values(data.trades.mapNames)[0].name=null},/название локации NPC/],
  [data=>{Object.values(data.maps)[0].name=[]},/название локации/],
  [data=>{data.instances[0].name='  '},/название подземелья/],
  [data=>{data.instances[0].blurbRu={text:'not-a-translation'}},/текст подземелья/],
  [data=>{data.instances[0].blurb=[]},/текст подземелья/]
 ];
 for(const [damage,reason] of cases)
  assert.throws(()=>catalog.validate(mutate(damage)),reason);
});

test('historical missing Russian dungeon text remains an allowed absence',()=>{
 const source=mutate(data=>delete data.instances[0].blurbRu);
 assert.doesNotThrow(()=>catalog.validate(source));
 assert.equal(Object.hasOwn(source.instances[0],'blurbRu'),false);
});

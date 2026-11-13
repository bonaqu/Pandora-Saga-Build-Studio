import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const book=read('pandora-studio-hero-book.js');
const start=book.indexOf('function individualStatusSourceRows(');
const end=book.indexOf('function appendChapterGroups(',start);
assert.ok(start>=0&&end>start,'source helper is a real pure function');
const sourceRows=Function(book.slice(start,end)+';return individualStatusSourceRows;')();
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const items=JSON.parse(read('data/os/items.json'));
const souls=JSON.parse(read('data/os/souls.json'));
const english=JSON.parse(read('data/os/strings.en.json'));
const terms={items,souls,englishItems:english.items,englishSouls:english.souls};
const statusLabels=[
 {key:'resistStatus:stun',ru:'Оглушение',en:'Stun'},
 {key:'resistStatus:numb',ru:'Заморозка',en:'Freeze'},
 {key:'resistStatus:silence',ru:'Немота',en:'Silence'},
 {key:'resistStatus:burn',ru:'Ожоги',en:'Burn'}
];
test('status source names are official Russian and English item and Soul records',()=>{
 const item=Object.values(items).find(r=>
  r.effects?.some(e=>e.func==='EP_IMMUNE_STUN'&&Number.isFinite(e.a)&&e.a>0)&&
  typeof english.items[r.id]?.n==='string');
 const soul=Object.values(souls).find(r=>
  r.effects?.some(e=>e.func==='EP_IMMUNE_NUMB'&&Number.isFinite(e.a)&&e.a>0)&&
  typeof english.souls[r.id]?.n==='string');
 assert.ok(item);assert.ok(soul);
 const itemValue=item.effects.find(e=>e.func==='EP_IMMUNE_STUN').a;
 const soulValue=soul.effects.find(e=>e.func==='EP_IMMUNE_NUMB').a;
 const traces=[
  {source:'item:'+item.id,func:'EP_IMMUNE_STUN',value:itemValue},
  {source:'soul:'+soul.id,func:'EP_IMMUNE_NUMB',value:soulValue}];
 const ru=sourceRows(traces,terms,false,statusLabels);
 const en=sourceRows(traces,terms,true,statusLabels);
 assert.deepEqual(ru.map(x=>x.name),[item.name,soul.name]);
 assert.deepEqual(en.map(x=>x.name),[
  english.items[item.id].n,english.souls[soul.id].n]);
 assert.deepEqual(ru.map(x=>x.label),['Оглушение','Заморозка']);
 assert.deepEqual(en.map(x=>x.label),['Stun','Freeze']);
 assert.deepEqual(ru.map(x=>x.amount),[itemValue,soulValue]);
});
test('only official canonical item and Soul names may appear, never technical IDs',()=>{
 const real=Object.values(items).find(r=>r.effects?.some(x=>x.func==='EP_IMMUNE_STUN'));
 assert.ok(real);
 const fake=[{source:'item:'+real.id,func:'EP_IMMUNE_STUN',value:15},
  {source:'item:999999999',func:'EP_IMMUNE_STUN',value:999},
  {source:'soul:0',func:'EP_IMMUNE_STUN',value:10},
  {source:'set:42',func:'EP_IMMUNE_STUN',value:10},
  {source:'item:'+real.id,func:'EP_IMMUNE_STUN',value:null},
  {source:'item:'+real.id,func:'EP_OTHER',value:900}];
 const rows=sourceRows(fake,terms,false,statusLabels);
 assert.equal(rows.length,1);
 assert.equal(rows[0].name,real.name);
 assert.equal(rows[0].amount,15);
 const mismatched={...terms,items:{...items,[real.id]:{...real,id:real.id+1}}};
 assert.equal(sourceRows(fake,mismatched,false,statusLabels).length,0);
});
test('repeated sources merge signed values, without inventing extra resistance',()=>{
 const gear={id:987001,name:'Тестовый щит'};
 const t={items:{987001:gear},souls:{},englishItems:{987001:{n:'Test Shield'}},englishSouls:{}};
 const raw=[
  {source:'item:987001',func:'EP_IMMUNE_STUN',value:15},
  {source:'item:987001',func:'EP_IMMUNE_STUN',value:-5},
  {source:'item:987001',func:'EP_IMMUNE_SILENCE',value:4},
  {source:'item:987001',func:'EP_IMMUNE_TUMBLE',value:9}];
 const result=sourceRows(raw,t,false,statusLabels);
 assert.deepEqual(result.map(x=>({status:x.status,amount:x.amount})),[
  {status:'stun',amount:10},{status:'silence',amount:4}]);
 const sources=C.gatherEffects([['item:987001',{...gear,effects:[
  {func:'EP_IMMUNE_STUN',a:15},{func:'EP_IMMUNE_STUN',a:-5},
  {func:'EP_IMMUNE_SILENCE',a:4}]},0]]);
 const before=C.resistancePreview({stats:{vit:28,spi:28},bonuses:sources.bonuses});
 sourceRows(sources.trace,t,false,statusLabels);
 const after=C.resistancePreview({stats:{vit:28,spi:28},bonuses:sources.bonuses});
 assert.deepEqual(after,before);
 assert.equal(after.status.stun,10);
 assert.equal(after.status.silence,4);
});
test('250 synthetic source combinations remain deterministic and omit malformed/zero data',()=>{
 const gear=Object.values(items).filter(r=>r.effects?.some(x=>
  ['EP_IMMUNE_STUN','EP_IMMUNE_SILENCE','EP_IMMUNE_BURN'].includes(x.func)&&
  Number.isFinite(x.a)));
 assert.ok(gear.length>5);
 for(let i=0;i<250;i++){
  const a=gear[i%gear.length],b=gear[(i*3+1)%gear.length];
  const records=[['item:'+a.id,a,i%11],['item:'+b.id,b,(i+3)%11]];
  const traces=C.gatherEffects(records).trace;
  const ru=sourceRows(traces,terms,false,statusLabels);
  assert.deepEqual(ru,sourceRows(traces,terms,false,statusLabels));
  assert.ok(ru.every(x=>x.label&&x.name&&!x.name.startsWith('item:')&&
   Number.isFinite(x.amount)&&x.amount!==0));
 }
});
test('Book displays a collapsed explanatory source list inside status defense, not fake total',()=>{
 const app=read('pandora-studio-app.js');
 const css=read('pandora-studio-hero-book-additions.css');
 assert.match(book,/stage-status-source-breakdown/);
 assert.match(book,/Вклад предметов и душ/);
 assert.match(book,/Титулы, пассивные умения, комплекты/);
 assert.match(book,/statusSourceTraces:calc\?\.effects\?\.trace\|\|\[\]/);
 assert.match(book,/individualStatusSourceRows\(options\.statusSourceTraces/);
 assert.match(app,/souls:catalogSource\?\.souls\|\|\{\},englishSouls:officialEnglish\?\.souls\|\|\{\}/);
 assert.match(css,/stage-status-source-breakdown/);
});

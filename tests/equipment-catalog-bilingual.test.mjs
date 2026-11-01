import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const host={};
Function('window',read('item-presentation.js'))(host);
const names=host.PandoraItemPresentation;
const app=read('app.js');
const start=app.indexOf('function renderEquipment(root){');
const end=app.indexOf('function renderStats(',start);
assert.ok(start>=0&&end>start);
const catalog=app.slice(start,end);

test('item categories retain Russian defaults and exact English labels',()=>{
 for(const [kind,ru,en] of [['RING','Кольцо','Ring'],['1H_SWORD','Одноручный меч','One-handed sword'],
  ['DECO_MANTLE','Декоративный плащ','Cosmetic cloak'],['SOUL','Душа','Soul'],
  ['STAFF','Посох','Staff'],['BELT','Пояс','Belt']]){
  assert.equal(names.kind({kind}),ru);
  assert.equal(names.kind({kind},'en'),en);
 }
 assert.equal(names.kind({slot:'ear'},'en'),'Earring');
 assert.equal(names.kind({kind:'unknown'},'en'),'Item');
 assert.equal(names.kind(null,'en'),'Item');
});

test('equipment editor chrome is bilingual without changes to saved record IDs or names',()=>{
 assert.match(catalog,/const tx=\(ru,en\)=>lang==='en'\?en:ru/);
 for(const phrase of ['All types','Weapons','Earrings','Search items','Item details',
  'Where to obtain','Sources and details','No results','Show more','Sources are currently unavailable'])
  assert.ok(catalog.includes(phrase),'missing EN: '+phrase);
 assert.match(catalog,/PandoraItemPresentation\.kind\(rec,lang\)/);
 assert.match(catalog,/const matches=inventory\.filter/);
 assert.match(catalog,/const key=entry\.type==='drop'\?'map':entry\.type/);
 assert.match(catalog,/String\(rec\.id\)/);
 assert.match(catalog,/itemName\(rec\)/);
 assert.match(catalog,/onmouseenter:\(\)=>inspect\(rec\),onfocus:\(\)=>inspect\(rec\),onclick:\(\)=>inspect\(rec\)/);
 assert.match(app,/lang==='en'\?'Open skills':'Открыть умения'/);
});

test('game-provided names and descriptions are not translated by kind formatting',()=>{
 const item={id:19022,name:'Кольцо метели',kind:'RING',desc:'Проверенное игровое описание'};
 assert.equal(names.kind(item,'en'),'Ring');
 assert.equal(item.name,'Кольцо метели');
 assert.equal(item.desc,'Проверенное игровое описание');
 assert.equal(item.id,19022);
});

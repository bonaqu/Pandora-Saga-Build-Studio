import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const host={};
Function('window',read('item-presentation.js'))(host);
const presenter=host.PandoraItemPresentation,app=read('app.js'),html=read('index.html');

test('equipment categories retain game-faithful RU/EN labels',()=>{
 for(const [kind,ru,en] of [['RING','Кольцо','Ring'],
  ['1H_SWORD','Одноручный меч','One-handed sword'],
  ['TORSO','Броня','Armor'],['CUISSES','Штаны','Leg armor'],
  ['DECO_MANTLE','Декоративный плащ','Cosmetic cloak'],
  ['SOUL','Душа','Soul'],['STAFF','Посох','Staff'],['BELT','Пояс','Belt']]){
  assert.equal(presenter.kind({kind}),ru);
  assert.equal(presenter.kind({kind},'en'),en);
 }
 assert.equal(presenter.kind({slot:'ear'},'en'),'Earring');
 assert.equal(presenter.kind(null,'en'),'Item');
});

test('equipment is a single encyclopedia chapter with localized filters and source links',()=>{
 assert.ok(app.includes("['item','Экипировка','Equipment']"));
 for(const phrase of ['All items','Weapons','Earrings','Armor','Rings',
  'How to obtain','Eligible classes','Show more']){
  assert.ok(app.includes(phrase),'missing English wiki label: '+phrase);
 }
 assert.ok(app.includes('PandoraItemPresentation.kind(rec,lang)'));
 assert.ok(/wikiItemType==='equipment'\?\s*slotKeys\.includes\(rec\.slot\)/.test(app));
 assert.ok(app.includes('const itemLink=(id,label,highlight=null)=>'));
 assert.ok(app.includes("wikiItemLayout==='grid'"));
 assert.ok(!html.includes('data-tab="equipment"'));
 assert.ok(!app.includes('function renderEquipment('));
 assert.ok(!app.includes('let catalogBrowseSlot='));
 assert.ok(app.includes("bootView.tab==='equipment'?'wiki'"));
});

test('source names and descriptions do not change with item type labeling',()=>{
 const item={id:19022,name:'Кольцо метели',kind:'RING',desc:'Проверенное игровое описание'};
 assert.equal(presenter.kind(item,'en'),'Ring');
 assert.equal(item.name,'Кольцо метели');
 assert.equal(item.desc,'Проверенное игровое описание');
 assert.equal(item.id,19022);
});

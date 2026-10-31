import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('app.js');
const start=app.indexOf('function renderSlotRails(){');
const end=app.indexOf('\nfunction renderStageAttributes(){',start);
assert.ok(start>0&&end>start);
const source=app.slice(start,end);
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.attributes={};this.listeners={};
  this.className='';this.textContent='';this.dataset={};this.style={}}
 append(...args){this.children.push(...args)}
 replaceChildren(...args){this.children=[...args]}
 setAttribute(key,value){this.attributes[key]=String(value)}
}
const slots=[['Оружие','⚔'],['Щит','◈'],['Шлем','♜'],['Нагрудник','♟'],
 ['Перчатки','♧'],['Поножи','♙'],['Обувь','♧'],['Плащ','❧'],
 ['Кольцо I','◉'],['Кольцо II','◉'],['Амулет','✥'],['Пояс','♢'],
 ['Серьга I','✧'],['Серьга II','✧']];
const slotKeys=['weapon','shield','head','body','gloves','legs','feet','cloak',
 'ring','ring','neck','belt','ear','ear'];
function fixture(issue=()=>[]){
 const window={};
 Function('window',read('equipment-plan.js'))(window);
 Function('window',read('item-presentation.js'))(window);
 let dismiss=0,attached=0;
 window.PandoraStageItemUI={
  dismissPreview:()=>dismiss++,
  attachPreview(button){attached++;assert.equal(button.attributes.title,undefined)}
 };
 const equipment={
  0:{id:100,name:'Меч'},8:{id:19022,name:'Кольцо метели'}
 };
 const records={
  0:{id:100,name:'Меч',slot:'weapon',soulslot:2},
  8:{id:19022,name:'Кольцо метели',slot:'ring',soulslot:0}
 };
 const state={equipment,souls:{0:[{id:41},{id:42}]},refinements:{'0:100':6}};
 const left=new Element('left'),right=new Element('right');
 const $=name=>name==='railLeft'?left:right;
 const h=(tag,attrs={},children=[])=>{
  const e=new Element(tag);for(const [k,v]of Object.entries(attrs)){
   if(k==='class')e.className=v;
   else if(k==='text')e.textContent=v;
   else if(k.startsWith('on'))e.listeners[k.slice(2)]=v;
   else e.attributes[k]=String(v);
  }
  e.append(...children);return e;
 };
 const render=Function('window','state','$','slots','slotKeys','h','slotVisual',
  'equippedRecord','equipmentIssue','itemIcon','itemName','selectedSlot','stageSlotPickerOpen',
  'selectedSocket','gearMode','stageSlotQuery','stageSoulQuery','stageSlotShown',
  'stageSlotView','renderStagePicker',source+'\nreturn renderSlotRails;')(
  window,state,$,slots,slotKeys,h,i=>h('span',{class:'slot-glyph',text:slots[i][1]}),
  i=>records[i]||null,issue,()=>null,
  r=>window.PandoraItemPresentation.displayName(r),0,false,0,'equipment','','',48,
  'choose',()=>{}
 );
 render();
 return{left,right,attached,get dismissed(){return dismiss}};
}
test('portrait renders 14 gear slots without exposing native title tooltips',()=>{
 const f=fixture(),all=[...f.left.children,...f.right.children];
 assert.equal(all.length,14);
 assert.equal(f.attached,2,'one custom hover for each equipped item');
 assert.equal(f.dismissed,1,'rerender clears a stale visual tooltip');
 assert.ok(all.every(x=>x.attributes.title===undefined));
});
test('weapon grade and Soul count remain distinct markers; ring does not report 0/0 Souls',()=>{
 const f=fixture(),all=[...f.left.children,...f.right.children];
 const weapon=all.find(x=>x.attributes['data-slot-index']==='0');
 const ring=all.find(x=>x.attributes['data-slot-index']==='8');
 assert.match(weapon.attributes['aria-label'],/души 2\/2/);
 assert.match(weapon.attributes['aria-label'],/\+6/);
 assert.ok(weapon.children.some(x=>x.className==='stage-enhance'));
 assert.ok(weapon.children.some(x=>x.className==='stage-sockets'));
 assert.ok(!ring.attributes['aria-label'].includes('души 0/0'));
 assert.ok(!ring.children.some(x=>x.className==='stage-sockets'));
 assert.equal(ring.children.find(x=>x.tag==='small')?.textContent,'Кольцо метели');
});

test('persisted incompatible item keeps slot and receives a game-like inactive marker',()=>{
 const f=fixture((record,slot)=>slot===0?['Требуется уровень 40']:[]);
 const weapon=[...f.left.children,...f.right.children].find(x=>x.attributes['data-slot-index']==='0');
 assert.match(weapon.className,/unavailable/);
 assert.match(weapon.attributes['aria-label'],/Не действует: Требуется уровень 40/);
 assert.ok(weapon.children.some(x=>x.className==='stage-conflict'));
});

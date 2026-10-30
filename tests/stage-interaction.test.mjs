import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const load=p=>readFileSync(new URL(p,root),'utf8');
const host={};
Function('window',load('equipment-plan.js'))(host);
Function('window',load('enchant-model.js'))(host);
globalThis.PandoraEquipmentPlan=host.PandoraEquipmentPlan;
Function('window',load('item-presentation.js'))(host);
globalThis.PandoraItemPresentation=host.PandoraItemPresentation;
globalThis.PandoraEnchantModel=host.PandoraEnchantModel;

class FakeElement{
 constructor(tag){this.tag=tag;this.children=[];this.attributes={};this.events={};this.className='';
 this.dataset={};this.classList={toggle:()=>{},add:()=>{}};this.style={};this.textContent='';}
 append(...values){this.children.push(...values);return this}
 setAttribute(k,v){this.attributes[k]=String(v)}
 addEventListener(event,fn){this.events[event]=fn}
 replaceWith(){}
 replaceChildren(...values){this.children=values}
}
const document={createElement:t=>new FakeElement(t),createTextNode:t=>({tag:'#text',textContent:t}),body:new FakeElement('body')};
const stage={};
Function('window','document',load('stage-item-ui.js'))(stage,document);
const walk=node=>[node,...(node.children||[]).flatMap(walk)];
const byText=(node,text)=>walk(node).find(x=>x.tag==='button'&&x.textContent===text);

function makeApi(slot,mode='details'){
 const calls={grade:[],mode:[],socket:[],soul:[],gem:[]};
 const rec={id:21,slot,kind:'1H_SWORD',name:'Тестовый предмет',W:48,level:40,soulslot:1};
 const api={record:rec,item:{id:21},slot,slotIndex:0,selectedSocket:0,
  mode,refinement:7,souls:[null],gems:{type:'physical',element:'fire'},
  icons:()=>null,gameTables:{weaponPlus:{7:{ratio:15,flat:19}}},
  catalog:{souls:{}},close:()=>{},
  changeMode:x=>calls.mode.push(x),updateGrade:x=>calls.grade.push(x),
  openSocket:x=>calls.socket.push(x),assignSoul:x=>calls.soul.push(x),
  assignGem:x=>calls.gem.push(x)};
 return {api,calls,box:new FakeElement('root')};
}

test('equipped weapon shows working refinement, gem type and Soul socket handlers',()=>{
 const state=makeApi('weapon');
 assert.doesNotThrow(()=>stage.PandoraStageItemUI.render(state.box,state.api));
 assert.ok(byText(state.box,'+8'));
 byText(state.box,'+8').events.click();
 assert.deepEqual(state.calls.grade,[8]);
 assert.ok(byText(state.box,'Физический'));
 byText(state.box,'Магический').events.click();
 assert.deepEqual(state.calls.gem,[{type:'magical',element:'fire'}]);
 assert.ok(walk(state.box).some(x=>x.textContent==='Заточка: +0…+10'));
 byText(state.box,'Души').events.click();
 assert.deepEqual(state.calls.mode,['souls']);
});

test('gemstone editor chooses magic and rainbow rather than an inventory rune ID',()=>{
 const state=makeApi('weapon','details');
 stage.PandoraStageItemUI.render(state.box,state.api);
 byText(state.box,'Радуга').events.click();
 assert.deepEqual(state.calls.gem,[{type:'physical',element:'rainbow'}]);
});

test('jewelry and cloak have no refinement or gemstone editor',()=>{
 for(const slot of ['ring','neck','ear','cloak']){
  const state=makeApi(slot);
  stage.PandoraStageItemUI.render(state.box,state.api);
  assert.equal(byText(state.box,'+8'),undefined,slot);
  assert.equal(byText(state.box,'Самоцветы'),undefined,slot);
  assert.equal(byText(state.box,'Души'),undefined,slot);
  const gems=makeApi(slot,'gems');
  stage.PandoraStageItemUI.render(gems.box,gems.api);
  assert.deepEqual(gems.calls.mode,['details'],slot);
 }
});

test('belt sockets are available; empty belt never invents a Soul tab',()=>{
 const sample=makeApi('belt');
 sample.api.record.slot='belt';stage.PandoraStageItemUI.render(sample.box,sample.api);
 assert.ok(byText(sample.box,'Души'));
 const empty=makeApi('belt');empty.api.record.soulslot=0;
 stage.PandoraStageItemUI.render(empty.box,empty.api);
 assert.equal(byText(empty.box,'Души'),undefined);
});
test('Soul socket controls are in Souls only, not under properties',()=>{
 const props=makeApi('weapon','details');stage.PandoraStageItemUI.render(props.box,props.api);
 assert.equal(walk(props.box).find(x=>x.attributes['aria-label']?.startsWith('Гнездо 1')),undefined);
 const souls=makeApi('weapon','souls');stage.PandoraStageItemUI.render(souls.box,souls.api);
 assert.ok(walk(souls.box).find(x=>x.attributes['aria-label']?.startsWith('Гнездо 1')));
});

test('Soul search state survives socket choice and selection, with no duplicate modal',()=>{
 const state=makeApi('belt','souls');state.api.soulQuery='свет';let next='';
 state.api.onSoulQuery=value=>next=value;
 stage.PandoraStageItemUI.render(state.box,state.api);
 const search=walk(state.box).find(e=>e.tag==='input'&&e.attributes['data-soul-query']==='1');
 assert.ok(search);
 assert.equal(search.attributes.value,'свет');
 search.value='огонь';search.events.input();
 assert.equal(next,'огонь');
 assert.equal(byText(state.box,'Души')?.className,'chosen');
});
test('grade, element and soul socket controls have stable focus restoration identifiers',()=>{
 const state=makeApi('weapon');stage.PandoraStageItemUI.render(state.box,state.api);
 assert.ok(walk(state.box).some(e=>e.attributes['data-grade']==='7'));
 assert.ok(walk(state.box).some(e=>e.attributes['data-enchant-key']==='element'));
 const souls=makeApi('weapon','souls');stage.PandoraStageItemUI.render(souls.box,souls.api);
 assert.ok(walk(souls.box).some(e=>e.attributes['data-socket-index']==='0'));
});

test('Properties has no duplicate Soul shortcut, reset-gem button, or explanatory filler',()=>{
 const state=makeApi('weapon','details');
 stage.PandoraStageItemUI.render(state.box,state.api);
 assert.equal(byText(state.box,'Сбросить тип и стихию'),undefined);
 assert.equal(walk(state.box).filter(x=>x.tag==='button'&&String(x.textContent).startsWith('✦ Души:')).length,0);
 assert.ok(byText(state.box,'Души'),'dedicated Soul tab is still available');
 const all=walk(state.box).map(x=>x.textContent||'').join(' ');
 assert.ok(!all.includes('Выбирай здесь — применяется сразу'));
 assert.ok(!all.includes('Таблица OS:'));
});

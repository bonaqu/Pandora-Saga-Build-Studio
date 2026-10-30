import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const load=p=>readFileSync(new URL(p,root),'utf8');
const host={};
Function('window',load('equipment-plan.js'))(host);
Function('window',load('enchant-model.js'))(host);
globalThis.PandoraEquipmentPlan=host.PandoraEquipmentPlan;
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
 assert.ok(byText(state.box,'Самоцветы'));
 byText(state.box,'Самоцветы').events.click();
 assert.deepEqual(state.calls.mode,['gems']);
 assert.ok(walk(state.box).some(x=>x.textContent==='Заточка: +0…+10'));
 const socket=walk(state.box).find(x=>x.attributes['aria-label']?.startsWith('Гнездо 1'));
 assert.ok(socket);
 socket.events.click();
 assert.deepEqual(state.calls.socket,[0]);
});

test('gemstone editor chooses magic and rainbow rather than an inventory rune ID',()=>{
 const state=makeApi('weapon','gems');
 stage.PandoraStageItemUI.render(state.box,state.api);
 byText(state.box,'Магический').events.click();
 byText(state.box,'Радуга').events.click();
 byText(state.box,'✓ Применить').events.click();
 assert.deepEqual(state.calls.gem,[{type:'magical',element:'rainbow'}]);
});

test('jewelry and cloak have no refinement or gemstone editor',()=>{
 for(const slot of ['ring','neck','belt','ear','cloak']){
  const state=makeApi(slot);
  stage.PandoraStageItemUI.render(state.box,state.api);
  assert.equal(byText(state.box,'+8'),undefined,slot);
  assert.equal(byText(state.box,'Самоцветы'),undefined,slot);
  assert.ok(byText(state.box,'Души'),slot);
  const gems=makeApi(slot,'gems');
  stage.PandoraStageItemUI.render(gems.box,gems.api);
  assert.deepEqual(gems.calls.mode,['details'],slot);
 }
});

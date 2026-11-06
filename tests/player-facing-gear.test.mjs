import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
class Element{
 constructor(tag){
  this.tag=tag;this.children=[];this.dataset={};this.style={};this.attrs={};this.listeners={};
  this.textContent='';this.className='';this.isConnected=false;this.id='';this.title='';
 }
 setAttribute(key,value){this.attrs[key]=String(value);if(key==='id')this.id=String(value);if(key==='title')this.title=String(value)}
 removeAttribute(key){delete this.attrs[key];if(key==='title')this.title=''}
 addEventListener(event,fn){this.listeners[event]=fn}
 append(...parts){this.children.push(...parts);if(this.isConnected)parts.forEach(node=>node.isConnected=true)}
 replaceChildren(...parts){this.children=[...parts]}
 querySelectorAll(key){return key==='[title]'?walk(this).filter(n=>n!==this&&Object.hasOwn(n.attrs,'title')):[]}
 getBoundingClientRect(){return this.rect||{left:20,right:64,top:90,bottom:134,width:44,height:44}}
 closest(){return null}
 matches(selector){
  if(selector===':hover')return Boolean(this.hovered);
  if(selector===':focus-visible')return Boolean(this.focusVisible);
  return false;
 }
 remove(){this.isConnected=false;this.removed=true}
}
const walk=e=>[e,...(e.children||[]).flatMap(x=>x instanceof Element?walk(x):[])];
function fixture(admin=false){
 const listeners={};
 const document={createElement:t=>new Element(t),createTextNode:t=>({textContent:t}),
  body:new Element('body'),documentElement:{clientWidth:1024},
  addEventListener:(name,listener)=>{listeners[name]=listener}};
 document.body.isConnected=true;
 const window={innerHeight:768,PandoraStudioAdminActive:()=>admin};
 const timers=new Map();
 let timerId=0;
 const setTimer=(callback,delay)=>{
  const id=++timerId;timers.set(id,{callback,delay});return id;
 };
 const clearTimer=id=>timers.delete(id);
 const runTimers=()=>{
  const pending=[...timers.values()];timers.clear();
  for(const row of pending)row.callback();
 };
 Function('window',read('pandora-studio-item-presentation.js'))(window);
 Function('window','document','setTimeout','clearTimeout',
  read('pandora-studio-equipment-ui.js'))(window,document,setTimer,clearTimer);
 return {window,document,api:window.PandoraStageItemUI,timers,runTimers,listeners};
}
const ring={id:19022,name:'Кольцо метели',kind:'RING',level:20,AC:0,soulslot:0,
 desc:'Кольцо из странного металла, помеченное знаком льда. СИЛ -1, ИНТ +1'};
test('player summary uses item attributes and original description without database ID',()=>{
 const {api}=fixture(),node=api.summary(ring,()=>null);
 const labels=walk(node).filter(n=>n.tag==='dt').map(n=>n.textContent);
 const values=walk(node).filter(n=>n.tag==='dd').map(n=>n.textContent);
 assert.ok(labels.includes('Тип'));assert.ok(!labels.includes('Слоты'),'Rings must not show Soul slot counts');
 assert.ok(!labels.includes('ID'));assert.ok(!values.includes('19022'));
 assert.ok(walk(node).some(n=>String(n.textContent).includes('СИЛ -1')));
});
test('admin inspection also keeps internal database IDs hidden',()=>{
 const {api}=fixture(true),node=api.summary(ring,()=>null);
 assert.ok(!walk(node).some(n=>n.tag==='dt'&&n.textContent==='ID'));
 assert.ok(!walk(node).some(n=>n.tag==='dd'&&n.textContent==='19022'));
});
test('rich hover delay does not flash while crossing items; keyboard focus stays immediate',()=>{
 const {api,document,timers,runTimers,listeners}=fixture();
 const button=new Element('button');
 document.body.append(button);
 button.setAttribute('title','Native item tooltip');
 api.attachPreview(button,ring,()=>null);
 assert.equal(button.title,'');
 assert.equal(Object.hasOwn(button.attrs,'title'),false);
 button.hovered=true;
 button.listeners.pointerenter({pointerType:'mouse'});
 assert.equal(document.body.children.length,1,
  'Preview must not be inserted immediately on mouse hover');
 assert.equal(timers.size,1);
 assert.equal([...timers.values()][0].delay,650);
 // Pointer focus never skips the delay.
 button.listeners.focus();
 assert.equal(document.body.children.length,1);
 runTimers();
 assert.equal(document.body.children.length,2);
 const tip=document.body.children[1];
 assert.equal(tip.id,'stage-gear-tooltip');
 assert.equal(button.attrs['aria-describedby'],tip.id);
 assert.equal(tip.isConnected,true);
 button.hovered=false;
 button.listeners.pointerleave();
 assert.equal(tip.isConnected,false);
 assert.equal(button.attrs['aria-describedby'],undefined);
 button.hovered=true;
 button.listeners.pointerenter({pointerType:'mouse'});
 button.hovered=false;
 button.listeners.pointerleave();
 assert.equal(timers.size,0,'Leaving before the timeout cancels the pending tooltip');
 runTimers();
 assert.equal(document.body.children.length,2,'Cancelled timer must not append another popup');
 button.focusVisible=true;
 button.listeners.focus();
 assert.equal(document.body.children.length,3);
 const focusTip=document.body.children[2];
 assert.equal(focusTip.isConnected,true);
 const event={key:'Escape',prevented:false,stopped:false,
  preventDefault(){this.prevented=true},
  stopImmediatePropagation(){this.stopped=true}};
 listeners.keydown(event);
 assert.equal(event.prevented,true);
 assert.equal(event.stopped,true,'Escape must not bubble to Wiki workbench');
 assert.equal(focusTip.isConnected,false);
 assert.equal(button.attrs['aria-describedby'],undefined);
 const emptyEvent={key:'Escape',prevented:false,stopped:false,
  preventDefault(){this.prevented=true},
  stopImmediatePropagation(){this.stopped=true}};
 listeners.keydown(emptyEvent);
 assert.equal(emptyEvent.stopped,false,'Without a tooltip, normal Wiki Escape remains active');
});
test('soul slots display localized labels rather than raw internal names',()=>{
 const {api}=fixture();
 const node=api.summary({id:101000,name:'Душа стрелка',slots:['weapon','belt'],desc:'Точность +8'},()=>null,'soul');
 const values=walk(node).filter(n=>n.tag==='dd').map(n=>n.textContent).join(' ');
 assert.match(values,/Оружие/);
 assert.match(values,/Пояс/);
 assert.doesNotMatch(values,/weapon|belt/);
});
test('stage rails expose grade and Souls count without title or duplicate labels',()=>{
 const source=read('pandora-studio-app.js');
 assert.match(source,/function renderSlotRails\(\)\{[\s\S]*?PandoraStageItemUI\.dismissPreview\(\)/);
 assert.doesNotMatch(source,/'aria-label':tooltip,title:tooltip/);
 assert.match(source,/class:'stage-sockets'/);
 assert.match(source,/class:'stage-enhance'/);
 const css=read('pandora-studio-theme.css');
 assert.match(css,/\.equipment-rail \.stage-sockets\{[\s\S]*?bottom:1px/);
 assert.match(css,/\.equipment-rail \.stage-enhance\{[\s\S]*?top:1px/);
});
test('approved variant 02 displays wearable races as one normal stat row in tooltip and Properties',()=>{
 const {api,window}=fixture();
 window.PandoraUIPlanner={outfitWearers:()=>['Эльф (Ж)','Кролль']};
 const summary=api.summary({id:1322,name:'Рассветный венец',slot:'head',
  kind:'HEAD',level:20,AC:2,soulslot:0,desc:'Тест'},()=>null,'item',{slot:'head'});
 const fields=walk(summary).filter(node=>node.tag==='dl'&&node.className==='stage-rich-fields');
 assert.equal(fields.length,1);
 const names=fields[0].children;
 const label=names.find(node=>node.tag==='dt'&&node.textContent==='Подходит');
 const value=names.find(node=>node.tag==='dd'&&node.className==='stage-gear-wearers-value');
 assert.ok(label&&value,'Wearable text belongs to the same dl as Type and Level');
 assert.deepEqual(value.children.filter(node=>node.tag==='span').map(node=>node.textContent),
  ['Эльф (Ж)','Кролль']);
 assert.equal(walk(summary).some(node=>node.className==='stage-gear-wearers'),false);
 assert.equal(walk(summary).some(node=>node.className==='stage-gear-wearer-chips'),false);
 const css=read('pandora-studio-equipment-tooltip.css');
 assert.match(css,/\.stage-rich-summary \.stage-rich-fields>\.stage-gear-wearers-value\{/);
 assert.doesNotMatch(css,/\.stage-rich-summary \.stage-gear-wearers\{/);
});
test('public item searches do not advertise or search raw database IDs',()=>{
 const app=read('pandora-studio-app.js'),picker=read('pandora-studio-equipment-ui.js');
 assert.doesNotMatch(app,/Search by name, ID/);
 assert.doesNotMatch(app,/Поиск по названию, ID/);
 assert.doesNotMatch(app,/itemName\(rec\)\+' '\+rec\.id/);
 assert.doesNotMatch(picker,/String\(rec\.name\|\|''\)\+' '\+rec\.id/);
});
test('player item encyclopedia does not display IDs or duplicate native hover titles',()=>{
 const source=read('pandora-studio-app.js');
 assert.doesNotMatch(source,/['"]ID ['"]\s*\+rec\.id/);
 assert.doesNotMatch(source,/text:type\+' · '\+id/);
 assert.doesNotMatch(source,/class:'item-card',type:'button',title:/);
 assert.match(source,/function itemName\(r\)\{return window\.PandoraItemPresentation\.displayName/);
});

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
 remove(){this.isConnected=false;this.removed=true}
}
const walk=e=>[e,...(e.children||[]).flatMap(x=>x instanceof Element?walk(x):[])];
function fixture(admin=false){
 const document={createElement:t=>new Element(t),createTextNode:t=>({textContent:t}),
  body:new Element('body'),documentElement:{clientWidth:1024}};
 document.body.isConnected=true;
 const window={innerHeight:768,PandoraStudioAdminActive:()=>admin};
 Function('window',read('item-presentation.js'))(window);
 Function('window','document',read('stage-item-ui.js'))(window,document);
 return {window,document,api:window.PandoraStageItemUI};
}
const ring={id:19022,name:'Кольцо метели',kind:'RING',level:20,AC:0,soulslot:0,
 desc:'Кольцо из странного металла, помеченное знаком льда. СИЛ -1, ИНТ +1'};
test('player summary uses item attributes and original description without database ID',()=>{
 const {api}=fixture(),node=api.summary(ring,()=>null);
 const labels=walk(node).filter(n=>n.tag==='dt').map(n=>n.textContent);
 const values=walk(node).filter(n=>n.tag==='dd').map(n=>n.textContent);
 assert.ok(labels.includes('Тип'));assert.ok(labels.includes('Гнёзда'));
 assert.ok(!labels.includes('ID'));assert.ok(!values.includes('19022'));
 assert.ok(walk(node).some(n=>String(n.textContent).includes('СИЛ -1')));
});
test('only authenticated owner sees database ID in inspection details',()=>{
 const {api}=fixture(true),node=api.summary(ring,()=>null);
 assert.ok(walk(node).some(n=>n.tag==='dt'&&n.textContent==='ID'));
 assert.ok(walk(node).some(n=>n.tag==='dd'&&n.textContent==='19022'));
});
test('hover removes native title and uses exactly one custom tooltip, also on focus',()=>{
 const {api,document}=fixture(),button=new Element('button');
 button.setAttribute('title','Native item tooltip');
 api.attachPreview(button,ring,()=>null);
 assert.equal(button.title,'');
 assert.equal(Object.hasOwn(button.attrs,'title'),false);
 button.listeners.mouseenter();
 assert.equal(document.body.children.length,1);
 let tip=document.body.children[0];
 assert.equal(tip.id,'stage-gear-tooltip');
 assert.equal(button.attrs['aria-describedby'],tip.id);
 button.listeners.mouseleave();
 assert.equal(tip.isConnected,false);
 assert.equal(button.attrs['aria-describedby'],undefined);
 button.listeners.focus();
 assert.equal(document.body.children.length,2);
 const focusTip=document.body.children[1];
 assert.equal(focusTip.isConnected,true);
 api.dismissPreview();
 assert.equal(focusTip.isConnected,false);
 assert.equal(button.attrs['aria-describedby'],undefined);
});
test('stage rails expose grade and Souls count without title or duplicate labels',()=>{
 const source=read('app.js');
 assert.match(source,/function renderSlotRails\(\)\{[\s\S]*?PandoraStageItemUI\.dismissPreview\(\)/);
 assert.doesNotMatch(source,/'aria-label':tooltip,title:tooltip/);
 assert.match(source,/class:'stage-sockets'/);
 assert.match(source,/class:'stage-enhance'/);
 const css=read('style.css');
 assert.match(css,/\.equipment-rail \.stage-sockets\{[\s\S]*?bottom:1px/);
 assert.match(css,/\.equipment-rail \.stage-enhance\{[\s\S]*?top:1px/);
});
test('public item searches do not advertise or search raw database IDs',()=>{
 const app=read('app.js'),picker=read('stage-item-ui.js');
 assert.doesNotMatch(app,/Search by name, ID/);
 assert.doesNotMatch(app,/Поиск по названию, ID/);
 assert.doesNotMatch(app,/itemName\(rec\)\+' '\+rec\.id/);
 assert.doesNotMatch(picker,/String\(rec\.name\|\|''\)\+' '\+rec\.id/);
});
test('player item encyclopedia does not display IDs or duplicate native hover titles',()=>{
 const source=read('app.js');
 assert.doesNotMatch(source,/['"]ID ['"]\s*\+rec\.id/);
 assert.doesNotMatch(source,/text:type\+' · '\+id/);
 assert.doesNotMatch(source,/class:'item-card',type:'button',title:/);
 assert.match(source,/function itemName\(r\)\{return window\.PandoraItemPresentation\.displayName/);
});

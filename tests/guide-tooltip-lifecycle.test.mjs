import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../pandora-studio-guide-tooltips.js',import.meta.url),'utf8');
function mount({observer=true}={}){
 const docEvents={},winEvents={},watchers=[],children=[];
 const popup={hidden:true,style:{},setAttribute(){},
  getBoundingClientRect:()=>({width:230,height:90})};
 const doc={body:{append(node){children.push(node)}},hidden:false,
  createElement:()=>popup,
  addEventListener:(name,fn)=>{docEvents[name]=fn}};
 const win={innerWidth:960,innerHeight:650,
  addEventListener:(name,fn)=>{winEvents[name]=fn}};
 class Watcher{
  constructor(fn){this.fn=fn;this.active=false;watchers.push(this)}
  observe(target,options){
   assert.equal(target,doc.body);
   assert.equal(options.childList,true);
   this.active=true;
  }
  disconnect(){this.active=false}
  notify(){if(this.active)this.fn([])}
 }
 const ctx={window:win,document:doc,setTimeout,clearTimeout,
  ...(observer?{MutationObserver:Watcher}:{})};
 vm.runInNewContext(source,ctx);
 const node=()=>{
  const attrs=new Map(),events={};
  const item={isConnected:true,dataset:{},events,
   classList:{add(){}},closest:()=>null,
   getAttribute:key=>attrs.get(key)||null,
   setAttribute:(key,value)=>attrs.set(key,String(value)),
   removeAttribute:key=>attrs.delete(key),
   addEventListener:(name,fn)=>{events[name]=fn},
   matches:()=>true,contains:target=>target===item,
   getBoundingClientRect:()=>({left:50,right:150,top:100,bottom:120}),
   attribute:key=>attrs.get(key)||null};
  return item;
 };
 return {api:win.PandoraGuideTooltip,popup,docEvents,winEvents,watchers,node};
}
function display(x,node){
 x.api.attach(node,'ОЗ — Очки здоровья');
 node.events.pointerenter({pointerType:'mouse'});
 assert.equal(x.popup.hidden,false);
 assert.equal(node.attribute('aria-describedby'),'stage-guide-tooltip');
}

test('removing a tooltip source immediately closes the popup and releases its observer',()=>{
 const x=mount(),item=x.node();
 display(x,item);
 assert.equal(x.watchers.length,1);
 item.isConnected=false;
 x.watchers[0].notify();
 assert.equal(x.popup.hidden,true);
 assert.equal(item.attribute('aria-describedby'),null);
 assert.equal(x.watchers[0].active,false);
});

test('only one removal observer exists while switching between sources',()=>{
 const x=mount(),a=x.node(),b=x.node();
 display(x,a);
 display(x,b);
 assert.equal(x.watchers.length,2);
 assert.equal(x.watchers.filter(observer=>observer.active).length,1);
 assert.equal(a.attribute('aria-describedby'),null);
 assert.equal(b.attribute('aria-describedby'),'stage-guide-tooltip');
 x.winEvents.popstate();
 assert.equal(x.popup.hidden,true);
 assert.equal(x.watchers.filter(observer=>observer.active).length,0);
 assert.equal(b.attribute('aria-describedby'),null);
});

test('scrolling a detached source dismisses it even without MutationObserver support',()=>{
 const x=mount({observer:false}),item=x.node();
 display(x,item);
 item.isConnected=false;
 x.docEvents.scroll();
 assert.equal(x.popup.hidden,true);
 assert.equal(item.attribute('aria-describedby'),null);
});

test('a click elsewhere or a hash change closes a visible guide tooltip',()=>{
 const x=mount(),item=x.node();
 display(x,item);
 x.docEvents.pointerdown({target:{}});
 assert.equal(x.popup.hidden,true);
 assert.equal(item.attribute('aria-describedby'),null);
 display(x,item);
 x.winEvents.hashchange();
 assert.equal(x.popup.hidden,true);
 assert.equal(x.watchers.filter(observer=>observer.active).length,0);
});

test('Escape cancels pending guide hints before chapter-level navigation',async()=>{
 const x=mount(),item=x.node();
 x.api.attach(item,'ОЗ — Очки здоровья',{hoverDelay:25});
 item.events.pointerenter({pointerType:'mouse'});
 let prevented=0,stopped=0;
 x.docEvents.keydown({key:'Escape',preventDefault(){prevented++},
  stopImmediatePropagation(){stopped++}});
 await new Promise(resolve=>setTimeout(resolve,50));
 assert.equal(x.popup.hidden,true);
 assert.equal(item.attribute('aria-describedby'),null);
 assert.equal(prevented,1);
 assert.equal(stopped,1);
});

test('Escape dismisses an open guide hint but leaves later Escape for the workbench',()=>{
 const x=mount(),item=x.node();
 display(x,item);
 let stopped=0;
 const e={key:'Escape',preventDefault(){},stopImmediatePropagation(){stopped++}};
 x.docEvents.keydown(e);
 assert.equal(x.popup.hidden,true);
 assert.equal(item.attribute('aria-describedby'),null);
 x.docEvents.keydown(e);
 assert.equal(stopped,1,'The next Escape is available for normal chapter navigation');
});

test('clicking outside cancels pending guide hint before hover timeout',async()=>{
 const x=mount(),item=x.node();
 x.api.attach(item,'ОМ — Очки маны',{hoverDelay:25});
 item.events.pointerenter({pointerType:'mouse'});
 x.docEvents.pointerdown({target:{}});
 await new Promise(resolve=>setTimeout(resolve,50));
 assert.equal(x.popup.hidden,true);
 assert.equal(item.attribute('aria-describedby'),null);
});

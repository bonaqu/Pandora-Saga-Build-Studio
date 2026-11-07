import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const read=name=>readFileSync(new URL(name,root),'utf8');

test('owner editor is a fixed overlay with an accessible left-edge handle',()=>{
 const app=read('pandora-studio-app.js');
 const css=read('pandora-studio-owner-dock.css');
 assert.match(app,/document\.body\.append\(root\)/);
 assert.doesNotMatch(app,/document\.querySelector\('\.workspace>\.left'\)\|\|document\.body/);
 assert.match(app,/ownerDockCollapsed=true/);
 assert.match(app,/panel\.inert=ownerDockCollapsed/);
 assert.match(app,/'aria-controls':'ownerDockPanel'/);
 assert.match(app,/'aria-expanded',String\(!ownerDockCollapsed\)/);
 assert.match(app,/root\.addEventListener\('keydown'/);
 assert.match(css,/body>#ownerDock\{/);
 assert.match(css,/position:fixed/);
 assert.ok(css.includes('inset:auto auto max(14px,env(safe-area-inset-bottom)) 0!important'));
 assert.match(css,/owner-dock-collapsed\{/);
 assert.match(css,/display:none;pointer-events:none/);
 assert.match(css,/width:128px;max-width:calc\(100vw - 8px\);pointer-events:auto/);
 assert.doesNotMatch(app,/if\(adminEditing&&adminToken&&!wasOpen&&!ownerDockCollapsed\)/,
  'Entering builds or Wiki must never collapse a manually opened editor');
 assert.match(css,/box-sizing:border-box;width:100%;min-width:0/);
 assert.doesNotMatch(css,/translate3d\(-100%,0,0\)/);
 assert.match(css,/\.owner-dock-handle/);
 assert.ok(css.includes('position:absolute;z-index:3;top:14px;right:12px'),
  'The Hide button must render above the sticky owner header');
 assert.match(css,/writing-mode:horizontal-tb/);
 assert.match(css,/width:128px;min-width:128px;height:38px/);
 assert.match(css,/position:relative;inset:auto;top:auto/);
 assert.match(css,/width:min\(474px,calc\(100vw - 16px\)\)/);
 assert.match(css,/#ownerDock \.owner-dock-body\{[\s\S]*?overflow-y:auto;overflow-x:hidden/);
 assert.match(css,/#ownerDock \.owner-dock-panel\{[\s\S]*?overflow:hidden/);
 const ownerItemCss=read('pandora-studio-item-owner-editor.css');
 assert.doesNotMatch(ownerItemCss,/body\.studio-workbench-open #ownerDock/,
  'Outdated workbench positioning must never override the editor dock');
 assert.doesNotMatch(ownerItemCss,/\.owner-dock-collapsed\{width:/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});

test('admin hover hint is delayed and cancelled, while keyboard focus is immediate',()=>{
 const callbacks=new Map(),timeouts=[],cancelled=[];
 let scroll;
 const makeElement=()=>({
  hidden:true,style:{},setAttribute(){},
  getBoundingClientRect(){return {width:200,height:60}},
  textContent:''
 });
 const doc={
  body:{append(){}},createElement:makeElement,
  addEventListener(name,fn){if(name==='scroll')scroll=fn}
 };
 const win={innerWidth:1000,innerHeight:800,addEventListener(){}};
 const sandbox={window:win,document:doc,
  setTimeout(fn,delay){const id=timeouts.length+1;timeouts.push({id,fn,delay});return id},
  clearTimeout(id){cancelled.push(id)}};
 vm.runInNewContext(read('pandora-studio-guide-tooltips.js'),sandbox);
 const attrs={},classes=new Set();
 let focusVisible=false,hovered=false;
 const node={
  dataset:{},isConnected:true,classList:{add(v){classes.add(v)}},
  setAttribute(k,v){attrs[k]=v},getAttribute(k){return attrs[k]??null},
  removeAttribute(k){delete attrs[k]},
  addEventListener(name,fn){callbacks.set(name,fn)},
  matches(selector){
   if(selector===':hover')return hovered;
   assert.equal(selector,':focus-visible');return focusVisible;
  },
  closest(){return null},
  getBoundingClientRect(){return {left:100,top:200,bottom:220}}
 };
 win.PandoraGuideTooltip.attach(node,'Проверка', {hoverDelay:1000});
 assert.ok(classes.has('stage-guide-label'));
 hovered=true;
 callbacks.get('pointerenter')({pointerType:'mouse'});
 assert.equal(timeouts[0].delay,1000);
 assert.equal(attrs['aria-describedby'],undefined);
 hovered=false;callbacks.get('pointerleave')();
 assert.deepEqual(cancelled,[1]);
 // Re-entering starts a fresh timer rather than restoring the stale popup.
 hovered=true;callbacks.get('pointerenter')({pointerType:'mouse'});
 assert.equal(timeouts[1].delay,1000);
 // Scroll cancels the old timer but restarts it if pointer stays on the label.
 scroll();
 assert.deepEqual(cancelled,[1,2]);
 assert.equal(timeouts[2].delay,1000);
 timeouts[2].fn();
 assert.equal(attrs['aria-describedby'],'stage-guide-tooltip');
 hovered=false;callbacks.get('pointerleave')();
 assert.equal(attrs['aria-describedby'],undefined);
 callbacks.get('focus')();
 assert.equal(attrs['aria-describedby'],undefined,
  'Pointer focus should not bypass the delay');
 focusVisible=true;
 callbacks.get('focus')();
 assert.equal(attrs['aria-describedby'],'stage-guide-tooltip');
 callbacks.get('blur')();
 assert.equal(attrs['aria-describedby'],undefined);
});

test('admin action tooltips opt into one second, not global instant behavior',()=>{
 const workbench=read('pandora-os-catalog-workbench.js');
 const app=read('pandora-studio-app.js');
 assert.match(workbench,/PandoraGuideTooltip\?\.attach\(node,description,\{hoverDelay:1000\}\)/);
 assert.match(app,/PandoraGuideTooltip\?\.attach\(button,message,\{hoverDelay:1000\}\)/);
 assert.match(app,/button\.removeAttribute\('title'\)/);
});

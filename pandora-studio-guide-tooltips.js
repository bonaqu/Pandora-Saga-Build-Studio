(function(root){
'use strict';
// Read-only game-style tooltips; never evaluate server-provided text as HTML.
let popup=null,current=null,pending=null,removalObserver=null;
// D1/locale rerenders may attach to the same DOM node repeatedly.
const attached=new WeakMap();
// Keep other screen-reader descriptions when a transient tooltip opens/closes.
function linkDescription(node,id){
 if(!node||!id)return;
 const links=(node.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean);
 if(!links.includes(id))links.push(id);
 node.setAttribute('aria-describedby',links.join(' '));
}
function unlinkDescription(node,id){
 if(!node||!id)return;
 const raw=node.getAttribute('aria-describedby');
 if(raw===null)return;
 const links=raw.split(/\s+/).filter(value=>value&&value!==id);
 if(links.length)node.setAttribute('aria-describedby',links.join(' '));
 else node.removeAttribute('aria-describedby');
}
function ensure(){
 if(!popup){
  popup=document.createElement('div');
  popup.className='stage-hover-preview stage-guide-popup';
  popup.id='stage-guide-tooltip';
  popup.setAttribute('role','tooltip');
  popup.hidden=true;
  document.body.append(popup);
 }
 return popup;
}
function cancelPending(){
 if(pending){clearTimeout(pending.timer);pending=null}
}
function dismiss(){
 cancelPending();
 // Watch only while one tooltip is visible. Replacing its source DOM must
 // never leave an orphaned tooltip floating over the new chapter.
 removalObserver?.disconnect();
 removalObserver=null;
 if(popup)popup.hidden=true;
 if(current){
  unlinkDescription(current,popup?.id);
  current=null;
 }
}
function position(node){
 if(!popup)return;
 if(!node?.isConnected){dismiss();return}
 const box=popup.getBoundingClientRect(),rect=node.getBoundingClientRect();
 const pad=8,ww=window.innerWidth,wh=window.innerHeight;
 let x=Math.min(Math.max(pad,rect.left),Math.max(pad,ww-box.width-pad));
 let y=rect.bottom+7;
 if(y+box.height>wh-pad)y=rect.top-box.height-7;
 popup.style.left=x+'px';
 popup.style.top=Math.min(Math.max(pad,y),Math.max(pad,wh-box.height-pad))+'px';
}
// A scroll can cancel hover before its delay elapses. If the same element
// remains under the pointer, restart the delay after the last scroll event.
// Never show a tooltip after the pointer has left.
function scheduleHover(node,show,delay){
 cancelPending();
 const timer=setTimeout(()=>{
  if(pending?.node!==node)return;
  pending=null;
  if(node.isConnected&&node.matches(':hover'))show();
 },delay);
 pending={node,timer,show,delay};
}
function attach(node,text,{hoverDelay=0}={}){
 if(!node||typeof text!=='string')return node;
 let state=attached.get(node);
 if(!text.trim()){
  // Clearing an authored explanation must not leave a stale popup or timer.
  if(state){
   state.enabled=false;
   if(current===node||pending?.node===node)dismiss();
   delete node.dataset.guideHint;
   node.classList.remove?.('stage-guide-label');
   if(state.ownsTabindex)node.removeAttribute('tabindex');
  }
  return node;
 }
 const delay=Number.isFinite(hoverDelay)?Math.max(0,Math.min(3000,hoverDelay)):0;
 node.dataset.guideHint=text;
 node.classList.add('stage-guide-label');
 if(state){
  state.enabled=true;
  state.delay=delay;
  if(state.ownsTabindex&&node.getAttribute('tabindex')===null)
   node.setAttribute('tabindex','0');
  // Update current D1 copy and delayed hover without stacking listeners.
  if(current===node&&popup&&!popup.hidden){
   popup.textContent=text;
   position(node);
  }
  if(pending?.node===node)scheduleHover(node,state.show,delay);
  return node;
 }
 const ownsTabindex=node.getAttribute('tabindex')===null;
 if(ownsTabindex)node.setAttribute('tabindex','0');
 state={enabled:true,delay,ownsTabindex,touchAt:0,show:null};
 attached.set(node,state);
 const show=()=>{
  if(!state.enabled||!node.isConnected||
     node.closest('#ownerDock.owner-dock-collapsed .owner-dock-panel'))return;
  dismiss();ensure();
  current=node;popup.textContent=node.dataset.guideHint||'';popup.hidden=false;
  linkDescription(node,popup.id);
  position(node);
  if(typeof MutationObserver==='function'&&document.body){
   removalObserver=new MutationObserver(()=>{
    if(current===node&&!node.isConnected)dismiss();
   });
   removalObserver.observe(document.body,{childList:true,subtree:true});
  }
 };
 state.show=show;
 node.addEventListener('pointerenter',event=>{
  if(!state.enabled||event.pointerType==='touch')return;
  dismiss();
  if(!state.delay){show();return}
  scheduleHover(node,show,state.delay);
 });
 node.addEventListener('pointerleave',event=>{
  // Touch pointerleave follows finger-up. Keep the first tap readable.
  if(event?.pointerType==='touch')return;
  if(pending?.node===node||current===node)dismiss();
 });
 node.addEventListener('focus',()=>{
  if(state.enabled&&node.matches(':focus-visible'))show();
 });
 node.addEventListener('blur',()=>{
  if(pending?.node===node||current===node)dismiss();
 });
 node.addEventListener('pointerdown',event=>{
  if(!state.enabled)return;
  if(event.pointerType==='touch'){
   state.touchAt=Date.now();
   if(current===node)dismiss();else show();
  }else{
   state.touchAt=0;
   dismiss();
  }
 });
 node.addEventListener('click',()=>{
  const recentTouch=state.touchAt&&Date.now()-state.touchAt<1000;
  state.touchAt=0;
  // Preserve a newly tapped explanation on non-actionable labels only.
  if(recentTouch&&!node.closest('a,button,[role="button"],input,select,textarea'))
   return;
  dismiss();
 });
 return node;
}
if(typeof document!=='undefined'){
 // A click outside a tooltip's source and chapter navigation both invalidate
 // the currently displayed explanation, including keyboard-created ones.
 // A click elsewhere must cancel a scheduled tooltip too, not only an open one.
 document.addEventListener('pointerdown',event=>{
  if((current&&!current.contains(event.target))||
     (pending&&!pending.node.contains(event.target)))dismiss();
 },{capture:true});
 // Escape dismisses a hint, but a focused text editor owns its own key.
 // A hover tooltip may be pending while an owner editor is still active:
 // cancel the hint without preventing the editor from restoring its draft.
 document.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||(!current&&!pending))return;
  const editing=event.target?.closest?.(
   '[data-owner-text-field],.wiki-inline-input,[contenteditable="true"],[contenteditable="plaintext-only"]');
  dismiss();
  if(editing)return;
  event.preventDefault();
  event.stopImmediatePropagation();
 },{capture:true});
 window.addEventListener('hashchange',dismiss);
 window.addEventListener('popstate',dismiss);
 document.addEventListener('scroll',()=>{
  if(pending){
   const {node,show,delay}=pending;
   cancelPending();
   if(node.isConnected&&node.matches(':hover'))scheduleHover(node,show,delay);
  }
  if(current)position(current);
 },{capture:true,passive:true});
 window.addEventListener('resize',()=>{
  if(pending)cancelPending();
  if(current)position(current);
 });
 window.addEventListener('blur',dismiss);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)dismiss()});
}
root.PandoraGuideTooltip=Object.freeze({attach,dismiss,linkDescription,unlinkDescription});
})(typeof window==='undefined'?globalThis:window);

(function(root){
'use strict';
// Read-only game-style tooltips; never evaluate server-provided text as HTML.
let popup=null,current=null,pending=null,removalObserver=null;
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
  // The host can have its own screen-reader descriptions. Remove only the
  // transient tooltip ID; never erase unrelated accessibility links.
  const links=(current.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean)
   .filter(id=>id!==popup?.id);
  if(links.length)current.setAttribute('aria-describedby',links.join(' '));
  else current.removeAttribute('aria-describedby');
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
 if(!node||typeof text!=='string'||!text.trim())return node;
 // Keep existing keyboard-focus behavior prompt; delay only cursor hover.
 const delay=Number.isFinite(hoverDelay)?Math.max(0,Math.min(3000,hoverDelay)):0;
 node.setAttribute('tabindex',node.getAttribute('tabindex')||'0');
 node.classList.add('stage-guide-label');
 node.dataset.guideHint=text;
 const show=()=>{
  if(!node.isConnected||node.closest('#ownerDock.owner-dock-collapsed .owner-dock-panel'))return;
  dismiss();ensure();
  current=node;popup.textContent=text;popup.hidden=false;
  const links=(node.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean);
  if(!links.includes(popup.id))links.push(popup.id);
  node.setAttribute('aria-describedby',links.join(' '));
  position(node);
  if(typeof MutationObserver==='function'&&document.body){
   removalObserver=new MutationObserver(()=>{
    if(current===node&&!node.isConnected)dismiss();
   });
   removalObserver.observe(document.body,{childList:true,subtree:true});
  }
 };
 node.addEventListener('pointerenter',event=>{
  if(event.pointerType==='touch')return;
  dismiss();
  if(!delay){show();return}
  scheduleHover(node,show,delay);
 });
 node.addEventListener('pointerleave',()=>{
  if(pending?.node===node||current===node)dismiss();
 });
 node.addEventListener('focus',()=>{
  // Pointer focus should not bypass the hover delay. Keyboard focus should
  // remain immediate for accessibility.
  if(node.matches(':focus-visible'))show();
 });
 node.addEventListener('blur',()=>{
  if(pending?.node===node||current===node)dismiss();
 });
 node.addEventListener('pointerdown',event=>{
  if(event.pointerType==='touch'){
   if(current===node)dismiss();else show();
  }else dismiss();
 });
 node.addEventListener('click',dismiss);
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
 // Dismiss the guide hint before the host workbench interprets Escape as
 // navigation/close, including when pointer hover has not yet opened it.
 document.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||(!current&&!pending))return;
  dismiss();
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
root.PandoraGuideTooltip=Object.freeze({attach,dismiss});
})(typeof window==='undefined'?globalThis:window);

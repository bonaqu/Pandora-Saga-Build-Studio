(function(root){
'use strict';
// Read-only game-style tooltips; never evaluate server-provided text as HTML.
let popup=null,current=null,pending=null;
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
 if(popup)popup.hidden=true;
 if(current){current.removeAttribute('aria-describedby');current=null}
}
function position(node){
 if(!popup||!node?.isConnected)return;
 const box=popup.getBoundingClientRect(),rect=node.getBoundingClientRect();
 const pad=8,ww=window.innerWidth,wh=window.innerHeight;
 let x=Math.min(Math.max(pad,rect.left),Math.max(pad,ww-box.width-pad));
 let y=rect.bottom+7;
 if(y+box.height>wh-pad)y=rect.top-box.height-7;
 popup.style.left=x+'px';
 popup.style.top=Math.min(Math.max(pad,y),Math.max(pad,wh-box.height-pad))+'px';
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
  node.setAttribute('aria-describedby',popup.id);
  position(node);
 };
 node.addEventListener('pointerenter',event=>{
  if(event.pointerType==='touch')return;
  dismiss();
  if(!delay){show();return}
  const timer=setTimeout(()=>{
   if(pending?.node!==node)return;
   pending=null;show();
  },delay);
  pending={node,timer};
 });
 node.addEventListener('pointerleave',()=>{
  if(pending?.node===node||current===node)dismiss();
 });
 node.addEventListener('focus',show);
 node.addEventListener('blur',()=>{
  if(pending?.node===node||current===node)dismiss();
 });
 node.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&(pending?.node===node||current===node)){
   dismiss();event.stopPropagation();
  }
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
 document.addEventListener('scroll',()=>{
  if(pending)cancelPending();
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

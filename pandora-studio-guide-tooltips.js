(function(root){
'use strict';
// Reuse the project's existing .stage-hover-preview game-style overlay.
// Do not generate native browser title bubbles or embed HTML from D1.
let popup=null,current=null;
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
function dismiss(){
 if(popup)popup.hidden=true;
 if(current){current.removeAttribute('aria-describedby');current=null}
}
function position(node){
 const box=popup.getBoundingClientRect(),rect=node.getBoundingClientRect();
 const pad=8,ww=window.innerWidth,wh=window.innerHeight;
 let x=Math.min(Math.max(pad,rect.left),Math.max(pad,ww-box.width-pad));
 let y=rect.bottom+7;
 if(y+box.height>wh-pad)y=rect.top-box.height-7;
 popup.style.left=x+'px';
 popup.style.top=Math.min(Math.max(pad,y),Math.max(pad,wh-box.height-pad))+'px';
}
function attach(node,text){
 if(!node||typeof text!=='string'||!text.trim())return node;
 node.setAttribute('tabindex','0');
 node.classList.add('stage-guide-label');
 node.dataset.guideHint=text;
 const show=()=>{
  if(!node.isConnected)return;
  dismiss();ensure();
  current=node;popup.textContent=text;popup.hidden=false;
  node.setAttribute('aria-describedby',popup.id);
  position(node);
 };
 node.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')show()});
 node.addEventListener('pointerleave',()=>{if(current===node)dismiss()});
 node.addEventListener('focus',show);
 node.addEventListener('blur',()=>{if(current===node)dismiss()});
 node.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&current===node){dismiss();event.stopPropagation()}
 });
 node.addEventListener('pointerdown',event=>{
  if(event.pointerType!=='touch')return;
  if(current===node)dismiss();else show();
 });
 return node;
}
if(typeof document!=='undefined'){
 document.addEventListener('scroll',()=>{if(current)position(current)},{capture:true,passive:true});
 window.addEventListener('resize',()=>{if(current)position(current)});
}
root.PandoraGuideTooltip=Object.freeze({attach,dismiss});
})(typeof window==='undefined'?globalThis:window);

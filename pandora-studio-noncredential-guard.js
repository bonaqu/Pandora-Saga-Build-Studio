/* One opt-in Yandex input gate for non-credential search and numeric fields.
   Passwords and usernames are never routed here. Browser-owned autofill
   overlays are outside page control; this blocks their idle input events. */
(function(root){
'use strict';
const installed=new WeakSet();
const accepted=new Set([
 'insertText','insertCompositionText','insertFromPaste','insertFromDrop',
 'insertFromDictation','deleteContentBackward','deleteContentForward',
 'deleteByCut','historyUndo','historyRedo'
]);
const yandex=()=>String(root.navigator?.userAgent||'').includes('YaBrowser/');
function protect(input){
 if(!input||!['search','number'].includes(String(input.type||'').toLowerCase())||
  installed.has(input)||!yandex())return input;
 installed.add(input);
 let lastValue=input.value,editing=false;
 input.readOnly=true;
 // A browser extension can write input.value directly without an InputEvent.
 // Reconcile it before focus, legitimate gestures, or a stray change/input.
 const restore=()=>{
  if(!editing&&input.value!==lastValue)input.value=lastValue;
 };
 const unlock=event=>{
  if(!event?.isTrusted)return;
  restore();
  if(!input.disabled){editing=true;input.readOnly=false}
 };
 input.addEventListener('pointerdown',unlock,{capture:true});
 input.addEventListener('touchstart',unlock,{capture:true,passive:true});
 input.addEventListener('keydown',unlock,{capture:true});
 input.addEventListener('beforeinput',event=>{
  if(event.isTrusted&&input.ownerDocument?.activeElement===input&&
   accepted.has(event.inputType))unlock(event);
 },{capture:true});
 input.addEventListener('focus',restore);
 // Capture before the Origin/Hero Book listeners can persist an unexpected
 // value as character state. A trusted user gesture already unlocked editing.
 const onChange=event=>{
  if(!editing){
   restore();
   event.stopImmediatePropagation?.();
  }else lastValue=input.value;
 };
 input.addEventListener('input',onChange,{capture:true});
 input.addEventListener('change',onChange,{capture:true});
 input.addEventListener('blur',()=>{
  if(editing)lastValue=input.value;
  else restore();
  editing=false;input.readOnly=true;
 });
 return input;
}
root.PandoraNonCredentialGuard=Object.freeze({protect});
})(typeof window==='undefined'?globalThis:window);

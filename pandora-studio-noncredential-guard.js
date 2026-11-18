/* One opt-in Yandex input gate for non-credential search and numeric fields.
   Passwords and usernames are never routed here. Browser-owned autofill
   overlays are outside page control; this blocks their idle input events. */
(function(root){
'use strict';
const states=new WeakMap();
const accepted=new Set([
 'insertText','insertCompositionText','insertFromPaste','insertFromDrop',
 'insertFromDictation','deleteContentBackward','deleteContentForward',
 'deleteByCut','historyUndo','historyRedo'
]);
const yandex=()=>String(root.navigator?.userAgent||'').includes('YaBrowser/');
function protect(input){
 if(!input||!['search','number'].includes(String(input.type||'').toLowerCase())||
  states.has(input)||!yandex())return input;
 const state={lastValue:input.value,editing:false,programmatic:false};
 states.set(input,state);
 input.readOnly=true;
 // A browser extension can write input.value directly without an InputEvent.
 // Reconcile it before focus, legitimate gestures, or a stray change/input.
 const restore=()=>{
  if(!state.editing&&input.value!==state.lastValue)
   input.value=state.lastValue;
 };
 const unlock=event=>{
  if(!event?.isTrusted)return;
  restore();
  if(!input.disabled){state.editing=true;input.readOnly=false}
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
  if(!state.editing&&!state.programmatic){
   restore();
   event.stopImmediatePropagation?.();
  }else state.lastValue=input.value;
 };
 input.addEventListener('input',onChange,{capture:true});
 input.addEventListener('change',onChange,{capture:true});
 input.addEventListener('blur',()=>{
  if(state.editing)state.lastValue=input.value;
  else restore();
  state.editing=false;input.readOnly=true;
 });
 return input;
}
// Explicit application-owned updates to existing controls are safe even
// while unfocused. Never invoke from a browser autofill/input handler.
function sync(input){
 const state=states.get(input);
 if(state)state.lastValue=input.value;
 return input;
}
// Only internal encyclopedia benchmarks intentionally dispatch synthetic
// search events; third-party input events remain blocked while idle.
function emitInput(input,value){
 input.value=String(value??'');
 const state=states.get(input);
 if(state){state.lastValue=input.value;state.programmatic=true}
 try{input.dispatchEvent(new Event('input',{bubbles:true}))}
 finally{if(state)state.programmatic=false}
 return input;
}
root.PandoraNonCredentialGuard=Object.freeze({protect,sync,emitInput});
})(typeof window==='undefined'?globalThis:window);

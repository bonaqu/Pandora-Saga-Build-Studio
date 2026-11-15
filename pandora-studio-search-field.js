(function(root){
'use strict';
// One non-credential search policy for Hero Book, Encyclopedia, Build library,
// equipment, Honor and owner review. None of these fields are login inputs.
// Browser/password-manager extensions can override website hints; this is a
// defensive guard, not a claim of control over browser-owned suggestions.
const installed=new WeakMap();
let nextId=0,observer=null;

function isSearch(node){
 return Boolean(node&&String(node.tagName||'').toUpperCase()==='INPUT'&&
  String(node.type||node.getAttribute?.('type')||'').toLowerCase()==='search');
}
function yandex(){
 return String(root.navigator?.userAgent||'').includes('YaBrowser/');
}
function prepare(input){
 if(!isSearch(input)||installed.has(input))return input;
 // "none" is non-standard but recognized by Yandex Browser. "off" is not
 // reliable for this browser. Other supported password-manager exclusions
 // are advisory and cannot interfere with actual login forms.
 for(const [key,value] of Object.entries({
  autocomplete:'none',autocorrect:'off',autocapitalize:'off',
  spellcheck:'false','aria-autocomplete':'none',
  'data-lpignore':'true','data-1p-ignore':'true',
  'data-bwignore':'true','data-form-type':'other',
  'data-ps-noncredential-search':'true'
 }))input.setAttribute(key,value);
 // Do not reuse a username-like field name for unnamed filter inputs.
 // Preserve explicit search names because existing selectors may use them.
 if(!input.getAttribute('name')){
  const id=String(input.id||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,50);
  input.setAttribute('name','ps-filter-'+(id||String(++nextId)));
 }
 const state={lastValue:input.value,editing:!yandex()};
 installed.set(input,state);
 if(yandex()){
  // Leave idle searches readonly. An actual pointer/keyboard gesture unlocks
  // editing before the default browser action; losing focus locks again.
  // Do not make text fields in account login readonly.
  input.readOnly=true;
  const restoreUnexpected=()=>{
   if(!state.editing&&input.value!==state.lastValue)
    input.value=state.lastValue;
  };
  const unlock=()=>{
   restoreUnexpected();
   if(!input.disabled){state.editing=true;input.readOnly=false}
  };
  input.addEventListener('pointerdown',unlock,{capture:true});
  input.addEventListener('touchstart',unlock,{capture:true,passive:true});
  input.addEventListener('keydown',unlock,{capture:true});
  // IME/dictation may emit beforeinput without keydown. Do not interpret a
  // credential-manager replacement as user-typed search content.
  input.addEventListener('beforeinput',event=>{
   if(event.isTrusted&&document.activeElement===input&&
    ['insertText','insertCompositionText','deleteContentBackward',
     'deleteContentForward'].includes(event.inputType))unlock();
  },{capture:true});
  input.addEventListener('focus',restoreUnexpected);
  input.addEventListener('input',event=>{
   if(!state.editing){
    restoreUnexpected();
    event.stopImmediatePropagation();
   }else state.lastValue=input.value;
  },{capture:true});
  input.addEventListener('blur',()=>{
   if(state.editing)state.lastValue=input.value;
   else restoreUnexpected();
   state.editing=false;input.readOnly=true;
  });
 }
 return input;
}
function prepareAll(scope){
 if(!scope)return 0;
 let count=0;
 if(isSearch(scope)){prepare(scope);count++}
 if(typeof scope.querySelectorAll==='function')
  for(const item of scope.querySelectorAll('input[type="search"]')){
   prepare(item);count++;
  }
 return count;
}
function observe(){
 if(typeof document==='undefined')return;
 prepareAll(document);
 if(observer||typeof MutationObserver!=='function')return;
 observer=new MutationObserver(changes=>{
  for(const change of changes){
   if(change.type==='attributes'){
    prepare(change.target);
   }else for(const node of change.addedNodes)prepareAll(node);
  }
 });
 observer.observe(document.documentElement||document,{
  subtree:true,childList:true,attributes:true,attributeFilter:['type']
 });
}
if(typeof document!=='undefined'){
 observe();
 if(document.readyState==='loading')
  document.addEventListener('DOMContentLoaded',observe,{once:true});
}
root.PandoraSearchField=Object.freeze({prepare,prepareAll});
})(typeof window==='undefined'?globalThis:window);

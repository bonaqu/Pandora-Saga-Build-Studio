(function(root){
'use strict';
// One non-credential search policy for Hero Book, Encyclopedia, Build library,
// equipment, Honor and owner review. None of these fields are login inputs.
// Browser/password-manager extensions can override website hints; this is a
// defensive guard, not a claim of control over browser-owned suggestions.
// Match game names without altering their original catalog identity.
const normalize=value=>String(value??'').normalize('NFKC')
 .toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
// Compile once per filter refresh, not for every skill, Soul or location.
function compile(query){
 const words=normalize(query).split(' ').filter(Boolean);
 if(!words.length)return ()=>true;
 return text=>{
  const candidate=normalize(text);
  return words.every(word=>candidate.includes(word));
 };
}
const matches=(text,query)=>compile(query)(text);
const installed=new WeakSet();
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
 installed.add(input);
 // All non-credential browser guards use the same trusted-interaction logic.
 // A missing shared script must not make an idle Yandex field writable.
 if(root.PandoraNonCredentialGuard?.protect)
  root.PandoraNonCredentialGuard.protect(input);
 else if(yandex())input.readOnly=true;
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
root.PandoraSearchField=Object.freeze({prepare,prepareAll,normalize,compile,matches});
})(typeof window==='undefined'?globalThis:window);

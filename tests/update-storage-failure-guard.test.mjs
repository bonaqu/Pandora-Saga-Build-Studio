import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
function extract(start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a);
 assert.ok(a>=0&&b>a,'Missing production function '+start);
 return source.slice(a,b);
}
const saveDraft=extract('function persist(){','\nfunction persistBuilds(){');
const saveBuilds=extract('function persistBuilds(){','\nconst CLOUD_TOKEN_KEY');
const saveBeforeUpdate=extract('function saveBeforeUpdate(event){','\n// Restore deep links');

function attempt({failure=null,lang='ru'}={}){
 const writes=[],toasts=[],listeners={},draftWarnings=[];
 const window={PandoraBuildScope:{
  getOwned:()=> '[]',
  setOwned(_storage,_scope,key){
  writes.push(key);
  if(key===failure)throw Error('Quota exceeded');
  return true;
 }}};
 const document={addEventListener(name,handler){listeners[name]=handler}};
 const showStudioToast=(message,kind)=>toasts.push({message,kind});
 // Execute actual production functions, but with isolated storage and event
 // dependencies. This verifies both failure paths without a production D1 write.
 Function('window','localStorage','libraryScopeId','state','builds',
  'console','document','showStudioToast','lang','draftStorageStatus','safeStoredBuildRows',
  saveDraft+'\n'+saveBuilds+'\n'+saveBeforeUpdate
 ) (window,{},()=> 'account:alice_01',{race:1,level:1},[],
  {warn(){}},document,showStudioToast,lang,
  failed=>draftWarnings.push(failed),rows=>rows);
 let cancelled=false;
 assert.equal(typeof listeners['pandora:before-update'],'function');
 listeners['pandora:before-update']({preventDefault(){cancelled=true}});
 return {writes,toasts,cancelled,draftWarnings};
}

test('failure saving the active draft vetoes upgrade and displays RU warning',()=>{
 const result=attempt({failure:'ps-build-studio.v1'});
 assert.deepEqual(result.writes,['ps-build-studio.v1','ps-build-library.v1']);
 assert.equal(result.cancelled,true);
 assert.deepEqual(result.draftWarnings,[true]);
 assert.equal(result.toasts.length,1);
 assert.equal(result.toasts[0].kind,'error');
 assert.match(result.toasts[0].message,/Обновление отменено/);
});
test('failure saving conflict copies vetoes upgrade and displays EN warning',()=>{
 const result=attempt({failure:'ps-build-library.v1',lang:'en'});
 assert.deepEqual(result.writes,['ps-build-studio.v1','ps-build-library.v1']);
 assert.equal(result.cancelled,true);
 assert.deepEqual(result.draftWarnings,[false]);
 assert.match(result.toasts[0].message,/Update cancelled/);
});
test('successful draft and library writes permit update',()=>{
 const result=attempt();
 assert.equal(result.cancelled,false);
 assert.equal(result.toasts.length,0);
 assert.deepEqual(result.draftWarnings,[false]);
 assert.deepEqual(result.writes,['ps-build-studio.v1','ps-build-library.v1']);
});


// Execute the actual update manager against a minimal DOM/event model. The
// regression covers click-time behavior, not only a source-code regex.
function simulateUpdateManager(){
 const {runInNewContext}=requireUpdateVM();
 const code=readFileSync(new URL('../pandora-studio-update-manager.js',import.meta.url),'utf8');
 const timers=[],intervals=[],replacements=[],requests=[],cleared=[];
 const state={gate:false,owner:false,inline:false};
 let saveCalls=0,fetcher=async()=>({ok:true,json:async()=>({release:'2026.11.18.885'})});
 const node=tag=>({
  tag,children:[],textContent:'',style:{},
  listeners:{},
  setAttribute(){},addEventListener(type,fn){this.listeners[type]=fn},
  append(...children){this.children.push(...children)},
  remove(){this.removed=true}
 });
 const bannerRoot=node('body');
 bannerRoot.classList={contains:name=>name==='studio-live-blocked'&&state.gate};
 bannerRoot.appendChild=child=>bannerRoot.children.push(child);
 const title=node('span');
 const doc={
  body:bannerRoot,visibilityState:'visible',
  documentElement:{lang:'ru'},
  activeElement:null,
  getElementById:id=>id==='siteVersion'?title:
   id==='studio-update-banner'?
    bannerRoot.children.find(v=>v.id==='studio-update-banner'&&!v.removed)||null:null,
  querySelector:selector=>{
   if(selector==='meta[name="ps-studio-release"]')return {content:'2026.11.18.884'};
   if(selector.startsWith('#startupOverlay'))return state.gate?{}:null;
   if(selector.includes('.inline-owner-editor'))return state.inline?{}:null;
   return null;
  },
  createElement:node,
  addEventListener(){},
  dispatchEvent(event){if(event.type==='pandora:before-update')saveCalls++;return true}
 };
 const view={
  location:{href:'https://example.test/Pandora-Saga-Build-Studio/',
   replace(url){replacements.push(url)}},
  history:{replaceState(){}},
  window:{PandoraAccountUI:{updateGuard:()=>null},
   PandoraStudioAdminActive:()=>state.owner},
  document:doc,URL,AbortController,
  Event:class{constructor(type,opts={}){this.type=type;this.cancelable=opts.cancelable}},
  setTimeout(fn,ms){const id={fn,ms};timers.push(id);return id},
  clearTimeout(id){cleared.push(id)},
  setInterval(fn,ms){intervals.push({fn,ms})},
  fetch(...args){requests.push(args);return fetcher(...args)}
 };
 runInNewContext(code,view);
 const poll=timers.find(v=>v.ms===3000)?.fn;
 assert.equal(typeof poll,'function');
 const banner=()=>doc.getElementById('studio-update-banner');
 const click=()=>banner().children[1].listeners.click();
 const pointer=()=>{
  let cancelled=false;
  banner().children[1].listeners.pointerdown({
   preventDefault(){cancelled=true}
  });
  return cancelled;
 };
 return {state,poll,banner,click,pointer,requests,replacements,cleared,
  title,setFetcher(fn){fetcher=fn},get saveCalls(){return saveCalls}};
}
function requireUpdateVM(){
 // Keep this model scoped to the already-existing storage/update test module.
 return {runInNewContext};
}

test('manual update cannot reload during D1 recovery, owner edits or active panels',async()=>{
 const h=simulateUpdateManager();
 await h.poll();
 assert.ok(h.banner(),'a newer release should be offered');
 assert.match(h.title.textContent,/0\.884\.0/);
 h.state.gate=true;
 assert.equal(h.pointer(),true,'Do not blur a focused input behind the D1 overlay');
 h.click();
 assert.equal(h.replacements.length,0);
 assert.equal(h.saveCalls,0);
 assert.match(h.banner().children[0].textContent,/восстанови игровые данные/i);
 h.state.gate=false;
 h.state.owner=true;
 assert.equal(h.pointer(),true);
 h.click();
 assert.equal(h.replacements.length,0);
 assert.match(h.banner().children[0].textContent,/выйди из режима владельца/i);
 h.state.owner=false;
 h.state.inline=true;
 assert.equal(h.pointer(),true);
 h.click();
 assert.equal(h.replacements.length,0);
 assert.match(h.banner().children[0].textContent,/закрой открытые окна/i);
 h.state.inline=false;
 assert.equal(h.pointer(),false);
 h.click();
 assert.equal(h.saveCalls,1,'exactly one before-update save contract');
 assert.equal(h.replacements.length,1,'safe manual update navigates once');
 assert.match(h.replacements[0],/ps-revision=2026\.11\.18\.885/);
});

test('version polling coalesces concurrent checks through JSON body completion',async()=>{
 const h=simulateUpdateManager();
 let finishBody;
 h.setFetcher(async()=>({ok:true,json:()=>new Promise(resolve=>{finishBody=resolve})}));
 const first=h.poll();
 await Promise.resolve();
 await Promise.resolve();
 assert.equal(typeof finishBody,'function');
 await h.poll(); // visibility/interval cannot spawn a second fetch
 assert.equal(h.requests.length,1);
 assert.equal(h.banner(),null,'incomplete manifest must not create an update');
 assert.equal(h.cleared.filter(v=>v.ms===6000).length,0,
  'timeout stays active while the response body is still being read');
 finishBody({release:'2026.11.18.885'});
 await first;
 assert.equal(h.requests.length,1);
 assert.equal(h.cleared.filter(v=>v.ms===6000).length,1);
 assert.ok(h.banner());
 await h.poll();
 assert.equal(h.requests.length,2,'future checks resume after completion');
});

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

test('hidden tabs skip version traffic and abort late manifest banners',async()=>{
 const listeners={},intervals=[],timeouts=[];
 let requests=0,nextFetch=null;
 const release='2026.11.19.918';
 const label={textContent:''};
 const document={
  visibilityState:'hidden',
  documentElement:{lang:'ru'},
  body:{classList:{contains:()=>false}},
  querySelector:selector=>selector==='meta[name="ps-studio-release"' + ']'?{content:release}:null,
  getElementById:id=>id==='siteVersion'?label:null,
  addEventListener:(name,callback)=>{listeners[name]=callback}
 };
 const runtime={
  document,window:{},URL,AbortController,
  location:{href:'https://example.test/Pandora-Saga-Build-Studio/',replace(){}},
  history:{state:null,replaceState(){}},
  setInterval:callback=>{intervals.push(callback);return intervals.length},
  setTimeout:(callback,ms)=>{timeouts.push({callback,ms});return timeouts.length},
  clearTimeout(){},
  fetch:async(_url,{signal})=>{
   requests++;
   if(nextFetch)return nextFetch(signal);
   return {ok:true,json:async()=>({release})};
  }
 };
 runInNewContext(readFileSync(new URL('../pandora-studio-update-manager.js',import.meta.url),'utf8'),runtime);
 assert.match(label.textContent,/0\\.918\\.0/);
 timeouts.find(t=>t.ms===3000).callback();
 await Promise.resolve();
 assert.equal(requests,0,'Initial version check does not run in a hidden tab');
 intervals.forEach(callback=>callback());
 await Promise.resolve();
 assert.equal(requests,0,'Periodic version checks do not run in a hidden tab');
 document.visibilityState='visible';
 listeners.visibilitychange();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(requests,1,'Returning to the tab performs one visible check');

 // Even if a fetch adapter ignores AbortSignal, a hidden tab must not
 // display a late new-version banner or replace the active character.
 let releaseResponse;
 const delayed=new Promise(resolve=>{releaseResponse=resolve});
 nextFetch=async()=>delayed;
 intervals.at(-1)();
 await Promise.resolve();
 assert.equal(requests,2);
 document.visibilityState='hidden';
 listeners.visibilitychange();
 releaseResponse({ok:true,json:async()=>({release:'2026.11.19.920'})});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(document.getElementById('studio-update-banner'),null);
 assert.equal(requests,2);
});

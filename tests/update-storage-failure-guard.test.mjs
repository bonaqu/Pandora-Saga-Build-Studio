import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

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
 const writes=[],toasts=[],listeners={};
 const window={PandoraBuildScope:{setOwned(_storage,_scope,key){
  writes.push(key);
  if(key===failure)throw Error('Quota exceeded');
  return true;
 }}};
 const document={addEventListener(name,handler){listeners[name]=handler}};
 const showStudioToast=(message,kind)=>toasts.push({message,kind});
 // Execute actual production functions, but with isolated storage and event
 // dependencies. This verifies both failure paths without a production D1 write.
 Function('window','localStorage','libraryScopeId','state','builds',
  'console','document','showStudioToast','lang',
  saveDraft+'\n'+saveBuilds+'\n'+saveBeforeUpdate
 ) (window,{},()=> 'account:alice_01',{race:1,level:1},[],
  {warn(){}},document,showStudioToast,lang);
 let cancelled=false;
 assert.equal(typeof listeners['pandora:before-update'],'function');
 listeners['pandora:before-update']({preventDefault(){cancelled=true}});
 return {writes,toasts,cancelled};
}

test('failure saving the active draft vetoes upgrade and displays RU warning',()=>{
 const result=attempt({failure:'ps-build-studio.v1'});
 assert.deepEqual(result.writes,['ps-build-studio.v1','ps-build-library.v1']);
 assert.equal(result.cancelled,true);
 assert.equal(result.toasts.length,1);
 assert.equal(result.toasts[0].kind,'error');
 assert.match(result.toasts[0].message,/Обновление отменено/);
});
test('failure saving conflict copies vetoes upgrade and displays EN warning',()=>{
 const result=attempt({failure:'ps-build-library.v1',lang:'en'});
 assert.deepEqual(result.writes,['ps-build-studio.v1','ps-build-library.v1']);
 assert.equal(result.cancelled,true);
 assert.match(result.toasts[0].message,/Update cancelled/);
});
test('successful draft and library writes permit update',()=>{
 const result=attempt();
 assert.equal(result.cancelled,false);
 assert.equal(result.toasts.length,0);
 assert.deepEqual(result.writes,['ps-build-studio.v1','ps-build-library.v1']);
});

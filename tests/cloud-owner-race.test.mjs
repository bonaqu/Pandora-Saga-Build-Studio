import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
function extract(start,end){
 const a=app.indexOf(start),b=app.indexOf(end,a);
 assert.ok(a>0&&b>a,'Function boundary missing: '+start);
 return app.slice(a,b);
}
const deletion=extract('async function deleteCloudBuild(id){','async function loadCloudBuilds(){');
const put=extract('async function putCloudBuild(entry){','async function deleteCloudBuild(id){');
const connecting=extract('async function connectCloudLibrary(secret,feedback){','function buildLibraryTransfer(){');
function deferred(){
 let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j});
 return {promise,resolve,reject};
}
function deletionCase(pending){
 let owner='account:alice_01',acknowledged=[],messages=[],toasts=[],queue=[];
 const deleteCloudBuild=Function('libraryScopeId','queueDelete','acknowledgeDelete',
  'cloudLibraryRequest','reportCloudStatus','showStudioToast','console',
  'let libraryChangeId=0;'+deletion+'return deleteCloudBuild')(
   ()=>owner,id=>queue.push(id),id=>acknowledged.push(id),
   ()=>pending.promise,message=>messages.push(message),
   (...args)=>toasts.push(args),{warn:()=>{}}
 );
 return {deleteCloudBuild,switchOwner:value=>{owner=value},acknowledged,messages,toasts,queue};
}
test('late delete acknowledgement never clears the other owner pending-delete queue',async()=>{
 const pending=deferred(),scenario=deletionCase(pending);
 const process=scenario.deleteCloudBuild('a'.repeat(32));
 scenario.switchOwner('account:bob_222');
 pending.resolve({ok:true});
 await process;
 assert.equal(scenario.queue.length,1);
 assert.deepEqual(scenario.acknowledged,[]);
 assert.deepEqual(scenario.messages,[]);
 assert.deepEqual(scenario.toasts,[]);
});
test('same owner still acknowledges successful deletion and revokes shares',async()=>{
 const pending=deferred(),scenario=deletionCase(pending);
 const process=scenario.deleteCloudBuild('a'.repeat(32));
 pending.resolve({ok:true});
 await process;
 assert.deepEqual(scenario.acknowledged,['a'.repeat(32)]);
 assert.ok(scenario.messages.some(x=>x.includes('ссылки отозваны')));
 assert.equal(scenario.toasts.length,1);
});
test('late cloud PUT status cannot claim another player saved its build',async()=>{
 let owner='account:alice_01',status=[];
 const pending=deferred();
 const send=Function('libraryScopeId','cloudLibraryRequest','reportCloudStatus','console',
  put+'return putCloudBuild')(()=>owner,()=>pending.promise,
   x=>status.push(x),{warn:()=>{}});
 const operation=send({id:'a'.repeat(32)});
 owner='account:bob_222';pending.resolve({ok:true});
 assert.equal(await operation,true);assert.deepEqual(status,[]);
 const second=deferred();
 const send2=Function('libraryScopeId','cloudLibraryRequest','reportCloudStatus','console',
  put+'return putCloudBuild')(()=>owner,()=>second.promise,
   x=>status.push(x),{warn:()=>{}});
 const op=send2({id:'b'.repeat(32)});
 second.resolve({ok:true});assert.equal(await op,true);
 assert.deepEqual(status,['Сохранено в облаке']);
});
test('old guest-key transfer response does not overwrite a newly logged-in account library',()=>{
 assert.match(connecting,/const previousOwner=libraryScopeId\(\)/);
 assert.match(connecting,/if\(libraryScopeId\(\)!==previousOwner\|\|window\.PandoraAccountUI\?\.isLoggedIn\(\)\)/);
 assert.match(extract('async function loadCloudBuilds(){','function h(tag,attrs={}'),
  /if\(libraryChangeId===generation\)/);
});

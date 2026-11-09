import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const start=app.indexOf('async function putCloudBuild(entry){');
const end=app.indexOf('\nasync function loadCloudBuilds(){',start);
assert.ok(start>=0&&end>start,'Cloud status functions must be present in the application');
const implementations=app.slice(start,end);
function fixture(){
 const pending=[],statuses=[],toasts=[],acknowledged=[];
 let owner='account:alice_01';
 const request=payload=>new Promise((resolve,reject)=>pending.push({payload,resolve,reject}));
 const execute=Function('cloudLibraryRequest','libraryScopeId','reportCloudStatus',
  'showStudioToast','queueDelete','acknowledgeDelete','console',
  'let libraryChangeId=0;const window={PandoraAccountUI:{isLoggedIn:()=>true}};\n'+implementations+
  '\nreturn {putCloudBuild,deleteCloudBuild,bump:()=>++libraryChangeId};');
 const api=execute(request,()=>owner,message=>statuses.push(message),
  (...args)=>toasts.push(args),()=>{},id=>acknowledged.push(id),{warn(){}});
 return {...api,pending,statuses,toasts,acknowledged,switchOwner:id=>{owner=id}};
}

test('older PUT success cannot conceal a newer failed cloud save',async()=>{
 const h=fixture();
 const old=h.putCloudBuild({id:'old'});
 h.bump(); // user saved a newer version while old request is pending
 const newer=h.putCloudBuild({id:'new'});
 assert.equal(h.pending.length,2);
 h.pending[1].reject(new Error('Temporary cloud outage'));
 assert.equal(await newer,false);
 h.pending[0].resolve({ok:true});
 assert.equal(await old,true);
 assert.deepEqual(h.statuses,['Сохранено только в этом браузере · облако недоступно. Обнови библиотеку после восстановления соединения.']);
});

test('older PUT failure cannot hide the newer confirmed cloud save',async()=>{
 const h=fixture();
 const old=h.putCloudBuild({id:'old'});
 h.bump();
 const newer=h.putCloudBuild({id:'new'});
 h.pending[1].resolve({ok:true});
 assert.equal(await newer,true);
 h.pending[0].reject(new Error('Late old failure'));
 assert.equal(await old,false);
 assert.deepEqual(h.statuses,['Сохранено в облаке']);
});

test('late deletion confirmation still clears tombstone but does not mask a newer failed save',async()=>{
 const h=fixture();
 const deleting=h.deleteCloudBuild('old-id');
 assert.equal(h.pending.length,1);
 h.bump(); // another user mutation owns the current visible status
 const newer=h.putCloudBuild({id:'new'});
 h.pending[1].reject(new Error('Temporary cloud outage'));
 await newer;
 h.pending[0].resolve({ok:true});
 await deleting;
 assert.deepEqual(h.acknowledged,['old-id'],'successful deletion still clears the queue');
 assert.deepEqual(h.statuses,['Сохранено только в этом браузере · облако недоступно. Обнови библиотеку после восстановления соединения.']);
 assert.deepEqual(h.toasts,[],'stale deletion must not display a misleading success toast');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const start=app.indexOf('async function uploadSharedBuildBatch(');
const end=app.indexOf('\nasync function deleteCloudBuild(',start);
assert.ok(start>=0&&end>start);
const code=app.slice(start,end);
function fixture({put,initialOwner='account:alice_01'}){
 let owner=initialOwner;const status=[];
 const fn=Function('putCloudBuild','libraryScopeId','reportCloudStatus','lang','libraryChangeId',
  code+'\nreturn uploadSharedBuildBatch')(
  put,()=>owner,message=>status.push(message),'ru',3);
 return {fn,status,setOwner:value=>{owner=value}};
}
test('partial shared import never claims all cloud saves succeeded',async()=>{
 const calls=[],f=fixture({put:async entry=>{calls.push(entry.id);return entry.id==='b'}});
 await f.fn([{id:'a'},{id:'b'}],'account:alice_01',3);
 assert.deepEqual(calls,['a','b']);
 assert.deepEqual(f.status,[
  'Сохранено в облаке: 1 из 2. Остальные пока только в браузере. Обнови библиотеку для повторной попытки.'
 ]);
});
test('complete shared import only reports cloud success after every PUT',async()=>{
 let calls=0;const f=fixture({put:async()=>{calls++;return true}});
 await f.fn([{id:'a'},{id:'b'}],'account:alice_01',3);
 assert.equal(calls,2);
 assert.deepEqual(f.status,['Все добавленные билды сохранены в облаке']);
});
test('account owner switch stops remaining writes and does not display stale success',async()=>{
 let f;const calls=[];
 f=fixture({put:async entry=>{calls.push(entry.id);f.setOwner('account:bob_222');return true}});
 await f.fn([{id:'a'},{id:'b'}],'account:alice_01',3);
 assert.deepEqual(calls,['a']);
 assert.deepEqual(f.status,[]);
});

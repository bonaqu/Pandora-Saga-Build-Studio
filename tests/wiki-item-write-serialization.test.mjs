import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const code=read('pandora-studio-app.js');
const start=code.indexOf('async function saveWikiItemField(');
const end=code.indexOf('\nasync function saveWikiTradeRecipe(',start);
assert.ok(start>=0&&end>start,'The actual Wiki item-save routine must be inspectable');
const source=code.slice(start,end),window={};
Function('window',read('pandora-studio-item-owner-editor.js'))(window);

const items={
 1:{name:'Спата',desc:'Старое описание',slot:'weapon'},
 2:{name:'Лук',desc:'Старое описание лука',slot:'weapon'}
};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function deferred(){
 let resolve,reject;
 const promise=new Promise((ok,bad)=>{resolve=ok;reject=bad});
 return {promise,resolve,reject};
}
function environment({apiRequest,refreshOwnerCatalog}={}){
 const override={},ownerEdits=[],writes=[],queue=new Map();
 const request=apiRequest||(async(path,payload)=>{writes.push({path,payload})});
 const refresh=refreshOwnerCatalog||(async()=>{});
 const factory=Function('catalogSource','officialEnglish','window','activeOverride',
  'apiRequest','override','ownerEdits','refreshOwnerCatalog','refreshOwnerUI',
  'wikiRecordWriteQueue',
  'const adminEditing=true,adminToken="test";let editIsSaving=false;\n'+source+
  '\nreturn {save:saveWikiItemField,busy:()=>editIsSaving};');
 const handler=factory({items},null,window,
  key=>Object.hasOwn(override,key)?override[key]:null,request,override,
  ownerEdits,refresh,()=>{},queue);
 return {...handler,override,ownerEdits,writes,queue};
}

test('two fast item field edits are published sequentially with both values intact',async()=>{
 const firstRefresh=deferred(),writes=[];let refreshes=0;
 const env=environment({
  apiRequest:async(path,payload)=>{writes.push({path,payload})},
  refreshOwnerCatalog:async()=>{if(++refreshes===1)await firstRefresh.promise}
 });
 const first=env.save(1,'name','Прочная спата');
 const second=env.save(1,'desc','Обновлённое описание спаты');
 await tick();
 assert.equal(writes.length,1,'Second write cannot start before the first reindex');
 assert.equal(env.busy(),true);
 assert.equal(env.queue.size,1);
 firstRefresh.resolve();
 await Promise.all([first,second]);
 assert.equal(writes.length,2);
 assert.deepEqual(JSON.parse(writes[0].payload.value),{name:'Прочная спата'});
 assert.deepEqual(JSON.parse(writes[1].payload.value),{
  name:'Прочная спата',desc:'Обновлённое описание спаты'
 });
 assert.deepEqual(JSON.parse(env.override['itemedit.1']),{
  name:'Прочная спата',desc:'Обновлённое описание спаты'
 });
 assert.equal(env.ownerEdits.length,2);
 assert.equal(env.ownerEdits[0].before,null);
 assert.equal(env.ownerEdits[1].before,env.ownerEdits[0].after,
  'Undo may return to the prior confirmed item patch');
 assert.equal(env.queue.size,0);
 assert.equal(env.busy(),false);
});

test('reverting the name while another field is saved removes only that name',async()=>{
 const env=environment();
 await env.save(1,'name','Прочная спата');
 const removeName=env.save(1,'name','Спата');
 const newDescription=env.save(1,'desc','Обновлённое описание');
 await Promise.all([removeName,newDescription]);
 assert.deepEqual(JSON.parse(env.override['itemedit.1']),{
  desc:'Обновлённое описание'
 });
 assert.equal(env.ownerEdits.length,3);
 assert.equal(env.ownerEdits[1].after,null,
  'Removing the last changed field must reset the item override');
 assert.equal(env.ownerEdits[2].before,null);
 assert.equal(env.ownerEdits[2].after,env.override['itemedit.1']);
});

test('failed item save is not announced as success and queued follow-up still works',async()=>{
 let count=0;const writes=[];
 const env=environment({apiRequest:async(path,payload)=>{
  count++;writes.push({path,payload});
  if(count===1)throw Error('D1 item write rejected');
 }});
 const first=env.save(1,'name','Не сохранено');
 const second=env.save(1,'desc','Сохранённое описание');
 await assert.rejects(first,/D1 item write rejected/);
 await second;
 assert.deepEqual(JSON.parse(env.override['itemedit.1']),{
  desc:'Сохранённое описание'
 });
 assert.equal(writes.length,2);
 assert.equal(env.ownerEdits.length,1);
 assert.equal(env.queue.size,0);
 assert.equal(env.busy(),false);
});

test('unrelated items can still be edited in parallel',async()=>{
 const gate=deferred(),writes=[];
 const env=environment({apiRequest:async(path,payload)=>{
  writes.push({path,payload});await gate.promise;
 }});
 const a=env.save(1,'name','Прочная спата');
 const b=env.save(2,'name','Прочный лук');
 await tick();
 assert.equal(writes.length,2);
 assert.equal(env.queue.size,2);
 assert.equal(env.busy(),true);
 gate.resolve();
 await Promise.all([a,b]);
 assert.equal(env.queue.size,0);
 assert.equal(env.busy(),false);
});

test('item editor leaves original imported game records unchanged',async()=>{
 const initial=JSON.stringify(items);
 const env=environment();
 await Promise.all([
  env.save(1,'name','Прочная спата'),
  env.save(1,'descEn','Improved Spatha'),
  env.save(2,'name','Прочный лук')
 ]);
 assert.equal(JSON.stringify(items),initial);
 assert.equal(JSON.parse(env.override['itemedit.1']).name,'Прочная спата');
 assert.equal(JSON.parse(env.override['itemedit.1']).descEn,'Improved Spatha');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const start=app.indexOf('async function apiRequest(');
const end=app.indexOf('\nfunction showAdmin(',start);
assert.ok(start>=0&&end>start,'Exercise the exact shared production API helper');
const source=app.slice(start,end);
const validToken='a'.repeat(43);
function instance(fetchImpl,{lang='ru',values={}}={}){
 const override={...values},logs=[],ownerEdits=[];
 const window={PandoraStudioLiveRead:{get:(url,opts)=>fetchImpl(url,opts)}};
 const api=Function('window','fetch','override','ownerEdits','refreshOwnerUI',
  'closeInlineEditor','updateAdminHint','initialLang',
  'const API="https://ps-build-studio-cloud.bonaqu.workers.dev";'+
  'let adminToken='+JSON.stringify(validToken)+',adminEditing=true,'+
  'ownerSaveState="ready",ownerSaveError="",ownerWritePendingCount=0;const lang=initialLang;\n'+
  'function activeOverride(key){return Object.hasOwn(override,key)?override[key]:null}\n'+
  source+'\nreturn {request:apiRequest,status:()=>({ownerSaveState,ownerSaveError}),'+
  'auth:()=>({adminToken,adminEditing})};')(
  window,fetchImpl,override,ownerEdits,()=>logs.push('refresh'),()=>{},()=>{},lang);
 return {...api,override,logs};
}
const respond=(data,status=200)=>new Response(JSON.stringify(data),{
 status,headers:{'content-type':'application/json'}
});
function cloud(){
 const values=new Map(),requests=[];
 const fetchImpl=async(url,opts={})=>{
  const path=new URL(url).pathname;
  if(path==='/api/overrides')return respond({values:Object.fromEntries(values)});
  if(!['/api/admin/override','/api/admin/reset'].includes(path))
   throw Error('Unsupported mock endpoint '+path);
  const body=JSON.parse(opts.body);requests.push({path,body,options:opts});
  const expected=body.expectedValue;
  const current=values.has(body.key)?values.get(body.key):null;
  if(expected!==current)return respond({
   error:'Edit changed in another session. Reload this entry and try again.',
   code:'OWNER_EDIT_CONFLICT'
  },409);
  if(path==='/api/admin/reset'){
   if(current===null)return respond({error:'Edit conflict',code:'OWNER_EDIT_CONFLICT'},409);
   values.delete(body.key);return respond({ok:true,key:body.key,deleted:true,conditional:true});
  }
  values.set(body.key,body.value);
  return respond({ok:true,key:body.key,value:body.value,conditional:true});
 };
 return{values,requests,fetchImpl};
}

test('all administrative writes send the current D1 value as a CAS precondition',async()=>{
 const remote=cloud();remote.values.set('itemdesc.5','Older description');
 const a=instance(remote.fetchImpl,{
  values:{'itemdesc.5':'Older description'}
 });
 await a.request('/api/admin/override',{key:'itemdesc.5',value:'Updated'});
 assert.deepEqual(remote.requests[0].body,{
  key:'itemdesc.5',value:'Updated',expectedValue:'Older description'
 });
 assert.equal(remote.values.get('itemdesc.5'),'Updated');
 assert.equal(a.status().ownerSaveState,'saved');
 // A real editor updates its local override only AFTER the accepted response.
 a.override['itemdesc.5']='Updated';
 await a.request('/api/admin/reset',{key:'itemdesc.5'});
 assert.deepEqual(remote.requests[1].body,{
  key:'itemdesc.5',expectedValue:'Updated'
 });
 assert.equal(remote.values.has('itemdesc.5'),false);
});

test('create uses explicit null and rejects a second browser with a stale absent snapshot',async()=>{
 const server=cloud(),a=instance(server.fetchImpl),b=instance(server.fetchImpl);
 const [first,second]=await Promise.allSettled([
  a.request('/api/admin/override',{key:'itemdesc.42',value:'First owner'}),
  b.request('/api/admin/override',{key:'itemdesc.42',value:'Second owner'})
 ]);
 assert.equal(first.status,'fulfilled');
 assert.equal(second.status,'rejected');
 assert.equal(second.reason.httpStatus,409);
 assert.match(second.reason.message,/другом окне/);
 assert.equal(server.values.get('itemdesc.42'),'First owner');
 assert.equal(server.requests[0].body.expectedValue,null);
 assert.equal(server.requests[1].body.expectedValue,null);
 assert.equal(b.status().ownerSaveState,'error');
 assert.equal(Object.hasOwn(b.override,'itemdesc.42'),false,
  'Rejected edits must not be presented as saved local state');
});

test('stale update and Undo never erase a newer change from another browser',async()=>{
 const server=cloud();server.values.set('itemdesc.42','Original');
 const a=instance(server.fetchImpl,{values:{'itemdesc.42':'Original'}});
 const b=instance(server.fetchImpl,{values:{'itemdesc.42':'Original'},lang:'en'});
 await a.request('/api/admin/override',{key:'itemdesc.42',value:'Alice'});
 a.override['itemdesc.42']='Alice';
 await assert.rejects(
  b.request('/api/admin/override',{key:'itemdesc.42',value:'Bob'}),
  error=>error.httpStatus===409&&/another window/.test(error.message)
 );
 await assert.rejects(
  b.request('/api/admin/reset',{key:'itemdesc.42'}),
  error=>error.httpStatus===409
 );
 assert.equal(server.values.get('itemdesc.42'),'Alice');
 assert.equal(a.status().ownerSaveState,'saved');
 assert.equal(b.status().ownerSaveState,'error');
});

test('unrelated endpoint bodies do not gain private owner preconditions',async()=>{
 const calls=[];
 const request=async(url,opts={})=>{
  calls.push({url,opts});return respond({ok:true,values:{}});
 };
 const a=instance(request);
 await a.request('/api/overrides',null,'');
 await a.request('/api/admin/login',{username:'administrator',password:'test'});
 assert.equal(calls[0].opts.method,'GET');
 assert.equal(calls[0].opts.body,undefined);
 assert.equal(calls[1].opts.method,'POST');
 assert.deepEqual(JSON.parse(calls[1].opts.body),{
  username:'administrator',password:'test'
 });
});

test('every UI edit path shares the protected API helper',()=>{
 assert.equal((app.match(/fetch\(API\+['"]\/api\/admin\/(?:override|reset)/g)||[]).length,0,
  'Owner editing must not bypass the common conditional API helper');
 assert.match(source,/expectedValue:activeOverride\(body\.key\)/);
 assert.match(source,/data\.code==='OWNER_EDIT_CONFLICT'/);
});

test('an old-client rejection is localized and never reported as a successful save',async()=>{
 const calls=[];
 const editor=instance(async(_url,opts)=>{
  calls.push(JSON.parse(opts.body));
  return respond({error:'Редактор устарел. Обновите страницу перед сохранением.',
   code:'OWNER_CLIENT_UPDATE_REQUIRED'},428);
 },{lang:'en'});
 await assert.rejects(editor.request('/api/admin/override',
  {key:'itemdesc.77',value:'New text'}),
  error=>error.httpStatus===428&&/out of date/i.test(error.message));
 assert.equal(editor.status().ownerSaveState,'error');
 assert.ok(calls[0]&&Object.hasOwn(calls[0],'expectedValue'));
});

function deferredResponse(){
 let resolve;
 const promise=new Promise(yes=>{resolve=yes});
 return {promise,resolve};
}
test('a successful owner write cannot erase a concurrent failed edit notification',async()=>{
 const alice=deferredResponse(),bob=deferredResponse();
 const editor=instance(async(_url,opts)=>{
  const key=JSON.parse(opts.body).key;
  return key==='itemdesc.1'?alice.promise:bob.promise;
 });
 const a=editor.request('/api/admin/override',{key:'itemdesc.1',value:'First'});
 const b=editor.request('/api/admin/override',{key:'itemdesc.2',value:'Second'});
 assert.equal(editor.status().ownerSaveState,'saving');
 bob.resolve(respond({code:'OWNER_EDIT_CONFLICT',error:'Other editor changed it'},409));
 await assert.rejects(b,error=>error.httpStatus===409);
 assert.equal(editor.status().ownerSaveState,'saving',
  'Another field is still being saved');
 alice.resolve(respond({ok:true,key:'itemdesc.1',
  value:'First',conditional:true}));
 await a;
 assert.equal(editor.status().ownerSaveState,'error',
  'Successful completion must not erase the other field conflict');
 assert.match(editor.status().ownerSaveError,/другом окне/);

});
test('concurrent owner writes report saving until the last response and recover on a later success',async()=>{
 const fast=deferredResponse(),slow=deferredResponse();
 let mode='concurrent';
 const editor=instance(async(_url,opts)=>{
  if(mode==='retry'){
   const body=JSON.parse(opts.body);
   return respond({ok:true,key:body.key,value:body.value,conditional:true});
  }
  return JSON.parse(opts.body).key==='itemdesc.10'?fast.promise:slow.promise;
 });
 const a=editor.request('/api/admin/override',{key:'itemdesc.10',value:'A'});
 const b=editor.request('/api/admin/override',{key:'itemdesc.11',value:'B'});
 fast.resolve(respond({ok:true,key:'itemdesc.10',value:'A',conditional:true}));await a;
 assert.equal(editor.status().ownerSaveState,'saving');
 slow.resolve(respond({code:'OWNER_EDIT_CONFLICT',error:'Stale write'},409));
 await assert.rejects(b,e=>e.httpStatus===409);
 assert.equal(editor.status().ownerSaveState,'error');
 mode='retry';
 await editor.request('/api/admin/override',{key:'itemdesc.12',value:'C'});
 assert.equal(editor.status().ownerSaveState,'saved');
 assert.equal(editor.status().ownerSaveError,'');
});

test('HTTP 200 is not proof of D1 persistence: malformed or incomplete CAS replies fail closed',async()=>{
 const cases=[
  ['broken JSON',new Response('{broken',{status:200})],
  ['missing proof',respond({ok:true})],
  ['wrong key',respond({ok:true,key:'itemdesc.999',value:'Saved',conditional:true})],
  ['wrong value',respond({ok:true,key:'itemdesc.50',value:'Different',conditional:true})],
  ['missing CAS',respond({ok:true,key:'itemdesc.50',value:'Saved'})],
  ['explicit false',respond({ok:false,key:'itemdesc.50',value:'Saved',conditional:true})]
 ];
 for(const [caseName,response] of cases){
  const editor=instance(async()=>response,{values:{'itemdesc.50':'Original'}});
  await assert.rejects(
   editor.request('/api/admin/override',{key:'itemdesc.50',value:'Saved'}),
   error=>error.reason==='OWNER_WRITE_UNCONFIRMED'&&/не подтвердил/.test(error.message),
   caseName
  );
  assert.equal(editor.status().ownerSaveState,'error',caseName);
  assert.equal(editor.override['itemdesc.50'],'Original',caseName);
 }
});

test('a reset reply must acknowledge deletion of exactly the conditional D1 key',async()=>{
 for(const reply of [
  {ok:true,key:'itemdesc.50',conditional:true},
  {ok:true,key:'itemdesc.51',deleted:true,conditional:true},
  {ok:true,key:'itemdesc.50',deleted:true,conditional:false}
 ]){
  const editor=instance(async()=>respond(reply),{
   values:{'itemdesc.50':'Before'}
  });
  await assert.rejects(
   editor.request('/api/admin/reset',{key:'itemdesc.50'}),
   error=>error.reason==='OWNER_WRITE_UNCONFIRMED'
  );
  assert.equal(editor.status().ownerSaveState,'error');
 }
 const editor=instance(async()=>respond({
  ok:true,key:'itemdesc.50',deleted:true,conditional:true
 }),{values:{'itemdesc.50':'Before'}});
 await editor.request('/api/admin/reset',{key:'itemdesc.50'});
 assert.equal(editor.status().ownerSaveState,'saved');
});

test('a failed D1 acknowledgment preserves a retry, and a valid CAS reply clears the error',async()=>{
 let response={ok:true,key:'itemdesc.50',value:'Submitted'};
 const editor=instance(async()=>respond(response),{lang:'en'});
 await assert.rejects(
  editor.request('/api/admin/override',{key:'itemdesc.50',value:'Submitted'}),
  error=>/did not confirm/i.test(error.message)
 );
 assert.equal(editor.status().ownerSaveState,'error');
 response={...response,conditional:true};
 await editor.request('/api/admin/override',{key:'itemdesc.50',value:'Submitted'});
 assert.equal(editor.status().ownerSaveState,'saved');
 assert.equal(editor.status().ownerSaveError,'');
});

const guideStart=app.indexOf('const ownerGuideWriteQueue=new Map();');
const guideEnd=app.indexOf('\nasync function saveGuideList(',guideStart);
assert.ok(guideStart>=0&&guideEnd>guideStart,
 'Test the complete real bilingual save queue, not a replicated algorithm');
const guideSource=app.slice(guideStart,guideEnd);

function guideEnvironment(onRequest=async()=>{}){
 const writes=[],override={},history=[],remote={},uiStates=[];
 const apiRequest=async(_path,body)=>{
  writes.push({...body});
  await onRequest(body,writes.length);
  const stored=Object.hasOwn(remote,body.key)?remote[body.key]:null;
  const expected=Object.hasOwn(override,body.key)?override[body.key]:null;
  assert.equal(stored,expected,'CAS must use the latest accepted local snapshot');
  remote[body.key]=body.value;
  return {ok:true,key:body.key,value:body.value,conditional:true};
 };
 const factory=Function('apiRequest','override','ownerEdits','refreshOwnerUI',
  'refreshVisibleWikiLabels','refreshVisibleUICopy','refreshVisibleOwnerCopy',
  'saveView','renderStageAttributes',
  'const window={PandoraHonorGuide:{validOverride:()=>true}};'+
  'let editIsSaving=false,wikiLabelPendingWrites=0;'+
  'const adminEditing=true,adminToken="test",activeTab="character",wikiSelection={type:null};'+
  guideSource+
  '\nreturn {save:saveGuidePatch,queued:()=>ownerGuidePendingWrites,'+
  'queueSize:()=>ownerGuideWriteQueue.size,labelsPending:()=>wikiLabelPendingWrites};');
 const handlers=factory(apiRequest,override,history,()=>uiStates.push('refresh'),
  ()=>{},()=>{},()=>{},()=>{},()=>{});
 return {...handlers,writes,override,history,remote,uiStates};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('concurrent RU and EN edits of ONE semantic key merge serially without losing either language',async()=>{
 const gate=deferredResponse();
 const env=guideEnvironment(async(_body,count)=>{
  if(count===1)await gate.promise;
 });
 const name='book.ui.label.site-update-notice';
 const a=env.save(name,{ru:'Обновление героя'});
 const b=env.save(name,{en:'Character update'});
 await tick();
 assert.equal(env.writes.length,1,'Second write must wait for first CAS acknowledgment');
 assert.equal(env.queued(),2);
 assert.equal(env.queueSize(),1);
 gate.resolve();
 await Promise.all([a,b]);
 assert.equal(env.writes.length,2);
 const id='guideedit.'+name;
 assert.deepEqual(JSON.parse(env.remote[id]),{
  ru:'Обновление героя',en:'Character update'
 });
 assert.equal(env.writes[0].value,JSON.stringify({ru:'Обновление героя'}));
 assert.equal(env.writes[1].value,JSON.stringify({
  ru:'Обновление героя',en:'Character update'
 }));
 assert.equal(env.history.length,2,'Both accepted edits remain undoable');
 assert.equal(env.queued(),0);
 assert.equal(env.queueSize(),0);
});

test('independent D1 editorial keys still save in parallel',async()=>{
 const gate=deferredResponse();
 const env=guideEnvironment(async()=>gate.promise);
 const a=env.save('book.ui.label.site-update-notice',{ru:'Обновление'});
 const b=env.save('book.ui.label.site-update-apply',{en:'Apply'});
 await tick();
 assert.equal(env.writes.length,2,'Different keys do not share a global lock');
 assert.equal(env.queueSize(),2);
 gate.resolve();
 await Promise.all([a,b]);
 assert.equal(env.queueSize(),0);
 assert.equal(env.history.length,2);
});

test('a rejected first guide edit does not poison a queued edit or create phantom history',async()=>{
 let failed=false;
 const env=guideEnvironment(async(_body,count)=>{
  if(count===1&&!failed){failed=true;throw Error('Mock D1 CAS failure')}
 });
 const key='book.ui.label.wiki';
 const a=env.save(key,{ru:'Несохранённое'});
 const b=env.save(key,{en:'Saved in English'});
 await assert.rejects(a,/Mock D1 CAS failure/);
 await b;
 assert.equal(env.writes.length,2);
 assert.deepEqual(JSON.parse(env.remote['guideedit.'+key]),{
  en:'Saved in English'
 });
 assert.equal(env.history.length,1);
 assert.equal(env.queueSize(),0);
 assert.equal(env.queued(),0);
});

test('Wiki chapter labels share the owner queue and preserve pending status',async()=>{
 const gate=deferredResponse();
 const env=guideEnvironment(async(_body,count)=>{if(count===1)await gate.promise});
 const a=env.save('wiki.labels',{chapter_honor_ru:'Честь'});
 const b=env.save('wiki.labels',{chapter_honor_en:'Honor'});
 await tick();
 assert.equal(env.labelsPending(),2);
 assert.equal(env.queueSize(),1);
 gate.resolve();
 await Promise.all([a,b]);
 assert.deepEqual(JSON.parse(env.remote['guideedit.wiki.labels']),{
  chapter_honor_ru:'Честь',chapter_honor_en:'Honor'
 });
 assert.equal(env.labelsPending(),0);
 assert.equal(env.queueSize(),0);
});

test('admin Finish/Undo gate sees queued bilingual edits, even before their network request starts',()=>{
 assert.match(app,/function ownerSaveInFlight\(\)\{[\s\S]*ownerGuidePendingWrites>0/);
 assert.match(app,/if\(!adminToken\|\|!ownerEdits.length\|\|ownerSaveInFlight\(\)\)return/);
 assert.doesNotMatch(app,/let wikiLabelWriteQueue=Promise\.resolve\(\)/);
});

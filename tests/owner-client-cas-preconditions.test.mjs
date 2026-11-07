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
 const api=Function('fetch','override','ownerEdits','refreshOwnerUI',
  'closeInlineEditor','updateAdminHint','initialLang',
  'const API="https://ps-build-studio-cloud.bonaqu.workers.dev";'+
  'let adminToken='+JSON.stringify(validToken)+',adminEditing=true,'+
  'ownerSaveState="ready",ownerSaveError="";const lang=initialLang;\n'+
  'function activeOverride(key){return Object.hasOwn(override,key)?override[key]:null}\n'+
  source+'\nreturn {request:apiRequest,status:()=>({ownerSaveState,ownerSaveError}),'+
  'auth:()=>({adminToken,adminEditing})};')(
  fetchImpl,override,ownerEdits,()=>logs.push('refresh'),()=>{},()=>{},lang);
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

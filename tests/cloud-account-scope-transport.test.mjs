import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const begin=source.indexOf('async function cloudLibraryRequest(payload){');
const end=source.indexOf('\nfunction reportCloudStatus(',begin);
assert.ok(begin>=0&&end>begin,'Use the production cloud request, not a copy');
const requestSource=source.slice(begin,end);
const gateHost={};
Function('window',readFileSync(new URL('../pandora-studio-online-gate.js',import.meta.url),'utf8'))(gateHost);
const guest='9'.repeat(64);
const account='a'.repeat(43);
const accountOwner='account:alice_01';
const guestOwner='guest:'+guest;

function setup({owner=accountOwner,liveOwner=owner,token=()=>account}={}){
 let currentOwner=liveOwner;
 const sent=[];
 const ui={PandoraStudioOnlineGate:gateHost.PandoraStudioOnlineGate,
  PandoraAccountUI:{isLoggedIn:()=>currentOwner.startsWith('account:'),
  token:()=>token({setOwner:value=>{currentOwner=value}})}};
 const request=Function('window','fetch','API','tabGuestSecret','libraryScopeId',
  'tabOwnerScope',requestSource+'\nreturn cloudLibraryRequest;')(
  ui,async(url,options)=>{
   sent.push({url,authorization:options.headers.Authorization});
   return {ok:true,json:async()=>({ok:true,revision:100})};
  },'https://example.invalid',guest,()=>currentOwner,owner);
 return {send:()=>request({action:'put',entry:{id:'f'.repeat(32)}}),
  sent,owner:()=>currentOwner};
}

test('account owner sends cloud changes only with its own authenticated bearer',async()=>{
 const c=setup();
 await c.send();
 assert.equal(c.sent.length,1);
 assert.equal(c.sent[0].authorization,'Bearer '+account);
});

test('token expiry during request preparation cannot redirect account data to guest',async()=>{
 const c=setup({token:({setOwner})=>{setOwner(guestOwner);return null}});
 await assert.rejects(c.send(),error=>error?.reason==='owner_changed');
 assert.deepEqual(c.sent,[],'No API write may use the unrelated guest key');
 assert.equal(c.owner(),guestOwner);
});

test('a newly signed-in different account cannot inherit the previous owner request',async()=>{
 const c=setup({owner:accountOwner,liveOwner:'account:bob_222',
  token:()=> 'b'.repeat(43)});
 await assert.rejects(c.send(),error=>error?.reason==='owner_changed');
 assert.deepEqual(c.sent,[]);
});

test('missing account token fails closed even if library marker has not switched',async()=>{
 const c=setup({token:()=>null});
 await assert.rejects(c.send(),error=>error?.reason==='owner_changed');
 assert.equal(c.sent.length,0);
});

test('guest cloud requests reject before any network without exposing their legacy key',async()=>{
 const c=setup({owner:guestOwner,token:()=>null});
 await assert.rejects(c.send(),error=>error?.reason==='sign_in_required');
 assert.deepEqual(c.sent,[]);
});

test('legacy guest secret never becomes a cloud bearer, even when the caller supplies one',async()=>{
 const c=setup({owner:guestOwner,token:()=>{throw Error('Guest token must not be used')}});
 await assert.rejects(c.send('b'.repeat(64)),error=>error?.reason==='sign_in_required');
 assert.deepEqual(c.sent,[]);
});

test('account-change cloud warning has a localized English counterpart',()=>{
 const locale=readFileSync(new URL('../pandora-studio-ui-locale.js',import.meta.url),'utf8');
 assert.match(requestSource,/error\.reason='owner_changed'/);
 assert.match(source,/Аккаунт изменился · синхронизация остановлена/);
 assert.match(locale,/Account changed · sync stopped/);
});

test('account cloud library GET and POST stop stalled headers/JSON with no duplicate write',async()=>{
 const timeout={timeout:ms=>{
  assert.ok(ms===20000||ms===25000,'Cloud deadlines remain bounded');
  return AbortSignal.timeout(35);
 }};
 for(const write of [false,true])for(const stage of ['headers','json']){
  let calls=0,usedSignal=false;
  const root={PandoraAccountUI:{isLoggedIn:()=>true,token:()=>account},
   PandoraStudioOnlineGate:gateHost.PandoraStudioOnlineGate};
  const fetcher=async(_url,options)=>{
   calls++;usedSignal=Boolean(options.signal);
   assert.equal(options.method,write?'POST':'GET');
   if(stage==='headers')return new Promise(()=>{});
   return {ok:true,json:()=>new Promise(()=>{})};
  };
  const request=Function('window','fetch','API','tabGuestSecret','libraryScopeId',
   'tabOwnerScope','AbortSignal',requestSource+'\nreturn cloudLibraryRequest;')(
   root,fetcher,'https://example.invalid',guest,()=>accountOwner,accountOwner,timeout
  );
  const keepAlive=setTimeout(()=>{},200);
  try{
   await assert.rejects(request(write?{action:'put',entry:{id:'f'.repeat(32)}}:null),
    /abort|timeout|Нет ответа облачного сервера/i);
   assert.equal(calls,1,'Unconfirmed cloud PUT must not be sent a second time');
   assert.equal(usedSignal,true);
  }finally{clearTimeout(keepAlive)}
 }
});

test('HTTP 200 without a valid cloud acknowledgment never means saved or empty library',async()=>{
 const root={PandoraAccountUI:{isLoggedIn:()=>true,token:()=>account},
  PandoraStudioOnlineGate:gateHost.PandoraStudioOnlineGate};
 const run=(payload,answer)=>Function('window','fetch','API','tabGuestSecret',
  'libraryScopeId','tabOwnerScope',requestSource+'\nreturn cloudLibraryRequest;')(
  root,async()=>({ok:true,status:200,json:async()=>answer}),
  'https://example.invalid',guest,()=>accountOwner,accountOwner)(payload);
 for(const invalid of [null,{}, {ok:false},{records:[]}]){
  await assert.rejects(run({action:'put',entry:{id:'f'.repeat(32)}},invalid),
   error=>error.reason==='unconfirmed',JSON.stringify(invalid));
 }
 for(const invalid of [null,{}, {ok:true}, {records:'broken'}]){
  await assert.rejects(run(null,invalid),
   error=>error.reason==='unconfirmed',JSON.stringify(invalid));
 }
 assert.equal((await run({action:'delete',id:'f'.repeat(32)},{ok:true})).ok,true);
 assert.deepEqual((await run(null,{records:[]})).records,[]);
});

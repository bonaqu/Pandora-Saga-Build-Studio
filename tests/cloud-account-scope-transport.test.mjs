import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const begin=source.indexOf('async function cloudLibraryRequest(payload,secret=null){');
const end=source.indexOf('\nfunction reportCloudStatus(',begin);
assert.ok(begin>=0&&end>begin,'Use the production cloud request, not a copy');
const requestSource=source.slice(begin,end);
const guest='9'.repeat(64);
const account='a'.repeat(43);
const accountOwner='account:alice_01';
const guestOwner='guest:'+guest;

function setup({owner=accountOwner,liveOwner=owner,token=()=>account}={}){
 let currentOwner=liveOwner;
 const sent=[];
 const ui={PandoraAccountUI:{isLoggedIn:()=>currentOwner.startsWith('account:'),
  token:()=>token({setOwner:value=>{currentOwner=value}})}};
 const request=Function('window','fetch','API','tabGuestSecret','libraryScopeId',
  'tabOwnerScope',requestSource+'\nreturn cloudLibraryRequest;')(
  ui,async(url,options)=>{
   sent.push({url,authorization:options.headers.Authorization});
   return {ok:true,json:async()=>({records:[]})};
  },'https://example.invalid',guest,()=>currentOwner,owner);
 return {send:(secret=null)=>request({action:'put',entry:{id:'f'.repeat(32)}},secret),
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

test('explicit guest library lookup keeps its supplied secret without account fallback',async()=>{
 const code='b'.repeat(64);
 const c=setup({token:()=>{throw Error('Account token must not be touched')}});
 await c.send(code);
 assert.equal(c.sent.length,1);
 assert.equal(c.sent[0].authorization,'Bearer '+code);
});

test('account-change cloud warning has a localized English counterpart',()=>{
 const locale=readFileSync(new URL('../pandora-studio-ui-locale.js',import.meta.url),'utf8');
 assert.match(requestSource,/error\.reason='owner_changed'/);
 assert.match(source,/Аккаунт изменился · синхронизация остановлена/);
 assert.match(locale,/Account changed · sync stopped/);
});

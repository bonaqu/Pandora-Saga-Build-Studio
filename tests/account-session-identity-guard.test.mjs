import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const original=readFileSync(new URL('../pandora-studio-account-ui.js',import.meta.url),'utf8');
const script=original.replace(
 'root.PandoraAccountUI=Object.freeze(',
 'root.__accountTest=Object.freeze({setSession,clearSession,recoveryCode:()=>pendingRecoveryCode,storageFailed:()=>sessionStorageFailed});root.PandoraAccountUI=Object.freeze(');
assert.notEqual(script,original,'Test-only helper exposure must match the public module');

function deferred(){
 let resolve;const promise=new Promise(r=>{resolve=r});
 return {promise,resolve};
}
function create({stored=null,clock=Date,fetchImpl=async()=>({ok:true,status:200,
 json:async()=>({account:{username:'alice_01'}})}),onBootstrapLogin=null,
 onBootstrapGuest=null}={}){
 const map=new Map();
 if(stored!==null)map.set('ps-account-session.v1',JSON.stringify(stored));
 const storage={getItem:key=>map.get(key)??null,
  setItem:(key,value)=>map.set(key,String(value)),
  removeItem:key=>map.delete(key)};
 const events={login:[],logout:[],guest:[]};
 const element=()=>({
  classList:{toggle(){}},addEventListener(){},replaceChildren(){},
  append(){},setAttribute(){},contains(){return false}
 });
 const trigger=element(),panel=element(),triggerAttrs=new Map();
 trigger.setAttribute=(name,value)=>{triggerAttrs.set(name,String(value))};
 trigger.getAttribute=name=>triggerAttrs.get(name)||null;
 const doc={documentElement:{lang:'ru'},createElement:element,
  getElementById:id=>id==='profileTrigger'?trigger:id==='accountPanel'?panel:null,
  addEventListener(){}};
 const listeners={},root={addEventListener:(type,callback)=>{listeners[type]=callback}};
 const ctx={window:root,localStorage:storage,document:doc,
  fetch:fetchImpl,Date:clock,console};
 vm.runInNewContext(script,ctx);
 const options={baseUrl:'https://example.invalid',
  onLogin:e=>{events.login.push(e);return onBootstrapLogin?.(e)},
  onLogout:e=>events.logout.push(e),
  onGuest:e=>{events.guest.push(e);return onBootstrapGuest?.(e)}};
 return {api:root.PandoraAccountUI,helper:root.__accountTest,events,
  init:()=>root.PandoraAccountUI.init(options),storage,trigger,panel,
  emitStorage:event=>listeners.storage?.(event)};
}
const session=(username='alice_01',token='a'.repeat(43))=>
 ({token,username,expires:Date.now()+3600000});
const reply=(account,status=200)=>({
 ok:status>=200&&status<300,status,
 json:async()=>({account,error:status===200?undefined:'Connection unavailable'})
});

test('restored session is trusted only with canonical owner, token, future finite expiry',async()=>{
 for(const invalid of [
  {...session(),username:'../../../wrong'},
  {...session(),username:null},
  {...session(),token:'invalid'},
  {...session(),expires:Infinity},
  {...session(),expires:'9999999999999999'},
  {...session(),expires:Date.now()-5000}
 ]){
  const c=create({stored:invalid});
  await c.init();
  assert.equal(c.api.isLoggedIn(),false,JSON.stringify(invalid));
  assert.equal(c.events.guest.length,1);
  assert.equal(c.events.login.length,0);
 }
 const valid=create({stored:session('Alice_01')});
 await valid.init();
 assert.equal(valid.api.username(),'alice_01');
 assert.equal(valid.events.login.length,1);
});


test('a session persisted after script load but before init is restored, not treated as guest',async()=>{
 // The account classic script is evaluated by create() with empty storage.
 // A separate tab then signs in while the deferred app bundle is still loading.
 let sent=0;
 const c=create({fetchImpl:async(url,options)=>{
  sent++;
  assert.match(url,/\/api\/account\/me$/);
  assert.equal(options.headers.Authorization,'Bearer '+'a'.repeat(43));
  return reply({username:'alice_01'});
 }});
 assert.equal(c.api.isLoggedIn(),false);
 c.storage.setItem('ps-account-session.v1',JSON.stringify(session()));
 await c.init();
 assert.equal(sent,1,'Newly persisted account must be verified through /me');
 assert.equal(c.api.username(),'alice_01');
 assert.equal(c.trigger.getAttribute('data-account-bootstrap'),'verified');
 assert.equal(c.events.login.length,1);
 assert.equal(c.events.guest.length,0,
  'No guest library request when a valid account arrived before initialization');
});

test('late account discovery keeps network outages as offline account, not guest',async()=>{
 const gate=deferred();
 const c=create({fetchImpl:()=>gate.promise});
 c.storage.setItem('ps-account-session.v1',JSON.stringify(session()));
 const boot=c.init();
 assert.equal(c.api.username(),'alice_01');
 assert.equal(c.trigger.getAttribute('data-account-bootstrap'),'pending');
 assert.equal(c.events.guest.length,0);
 gate.resolve(reply({},503));
 await boot;
 assert.equal(c.trigger.getAttribute('data-account-bootstrap'),'offline');
 assert.equal(c.events.login.length,1);
 assert.equal(c.events.guest.length,0);
 assert.equal(c.api.username(),'alice_01');
});

test('init never replaces a tab-local existing owner with a newer login in another tab',async()=>{
 const alice=session();
 const c=create({stored:alice});
 c.storage.setItem('ps-account-session.v1',
  JSON.stringify(session('bob_222','b'.repeat(43))));
 await c.init();
 assert.equal(c.api.username(),'alice_01');
 assert.equal(c.events.login.length,1);
 assert.equal(c.events.guest.length,0);
 assert.equal(JSON.parse(c.storage.getItem('ps-account-session.v1')).username,'bob_222');
});

test('successful /me must reject a different verified owner',async()=>{
 const c=create({stored:session(),fetchImpl:async()=>reply({username:'bob_222'})});
 await c.init();
 assert.equal(c.api.token(),null);
 assert.equal(c.events.login.length,0);
 assert.equal(c.events.logout.length,1);
 assert.equal(c.storage.getItem('ps-account-session.v1'),null);
});

test('incomplete or unreadable HTTP 200 /me is offline, not credential revocation',async()=>{
 const responses=[
  async()=>reply({username:null}),
  async()=>reply({}),
  async()=>reply(null),
  async()=>({ok:true,status:200,json:async()=>{throw Error('Invalid JSON')}})
 ];
 for(const fetchImpl of responses){
  const c=create({stored:session(),fetchImpl});
  await c.init();
  assert.equal(c.api.username(),'alice_01');
  assert.equal(c.api.token(),'a'.repeat(43));
  assert.equal(c.events.login.length,1);
  assert.equal(c.events.logout.length,0);
  assert.equal(c.trigger.getAttribute('data-account-bootstrap'),'offline');
  assert.equal(JSON.parse(c.storage.getItem('ps-account-session.v1')).username,'alice_01');
 }
});

test('transient network or server failure retains owner without false logout',async()=>{
 const c=create({stored:session(),fetchImpl:async()=>reply({},503)});
 await c.init();
 assert.equal(c.api.username(),'alice_01');
 assert.equal(c.api.token(),'a'.repeat(43));
 assert.equal(c.events.login.length,1);
 assert.equal(c.events.logout.length,0);
});

test('malformed login responses cannot replace a valid session or recovery secret',()=>{
 const c=create({stored:session()});
 const initial=c.storage.getItem('ps-account-session.v1');
 const good={account:{username:'bob_222'},
  token:'b'.repeat(43),expires:Date.now()+3600000,recoveryCode:'r'.repeat(43)};
 for(const wrong of [
  {...good,token:'x'},
  {...good,expires:NaN},
  {...good,account:{username:'admin../'}},
  {...good,account:null}
 ]){
  assert.throws(()=>c.helper.setSession(wrong),/Некорректный ответ авторизации/);
  assert.equal(c.storage.getItem('ps-account-session.v1'),initial);
 }
 c.helper.setSession(good);
 assert.equal(c.api.username(),'bob_222');
 assert.equal(JSON.parse(c.storage.getItem('ps-account-session.v1')).username,'bob_222');
});

test('a quota failure during registration does not lose the one-time recovery code',()=>{
 const c=create();
 const originalSet=c.storage.setItem;
 c.storage.setItem=(key,value)=>{
  if(key==='ps-account-session.v1')throw Error('QuotaExceededError');
  return originalSet(key,value);
 };
 const result={account:{username:'alice_01'},token:'a'.repeat(43),
  expires:Date.now()+3600000,recoveryCode:'r'.repeat(43)};
 assert.doesNotThrow(()=>c.helper.setSession(result));
 assert.equal(c.api.username(),'alice_01');
 assert.equal(c.helper.recoveryCode(),'r'.repeat(43));
 assert.equal(c.helper.storageFailed(),true);
 assert.equal(c.storage.getItem('ps-account-session.v1'),null);
 c.api.refresh();
 assert.equal(c.helper.recoveryCode(),'r'.repeat(43),
  'A profile redraw must not discard the only recovery code');
 assert.equal(c.api.isLoggedIn(),true,
  'The authenticated tab should remain usable until it is refreshed');
 c.helper.clearSession();
 assert.equal(c.helper.storageFailed(),false);
 assert.equal(c.helper.recoveryCode(),null);
});

test('late /me failure never signs out a newer login and late /me success cannot switch it',async()=>{
 for(const server of [reply({},401),reply({username:'alice_01'})]){
  const gate=deferred();
  const c=create({stored:session(),fetchImpl:()=>gate.promise});
  const waiting=c.init();
  c.helper.setSession({account:{username:'bob_222'},
   token:'b'.repeat(43),expires:Date.now()+3600000});
  gate.resolve(server);
  await waiting;
  assert.equal(c.api.username(),'bob_222');
  assert.equal(c.api.token(),'b'.repeat(43));
  assert.equal(c.events.logout.length,0);
  assert.equal(c.events.login.length,0);
  assert.equal(JSON.parse(c.storage.getItem('ps-account-session.v1')).username,'bob_222');
 }
});

test('an already-open tab signs out exactly once when account session expires',async()=>{
 let now=Date.now();
 class Clock extends Date{static now(){return now}}
 const record={token:'a'.repeat(43),username:'alice_01',expires:now+30000};
 const c=create({stored:record,clock:Clock});
 await c.init();
 assert.equal(c.api.token(),record.token);
 assert.equal(c.api.username(),'alice_01');
 assert.equal(c.api.isLoggedIn(),true);
 now+=30001;
 assert.equal(c.api.token(),null,'No expired credential may be sent to the Worker');
 assert.equal(c.api.username(),null,'Do not reuse an expired account as owner scope');
 assert.equal(c.api.isLoggedIn(),false);
 assert.equal(c.storage.getItem('ps-account-session.v1'),null);
 assert.equal(c.events.logout.length,1);
 assert.equal(c.events.logout[0].expired,true);
 c.api.refresh();
 assert.equal(c.events.logout.length,1,'Repeated renders do not repeat logout');
});

test('refreshing the profile after expiry also clears the owner before rendering',async()=>{
 let now=Date.now();
 class Clock extends Date{static now(){return now}}
 const c=create({stored:{token:'b'.repeat(43),username:'alice_01',
  expires:now+1500},clock:Clock});
 await c.init();
 now+=2000;
 c.api.refresh();
 assert.equal(c.api.isLoggedIn(),false);
 assert.equal(c.events.logout.length,1);
 assert.equal(c.storage.getItem('ps-account-session.v1'),null);
});

test('a temporary network error does not sign out a session whose expiry is still valid',async()=>{
 let now=Date.now();
 class Clock extends Date{static now(){return now}}
 const c=create({stored:{token:'b'.repeat(43),username:'alice_01',
  expires:now+100000},clock:Clock,fetchImpl:async()=>reply({},503)});
 await c.init();
 now+=90000;
 assert.equal(c.api.isLoggedIn(),true);
 assert.equal(c.events.logout.length,0);
 assert.equal(c.api.token(),'b'.repeat(43));
});

test('an old account tab only clears its own persisted session',()=>{
 const source=readFileSync(new URL('../pandora-studio-account-ui.js',import.meta.url),'utf8');
 assert.match(source,/const previousToken=session\?\.token\|\|null/);
 assert.match(source,/saved\?\.token===previousToken/);
 assert.match(source,/event\.newValue!==null/);
 assert.match(source,/previous\?\.token!==session\.token/);
 assert.match(source,/otherTab:true/);
});

test('another tab revoking the same token signs out the current tab once',async()=>{
 const alice=session();
 const c=create({stored:alice});
 await c.init();
 c.storage.removeItem('ps-account-session.v1');
 c.emitStorage({key:'ps-account-session.v1',
  oldValue:JSON.stringify(alice),newValue:null});
 assert.equal(c.api.token(),null);
 assert.equal(c.events.logout.length,1);
 assert.equal(c.events.logout[0].otherTab,true);
 c.emitStorage({key:'ps-account-session.v1',
  oldValue:JSON.stringify(alice),newValue:null});
 assert.equal(c.events.logout.length,1);
});
test('logging out a different account in another tab does not sign out this owner',async()=>{
 const alice=session(),bob=session('bob_222','b'.repeat(43));
 const c=create({stored:alice});
 await c.init();
 c.emitStorage({key:'ps-account-session.v1',
  oldValue:JSON.stringify(bob),newValue:null});
 assert.equal(c.api.token(),alice.token);
 assert.equal(c.events.logout.length,0);
});


test('restored account displays pending until its matching /me reply completes',async()=>{
 const gate=deferred();
 const c=create({stored:session(),fetchImpl:()=>gate.promise});
 const pending=c.init();
 assert.equal(c.trigger.getAttribute('data-account-bootstrap'),'pending');
 assert.equal(c.events.logout.length,0,'Pending verification must not clear an owner');
 gate.resolve(reply({username:'alice_01'}));
 await pending;
 assert.equal(c.trigger.getAttribute('data-account-bootstrap'),'verified');
 assert.equal(c.api.username(),'alice_01');
});

test('temporary account check failure is visible without losing ownership',async()=>{
 const c=create({stored:session(),fetchImpl:async()=>reply({},503)});
 await c.init();
 assert.equal(c.trigger.getAttribute('data-account-bootstrap'),'offline');
 assert.equal(c.api.username(),'alice_01');
 assert.equal(c.events.logout.length,0);
 const revoked=create({stored:session(),fetchImpl:async()=>reply({},401)});
 await revoked.init();
 assert.equal(revoked.trigger.getAttribute('data-account-bootstrap'),'guest');
 assert.equal(revoked.api.isLoggedIn(),false);
});

test('account requests have a deadline and network timeout does not revoke the account',()=>{
 assert.match(original,/AbortSignal\.timeout\(kind==='me'\?12000:20000\)/);
 assert.match(original,/if\(error\?\.httpStatus===401\|\|error\?\.httpStatus===403\)/);
 assert.match(original,/setBootstrapPhase\('offline'\)/);
});

test('password completion is bound to a session revision and the live profile form',()=>{
 assert.match(original,/sessionRevision\+\+/);
 assert.match(original,/const sameSession=\(\)=>session\?\.token===owner&&sessionRevision===revision/);
 assert.match(original,/passwordRequest\?\.revision===sessionRevision/);
 assert.match(original,/const currentDetails=panel\?\.querySelector\?\.\('.account-password-details'\)/);
 assert.match(original,/for\(const input of currentDetails\?\.querySelectorAll\?\.\('input'\)\|\|\[\]\)input\.value=''/);
 assert.match(original,/if\(currentDetails\)currentDetails\.open=false/);
});

test('late bootstrap 401 cannot sign out a fresh login that reused the same bearer',async()=>{
 const gate=deferred();
 const old=session('alice_01','a'.repeat(43));
 const c=create({stored:old,fetchImpl:()=>gate.promise});
 const waiting=c.init();
 c.helper.clearSession();
 c.helper.setSession({account:{username:'alice_01'},
  token:old.token,expires:Date.now()+3600000});
 gate.resolve(reply({},401));
 await waiting;
 assert.equal(c.api.username(),'alice_01');
 assert.equal(c.api.token(),old.token);
 assert.equal(c.events.logout.length,0,'Old /me must not revoke a new local session');
 assert.equal(c.trigger.getAttribute('data-account-bootstrap'),'verified');
});
test('logout checks the revision as well as the token before clearing state',()=>{
 assert.match(original,/session\?\.token!==owner\|\|sessionRevision!==revision/);
 assert.match(original,/session\?\.token!==bootstrapToken\|\|sessionRevision!==bootstrapRevision/);
});

test('registration and recovery use one in-flight request across locale remounts',()=>{
 assert.match(original,/let sessionRevision=0,passwordRequest=null,guestAuthRequest=null/);
 assert.match(original,/const guestPending=guestAuthRequest\?\.revision===sessionRevision/);
 assert.match(original,/for\(const tab of tabButtons\)tab\.disabled=guestPending/);
 assert.match(original,/if\(guestAuthRequest\?\.revision===sessionRevision\)return/);
 assert.match(original,/const sameRequest=\(\)=>guestAuthRequest===ticket&&/);
 assert.match(original,/if\(!sameRequest\(\)\)return;/);
 assert.match(original,/if\(guestAuthRequest===ticket\)guestAuthRequest=null/);
});

test('stale tab logout cannot delete another owner with a reused bearer',async()=>{
 const same='s'.repeat(43),alice=session('alice_01',same),
  bob=session('bob_222',same);
 const c=create({stored:alice});
 await c.init();
 c.storage.setItem('ps-account-session.v1',JSON.stringify(bob));
 c.helper.clearSession();
 assert.equal(JSON.parse(c.storage.getItem('ps-account-session.v1')).username,'bob_222');
 assert.equal(c.api.token(),null,'Only the stale local session was cleared');
});
test('stale same-owner session may not delete a fresher expiry with the same token',async()=>{
 const alice=session();
 const c=create({stored:alice});await c.init();
 c.storage.setItem('ps-account-session.v1',
  JSON.stringify({...alice,expires:alice.expires+600000}));
 c.helper.clearSession();
 assert.equal(JSON.parse(c.storage.getItem('ps-account-session.v1')).expires,
  alice.expires+600000);
});
test('cross-tab removal of another username with coincidentally same bearer is ignored',async()=>{
 const same='s'.repeat(43),alice=session('alice_01',same),
  bob=session('bob_222',same);
 const c=create({stored:alice});await c.init();
 c.emitStorage({key:'ps-account-session.v1',
  oldValue:JSON.stringify(bob),newValue:null});
 assert.equal(c.api.username(),'alice_01');
 assert.equal(c.events.logout.length,0);
 c.emitStorage({key:'ps-account-session.v1',
  oldValue:JSON.stringify(alice),newValue:null});
 assert.equal(c.api.isLoggedIn(),false);
 assert.equal(c.events.logout.length,1,
  'Matching owner and bearer still propagate revocation');
});

test('explicit sign-out revokes a same-owner bearer even with a newer expiry',async()=>{
 const alice=session(),c=create({stored:alice});await c.init();
 c.storage.setItem('ps-account-session.v1',
  JSON.stringify({...alice,expires:alice.expires+600000}));
 c.helper.clearSession({revokeMatchingOwner:true});
 assert.equal(c.storage.getItem('ps-account-session.v1'),null);
});
test('revocation cannot remove another user that reused the mock bearer',async()=>{
 const token='s'.repeat(43),alice=session('alice_01',token),
  bob=session('bob_222',token),c=create({stored:alice});
 await c.init();
 c.storage.setItem('ps-account-session.v1',JSON.stringify(bob));
 c.helper.clearSession({revokeMatchingOwner:true});
 assert.equal(JSON.parse(c.storage.getItem('ps-account-session.v1')).username,'bob_222');
});
test('both logout and verified bootstrap revocation invalidate matching owners',()=>{
 assert.match(original,/clearSession\(\{revokeMatchingOwner:true\}\);options\.onLogout/);
 assert.match(original,/clearSession\(\{revokeMatchingOwner:true\}\);\s*forceBootstrapRender=true/);
});

test('account update guard protects the one-time code without exposing it',()=>{
 const c=create();
 assert.equal(c.api.updateGuard(),null);
 c.helper.setSession({account:{username:'alice_01'},token:'a'.repeat(43),
  expires:Date.now()+3600000,recoveryCode:'r'.repeat(43)});
 assert.equal(c.api.updateGuard(),'recovery');
 assert.notEqual(c.api.updateGuard(),'r'.repeat(43));
 c.helper.clearSession();
 assert.equal(c.api.updateGuard(),null);
});

test('successful /me cannot be relabeled offline or replay local owner callback',async()=>{
 let activations=0;
 const c=create({stored:session(),
  fetchImpl:async()=>reply({username:'alice_01'}),
  onBootstrapLogin:()=>{activations++;throw Error('Local scope transition rejected')}});
 await assert.rejects(c.init(),/Local scope transition rejected/);
 assert.equal(activations,1,'Owner transition must not be invoked twice');
 assert.equal(c.events.login.length,1);
 assert.equal(c.events.logout.length,0);
 assert.equal(c.events.guest.length,0);
 assert.equal(c.trigger.getAttribute('data-account-bootstrap'),'verified',
  'LocalStorage failure is not a network /me failure');
 assert.equal(c.api.username(),'alice_01');
});

test('offline /me invokes the owner callback only once even if local scope fails',async()=>{
 let activations=0;
 const c=create({stored:session(),fetchImpl:async()=>reply({},503),
  onBootstrapLogin:()=>{activations++;throw Error('Local scope transition rejected')}});
 await assert.rejects(c.init(),/Local scope transition rejected/);
 assert.equal(activations,1);
 assert.equal(c.events.login.length,1);
 assert.equal(c.events.logout.length,0);
 assert.equal(c.trigger.getAttribute('data-account-bootstrap'),'offline');
 assert.equal(c.api.username(),'alice_01');
});

test('verified account clears the pending profile hint even if local owner recovery throws',async()=>{
 const c=create({stored:session(),onBootstrapLogin:()=>{
  throw Error('Owner cache is unavailable');
 }});
 let removed=0;
 c.panel.querySelector=selector=>selector==='.account-bootstrap-pending'?
  {remove(){removed++}}:null;
 c.panel.hasChildNodes=()=>true;
 await assert.rejects(c.init(),/Owner cache is unavailable/);
 assert.equal(removed,1,'The finalization path must run after failed owner activation');
 assert.equal(c.trigger.getAttribute('data-account-bootstrap'),'verified');
 assert.equal(c.events.login.length,1,'The failed callback must not be retried');
 assert.equal(c.events.logout.length,0);
});

test('offline account clears the pending profile hint after async owner failure',async()=>{
 const c=create({stored:session(),fetchImpl:async()=>reply({},503),
  onBootstrapLogin:async()=>{throw Error('Quota on account recovery')}});
 let removed=0;
 c.panel.querySelector=selector=>selector==='.account-bootstrap-pending'?
  {remove(){removed++}}:null;
 c.panel.hasChildNodes=()=>true;
 await assert.rejects(c.init(),/Quota on account recovery/);
 assert.equal(removed,1);
 assert.equal(c.trigger.getAttribute('data-account-bootstrap'),'offline');
 assert.equal(c.events.login.length,1);
});

test('failed guest-library initialization also completes profile cleanup',async()=>{
 const c=create({onBootstrapGuest:()=>{throw Error('Guest cache unavailable')}});
 let finalizations=0;
 c.panel.querySelector=selector=>selector==='.account-bootstrap-pending'?
  {remove(){finalizations++}}:null;
 c.panel.hasChildNodes=()=>true;
 await assert.rejects(c.init(),/Guest cache unavailable/);
 assert.equal(finalizations,1);
 assert.equal(c.trigger.getAttribute('data-account-bootstrap'),'guest');
 assert.equal(c.events.guest.length,1);
});

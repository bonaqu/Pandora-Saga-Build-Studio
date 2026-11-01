import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const original=readFileSync(new URL('../account-ui.js',import.meta.url),'utf8');
const script=original.replace(
 'root.PandoraAccountUI=Object.freeze(',
 'root.__accountTest=Object.freeze({setSession,clearSession});root.PandoraAccountUI=Object.freeze(');
assert.notEqual(script,original,'Test-only helper exposure must match the public module');

function deferred(){
 let resolve;const promise=new Promise(r=>{resolve=r});
 return {promise,resolve};
}
function create({stored=null,fetchImpl=async()=>({ok:true,status:200,
 json:async()=>({account:{username:'alice_01'}})})}={}){
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
 const trigger=element(),panel=element();
 const doc={documentElement:{lang:'ru'},createElement:element,
  getElementById:id=>id==='profileTrigger'?trigger:id==='accountPanel'?panel:null,
  addEventListener(){}};
 const root={},ctx={window:root,localStorage:storage,document:doc,
  fetch:fetchImpl,Date,console};
 vm.runInNewContext(script,ctx);
 const options={baseUrl:'https://example.invalid',
  onLogin:e=>events.login.push(e),onLogout:e=>events.logout.push(e),
  onGuest:e=>events.guest.push(e)};
 return {api:root.PandoraAccountUI,helper:root.__accountTest,events,
  init:()=>root.PandoraAccountUI.init(options),storage,trigger};
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

test('successful /me cannot silently rewrite the owner from Alice to Bob or guest',async()=>{
 for(const account of [{username:'bob_222'},{username:null},{},null]){
  const c=create({stored:session(),fetchImpl:async()=>reply(account)});
  await c.init();
  assert.equal(c.api.token(),null);
  assert.equal(c.events.login.length,0);
  assert.equal(c.events.logout.length,1);
  assert.equal(c.storage.getItem('ps-account-session.v1'),null);
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

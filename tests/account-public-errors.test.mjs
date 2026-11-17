import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../pandora-studio-account-ui.js',import.meta.url),'utf8');
const start=source.indexOf('const accountApiMessages=Object.freeze({');
const end=source.indexOf('function node(tag,cls=',start);
assert.ok(start>=0&&end>start,'Safe account API message dictionary must be present');
const dict=source.slice(start,end);
const localize=(lang)=>Function('document',dict+'\nreturn publicAccountError;')
 ({documentElement:{lang}});

test('known account API errors are localized exactly instead of exposing raw server English',()=>{
 const ru=localize('ru'),en=localize('en');
 const cases=[
  ['Invalid username or password','Неверный логин или пароль.'],
  ['Current password is incorrect','Неверный текущий пароль.'],
  ['Too many requests. Try later.','Слишком много попыток. Попробуй позже.'],
  ['Invalid username, recovery code or password','Неверный логин, резервный код или пароль.'],
  ['This username or library is already registered','Этот логин или библиотека уже зарегистрированы.']
 ];
 for(const [raw,translation] of cases){
  assert.equal(ru(raw,401),translation);
  assert.ok(en(raw,401)&&en(raw,401)!==translation);
 }
});

test('unrecognized and diagnostic account failures never become public messages',()=>{
 const ru=localize('ru'),en=localize('en');
 for(const text of ['D1 SQLITE worker failed on /api/admin/owner',
  'Cloudflare Worker exception: traceId=abcd','<script>alert(1)</script>',
  'Bearer my_secret_token','Internal server error in account database']){
  assert.equal(ru(text,500),'Сервис временно недоступен. Повтори попытку позже.');
  assert.equal(en(text,500),'Service temporarily unavailable. Try again later.');
  assert.equal(ru(text,400),'Сервис временно недоступен. Повтори попытку позже.');
 }
 assert.match(ru('',0),/соединение/i);
 assert.match(en('',0),/connect/i);
});

test('a stored account error follows RU/EN language changes without losing its meaning',()=>{
 const trStart=source.indexOf('const tr=value=>');
 const trEnd=source.indexOf('function node(tag,cls=',trStart);
 assert.ok(trStart>=0&&trEnd>trStart);
 const script=source.slice(trStart,trEnd);
 const doc={documentElement:{lang:'ru'}};
 const tr=Function('document','root',script+'\nreturn tr;')
  (doc,{PandoraUILocale:{ui:value=>value}});
 assert.equal(tr('Invalid username or password.'),'Неверный логин или пароль.');
 doc.documentElement.lang='en';
 assert.equal(tr('Неверный логин или пароль.'),'Invalid username or password.');
 assert.equal(tr('D1 SQLITE secrets'),'D1 SQLITE secrets',
  'Unrecognized response remains unknown to the authorial editor (request() filters it)');
});

test('account transport normalizes status codes and connection failures without revealing secrets',async()=>{
 const from=source.indexOf('async function request(kind,data=null,auth=token()){');
 const to=source.indexOf('\nfunction setSession(',from);
 assert.ok(from>=0&&to>from);
 const transport=source.slice(from,to);
 const make=(lang,fetch)=>Function('options','token','fetch','AbortSignal','publicAccountError',
  transport+'\nreturn request;')({baseUrl:'https://example.test'},()=>null,
  fetch,AbortSignal,localize(lang));
 const rejected=make('ru',async()=>({ok:false,status:401,
  json:async()=>({error:'Invalid username or password'})}));
 await assert.rejects(rejected('login',{username:'tester',password:'not-real'},null),
  error=>error.httpStatus===401&&error.message==='Неверный логин или пароль.');
 const hidden=make('en',async()=>({ok:false,status:503,
  json:async()=>({error:'D1 database secrets leaked'})}));
 await assert.rejects(hidden('login',{username:'tester',password:'not-real'},null),
  error=>error.httpStatus===503&&error.message==='Service temporarily unavailable. Try again later.');
 const offline=make('ru',async()=>{throw new TypeError('Failed to fetch: internal endpoint');});
 await assert.rejects(offline('login',{username:'tester',password:'not-real'},null),
  error=>error.httpStatus===0&&/Не удалось подключиться/.test(error.message));
});

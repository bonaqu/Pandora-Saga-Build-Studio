import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const app=read('pandora-studio-app.js'),locale={};
vm.runInNewContext(read('pandora-studio-ui-locale.js'),{window:locale});
const begin=app.indexOf('function cloudStatusText(message){');
const end=app.indexOf('function reportCloudStatus(message){',begin);
assert.ok(begin>=0&&end>begin,'Production cloud status formatter must be available');
const source=app.slice(begin,end);
const format=(signedIn,lang,message)=>Function('window','lang',
 source+'\nreturn cloudStatusText;')({
  PandoraAccountUI:{isLoggedIn:()=>signedIn},
  PandoraUILocale:locale.PandoraUILocale
 },lang)(message);

test('guest cloud status does not mislead visitors into thinking they are signed in',()=>{
 assert.equal(format(false,'ru','Облачная библиотека подключена'),
  'Гостевая облачная библиотека подключена');
 assert.equal(format(false,'en','Облачная библиотека подключена'),
  'Guest cloud library connected');
 assert.equal(format(true,'ru','Облачная библиотека подключена'),
  'Облачная библиотека подключена');
 assert.equal(format(true,'en','Облачная библиотека подключена'),
  'Cloud library connected');
});
test('temporary cloud errors and explicit statuses are not disguised as success',()=>{
 for(const signedIn of [true,false]){
  assert.equal(format(signedIn,'en','Локальные билды доступны · облако пока недоступно'),
   'Local builds available · cloud is currently unavailable');
  assert.equal(format(signedIn,'ru','Синхронизируем локальные изменения…'),
   'Синхронизируем локальные изменения…');
 }
});

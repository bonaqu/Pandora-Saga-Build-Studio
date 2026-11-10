import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import worker from '../worker/index.js';

const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};root.window=root;
runInNewContext(source('pandora-studio-ui-locale.js'),root);
const locale=root.PandoraUILocale;

test('account copy has stable bilingual semantic keys and independent D1 values',()=>{
 assert.ok(locale.keys().includes('accountGuestLead'));
 assert.equal(locale.fieldKey('accountGuestLead'),'ui.label.account-guest-lead');
 assert.equal(locale.copyLimit('accountSignIn'),90);
 assert.equal(locale.copyLimit('accountGuestLead'),90);
 assert.equal(locale.copyLimit('accountStorageWarning'),350);
 assert.equal(locale.literalKey('Логин и пароль — для доступа к сохранённым облачным билдам.'),
  'accountGuestLead');
 assert.equal(locale.literalKey('Пароли не совпадают.'),null,
  'Dynamic validation feedback is not owner-editable');
 assert.equal(locale.literalKey('Некорректный ответ авторизации'),null,
  'Security diagnostics are not owner-editable');
 const key='guideedit.book.ui.label.account-guest-lead';
 locale.setOverrides({[key]:JSON.stringify({
  ru:'Вход открывает облачные билды.',en:'Sign in to open cloud builds.'
 })});
 assert.equal(locale.ui('Логин и пароль — для доступа к сохранённым облачным билдам.','ru'),
  'Вход открывает облачные билды.');
 assert.equal(locale.ui('Логин и пароль — для доступа к сохранённым облачным билдам.','en'),
  'Sign in to open cloud builds.');
 assert.equal(locale.baseText('accountGuestLead','ru'),
  'Логин и пароль — для доступа к сохранённым облачным билдам.');
 assert.equal(locale.baseText('accountGuestLead','en'),
  'Your username and password give access to your saved cloud builds.');
 assert.equal(locale.ui('Пароли не совпадают.','en'),'Passwords do not match.');
 locale.setOverrides({[key]:JSON.stringify({ru:'x'.repeat(91),en:'y'.repeat(91)})});
 assert.equal(locale.text('accountGuestLead','ru'),
  'Логин и пароль — для доступа к сохранённым облачным билдам.');
 locale.setOverrides({});
 assert.equal(locale.ui('Логин и пароль — для доступа к сохранённым облачным билдам.','en'),
  'Your username and password give access to your saved cloud builds.');
});

test('account long RU/EN help text is editable without losing bundled defaults',()=>{
 const id=locale.fieldKey('accountStorageWarning');
 const before=locale.text('accountStorageWarning','ru');
 assert.ok(before.length>100);
 locale.setOverrides({['guideedit.book.'+id]:JSON.stringify({
  ru:'Новый текст. '.repeat(17),en:'Updated explanation.'})});
 assert.match(locale.text('accountStorageWarning','ru'),/^Новый текст/);
 assert.equal(locale.text('accountStorageWarning','en'),'Updated explanation.');
 locale.setOverrides({['guideedit.book.'+id]:JSON.stringify({ru:'x'.repeat(351)})});
 assert.equal(locale.text('accountStorageWarning','ru'),before);
 locale.setOverrides({});
});

test('owner change review compares D1 copy against immutable RU/EN defaults',()=>{
 runInNewContext(source('pandora-studio-owner-change-review.js'),root);
 const key='accountGuestLead',record='guideedit.book.'+locale.fieldKey(key);
 const edit={ru:'Отредактированный текст',en:'Edited text'};
 locale.setOverrides({[record]:JSON.stringify(edit)});
 const ru=root.PandoraOwnerChangeReview.inspect(record,JSON.stringify(edit),{lang:'ru'});
 const en=root.PandoraOwnerChangeReview.inspect(record,JSON.stringify(edit),{lang:'en'});
 assert.match(ru.title,/Логин и пароль/);
 assert.match(en.title,/Your username and password/);
 assert.equal(ru.changes.find(x=>x.field==='Текст RU').before,
  locale.baseText(key,'ru'));
 assert.equal(en.changes.find(x=>x.field==='English text').before,
  locale.baseText(key,'en'));
 assert.equal(en.changes.find(x=>x.field==='English text').after,'Edited text');
 locale.setOverrides({});
});

test('account copy input marks only authored text, not secret value controls',()=>{
 const account=source('pandora-studio-account-ui.js');
 const app=source('pandora-studio-app.js');
 assert.match(account,/root\.PandoraUILocale\?\.literalKey\?\.\(text\)/);
 assert.match(account,/setAttribute\?\.\('data-owner-copy-key',key\)/);
 assert.match(account,/options\?\.onCopyReady\?\.\(panel\)/);
 assert.match(app,/function bindAccountCopyEditors\(panel\)/);
 assert.match(app,/onCopyReady:bindAccountCopyEditors/);
 assert.match(app,/class:'ui-content-edit-host account-copy-edit-host'/);
 assert.match(app,/node\.addEventListener\('dblclick',edit\)/);
 assert.match(app,/saveGuidePatch\('book\.'\+id,\{\[lang\]:next\}\)/);
 assert.doesNotMatch(account,/input\.setAttribute\('data-owner-copy-key'/);
});

test('Worker book content validation supports long account paragraphs without html execution',async()=>{
 const key='guideedit.book.ui.label.account-guest-lead';
 let stored=null;
 const DB={prepare(sql){let args=[];
  return {bind(...v){args=v;return this},
   first:async()=>({id:1}),run:async()=>{
    if(sql.startsWith('INSERT INTO overrides')&&stored===null){
     stored=args[1];return{meta:{changes:1}}
    }
    return{meta:{changes:0}}
   }};
 }};
 const req=(value,expectedValue=null)=>new Request(
  'https://ps-build-studio-cloud.bonaqu.workers.dev/api/admin/override',{
   method:'POST',
   headers:{Origin:'https://bonaqu.github.io',Authorization:'Bearer '+'a'.repeat(43)},
   body:JSON.stringify({key,value,expectedValue})
  });
 const good=JSON.stringify({ru:'Короткий текст',en:'Short copy'});
 const created=await worker.fetch(req(good),{DB});
 assert.equal(created.status,200,await created.clone().text());
 assert.equal(stored,good);
 assert.equal((await worker.fetch(req(JSON.stringify({ru:'x'.repeat(361)})),{DB})).status,400);
 assert.equal((await worker.fetch(req(JSON.stringify({script:'<script>alert(1)</script>'})),{DB})).status,400);
});

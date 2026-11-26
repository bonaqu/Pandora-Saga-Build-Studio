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

test('only explicit harmless profile feedback is editable; diagnostics remain immutable',()=>{
 for(const [key,ru,en] of [
  ['accountCodeCopied','Код скопирован','Code copied'],
  ['accountCopyCodeManually','Скопируйте выделенный код','Copy the selected code'],
  ['accountCodeHidden','Резервный код скрыт.','Recovery code hidden.']
 ]){
  assert.equal(locale.literalKey(ru),key);
  assert.equal(locale.text(key,'en'),en);
  assert.equal(locale.ui(ru,'en'),en);
  assert.ok(locale.fieldKey(key)?.startsWith('ui.label.account-'));
  const field='guideedit.book.'+locale.fieldKey(key);
  locale.setOverrides({[field]:JSON.stringify({ru:'Новая надпись',en:'Edited profile copy'})});
  assert.equal(locale.ui(ru,'ru'),'Новая надпись');
  assert.equal(locale.ui(ru,'en'),'Edited profile copy');
  locale.setOverrides({});
 }
 for(const raw of ['Пароли не совпадают.','Некорректный ответ авторизации',
  'Ошибка сервера','Cloud temporarily unavailable']){
  assert.equal(locale.literalKey(raw),null,'Security/server error must never be owner editable');
 }
 const code=source('pandora-studio-account-ui.js');
 const app=source('pandora-studio-app.js');
 assert.match(code,/feedbackAuthoredKey=authored\?/);
 assert.match(code,/if\(feedbackAuthoredKey\)errorLine\.dataset\.ownerCopyKey/);
 assert.match(code,/else errorLine\.removeAttribute\('data-owner-copy-key'\)/);
 assert.match(code,/info\('Код скопирован',true\)/);
 assert.match(code,/info\('Скопируйте выделенный код',true\)/);
 assert.match(code,/info\('Резервный код скрыт\.',true\)/);
 assert.match(code,/info\(e\.message\)/,'Raw errors never opt into status editing');
 assert.match(app,/node\.addEventListener\('dblclick',edit\)/);
 assert.doesNotMatch(app,/class:'ui-content-pencil account-copy-pencil'/);
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

test('#390 owner account copy cleans only its own keyboard affordances on logout',()=>{
 const app=source('pandora-studio-app.js');
 const block=app.slice(app.indexOf('function bindAccountCopyEditors(panel){'),
  app.indexOf('// Release notices are mounted asynchronously',
   app.indexOf('function bindAccountCopyEditors(panel){')));
 assert.match(block,/node\.classList\.toggle\('ui-content-editable',enabled&&!isAction\)/);
 assert.match(block,/node\.dataset\.accountCopyTabAdded==='1'/);
 assert.match(block,/node\.dataset\.accountCopyShortcutAdded==='1'/);
 assert.match(block,/if\(!isAction&&!node\.hasAttribute\('tabindex'\)\)/);
 assert.match(block,/if\(!node\.hasAttribute\('aria-keyshortcuts'\)\)/);
 assert.match(block,/node\.dataset\.accountCopyShortcutAdded='1'/);
 assert.match(block,/node\.removeAttribute\('aria-keyshortcuts'\)/);
 assert.match(block,/node\.removeAttribute\('tabindex'\)/);
 assert.doesNotMatch(block,/else if\(!isAction&&node\.tabIndex===0\)node\.removeAttribute/);
 assert.doesNotMatch(block,/class:'account-copy-pencil'/);
});

test('#390 owner-only account F2 and tabindex behave correctly across enable/disable/re-enable',()=>{
 const app=source('pandora-studio-app.js');
 const begin=app.indexOf('function bindAccountCopyEditors(panel){');
 const end=app.indexOf('// Release notices are mounted asynchronously',begin);
 assert.ok(begin>=0&&end>begin);
 const scope={
  adminEditing:true,adminToken:'test-owner',window:{
   PandoraUILocale:{fieldKey:key=>key==='accountGuestLead'?'ui.label.account-guest-lead':null}
  },
  bindOwnerTouchCaption(){},
  ownerCaptionActionGuard(){}
 };
 const bind=runInNewContext('('+app.slice(begin,end)+')',scope);
 function fakeNode(authorTabIndex=false){
  const attrs=new Map(authorTabIndex?[['tabindex','0']]:[]),listeners=[];
  const node={
   dataset:{ownerCopyKey:'accountGuestLead'},
   classList:{toggle(){}},
   nextElementSibling:null,
   matches(){return false},
   closest(){return null},
   getAttribute(name){return name==='data-owner-copy-key'?'accountGuestLead':attrs.get(name)??null},
   setAttribute(name,value){attrs.set(name,String(value))},
   removeAttribute(name){attrs.delete(name)},
   hasAttribute(name){return attrs.has(name)},
   addEventListener(name,fn){listeners.push([name,fn])},
   set tabIndex(n){attrs.set('tabindex',String(n))},
   get tabIndex(){return attrs.has('tabindex')?Number(attrs.get('tabindex')):-1}
  };
  return {node,attrs,listeners};
 }
 for(const original of [true,false]){
  const {node,attrs,listeners}=fakeNode(original);
  const panel={id:'accountPanel',querySelectorAll:()=>[node]};
  bind(panel);
  assert.equal(attrs.get('aria-keyshortcuts'),'F2');
  assert.equal(attrs.get('tabindex'),'0');
  assert.equal(node.dataset.accountCopyTabAdded,original?undefined:'1');
  assert.equal(node.dataset.accountCopyShortcutAdded,'1');
  assert.equal(listeners.length,2,'Only one dblclick and keydown listener');
  scope.adminEditing=false;
  bind(panel);
  assert.equal(attrs.has('aria-keyshortcuts'),false,
   'A normal visitor must not see an owner-only F2 hint');
  assert.equal(attrs.has('tabindex'),original,
   'Author tabindex survives, owner-added tabindex is cleared');
  scope.adminEditing=true;
  bind(panel);
  assert.equal(attrs.get('aria-keyshortcuts'),'F2');
  assert.equal(attrs.get('tabindex'),'0');
  assert.equal(listeners.length,2,'Re-entering owner mode never duplicates listeners');
 }
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
 assert.match(app,/saveGuidePatch\('book\.'\+id,\{\[editLang\]:next\}\)/);
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

test('ambiguous library action captions never hijack another D1 label key',()=>{
 const direct='guideedit.book.'+locale.fieldKey('libraryCardOpen');
 const generic='guideedit.book.'+locale.fieldKey('libraryOpen');
 const cardDelete='guideedit.book.'+locale.fieldKey('libraryCardDelete');
 assert.notEqual(direct,generic);
 assert.equal(locale.literalKey('Открыть'),null);
 assert.equal(locale.literalKey('Удалить'),null);
 assert.equal(locale.ui('Открыть','en'),'Open');
 assert.equal(locale.ui('Удалить','en'),'Delete');
 locale.setOverrides({
  [direct]:JSON.stringify({ru:'Карточка: открыть',en:'Open card'}),
  [generic]:JSON.stringify({ru:'Открыть из списка',en:'Open from list'}),
  [cardDelete]:JSON.stringify({ru:'Карточка: удалить',en:'Delete card'})
 });
 assert.equal(locale.text('libraryCardOpen','ru'),'Карточка: открыть');
 assert.equal(locale.text('libraryOpen','ru'),'Открыть из списка');
 assert.equal(locale.text('libraryCardDelete','en'),'Delete card');
 assert.equal(locale.ui('Открыть','ru'),'Открыть',
  'Unkeyed generic copy must not accidentally use a card-only override');
 assert.equal(locale.ui('Удалить','ru'),'Удалить');
 locale.setOverrides({});
});

test('D1 UI save, Undo and reset patch live account and cloud status without remount',()=>{
 const app=source('pandora-studio-app.js');
 const refresh=app.slice(app.indexOf('function refreshVisibleUICopy('),
  app.indexOf('// An Origin copy Undo',app.indexOf('function refreshVisibleUICopy(')));
 assert.match(refresh,/const isAccount=recordKey\.startsWith\('guideedit\.book\.ui\.label\.account-'\)/);
 assert.match(refresh,/#accountPanel \[data-owner-copy-key\]/);
 assert.match(refresh,/if\(isStatus\)\{[\s\S]*?syncCloudStatusNode\(cloud,cloudLibraryStatus\)/);
 assert.match(refresh,/ownerDockPatchText\(node,value\)/);
 assert.doesNotMatch(refresh,/renderBuilds\(|PandoraAccountUI\?\.refresh/);
 const undo=app.slice(app.indexOf('async function undoOwnerEdit()'),
  app.indexOf('function showOverrideManager()'));
 const reset=app.slice(app.indexOf("const resetButton=event.currentTarget;"),
  app.indexOf('refreshOwnerUI();',app.indexOf('if(body.isConnected)draw();'))+20);
 assert.match(undo,/refreshVisibleUICopy\(last\.key\)/);
 assert.doesNotMatch(undo,/PandoraAccountUI\?\.refresh\?\.\(\)/);
 assert.match(reset,/refreshVisibleUICopy\(record\.key\)/);
 assert.doesNotMatch(reset,/PandoraAccountUI\?\.refresh\?\.\(\)/);
 const cloud=app.slice(app.indexOf('function syncCloudStatusNode('),
  app.indexOf('function reportCloudStatus('));
 assert.match(cloud,/ownerDockPatchText\(node,cloudStatusText\(message\)\)/);
 assert.match(cloud,/node\.nextElementSibling\?\.classList\?\.contains\('ui-content-edit-host'\)/);
});

test('compiled D1 UI text is parsed once, then invalidated on save, Undo and reset',()=>{
 // This isolated sandbox counts actual JSON parses made by the production
 // locale resolver, not textual references to the implementation.
 let parses=0;
 const sandbox={JSON:{parse(value){parses++;return JSON.parse(value)}}};
 sandbox.window=sandbox;
 runInNewContext(source('pandora-studio-ui-locale.js'),sandbox);
 const ui=sandbox.PandoraUILocale;
 const field='guideedit.book.'+ui.fieldKey('libraryShareCreated');
 const overrides={[field]:JSON.stringify({ru:'Ссылка готова.',en:'Link is ready.'})};
 ui.setOverrides(overrides);
 for(let n=0;n<200;n++){
  assert.equal(ui.text('libraryShareCreated','ru'),'Ссылка готова.');
  assert.equal(ui.text('libraryShareCreated','en'),'Link is ready.');
 }
 assert.equal(parses,1,'Hundreds of UI redraws must not reparse identical D1 JSON');
 assert.equal(ui.fieldKey('libraryShareCreated'),'ui.label.library-share-created');
 assert.equal(ui.fieldKey('not-a-registered-label'),null);
 // The real owner editor mutates the same overrides object on CAS. Calling
 // setOverrides with that identity must still invalidate the parsed record.
 overrides[field]=JSON.stringify({ru:'После правки.',en:'Edited after save.'});
 ui.setOverrides(overrides);
 assert.equal(ui.text('libraryShareCreated','en'),'Edited after save.');
 assert.equal(parses,2);
 overrides[field]=JSON.stringify({ru:'После Undo.',en:'After undo.'});
 ui.setOverrides(overrides);
 assert.equal(ui.text('libraryShareCreated','ru'),'После Undo.');
 assert.equal(parses,3);
 delete overrides[field];ui.setOverrides(overrides);
 assert.equal(ui.text('libraryShareCreated','en'),'Build link created.');
 assert.equal(parses,3,'Reset uses bundled fallback without parsing absent overrides');
 overrides[field]='{invalid JSON';
 ui.setOverrides(overrides);
 assert.equal(ui.text('libraryShareCreated','ru'),'Ссылка на билд создана.');
 assert.equal(ui.text('libraryShareCreated','en'),'Build link created.');
 assert.equal(parses,4,'Malformed D1 JSON is rejected once per refresh');
 assert.equal(ui.literalKey('Неверный пароль.'),null,
  'Runtime security errors cannot become editor fields');
});

test('#390 account icon F2 selects the actual guest or signed-in semantic D1 identity',()=>{
 const account=source('pandora-studio-account-ui.js');
 const app=source('pandora-studio-app.js');
 assert.equal(locale.fieldKey('accountProfileTitle'),'ui.label.account-profile-title');
 assert.match(account,/const key=session\?'accountProfileTitle':'profileAccess'/);
 assert.match(account,/trigger\.setAttribute\('data-i18n-title',key\)/);
 assert.match(account,/trigger\.setAttribute\('data-i18n-aria-label',key\)/);
 assert.equal((account.match(/syncTriggerCopy\(\);/g)||[]).length,2);
 assert.match(app,/const currentKey=node\.dataset\.i18nTitle,id=locale\.fieldKey\(currentKey\)/);
 assert.match(account,/session\?tr\('Профиль'\)\+' · '\+session\.username/);
});

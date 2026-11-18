import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../pandora-studio-ui-locale.js',import.meta.url),'utf8');
const scope={};scope.window=scope;runInNewContext(source,scope);
const locale=scope.PandoraUILocale;
test('exact user interface keys translate to English without rewriting unknown game names',()=>{
 assert.equal(locale.text('heroLevel','en'),'Hero level');
 assert.equal(locale.ui('Подтвердить перезапись','en'),'Confirm overwrite');
 assert.equal(locale.ui('Создать аккаунт','en'),'Create account');
 assert.equal(locale.ui('Отмена','ru'),'Отмена');
 assert.equal(locale.ui('Доспех тьмы','en'),'Доспех тьмы');
 assert.equal(locale.text('path','ru'),'Путь героя');
 assert.equal(locale.text('wiki','ru'),'📜 Энциклопедия');
 assert.equal(locale.text('wiki','en'),'📜 Encyclopedia');
});
test('all registered static interface labels support independent RU/EN D1 overrides',()=>{
 assert.ok(locale.keys().length>=50);
 const known=locale.fieldKey('heroLevel');
 assert.equal(known,'ui.label.hero-level');
 assert.equal(locale.fieldKey('unknown'),null);
 locale.setOverrides({['guideedit.book.'+known]:JSON.stringify({
  ru:'Уровень приключенца',en:'Adventurer level'
 })});
 assert.equal(locale.text('heroLevel','ru'),'Уровень приключенца');
 assert.equal(locale.text('heroLevel','en'),'Adventurer level');
 assert.equal(locale.text('wiki','ru'),'📜 Энциклопедия');
 // Invalid payloads must never erase the bundled fallback.
 locale.setOverrides({['guideedit.book.'+known]:'{invalid'});
 assert.equal(locale.text('heroLevel','ru'),'Уровень героя');
 locale.setOverrides({['guideedit.book.'+known]:JSON.stringify({
  ru:'',en:'x'.repeat(91)})});
 assert.equal(locale.text('heroLevel','ru'),'Уровень героя');
 assert.equal(locale.text('heroLevel','en'),'Hero level');
 locale.setOverrides({});
});

test('D1 edits update already mounted labels and accessibility attributes on locale apply',()=>{
 const label={dataset:{i18n:'heroLevel'},textContent:''};
 const action={dataset:{i18nAriaLabel:'profileAccess'},attrs:{},
  setAttribute(key,value){this.attrs[key]=value}};
 const doc={documentElement:{lang:'ru'},querySelectorAll(selector){
  if(selector==='[data-i18n]')return [label];
  if(selector==='[data-i18n-aria-label]')return [action];
  return [];
 }};
 locale.setOverrides({
  'guideedit.book.ui.label.hero-level':JSON.stringify({
   ru:'Уровень героя 🗡',en:'Hero level 🗡'}),
  'guideedit.book.ui.label.profile-access':JSON.stringify({
   ru:'Вход на сайт',en:'Sign in to the site'})
 });
 locale.apply('ru',doc);
 assert.equal(label.textContent,'Уровень героя 🗡');
 assert.equal(action.attrs['aria-label'],'Вход на сайт');
 locale.apply('en',doc);
 assert.equal(label.textContent,'Hero level 🗡');
 assert.equal(action.attrs['aria-label'],'Sign in to the site');
 locale.setOverrides({});
});

test('update banner copy has semantic D1 keys, independent languages and safe limits',()=>{
 const keys=['siteUpdateNotice','siteUpdateConnection','siteUpdateEditor',
  'siteUpdateFinish','siteUpdateApply','siteUpdateLater'];
 for(const key of keys){
  assert.ok(locale.keys().includes(key),key);
  assert.match(locale.fieldKey(key),/^ui[.]label[.]site-update-/);
 }
 assert.equal(locale.copyLimit('siteUpdateNotice'),350);
 assert.equal(locale.copyLimit('siteUpdateFinish'),350);
 assert.equal(locale.copyLimit('siteUpdateApply'),90);
 const code='guideedit.book.'+locale.fieldKey('siteUpdateNotice');
 locale.setOverrides({[code]:JSON.stringify({
  ru:'Новая версия, безопасно обновляем героя',
  en:'New version, safe character update'
 })});
 assert.equal(locale.text('siteUpdateNotice','ru'),
  'Новая версия, безопасно обновляем героя');
 assert.equal(locale.text('siteUpdateNotice','en'),
  'New version, safe character update');
 assert.equal(locale.text('siteUpdateLater','ru'),'Позже');
 locale.setOverrides({});
});

test('repeated locale application is a no-op and preserves living owner input',()=>{
 const mutations=[];
 const caption={dataset:{i18n:'heroLevel'},textContent:'Уровень героя',
  matches(){return false},querySelector(){return null}};
 const editing={dataset:{i18n:'appearance'},textContent:'Несохранённая правка',
  matches(){return true},querySelector(){return null}};
 const sibling={dataset:{i18n:'wiki'},textContent:'Текст до сохранения',
  nextElementSibling:{classList:{contains:name=>name==='ui-content-edit-host'}}};
 const aria={dataset:{i18nAriaLabel:'profileAccess'},
  getAttribute:key=>key==='aria-label'?'Войти или зарегистрироваться':null,
  setAttribute:(key,value)=>mutations.push([key,value])};
 const doc={documentElement:{lang:'ru'},querySelectorAll(selector){
  if(selector==='[data-i18n]')return [caption,editing,sibling];
  if(selector==='[data-i18n-aria-label]')return [aria];
  return [];
 }};
 const old=Object.getOwnPropertyDescriptor(caption,'textContent');
 let writes=0,value=caption.textContent;
 Object.defineProperty(caption,'textContent',{get:()=>value,set:v=>{writes++;value=v}});
 locale.apply('ru',doc);
 locale.apply('ru',doc);
 assert.equal(writes,0);
 assert.deepEqual(mutations,[]);
 assert.equal(editing.textContent,'Несохранённая правка');
 assert.equal(sibling.textContent,'Текст до сохранения');
 locale.apply('en',doc);
 assert.equal(caption.textContent,'Hero level');
 assert.equal(writes,1);
 assert.equal(editing.textContent,'Несохранённая правка');
 assert.equal(sibling.textContent,'Текст до сохранения');
 assert.deepEqual(mutations,[['aria-label','Sign in or register']]);
 if(old)Object.defineProperty(caption,'textContent',old);
});

test('static locale attributes update without touching user input values',()=>{
 const element={dataset:{i18nPlaceholder:'findSkill',i18nAriaLabel:'profileAccess'},
  attrs:{value:'My personal character'},setAttribute(k,v){this.attrs[k]=v;}};
 const language={lang:'ru'},doc={documentElement:language,
  querySelectorAll(selector){
   if(selector==='[data-i18n-placeholder]'||selector==='[data-i18n-aria-label]')return [element];
   return [];
  }};
 locale.apply('en',doc);
 assert.equal(language.lang,'en');
 assert.equal(element.attrs.placeholder,'Find a skill');
 assert.equal(element.attrs['aria-label'],'Sign in or register');
 assert.equal(element.attrs.value,'My personal character');
 locale.apply('ru',doc);
 assert.equal(element.attrs.placeholder,'Найти умение');
});

test('locale markers never replace the dynamic racial passive selection element',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/<div class="subhead origin-passive-heading"><span data-i18n="racePassive">/);
 assert.match(html,/<span id="originRaceName" data-i18n="chooseOne">/);
 assert.doesNotMatch(html,/origin-passive-heading" data-i18n=/);
});

test('account session verification preserves local identity on temporary failures',()=>{
 const source=readFileSync(new URL('../pandora-studio-account-ui.js',import.meta.url),'utf8');
 assert.match(source,/error\.httpStatus=response\.status/);
 assert.match(source,/httpStatus===401\|\|error\?\.httpStatus===403/);
 assert.match(source,/options\.onLogin\?\.\(\{register:false,bootstrap:true\}\)/);
});

test('the account UI validates new password confirmation for both password change and recovery',()=>{
 const source=readFileSync(new URL('../pandora-studio-account-ui.js',import.meta.url),'utf8');
 assert.match(source,/const update=button\('Изменить пароль'/);
 assert.match(source,/fresh\.value!==confirmFresh\.value/);
 assert.match(source,/mode==='register'\|\|mode==='recover'/);
 assert.match(source,/pass\.value!==confirm\.value/);
 assert.match(source,/input\.setAttribute\('aria-label',tr\(placeholder\)\)/);
});

test('administrator entry remains hidden from ordinary players',()=>{
 const account=readFileSync(new URL('../pandora-studio-account-ui.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
 const worker=readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
 assert.doesNotMatch(account,/adminEntry|onAdministratorLogin|Вход администратора/);
 assert.match(app,/ownerClicks>=5/);
 assert.match(app,/event\.ctrlKey&&event\.altKey&&event\.shiftKey&&event\.code==='KeyP'/);
 assert.match(worker,/path==='\/api\/admin\/login'/);
 assert.match(worker,/if\(path\.startsWith\('\/api\/account\/'\)\)/);
});

test('English equipment labels retain original source text solely for numeric fallback',()=>{
 const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
 const calc=readFileSync(new URL('../pandora-os-character-calculator.js',import.meta.url),'utf8');
 assert.match(app,/const translate=\(original,map,keepSourceDesc=false\)=>/);
 assert.match(app,/keepSourceDesc\?\{sourceDesc:item\.desc\}:\{\}/);
 assert.match(app,/equipment:translate\(itemRecords,en\?\.items,true\)/);
 assert.match(app,/PandoraStudioItemOwnerEditor\.applyItems\(catalogSource\.items,override\)/);
 assert.match(app,/const localizedSouls=translate\(ownerGameData\.souls,en\?\.souls\)/);
 assert.match(app,/sourceNameRu:typeof raw\?\.name==='string'\?raw\.name:''/);
 assert.match(app,/souls:localizedSouls,racialPassives/);
 assert.match(calc,/const description=record\?\.sourceDesc\?\?record\?\.desc/);
});

test('password editor validates clicks just like native form submission',()=>{
 const account=readFileSync(new URL('../pandora-studio-account-ui.js',import.meta.url),'utf8');
 assert.match(account,/if\(!form\.reportValidity\(\)\)return/);
 assert.match(account,/fresh\.value!==confirmFresh\.value/);
 assert.match(account,/\.account-form input/);
 assert.match(account,/if\(message!==null\)info\(message\)/);
});

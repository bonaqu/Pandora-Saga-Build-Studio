import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../ui-locale.js',import.meta.url),'utf8');
const scope={};scope.window=scope;runInNewContext(source,scope);
const locale=scope.PandoraUILocale;
test('exact user interface keys translate to English without rewriting unknown game names',()=>{
 assert.equal(locale.text('heroLevel','en'),'Hero level');
 assert.equal(locale.ui('Подтвердить перезапись','en'),'Confirm overwrite');
 assert.equal(locale.ui('Создать аккаунт','en'),'Create account');
 assert.equal(locale.ui('Отмена','ru'),'Отмена');
 assert.equal(locale.ui('Доспех тьмы','en'),'Доспех тьмы');
 assert.equal(locale.text('path','ru'),'Путь героя');
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
 const source=readFileSync(new URL('../account-ui.js',import.meta.url),'utf8');
 assert.match(source,/error\.httpStatus=response\.status/);
 assert.match(source,/httpStatus===401\|\|error\?\.httpStatus===403/);
 assert.match(source,/options\.onLogin\?\.\(\{register:false,bootstrap:true\}\)/);
});

test('the account UI validates new password confirmation for both password change and recovery',()=>{
 const source=readFileSync(new URL('../account-ui.js',import.meta.url),'utf8');
 assert.match(source,/const update=button\('Изменить пароль'/);
 assert.match(source,/fresh\.value!==confirmFresh\.value/);
 assert.match(source,/mode==='register'\|\|mode==='recover'/);
 assert.match(source,/pass\.value!==confirm\.value/);
 assert.match(source,/input\.setAttribute\('aria-label',tr\(placeholder\)\)/);
});

test('administrator entry remains hidden from ordinary players',()=>{
 const account=readFileSync(new URL('../account-ui.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const worker=readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
 assert.doesNotMatch(account,/adminEntry|onAdministratorLogin|Вход администратора/);
 assert.match(app,/ownerClicks>=5/);
 assert.match(app,/event\.ctrlKey&&event\.altKey&&event\.shiftKey&&event\.code==='KeyP'/);
 assert.match(worker,/path==='\/api\/admin\/login'/);
 assert.match(worker,/if\(path\.startsWith\('\/api\/account\/'\)\)/);
});

test('English equipment labels retain original source text solely for numeric fallback',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const calc=readFileSync(new URL('../os-calculator.js',import.meta.url),'utf8');
 assert.match(app,/const translate=\(original,map,keepSourceDesc=false\)=>/);
 assert.match(app,/keepSourceDesc\?\{sourceDesc:item\.desc\}:\{\}/);
 assert.match(app,/equipment:translate\(catalogSource\.items,en\?\.items,true\)/);
 assert.match(app,/souls:translate\(catalogSource\.souls,en\?\.souls\)/);
 assert.match(calc,/const description=record\?\.sourceDesc\?\?record\?\.desc/);
});

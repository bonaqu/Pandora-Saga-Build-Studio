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

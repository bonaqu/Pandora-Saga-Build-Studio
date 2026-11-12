import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const method=app.slice(app.indexOf('function editWikiValue('),app.indexOf('// Repeated blur saves',app.indexOf('function editWikiValue(')));

test('all owner fields have an explicit non-reentrant contenteditable guard',()=>{
 assert.match(method,/node\.querySelector\('input,select,textarea,\[data-owner-text-field\]'\)/);
 assert.match(method,/if\(!adminEditing\|\|!adminToken/);
 assert.match(method,/node\.replaceChildren\(control\);control\.focus\(\)/);
 assert.doesNotMatch(method,/node\.querySelector\('input,select,textarea'\)/);
});

test('async D1 save locks the real contenteditable field and reports busy state',()=>{
 assert.match(method,/control\.matches\('\[data-owner-text-field\]'\)/);
 assert.match(method,/control\.setAttribute\('contenteditable','false'\)/);
 assert.match(method,/control\.setAttribute\('aria-disabled','true'\)/);
 assert.match(method,/node\.setAttribute\('aria-busy','true'\)/);
 assert.match(method,/if\(saving\)\{e\.preventDefault\(\);e\.stopPropagation\(\);return\}/);
 assert.match(method,/control\.disabled=true/,'number or select controls retain native disabled semantics');
});

test('CAS rejection restores the same draft and editability with a local accessible error',()=>{
 assert.match(method,/control\.setAttribute\('contenteditable','plaintext-only'\)/);
 assert.match(method,/control\.removeAttribute\('aria-disabled'\)/);
 assert.match(method,/node\.removeAttribute\('aria-busy'\)/);
 assert.match(method,/class:'ui-content-inline-error',role:'alert'/);
 assert.match(method,/ownerSay\('Не сохранено: ','Not saved: '\)/);
 assert.match(method,/inlineError\(message\)/);
 assert.match(method,/ownerSay\('Некорректная длина текста'/);
 assert.match(method,/ownerSay\('Выбери значение','Choose a value'\)/);
 assert.match(method,/node\.replaceChildren\(\.\.\.visibleNodes\)/);
 assert.doesNotMatch(method,/else showStudioToast\('Не сохранено:/,
  'Transient global toast must not replace the active inline editor');
});

test('failure message is readable in all owner screens, not only inside a toast',()=>{
 const css=read('pandora-studio-owner-inline-ui.css');
 assert.match(css,/\.ui-content-inline-error\{[\s\S]*?white-space:pre-wrap/);
 assert.match(css,/#studioToast \.ui-content-inline-error/);
 const browser=read('tests/browser-ui-content-inline.mjs');
 assert.match(browser,/bookHint\.dblclick\(\)/);
 assert.match(browser,/slowWrites\.add\('guideedit\.book\.summary\.group\.0'\)/);
 assert.match(browser,/nextConflicts\.add\('guideedit\.book\.summary\.group\.0'\)/);
 assert.match(browser,/failedBook\.getAttribute\('contenteditable'\)/);
});

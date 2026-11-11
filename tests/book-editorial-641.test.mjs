import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

const root={};
Function('window',file('pandora-studio-hero-book.js'))(root);
Function('window',file('pandora-studio-ui-locale.js'))(root);
const book=root.PandoraStageAttributes,locale=root.PandoraUILocale;

test('each exact Hero Book RU/EN caption has a distinct stable, server-compatible D1 key',()=>{
 const entries=Object.entries(book.bookEditorialDefaults);
 assert.ok(entries.length>=150,'All source-authored static Book pairs must be mapped');
 const keys=entries.map(([ru])=>book.bookEditorialKey(ru));
 assert.equal(new Set(keys).size,entries.length,'No key collision');
 for(const [ru,en] of entries){
  const key=book.bookEditorialKey(ru);
  assert.match(key,/^book-[a-z0-9-]+-[a-f0-9]{8}$/);
  const d1Key=locale.fieldKey(key);
  assert.match(d1Key,/^ui\.label\.book-[a-z0-9-]+$/);
  assert.ok(d1Key.length<=80);
  assert.equal(locale.bookFieldKey(ru),key);
  assert.equal(locale.text(key,'ru'),ru);
  assert.equal(locale.text(key,'en'),en);
  assert.ok(locale.keys().includes(key));
 }
 assert.equal(book.bookEditorialKey('Пользовательский ник'),null);
 assert.equal(locale.bookFieldKey('Уникальное имя пользователя'),null);
 assert.equal(locale.bookFieldKey('ATK 1927'),null);
});

test('Book D1 edits are bilingual, scoped, read-only for unknown values, and reversible',()=>{
 const ru='Все настройки применяются к текущему билду сразу. Числа обновляются в остальных главах книги.';
 const key=locale.bookFieldKey(ru);
 assert.ok(key);
 const d1='guideedit.book.'+locale.fieldKey(key);
 const en=locale.text(key,'en');
 locale.setOverrides({[d1]:JSON.stringify({ru:'Пояснение QA · настройки',en:'Settings QA · apply now'})});
 assert.equal(locale.text(key,'ru'),'Пояснение QA · настройки');
 assert.equal(locale.text(key,'en'),'Settings QA · apply now');
 assert.equal(locale.bookFieldKey('Пояснение QA · настройки'),null,
  'User-entered override is never silently reclassified as a default');
 assert.equal(locale.text('unknown-key','ru'),'unknown-key');
 locale.setOverrides({[d1]:'{invalid json'});
 assert.equal(locale.text(key,'ru'),ru);
 assert.equal(locale.text(key,'en'),en);
 locale.setOverrides({});
});

test('generic Book editor avoids specialized guides, item controls and repeated rerenders',()=>{
 const src=file('pandora-studio-hero-book.js'),app=file('pandora-studio-app.js');
 assert.match(src,/node\.closest\('\[data-guide-key\],\.stage-guide-actions,\.stage-book-tab-owner,button,\[role="button"\]'\)/);
 assert.match(src,/node\.querySelector\('button,input,select,\[role="button"\]'\)/);
 assert.match(app,/if\(adminEditing&&adminToken\)bindAccountCopyEditors\(root\)/);
 const restore=app.slice(app.indexOf('function refreshVisibleUICopy('),app.indexOf('function refreshVisibleOriginCopy('));
 assert.match(restore,/isBook=recordKey\.startsWith\('guideedit\.book\.ui\.label\.book-'\)/);
 assert.match(restore,/#stageAttributes \[data-owner-copy-key\]/);
 assert.doesNotMatch(restore,/renderDetails\(|renderStageAttributes\(/);
 const save=app.slice(app.indexOf('async function saveGuidePatchNow('),app.indexOf('async function saveGuideList('));
 assert.match(save,/key\.startsWith\('book\.ui\.label\.book-'\)/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

const host={};host.window=host;
runInNewContext(read('pandora-studio-ui-locale.js'),host);
runInNewContext(read('pandora-studio-honor-guide.js'),host);
const locale=host.PandoraUILocale,guide=host.PandoraHonorGuide;

test('eight author-owned admin status notifications have exact D1 RU/EN keys',()=>{
 const ids=['statusOwnerD1Check','statusOwnerSaveInProgress','statusOwnerSaveError',
  'statusOwnerFinishPending','statusOwnerTranslationsSaved',
  'statusOwnerPullRequestWaiting','statusOwnerPullRequestBlocked',
  'statusLibraryCloudPending'];
 for(const id of ids){
  assert.ok(locale.keys().includes(id),id);
  const key=locale.fieldKey(id);
  assert.match(key,/^ui\.label\.status-/);
  assert.equal(locale.literalKey(locale.baseText(id,'ru')),id);
  assert.equal(locale.literalKey(locale.baseText(id,'en')),id);
  assert.ok(guide.validOverride('book.'+key,JSON.stringify({
   ru:'Проверенный текст',en:'Verified copy'
  })),key);
 }
 const key='guideedit.book.'+locale.fieldKey('statusOwnerD1Check');
 locale.setOverrides({[key]:JSON.stringify({ru:'Тест пройден',en:'Test passed'})});
 assert.equal(locale.ui(locale.baseText('statusOwnerD1Check','ru'),'ru'),'Тест пройден');
 assert.equal(locale.ui(locale.baseText('statusOwnerD1Check','en'),'en'),'Test passed');
 locale.setOverrides({});
 assert.equal(locale.literalKey('Ошибка сервера HTTP 503'),null);
 assert.equal(locale.literalKey('Билд Игрока удалён.'),null);
});

test('editing and locale switching never replace toast editor or lose D1 language',()=>{
 const app=read('pandora-studio-app.js');
 const css=read('pandora-studio-owner-inline-ui.css');
 const browser=read('tests/browser-ui-content-inline.mjs');
 assert.match(app,/function refreshOpenAuthoredToast\(\)/);
 assert.match(app,/window\.PandoraUILocale\.apply\(lang\);\s*refreshOpenAuthoredToast\(\);/);
 assert.match(app,/textNode\.nextElementSibling\?\.classList\?\.contains\('ui-content-edit-host'\)/);
 assert.match(app,/const editLang=lang,before=locale\.text\(key,editLang\)/);
 assert.match(app,/saveGuidePatch\('book\.'\+id,\{\[editLang\]:next\}\)/);
 assert.match(app,/const inlineError=message=>/);
 assert.match(app,/else inlineError\(message\)/);
 const editor=app.slice(app.indexOf('function editWikiValue('),
  app.indexOf('// Repeated blur saves',app.indexOf('function editWikiValue(')));
 assert.doesNotMatch(editor,/node\.closest\('#studioToast'\)/,
  'A failed D1 write should keep the same editor on every surface, not only toasts');
 assert.match(app,/class:'ui-content-inline-error',role:'alert'/);
 assert.match(css,/#studioToast \.ui-content-inline-error/);
 assert.match(browser,/nextConflicts\.add\(statusKey\)/);
 assert.match(browser,/live translation, 409/);
});

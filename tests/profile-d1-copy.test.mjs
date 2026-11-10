import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={window:null};root.window=root;
runInNewContext(read('pandora-studio-honor-guide.js'),root);
const guide=root.PandoraHonorGuide;

test('profile/editor captions have stable bilingual D1 identifiers',()=>{
 const labels={
  'field-name':['Имя героя','Hero name'],
  'field-guild':['Гильдия','Guild'],
  'field-nation':['Нация','Nation'],
  'field-rank':['Ранг','Rank'],
  'bio-label':['О себе','About'],
  'bio-placeholder':['Описание героя — сохраняется в билде',
   'Hero bio — saved with the build'],
  'profile-notes':['Поля профиля — пользовательские заметки в билде.',
   'Profile fields are notes saved with the build.'],
  'overview-race':['Раса','Race'],
  'overview-class':['Профессия','Class'],
  'overview-level':['Уровень','Level'],
  'racial-heading':['Расовая пассивка','Racial passive'],
  'overview-help':['Умения развиваются','Train skills']
 };
 const app=read('pandora-studio-app.js');
 for(const [key,[ru,en]] of Object.entries(labels)){
  const full='profile.'+key;
  const saved={'guideedit.book.'+full:JSON.stringify({ru:'Изменённая подпись',en:'Updated caption'})};
  assert.equal(guide.validOverride('book.'+full,
   JSON.stringify({ru:'Изменённая подпись',en:'Updated caption'})),true);
  const result=guide.field(saved,full,ru,en);
  assert.equal(result.ru,'Изменённая подпись');
  assert.equal(result.en,'Updated caption');
  assert.match(app,new RegExp('\\b'+key+'\\b'));
 }
});

test('profile owner copy changes only labels and accessible placeholders, never player fields',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/function profileCopyLabel\(/);
 assert.match(app,/class:'ps-profile-copy'/);
 assert.match(app,/data-profile-copy-key/);
 assert.match(app,/onCommit:next=>saveGuidePatch\('book\.'\+ownerCopyKey\('profile',key\)/);
 assert.match(app,/if\(key==='name'\)\{state\.name=input\.value\}/);
 assert.match(app,/state\.profile\[key\]=input\.value/);
 assert.match(app,/state\.profile\.about=description\.value/);
 assert.match(app,/function refreshVisibleProfileCopy\(/);
 assert.match(app,/last\.key\.startsWith\('guideedit\.book\.profile\.'/);
 assert.match(app,/key\.startsWith\('book\.profile\.'/);
 const css=read('pandora-studio-owner-inline-ui.css');
 assert.match(css,/\.ps-profile-copy-host/);
 assert.match(css,/\.ps-profile-copy-pencil/);
 assert.doesNotMatch(app,/saveGuidePatch\('book\.profile\.'\+state\.name/);
});

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
  const saved={['guideedit.book.'+full]:JSON.stringify({ru:'Изменённая подпись',en:'Updated caption'})};
  assert.equal(guide.validOverride('book.'+full,
   JSON.stringify({ru:'Изменённая подпись',en:'Updated caption'})),true);
  const result=guide.field(saved,full,ru,en);
  assert.equal(result.ru,'Изменённая подпись');
  assert.equal(result.en,'Updated caption');
  assert.ok(app.includes(key)||key.startsWith('field-')&&app.includes('"'+key.slice(6)+'"'), 'Missing profile label source: '+key);
 }
});

test('profile owner copy changes only labels and accessible placeholders, never player fields',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/function profileCopyLabel\(/);
 assert.match(app,/class:'ps-profile-copy'/);
 assert.match(app,/data-profile-copy-key/);
 assert.match(app,/onCommit:next=>saveGuidePatch\('book\.'\+ownerCopyKey\('profile',key\)/);
 const begin=app.indexOf('function profileCopyLabel(');
 const end=app.indexOf('function profileCopyNote(',begin);
 const editor=app.slice(begin,end);
 assert.match(editor,/const editLang=lang;/);
 assert.match(editor,/\{\[editLang\]:next\}/);
 assert.doesNotMatch(editor,/\{\[lang\]:next\}/);
 assert.match(editor,/onFinished:\(\)=>refreshVisibleProfileCopy\(\)/);
 assert.match(app,/if\(key==="name"\)\{state\.name=input\.value\}/);
 assert.match(app,/state\.profile\[key\]=input\.value/);
 assert.match(app,/state\.profile\.about=description\.value/);
 assert.match(app,/function refreshVisibleProfileCopy\(/);
 assert.match(app,/last\.key\.startsWith\('guideedit\.book\.profile\.'/);
 assert.match(app,/key\.startsWith\('book\.profile\.'/);
 const css=read('pandora-studio-owner-inline-ui.css');
 assert.doesNotMatch(css,/\.ps-profile-copy-pencil/);
 assert.doesNotMatch(css,/\.ps-profile-copy-host/);
 assert.doesNotMatch(css,/\.path-inline-copy-pencil|\.path-racial-pencil|\.path-more-pencil/);
 assert.match(css,/\.ps-profile-row>\.ps-profile-copy/);
 assert.match(css,/\.ps-profile-copy>\.wiki-inline-input/);
 assert.match(css,/@media\(max-width:700px\)\{\s*\.ps-profile-row>\.ps-profile-copy\{width:100%\}/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\);align-items:stretch/);
 assert.match(editor,/const canUseEnter=as!=='label'/);
 assert.match(editor,/node\.setAttribute\('aria-keyshortcuts',canUseEnter\?'F2 Enter':'F2'\)/);
 assert.match(editor,/if\(event\.target!==node\)return/);
 assert.match(editor,/if\(event\.key==='F2'\|\|\(canUseEnter&&event\.key==='Enter'\)\)edit\(event\)/);
 assert.doesNotMatch(app,/saveGuidePatch\('book\.profile\.'\+state\.name/);
});

test('profile and character button captions edit without a second action or tab stop',()=>{
 const app=read('pandora-studio-app.js');
 const src=app.slice(app.indexOf('function renderCharacter('),
  app.indexOf('// Legacy duplicate skill editor retired',app.indexOf('function renderCharacter(')));
 const label=app.slice(app.indexOf('function profileCopyLabel('),
  app.indexOf('function profileCopyNote(',app.indexOf('function profileCopyLabel(')));
 for(const key of ['tab-character','tab-profile','action-hero-path',
  'action-attributes','action-edit-profile'])
  assert.ok(app.includes("'"+key+"'"),'Missing source-backed action '+key);
 assert.match(src,/const authoredAction=\(key,activate/);
 assert.match(src,/ownerCaptionActionGuard\(button,caption\)/);
 assert.match(src,/caption\.dispatchEvent\(new MouseEvent\('dblclick'/);
 assert.match(src,/if\(event\.key!=='F2'\|\|event\.target!==button\)return/);
 assert.match(src,/tabs\.append\(authoredAction\(copyKey/);
 assert.match(src,/jump\.append\(authoredAction\('action-edit-profile'/);
 assert.match(label,/bindOwnerTouchCaption\(node,edit,\{interactive:action\|\|as==='label'\}\)/);
 assert.match(label,/if\(!action\)node\.tabIndex=0/);
 assert.doesNotMatch(src,/class:'ps-profile-copy-pencil'/);
});


test('issue 390: missing Origin race shares reviewed Profile D1 copy, selected race stays source-owned',()=>{
 const app=read('pandora-studio-app.js');
 const start=app.indexOf('function renderOriginPassives(){');
 const end=app.indexOf('function ',start+10);
 const render=app.slice(start,end>start?end:undefined);
 assert.ok(render.includes("raceName.replaceChildren(profileCopyLabel("));
 assert.ok(render.includes("'portrait-race-missing','Раса не выбрана','Race not selected'"));
 assert.ok(render.includes("raceName.textContent=races[state.race][lang==='en'?1:0]"));
 assert.ok(!render.includes('ownerCopyLabel(raceName'));
 const planner=read('scripts/plan-editorial-d1-defaults.mjs');
 assert.match(planner,/profileAuthorialCopy/);
 const ui=read('pandora-studio-app.js');
 assert.ok(ui.includes("'portrait-race-missing':['Раса не выбрана','Race not selected']"));
});


test('issue 390: shared Origin missing-race caption follows Profile CAS Save and Undo',()=>{
 const app=read('pandora-studio-app.js');
 const start=app.indexOf('function refreshVisibleProfileCopy(){');
 const end=app.indexOf('async function undoOwnerEdit()',start);
 assert.ok(start>0&&end>start);
 const refresh=app.slice(start,end);
 assert.ok(refresh.includes("'#detailContent [data-profile-copy-key], #originRaceName [data-profile-copy-key]'"));
 assert.ok(refresh.includes("ownerCopy('profile',key,node.dataset.profileCopyRu,node.dataset.profileCopyEn)"));
 const render=app.slice(app.indexOf('function renderOriginPassives(){'),
  app.indexOf('function ',app.indexOf('function renderOriginPassives(){')+10));
 assert.ok(render.includes("raceName.textContent=races[state.race][lang==='en'?1:0]"));
 const undo=app.slice(end,app.indexOf('function ',end+20));
 assert.ok(undo.includes("last.key.startsWith('guideedit.book.profile.')"));
 assert.ok(undo.includes('refreshVisibleProfileCopy()'));
});

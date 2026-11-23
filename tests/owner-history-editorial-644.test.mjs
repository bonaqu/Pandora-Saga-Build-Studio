import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const css=read('pandora-studio-wiki-history.css');
const browser=read('tests/browser-admin-entry.mjs');
const guideRoot={};guideRoot.window=guideRoot;
Function('window',read('pandora-studio-honor-guide.js'))(guideRoot);

test('owner history has stable bilingual editorial keys and does not expose game values',()=>{
 const start=app.indexOf('function showOverrideManager(){');
 const end=app.indexOf('\nfunction ',start+30);
 assert.ok(start>=0&&end>start);
 const manager=app.slice(start,end);
 for(const key of ['intro','empty']){
  assert.match(manager,new RegExp("authoredHistory\\('"+key+"'"));
  assert.equal(guideRoot.PandoraHonorGuide.validOverride('book.owner-history.'+key,
   JSON.stringify({ru:'Пояснение',en:'Help'})),true);
 }
 assert.match(manager,/ownerCopy\('owner-history',key,ru,en\)/);
 assert.match(manager,/ownerCopyLabel\(node,'owner-history',key,ru,en\)/);
 assert.doesNotMatch(manager,/class:'owner-history-pencil'/);
 assert.match(manager,/ownerCopyLabel\(node,'owner-history',key,ru,en\)/);
 assert.match(manager,/const ownerHistoryTextRows=Object\.freeze/);
 assert.match(manager,/historyCaption\('span','owner-history-count-copy','shownLead'\)/);
 assert.match(manager,/shownValue\.textContent=String\(entries\.length\)/);
 assert.match(manager,/totalValue\.textContent=String\(allEntries\.length\)/);
 assert.match(manager,/historyCaption\('small','owner-history-comparison-copy','beforeHeading'\)/);
 assert.match(manager,/historyCaption\('small','owner-history-comparison-copy','afterHeading'\)/);
 assert.match(manager,/document\.createTextNode\(' '\)/);
 assert.doesNotMatch(manager,/count\.textContent=/);
 assert.match(manager,/h\('p',\{text:entry\.before\}\)/);
 assert.match(manager,/h\('p',\{text:entry\.after\}\)/);
 assert.doesNotMatch(manager,/ownerCopyLabel\(count/);
 assert.doesNotMatch(manager,/ownerCopyLabel\(row/);
});

test('history copy save, Undo and reset share D1 CAS and keep the current modal mounted',()=>{
 assert.match(app,/key\.startsWith\('book\.owner-history\.'\)/);
 assert.match(app,/last\.key\)/);
 assert.match(app,/book\.owner-history\./);
 assert.match(app,/record\.key\.startsWith\('guideedit\.book\.owner-history\.'\)/);
 const start=app.indexOf('function refreshVisibleOwnerCopy(');
 assert.ok(start>0);
 const refresh=app.slice(start,start+4500);
 assert.match(refresh,/owner-history/);
 assert.match(app,/refreshVisibleOwnerCopy\(last\.key\);saveView\(\)/);
 assert.match(css,/\.owner-manager \.owner-history-caption/);
 assert.doesNotMatch(css,/owner-history-pencil|owner-history-edit-row/);
 assert.match(app,/const ownerHistoryControlCopyRows=Object\.freeze/);
 assert.match(app,/bindHistoryControl\(search,'searchPlaceholder','placeholder'\)/);
 assert.match(app,/bindHistoryControl\(search,'searchAria','aria-label'\)/);
 assert.match(app,/bindHistoryControl\(sectionFilter,'sectionAria','aria-label'\)/);
 assert.match(app,/ownerCopyLabel\(sessionCaption,'owner-history','session'/);
 assert.match(app,/ownerCaptionActionGuard\(sessionLabel,sessionCaption\)/);
 assert.match(app,/ownerCopyLabel\(clearCaption,'owner-history','clear'/);
 assert.match(app,/ownerCaptionActionGuard\(clearSearch,clearCaption\)/);
 assert.match(app,/bindHistoryControl\(allOption,'allSections','text'\)/);
 assert.match(app,/const controlEditor=ownerInterfaceEditor\('owner-history',\s*\[\.\.\.ownerHistoryControlCopyRows,/);
 assert.match(app,/\.\.\.ownerHistoryAuxCopyRows\.filter\(row=>row\[0\]!=='dialogTitle'\)/,
  'The same collapsed history panel includes distinct hover copy but not the direct title');
 assert.match(app,/const ownerHistoryRowCopyRows=Object\.freeze/);
 for(const key of ['pendingError','pendingSaving','fieldsChanged',
  'openEncyclopedia','restoreOriginal']){
  assert.equal(guideRoot.PandoraHonorGuide.validOverride(
   'book.owner-history.'+key.replace(/[A-Z]/g,s=>'-'+s.toLowerCase()),
   JSON.stringify({ru:'Изменено',en:'Edited'})),true);
 }
 assert.match(app,/pendingNote\.append\(pendingError,pendingSaving\)/);
 assert.match(app,/pendingError\.hidden=ownerSaveState!=='error'/);
 assert.match(app,/pendingSaving\.hidden=ownerSaveState==='error'/);
 assert.doesNotMatch(app,/pendingNote\.textContent=ownerSaveState/);
 assert.match(app,/class:'owner-history-field-count',text:String\(record\.changes\.length\)/);
 assert.match(app,/historyRowCaption\('span','owner-history-fields-copy','fieldsChanged'\)/);
 assert.match(app,/ownerCaptionActionGuard\(openButton,openCaption\)/);
 assert.match(app,/ownerCaptionActionGuard\(resetAction,resetCaption\)/);
 assert.match(app,/ownerHistoryRowCopyRows\.filter\(row=>row\[0\]\.startsWith\('pending'\)\)/);
 assert.match(app,/ownerCaptionActionGuard\(head,countCaption\)/);
 assert.match(app,/const ownerHistoryAuxCopyRows=Object\.freeze/);
 assert.match(app,/bindHistoryHelp\(clearSearch,'clearHelp'\)/);
 assert.match(app,/bindHistoryHelp\(reset,'restoreHelp'\)/);
 assert.match(app,/bindHistoryHelp\(openAction,'openHelp'\)/);
 assert.match(app,/ownerHistoryAuxCopyRows\.filter\(row=>row\[0\]!=='dialogTitle'\)/);
 assert.match(app,/ownerCopyLabel\(title,'owner-history','dialogTitle'/);
 assert.match(app,/ownerDockPatchAttr\(dialog,'aria-label',value\)/);
 assert.match(app,/historyAux\('confirmRestore'\)/);
 assert.match(app,/historyAux\('restoreFailure'\)/);
 assert.match(app,/historyAux\('catalogUnavailable'\)/);
 assert.match(app,/section==='owner-history'&&id==='dialogTitle'/);
 for(const key of ['catalogUnavailable','clearHelp','confirmRestore','dialogTitle',
   'openHelp','restoreFailure','restoreHelp']){
  assert.equal(guideRoot.PandoraHonorGuide.validOverride(
   'book.owner-history.'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),
   JSON.stringify({ru:'Текст',en:'Text'})),true,key);
 }
 assert.match(browser,/guideedit\.book\.owner-history\.intro/);
 assert.match(browser,/beforeCatalogCalls/);
});


test('#390: owner history shows RU/EN book captions as distinct readable fields, not raw JSON',()=>{
 const target={};target.window=target;
 Function('window',read('pandora-studio-owner-change-review.js'))(target);
 const review=target.PandoraOwnerChangeReview;
 assert.equal(typeof review.inspect,'function');
 const key='guideedit.book.catalog-sync.summary-selected';
 const stored=JSON.stringify({ru:'Отобрано QA:',en:'Selected QA:'});
 const ru=review.inspect(key,stored,{lang:'ru'});
 assert.equal(ru.key,key,'Owner history reset must retain the exact original CAS key');
 assert.equal(ru.section,'Интерфейс');
 assert.match(ru.title,/Проверка каталога · Надпись «Отобрано QA:»/);
 assert.ok(!ru.title.includes('catalog-sync'),'Raw D1 namespace is not a row heading');
 assert.equal(ru.target,null,'UI captions never open unrelated game records');
 assert.deepEqual(ru.changes.map(row=>row.field),['Текст RU','Текст EN']);
 assert.deepEqual(ru.changes.map(row=>row.after),['Отобрано QA:','Selected QA:']);
 assert.deepEqual(ru.changes.map(row=>row.before),
  ['Исходное значение неизвестно','Исходное значение неизвестно'],
  'Do not misrepresent the edited override as its original source');
 const en=review.inspect(key,stored,{lang:'en'});
 assert.equal(en.section,'Interface');
 assert.match(en.title,/Catalog review · Caption «Selected QA:»/);
 assert.deepEqual(en.changes.map(row=>row.field),['Russian text','English text']);
 assert.deepEqual(en.changes.map(row=>row.before),
  ['Original value unknown','Original value unknown']);
 assert.equal(stored,JSON.stringify({ru:'Отобрано QA:',en:'Selected QA:'}),
  'Read-only inspector cannot mutate the stored bilingual override');
 const partial=review.inspect(key,JSON.stringify({ru:'Только русский текст'}),{lang:'en'});
 assert.deepEqual(partial.changes.map(row=>row.field),['Russian text'],
  'Partial D1 CAS only stores one field; do not invent an EN edit');
 assert.deepEqual(partial.changes.map(row=>row.after),['Только русский текст']);
 assert.match(partial.title,/Catalog review · Caption «Только русский текст»/,
  'A row title may fall back to the only saved language without writing another field');
});

test('#390: owner history distinguishes real hint copy and verified staged baselines',()=>{
 const requested=[];
 const target={PandoraEditorialDefaults:{value:(key,field)=>{
  requested.push([key,field]);
  if(key!=='guideedit.book.catalog-sync.hint-review-filter-added')
   throw Error('Unrelated staged key');
  if(field==='ru')return 'Объекты, добавленные в проверяемом источнике.';
  if(field==='en')return 'Entries added in the checked source.';
  return null;
 }}};
 target.window=target;
 Function('window',read('pandora-studio-owner-change-review.js'))(target);
 const original={ru:'Новый фильтр QA',en:'New filter QA'};
 const row=target.PandoraOwnerChangeReview.inspect(
  'guideedit.book.catalog-sync.hint-review-filter-added',
  JSON.stringify(original),{lang:'ru'});
 assert.match(row.title,/Проверка каталога · Подсказка «Новый фильтр QA»/);
 assert.equal(row.section,'Интерфейс');
 assert.deepEqual(row.changes.map(field=>field.before),
  ['Объекты, добавленные в проверяемом источнике.',
   'Entries added in the checked source.']);
 assert.deepEqual(row.changes.map(field=>field.after),
  [original.ru,original.en]);
 assert.deepEqual(requested,[
  ['guideedit.book.catalog-sync.hint-review-filter-added','ru'],
  ['guideedit.book.catalog-sync.hint-review-filter-added','en']
 ]);
 const other=target.PandoraOwnerChangeReview.inspect(
  'guideedit.book.owner-history.intro',
  JSON.stringify({ru:'История QA',en:'History QA'}),{lang:'en'});
 assert.match(other.title,/Change history · Caption «History QA»/);
 assert.deepEqual(other.changes.map(x=>x.before),
  ['Original value unknown','Original value unknown'],
  'Failed optional staging reads are not fabricated as defaults');
 // Existing item data must retain its own target and read-only game fields.
 const item=target.PandoraOwnerChangeReview.inspect(
  'itemdesc.99','Текст предмета',{lang:'ru',items:{'99':{name:'Шлем',desc:'До'}}});
 assert.equal(item.section,'Предмет');
 assert.deepEqual(item.target,{type:'item',id:'99'});
 assert.equal(item.changes[0].before,'До');
 assert.equal(item.changes[0].after,'Текст предмета');
});

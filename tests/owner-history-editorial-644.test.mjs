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


test('#390: owner history compares only verified authored Honor rank and overview text',()=>{
 const target={};target.window=target;
 Function('window',read('pandora-studio-honor-guide.js'))(target);
 Function('window',read('pandora-studio-owner-change-review.js'))(target);
 const rank=target.PandoraHonorGuide.defaultRanks[1];
 const rankKey='guideedit.honor.rank.1';
 const rankOverride=JSON.stringify({benefitRu:'Создаёт гильдию QA',
  benefitEn:'Guild creation QA'});
 assert.equal(target.PandoraHonorGuide.validOverride('honor.rank.1',rankOverride),true);
 const ru=target.PandoraOwnerChangeReview.inspect(rankKey,rankOverride,{lang:'ru'});
 assert.equal(ru.key,rankKey);
 assert.equal(ru.section,'Честь');
 assert.match(ru.title,/Ранг · Помощник/);
 assert.deepEqual(ru.changes.map(entry=>entry.field),
  ['Преимущество RU','Преимущество EN']);
 assert.deepEqual(ru.changes.map(entry=>entry.before),
  [rank.benefitRu,rank.benefitEn],
  'The source version of authorial rank copy is a known immutable default');
 assert.deepEqual(ru.changes.map(entry=>entry.after),
  ['Создаёт гильдию QA','Guild creation QA']);
 assert.ok(ru.changes.every(change=>!/(?:Золото|Очки чести)/.test(change.field)),
  'Calculated rank thresholds/gold are not authorial history fields');
 assert.equal(ru.target,null,'Rank copy cannot navigate to a source game entity');
 const en=target.PandoraOwnerChangeReview.inspect(rankKey,rankOverride,{lang:'en'});
 assert.equal(en.section,'Honor');
 assert.match(en.title,/Rank · Esquire/);
 assert.deepEqual(en.changes.map(row=>row.field),
  ['Russian benefit','English benefit']);
 const intro=target.PandoraHonorGuide.intro;
 const overviewOverride=JSON.stringify({overviewRu:'Обзор QA'});
 assert.equal(target.PandoraHonorGuide.validOverride('honor.overview',overviewOverride),true);
 const overview=target.PandoraOwnerChangeReview.inspect(
  'guideedit.honor.overview',overviewOverride,{lang:'ru'});
 assert.match(overview.title,/Честь · Обзор Чести/);
 assert.deepEqual(overview.changes.map(row=>row.field),['overviewRu']);
 assert.equal(overview.changes[0].before,intro.overviewRu);
 assert.equal(overview.changes[0].after,'Обзор QA');
});

test('#390: Wiki authorial chapter and Honor titles retain safe RU/EN history labels',()=>{
 const target={};target.window=target;
 Function('window',read('pandora-studio-honor-guide.js'))(target);
 Function('window',read('pandora-studio-owner-change-review.js'))(target);
 const patch={chapter_item_ru:'Предметы QA',
  honor_monthly_en:'Monthly Honor QA'};
 assert.equal(target.PandoraHonorGuide.validOverride('wiki.labels',JSON.stringify(patch)),true);
 const ru=target.PandoraOwnerChangeReview.inspect(
  'guideedit.wiki.labels',JSON.stringify(patch),{lang:'ru'});
 assert.equal(ru.section,'Энциклопедия');
 assert.match(ru.title,/Подписи разделов/);
 assert.deepEqual(ru.changes.map(row=>row.field),
  ['Глава · Предметы · RU','Честь · Месячный рейтинг · EN']);
 assert.deepEqual(ru.changes.map(row=>row.after),
  ['Предметы QA','Monthly Honor QA']);
 assert.deepEqual(ru.changes.map(row=>row.before),
  ['Исходное значение неизвестно','Исходное значение неизвестно'],
  'Wiki source version must not be inferred from edited D1 values');
 const en=target.PandoraOwnerChangeReview.inspect(
  'guideedit.wiki.labels',JSON.stringify(patch),{lang:'en'});
 assert.equal(en.section,'Encyclopedia');
 assert.deepEqual(en.changes.map(row=>row.field),
  ['Chapter · Items · RU','Honor · Monthly ranking · EN']);
 // Structured rank/map authoring is intentionally excluded from text history
 // classification; the original JSON record stays read-only.
 const maps=target.PandoraOwnerChangeReview.inspect(
  'guideedit.honor.zones','[]',{lang:'ru'});
 assert.equal(maps.section,'Другие настройки');
 assert.equal(maps.changes[0].after,'[]');
});

test('#390: mixed visible caption/hover history is not mislabeled as tooltip only',()=>{
 const target={};target.window=target;
 Function('window',read('pandora-studio-owner-change-review.js'))(target);
 const both=target.PandoraOwnerChangeReview.inspect(
  'guideedit.book.origin.header',JSON.stringify({
   ru:'Заголовок QA',en:'Header QA',
   hintRu:'Подсказка QA',hintEn:'Help QA'
  }),{lang:'ru'});
 assert.match(both.title,/Происхождение · Надпись и подсказка «Заголовок QA»/);
 assert.deepEqual(both.changes.map(row=>row.field),
  ['Текст RU','Текст EN','Подсказка RU','Подсказка EN']);
 const tooltipOnly=target.PandoraOwnerChangeReview.inspect(
  'guideedit.book.equipment.field',JSON.stringify({hintRu:'Одна подсказка'}),{lang:'ru'});
 assert.match(tooltipOnly.title,/Образ героя · Подсказка «Одна подсказка»/);
 assert.deepEqual(tooltipOnly.changes.map(row=>row.field),['Подсказка RU']);
});

test('#390 owner history identifies source-only Hero Book chapter captions without changing CAS data',()=>{
 const root={};root.window=root;
 Function('window',read('pandora-studio-owner-change-review.js'))(root);
 const review=root.PandoraOwnerChangeReview;
 const saved=JSON.stringify({ru:'Новая надпись QA',en:'New caption QA'});
 const chapters=[
  ['chapter.attack','Главы Книги героя','Hero Book chapters'],
  ['summary.0','Итоги Книги героя','Hero Book summary'],
  ['attack.skillRange.bonus','Атака Книги героя','Hero Book attack'],
  ['defense.caption.sources','Защита Книги героя','Hero Book defense'],
  ['buffs.reason.levelLead','Усиления Книги героя','Hero Book buffs'],
  ['effects.healing.manaCostLead','Эффекты умений','Skill effects'],
  ['recovery.caption.potions','Восстановление','Recovery']
 ];
 for(const [key,ruGroup,enGroup] of chapters){
  assert.equal(guideRoot.PandoraHonorGuide.validOverride('book.'+key,saved),
   true,'Source-only Book key must remain supported by the existing CAS schema');
  const full='guideedit.book.'+key;
  const ru=review.inspect(full,saved,{lang:'ru'});
  const en=review.inspect(full,saved,{lang:'en'});
  assert.equal(ru.key,full);
  assert.equal(en.key,full);
  assert.equal(ru.section,'Интерфейс');
  assert.equal(en.section,'Interface');
  assert.match(ru.title,new RegExp(ruGroup+' · Надпись «Новая надпись QA»'));
  assert.match(en.title,new RegExp(enGroup+' · Caption «New caption QA»'));
  assert.equal(ru.target,null,'History of authored labels must not select a game record');
  assert.deepEqual(ru.changes.map(x=>[x.field,x.after]),
   [['Текст RU','Новая надпись QA'],['Текст EN','New caption QA']]);
  assert.deepEqual(en.changes.map(x=>x.before),
   ['Original value unknown','Original value unknown'],
   'Without a verified staging version there can be no invented before-value');
 }
 assert.equal(saved,JSON.stringify({ru:'Новая надпись QA',en:'New caption QA'}));
});

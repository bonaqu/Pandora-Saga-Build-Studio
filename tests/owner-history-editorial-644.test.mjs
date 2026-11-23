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

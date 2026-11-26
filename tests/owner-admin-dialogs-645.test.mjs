import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const styles=read('pandora-studio-owner-inline-ui.css');
const smoke=read('tests/browser-admin-entry.mjs');
assert.doesNotMatch(app,/\basync\s+\/\* Editorial copy for administrative dialogs/);
const root={};root.window=root;
Function('window',read('pandora-studio-honor-guide.js'))(root);

test('admin translation and GitHub modals use independent RU/EN owner D1 keys',()=>{
 const names=['translationsIntro','translationsSaveButton','githubPrompt',
  'githubExplanation','githubCreateButton'];
 for(const key of names){
  assert.ok(app.includes("'"+key+"'"),key);
  const normalized=key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());
  const d1='book.owner-dialog.'+normalized;
  assert.equal(root.PandoraHonorGuide.validOverride(d1,
   JSON.stringify({ru:'Изменённое пояснение',en:'Updated explanation'})),true,d1);
 }
 assert.match(app,/function ownerDialogHelp\(key,ru,en\)/);
 assert.match(app,/ownerCopy\('owner-dialog',key,ru,en\)/);
 assert.match(app,/ownerCopyLabel\(caption,'owner-dialog',key,ru,en\)/);
 assert.doesNotMatch(app,/class:'owner-dialog-pencil'/);
 assert.match(app,/function ownerDialogAction\(button,key,ru,en\)/);
 assert.match(app,/ownerCopyLabel\(host,'owner-dialog',key,ru,en/);
 assert.match(app,/button\.hidden=true;host\.hidden=false/);
 assert.match(app,/button\.addEventListener\('dblclick',edit\)/);
 assert.doesNotMatch(app,/button\.dispatchEvent\(new MouseEvent\('dblclick'/);
});

test('realtime counts, field translations and GitHub actions stay noneditable',()=>{
 const start=app.indexOf('function ownerDialogHelp(');
 const end=app.indexOf('async function showCatalogImport(',start);
 const view=app.slice(start,end);
 assert.ok(start>0&&end>start);
 assert.match(view,/text:row\.title/);
 assert.match(view,/text:field\.ru\+' → '\+field\.en/);
 // Composed labels must remain source-editable without including the
 // actual D1 count in a stored RU/EN field.
 assert.match(view,/ownerDialogStatusCaption\('span','translationsReadyCount'\)/);
 assert.match(view,/ownerDialogStatusCaption\('span','githubCount'\)/);
 assert.match(view,/class:'owner-dialog-runtime-number',text:String\(fields\)/);
 assert.match(view,/class:'owner-dialog-runtime-number',text:String\(info\.count\)/);
 assert.match(view,/class:'owner-dialog-server-error',text:error\.message/);
 assert.doesNotMatch(view,/ownerCopyLabel\(.*info\.count/);
 assert.match(view,/info\.count/);
 assert.match(view,/expectedFingerprint:info\.fingerprint/);
 assert.match(view,/if\(!info\.configured\)/);
 assert.match(view,/ownerDialogAction\(go,'githubCreateButton'/);
 assert.match(view,/ownerDialogAction\(save,'translationsSaveButton'/);
 assert.doesNotMatch(view,/ownerCopyLabel\(.*row\.title/);
 assert.match(smoke,/calls\.filter\(x=>x==='owner-pr'\)\.length,beforePRCalls/);
 assert.match(smoke,/guideedit\.book\.owner-dialog\.github-explanation/);
 assert.match(smoke,/guideedit\.book\.owner-dialog\.github-create-button/);
});

test('D1 writes and Undo update a mounted caption, including the action label',()=>{
 const refresh=app.slice(app.indexOf('function refreshVisibleOwnerCopy('),
  app.indexOf('function ',app.indexOf('function refreshVisibleOwnerCopy(')+20));
 assert.match(refresh,/owner-dialog/);
 assert.match(refresh,/ownerDockPatchText\(action,value\)/);
 assert.match(app,/key\.startsWith\('book\.owner-dialog\.'\)/);
 assert.match(app,/owner-history\|owner-dialog/);
 assert.match(styles,/\.owner-dialog-editor>/);
 assert.match(styles,/\.owner-dialog-action-editor>/);
 assert.match(styles,/\.owner-dialog-action-host>\.wiki-inline-input/);
});

test('English admin review copy retains distinct source locales, mounted title and safe actions',()=>{
 const from=app.indexOf('const ownerDialogStatusCopyRows=Object.freeze(');
 const end=app.indexOf('function ownerDialogHelp(',from);
 const rows=app.slice(from,end);
 assert.ok(from>0&&end>from);
 for(const pair of [
  ['translationsTitle','Английские переводы','English translations'],
  ['githubTitle','Необязательная копия энциклопедии в GitHub',
   'Optional GitHub encyclopedia copy'],
  ['translationsSuccessLead','Готово:','Done:'],
  ['translationsPartialLead','Сохранено','Saved'],
  ['githubLink','Открыть PR и проверить содержимое','Open PR and review the contents']
 ]){
  const [key,ru,en]=pair;
  assert.ok(rows.includes("['"+key+"','"+ru+"'"),key+' RU original');
  assert.ok(rows.includes("'"+en+"'"),key+' EN original');
 }
 assert.match(app,/ownerDialogSourceModal\('translationsTitle',body\)/);
 assert.match(app,/ownerDialogSourceModal\('githubTitle',panel\)/);
 assert.match(app,/ownerCopyLabel\(heading,'owner-dialog',key,row\[1\],row\[2\]/);
 assert.match(app,/ownerDockPatchAttr\(dialog,'aria-label',value\)/);
 assert.match(app,/ownerDialogStatusCaption\('span','githubProposed'\)/);
 assert.match(app,/ownerDialogStatusCaption\('span','githubFollowup'\)/);
 assert.match(app,/ownerCaptionActionGuard\(link,linkCaption\)/);
 assert.match(app,/GitHub export is OPTIONAL/);
 assert.match(app,/не объединяет его/);
 assert.match(app,/Merge pull request/);
 assert.doesNotMatch(app,/Изменения через ✎ уже сохраняются в D1/);
});

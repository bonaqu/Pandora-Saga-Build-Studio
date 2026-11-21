import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const workbench=read('pandora-os-catalog-workbench.js');
const app=read('pandora-studio-app.js');
const css=read('pandora-os-catalog-workbench.css');
const root={};root.window=root;
runInNewContext(read('pandora-studio-honor-guide.js'),root);

test('only safe static catalog status text receives direct inline D1 editing',()=>{
 assert.match(workbench,/const editorialState=\(target,key,ru,en\)=>/);
 assert.match(workbench,/target\.replaceChildren\(label\)/);
 assert.match(workbench,/if\(canEdit&&typeof editLabel==='function'\)editLabel\(label,key,ru,en\)/);
 assert.doesNotMatch(workbench,/os-sync-state-pencil|target\.append\(pencil\)/);
 assert.match(workbench,/editorialState\(status,'initialStatus'/);
 assert.match(workbench,/editorialState\(status,\.\.\.complete\)/);
 assert.match(workbench,/if\(from==='server'\)editorialState\(sourceBanner/);
 assert.match(workbench,/else editorialState\(sourceBanner,'sourceArchiveNotice'/);
 assert.match(workbench,/status\.textContent=issue\+tr\(/);
 assert.match(workbench,/status\.textContent=\(from==='server'\?/);
 assert.match(css,/\.os-sync-state-caption\.origin-copy-editable::after\{content:none\}/);
 assert.doesNotMatch(css,/os-sync-state-pencil/);
});

test('catalog notice and comparison status translations use valid guide edit fields',()=>{
 const labels=['initialStatus','sourceLiveNotice','sourceArchiveNotice','comparisonFound',
  'comparisonFormatting','comparisonFormattingAndRussian','comparisonRussian',
  'comparisonNoChanges','compareSessionExpired','compareNotCompleted'];
 for(const key of labels){
  const dashed=key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
  assert.equal(root.PandoraHonorGuide.validOverride('book.catalog-sync.'+dashed,
   JSON.stringify({ru:'Пояснение',en:'Explanation'})),true,key);
  assert.ok(workbench.includes("'"+key+"'"),key);
 }
 assert.match(app,/ownerCopy\('catalog-sync',key,ru,en\)/);
 assert.match(app,/refreshVisibleOwnerCopy\('guideedit\.'\+key\)/);
 assert.doesNotMatch(workbench,/request\('\/api\/admin\/catalog\/publish',\{[^}]*editorialState/);
});

test('issue #390: verified admin success states are exact bilingual inline D1 fields',()=>{
 const labels=['exportDownloaded','testWriteSuccess','testCasSuccess','githubNoChanges'];
 for(const key of labels){
  const dashed=key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
  assert.equal(root.PandoraHonorGuide.validOverride('book.catalog-sync.'+dashed,
   JSON.stringify({ru:'Подтверждено',en:'Confirmed'})),true,key);
  assert.ok(workbench.includes("editorialState(status,'"+key+"'"),key);
 }
 assert.doesNotMatch(workbench,/status\.textContent='Выбранный снимок скачан/);
 assert.doesNotMatch(workbench,/status\.textContent='Сохранение работает/);
 assert.doesNotMatch(workbench,/status\.textContent='Проверка пройдена:/);
 assert.doesNotMatch(workbench,/status\.textContent='Каталог в GitHub уже совпадает/);
 // Dynamic upstream response details are still not owner-editable.
 assert.match(workbench,/diagnosticText\.textContent=tr\('Этап: ','Stage: '\)/);
 assert.match(workbench,/status\.textContent=error\.message/);
});

test('catalog security confirmations and runtime failure messages are bilingual, but not D1-editable',()=>{
 for(const russian of [
  'Проверить, работают ли сохранение и удаление правок?',
  'Проверить конфликты правок?',
  'Создать отдельный GitHub PR из текущего опубликованного игрового каталога?'
 ]){
  assert.ok(workbench.includes(russian),russian);
 }
 for(const english of [
  'Verify that saving and deleting edits works?',
  'Check edit conflicts?',
  'Create a separate GitHub PR from the currently published game catalog?',
  'Export failed: ','Cannot publish: ','Preparing update · ',
  'D1 write verification failed: ','D1 conflict check failed: ',
  'Could not create PR: ','Create GitHub PR — server token configuration required'
 ])assert.ok(workbench.includes(english),english);
 assert.match(workbench,/status\.textContent=tr\('Экспорт не выполнен: '/);
 assert.match(workbench,/status\.textContent=tr\('Нельзя публиковать: '/);
 assert.match(workbench,/status\.textContent=tr\('Подготавливаю обновление · '/);
 assert.match(workbench,/error\.message/);
 assert.doesNotMatch(workbench,/editorialState\(status,'(?:exportFailure|publishFailure|casFailure|githubFailure)'/);
});

test('source failures and publishing risk caveats have bilingual parity',()=>{
 for(const english of [
  'Cloudflare Worker could not connect to the game site.',
  'The game site temporarily rate-limited requests (HTTP 429).',
  'D1 source was not verified for ',
  'Stage: ','Worker response: ','Reason: ',
  'ESTIMATED CHANCE CHANGES IN BUILD STUDIO',
  'IMPORTANT: the entire game-formula table group was selected',
  'MECHANICS REVIEW: ','Unselected settings: ',
  'These are estimates; actual game-server results have not been verified.',
  'Nothing is published before you confirm.',
  'Data may be unchanged or already published.'
 ])assert.ok(workbench.includes(english),english);
 assert.match(workbench,/const unselectedSettings=changes\.filter\(x=>!checked\(x\)&&describe\(x\)\.service\)\.length/);
 assert.match(workbench,/if\(!confirm\(confirmation\)\)return;/);
 assert.doesNotMatch(workbench,/const confirmationEn=/);
 assert.doesNotMatch(workbench,/editorialState\(status,'(?:sourceFailure|publishWarning|publishFailure)'/);
});

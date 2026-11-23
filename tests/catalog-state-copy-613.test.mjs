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

test('pre-publication blockers cannot be bypassed by English localization',()=>{
 for(const label of [
  'No changes selected for publication',
  'Pre-publication calculation check: ',
  'Calculation and source-link check: ',
  'Game links: new broken references found: ',
  'Item and Soul bonus check: ',
  'Target and level-difference check: ',
  'Published D1 translation count changed during review'
 ])assert.ok(workbench.includes(label),label);
 assert.match(workbench,/return verifyPublishedSnapshot\(apiBase,snapshot,expected,fetch,lang\)/);
 assert.match(workbench,/const modelCheck=safety\.check\(combined\)/);
 assert.match(workbench,/review\.auditSelection\(baseline,upstream,combined,chosen,importer\.files/);
});

test('English human-review cautions are displayed but game-model safety remains read-only',()=>{
 for(const label of [
  'description.summaryEn','description.cautionEn',
  'lang===\'en\'&&description.summaryEn',
  'lang===\'en\'&&description.cautionEn',
  'change.title,description.title,description.titleEn,description.summary,description.summaryEn',
  'field.label,field.labelEn', 'field.beforeFull??field.before,field.afterFull??field.after'
 ])assert.ok(workbench.includes(label),label);
 assert.match(workbench,/const uncertain=changes\.filter\(x=>checked\(x\)&&describe\(x\)\.uncertain\)\.length/);
 assert.match(workbench,/const riskApproval=/);
});

test('#390 review captions use exact bilingual CAS keys while live counts stay outside D1',async()=>{
 const match=workbench.match(/const catalogReviewDetailCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 assert.ok(match,'one source dictionary for visible catalog details');
 const rows=runInNewContext('('+match[1]+')');
 const expected=['changedParametersLead','decisionHeading','formulaTitle',
  'heroMoreChangesLead','heroNoChange','heroSelectHelp','impactHeading',
  'moreImpactsLead','moreImpactsSuffix',
  'linkedReferenceContext','unpublishedReference','emptyReviewFilter'];
 assert.deepEqual(Array.from(rows,row=>String(row[0])).sort(),expected.sort());
 const {buildEditorialDefaultsManifest}=await import('../scripts/plan-editorial-d1-defaults.mjs');
 const manifest=buildEditorialDefaultsManifest();
 assert.equal(manifest.stats.cohorts['catalog-review-details'],24);
 for(const [key,ru,en] of rows){
  const slug=key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
  const id='guideedit.book.catalog-sync.'+slug;
  assert.equal(manifest.records.find(r=>r.recordKey===id&&r.field==='ru')?.value,ru);
  assert.equal(manifest.records.find(r=>r.recordKey===id&&r.field==='en')?.value,en);
  assert.equal(root.PandoraHonorGuide.validOverride('book.catalog-sync.'+slug,
   JSON.stringify({ru:'Тест',en:'Test'})),true);
 }
 assert.match(workbench,/const reviewCaption=\(tag,attrs,key\)=>/);
 assert.match(workbench,/editLabel\(node,key,row\[1\],row\[2\]\)/);
 assert.match(workbench,/class:'os-sync-runtime-count'/);
 assert.match(workbench,/reviewCaption\('strong',\{\},'decisionHeading'\)/);
 assert.match(workbench,/reviewCaption\('strong',\{\},'formulaTitle'\)/);
 assert.match(workbench,/reviewCaption\('strong',\{\},'impactHeading'\)/);
 assert.match(workbench,/reviewCaption\('p',\{\},'heroSelectHelp'\)/);
 assert.match(workbench,/reviewCaption\('small',\{\},'linkedReferenceContext'\)/);
 assert.match(workbench,/reviewCaption\('small',\{\},'unpublishedReference'\)/);
 assert.match(workbench,/results\.append\(reviewCaption\('p',\{class:'os-sync-empty'\},'emptyReviewFilter'\)\)/);
 assert.doesNotMatch(workbench,/text:tr\('По этому фильтру изменений нет/);
 // Read-only source facts and game mechanics may not be masked by owner copy.
 assert.match(workbench,/Нет подтверждённой расшифровки. Эти изменения требуют отдельной проверки/);
 assert.match(workbench,/Это параметр дополнительных слотов конкретного предмета/);
 for(const key of ['unverifiedExplanation','extraSocketsHelp'])
  assert.ok(!rows.some(row=>row[0]===key),key);
 assert.doesNotMatch(workbench,/os-sync-review-pencil/);
 // Only authorial text is serialized. These expressions still depend on the
 // current calculated count and the selected game-source result.
 for(const dynamic of ['description.rows.length','impacts.length-4',
  'comparison.changes.length-10'])
  assert.ok(workbench.includes(dynamic),dynamic);
});

test('#390: catalog review filters edit captions without turning calculated counts into D1 copy',async()=>{
 const source=workbench.match(/const filterChoices=(\[[\s\S]*?\]);/);
 assert.ok(source,'Filter source must be a literal reviewed bilingual inventory');
 const filters=runInNewContext('('+source[1]+')');
 const ids=['all','added','changed','removed','accepted','declined',
  'needsReview','links','sameVisible','readable'];
 assert.deepEqual(Array.from(filters,row=>String(row[0])).sort(),ids.sort());
 const {buildEditorialDefaultsManifest}=await import('../scripts/plan-editorial-d1-defaults.mjs');
 const manifest=buildEditorialDefaultsManifest();
 assert.equal(manifest.stats.cohorts['catalog-review-filter-captions'],20);
 for(const [id,ru,en] of filters){
  const key='reviewFilter'+id[0].toUpperCase()+id.slice(1);
  const slug=key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
  const record='guideedit.book.catalog-sync.'+slug;
  assert.equal(manifest.records.find(r=>r.recordKey===record&&r.field==='ru')?.value,ru);
  assert.equal(manifest.records.find(r=>r.recordKey===record&&r.field==='en')?.value,en);
  assert.equal(root.PandoraHonorGuide.validOverride('book.catalog-sync.'+slug,
   JSON.stringify({ru:'Подпись QA',en:'QA label'})),true);
 }
 assert.match(workbench,/const caption=h\('span',\{class:'os-sync-filter-caption'/);
 assert.match(workbench,/const total=h\('span',\{class:'os-sync-filter-count'/);
 assert.match(workbench,/editLabel\(caption,key,ru,en\)/);
 assert.match(workbench,/caption.dispatchEvent\(new KeyboardEvent\('keydown'/);
 assert.match(workbench,/if\(pending\)\{clearTimeout\(pending\);pending=null;return\}/);
 assert.match(workbench,/if\(count.textContent!==value\)count.textContent=value/);
 assert.doesNotMatch(workbench,/button.textContent=tr\(ru,en\)\+' · '\+byKind\[id\]/);
});

test('#390: ten independent catalog filter hover hints have bilingual CAS and zero caption overlap',async()=>{
 const source=workbench.match(/const filterHintRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 assert.ok(source,'review hints must have a closed bilingual source inventory');
 const rows=runInNewContext('('+source[1]+')');
 const ids=['all','added','changed','removed','accepted','declined',
  'needsReview','links','sameVisible','readable'];
 assert.deepEqual(Array.from(rows,row=>String(row[0])).sort(),ids.sort());
 const {buildEditorialDefaultsManifest}=await import('../scripts/plan-editorial-d1-defaults.mjs');
 const manifest=buildEditorialDefaultsManifest();
 assert.equal(manifest.stats.cohorts['catalog-review-filter-hover'],20);
 assert.equal(manifest.stats.cohorts['catalog-review-filter-captions'],20);
 for(const [id,ru,en] of rows){
  const key='hintReviewFilter'+id[0].toUpperCase()+id.slice(1);
  const slug=key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
  const recordKey='guideedit.book.catalog-sync.'+slug;
  assert.equal(manifest.records.find(v=>v.recordKey===recordKey&&v.field==='ru')?.value,ru);
  assert.equal(manifest.records.find(v=>v.recordKey===recordKey&&v.field==='en')?.value,en);
  assert.equal(root.PandoraHonorGuide.validOverride('book.catalog-sync.'+slug,
   JSON.stringify({ru:'Подсказка',en:'Hover help'})),true);
  const captionKey=recordKey.replace('hint-review-filter','review-filter');
  assert.notEqual(recordKey,captionKey,'Tooltip and visible caption have independent CAS keys');
  assert.ok(manifest.records.some(v=>v.recordKey===captionKey&&v.field==='ru'),
   'The original visible filter caption must keep its separate RU/EN source key');
 }
 assert.match(workbench,/const wrapper=secondaryHint\(button,'hintReviewFilter'/);
 assert.match(workbench,/wrapper\.classList\.add\('os-sync-filter-hint'\)/);
 assert.match(workbench,/filters\.append\(wrapper\);filterButtons\.set\(id,button\)/);
 assert.doesNotMatch(workbench,/hint\(button,tr\(\.\.\.tips\[id\]\)\)/);
 const css=read('pandora-os-catalog-workbench.css');
 assert.match(css,/\.os-sync-filters>\.os-sync-filter-hint/);
 assert.match(css,/\.os-sync-filter-hint:focus-within>\.os-sync-secondary-pencil/);
 assert.match(css,/@media\(hover:hover\) and \(pointer:fine\)/);
});

test('#390: catalog summary is D1-editable RU/EN text with persistent count siblings',async()=>{
 const match=workbench.match(/const catalogReviewStatusCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 assert.ok(match,'Status vocabulary must have one reviewed source registry');
 const rows=runInNewContext('('+match[1]+')');
 const keys=['affectedSections','selectionTotal','selectionRemaining',
  'selectionNeedsReview','selectionSettings','lineBreaksIncluded',
  'foundChanges','summaryTechnical','summarySelected','summaryUnselected',
  'summaryNeedsReview','noChanges'];
 assert.deepEqual(Array.from(rows,row=>String(row[0])).sort(),keys.sort());
 const {buildEditorialDefaultsManifest}=await import('../scripts/plan-editorial-d1-defaults.mjs');
 const manifest=buildEditorialDefaultsManifest();
 assert.equal(manifest.stats.cohorts['catalog-review-runtime-labels'],24);
 for(const [key,ru,en] of rows){
  const slug=key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
  const id='guideedit.book.catalog-sync.'+slug;
  assert.equal(manifest.records.find(v=>v.recordKey===id&&v.field==='ru')?.value,ru);
  assert.equal(manifest.records.find(v=>v.recordKey===id&&v.field==='en')?.value,en);
  assert.equal(root.PandoraHonorGuide.validOverride('book.catalog-sync.'+slug,
   JSON.stringify({ru:'Проверка',en:'Test'})),true,key);
 }
 assert.match(workbench,/const statusCaption=key=>/);
 assert.match(workbench,/editLabel\(node,key,row\[1\],row\[2\]\)/);
 assert.match(workbench,/const countPart=\(key,separator=''\)=>/);
 assert.match(workbench,/wrap\.append\(statusCaption\(key\),value\)/);
 assert.match(workbench,/const value=' '\+String\(count\)/);
 assert.match(workbench,/setCountPart\(summaryParts\.found,changes\.length,hasChanges\)/);
 assert.match(workbench,/setCountPart\(selectionParts\.total,acceptedChanges\+' \/ '\+changes\.length\)/);
 assert.match(workbench,/overview\.append\(overviewCaption,overviewValues\)/);
 assert.match(workbench,/overviewValues\.textContent=ordered\.length/);
 assert.match(workbench,/for\(const part of Object\.values\(summaryParts\)\)part\.wrap\.hidden=true/);
 assert.match(workbench,/summaryEmpty\.hidden=hasChanges\|\|!baseline/);
 assert.doesNotMatch(workbench,/(?:selectionGuidance|summary|overview)\.textContent\s*=/);
 const css=read('pandora-os-catalog-workbench.css');
 assert.match(css,/\.os-sync-status-copy\.origin-copy-editable::after\{content:none\}/);
 assert.doesNotMatch(workbench,/os-sync-status-pencil/);
});

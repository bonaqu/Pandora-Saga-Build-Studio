import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const source=readFileSync(new URL('scripts/apply-reviewed-pandora-catalog.mjs',root),'utf8');
const worker=readFileSync(new URL('worker/index.js',root),'utf8');
const app=readFileSync(new URL('pandora-studio-app.js',root),'utf8');
const html=readFileSync(new URL('index.html',root),'utf8');
const workbench=readFileSync(new URL('pandora-os-catalog-workbench.js',root),'utf8');

test('new D1 snapshot ID is valid before any catalog batch writes',()=>{
 const expression=workbench.match(/const snapshot=([^;\n]*crypto\.randomUUID\(\)[^;\n]*);/);
 assert.ok(expression,'catalog workbench must generate the snapshot locally');
 const id=vm.runInNewContext(expression[1],{
  crypto:{randomUUID:()=> 'a1234567-89ab-4cde-8123-456789abcdef'}
 });
 assert.match(id,/^ps-[a-f0-9]{32}$/);
 assert.ok(id.length<=64);
});

test('reviewed GitHub export importer defaults to dry run with explicit write opt-in',()=>{
 assert.match(source,/const write=args\.includes\('--write'\)/);
 assert.match(source,/if\(write\)/);
 assert.match(source,/importer\.normalize\(submitted\.datasets,legacy\)/);
 assert.match(source,/pandora-studio-reviewed\.v1/);
 const result=spawnSync(process.execPath,[new URL('scripts/apply-reviewed-pandora-catalog.mjs',root).pathname],
  {encoding:'utf8'});
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/Usage:/);
});
test('catalog admin gate and live snapshot compare remain server authenticated',()=>{
 assert.match(worker,/if\(!await auth\(request,env\)\)return no\('Unauthorized',401\)/);
 assert.match(worker,/Object\.hasOwn\(data,'expectedActive'\)/);
 assert.match(worker,/WHERE id=1 AND snapshot=\?/);
 assert.match(worker,/Published catalog changed during review/);
 assert.match(workbench,/expectedActive:activeSnapshot/);
 assert.match(workbench,/versions\.size!==1/);
 assert.match(workbench,/importer\.normalize\(combined,legacy\)/);
});
test('admin source failures preserve the upstream reason and do not imply game-client file access',()=>{
 assert.match(app,/error[.]reason=data[.]reason\|\|data[.]code\|\|null/);
 assert.match(app,/error[.]sourceDataset=data[.]sourceDataset\|\|null/);
 assert.match(workbench,/error[.]sourceDataset\?\?=name\+'[.]json'/);
 assert.match(workbench,/PandoraGuideTooltip\?\.attach/);
 assert.match(workbench,/не ищет файлы на твоём компьютере/);
 assert.match(workbench,/Сайт игры не разрешил запрос Cloudflare Worker/);
 assert.match(workbench,/Архивная сверка берёт файлы из репозитория/);
});
test('admin workbench is optional for ordinary players and has explicit selection controls',()=>{
 assert.match(app,/function showCatalogImport\(\)/);
 assert.match(app,/if\(!adminToken\)return/);
 assert.match(workbench,/Ни одно изменение не принято автоматически/);
 assert.match(workbench,/Выбрать понятные изменения/);
 assert.match(workbench,/Снять весь выбор/);
 assert.match(workbench,/Выбрать понятные изменения раздела/);
 assert.match(workbench,/Скачать выбранное для GitHub/);
 assert.match(workbench,/new Set\(\)/);
 assert.match(html,/pandora-os-catalog-review\.js\?v=/);
 assert.match(html,/pandora-os-catalog-workbench\.js\?v=/);
});

test('all versioned scripts and styles resolve after descriptive module renames',()=>{
 const names=[...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))\?v=([^"]+)"/g)]
   .map(match=>match[1]);
 assert.equal(new Set(names).size,names.length,'runtime assets must not be duplicated');
 for(const file of names)assert.equal(existsSync(new URL(file,root)),true,file);
 assert.ok(names.indexOf('pandora-os-catalog-import.js')<
   names.indexOf('pandora-os-catalog-workbench.js'));
 assert.ok(names.indexOf('pandora-os-catalog-review.js')<
   names.indexOf('pandora-os-catalog-workbench.js'));
 assert.ok(names.indexOf('pandora-os-catalog-workbench.js')<names.indexOf('pandora-studio-app.js'));
 assert.ok(!names.includes('catalog-import.js'));
 assert.ok(!names.includes('catalog-diff.js'));
});

test('Pandora OS sync does not silently update currently published D1 Legacy translations',()=>{
 assert.match(workbench,/legacyLocale[.]json/);
 assert.match(workbench,/review[.]retainLegacyRows/);
 assert.match(workbench,/normalized[.]entries[.]legacyLocale=legacyRows/);
});

test('admin sessions are independent from player sessions and expired admin auth is handled',()=>{
 assert.match(app,/response\.status===401&&token&&token===adminToken/);
 assert.match(app,/path\.startsWith\('\/api\/admin\/'\)/);
 assert.match(app,/adminToken='';adminEditing=false/);
 assert.match(workbench,/error\.httpStatus===401/);
});
test('live sync detects changing source revision and cannot misreport published snapshots',()=>{
 assert.match(workbench,/sourceFile\('meta','server'\)/);
 assert.match(workbench,/review\.equal\(next\.meta,finalMeta\)/);
 assert.match(workbench,/await afterPublish\(\)/);
 assert.match(workbench,/Данные опубликованы, но не удалось обновить страницу/);
 assert.match(workbench,/if \(busy\) return/);
});

test('administrator sees neutral game-catalog labels instead of a source host brand',()=>{
 assert.match(workbench,/Проверить изменения в текущей игре/);
 assert.match(workbench,/Применить выбранные изменения/);
 assert.match(app,/text:'Игровой каталог',onclick:showCatalogImport/);
 assert.doesNotMatch(workbench,/Pandora Saga OS|Pandora Saga Open Server/);
});

test('local export bridge checks for uncommitted catalog modifications before applying',()=>{
 assert.match(source,/ensureUnchangedCheckout\(\)/);
 assert.match(source,/status','--porcelain'/);
 assert.match(source,/flag:'wx'/);
 assert.match(source,/installed\.reverse\(\)/);
 assert.match(source,/pandora-os-reviewed\.v1/,'older downloads remain accepted');
});

test('owner sync dashboard supports kind and approval filters without auto-acceptance',()=>{
 assert.match(workbench,/\['added','Новые'\]/);
 assert.match(workbench,/\['changed','Изменённые'\]/);
 assert.match(workbench,/\['removed','Удалённые'\]/);
 assert.match(workbench,/\['accepted','Выбранные'\]/);
 assert.match(workbench,/\['declined','Не выбраны'\]/);
 assert.match(workbench,/\.filter\(matchesFilter\)/);
 assert.match(workbench,/Выбрать найденное/);
 assert.match(workbench,/Ни одно изменение не принято автоматически/);
});


test('sync review shows primary update, archival fallback and hidden maintenance tools',()=>{
 assert.match(workbench,/Проверить изменения в текущей игре/);
 assert.match(workbench,/Сверить с сохранённой копией/);
 assert.match(workbench,/Это не проверка игрового сервера в реальном времени/);
 assert.match(workbench,/os-sync-advanced/);
 assert.match(workbench,/os-sync-review-steps/);
 assert.match(workbench,/archiveChoice\.open=true/);
 assert.match(workbench,/progress\.hidden=!value/);
 assert.match(workbench,/не удалось получить обновления из игры/);
 assert.doesNotMatch(workbench,/Сравнить с архивом проекта/);
});


test('catalog admin review interprets source data and excludes raw data from default presentation',()=>{
 const html=readFileSync(new URL('index.html',root),'utf8');
 assert.match(html,/pandora-os-catalog-human-review\.js\?v=/);
 assert.ok(html.indexOf('pandora-os-catalog-human-review.js')<html.indexOf('pandora-os-catalog-workbench.js'));
 assert.match(workbench,/PandoraCatalogHumanReview/);
 assert.match(workbench,/os-sync-change-summary/);
 assert.match(workbench,/Технические сведения \(для разработчика\)/);
 assert.match(workbench,/Служебных:/);
 assert.match(workbench,/Не выбрано:/);
 assert.match(workbench,/changes\.filter\(safe\)/);
 assert.match(workbench,/sourceBanner\.textContent=from===/);
});

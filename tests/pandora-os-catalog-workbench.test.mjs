import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const source=readFileSync(new URL('scripts/apply-reviewed-os-export.mjs',root),'utf8');
const worker=readFileSync(new URL('worker/index.js',root),'utf8');
const app=readFileSync(new URL('pandora-studio-app.js',root),'utf8');
const html=readFileSync(new URL('index.html',root),'utf8');
const workbench=readFileSync(new URL('pandora-os-catalog-workbench.js',root),'utf8');

test('reviewed GitHub export importer defaults to dry run with explicit write opt-in',()=>{
 assert.match(source,/const write=args\.includes\('--write'\)/);
 assert.match(source,/if\(write\)/);
 assert.match(source,/importer\.normalize\(submitted\.datasets,legacy\)/);
 assert.match(source,/pandora-os-reviewed\.v1/);
 const result=spawnSync(process.execPath,[new URL('scripts/apply-reviewed-os-export.mjs',root).pathname],
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
test('admin workbench is optional for ordinary players and has explicit selection controls',()=>{
 assert.match(app,/function showCatalogImport\(\)/);
 assert.match(app,/if\(!adminToken\)return/);
 assert.match(workbench,/Ни одно изменение не принято автоматически/);
 assert.match(workbench,/Принять все/);
 assert.match(workbench,/Отклонить все/);
 assert.match(workbench,/Принять раздел/);
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
 assert.match(workbench,/Проверить обновления игрового каталога/);
 assert.match(workbench,/Применить выбранные изменения/);
 assert.match(app,/text:'Игровой каталог',onclick:showCatalogImport/);
 assert.doesNotMatch(workbench,/Pandora Saga OS|Pandora Saga Open Server/);
});

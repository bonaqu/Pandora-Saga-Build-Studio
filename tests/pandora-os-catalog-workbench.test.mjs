import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const source=readFileSync(new URL('scripts/apply-reviewed-os-export.mjs',root),'utf8');
const worker=readFileSync(new URL('worker/index.js',root),'utf8');
const app=readFileSync(new URL('app.js',root),'utf8');
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

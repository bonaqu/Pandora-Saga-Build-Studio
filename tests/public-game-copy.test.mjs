import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const docs=[
 'README.md','ROADMAP.md','CHANGELOG.md','docs/HP_MP_COVERAGE.md',
 'docs/LOCAL_QA.md','docs/OS_LIVE_PARITY_CHECKS.md',
 'docs/REMAKED_CALCULATOR_PORT.md','docs/REMAKED_FORMULA_INVENTORY.md',
 'docs/STUDIO_ARCHITECTURE.md','worker/SETUP_RU.md',
 'data/os/EXTENDED-CATALOG.md','data/os/PROVENANCE.md',
 'data/localization/README.md','assets/ICON_IMPORT.md',
 'assets/skills/legacy/README.md'
];

test('public copy and maintained docs avoid a specific server name',()=>{
 const page=read('index.html');
 const sources=[...page.matchAll(/(?:src|href)="([^"]+\.(?:js|css))\?v=[^"]+"/g)]
  .map(match=>match[1]);
 for(const path of [...docs,...sources,'worker/index.js']){
  assert.doesNotMatch(read(path),/Pandora Saga (?:OS|Open Server)|Pandora OS/i,
   'A project text still mentions a server brand: '+path);
 }
});

test('admin controls use approachable names while retaining secure API routing',()=>{
 const ui=read('pandora-os-catalog-workbench.js');
 const app=read('pandora-studio-app.js');
 assert.match(ui,/Проверить обновления игрового каталога/);
 assert.match(ui,/Применить выбранные изменения/);
 assert.match(app,/text:'Игровой каталог',onclick:showCatalogImport/);
 assert.match(ui,/api\/admin\/catalog\/source/);
});

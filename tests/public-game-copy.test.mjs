import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const docs=[
 'README.md','docs/HP_MP_COVERAGE.md',
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
 for(const path of [...docs,...sources.filter(s=>s!=='pandora-studio-target-damage.js'),
  'worker/index.js']){
  assert.doesNotMatch(read(path),/Pandora Saga (?:OS|Open Server)|Pandora OS/i,
   'A project text still mentions a server brand: '+path);
 }
});

test('developer source attribution stays documented without polluting user-visible interface',()=>{
 const code=read('pandora-studio-target-damage.js');
 assert.match(code,/public Pandora Saga OS BuildCalculator/);
 assert.match(read('docs/OGRE_ELEMENT_DAMAGE_770.md'),/Pandora Saga OS/);
 const book=read('pandora-studio-hero-book.js');
 const target=book.slice(book.indexOf('const trapSource='),book.indexOf('const elementTerms='));
 assert.doesNotMatch(target,/current OS server|OS formula|server uncertainty|источниковая модель/);
 assert.match(read('index.html'),/pandora-studio-target-damage\.js/);
});

test('admin controls use approachable names while retaining secure API routing',()=>{
 const ui=read('pandora-os-catalog-workbench.js');
 const app=read('pandora-studio-app.js');
 assert.match(ui,/Проверить изменения в текущей игре/);
 assert.match(ui,/Применить выбранные изменения/);
 assert.match(app,/text:'Игровой каталог',onclick:showCatalogImport/);
 assert.match(ui,/api\/admin\/catalog\/source/);
});

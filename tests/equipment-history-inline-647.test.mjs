import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};root.window=root;
runInNewContext(read('pandora-studio-honor-guide.js'),root);

test('equipped Souls heading supports owner RU/EN copy without mutating data',()=>{
 const source=read('pandora-studio-equipment-ui.js');
 assert.match(source,/const ru='Вставленные души',en='Socketed Souls'/);
 assert.match(source,/context\.editLabel\(heading,'socketedSouls',ru,en\)/);
 assert.match(source,/context\?\.canEdit&&typeof context\.editLabel==='function'/);
 assert.match(source,/class:'stage-gear-souls-head'/);
 assert.match(source,/class:'stage-control-pencil stage-gear-souls-pencil'/);
 assert.match(source,/canEdit:api\.canEdit/);
 assert.equal(root.PandoraHonorGuide.validOverride('book.equipment.socketed-souls',
  JSON.stringify({ru:'Души внутри',en:'Installed Souls'})),true);
});
test('manual history reset of UI copy is in place while catalog resets remain',()=>{
 const app=read('pandora-studio-app.js');
 const start=app.indexOf('function showOverrideManager(){');
 const end=app.indexOf(' function wikiDataOrCatalogHasRecord(',start);
 const manager=app.slice(start,end);
 assert.ok(manager.length>1000);
 assert.match(manager,/record\.key\.startsWith\('guideedit\.book\.profile\.'\)/);
 assert.match(manager,/record\.key\.startsWith\('guideedit\.book\.ui\.label\.'\)/);
 assert.ok(manager.includes('(equipment|path|catalog-sync|honor-view)'));
 assert.match(manager,/refreshVisibleOwnerCopy\(record\.key\);saveView\(\)/);
 assert.match(manager,/refreshVisibleProfileCopy\(\);saveView\(\)/);
 assert.match(manager,/refreshVisibleUICopy\(record\.key\)/);
 assert.match(manager,/else void refreshOwnerCatalog\(\)/);
 const browser=read('tests/browser-owner-equipment-inline-632.mjs');
 assert.match(browser,/History reset must use current CAS value/);
 assert.match(browser,/window\.__ownerQAFieldNode===document\.querySelector/);
 assert.match(browser,/guideedit\.book\.equipment\.socketed-souls/);
});

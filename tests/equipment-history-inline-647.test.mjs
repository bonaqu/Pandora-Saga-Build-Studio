import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('manual history reset of author copy never reloads the game catalog',()=>{
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
 assert.match(manager,/else void refreshOwnerCatalog\(\)/,
  'Game-data records still need catalog refresh on reset');
 const browser=read('tests/browser-owner-equipment-inline-632.mjs');
 assert.match(browser,/History reset must use current CAS value/);
 assert.match(browser,/window\.__ownerQAFieldNode===document\.querySelector/);
 assert.doesNotMatch(browser,/stage-gear-souls-head/);
});

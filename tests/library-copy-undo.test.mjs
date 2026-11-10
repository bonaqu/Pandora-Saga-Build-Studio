import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');

test('UI-copy undo updates the visible label without remounting builds',()=>{
 const helper=app.slice(app.indexOf('function refreshVisibleUICopy('),
  app.indexOf('async function undoOwnerEdit(){'));
 assert.match(helper,/locale\.setOverrides\(override\)/);
 assert.match(helper,/locale\.apply\(lang\)/);
 assert.match(helper,/const selector=isLibrary\?'#detailContent \[data-owner-copy-key\]'/);
 assert.match(helper,/document\.querySelectorAll\(selector\)/);
 assert.match(helper,/locale\.fieldKey\(key\)!==id/);
 assert.match(helper,/node\.textContent=value/);
 assert.doesNotMatch(helper,/renderDetails\(|render\(|refreshOwnerCatalog\(/);

 const undo=app.slice(app.indexOf('async function undoOwnerEdit(){'),
  app.indexOf('function showOverrideManager(){'));
 assert.match(undo,/last\.key\.startsWith\('guideedit\.book\.ui\.label\.'\)/);
 assert.match(undo,/refreshVisibleUICopy\(last\.key\)/);
 assert.match(undo,/else await refreshOwnerCatalog\(\)/);
 assert.match(undo,/PandoraAccountUI\?\.refresh\?\.\(\)/);
});

test('saving and undoing UI labels use one update path, not catalog rerenders',()=>{
 const save=app.slice(app.indexOf('async function saveGuidePatchNow('),
  app.indexOf('async function saveGuideList('));
 assert.match(save,/refreshVisibleUICopy\('guideedit\.'\+key\)/);
 assert.match(save,/key\.startsWith\('book\.ui\.label\.library-'\)/);
 assert.match(save,/saveView\(\); \/\/ leave inline editor mounted/);
});

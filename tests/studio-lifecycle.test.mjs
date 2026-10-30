import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
test('restoring builds synchronizes the race preview and branch group',()=>{
 const source=read('app.js');
 assert.match(source,/function restoreLoadedBuildUI\(\)/);
 assert.match(source,/racePreviewIndex=state\.race/);
 assert.match(source,/state=structuredClone\(b\.data\);restoreLoadedBuildUI\(\)/);
 assert.match(source,/state=result;restoreLoadedBuildUI\(\)/);
});
test('inventory picker focuses search and restores slot focus',()=>{
 const source=read('app.js');
 assert.match(source,/function closeStagePicker\(focusSlot=true\)/);
 assert.match(source,/renderStagePicker\(true\)/);
 assert.match(source,/if\(focusSearch\)search\.focus\(/);
 assert.match(source,/'aria-controls':'stagePicker'/);
});
test('automatic updates do not interrupt open editors',()=>{
 const updates=read('updates.js');
 for(const s of ['#detailPanel.is-open','#stagePicker:not([hidden])','.inline-owner-editor'])
  assert.ok(updates.includes(s));
});
test('icon availability is derived from a real manifest',()=>{
 const html=read('index.html'),app=read('app.js');
 assert.match(html,/id="iconStatus"/);
 assert.match(app,/data\.count\.present/);
 assert.match(app,/локальный архив пока не импортирован/);
 assert.equal(JSON.parse(read('site-version.json')).release,JSON.parse(read('package.json')).pandoraRelease);
});

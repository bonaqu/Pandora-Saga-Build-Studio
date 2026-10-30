import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const source=file=>readFileSync(new URL(file,root),'utf8');
test('studio tabs are available without page scrolling',()=>{
 const html=source('index.html'),app=source('app.js'),css=source('style.css');
 for(const id of ['studioBackdrop','detailPanel','detailContent','dockClose','dockTabs','stageQuickbar']){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 for(const tab of ['character','skills','equipment','stats','builds','wiki']){
  assert.match(html,new RegExp('role="tab" data-tab="'+tab+'"'));
 }
 assert.doesNotMatch(app,/scrollIntoView\s*\(/);
 assert.match(app,/function showWorkbench\(/);
 assert.match(app,/function closeWorkbench\(/);
 assert.match(app,/if\(stageSlotPickerOpen\)\{stageSlotPickerOpen=false;renderStagePicker\(\)\}/);
 assert.match(css,/\.detail\.is-open\s*\{/);
 assert.match(css,/\.studio-dock-tabs\s*\{/);
});
test('studio releases and script URLs are consistent',()=>{
 const html=source('index.html');
 const version=JSON.parse(source('site-version.json')).release;
 const pkg=JSON.parse(source('package.json'));
 assert.equal(pkg.pandoraRelease,version);
 assert.match(html,new RegExp('ps-studio-release" content="'+version.replaceAll('.','\\.')+'"'));
 const refs=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]);
 assert.ok(refs.length>0);
 for(const ref of refs)assert.ok(ref.endsWith('?v='+version),ref);
});

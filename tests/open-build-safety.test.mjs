import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
test('switching saved builds preserves unsaved editor changes via an inline choice',()=>{
 assert.match(source,/function openSavedBuild\(b\)/);
 assert.match(source,/if\(!unsavedBuild\(\)\)\{openSavedBuild\(b\);return\}/);
 assert.match(source,/class:'build-open-choice'/);
 assert.match(source,/if\(saveBuild\(\)\)openSavedBuild\(b\)/);
 assert.match(source,/onclick:\(\)=>openSavedBuild\(b\)/);
 assert.match(source,/openChoice\.hidden=true/);
 assert.match(source,/const latest=builds\.find\(record=>record\.id===b\.id\)\|\|b/);
 assert.match(source,/next=prepareSavedBuildSnapshot\(latest\.data\)/);
});

test('new, saved and shared draft transitions only activate after a successful local write',()=>{
 const app=source;
 const start=app.indexOf('function switchActiveDraft(snapshot,id){');
 const end=app.indexOf('function openSavedBuild(b){',start);
 assert.ok(start>=0&&end>start);
 const transition=app.slice(start,end);
 assert.ok(transition.indexOf('if(!persist())')>transition.indexOf('state=snapshot'));
 assert.ok(transition.indexOf('selectActiveBuild(id)')>transition.indexOf('if(!persist())'));
 assert.match(transition,/state=previous/);
 const blank=app.slice(app.indexOf('function newBlankBuild(){'),
  app.indexOf('let buildSearchQuery=',app.indexOf('function newBlankBuild(){')));
 assert.match(blank,/if\(!switchActiveDraft\(fresh\(\),null\)\)return false/);
 const shared=app.slice(app.indexOf('function openSharedSnapshot(share){'),
  app.indexOf('let studioToastTimer=',app.indexOf('function openSharedSnapshot(share){')));
 assert.match(shared,/if\(!verifyViewer\(\)\|\|!requireBuildAccount\(\{shared:true\}\)\|\|\s*!switchActiveDraft\(incoming,null\)\)return false/);
});

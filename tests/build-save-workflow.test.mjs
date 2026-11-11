import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('saving an opened build reuses ID instead of duplicating it',()=>{
 const source=read('pandora-studio-app.js');
 assert.match(source,/const existingIndex=overwriteId\?builds\.findIndex\(b=>b\.id===overwriteId\):-1/);
 assert.match(source,/const id=existing\?existing\.id:newId\(\)/);
 assert.match(source,/if\(existing\)builds\.splice\(existingIndex,1,entry\)/);
 assert.match(source,/else builds\.push\(entry\)/);
 assert.match(source,/if\(!switchActiveDraft\(next,latest\.id\)\)return false/);
 assert.match(source,/if\(!switchActiveDraft\(fresh\(\),null\)\)return false/);
 assert.match(source,/text:'Сохранить копию'/);
 assert.match(source,/text:'↻ Обновить библиотеку'/);
});
test('opening imported public build does not overwrite an unrelated saved original',()=>{
 const source=read('pandora-studio-app.js');
 assert.match(source,/if\(!verifyViewer\(\)\|\|!requireBuildAccount\(\{shared:true\}\)\|\|\s*!switchActiveDraft\(incoming,null\)\)return false/);
 assert.match(source,/if\(activeBuildId===b\.id\)selectActiveBuild\(null\)/);
 assert.match(source,/if\(reconciled\.activeId!==activeBuildId\)selectActiveBuild\(reconciled\.activeId\)/);
 assert.match(read('pandora-studio-build-library-merge.js'),/if\(selected&&!merged\.some\(x=>x\.id===selected\)\)selected=null/);
});

test('saved build identity survives closing and reopening the browser',()=>{
 const src=read('pandora-studio-app.js');
 assert.match(src,/id=localStorage\.getItem\(ACTIVE_BUILD_KEY\)/);
 assert.match(src,/PandoraBuildScope\.setOwned\(localStorage,libraryScopeId\(\),ACTIVE_BUILD_KEY,id\)/);
 assert.match(src,/PandoraBuildScope\.setOwned\(localStorage,libraryScopeId\(\),ACTIVE_BUILD_KEY,id\)/);
 assert.match(src,/builds\.some\(b=>b\.id===id\)\?id:null/);
 assert.match(src,/function newBlankBuild\(\)\{\s*if\(!switchActiveDraft\(fresh\(\),null\)\)return false/);
 assert.match(src,/if\(!verifyViewer\(\)\|\|!requireBuildAccount\(\{shared:true\}\)\|\|\s*!switchActiveDraft\(incoming,null\)\)return false/);
});

test('new-build confirmation survives a background library rerender and retains draft input',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/newBuildPromptOpen=false,newBuildDraftName=null/);
 assert.match(app,/class:'new-build-choice',hidden:!newBuildPromptOpen/);
 assert.match(app,/newBuildDraftName=draft.value/);
 assert.match(app,/newBuildPromptOpen=!newBuildPromptOpen/);
 assert.match(app,/newBuildPromptOpen=false;newBuildDraftName=null;choice.hidden=true/);
 assert.match(app,/if\(previous==='builds'&&tab!=='builds'\)/);
});


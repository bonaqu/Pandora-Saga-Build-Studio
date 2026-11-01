import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('app.js'),page=read('index.html');

test('the retired saved-build auto-overwrite module cannot run in production',()=>{
 assert.equal(existsSync(new URL('../saved-build-autosave.js',import.meta.url)),false);
 assert.doesNotMatch(page,/saved-build-autosave\.js/);
 assert.doesNotMatch(app,/PandoraSavedBuildAutosave|updatedSaved/);
});

test('ordinary autosave writes only the owner-scoped character draft, never named builds or D1',()=>{
 const start=app.indexOf('function persist(){');
 const end=app.indexOf('function persistBuilds(){',start);
 assert.ok(start>0&&end>start);
 const persist=app.slice(start,end);
 assert.match(persist,/window\.PandoraBuildScope\.setOwned\(localStorage,libraryScopeId\(\)/);
 assert.match(persist,/ps-build-studio\.v1/);
 assert.doesNotMatch(persist,/putCloudBuild|ps-build-library\.v1/);
 assert.doesNotMatch(persist,/saveBuild\(/);
});

test('named builds are written only after explicit player save/overwrite intent',()=>{
 assert.match(app,/onclick:\(\)=>saveBuild\(name\.value\)/);
 assert.match(app,/text:'Подтвердить перезапись'/);
 assert.match(app,/if\(saveBuild\(state\.name,b\.id\)\)/);
 assert.match(app,/text:'Сохранить и создать'/);
 assert.match(app,/if\(saveBuild\(draft\.value\)\)newBlankBuild\(\)/);
 const start=app.indexOf("function saveBuild(name=state.name||'Новый герой',overwriteId=null){");
 const end=app.indexOf('function sanitizeSharedState(',start);
 assert.ok(start>0&&end>start);
 const actual=app.slice(start,end);
 assert.match(actual,/const existingIndex=overwriteId&&overwriteId===activeBuildId\?/);
 assert.match(actual,/const id=existingIndex>=0\?builds\[existingIndex\]\.id:newId\(\)/);
 assert.match(actual,/window\.PandoraBuildScope\.setOwned\(localStorage,libraryScopeId\(\)/);
 assert.match(actual,/void putCloudBuild\(entry\)/);
 assert.match(app,/level:1,branch:3/);
});

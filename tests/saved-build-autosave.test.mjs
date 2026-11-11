import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js'),page=read('index.html');

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
 assert.match(app,/text:tr\('Подтвердить перезапись','Confirm overwrite'\)/);
 assert.match(app,/if\(saveBuild\(activeBuildId===b\.id\?state\.name:b\.name,b\.id\)\)/);
 assert.match(app,/text:'Сохранить и создать'/);
 assert.match(app,/if\(saveBuild\(draft\.value\)\)newBlankBuild\(\)/);
 const start=app.indexOf("function saveBuild(name=state.name||'Новый герой',overwriteId=null){");
 const end=app.indexOf('function sanitizeSharedState(',start);
 assert.ok(start>0&&end>start);
 const actual=app.slice(start,end);
 assert.match(actual,/const existingIndex=overwriteId\?builds\.findIndex\(b=>b\.id===overwriteId\):-1/);
 assert.match(actual,/const id=existing\?existing\.id:newId\(\)/);
 assert.match(actual,/if\(existing\)builds\.splice\(existingIndex,1,entry\)/);
 assert.match(actual,/else builds\.push\(entry\)/);
 assert.match(actual,/window\.PandoraBuildScope\.setOwned\(localStorage,libraryScopeId\(\)/);
 assert.match(actual,/void putCloudBuild\(entry\)/);
 assert.match(app,/level:1,branch:3/);
});

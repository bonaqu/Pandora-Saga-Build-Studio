import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('signed-in owners see an explicit legacy import, never a guest library switch',()=>{
 const app=read('pandora-studio-app.js'),ui=read('pandora-studio-account-ui.js');
 const start=app.indexOf('function renderBuilds(root){'),end=app.indexOf('function newId(){',start);
 const panel=app.slice(start,end);
 assert.ok(start>0&&end>start);
 assert.match(panel,/if\(!window\.PandoraAccountUI\?\.isLoggedIn\(\)\)/);
 assert.match(panel,/root\.append\(buildSignInCard\(\)\);return/);
 assert.match(panel,/buildLegacyImport\(\)/);
 assert.doesNotMatch(panel,/buildLibraryTransfer\(\)/);
 assert.match(ui,/function open\(preferredMode='login'\)/);
});
test('old guest saves are carried only into a new registration, not an existing account',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/activateLibraryScope\(\{carry:Boolean\(register\)\}\)/);
 assert.match(app,/if\(register\)pendingGuestDraft=null/);
 assert.match(app,/guest\.owner\.startsWith\('guest:'\)/);
 assert.match(app,/Продолжить гостевого героя/);
 assert.match(app,/Оставить героя аккаунта/);
 assert.match(app,/if\(!accountWasSaved&&!saveBuild\(state\.name\)\)return/);
});

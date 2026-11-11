import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('pandora-studio-app.js'),account=read('pandora-studio-account-ui.js');

test('guest saved-build library is gated and legacy import UI is retired',()=>{
 const start=app.indexOf('function renderBuilds(root){');
 const end=app.indexOf('function newId(){',start);
 assert.ok(start>=0&&end>start);
 const panel=app.slice(start,end);
 assert.match(panel,/if\(!window\.PandoraAccountUI\?\.isLoggedIn\(\)\)/);
 assert.match(panel,/root\.append\(buildSignInCard\(\)\);return/);
 assert.doesNotMatch(app,/function buildLegacyImport\(/);
 assert.doesNotMatch(panel,/buildLegacyImport\(/);
 assert.match(app,/text:tr\('Регистрация','Register'\)/);
});
test('both registration and login preserve only working guest draft, not saved builds',()=>{
 assert.match(app,/if\(tabOwnerScope\?\.startsWith\('guest:'\)&&unsavedBuild\(\)\)/);
 assert.match(app,/pendingGuestDraft=\{snapshot:structuredClone\(state\),owner:tabOwnerScope\}/);
 assert.match(app,/activateLibraryScope\(\);/);
 assert.doesNotMatch(app,/activateLibraryScope\(\{carry:Boolean\(register\)\}\)/);
 assert.doesNotMatch(account,/legacyKey:options\.legacyKey/);
 assert.match(app,/guest\.owner\.startsWith\('guest:'\)/);
 assert.match(app,/if\(!builds\.length\)notifyGuestDraftUnsaved\(\)/);
 assert.match(app,/Оставить героя аккаунта/);
});

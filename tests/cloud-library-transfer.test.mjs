import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('the account library has no old guest-build import action or code form',()=>{
 const app=read('pandora-studio-app.js'),account=read('pandora-studio-account-ui.js');
 const start=app.indexOf('function renderBuilds(root){');
 const end=app.indexOf('function newId(){',start);
 assert.ok(start>=0&&end>start);
 const panel=app.slice(start,end);
 assert.doesNotMatch(panel,/build-transfer|buildLegacyImport|legacy-preview/);
 assert.doesNotMatch(app,/Перенести старые билды|Import older builds/);
 assert.doesNotMatch(app,/\/api\/library\/legacy-preview/);
 assert.doesNotMatch(account,/legacyKey:options\.legacyKey/);
});
test('account save remains explicit; the old legacy API cannot be invoked from player UI',()=>{
 const app=read('pandora-studio-app.js');
 const guest=app.slice(app.indexOf('function buildSignInCard('),
  app.indexOf('function renderBuilds(root){'));
 assert.match(guest,/Sign in to save builds/);
 assert.match(guest,/notifyGuestDraftUnsaved/);
 assert.match(guest,/switchActiveDraft\(structuredClone\(guest\.snapshot\),null\)/);
 assert.match(guest,/if\(!builds\.length\)notifyGuestDraftUnsaved\(\)/);
 assert.doesNotMatch(guest,/legacy-preview|legacyKey/);
});

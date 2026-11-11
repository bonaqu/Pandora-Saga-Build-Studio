import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('guest build library has two real RU/EN account actions and no saving controls',()=>{
 const app=read('pandora-studio-app.js'),css=read('pandora-studio-theme.css');
 const from=app.indexOf('function buildSignInCard('),to=app.indexOf('function renderBuilds(',from);
 const gate=app.slice(from,to);
 assert.ok(from>0&&to>from);
 const locale=read('pandora-studio-ui-locale.js');
 for(const key of ['libraryGuestTitle','libraryGuestLead','libraryGuestStorageWarning',
  'librarySharedGateTitle','librarySharedGateLead','accountSignIn','accountRegister']){
  assert.ok(gate.includes("caption('"+key+"')")||
   ['libraryGuestTitle','librarySharedGateTitle','libraryGuestLead','librarySharedGateLead']
    .includes(key)&&gate.includes("'"+key+"'"),key);
  assert.ok(locale.includes(key+':['),key+' must define RU/EN defaults');
 }
 assert.match(gate,/onclick:\(\)=>openBuildAccount\('login'\)/);
 assert.match(gate,/onclick:\(\)=>openBuildAccount\('register'\)/);
 assert.match(css,/\.build-signin-gate\{/);
 assert.match(css,/\.build-signin-actions .button-action:focus-visible/);
 assert.match(app,/if\(!window\.PandoraAccountUI\?\.isLoggedIn\(\)\)\{\s*root\.append\(buildSignInCard\(\)\);return/);
});
test('successful sign-in resumes shared URLs only after acknowledging recovery code',()=>{
 const app=read('pandora-studio-app.js'),ui=read('pandora-studio-account-ui.js');
 assert.match(app,/onRecoveryAcknowledged:finishBuildAccountEntry/);
 assert.match(app,/hasRecoveryPending\?\.\(\)/);
 assert.match(app,/void restoreSharedHash\(\)/);
 assert.match(ui,/pendingRecoveryCode=null;card\.remove\(\);info\('Резервный код скрыт\.'\)/);
 assert.match(ui,/options\?\.onRecoveryAcknowledged\?\.\(\)/);
});
test('account survives inactivity but not explicit logout or confirmed revocation',()=>{
 const ui=read('pandora-studio-account-ui.js'),worker=read('worker/pandora-studio-account-api.js');
 assert.match(worker,/expires=Number\.MAX_SAFE_INTEGER/);
 assert.match(worker,/DELETE FROM user_sessions WHERE token_hash=\?/);
 const active=ui.slice(ui.indexOf('function activeSession(){'),ui.indexOf('function token(){'));
 assert.doesNotMatch(active,/Date\.now|expires\s*[<>]/);
 assert.match(ui,/error\?\.httpStatus===401\|\|error\?\.httpStatus===403/);
});

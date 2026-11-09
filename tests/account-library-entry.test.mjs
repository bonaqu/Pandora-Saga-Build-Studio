import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('saved-build cloud invitation is visible only to guests with two real account entry links',()=>{
 const app=read('pandora-studio-app.js');
 const css=read('pandora-studio-theme.css');
 const ui=read('pandora-studio-account-ui.js');
 assert.match(app,/const accountReminder=signedIn\?null:h\('aside'/);
 assert.match(app,/class:'build-account-reminder-links'/);
 assert.match(app,/onclick:openAccount\('login'\)/);
 assert.match(app,/onclick:openAccount\('register'\)/);
 assert.match(app,/closeWorkbench\(\);\s*if\(!window\.PandoraAccountUI\?\.open/);
 assert.match(ui,/function open\(preferredMode='login'\)/);
 assert.match(ui,/root\.PandoraAccountUI=Object\.freeze\(\{init,token,open/);
 assert.match(css,/\.build-account-reminder-links a:focus-visible/);
});

test('existing-account sign-in never imports guest saves, but new registration can',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/activateLibraryScope\(\{carry:Boolean\(register\)\}\)/);
 assert.match(app,/expectedOwner\.startsWith\('account:'\)&&!credential/);
 assert.match(app,/if\(!latest\(\)\)return;/);
 assert.match(app,/if\(libraryChangeId!==generation\)/);
});

test('account stays signed in across inactivity without removing explicit logout or revocation',()=>{
 const ui=read('pandora-studio-account-ui.js');
 const worker=read('worker/pandora-studio-account-api.js');
 assert.match(worker,/expires=Number\.MAX_SAFE_INTEGER/);
 assert.match(worker,/DELETE FROM user_sessions WHERE token_hash=\?/);
 const start=ui.indexOf('function activeSession(){');
 const end=ui.indexOf('function token(){',start);
 assert.ok(start>=0&&end>start);
 assert.doesNotMatch(ui.slice(start,end),/Date\.now|expires\s*[<>]/);
 assert.match(ui,/error\?\.httpStatus===401\|\|error\?\.httpStatus===403/);
});

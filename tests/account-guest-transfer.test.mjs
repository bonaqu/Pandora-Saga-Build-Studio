import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
test('guest-only key transfer is not shown as a logged-in account recovery method',()=>{
 const start=app.indexOf('function renderBuilds(root){');
 const end=app.indexOf('function newId(){',start);
 assert.ok(start>0&&end>start);
 const part=app.slice(start,end);
 assert.match(part,/const signedIn=Boolean\(window\.PandoraAccountUI\?\.isLoggedIn\(\)\)/);
 assert.match(part,/signedIn\?\[\]:\[accountReminder,buildLibraryTransfer\(\)\]/);
 assert.match(part,/closeWorkbench\(\);\s*if\(!window\.PandoraAccountUI\?\.open\?\.\(mode\)\)/);
 assert.match(part,/document\.getElementById\('profileTrigger'\)\?\.click\(\)/);
 assert.match(app,/function connectCloudLibrary\(secret,feedback\)/);
 assert.match(app,/Выйдите из аккаунта, чтобы переключить библиотеку по старому коду/);
});

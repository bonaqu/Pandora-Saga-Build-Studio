import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('guest-only key transfer is not shown as a logged-in account recovery method',()=>{
 const start=app.indexOf('function renderBuilds(root){');
 const end=app.indexOf('function newId(){',start);
 assert.ok(start>0&&end>start);
 const part=app.slice(start,end);
 assert.match(part,/PandoraAccountUI\?\.isLoggedIn\(\)\?\[\]:\[buildLibraryTransfer\(\)\]/);
 assert.match(app,/function connectCloudLibrary\(secret,feedback\)/);
 assert.match(app,/Выйдите из аккаунта, чтобы переключить библиотеку по старому коду/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
test('independent tabs cannot redirect account saves or silently switch guest source keys',()=>{
 assert.match(app,/let tabGuestSecret=cloudToken\(\),tabOwnerScope=null/);
 assert.match(app,/window\.PandoraAccountUI\.token\(\)/);
 assert.match(app,/baseUrl:API,\s*onCopyReady:bindAccountCopyEditors/);
 assert.doesNotMatch(app,/legacyKey:\(\)=>tabGuestSecret/);
 assert.doesNotMatch(app,/PandoraBuildScope\.owner\(null,code\)/);
 assert.match(app,/const expectedOwner=tabOwnerScope/);
 assert.match(app,/tabOwnerScope!==expectedOwner/);
 assert.match(app,/if\(!window\.PandoraAccountUI\?\.isLoggedIn\(\)\)/);
});

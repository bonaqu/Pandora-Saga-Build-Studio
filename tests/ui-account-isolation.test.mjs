import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const account=readFileSync(new URL('../account-ui.js',import.meta.url),'utf8');
test('guest and account saved builds cannot mix when switching session identities',()=>{
 assert.match(account,/username:\(\)=>session\?\.username\|\|null/);
 assert.match(app,/activateLibraryScope\(\{carry:Boolean\(register\)\}\)/);
 assert.match(app,/onLogout:\(\)=>\{[\s\S]*?activateLibraryScope\(\)/);
 assert.doesNotMatch(app,/ps-preaccount-library\.v1/);
 assert.match(app,/if\(libraryChangeId!==generation\)return/);
});

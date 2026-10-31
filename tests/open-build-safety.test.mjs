import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('switching saved builds preserves unsaved editor changes via an inline choice',()=>{
 assert.match(source,/function openSavedBuild\(b\)/);
 assert.match(source,/if\(!unsavedBuild\(\)\)\{openSavedBuild\(b\);return\}/);
 assert.match(source,/class:'build-open-choice'/);
 assert.match(source,/if\(saveBuild\(\)\)openSavedBuild\(b\)/);
 assert.match(source,/onclick:\(\)=>openSavedBuild\(b\)/);
 assert.match(source,/openChoice\.hidden=true/);
 assert.match(source,/const draft=structuredClone\(b\.data\),base=fresh\(\)/);
});

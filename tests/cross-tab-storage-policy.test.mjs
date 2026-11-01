import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('all persisted hero records, saves and deletion queues are owner-scoped in concurrent tabs',()=>{
 assert.match(app,/PandoraBuildScope\.setOwned\(localStorage,libraryScopeId\(\),ACTIVE_BUILD_KEY,id\)/);
 assert.match(app,/PandoraBuildScope\.setOwned\(localStorage,libraryScopeId\(\),\s*'ps-build-studio\.v1'/);
 assert.match(app,/PandoraBuildScope\.setOwned\(localStorage,libraryScopeId\(\),\s*'ps-build-library\.v1'/);
 assert.match(app,/PandoraBuildScope\.getOwned\(localStorage,libraryScopeId\(\),\s*CLOUD_DELETES_KEY\)/);
 assert.match(app,/PandoraBuildScope\.setOwned\(localStorage,libraryScopeId\(\),\s*CLOUD_DELETES_KEY/);
 assert.doesNotMatch(app,/localStorage\.setItem\('ps-build-library\.v1'/);
 assert.doesNotMatch(app,/localStorage\.setItem\('ps-build-studio\.v1'/);
});

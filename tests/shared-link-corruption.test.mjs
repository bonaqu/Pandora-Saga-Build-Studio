import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const worker=readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('../pandora-studio-ui-locale.js',import.meta.url),'utf8');
test('invalid public share is a user-facing 410, not an unhandled exception',()=>{
 assert.match(worker,/reason:'invalid'\},410/);
 assert.match(app,/error\.reason==='invalid'/);
 assert.match(app,/Ссылка на билд повреждена/);
 assert.match(ui,/This build link is damaged/);
 assert.doesNotMatch(worker,/return json\(\{schema:1,share:JSON\.parse\(row\.payload\)\}\)/);
});

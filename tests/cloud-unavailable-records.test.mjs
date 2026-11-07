import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const worker=readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
const locale=readFileSync(new URL('../pandora-studio-ui-locale.js',import.meta.url),'utf8');
test('cloud loading reports quarantined rows without autosaving their old IDs',()=>{
 assert.match(app,/const \{outgoing,copies,unavailable\}=reconciled/);
 assert.match(app,/if\(unavailable&&libraryChangeId===generation\)/);
 assert.match(app,/original records are preserved/);
 assert.match(locale,/Некоторые облачные билды недоступны/);
 assert.match(worker,/unavailable:true/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const src=readFileSync(new URL('../pandora-studio-honor-view.js',import.meta.url),'utf8');
test('PvP victories illustration never accesses an external image host',()=>{
 assert.match(src,/src:'assets\/wiki\/honor-victories\.jpg'/);
 assert.match(src,/eventImage\.addEventListener\('error',\(\)=>eventImage\.remove\(\)\)/);
 assert.doesNotMatch(src,/pandorasaga-os\.com|officialScreenshot|originalTried/);
 assert.ok(statSync(new URL('../assets/wiki/honor-victories.jpg',import.meta.url)).size>10000);
});

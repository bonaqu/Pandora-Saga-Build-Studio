import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('offline updates to an existing saved ID remain preferred when D1 contains an older version',()=>{
 const app=read('app.js');
 assert.match(app,/const localById=new Map\(builds\.map\(entry=>\[entry\.id,entry\]\)\)/);
 assert.match(app,/Number\(local\.at\)>Number\(record\.entry\.at\)/);
 assert.match(app,/merged\.push\(local\);outgoing\.push\(local\)/);
 assert.match(app,/if\(libraryChangeId!==generation\)break/);
 assert.match(app,/await putCloudBuild\(entry\)/);
});
test('monotonic per-build timestamps and atomic SQLite revision guard prevent late writes',()=>{
 const app=read('app.js'),worker=read('worker/index.js');
 assert.match(app,/Math\.max\(Date\.now\(\),\(existingIndex>=0\?Number\(builds\[existingIndex\]\.at\)\|\|0:0\)\+1\)/);
 assert.match(worker,/private_builds\.deleted_at IS NULL AND CAST\(json_extract\(private_builds\.payload,'\$\.at'\) AS INTEGER\)<=excluded\.updated_at/);
 assert.match(worker,/reason:'stale'/);
 assert.match(worker,/reason:'deleted'/);
});

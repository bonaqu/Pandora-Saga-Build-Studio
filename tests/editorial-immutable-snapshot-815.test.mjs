import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {buildEditorialDefaultsManifest} from '../scripts/plan-editorial-d1-defaults.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const snapshot='0.948.0-5637e5c111eb4528';
const sha='5637e5c111eb452800609eb44f808f2f9d465277252595ad8e2c125f79cb6c8d';
test('#815 immutable 2734-row editorial archive is the exactly deployed #390 D1 baseline',()=>{
 const archive=JSON.parse(read('data/editorial-defaults/snapshot-0.948.0.json'));
 assert.equal(archive.snapshot,snapshot);
 assert.equal(archive.sha256,sha);
 assert.equal(archive.release,'0.948.0');
 assert.equal(archive.records.length,2734);
 assert.equal(createHash('sha256').update(JSON.stringify({
  schema:archive.schema,release:archive.release,records:archive.records
 })).digest('hex'),sha);
 const actual=buildEditorialDefaultsManifest();
 assert.equal(actual.snapshot,archive.snapshot);
 assert.equal(actual.digest,archive.sha256);
 assert.deepEqual(actual.records,archive.records);
 assert.equal(actual.stats.entries,2734);
});
test('#815 releasing a new website never silently regenerates the old production D1 snapshot',()=>{
 const pkg=JSON.parse(read('package.json'));
 assert.notEqual(pkg.version,'0.948.0','The site is now a later release');
 const generated=buildEditorialDefaultsManifest();
 assert.equal(generated.release,'0.948.0');
 assert.equal(generated.snapshot,snapshot);
 const source=read('scripts/plan-editorial-d1-defaults.mjs');
 assert.match(source,/snapshot-0\.948\.0\.json/);
 assert.match(source,/assertVerifiedManifest\(pinned\)/);
});

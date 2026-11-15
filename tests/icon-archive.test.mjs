import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isWebP} from '../scripts/icon-utils.mjs';

const root=new URL('../',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('assets/os-icon-manifest.json',root),'utf8'));

test('archived OS icons have complete, consistent source coverage metadata',()=>{
 const {count,icons,missing}=manifest;
 assert.equal(count.expected,1454,'re-audit if upstream catalog inventory changes');
 const paths=Object.values(icons).flatMap(v=>Object.values(v));
 assert.equal(paths.length,count.present);
 assert.equal(count.expected-count.present,count.missing);
 assert.ok(count.present>=1100,'original icon archive unexpectedly lost');
 assert.equal(new Set(paths).size,paths.length,'every asset path is unique');
 assert.equal(missing.length,count.missing,'every unavailable source has an explicit record');
 assert.equal(count.known404,264,'Only observed source 404 evidence');
 assert.equal(count.unverified,20,'New paths have no HTTP verdict');
 const failures=new Set();
 for(const row of missing){
  const key=row.kind+'/'+row.stem;
  assert.equal(failures.has(key),false,'duplicate missing '+key);
  failures.add(key);
  assert.ok(['HTTP 404','Not attempted'].includes(row.error),
   'Unprobed originals must never be attributed fabricated HTTP 404 results');
 }
});

test('every manifest entry points to actual verified WebP with its own skill, item or Soul filename',()=>{
 for(const [kind,entries] of Object.entries(manifest.icons)){
  assert.ok(['skills','items','souls'].includes(kind));
  for(const [stem,path] of Object.entries(entries)){
   assert.equal(path,'assets/'+kind+'/icons/'+stem+'.webp');
   assert.match(stem,/^[a-zA-Z0-9_-]{1,120}$/);
   assert.ok(isWebP(readFileSync(new URL(path,root))),path);
  }
 }
 assert.ok(Object.keys(manifest.icons.souls).length>0,
  'original Souls must use shared OS item source and self-hosted Soul filenames');
});

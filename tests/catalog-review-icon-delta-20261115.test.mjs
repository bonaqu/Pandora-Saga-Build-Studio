import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditCatalogIconDelta,auditPinnedCandidateIcons}
 from '../scripts/audit-catalog-review-icon-delta.mjs';

const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const manifest=read('assets/os-icon-manifest.json');
const old=Object.fromEntries(['items','skills','souls'].map(k=>[
 k,read('data/os/'+k+'.json')]));
const candidate=Object.fromEntries(['items','skills','souls'].map(k=>[
 k,read('data/catalog-review/ps-ca9a604163b54a2da5c83ea55077ef96/'+k+'.json')]));

test('source icon delta is deterministic and does not mutate the catalog',()=>{
 const before=JSON.stringify([old,candidate,manifest]);
 const report=auditPinnedCandidateIcons();
 const replay=auditPinnedCandidateIcons();
 assert.deepEqual(report,replay);
 assert.equal(report.readOnly,true);
 assert.equal(report.added,Object.values(report.byKind)
  .reduce((sum,kind)=>sum+kind.addedDistinct,0));
 assert.equal(report.verified+report.unverified,report.added);
 assert.ok(report.entries.every(x=>!x.path.startsWith('https:')));
 assert.equal(JSON.stringify([old,candidate,manifest]),before);
});

test('new catalog identities are not silently assigned images from similar names',()=>{
 const report=auditCatalogIconDelta({historical:old,candidate,manifest});
 for(const row of report.entries){
  assert.equal(row.verification,'unverified');
  assert.equal(row.previouslyReported404,false,
   'Unprobed icons must not be labeled HTTP 404');
 }
 assert.equal(report.unverified,report.added);
});

test('even an injected manifest entry is not proof of local WebP bytes',()=>{
 const base=auditCatalogIconDelta({historical:old,candidate,manifest});
 if(!base.entries.length)return; // Future archive promotion: no new identities.
 const row=base.entries[0];
 const edited=structuredClone(manifest);
 edited.icons[row.kind]??={};
 edited.icons[row.kind][row.stem]=row.path;
 const unsafe=auditCatalogIconDelta({
  historical:old,candidate,manifest:edited,verifyAsset:()=>false});
 assert.equal(unsafe.entries.find(x=>x.stem===row.stem&&x.kind===row.kind)
  ?.verification,'unverified');
 const verified=auditCatalogIconDelta({
  historical:old,candidate,manifest:edited,verifyAsset:path=>path===row.path});
 assert.equal(verified.entries.find(x=>x.stem===row.stem&&x.kind===row.kind)
  ?.verification,'verified');
});

test('shared exact artwork identities are not mistakenly counted as new',()=>{
 const current=auditCatalogIconDelta({historical:old,candidate,manifest});
 const same=auditCatalogIconDelta({historical:candidate,candidate,manifest});
 assert.equal(same.added,0);
 assert.equal(same.unverified,0);
 assert.ok(current.added>=same.added);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,symlinkSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {auditReview} from '../scripts/check-catalog-review-2026-11-15.mjs';

const root=resolve(new URL('../',import.meta.url).pathname);
const candidate=join(root,'data/catalog-review/ps-ca9a604163b54a2da5c83ea55077ef96');
const archive=join(root,'data/os');
const read=(dir,file)=>JSON.parse(readFileSync(join(dir,file),'utf8'));

test('staged D1 review has complete counts and preserved RU text without promoting',()=>{
 const result=auditReview();
 assert.equal(result.snapshot,'ps-ca9a604163b54a2da5c83ea55077ef96');
 assert.equal(result.files,17);
 assert.equal(result.counts.items,1140);
 assert.equal(result.counts.skills,571);
 assert.equal(result.counts.monsters,707);
 assert.equal(result.counts.drops,180);
 assert.equal(result.counts.souls,115);
 assert.equal(result.changedSkills,10);
 assert.equal(result.addedSkills,2);
 assert.equal(result.preservedRuBlurbs,6);
 assert.equal(result.brokenItemReferences,0);
 assert.equal(result.promoted,false);
 assert.equal(Object.keys(read(archive,'items.json')).length,1116);
 assert.equal(Object.keys(read(archive,'skills.json')).length,569);
 assert.equal(read(archive,'tables.json').levelCap,45);
 assert.equal(read(candidate,'tables.json').levelCap,50);
});
test('review guard rejects tampered candidate file hashes',()=>{
 const temp=mkdtempSync(join(tmpdir(),'ps-d1-review-'));
 try{
  const manifest=read(candidate,'REVIEW_MANIFEST.json');
  for(const file of manifest.candidateFiles)
   symlinkSync(join(candidate,file),join(temp,file));
  manifest.files['items.json'].sha256='0'.repeat(64);
  writeFileSync(join(temp,'REVIEW_MANIFEST.json'),JSON.stringify(manifest));
  assert.throws(()=>auditReview({candidateDir:temp,archiveDir:archive}),
   /Checksum or file-size mismatch: items.json/);
 }finally{rmSync(temp,{recursive:true,force:true})}
});
test('inert staged snapshot is not a runtime fallback or game-source rewrite',()=>{
 const app=readFileSync(join(root,'pandora-studio-app.js'),'utf8');
 const catalog=readFileSync(join(root,'pandora-studio-encyclopedia-catalog.js'),'utf8');
 assert.doesNotMatch(app,/data\/catalog-review/);
 assert.doesNotMatch(catalog,/data\/catalog-review/);
 assert.ok(app.includes("const base=archive?'./data/os'"));
});
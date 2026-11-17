import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source={window:{}};
for(const path of ['pandora-os-catalog-import.js',
 'pandora-os-catalog-review.js','pandora-studio-catalog-safety.js'])
 vm.runInNewContext(read(path),source,{filename:path});
const importer=source.window.PandoraCatalogImport,
 review=source.window.PandoraOSCatalogReview,
 safety=source.window.PandoraCatalogSafety;
const ids=Object.freeze(['19010','19011','20027','20028','21019','21020','22022']);
const current=Object.fromEntries(importer.files.map(name=>[
 name,JSON.parse(read('data/os/'+name+'.json'))
]));
const publishedFixture=()=>{
 const data=structuredClone(current);
 for(const id of ids){
  assert.equal(data.items[id]?.level,50,'Confirmed upstream archive level '+id);
  data.items[id].level=55;
 }
 return data;
};
const candidate=()=>({
 old:publishedFixture(),
 source:structuredClone(current)
});

test('confirmed seven-level D1-like fixture yields exactly seven selectable item changes',()=>{
 const {old,source}=candidate(),oldCopy=JSON.stringify(old),
  sourceCopy=JSON.stringify(source);
 const differences=importer.files.flatMap(name=>
  review.changes(name,old[name],source[name]));
 assert.equal(differences.length,7,'No unselected gameplay formulas, skills, Souls or names');
 assert.deepEqual(differences.map(row=>row.key).sort(),[...ids].sort());
 assert.ok(differences.every(row=>row.dataset==='items'&&
  row.kind==='changed'&&row.before.level===55&&row.after.level===50));
 for(const row of differences){
  const from=structuredClone(row.before),to=structuredClone(row.after);
  delete from.level;delete to.level;
  assert.deepEqual(to,from,'Only level is changed on '+row.key);
 }
 assert.equal(JSON.stringify(old),oldCopy);
 assert.equal(JSON.stringify(source),sourceCopy);
});

test('existing selective CAS publish compose stages only seven corrected level fields',()=>{
 const {old,source}=candidate();
 const previous=JSON.stringify(old),next=JSON.stringify(source);
 const discovered=importer.files.flatMap(name=>
  review.changes(name,old[name],source[name]));
 const selected=new Set(discovered.map(row=>row.id));
 const merged=review.compose(old,source,selected,importer.files);
 const audit=review.auditSelection(old,source,merged,selected,importer.files);
 assert.equal(audit.approved,7);
 assert.equal(audit.retained,0);
 assert.equal(Object.keys(merged.items).length,1140);
 for(const id of ids){
  assert.equal(merged.items[id].level,50);
  assert.equal(merged.items[id].desc,old.items[id].desc);
  assert.deepEqual(merged.items[id].effects,old.items[id].effects);
 }
 for(const name of importer.files)
  assert.equal(review.strictEqual(merged[name],source[name]),true,
   'Only the seven differences are staged; all other '+name+' records stay intact');
 assert.equal(JSON.stringify(old),previous,'No mutation of old/D1 fixture');
 assert.equal(JSON.stringify(source),next,'No mutation of official source fixture');
});

test('prepublish safety validates the resulting complete catalog and its reference graph',()=>{
 const {old,source}=candidate();
 const chosen=new Set(ids.map(id=>review.id('items',id)));
 const proposed=review.compose(old,source,chosen,importer.files);
 const selection=review.auditSelection(old,source,proposed,chosen,importer.files);
 assert.equal(selection.approved,7);
 const gate=safety.check(proposed);
 assert.equal(gate.ok,true,(gate.issues||[]).join(' / '));
 const linkCheck=safety.sourceGraphIntegrity(old,proposed);
 assert.equal(linkCheck.ok,true,JSON.stringify(linkCheck.samples||[]));
 assert.equal(linkCheck.newBroken,0);
});

test('an altered selected level fails audit; a different unselected record stays untouched',()=>{
 const {old,source}=candidate();
 // Additional hypothetical item field change is NOT among the seven
 // source-confirmed level corrections, and cannot be silently accepted.
 source.items['1'].W+=1;
 const found=importer.files.flatMap(name=>review.changes(name,old[name],source[name]));
 assert.equal(found.length,8);
 const selected=new Set(ids.map(id=>review.id('items',id)));
 const proposed=review.compose(old,source,selected,importer.files);
 const accepted=review.auditSelection(old,source,proposed,selected,importer.files);
 assert.equal(accepted.approved,7);
 assert.equal(accepted.retained,1);
 assert.equal(proposed.items['1'].W,old.items['1'].W);
 assert.notEqual(proposed.items['1'].W,source.items['1'].W);
 proposed.items[ids[0]].level=51;
 assert.throws(()=>review.auditSelection(old,source,proposed,selected,importer.files),
  /Подготовленные данные отличаются от выбора/);
});

test('no hardcoded production credentials or direct D1 write is needed for the fixture',()=>{
 const app=read('pandora-os-catalog-workbench.js');
 const worker=read('worker/index.js');
 assert.match(app,/expectedActive:activeSnapshot/);
 assert.match(app,/request\('\/api\/admin\/catalog\/publish'/);
 assert.match(worker,/WHERE id=1 AND snapshot=\?/);
 assert.match(app,/verifyPublishedSnapshot/);
 assert.doesNotMatch(read('tests/catalog-seven-live-levels-20261117.test.mjs'),
  /Authorization:|Bearer |wrangler d1/);
});

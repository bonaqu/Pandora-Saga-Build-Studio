import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
import {
 buildEditorialDefaultsManifest,renderEditorialDefaultsSQL,
 verifyEditorialDefaultsReadback
} from '../scripts/plan-editorial-d1-defaults.mjs';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const manifest=buildEditorialDefaultsManifest();

test('issue 390: source-authored D1 default snapshot is stable and uses exact existing keys',()=>{
 const repeated=buildEditorialDefaultsManifest();
 assert.equal(manifest.schema,1);
 assert.equal(manifest.release,JSON.parse(read('package.json')).version);
 assert.match(manifest.digest,/^[a-f0-9]{64}$/);
 assert.match(manifest.snapshot,/^0\.[0-9]+\.[0-9]+-[a-f0-9]{16}$/);
 assert.equal(manifest.digest,repeated.digest);
 assert.equal(manifest.snapshot,repeated.snapshot);
 assert.deepEqual(manifest.records,repeated.records);
 assert.ok(manifest.records.length>200,'Expected substantive bilingual UI authorial coverage');
 assert.equal(manifest.stats.entries,manifest.records.length);
 assert.ok(manifest.records.length<=3000,'Matches read-only Worker record limit');
 assert.ok(manifest.records.reduce((n,r)=>n+r.value.length,0)<=450000,
  'Matches read-only Worker total source-character limit');
 const identities=manifest.records.map(r=>r.recordKey+'\u0000'+r.field);
 assert.equal(new Set(identities).size,identities.length,'Duplicate D1 field');
 assert.deepEqual([...identities].sort(),identities,'Canonical deterministic row order');
 assert.ok(manifest.stats.cohorts['ui-locale']>100);
 assert.ok(manifest.stats.cohorts['semantic-hints']>10);
 assert.ok(manifest.stats.cohorts['honor-overview']>10);
 assert.equal(manifest.stats.cohorts['item-field'],32,
  'Eight exact item stat labels and hover descriptions, RU + EN');
 assert.equal(manifest.stats.cohorts['equipment-tabs'],6,
  'Three existing equipment setting tabs, RU + EN');
 for(const key of ['kind','level','w','pen','ac','atkspeed','range','soulslot']){
  const recordKey='guideedit.book.wiki.item-field.'+key;
  const fields=manifest.records.filter(r=>r.recordKey===recordKey)
   .map(r=>r.field).sort();
  assert.deepEqual(fields,['en','hintEn','hintRu','ru'],
   'Only source-authorial item copy may be staged for '+key);
 }
 for(const tab of ['choose','details','souls']){
  const key='guideedit.book.equipment.tab.'+tab;
  assert.deepEqual(manifest.records.filter(r=>r.recordKey===key)
   .map(r=>r.field).sort(),['en','ru']);
 }
 assert.ok(manifest.stats.cohorts['owner-dock']>=40,
  'The existing owner dock headings and instructions must be in the D1 plan');
 for(const [key,locale] of [
  ['title','ru'],['step1','en'],['groupToolsHint','ru'],['finishHelp','en']
 ]){
  const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  const recordKey='guideedit.book.owner-dock.'+slug;
  const match=manifest.records.filter(r=>r.recordKey===recordKey&&r.field===locale);
  assert.equal(match.length,1,'Missing owner-dock default '+recordKey+'/'+locale);
 }
 assert.ok(manifest.records.some(r=>
  r.recordKey.startsWith('guideedit.book.ui.label.book-')&&r.field==='en'));
 assert.ok(manifest.records.some(r=>
  r.recordKey==='guideedit.honor.overview'&&r.field==='overviewRu'));
});

test('issue #390: all exact Wiki label field identities enter the physical D1 defaults plan',()=>{
 const scope={};scope.window=scope;
 runInNewContext(read('pandora-studio-wiki-labels.js'),scope);
 const wiki=scope.PandoraWikiLabels;
 const expected=[];
 for(const [group,entries] of [
  ['chapter',wiki.chapter],['honor',wiki.honor],['skillFilter',wiki.skillFilter]
 ]){
  for(const [id,[ru,en]] of Object.entries(entries)){
   expected.push([wiki.key(group,id,'ru'),ru]);
   expected.push([wiki.key(group,id,'en'),en]);
  }
 }
 const rows=manifest.records.filter(row=>row.recordKey==='guideedit.wiki.labels');
 assert.equal(manifest.stats.cohorts['wiki-labels'],expected.length);
 assert.equal(rows.length,expected.length);
 assert.equal(wiki.honor.victories[0],'Победы в PvP');
 assert.equal(wiki.honor.victories[1],'PvP Victories');
 for(const [field,value] of expected){
  assert.equal(wiki.validField(field),true,field);
  assert.equal(rows.filter(row=>row.field===field&&row.value===value).length,1,
   'Unmapped or duplicate Wiki author-copy field '+field);
 }
 for(const field of ['honor_victories_points','chapter_42_ru','skill_filter_stats_en'])
  assert.equal(rows.some(row=>row.field===field),false,
   'Runtime/game-derived fields must never enter authorial defaults');
});

test('issue 390: migration never materializes runtime values or rewrites an override',()=>{
 assert.equal(manifest.records.some(r=>
  /(?:^|\.)(?:character|item|soul|account|formula|amount|gold|points|chance)\.[0-9]+/.test(r.recordKey)),false);
 for(const row of manifest.records){
  assert.match(row.recordKey,/^guideedit\./);
  assert.doesNotMatch(row.value,/[\x00-\x08\x0b\x0c\x0e-\x1f]/);
 }
 // The default Honor rows intentionally exclude mutable progression
 // thresholds. They still have the original D1 keys for authorial copy.
 const rankEntries=manifest.records.filter(r=>r.recordKey.startsWith('guideedit.honor.rank.'));
 assert.ok(rankEntries.length>20);
 assert.ok(rankEntries.every(r=>['nameRu','nameEn','benefitRu','benefitEn'].includes(r.field)));
 const sql=renderEditorialDefaultsSQL(manifest);
 assert.equal((sql.match(/INSERT INTO editorial_default_rows\(/g)||[]).length,
  manifest.records.length);
 assert.equal((sql.match(/INSERT INTO editorial_default_snapshots\(/g)||[]).length,1);
 assert.ok(sql.lastIndexOf('INSERT INTO editorial_default_snapshots(')>
  sql.lastIndexOf('INSERT INTO editorial_default_rows('),
  'Completion marker is inserted only after all source text rows');
 assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE FROM|REPLACE INTO)\s+overrides\b/i);
 assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE FROM|REPLACE INTO)\s+editorial_default_rows\b/i);
 assert.match(sql,/ON CONFLICT\(snapshot,record_key,field\) DO NOTHING/);
 assert.match(sql,/SELECT COUNT\(\*\) AS actual_rows/);
});

test('issue 390: staging D1 readback is rejected on partial, stale or corrupted rows',()=>{
 const metadata={snapshot:manifest.snapshot,source_release:manifest.release,
  sha256:manifest.digest,expected_rows:manifest.records.length};
 const rows=manifest.records.map(r=>({
  record_key:r.recordKey,field:r.field,value:r.value
 })).reverse();
 const verified=verifyEditorialDefaultsReadback(manifest,metadata,rows);
 assert.deepEqual(verified,{ok:true,checkedRows:rows.length,
  snapshot:manifest.snapshot,digest:manifest.digest});
 assert.equal(verifyEditorialDefaultsReadback(manifest,metadata,
  rows.slice(1)).reason,'row-count-mismatch');
 assert.equal(verifyEditorialDefaultsReadback(manifest,metadata,
  [rows[0],...rows.slice(0,-1)]).reason,'duplicate-record');
 const corrupted=rows.map((row,i)=>i===1?{...row,value:'tampered'}:row);
 assert.equal(verifyEditorialDefaultsReadback(manifest,metadata,
  corrupted).reason,'content-digest-mismatch');
 assert.equal(verifyEditorialDefaultsReadback(manifest,
  {...metadata,sha256:'not-the-installed-source'},rows).reason,
  'snapshot-metadata-mismatch');
 assert.equal(verifyEditorialDefaultsReadback(manifest,metadata,
  [{record_key:null,field:'ru',value:'Unknown'},...rows.slice(1)])
  .reason,'invalid-record');
});

test('issue 390: snapshot tampering cannot produce an installable SQL plan',()=>{
 assert.throws(()=>renderEditorialDefaultsSQL({...manifest,digest:'0'.repeat(64)}),
  /SHA-256/);
 assert.throws(()=>renderEditorialDefaultsSQL({...manifest,records:[
  {...manifest.records[0],value:'Malicious substitution'},...manifest.records.slice(1)
 ]}),/SHA-256/);
 assert.throws(()=>renderEditorialDefaultsSQL({...manifest,snapshot:'current'}),
  /SHA-256/);
 assert.throws(()=>renderEditorialDefaultsSQL({...manifest,records:[]}),/SHA-256/);
});

test('issue 390: Windows-safe CLI reports sources and rejects damaged staging readback',()=>{
 const cli=fileURLToPath(new URL('../scripts/plan-editorial-d1-defaults.mjs',import.meta.url));
 const command=(...args)=>spawnSync(process.execPath,[cli,...args],
  {encoding:'utf8',maxBuffer:4*1024*1024});
 const report=command('--report');
 assert.equal(report.status,0,report.stderr);
 const summary=JSON.parse(report.stdout);
 assert.equal(summary.digest,manifest.digest);
 assert.equal(summary.snapshot,manifest.snapshot);
 assert.equal(summary.entries,manifest.records.length);
 const dir=mkdtempSync(join(tmpdir(),'pandora-editorial-'));
 const file=join(dir,'readback.json');
 try{
  const input={
   metadata:{snapshot:manifest.snapshot,source_release:manifest.release,
    sha256:manifest.digest,expected_rows:manifest.records.length},
   rows:manifest.records.map(r=>({
    record_key:r.recordKey,field:r.field,value:r.value
   }))
  };
  writeFileSync(file,JSON.stringify(input));
  const valid=command('--verify-readback',file);
  assert.equal(valid.status,0,valid.stderr);
  assert.equal(JSON.parse(valid.stdout).ok,true);
  input.rows[0].value+=' tampered';
  writeFileSync(file,JSON.stringify(input));
  const invalid=command('--verify-readback',file);
  assert.equal(invalid.status,1,'Readback hash mismatch must fail the CLI');
  assert.equal(JSON.parse(invalid.stdout).reason,'content-digest-mismatch');
 }finally{rmSync(dir,{recursive:true,force:true})}
});

test('issue 390: current public reads and CAS writes remain on the existing override protocol',()=>{
 const worker=read('worker/index.js');
 const locale=read('pandora-studio-ui-locale.js');
 assert.match(worker,/if\(path==='\/api\/overrides'&&method==='GET'\)/);
 assert.match(worker,/if\(path==='\/api\/admin\/override'&&method==='POST'\)/);
 assert.match(locale,/contentOverrides\['guideedit\.book\.'\+id\]/);
 assert.match(locale,/const fallback=defaults\[lang==='en'\?1:0\]/);
 assert.match(locale,/typeof saved==='string'&&saved\.trim\(\)&&saved\.length<=max\?saved:/);
 assert.match(locale,/typeof staged==='string'&&staged\.trim\(\)&&staged\.length<=max\?staged:fallback/);
 // A staged migration manifest is not an excuse to silently switch site
 // text reads or deploy a new default snapshot on the live Worker.
 assert.match(worker,/if\(path==='\/api\/editorial-defaults'&&method==='GET'\)/);
 assert.doesNotMatch(locale,/\/api\/editorial-defaults/);
 // The optional read-only backend endpoint is not a frontend activation.
 assert.match(worker,/readVerifiedEditorialSnapshot\(env\.DB,snapshot\)/);
});

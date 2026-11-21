import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
import {
 buildEditorialDefaultsManifest,renderEditorialDefaultsSQL,
 renderEditorialDefaultsReadbackSQL,renderEditorialDefaultsRollbackSQL,
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


test('issue 390: real SQLite rehearsal round-trips pinned import and isolated rollback',async(t)=>{
 // Node 22 is the mandatory CI runtime. Older supported Node 20 can run the
 // planner; only the extra local SQLite rehearsal is skipped there.
 if(Number(process.versions.node.split('.')[0])<22){
  t.skip('node:sqlite rehearsal needs Node 22');return;
 }
 const {DatabaseSync}=await import('node:sqlite');
 const db=new DatabaseSync(':memory:');
 try{
  db.exec(renderEditorialDefaultsSQL(manifest));
  const exportQuery=renderEditorialDefaultsReadbackSQL(manifest);
  assert.match(exportQuery,/^-- STAGING READBACK ONLY/m);
  assert.doesNotMatch(exportQuery,/\b(?:INSERT|UPDATE|DELETE|CREATE|DROP)\b/i);
  let exported=JSON.parse(db.prepare(exportQuery).get().staging_readback_json);
  assert.equal(typeof exported.metadata,'object','Metadata must be a JSON object');
  assert.ok(Array.isArray(exported.rows),'Readback rows must be a JSON array');
  assert.deepEqual(verifyEditorialDefaultsReadback(manifest,exported.metadata,
   exported.rows),{ok:true,checkedRows:manifest.records.length,
    snapshot:manifest.snapshot,digest:manifest.digest});
  // Retrying a successful import must be idempotent: no rows are replaced.
  db.exec(renderEditorialDefaultsSQL(manifest));
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM editorial_default_rows').get().total,
   manifest.records.length);
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM editorial_default_snapshots').get().total,1);

  // A source-data corruption must be caught before a staging reader is activated.
  db.prepare('UPDATE editorial_default_rows SET value=? WHERE snapshot=? AND record_key=? AND field=?')
   .run('corrupted',manifest.snapshot,manifest.records[0].recordKey,manifest.records[0].field);
  exported=JSON.parse(db.prepare(exportQuery).get().staging_readback_json);
  assert.equal(verifyEditorialDefaultsReadback(manifest,exported.metadata,
   exported.rows).reason,'content-digest-mismatch');

  // Other releases plus existing CAS overrides must survive this rollback.
  db.exec("CREATE TABLE overrides (key TEXT PRIMARY KEY,value TEXT NOT NULL);");
  db.prepare('INSERT INTO overrides(key,value) VALUES (?,?)')
   .run('guideedit.book.keep','owner edit');
  db.prepare('INSERT INTO editorial_default_rows(snapshot,record_key,field,value) VALUES (?,?,?,?)')
   .run('another-release-snapshot','guideedit.book.keep','ru','other release');
  db.prepare('INSERT INTO editorial_default_snapshots(snapshot,source_release,sha256,expected_rows,installed_at) VALUES (?,?,?,?,unixepoch())')
   .run('another-release-snapshot','0.946.0','f'.repeat(64),1);
  const rollback=renderEditorialDefaultsRollbackSQL(manifest);
  assert.doesNotMatch(rollback,/\b(?:DROP|UPDATE|REPLACE)\b/i);
  assert.doesNotMatch(rollback,/\boverrides\b/i);
  db.exec(rollback);
  db.exec(rollback); // repeat is safe and exact-version-scoped
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM editorial_default_rows WHERE snapshot=?')
   .get(manifest.snapshot).total,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM editorial_default_snapshots WHERE snapshot=?')
   .get(manifest.snapshot).total,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM editorial_default_rows').get().total,1);
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM editorial_default_snapshots').get().total,1);
  assert.equal(db.prepare('SELECT value FROM overrides WHERE key=?')
   .get('guideedit.book.keep').value,'owner edit');
 }finally{db.close()}
});

test('issue 390: staging SQL cannot be generated from a forged but self-consistent namespace',()=>{
 const rows=manifest.records.map(r=>({...r}));
 rows[0].field='playerId';
 const canonical={schema:1,release:manifest.release,records:rows};
 const digest=createHash('sha256')
  .update(JSON.stringify(canonical)).digest('hex');
 const forged={...manifest,records:rows,digest,
  snapshot:manifest.release+'-'+digest.slice(0,16)};
 for(const build of [
  renderEditorialDefaultsSQL,
  renderEditorialDefaultsReadbackSQL,
  renderEditorialDefaultsRollbackSQL
 ])assert.throws(()=>build(forged),/Unallowlisted D1 default row/);
});

test('issue 390: readback and rollback CLI emit the matching version-only SQL',()=>{
 const cli=fileURLToPath(new URL('../scripts/plan-editorial-d1-defaults.mjs',import.meta.url));
 const command=(format)=>spawnSync(process.execPath,[cli,format],
  {encoding:'utf8',maxBuffer:4*1024*1024});
 for(const [option,expected] of [
  ['--readback-sql','staging_readback_json'],
  ['--staging-rollback-sql','DELETE FROM editorial_default_snapshots']
 ]){
  const result=command(option);
  assert.equal(result.status,0,result.stderr);
  assert.ok(result.stdout.includes(expected),option);
  assert.ok(result.stdout.includes(manifest.snapshot),option);
 }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));

test('missing-artwork queue uses exact OS IDs, no placeholder downloads or substitutions',()=>{
 const output=execFileSync(process.execPath,['scripts/report-missing-original-artwork.mjs'],
  {cwd:root,encoding:'utf8',maxBuffer:1024*1024*5});
 const report=JSON.parse(output);
 assert.equal(report.count,264);
 assert.equal(report.byKind.skills,260);
 assert.equal(report.byKind.items,4);
 assert.equal(report.byKind.souls,0);
 assert.equal(report.automaticSubstitutions,0);
 assert.equal(new Set(report.entries.map(row=>row.kind+'/'+row.stem)).size,report.count);
 assert.deepEqual(report.entries.filter(row=>row.kind==='items')
  .map(row=>row.recordIds[0]).sort((a,b)=>a-b),
  [50011,900001,900002,900003]);
 for(const row of report.entries){
  assert.ok(row.originalUrl.startsWith('https://pandorasaga-os.com/icons/'));
  assert.match(row.originalUrl,/\.webp$/);
  assert.equal(row.status,'Original OS URL returned 404 when last mirrored');
  for(const c of row.candidatesForManualVisualReview){
   assert.ok(c.path.startsWith('assets/skills/icons/'));
   assert.match(c.path,/\.webp$/);
  }
 }
});

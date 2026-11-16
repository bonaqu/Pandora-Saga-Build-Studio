import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
const manifest=JSON.parse(readFileSync(new URL('../assets/os-icon-manifest.json',import.meta.url),'utf8'));
const root=fileURLToPath(new URL('../',import.meta.url));

test('missing-artwork queue uses exact OS IDs, no placeholder downloads or substitutions',()=>{
 const output=execFileSync(process.execPath,['scripts/report-missing-original-artwork.mjs'],
  {cwd:root,encoding:'utf8',maxBuffer:1024*1024*5});
 const report=JSON.parse(output);
 const confirmed=manifest.missing.filter(x=>x.error==='HTTP 404');
 assert.equal(report.count,confirmed.length);
 for(const kind of ['skills','items','souls'])
  assert.equal(report.byKind[kind]||0,confirmed.filter(x=>x.kind===kind).length);
 assert.equal(report.count,manifest.count.known404);
 assert.equal(report.automaticSubstitutions,0);
 assert.deepEqual(report.skillImpact,{
  withClassAssignments:45,
  withClassAndMasteryRequirements:5,
  referencedByOtherSkills:91,
  learnableWithClassAssignments:0
 });
 const temple=report.entries.find(row=>row.stem==='skill_310023002');
 assert.deepEqual(temple.skillContext.invokedBySkills,
  [{id:310023001,name:'Храм'}]);
 assert.equal(temple.skillContext.metadataLearnable,true);
 assert.equal(temple.skillContext.hasClassAssignments,false);
 const wind=report.entries.find(row=>row.stem==='skill_260006002');
 assert.equal(wind.skillContext.metadataLearnable,true);
 assert.equal(wind.skillContext.hasClassAssignments,false);
 assert.deepEqual(wind.skillContext.invokedBySkills,[]);
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

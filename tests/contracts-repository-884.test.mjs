// Short repository, changelog, CI schedule and build metadata contracts.
// One test worker instead of five; checks and source references are preserved.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs,{readFileSync,readdirSync} from 'node:fs';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

// Original: tests/roadmap-archive-873.test.mjs
{
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
test('root ROADMAP remains a current decision sheet, and full history is indexed',()=>{
 const rootFile=read('ROADMAP.md'),index=read('docs/history/roadmap/README.md');
 assert.ok(rootFile.length<7000);
 assert.match(rootFile,/Latest source release/);
 assert.match(rootFile,/Issue #390/);
 assert.match(rootFile,/Issue #615/);
 assert.match(rootFile,/docs\/history\/roadmap\/README\.md/);
 const files=readdirSync(new URL('../docs/history/roadmap/',import.meta.url))
  .filter(x=>/^part-\d+\.md$/.test(x)).sort();
 assert.ok(files.length>=12);
 assert.equal((index.match(/\]\(part-\d+\.md\)/g)||[]).length,files.length);
 const chunks=files.map(p=>read('docs/history/roadmap/'+p));
 assert.ok(chunks.every(s=>s.length<17000));
 assert.ok(chunks.join('').length>260000,'historical roadmap was preserved, not erased');
 assert.ok(chunks.some(s=>s.includes('0.872.0')));
 assert.ok(chunks.some(s=>s.includes('0.153.0')));
 assert.ok(chunks.some(s=>s.includes('Source update 0.375.0')));
});
}

// Original: tests/no-scheduled-actions-budget.test.mjs
{
const workflowDir=new URL('../.github/workflows/',import.meta.url);
const files=readdirSync(workflowDir).filter(name=>/\.ya?ml$/i.test(name));
const read=name=>readFileSync(new URL(name,workflowDir),'utf8');

test('no unattended daily or weekly GitHub Actions cron checks consume runner capacity',()=>{
 assert.ok(files.length>=7,'Review newly added workflows alongside existing actions');
 for(const filename of files){
  const source=read(filename);
  assert.doesNotMatch(source,/^\s*schedule:\s*$/m,filename+' has an unattended schedule');
  assert.doesNotMatch(source,/^\s*-\s*cron\s*:/m,filename+' has a recurring cron');
 }
});
test('publication checks are retained and can be requested manually, with no redundant Pages event',()=>{
 const yaml=read('live-readonly.yml');
 assert.match(yaml,/^  push:\s*\n    branches: \[bonaqu_projects\]/m);
 assert.match(yaml,/^  workflow_dispatch:\s*$/m);
 assert.doesNotMatch(yaml,/^  workflow_run:\s*$/m);
 assert.match(yaml,/run: npm run catalog:parity:live/);
 assert.match(yaml,/run: npm run connection:check:full/);
 assert.match(yaml,/run: node scripts\/wait-live-release\.mjs/);
});
}

// Original: tests/studio-dependency-graph.test.mjs
{
test('Pandora Studio HTML assets and runtime dependencies stay connected',()=>{
 const script=fileURLToPath(new URL('../scripts/audit-studio-dependencies.mjs',import.meta.url));
 const result=spawnSync(process.execPath,[script],{encoding:'utf8',timeout:30000});
 assert.equal(result.error,undefined,result.error?.message);
 assert.equal(result.status,0,result.stderr||result.stdout);
 assert.match(result.stdout,/Studio graph check passed/);
});
}

// Original: tests/release-script.test.mjs
{
test('repository release guard passes without GitHub Actions or network',()=>{
 const script=fileURLToPath(new URL('../scripts/release-version.mjs',import.meta.url));
 const result=spawnSync(process.execPath,[script,'--check'],{encoding:'utf8',timeout:10000});
 assert.equal(result.error,undefined,result.error?.message);
 assert.equal(result.status,0,result.stderr||result.stdout);
 assert.match(result.stdout,/Release \d{4}\.\d{1,2}\.\d{1,2}\.\d+ is consistent/);
});
}

// Original: tests/catalog-diff.test.mjs
{
const context={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../pandora-os-catalog-diff.js',import.meta.url),'utf8'),context);
const {diff,changedFields}=context.window.PandoraCatalogDiff;
test('field-level preview shows confirmed old and new game values',()=>{
 const r=diff('skills',{1001:{name:'Test',mana:20}},{1001:{name:'Test',mana:30}});
 assert.equal(r.changed.length,1);assert.equal(r.examples[0].fields.find(x=>x.field==='mana').before,'20');
 assert.equal(r.examples[0].fields.find(x=>x.field==='mana').after,'30');
});
test('reordering source JSON keys does not count as a game update',()=>{
 assert.equal(diff('items',{1:{a:1,b:{x:1,y:2}}},{1:{b:{y:2,x:1},a:1}}).total,0);
});
test('new and removed ID counts are preserved',()=>{
 const r=diff('items',{1:{a:1},2:{a:2}},{1:{a:1},3:{a:3}});
 assert.equal(r.added.length,1);assert.equal(r.removed.length,1);
});
test('table display previews are bounded',()=>{
 const changes=changedFields({desc:'A'.repeat(500)},{desc:'B'.repeat(500)});
 assert.ok(changes[0].after.length<170);
});
}


// AGENTS is a current decision sheet. All historical agent instructions,
// including superseded rules, must survive as a bit-exact, indexed archive.
test('agent rules stay concise and archived guidance can be reconstructed byte-for-byte',()=>{
 const base=new URL('../',import.meta.url);
 const read=p=>readFileSync(new URL(p,base),'utf8');
 const current=read('AGENTS.md'),index=read('docs/history/agents/README.md');
 assert.ok(current.length<8000,'Working rules must not regrow into a 150 KB history');
 assert.match(current,/docs\/history\/agents\/README\.md/);
 const names=Array.from({length:11},(_,i)=>
  'part-'+String(i+1).padStart(2,'0')+'.md');
 const actual=readdirSync(new URL('../docs/history/agents/',import.meta.url))
  .filter(x=>/^part-\d\d\.md$/.test(x)).sort();
 assert.deepEqual(actual,names,'No agent history part may be silently omitted');
 for(const name of names)assert.ok(index.includes(']('+name+')'));
 const parts=names.map(name=>read('docs/history/agents/'+name));
 assert.ok(parts.every(chunk=>chunk.length>0&&chunk.length<16000));
 const original=parts.join('');
 assert.equal(original.length,149883);
 const bytes=Buffer.from(original,'utf8');
 const reconstructed=createHash('sha1')
  .update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 assert.equal(reconstructed,'cdf8fb772e8cad5bdda310c68620093951d47258',
  'The exact historical AGENTS.md Git blob must be preserved');
 assert.match(original,/0\.885\.0/);
 assert.match(original,/0\.763\.0/);
 assert.match(original,/0\.849\.0/);
});

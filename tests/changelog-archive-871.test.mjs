import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync,mkdtempSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {rotateChangelog} from '../scripts/changelog-archive.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const read=p=>readFileSync(join(root,p),'utf8');
test('release history is preserved in individually readable archive segments',()=>{
 const current=read('CHANGELOG.md'),index=read('docs/changelog/README.md');
 assert.ok(current.length<22000);
 assert.match(current,/## 0\.870\.0 — 2026\.11\.17\.870/);
 assert.match(current,/CHANGELOG_ARCHIVE/);
 assert.match(index,/NEWEST ARCHIVES/);
 const dir=join(root,'docs','changelog');
 const names=readdirSync(dir).filter(n=>n.endsWith('.md')&&n.startsWith('releases-'));
 assert.ok(names.length>=30,'history must be split without dropping releases');
 const content=names.map(name=>read('docs/changelog/'+name));
 assert.ok(content.every(row=>row.length<22000),'each archive can be fetched normally');
 const versions=[...current.matchAll(/^## (0\.\d+\.0) — /gm),
  ...content.flatMap(row=>[...row.matchAll(/^## (0\.\d+\.0) — /gm)])].map(m=>m[1]);
 assert.equal(versions.length,822,'retain all 822 existing release entries');
 assert.equal(new Set(versions).size,versions.length,'no duplicate archived releases');
 for(const name of names)assert.ok(index.includes('./'+name),'index missing '+name);
 assert.ok(existsSync(join(dir,'historical-checklist.md')));
});
test('release rotation archives overflow safely and does not rewrite old files',()=>{
 const tmp=mkdtempSync(join(tmpdir(),'ps-changelog-'));
 try{
  const archiveDir=join(tmp,'docs','changelog');mkdirSync(archiveDir,{recursive:true});
  writeFileSync(join(archiveDir,'README.md'),'# Archive\n<!-- NEWEST ARCHIVES -->\n');
  const make=n=>'## 0.'+n+'.0 — 2026.11.17.'+n+' · Test\n\n- One change\n';
  writeFileSync(join(tmp,'CHANGELOG.md'),
   '# Pandora Saga Build Studio — CHANGELOG\n\n'+
   Array.from({length:17},(_,i)=>make(100-i)).join('\n')+
   '\n---\n\nOlder: [archive](docs/changelog/README.md)\n\n<!-- CHANGELOG_ARCHIVE -->\n');
  rotateChangelog(tmp);
  const now=readFileSync(join(tmp,'CHANGELOG.md'),'utf8');
  assert.equal([...now.matchAll(/^## 0\.\d+\.0 — /gm)].length,12);
  const index=readFileSync(join(archiveDir,'README.md'),'utf8');
  for(const n of [88,87,86,85,84])assert.ok(index.includes('release-0.'+n+'.0.md'));
  assert.ok(existsSync(join(archiveDir,'release-0.88.0.md')));
  rotateChangelog(tmp);
  assert.equal(readFileSync(join(tmp,'CHANGELOG.md'),'utf8'),now);
 }finally{rmSync(tmp,{recursive:true,force:true})}
});

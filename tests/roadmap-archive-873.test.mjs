import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
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

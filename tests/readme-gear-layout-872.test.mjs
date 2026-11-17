import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
test('README stays a compact project entry point, with historical notes preserved',()=>{
 const original=read('README.md'),index=read('docs/history/README-ARCHIVE.md');
 assert.ok(original.length<12000,'The GitHub project homepage must remain compact');
 assert.match(original,/## Возможности/);
 assert.match(original,/docs\/history\/README-ARCHIVE\.md/);
 const parts=readdirSync(new URL('../docs/history/',import.meta.url))
  .filter(x=>/^README-legacy-\d+\.md$/.test(x)).sort();
 assert.ok(parts.length>=4);
 assert.ok(parts.every(p=>index.includes(p)));
 const content=parts.map(p=>read('docs/history/'+p));
 assert.ok(content.every(x=>x.length<17000));
 assert.ok(content.some(x=>x.includes('2026.10.31.86')));
 assert.ok(content.some(x=>x.includes('0.153.0')));
 assert.ok(content.some(x=>x.includes('Secure administrator mode')));
});
test('responsive gear tabs keep no-soul and soul variants balanced',()=>{
 const css=read('pandora-studio-workbench-guidance.css');
 assert.match(css,/\.stage-rich-tabs\.no-souls\{grid-template-columns:repeat\(2/);
 assert.match(css,/\.stage-rich-settings-group\{display:grid;grid-template-columns:minmax\(0,\.76fr\) minmax\(0,1\.24fr\)/);
 assert.match(css,/scrollbar-color:#95734c transparent/);
 assert.match(css,/\.stage-rich-tabs\{gap:8px;align-items:stretch;padding-inline-end:8px/);
 assert.doesNotMatch(css,/\.stage-rich-choose-group\{[^}]*border-right:1px/);
});

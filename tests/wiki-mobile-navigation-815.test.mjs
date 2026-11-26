import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('#815 wiki mobile categories remain accessible without impacting owner editor',()=>{
 const css=read('pandora-studio-wiki-polish.css');
 const app=read('pandora-studio-app.js');
 assert.match(css,/\.wiki-controls>\.wiki-categories:not\(\.wiki-skill-edit-list\)/);
 assert.match(css,/overflow-x:auto/);
 assert.match(css,/scroll-snap-type:x proximity/);
 const audit=read('tests/browser-visual-coverage.mjs');
 assert.match(audit,/intentionalWikiScroller/);
 assert.match(audit,/info\.globalOverflow<=14/);
 assert.match(app,/aria-pressed':String\(\(key==='utility'/);
 assert.match(app,/categories\.scrollLeft=Math\.max/);
 assert.match(app,/class:'wiki-open-first'/);
 assert.match(app,/onclick:\(\)=>openWiki\(type,firstId\)/);
});
test('#815 owner edit tip describes autosave without infrastructure jargon',()=>{
 const src=read('pandora-studio-app.js');
 assert.match(src,/При выходе из поля сохранится автоматически/);
 assert.match(src,/Changes save automatically when you leave the field/);
 assert.doesNotMatch(src,/При выходе из поля — автосохранение в Cloudflare D1/);
});

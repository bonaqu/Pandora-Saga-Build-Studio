import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const file=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const catalog=file('pandora-os-catalog-workbench.js');
const catalogCSS=file('pandora-os-catalog-workbench.css');
const bookCSS=file('pandora-studio-owner-inline-ui.css');
const visual=file('tests/browser-visual-coverage.mjs');

test('catalog checkbox captions have sibling D1 pencils and isolated live counters',()=>{
 assert.match(catalog,/const choiceEditor=\(caption,key,ru,en\)=>/);
 assert.match(catalog,/editLabel\(caption,key,ru,en\)/);
 assert.match(catalog,/caption\.dispatchEvent\(new MouseEvent\('dblclick'/);
 for(const name of ['formatting','russian']){
  const control=name==='formatting'?'formatting':'russian';
  assert.match(catalog,new RegExp('const '+control+'CountLabel=h\\(\\\'small\\\',\\{class:\\\'os-sync-choice-count\\\'\\}\\)'));
  assert.match(catalog,new RegExp('const '+control+'Choice=h\\(\\\'div\\\',\\{class:\\\'os-sync-choice-editor\\\'\\},\\['+control+'Option\\]\\)'));
  assert.match(catalog,new RegExp(control+'Choice\\.append\\('+control+'Pencil\\)'));
  assert.match(catalog,new RegExp(control+'CountLabel\\.textContent='));
 }
 assert.match(catalog,/\[formattingToggle,formattingLabel,formattingCountLabel\]/);
 assert.match(catalog,/\[russianToggle,russianLabel,russianCountLabel\]/);
 assert.doesNotMatch(catalog,/formattingLabel\.textContent=copy\('formattingLabel'/);
 assert.doesNotMatch(catalog,/russianLabel\.textContent=copy\('russianDescriptionsLabel'/);
 assert.match(catalogCSS,/\.os-sync-choice-editor\{display:flex/);
 assert.match(catalogCSS,/\.os-sync-choice-pencil\{display:inline-grid/);
 assert.match(catalogCSS,/\.os-sync-choice-count\{margin-left:auto/);
});

test('Book eyebrow and chapter title share balanced screen center on mobile and desktop',()=>{
 assert.match(bookCSS,/#stageAttributes \.stage-attribute-head\{\s*grid-template-columns:36px 36px minmax\(0,1fr\) 36px 36px/);
 assert.match(bookCSS,/#stageAttributes \.stage-book-heading>span:first-child\{\s*grid-column:2;grid-row:1;justify-self:center/);
 assert.match(bookCSS,/#stageAttributes \.stage-book-heading>strong\{\s*grid-column:1\/-1;grid-row:2/);
 assert.match(bookCSS,/text-align:center/);
 assert.match(bookCSS,/@media\(max-width:410px\)\{\s*#stageAttributes \.stage-attribute-head\{\s*grid-template-columns:32px 32px minmax\(0,1fr\) 32px 32px/);
 assert.match(visual,/Math\.abs\(g\.eyebrow-g\.center\)<=2/);
 assert.match(visual,/Math\.abs\(g\.chapter-g\.center\)<=2/);
 assert.match(visual,/for\(const config of \[/);
});

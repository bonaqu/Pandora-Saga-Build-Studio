import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const file=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const catalog=file('pandora-os-catalog-workbench.js');
const catalogCSS=file('pandora-os-catalog-workbench.css');
const bookCSS=file('pandora-studio-owner-inline-ui.css');
const visual=file('tests/browser-visual-coverage.mjs');

test('catalog checkbox captions edit directly without changing native input behavior',()=>{
 assert.match(catalog,/const choiceEditor=\(caption,key,ru,en\)=>/);
 assert.match(catalog,/editLabel\(caption,key,ru,en,\{onStarted:cancelPending\}\)/);
 assert.match(catalog,/caption\.addEventListener\('click'/);
 assert.match(catalog,/actionQueue\.defer\(caption,/);
 assert.match(catalog,/box\.click\(\)/);
 assert.match(catalog,/caption\.closest\('\.os-sync-formatting-option'\)/);
 assert.match(catalog,/const formattingOption=h\(canEdit\?'div':'label'/);
 assert.match(catalog,/const russianOption=h\(canEdit\?'div':'label'/);
 // A disabled native checkbox must never disable a visible owner text span.
 // Players still retain the original native label hit-area for ordinary taps.
 for(const type of ['formatting','russian']){
  assert.ok(catalog.includes("const "+type+"CountLabel=h('small',{class:'os-sync-choice-count'})"));
  assert.ok(catalog.includes("const "+type+"Choice=h('div',{class:'os-sync-choice-editor'},["+type+"Option])"));
  assert.ok(catalog.includes("choiceEditor("+type+"Label,"));
  assert.ok(catalog.includes(type+"CountLabel.textContent="));
 }
 assert.match(catalog,/\[formattingToggle,formattingLabel,formattingCountLabel\]/);
 assert.match(catalog,/\[russianToggle,russianLabel,russianCountLabel\]/);
 assert.doesNotMatch(catalog,/formattingLabel\.textContent=copy\('formattingLabel'/);
 assert.doesNotMatch(catalog,/russianLabel\.textContent=copy\('russianDescriptionsLabel'/);
 assert.doesNotMatch(catalog,/os-sync-choice-pencil/);
 assert.doesNotMatch(catalogCSS,/os-sync-choice-pencil/);
 assert.match(catalogCSS,/\.os-sync-choice-editor\{display:flex/);
 assert.match(catalogCSS,/\.os-sync-choice-editor \.os-sync-choice-count\{margin-left:auto/);
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

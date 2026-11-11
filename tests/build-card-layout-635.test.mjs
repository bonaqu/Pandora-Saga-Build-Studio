import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('saved build card keeps Compare in the top corner and exactly four actions in one row',()=>{
 const app=read('pandora-studio-app.js');
 const css=read('pandora-studio-build-comparison.css');
 const start=app.indexOf("const cardHead=h('div',{class:'build-card-head'}");
 const end=app.indexOf('  box.append(openChoice);',start);
 assert.ok(start>0&&end>start,'Card markup not located');
 const body=app.slice(start,end);
 assert.match(body,/class:'build-card-compare'/);
 assert.match(body,/class:'build-card-actions'/);
 assert.match(body,/box\.append\(cardHead,/);
 assert.equal((body.match(/h\('button',\{class:'button-action/g)||[]).length,4);
 assert.match(body,/onclick:\(\)=>createShared\(b,shareSlot\)/);
 assert.match(body,/overwriteChoice\.hidden=!overwriteChoice\.hidden/);
 assert.match(body,/text:'↻ Перезаписать'/);
 assert.match(body,/deleteChoice\.hidden=!deleteChoice\.hidden/);
 assert.match(css,/\.build-card-actions\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(css,/\.build-card-compare\{display:inline-flex/);
 assert.match(css,/\.build-grid\{grid-template-columns:repeat\(auto-fit,minmax\(min\(100%,390px\),1fr\)\)/);
});

test('disclosure arrows have centered vector glyphs and text fields keep a soft visible focus',()=>{
 const css=read('pandora-studio-theme.css');
 assert.match(css,/\.stage-result-chevron\{\s*display:grid;place-items:center/);
 assert.match(css,/\.stage-result-chevron::before\{\s*content:''/);
 assert.match(css,/\.wiki-chest-chevron\{display:grid;place-items:center/);
 assert.match(css,/\.wiki-chest-chevron::before\{content:''/);
 assert.match(css,/\.account-password-toggle:after\{content:'';display:block/);
 assert.match(css,/input:not\(\[type=checkbox\]\):not\(\[type=radio\]\):not\(\[type=range\]\):focus-visible/);
 assert.match(css,/outline:2px solid #d4aa72/);
});

test('optional D1 test and GitHub export are clearly labelled in owner dock',()=>{
 const app=read('pandora-studio-app.js');
 const css=read('pandora-studio-owner-dock.css');
 assert.match(app,/text:'Проверить сохранение'/);
 assert.match(app,/class:'owner-dock-export',text:'Экспорт в GitHub'/);
 assert.match(app,/class:'owner-dock-secondary-label',text:'Дополнительно'/);
 assert.match(app,/class:'owner-dock-history'/);
 assert.match(app,/class:'owner-dock-catalog'/);
 assert.match(app,/class:'owner-dock-d1-check'/);
 assert.match(app,/class:'owner-en-sync'/);
 assert.match(css,/\.owner-dock-secondary-label\{/);
 assert.match(css,/\.owner-dock-action-slot\.owner-dock-action-wide\{grid-column:1\/-1\}/);
 assert.match(css,/\.owner-dock-action-slot:has\(>\.owner-en-sync\[hidden\]\)/);
});

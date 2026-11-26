import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('empty hero appearance slots center captions and glyphs; equipped images keep their layout',()=>{
 const css=read('pandora-studio-theme.css');
 const app=read('pandora-studio-app.js');
 const marker=css.lastIndexOf('/* 0.959 · Hero appearance:');
 assert.ok(marker>0);
 const rules=css.slice(marker);
 assert.match(rules,/\.workspace \.equipment-rail \.equipment-slot:not\(\.equipped\)\s*\{/);
 assert.match(rules,/flex-direction:column/);
 assert.match(rules,/justify-content:center/);
 assert.match(rules,/align-items:center/);
 assert.match(rules,/\.equipment-slot:not\(\.equipped\)>small\s*\{\s*position:static/);
 assert.match(rules,/text-align:center/);
 assert.match(rules,/\.equipment-slot:not\(\.equipped\)>\.slot-glyph/);
 assert.doesNotMatch(rules,/\.equipment-slot\.equipped[^\n]*\{/);
 assert.match(app,/button\.append\(slotVisual\(i,item,sourceSlot\),h\('small'/);
 assert.match(app,/class:'stage-sockets'/);
 assert.match(app,/class:'stage-enhance'/);
 assert.match(app,/class:'stage-conflict'/);
});

test('responsive Chromium geometry audit checks every empty glyph+caption pair',()=>{
 const audit=read('tests/browser-layout.mjs');
 assert.match(audit,/1366,768/);
 assert.match(audit,/390,844/);
 assert.match(audit,/\.equipment-slot:not\(\.equipped\)/);
 assert.match(audit,/tile\.captionPosition,'static'/);
 assert.match(audit,/tile\.glyphCenterX-tile\.tileCenterX/);
 assert.match(audit,/tile\.labelCenterX-tile\.tileCenterX/);
 assert.match(audit,/tile\.groupCenterY-tile\.tileCenterY/);
 assert.match(audit,/tile\.glyphInBounds&&tile\.labelInBounds/);
});

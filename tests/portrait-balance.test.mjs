import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
const override=css.slice(css.indexOf('/* 2026.10.30.49: restore the accepted wide Hero Path'));
test('large desktops preserve the accepted 430px Hero Path',()=>{
 assert.ok(override.startsWith('/* 2026.10.30.49: restore'));
 assert.match(override,/grid-template-columns:300px minmax\(0,1fr\) 430px/);
 assert.match(override,/\.portrait-frame\{width:var\(--hero-width\);max-width:var\(--hero-width\);transform:translateX\(65px\)/);
});
test('left and right equipment rails follow the focal portrait',()=>{
 assert.match(override,/\.left-rail\{left:calc\(\(100% - var\(--hero-width\)\)\/2 \+ 2px\)\}/);
 assert.match(override,/\.right-rail\{right:calc\(\(100% - var\(--hero-width\)\)\/2 - 128px\)\}/);
});
test('portrait and rails fit available stage geometry at desktop sizes',()=>{
 for(const viewport of [1420,1440,1600,1680,1920,2560,3840]){
  const big=viewport>=1680;
  const main=Math.min(viewport,1900)-(viewport>=1500?60:viewport*0.04);
  const stage=main-(big?300+430:280+360)-26-30;
  const base=big?Math.min(Math.max(440,viewport*0.36),565):
   Math.min(Math.max(420,viewport*.34),505);
  const portrait=Math.min(base,stage-(big?260:218));
  const right= (stage-portrait)/2-(big?128:103);
  assert.ok(portrait>=380,'portrait should remain comfortably wide at '+viewport);
  assert.ok(right>=0,'right rail must remain inside the stage at '+viewport);
 }
});

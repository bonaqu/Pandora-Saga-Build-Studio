import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
const current=css.slice(css.indexOf('/* 2026.10.30.48: balanced columns'));
test('the portrait is centered across the full desktop workspace',()=>{
 assert.ok(current.startsWith('/* 2026.10.30.48: balanced columns'));
 assert.ok(current.includes('grid-template-columns:minmax(250px,280px) minmax(0,1fr) minmax(250px,280px)'));
 assert.ok(current.includes('grid-template-columns:minmax(245px,280px) minmax(0,1fr) minmax(245px,280px)'));
 assert.ok(current.includes('--hero-width:min(clamp(450px,36vw,565px),calc(100% - 140px))'));
 assert.ok(current.includes('.portrait-frame{width:var(--hero-width);max-width:var(--hero-width);height:min(100%,760px);margin-inline:auto'));
});
test('equipment rail positions follow both sides of the portrait, not stage edges',()=>{
 assert.ok(current.includes('.left-rail{left:calc((100% - var(--hero-width))/2 - 63px)}'));
 assert.ok(current.includes('.right-rail{right:calc((100% - var(--hero-width))/2 - 63px)}'));
});
test('portrait and rails fit desktop stage at intended width samples',()=>{
 for(const viewport of [1420,1440,1920,2560,3840]){
  const stageInner=(Math.min(viewport,1900)-60)-280*2-26-30;
  const portrait=Math.min(Math.max(450,viewport*0.36),565,stageInner-140);
  assert.ok(portrait>=450, 'minimum portrait at '+viewport);
  assert.ok(portrait+126<=stageInner, 'slot clearance at '+viewport);
 }
});

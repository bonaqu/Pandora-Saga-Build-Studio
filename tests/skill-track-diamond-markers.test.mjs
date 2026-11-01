import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
const ui=readFileSync(new URL('../hero-path.js',import.meta.url),'utf8');
const rule=selector=>{
 const start=css.lastIndexOf(selector+'{');
 assert.ok(start>=0,'Missing rule '+selector);
 const closing=css.indexOf('}',start);
 return css.slice(start,closing+1);
};
test('skill thresholds are discrete diamonds, not crowded full-height vertical ruler ticks',()=>{
 const base=rule('.inline-mastery-track.path-integrated-track .path-unlock-notch');
 assert.match(base,/top:0;width:12px;height:12px/);
 assert.match(base,/background:transparent/);
 assert.match(base,/pointer-events:none/);
 const diamond=rule('.inline-mastery-track.path-integrated-track .path-unlock-notch::before');
 assert.match(diamond,/top:2px;width:8px;height:8px/);
 assert.match(diamond,/rotate\(45deg\)/);
 assert.match(rule('.inline-mastery-track.path-integrated-track .path-unlock-notch.reached::before'),/background:/);
 assert.match(rule('.inline-mastery-track.path-integrated-track .path-unlock-notch.unreachable::before'),/background:/);
 assert.match(rule('.inline-mastery-track.path-integrated-track .path-unlock-notch.is-hovered::before'),/box-shadow:/);
});
test('the same interactive drag, nearest-notch tooltip and keyboard-accessible unlocks remain',()=>{
 assert.match(ui,/pointermove/);
 assert.match(ui,/at.distance<=10/);
 assert.match(ui,/pointerType==='touch'/);
 assert.match(ui,/path-unlock-notch/);
 assert.match(ui,/tabindex:'0'/);
 assert.match(ui,/const range=make\('input',\{type:'range'/);
 assert.match(css,/\.path-unlock-notch:focus-visible/);
});

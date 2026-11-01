import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const css=read('style.css'),ui=read('hero-path.js'),locale=read('ui-locale.js');
const cssRule=selector=>{
 const start=css.lastIndexOf(selector+'{');
 assert.ok(start>=0,'Missing CSS rule for '+selector);
 return css.slice(start,css.indexOf('}',start)+1);
};

test('unlock thresholds are narrow vertical ticks, never permanent diamonds',()=>{
 const tick=cssRule('.inline-mastery-track.path-integrated-track .path-unlock-notch');
 assert.match(tick,/top:0;width:3px;height:12px/);
 assert.match(tick,/translateX\(-50%\)/);
 assert.match(tick,/pointer-events:none/);
 assert.match(cssRule('.inline-mastery-track.path-integrated-track .path-unlock-notch::before'),/content:none/);
 assert.doesNotMatch(tick,/rotate\(45deg\)/);
 assert.match(cssRule('.inline-mastery-track.path-integrated-track .path-unlock-notch.reached'),/background:#a9df8d/);
 assert.match(cssRule('.inline-mastery-track.path-integrated-track .path-unlock-notch.unreachable'),/background:#c48375/);
 const hover=cssRule('.inline-mastery-track.path-integrated-track .path-unlock-notch:focus-visible');
 assert.match(hover,/box-shadow/);
 assert.doesNotMatch(hover,/width:|height:|0 0 8px/);
});
test('source-backed tooltip includes ability name, description, required points and MP cost only when known',()=>{
 for(const fragment of ["text:threshold+tr(api,' очков',' points')",
  "text:skill.name||tr(api,'Умение','Skill')",
  "text:skill.desc||tr(api,'Описание отсутствует.','No description available.')",
  'Number.isFinite(skill.mana)&&skill.mana>=0',
  "tr(api,'Затрат ОМ: ','MP cost: ')+skill.mana"])
  assert.ok(ui.includes(fragment),fragment);
 assert.match(ui,/\.filter\(value=>Number\.isFinite\(value\)&&value>=0&&value<=visualMax\)/);
 assert.match(ui,/pointermove/);
 assert.match(ui,/at.distance<=10/);
 assert.match(ui,/tabindex:'0'/);
});
test('compact point and mastery fields share one responsive row with equal heights and source labels',()=>{
 assert.match(ui,/controls=make\('div',\{class:'path-point-controls'\}\)/);
 assert.match(ui,/controls\.append\(/);
 assert.match(ui,/editor\.append\(controls\)/);
 const row=cssRule('.path-point-controls');
 assert.match(row,/display:flex;flex-wrap:wrap/);
 const input=cssRule('.path-point-controls .path-point-group input[type=number]');
 assert.match(input,/height:28px/);
 const mastery=cssRule('.path-point-controls .path-point-mastery input[type=number]');
 assert.doesNotMatch(mastery,/height:/);
 assert.match(mastery,/color:#b4e4a8/);
 assert.match(cssRule('.path-point-controls .path-point-name::after'),/attr\(data-help\)/);
 assert.ok(locale.includes("exactPoints:['Вложено','Spent']"));
 assert.ok(locale.includes("greenMastery:['Мастерство','Mastery']"));
});

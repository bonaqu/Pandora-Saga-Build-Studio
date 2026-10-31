import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Origin stat purchases never use equipment, Souls or trained ability values',()=>{
 const app=read('app.js'),calculator=read('os-calculator.js');
 assert.match(app,/added:STATS\.map\(key=>Number\(state\.stats\[key\]\|\|0\)\)/);
 assert.match(app,/supplementalFlat:prayerSpirit\?/);
 assert.match(app,/const key=ORIGIN_STAT_LABELS\[row\.i\]\.code,effective=estimate\?\.stats\?\.\[key\]/);
 assert.match(app,/const delta=shown===null\|\|allocated===null\?0:shown-allocated/);
 assert.match(calculator,/supplementalFlat=\{\}/);
 assert.match(calculator,/basic\[key\]=race\+job\+spent/);
});
test('class cap and spend are tracked independently of green progress',()=>{
 const app=read('app.js'),m=read('skill-progression.js');
 assert.match(app,/PandoraSkillProgression\.spending\(gameTables\?\.abilityPoint/);
 assert.match(app,/onAllocate:\(key,requested,final\)=>/);
 assert.match(m,/if\(amount<=current\)return true/);
 assert.match(m,/function trained\(/);
});


test('Origin keeps calculations correct but removes the noisy breakdown row',()=>{
 const app=read('app.js'),css=read('style.css');
 assert.doesNotMatch(app,/class:'origin-stat-breakdown'/);
 assert.doesNotMatch(app,/entry\.breakdown\.textContent/);
 assert.doesNotMatch(app,/origin-stat-guide/);
 assert.match(app,/effective=estimate\?\.stats\?\.\[key\]/);
 assert.match(app,/const snap=attributeSnapshot\(\),estimate=previewBaseStats\(\)/);
 assert.match(app,/PandoraAttributeProgression\.allowed\(snap,row\.i,spent\+1\)/);
 assert.match(css,/\.origin-stat-row button,\.origin-stat-row \.origin-stat-input\{/);
});

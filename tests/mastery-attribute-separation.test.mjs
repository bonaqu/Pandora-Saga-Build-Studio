import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Origin stat purchases never use equipment, Souls or trained ability values',()=>{
 const app=read('app.js'),calculator=read('os-calculator.js');
 assert.match(app,/added:STATS\.map\(key=>Number\(state\.stats\[key\]\|\|0\)\)/);
 assert.match(app,/supplementalFlat:prayerSpirit\?/);
 assert.match(app,/const gear=Number\(estimated\?\.effects\?\.flat\?\.\[code\]/);
 assert.match(app,/const legacy=Number\(estimated\?\.supplementalFlat\?\.\[code\]/);
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

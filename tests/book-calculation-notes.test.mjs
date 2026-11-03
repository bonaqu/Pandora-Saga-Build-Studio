import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('no calculation methodology is duplicated in player-facing chapters',()=>{
 const stage=read('pandora-studio-hero-book.js'),css=read('pandora-studio-theme.css');
 assert.match(stage,/function summaryPage\(body,calc\)/);
 assert.match(stage,/function attackChapterGroups\(calc\)/);
 assert.match(stage,/function defenseChapterGroups\(calc\)/);
 assert.doesNotMatch(stage,/stage-methodology|Как рассчитываются ОЗ и ОМ/);
 assert.match(css,/stage-result-section-head/);
});
test('technical effect coverage remains calculated but not mixed with result matrix',()=>{
 const stage=read('pandora-studio-hero-book.js'),calc=read('pandora-os-character-calculator.js');
 assert.match(calc,/function effectCoverage\(/);
 assert.match(calc,/const coverage=effectCoverage/);
 assert.doesNotMatch(stage,/Что осталось вне итоговых чисел|stage-coverage/);
 assert.match(stage,/function summaryRows\(calc\)/);
});

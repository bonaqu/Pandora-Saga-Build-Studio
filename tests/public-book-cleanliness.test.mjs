import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('debugger-only formula disclaimers are not placed in ordinary player book',()=>{
 const book=read('pandora-studio-hero-book.js'),app=read('pandora-studio-app.js');
 assert.doesNotMatch(book,/stage-methodology|stage-combat-formulas|stage-vital-formulas/);
 assert.match(book,/function summaryPage\(body,calc,options=\{\}\)/);
 assert.match(book,/function attackPage\(body,calc/);
 assert.doesNotMatch(app,/Расчёт по известным формулам, без некоторых эффектов/);
 assert.doesNotMatch(book,/'Частично'\]/);
});
test('Warding passive requires actual class branch capacity of 26 or more',()=>{
 const calculator=read('pandora-os-character-calculator.js');
 assert.match(calculator,/wardingCap:classData\.branchCaps\?\.warding/);
 assert.match(calculator,/!Number\.isSafeInteger\(wardingCap\)\|\|wardingCap<26/);
 assert.match(calculator,/wardingMastery>wardingCap/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('debugger-only formula disclaimers are not placed in ordinary player book',()=>{
 const book=read('stage-attributes.js'),app=read('app.js');
 assert.match(book,/const isAdmin=root\.PandoraStudioAdminActive\?\.\(\)===true/);
 assert.match(book,/if\(isAdmin\)details\.append\(node\)/);
 assert.match(book,/else node\.remove\(\)/);
 assert.match(book,/if\(isAdmin&&details\.children\.length>1\)body\.append\(details\)/);
 assert.doesNotMatch(app,/Расчёт по известным формулам, без некоторых эффектов/);
 assert.doesNotMatch(book,/'Частично'\]/);
});
test('Warding passive requires actual class branch capacity of 26 or more',()=>{
 const calculator=read('os-calculator.js');
 assert.match(calculator,/wardingCap:classData\.branchCaps\?\.warding/);
 assert.match(calculator,/!Number\.isInteger\(wardingCap\)\|\|wardingCap<26/);
 assert.match(calculator,/wardingMastery>wardingCap/);
});

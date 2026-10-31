import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const h={};Function('window',read('os-calculator.js'))(h);
const calc=h.PandoraOSCalculator.mountedReleasePreview;
test('RelHorse job base values match legacy formula',()=>{
 for(const [job,n] of [['DRAGOON',50],['PALADIN',50],['PREDATOR',30],['CALAMITY',40],['WARRIOR',10],['PRIEST',10]])
  assert.equal(calc({jobKey:job}).known,n);
});
test('riding green adeptness and selected Honor contribute separately',()=>{
 const r=calc({jobKey:'DRAGOON',ridingMastery:24,honorTitle:7});
 assert.deepEqual([r.jobBase,r.mastery,r.honor,r.known],[50,24,10,84]);
 assert.equal(r.verified,false);
 assert.equal(calc({jobKey:'PREDATOR',honorTitle:1}).known,30);
});
test('bad inputs fail closed',()=>{
 for(const v of [{},{jobKey:'WARRIOR',ridingMastery:-1},{jobKey:'WARRIOR',ridingMastery:1.5},{jobKey:'WARRIOR',honorTitle:99}])assert.equal(calc(v),null);
});
test('riding is attached to character calculator and hero book',()=>{
 assert.match(read('app.js'),/groupAdeptness\(state,\['riding'\],initialBranches\)/);
 assert.match(read('stage-attributes.js'),/modifiers\?\.mountedRelease/);
 assert.match(read('docs/REMAKED_FORMULA_INVENTORY.md'),/\| `RelHorse` \|[^\n]+\| PARTIAL \|/);
});

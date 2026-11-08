import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-studio-build-comparison.js'))(host);
const compare=host.PandoraBuildComparison;

test('saved item uses an editable verified English name instead of its Russian base',()=>{
 const item={1:{name:'Спата',nameEn:'Spatha from owner'}};
 const translations={1:{n:'Official Spatha'}},before=JSON.stringify(item);
 assert.equal(compare.savedItemName({id:1},item,{lang:'ru',englishNames:translations}),
  'Спата');
 assert.equal(compare.savedItemName({id:1},item,{lang:'en',englishNames:translations}),
  'Spatha from owner','Owner-approved translation takes precedence');
 assert.equal(JSON.stringify(item),before,'Source OS records must not be modified');
});

test('verified official English source names work without a manual owner translation',()=>{
 const equipment={1:{name:'Спата'}},souls={33:{name:'Душа храбрости'}};
 assert.equal(compare.savedItemName({id:1},equipment,{lang:'en',
  englishNames:{1:{n:'Spatha'}}}),'Spatha');
 assert.equal(compare.savedItemName({id:33},souls,{lang:'en',kind:'soul',
  englishNames:{33:{n:'Soul of Courage'}}}),'Soul of Courage');
 assert.equal(compare.savedItemName({id:999},{},{lang:'en',
  englishNames:{999:{n:'Verified item not in this snapshot'}}}),
  'Verified item not in this snapshot');
 assert.equal(compare.savedItemName({id:999},{},{lang:'en',
  englishNames:{}}),'Item not in catalog',
  'Never fabricate an English translation when the source has none');
});

test('A/B matrix uses verified English items and souls while preserving Russian UI',()=>{
 const equipment={1:{name:'Спата'},2:{name:'Копьё'}};
 const souls={31:{name:'Душа храбрости'},32:{name:'Душа мудрости'}};
 const a={race:0,job:0,level:1,gender:0,
  equipment:{0:{id:1}},souls:{0:[{id:31}]}};
 const b={...structuredClone(a),
  equipment:{0:{id:2}},souls:{0:[{id:32}]}};
 const opts={equipment,souls,slotLabels:['Оружие'],races:[['Человек','Human']],
  englishItems:{1:{n:'Spatha'},2:{n:'Spear'}},
  englishSouls:{31:{n:'Soul of Courage'},32:{n:'Soul of Wisdom'}}};
 const en=compare.matrixRows(a,b,{...opts,lang:'en'});
 const ru=compare.matrixRows(a,b,{...opts,lang:'ru'});
 const gear=rows=>rows.find(x=>x.key==='gear.0');
 const soul=rows=>rows.find(x=>x.key==='soul.0.0');
 assert.equal(gear(en).a,'Spatha');assert.equal(gear(en).b,'Spear');
 assert.equal(soul(en).a,'Soul of Courage');assert.equal(soul(en).b,'Soul of Wisdom');
 assert.equal(gear(ru).a,'Спата');assert.equal(gear(ru).b,'Копьё');
 assert.equal(soul(ru).a,'Душа храбрости');assert.equal(soul(ru).b,'Душа мудрости');
 assert.equal(gear(en).equal,false);assert.equal(soul(en).equal,false);
 assert.equal(a.equipment[0].id,1);assert.equal(b.souls[0][0].id,32);
});

test('compact result comparison uses translated Hero Book outcomes',()=>{
 const app=read('pandora-studio-app.js');
 const start=app.indexOf('PandoraBuildComparison.compactResults(');
 const end=app.indexOf('summary.textContent=rows.length',start);
 assert.ok(start>=0&&end>start,'Active compact renderer');
 const snippet=app.slice(start,end);
 assert.match(snippet,/PandoraStageAttributes\.summaryRows\(calcA\)/);
 assert.match(snippet,/PandoraStageAttributes\.summaryRows\(calcB\)/);
 assert.match(snippet,/\{lang\}/);
 assert.doesNotMatch(snippet,/englishItems:|englishSouls:|englishSkills:/);
});

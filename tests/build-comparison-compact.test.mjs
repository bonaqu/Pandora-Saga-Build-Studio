import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scope={};
Function('window',read('pandora-studio-build-comparison.js'))(scope);
const compare=scope.PandoraBuildComparison.compactResults;
const pack=fields=>[{ru:'Атака',en:'Attack',rows:fields.map(
 ([ru,en,value,unit='',display])=>({ru,en,value,unit,display}))}];

test('only differing core computed stats appear, not duplicated build internals',()=>{
 const a=pack([['ОЗ','HP',300],['ОМ','MP',200],['АТК','ATK',40],
  ['Защита','Defense',20],['Леч. зельями','Potion healing',8,'%'],
  ['Точность','Accuracy',15]]);
 const b=pack([['ОЗ','HP',400],['ОМ','MP',200],['АТК','ATK',46],
  ['Защита','Defense',20],['Леч. зельями','Potion healing',17,'%'],
  ['Точность','Accuracy',15]]);
 const before=JSON.stringify([a,b]),ru=compare(a,b);
 assert.deepEqual(ru.map(x=>x.key),['stat.hp','stat.attack']);
 assert.deepEqual([ru[0].label,ru[0].a,ru[0].b,ru[0].delta],
  ['ОЗ','300','400','+100']);
 assert.equal(ru[1].delta,'+6');
 assert.deepEqual(compare(a,b,{lang:'en'}).map(x=>x.label),['HP','ATK']);
 assert.equal(JSON.stringify([a,b]),before);
});
test('delta is B minus A, reverses on swap and preserves units',()=>{
 const a=pack([['Сопр. огню','Fire resistance',20,'%'],
  ['Скор. атаки','Attack speed',5,'%']]);
 const b=pack([['Сопр. огню','Fire resistance',35,'%'],
  ['Скор. атаки','Attack speed',5,'%']]);
 assert.deepEqual(compare(a,b).map(x=>[x.key,x.delta]),[['stat.fire','+15%']]);
 assert.deepEqual(compare(b,a).map(x=>[x.key,x.delta]),[['stat.fire','-15%']]);
});
test('identical or entirely unknown outcomes do not create false differences',()=>{
 const same=pack([['ОЗ','HP',300],['Защита','Defense',null]]);
 assert.deepEqual(compare(same,structuredClone(same)),[]);
 const difference=compare(pack([['ОЗ','HP',null]]),pack([['ОЗ','HP',200]]));
 assert.deepEqual([difference[0].a,difference[0].b,difference[0].delta],
  ['—','200','—']);
 assert.deepEqual(compare(pack([['АТК','ATK',null]]),pack([['АТК','ATK',null]])),[]);
});
test('verified minimum attack difference remains visible without fake zero delta',()=>{
 const left=pack([['АТК','ATK',74,'','50–74']]);
 const right=pack([['АТК','ATK',74,'','54–74']]);
 assert.deepEqual([compare(left,right)[0].a,compare(left,right)[0].b,
  compare(left,right)[0].delta],['50–74','54–74','—']);
 assert.deepEqual(compare(left,pack([['АТК','ATK',74]])),[]);
});
test('UI is compact and embedded in My Builds, without inventory/options matrix',()=>{
 const source=read('pandora-studio-app.js');
 const begin=source.indexOf('function renderBuildComparison(');
 const end=source.indexOf('function restoreLoadedBuildUI(){',begin);
 assert.ok(begin>=0&&end>begin);
 const ui=source.slice(begin,end);
 assert.match(ui,/PandoraBuildComparison\.compactResults\(/);
 assert.match(ui,/data-compare-select/);
 assert.match(ui,/data-compare-row/);
 assert.doesNotMatch(ui,/matrixRows\(|data-compare-category|data-compare-differences|build-compare-search/);
 assert.doesNotMatch(read('pandora-studio-build-comparison.css'),
  /\.build-compare-categories|\.build-compare-note/);
});

test('a positive delta cannot be styled as universally beneficial',()=>{
 const css=read('pandora-studio-build-comparison.css');
 assert.match(css,/\.build-compare-table td\[data-direction="up"\],\s*\.build-compare-table td\[data-direction="down"\]\{color:#e7c38e/);
 assert.doesNotMatch(css,/data-direction="up"\]\{color:#b2dfac/);
 assert.doesNotMatch(css,/data-direction="down"\]\{color:#edb7a0/);
 const a=pack([['Получ. крит. урон','Incoming critical damage',10,'%']]);
 const b=pack([['Получ. крит. урон','Incoming critical damage',20,'%']]);
 assert.deepEqual(compare(a,b).map(x=>[x.delta,x.direction]),[['+10%','up']]);
});

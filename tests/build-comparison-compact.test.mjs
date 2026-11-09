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
 assert.deepEqual(ru.map(x=>x.advantage),['b','b']);
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
 assert.equal(compare(b,a)[0].advantage,'a');
});
test('identical or entirely unknown outcomes do not create false differences',()=>{
 const same=pack([['ОЗ','HP',300],['Защита','Defense',null]]);
 assert.deepEqual(compare(same,structuredClone(same)),[]);
 const difference=compare(pack([['ОЗ','HP',null]]),pack([['ОЗ','HP',200]]));
 assert.deepEqual([difference[0].a,difference[0].b,difference[0].delta],
  ['—','200','—']);
 assert.equal(difference[0].advantage,null,'Missing values cannot win comparison');
 assert.deepEqual(compare(pack([['АТК','ATK',null]]),pack([['АТК','ATK',null]])),[]);
});
test('verified minimum attack difference remains visible without fake zero delta',()=>{
 const left=pack([['АТК','ATK',74,'','50–74']]);
 const right=pack([['АТК','ATK',74,'','54–74']]);
 assert.deepEqual([compare(left,right)[0].a,compare(left,right)[0].b,
  compare(left,right)[0].delta],['50–74','54–74','—']);
 assert.equal(compare(left,right)[0].advantage,'b',
  'The stronger verified minimum ATK is emphasized when maximum ATK is equal');
 assert.deepEqual(compare(left,pack([['АТК','ATK',74]])),[]);
});
test('player-approved physical ATK comparison prioritizes maximum before minimum',()=>{
 const make=(min,max)=>pack([['АТК','ATK',max,'',min+'–'+max]]);
 const crossingA=make(20,100),crossingB=make(30,90);
 assert.equal(compare(crossingA,crossingB)[0].advantage,'a',
  '20–100 wins over 30–90 because maximum ATK has priority');
 assert.equal(compare(crossingB,crossingA)[0].advantage,'b',
  'Reversing builds preserves the same winner');
 assert.equal(compare(make(20,90),make(30,100))[0].advantage,'b');
 assert.equal(compare(make(30,100),make(20,90))[0].advantage,'a');
 assert.equal(compare(make(30,100),make(30,90))[0].advantage,'a');
 assert.equal(compare(make(30,90),make(30,100))[0].advantage,'b');
 assert.equal(compare(make(50,100),make(60,100))[0].advantage,'b',
  'Only if maxima tie, the higher verified minimum wins');
 assert.equal(compare(make(60,100),make(50,100))[0].advantage,'a');
 assert.equal(compare(make(20,100),pack([['АТК','ATK',95]]))[0].advantage,'a',
  'Higher maximum remains preferred even without the other minimum');
 assert.equal(compare(pack([['АТК','ATK',90]]),make(20,100))[0].advantage,'b');
 assert.equal(compare(pack([['АТК','ATK',100]]),
  pack([['АТК','ATK',90]]))[0].advantage,'a');
 // Unknown minimum on the same maximum is not a reason to invent a winner.
 assert.deepEqual(compare(make(20,100),pack([['АТК','ATK',100]])),[]);
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
 assert.doesNotMatch(ui,/matrixRows\(|data-compare-category|data-compare-differences|build-compare-search|data-compare-delta/);
 assert.match(ui,/const half=Math\.ceil\(rows\.length\/2\)/);
 assert.match(ui,/\.\.\.metricCells\(rows\[i\]\),\.\.\.metricCells\(rows\[i\+half\]\)/);
 assert.doesNotMatch(read('pandora-studio-build-comparison.css'),
  /\.build-compare-categories|\.build-compare-note/);
});

test('the beneficial A/B reading is bold without a delta column',()=>{
 const css=read('pandora-studio-build-comparison.css');
 assert.match(css,/\.build-compare-table td\[data-compare-advantage\]/);
 assert.doesNotMatch(css,/td\[data-direction="up"\]|td\[data-direction="down"\]/);
 const stronger=compare(pack([['ОЗ','HP',350]]),pack([['ОЗ','HP',300]]));
 assert.equal(stronger[0].advantage,'a','B must not win just because it is on the right');
 const incoming=compare(
  pack([['Получ. крит. урон','Incoming critical damage',10,'%']]),
  pack([['Получ. крит. урон','Incoming critical damage',20,'%']])
 );
 assert.deepEqual(incoming.map(x=>[x.delta,x.direction,x.advantage]),
  [['+10%','up','a']],'More incoming damage is not an advantage');
 const physical=compare(
  pack([['Сопр. физ (%)','Physical damage change',-10,'%']]),
  pack([['Сопр. физ (%)','Physical damage change',-5,'%']])
 );
 assert.equal(physical[0].advantage,'a','Less damage taken is preferable');
 const speed=compare(
  pack([['Сокрщ. времени каста','Cast time',10,'%']]),
  pack([['Сокрщ. времени каста','Cast time',20,'%']])
 );
 assert.equal(speed[0].advantage,'b','Greater cast-time reduction is preferable');
});

test('waiting for game data is distinct from a malformed saved build',()=>{
 const source=read('pandora-studio-app.js');
 const begin=source.indexOf('function renderBuildComparison(');
 const end=source.indexOf('function restoreLoadedBuildUI(){',begin);
 const ui=source.slice(begin,end);
 const check=ui.indexOf('if(!catalog.live||!gameTables)');
 const calculation=ui.indexOf('PandoraBuildComparison.calculatePair(');
 assert.ok(check>=0&&calculation>check);
 assert.match(ui,/Итоговые характеристики появятся после загрузки игровых данных/);
 assert.match(ui,/Calculated stats will appear once game data have loaded/);
 assert.match(ui,/Не удалось рассчитать один из билдов\. Сохранения не изменены/);
});


test('compact A/B includes derived combat differences previously omitted from Hero Book',()=>{
 const pairs=[
  ['АТК спереди','Front ATK','frontAttack','%'],
  ['АТК сзади','Back ATK','backAttack','%'],
  ['Дальн. АТК ближ. боя','Melee range (base)','meleeRange',''],
  ['Дальн. АТК дальн. боя','Ranged range (base)','rangedRange',''],
  ['Сопр. физ (ед.)','Physical mitigation (flat)','physicalFlat',''],
  ['Точн. спереди','Front accuracy','frontAccuracy',''],
  ['Укл. дальн. атак','Ranged evasion','rangedEvasion','%'],
  ['Скор. в городе','Town movement speed','townSpeed','%'],
  ['Сопр. аном. тел.','Physical conditions','physicalConditions','%'],
  ['Сопр. аном. дух.','Mental conditions','mentalConditions','%']
 ];
 const a=pack(pairs.map(([ru,en,key,unit])=>[ru,en,10,unit]));
 const b=pack(pairs.map(([ru,en,key,unit])=>[ru,en,12,unit]));
 const before=JSON.stringify([a,b]);
 const ru=compare(a,b),en=compare(a,b,{lang:'en'});
 assert.deepEqual(ru.map(x=>x.key),
  pairs.map(([, ,key])=>'stat.'+key));
 assert.deepEqual(ru.map(x=>x.delta),pairs.map(([, , ,unit])=>'+2'+unit));
 assert.deepEqual(en.map(x=>x.label),pairs.map(([,name])=>name));
 assert.equal(JSON.stringify([a,b]),before,'comparison must not mutate Hero Book rows');
});

test('extra Hero Book outcomes never add UI rows when unchanged or unknown',()=>{
 const left=pack([
  ['АТК сзади','Back ATK',20,'%'],
  ['Сопр. физ (ед.)','Physical mitigation (flat)',null],
  ['Скор. в городе','Town movement speed',null,'%'],
  ['Укл. дальн. атак','Ranged evasion',10,'%']
 ]);
 const right=pack([
  ['АТК сзади','Back ATK',20,'%'],
  ['Сопр. физ (ед.)','Physical mitigation (flat)',null],
  ['Скор. в городе','Town movement speed',null,'%'],
  ['Укл. дальн. атак','Ranged evasion',12,'%']
 ]);
 assert.deepEqual(compare(left,right).map(x=>x.key),['stat.rangedEvasion']);
 assert.equal(compare(left,left).length,0);
});

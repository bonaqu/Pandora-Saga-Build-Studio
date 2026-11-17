import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root={window:{}};
vm.runInNewContext(read('pandora-studio-chest-presentation.js'),root);
const model=root.window.PandoraStudioChestPresentation;
const current=JSON.parse(read('data/os/chests.json'));
const items=JSON.parse(read('data/os/items.json'));
const souls=JSON.parse(read('data/os/souls.json'));
const chests=[...current.boxes,...current.npc];
const chestIds=new Set(chests.map(row=>String(row.i)));
const box=id=>chests.find(row=>String(row.i)===String(id));
const plain=obj=>JSON.parse(JSON.stringify(obj));

test('all 45 original chest inventories are indexed without dropping any reward',()=>{
 assert.ok(chests.length>=45,'Current and future chest inventories are supported');
 const before=JSON.stringify([chests,items,souls]);
 for(const chest of chests){
  const expected=chest.rolls.flat().length;
  const facets=model.rewardFilters(chest.rolls,items,souls,chestIds);
  assert.equal(facets.total,expected,String(chest.i));
  assert.equal(Object.values(facets.types).reduce((a,b)=>a+b,0),expected,
   'Every reward has exactly one type in chest '+chest.i);
  assert.equal(Object.values(facets.slots).reduce((a,b)=>a+b,0),
   facets.types.equipment,'Every gear reward has exactly one equipment slot');
  for(const reward of chest.rolls.flat()){
   const category=model.rewardCategory(reward,items,souls,chestIds);
   assert.ok(model.categoryOrder.includes(category.type),'Unknown category');
   assert.ok(model.rewardMatches(category,'all','all'));
   assert.equal(model.rewardMatches(category,category.type,'all'),true);
  }
 }
 assert.equal(JSON.stringify([chests,items,souls]),before,
  'Filtering must not touch source chances, items, probabilities, or Souls');
});

test('large ancient king chest supports all existing equipment slots',()=>{
 const chest=box(51036);
 const expected=chest.rolls.flat().length;
 assert.ok(expected>0,'A large source chest has real rewards');
 const facets=model.rewardFilters(chest.rolls,items,souls,chestIds);
 assert.equal(facets.total,expected);
 assert.equal(facets.types.equipment,chest.rolls.flat().filter(row=>
  model.equipmentSlots.includes(items[row.i]?.slot)).length);
 assert.equal(facets.slots.body,chest.rolls.flat().filter(row=>
  items[row.i]?.slot==='body').length);
 assert.equal(facets.slots.weapon,chest.rolls.flat().filter(row=>
  items[row.i]?.slot==='weapon').length);
 assert.equal(facets.slots.belt,chest.rolls.flat().filter(row=>
  items[row.i]?.slot==='belt').length);
 assert.equal(facets.slots.head,chest.rolls.flat().filter(row=>
  items[row.i]?.slot==='head').length);
 assert.equal(model.rewardMatches({type:'equipment',slot:'body'},'equipment','weapon'),false);
 assert.equal(model.rewardMatches({type:'equipment',slot:'body'},'equipment','body'),true);
 assert.equal(model.rewardMatches({type:'equipment',slot:'body'},'souls','all'),false);
});

test('actual map chests separate Souls, potions, materials, gems and currency',()=>{
 const eastern=model.rewardFilters(box(52001).rolls,items,souls,chestIds);
 assert.equal(eastern.total,box(52001).rolls.flat().length);
 assert.ok(eastern.types.souls>0);
 assert.ok(eastern.types.potions>0);
 const northern=model.rewardFilters(box(52002).rolls,items,souls,chestIds);
 assert.equal(northern.total,box(52002).rolls.flat().length);
 assert.ok(northern.types.gold>0);
 assert.ok(northern.types.potions>0);
 const montori=model.rewardFilters(box(52005).rolls,items,souls,chestIds);
 assert.ok(montori.types.gems>0);
 assert.ok(montori.types.equipment>0);
 assert.ok(montori.types.boosts>0);
 const scout=model.rewardFilters(box(51013).rolls,items,souls,chestIds);
 assert.equal(scout.total,box(51013).rolls.flat().length);
 assert.ok(scout.types.containers>0);
});

test('published ETC utility and potion rewards are not mislabeled as crafting materials',()=>{
 const before=JSON.stringify([items,souls,chests]);
 const expectedUtility=[65004,65006,90001,90004,90037,90053,
  90045,90046,90049,90050,90057,90060,90080];
 for(const id of expectedUtility){
  assert.equal(items[id]?.kind,'ETC','Source classification changed for '+id);
  assert.deepEqual(plain(model.rewardCategory({i:id},items,souls,chestIds)),
   {type:'utility',slot:null},'Source-supported utility '+id);
 }
 assert.equal(items[90038]?.kind,'ETC');
 assert.equal(model.rewardCategory({i:90038},items,souls,chestIds).type,'potions',
  'The universal status-curing potion is really a consumable');
 assert.equal(model.rewardCategory({i:70012},items,souls,chestIds).type,'materials',
  'Source ETC jadeite must not be mistaken for a socket gem');
 assert.equal(model.rewardCategory({i:90080},items,souls,chestIds).type,'utility',
  'Repair hammer is not a crafting material or unspecified Soul');
 assert.equal(model.rewardCategory({i:90080},{90080:{kind:'NEW_UNKNOWN'}},
  {},new Set()).type,'other','No classification override when source kind changes');
 const serviceChest=model.rewardFilters(box(52000).rolls,items,souls,chestIds);
 assert.ok(serviceChest.types.utility>=5,'An ordinary chest exposes utility items');
 assert.ok(serviceChest.types.potions>0,'The universal potion is visible under Potions');
 const hammerChest=model.rewardFilters(box(52005).rolls,items,souls,chestIds);
 assert.ok(hammerChest.types.utility>0,'Repair hammer appears under Utility items');
 assert.equal(JSON.stringify([items,souls,chests]),before,'Faceting is purely presentational');
});

test('guaranteed chest rewards use stable auto-fill tracks across screen widths',()=>{
 const css=read('pandora-studio-wiki-polish.css');
 assert.match(css,/\.wiki-chest-assured-grid\s*\{[^}]*grid-template-columns:repeat\(auto-fill,/s);
 assert.doesNotMatch(css,/\.wiki-chest-assured-grid\s*\{[^}]*repeat\(auto-fit,/s);
 const app=read('pandora-studio-app.js');
 assert.match(app,/\['utility','Полезные предметы','Utility items'\]/);
});

test('future unknown types, missing IDs, and gold-only rows never fabricate game facts',()=>{
 const customItems={
  991001:{id:991001,kind:'FUTURE_KIND',slot:'unknown'},
  991002:{id:991002,kind:'NEW_ARMOR',slot:'body'},
  991003:{id:991003,kind:'SOUL'},
  991004:{id:991004,kind:'BALM'},
  991005:{id:991005,kind:'POTION'},
  991006:{id:991006,kind:'RUNEGEM'},
  991007:{id:991007,kind:'RECIPE'}
 };
 const rolls=[[{i:991001,p:12},{i:991002,p:4},{i:991003,p:25},
  {i:991004,p:0},{i:991005,p:null},{i:991006,p:5},{i:991007,p:8},
  {i:999999,p:1},{gold:[0,1000],p:30},{i:991099,p:30}]];
 const before=JSON.stringify(rolls);
 const ids=new Set(['991099']);
 const facets=model.rewardFilters(rolls,customItems,{},ids);
 assert.equal(facets.total,10);
 assert.deepEqual(plain(facets.types),{
  equipment:1,potions:1,boosts:1,gems:1,souls:1,utility:0,
  materials:1,containers:1,gold:1,other:2
 });
 assert.equal(facets.slots.body,1);
 assert.deepEqual(plain(model.rewardCategory({i:999999},customItems,{},ids)),
  {type:'other',slot:null});
 assert.deepEqual(plain(model.rewardCategory({gold:[0,1000]},customItems,{},ids)),
  {type:'gold',slot:null});
 assert.equal(JSON.stringify(rolls),before);
 assert.equal(model.rewardMatches({type:'other',slot:null},'other','all'),true);
});

test('the implementation excludes every source-backed level-up reward box',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/if\(!wikiIndex\.rewardChest\(id\)&&groups\.length\)/);
 assert.match(app,/const facet=window\.PandoraStudioChestPresentation\.rewardCategory\(/);
 assert.match(app,/'data-roll-group':String\(i\+1\),'data-reward-type':facet\.type/);
 assert.match(app,/wikiChestRewardFilter=\{id:String\(id\),type:'all',slot:'all'\}/);
 assert.match(app,/window\.PandoraStudioChestPresentation\.orderedGroups\(groups\)/);
 assert.match(app,/window\.PandoraStudioChestPresentation\.orderedRewards\(group\)/);
 assert.ok(app.includes('ri===rowIndex?{...r,n}:r'),
  'Editor reward index must not be reindexed by category filtering');
 assert.match(app,/data-reward-slot/);
 assert.match(app,/gallery\.querySelectorAll\('\.wiki-chest-reward'\)/);
 assert.match(app,/class:'wiki-chest-slot-filters'/,
  'Equipment type chips must be visible without first choosing Equipment');
 assert.match(app,/'data-chest-slot':key,'aria-pressed':'false'/,
  'Every direct slot action must be accessible');
 assert.match(app,/typeFilter\.value='equipment'/,
  'Direct slot action must activate the equipment category');
 assert.match(app,/groupCount\.dataset\.unfiltered/,
  'Unfiltered source group counts must be preserved');
 assert.match(app,/groupCount\.textContent=type==='all'/,
  'Counts in each group must change with filtering');
 assert.match(app,/gallery\.dataset\.filtered/,
  'Filtered layouts must be distinguished from the full inventory');
 assert.doesNotMatch(app,/class:'wiki-chest-filter-slot'/,
  'Do not hide the slot choice behind an extra dropdown');
 const css=read('pandora-studio-wiki-polish.css');
 assert.match(css,/\.wiki-chest-board \.wiki-chest-reward\[hidden\]/);
 assert.match(css,/\.wiki-chest-reward-filters select:focus-visible/);
 assert.match(css,/\.wiki-chest-slot-option\[aria-pressed="true"\]/);
 assert.match(css,/\.wiki-chest-board\[data-filtered="true"\]/);
 assert.match(css,/\.wiki-chest-board\[data-filtered="true"\][^}]*display:grid;grid-template-columns:repeat\(auto-fill/s,
  'Incomplete final rows must use stable grid tracks, not growing flex cards');
 assert.doesNotMatch(css,/flex:1 1 210px/,
  'No last-row flex growth is allowed in the filtered chest');

});

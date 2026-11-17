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
 assert.equal(chests.length,45);
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
 assert.equal(chest.rolls.flat().length,127);
 const facets=model.rewardFilters(chest.rolls,items,souls,chestIds);
 assert.equal(facets.total,127);
 assert.equal(facets.types.equipment,127);
 assert.equal(facets.slots.body,36);
 assert.equal(facets.slots.weapon,39);
 assert.equal(facets.slots.belt,20);
 assert.equal(facets.slots.head,8);
 assert.equal(model.rewardMatches({type:'equipment',slot:'body'},'equipment','weapon'),false);
 assert.equal(model.rewardMatches({type:'equipment',slot:'body'},'equipment','body'),true);
 assert.equal(model.rewardMatches({type:'equipment',slot:'body'},'souls','all'),false);
});

test('actual map chests separate Souls, potions, materials, gems and currency',()=>{
 const eastern=model.rewardFilters(box(52001).rolls,items,souls,chestIds);
 assert.equal(eastern.total,25);
 assert.equal(eastern.types.souls,24);
 assert.equal(eastern.types.potions,1);
 const northern=model.rewardFilters(box(52002).rolls,items,souls,chestIds);
 assert.equal(northern.total,7);
 assert.equal(northern.types.gold,6);
 assert.equal(northern.types.potions,1);
 const montori=model.rewardFilters(box(52005).rolls,items,souls,chestIds);
 assert.equal(montori.types.gems,4);
 assert.equal(montori.types.equipment,3);
 assert.equal(montori.types.boosts,1);
 const scout=model.rewardFilters(box(51013).rolls,items,souls,chestIds);
 assert.equal(scout.total,5);
 assert.equal(scout.types.containers,1);
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
  equipment:1,potions:1,boosts:1,gems:1,souls:1,
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
 assert.match(app,/rowIndex\?\\{...r,n\\}:r/);
 assert.match(app,/data-reward-slot/);
 assert.match(app,/gallery\.querySelectorAll\('\.wiki-chest-reward'\)/);
 const css=read('pandora-studio-wiki-polish.css');
 assert.match(css,/\.wiki-chest-board \.wiki-chest-reward\[hidden\]/);
 assert.match(css,/\.wiki-chest-reward-filters select:focus-visible/);
});

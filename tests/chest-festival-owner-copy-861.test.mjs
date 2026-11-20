import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root={window:{}};
vm.runInNewContext(read('pandora-studio-chest-presentation.js'),root);
const model=root.window.PandoraStudioChestPresentation;
const items=JSON.parse(read('data/os/items.json'));
const chests=JSON.parse(read('data/os/chests.json'));
const all=[...chests.boxes,...chests.npc];
const ids=new Set(all.map(box=>String(box.i)));
const plain=value=>JSON.parse(JSON.stringify(value));
const event=all.find(box=>box.i===51049);

test('ritual chest has exactly nine source-verified festive TOY rewards',()=>{
 assert.ok(event,'Ritual Utensils chest is present in the published archive');
 const source=JSON.stringify([event,items]);
 const rewards=event.rolls.flat();
 const expected=[50027,50028,50029,50030,50036,50038,50039,50040,50041];
 assert.deepEqual(rewards.map(row=>row.i).sort((a,b)=>a-b),
  [...expected].sort((a,b)=>a-b));
 for(const row of rewards){
  assert.equal(items[row.i]?.kind,'TOY','Festival IDs must still match real kind');
  assert.deepEqual(plain(model.rewardCategory(row,items,{},ids)),
   {type:'festival',slot:null});
 }
 const facets=model.rewardFilters(event.rolls,items,{},ids);
 assert.equal(facets.total,9);
 assert.equal(facets.types.festival,9);
 assert.equal(facets.types.other,0);
 assert.equal(facets.types.materials,0);
 assert.ok(model.categoryOrder.includes('festival'));
 assert.equal(model.rewardMatches({type:'festival',slot:null},'festival'),true);
 assert.equal(model.rewardMatches({type:'festival',slot:null},'other'),false);
 assert.equal(JSON.stringify([event,items]),source,'Never change catalog or chances');
});

test('festival exceptions must not recategorize arbitrary future toys or boxes',()=>{
 const customItems={
  50027:{kind:'TOY'},51049:{kind:'TOY'},
  99001:{kind:'TOY'},99002:{kind:'FUTURE_KIND'},
  99003:{kind:'ETC'},99004:{kind:'POTION'}
 };
 const boxIds=new Set(['51049']);
 assert.equal(model.rewardCategory({i:50027},customItems,{},boxIds).type,'festival');
 assert.equal(model.rewardCategory({i:51049},customItems,{},boxIds).type,'containers');
 assert.equal(model.rewardCategory({i:99001},customItems,{},boxIds).type,'other');
 assert.equal(model.rewardCategory({i:99002},customItems,{},boxIds).type,'other');
 assert.equal(model.rewardCategory({i:99003},customItems,{},boxIds).type,'materials');
 assert.equal(model.rewardCategory({i:99004},customItems,{},boxIds).type,'potions');
 assert.equal(model.rewardCategory({i:50027},{50027:{kind:'UNKNOWN'}},{},new Set()).type,'other');
});

test('chest labels remain accessible without exposing owner D1 controls to guests',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/\['festival','Праздничные предметы','Festive items'\]/);
 assert.match(app,/ownerCopy\('wiki\.chest','slotHeading','Тип экипировки','Equipment type'\)/);
 assert.match(app,/ownerCopyLabel\(slotHeading,'wiki\.chest','slotHeading'/);
 assert.doesNotMatch(app,/class:'ui-content-pencil wiki-chest-slot-copy-pencil'/);
 assert.match(app,/ownerCopyLabel\(slotHeading,'wiki\.chest','slotHeading'/);
 assert.match(app,/const type=wikiChestRewardFilter\.type,slot=wikiChestRewardFilter\.slot/);
});

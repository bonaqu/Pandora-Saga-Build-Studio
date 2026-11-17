import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const catalogItems=JSON.parse(readFileSync(new URL('../data/os/items.json',import.meta.url),'utf8'));
const chestData=JSON.parse(readFileSync(new URL('../data/os/chests.json',import.meta.url),'utf8'));
const sourceRows=id=>{
 const chest=[...chestData.boxes,...chestData.npc].find(row=>row.i===id);
 assert.ok(chest,'Missing current archive chest '+id);
 return chest.rolls.flat();
};
const sourceSlot=(id,slot)=>sourceRows(id).filter(row=>
 catalogItems[row.i]?.slot===slot).length;
const sourceKind=(id,kind)=>sourceRows(id).filter(row=>
 catalogItems[row.i]?.kind===kind).length;
const sourceGold=id=>sourceRows(id).filter(row=>Array.isArray(row.gold)).length;


// Real, unauthenticated Chromium. Source data is loaded from the local static
// archive; no game client, admin login, account or production D1 writes.
export async function runChestCategoryFiltersSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1366,height:860}});
 await context.route('**/*',route=>route.request().url().startsWith(base+'/')?
  route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const openChest=async id=>{
  if(await page.locator('#dockClose').isVisible())
   await page.locator('#dockClose').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('[data-wiki-chapter="chest"]').click();
  await page.locator('[data-wiki-record="'+id+'"]').click();
  await page.locator('.wiki-chest-board').waitFor({state:'visible',timeout:30000});
 };
 const cards=()=>page.locator('.wiki-chest-board .wiki-chest-reward:not([hidden])');
 const verifyFacets=async(expectedType,expectedSlot)=>{
  const data=await cards().evaluateAll(nodes=>nodes.map(node=>({
   type:node.dataset.rewardType,slot:node.dataset.rewardSlot,
   chance:node.querySelector('.wiki-reward-percent')?.textContent||''
  })));
  for(const row of data){
   assert.equal(row.type,expectedType,'Visible reward belongs to chosen source type');
   if(expectedSlot)assert.equal(row.slot,expectedSlot);
   assert.ok(row.chance.includes('%')||row.chance.length>0,
    'The original chance remains displayed, not recalculated');
  }
  return data.length;
 };
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await openChest(51036); // Ancient King: actual 127 source reward variants
  const toolbar=page.locator('.wiki-chest-reward-filters');
  const type=toolbar.locator('.wiki-chest-filter-type');
  const slots=toolbar.locator('.wiki-chest-slot-filters');
  assert.equal(await toolbar.count(),1);
  assert.equal(await cards().count(),sourceRows(51036).length);
  assert.equal(await type.getAttribute('aria-label'),'Тип награды в сундуке');
  assert.equal(await slots.isVisible(),true,
   'Equipment slots must be discoverable before selecting Equipment');
  assert.equal(await slots.getAttribute('aria-label'),'Типы экипировки');
  assert.ok(await slots.locator('[data-chest-slot="body"]').count()>0);
  assert.ok(await slots.locator('[data-chest-slot="weapon"]').count()>0);
  // A direct slot click also chooses Equipment: one interaction, not two.
  await slots.locator('[data-chest-slot="body"]').click();
  assert.equal(await type.inputValue(),'equipment');
  assert.equal(await slots.locator('[data-chest-slot="body"]').getAttribute('aria-pressed'),'true');
  assert.equal(await verifyFacets('equipment','body'),sourceSlot(51036,'body'));
  assert.ok((await toolbar.locator('.wiki-chest-filter-count').innerText()).includes(
   sourceSlot(51036,'body')+' / '+sourceRows(51036).length));
  const groupCounter=page.locator('.wiki-chest-group:not([hidden]) .wiki-chest-group-count').first();
  assert.ok((await groupCounter.innerText()).includes('/ '),
   'Visible groups must display filtered count alongside original size');
  assert.equal(await page.locator('.wiki-chest-board').getAttribute('data-filtered'),'true');
  const maxCardWidth=await cards().evaluateAll(nodes=>Math.max(...nodes.map(
   node=>node.getBoundingClientRect().width)));
  assert.ok(maxCardWidth<=341,'A small filtered result must not stretch to a huge card: '+maxCardWidth);
  await slots.locator('[data-chest-slot="weapon"]').click();
  assert.equal(await verifyFacets('equipment','weapon'),sourceSlot(51036,'weapon'));
  // Exercise a genuinely incomplete row at the current browser width.
  // 39 weapons may divide evenly into 3 columns, so try several real source
  // categories until one has a short final row. Never assume column count.
  let incompleteRows=[];
  let incompleteSlot=null;
  for(const candidate of ['weapon','belt','head','shield','feet','ring','body']){
   await slots.locator('[data-chest-slot="'+candidate+'"]').click();
   const found=await page.locator('.wiki-chest-group:not([hidden])').evaluateAll(sections=>{
    const output=[];
    for(const section of sections){
     const visible=[...section.querySelectorAll('.wiki-chest-reward:not([hidden])')];
     const rows=[];
     for(const card of visible){
      const rect=card.getBoundingClientRect();
      if(!rect.width||!rect.height)continue;
      const previous=rows.find(row=>Math.abs(row.top-rect.top)<2);
      if(previous)previous.widths.push(rect.width);
      else rows.push({top:rect.top,widths:[rect.width]});
     }
     if(rows.length>1&&rows.at(-1).widths.length<rows[0].widths.length)
      output.push({first:rows[0].widths,last:rows.at(-1).widths});
    }
    return output;
   });
   if(found.length){incompleteRows=found;incompleteSlot=candidate;break}
  }
  assert.ok(incompleteRows.length>0,
   'Ancient King must exercise an incomplete row in at least one equipment category');
  for(const {first,last} of incompleteRows){
   const reference=first[0];
   for(const width of [...first,...last])
    assert.ok(Math.abs(width-reference)<=1.5,
     'Last row card expanded relative to first row: '+JSON.stringify({incompleteSlot,first,last}));
  }
  await type.selectOption('all');
  assert.equal(await cards().count(),sourceRows(51036).length,
   'Removing filter must restore all source rows');
  assert.equal(await slots.isVisible(),true,
   'Equipment facets must remain discoverable under All rewards');
  assert.equal(await page.locator('.wiki-chest-board').getAttribute('data-filtered'),'false');
  await slots.locator('[data-chest-slot="all"]').click();
  assert.equal(await verifyFacets('equipment'),sourceRows(51036).filter(row=>
   catalogItems[row.i]?.slot).length);
  assert.equal(await slots.locator('[data-chest-slot="all"]').getAttribute('aria-pressed'),'true');
  // Test the wide set of equipment facets at phone width, not just gold boxes.
  await page.setViewportSize({width:390,height:844});
  const mobileFacets=await page.evaluate(()=>{
   const box=document.querySelector('.wiki-chest-slot-filters')?.getBoundingClientRect();
   return {overflow:Math.max(document.body.scrollWidth,
    document.documentElement.scrollWidth)-document.documentElement.clientWidth,
    chipsWidth:box?.width||0};
  });
  assert.ok(mobileFacets.overflow<=15,
   'Ancient King equipment facet row must not overflow mobile: '+JSON.stringify(mobileFacets));
  assert.ok(mobileFacets.chipsWidth<=390);
  await slots.locator('[data-chest-slot="body"]').click();
  assert.equal(await verifyFacets('equipment','body'),sourceSlot(51036,'body'));
  await page.setViewportSize({width:1366,height:860});

  // Source-backed ETC exceptions: don't hide utility tickets, bags and
  // repair tools in the generic crafting materials filter.
  const utilityIds=new Set(['65004','65006','90001','90004','90037','90053',
   '90045','90046','90049','90050','90057','90060','90080']);
  const utilityCount=id=>sourceRows(id).filter(row=>
   utilityIds.has(String(row.i))).length;
  await openChest(52000);
  const utilityFilter=page.locator('.wiki-chest-filter-type');
  assert.ok(await utilityFilter.locator('option[value="utility"]').count()>0);
  assert.ok(utilityCount(52000)>0);
  await utilityFilter.selectOption('utility');
  assert.equal(await verifyFacets('utility'),utilityCount(52000));
  await utilityFilter.selectOption('potions');
  assert.equal(await verifyFacets('potions'),sourceRows(52000).filter(row=>
   catalogItems[row.i]?.kind==='POTION'||Number(row.i)===90038).length,
   'Universal potion must be listed with other potions, not materials');
  await openChest(52005);
  const toolFilter=page.locator('.wiki-chest-filter-type');
  await toolFilter.selectOption('utility');
  assert.equal(await verifyFacets('utility'),utilityCount(52005));
  assert.ok((await cards().allInnerTexts()).some(text=>text.includes('Молот подмастерья')),
   'Repair hammer must be visible in Utility items');

  await openChest(52001); // NPC chest with Soul and Potion types
  const types=page.locator('.wiki-chest-filter-type');
  assert.equal(await cards().count(),sourceRows(52001).length);
  await types.selectOption('souls');
  assert.equal(await verifyFacets('souls'),sourceKind(52001,'SOUL'));
  await types.selectOption('potions');
  assert.equal(await verifyFacets('potions'),sourceKind(52001,'POTION'));
  await types.selectOption('souls');
  assert.equal(await verifyFacets('souls'),sourceKind(52001,'SOUL'));

  // Language change keeps current filter but uses new labels; never filters
  // a different chest automatically with a previous chest's selection.
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="en"]').click();
  await openChest(52001);
  assert.equal(await page.locator('.wiki-chest-filter-type').inputValue(),'souls');
  assert.equal(await page.locator('.wiki-chest-filter-type').getAttribute('aria-label'),
   'Chest reward category');
  assert.equal(await verifyFacets('souls'),sourceKind(52001,'SOUL'));
  await openChest(52002);
  assert.equal(await page.locator('.wiki-chest-filter-type').inputValue(),'all');
  await page.locator('.wiki-chest-filter-type').selectOption('gold');
  assert.equal(await verifyFacets('gold'),sourceGold(52002));
  assert.equal(await page.locator('.wiki-chest-gold-reward:not([hidden])').count(),
   sourceGold(52002));
  await page.setViewportSize({width:390,height:844});
  const geometry=await page.evaluate(()=>({
   overflow:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-
    document.documentElement.clientWidth,
   filters:document.querySelector('.wiki-chest-reward-filters')?.getBoundingClientRect().width
  }));
  assert.ok(geometry.overflow<=15,'Mobile chest reward filters overflow: '+JSON.stringify(geometry));
  assert.ok(geometry.filters<=390,'Filter controls should fit mobile width');

  await openChest(51013); // Scout level-15 box: special layout stays unchanged
  assert.equal(await page.locator('.wiki-chest-reward-filters').count(),0);
  assert.equal(await page.locator('.wiki-level-reward').isVisible(),true);
  assert.ok(await cards().count()>1,'Level-up chest retains its normal rewards');
  assert.deepEqual(errors,[],'Browser errors in filtered or level-up chest');
  console.log('Chromium chest categories: all source gear, Souls, gold, RU/EN, mobile and exempt level-up box');
 }finally{await context.close()}
}

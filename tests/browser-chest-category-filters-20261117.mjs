import assert from 'node:assert/strict';

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
  const slot=toolbar.locator('.wiki-chest-filter-slot');
  assert.equal(await toolbar.count(),1);
  assert.equal(await cards().count(),127);
  assert.equal(await type.getAttribute('aria-label'),'Тип награды в сундуке');
  await type.selectOption('equipment');
  assert.equal(await slot.isVisible(),true);
  await slot.selectOption('body');
  assert.equal(await verifyFacets('equipment','body'),36);
  assert.match(await toolbar.locator('.wiki-chest-filter-count').innerText(),/36\s*\/\s*127/);
  await slot.selectOption('weapon');
  assert.equal(await verifyFacets('equipment','weapon'),39);
  await type.selectOption('all');
  assert.equal(await cards().count(),127,'Removing filter must restore all source rows');
  assert.equal(await slot.isVisible(),false);

  await openChest(52001); // NPC chest with Soul and Potion types
  const types=page.locator('.wiki-chest-filter-type');
  assert.equal(await cards().count(),25);
  await types.selectOption('souls');
  assert.equal(await verifyFacets('souls'),24);
  await types.selectOption('potions');
  assert.equal(await verifyFacets('potions'),1);
  await types.selectOption('souls');
  assert.equal(await verifyFacets('souls'),24);

  // Language change keeps current filter but uses new labels; never filters
  // a different chest automatically with a previous chest's selection.
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="en"]').click();
  await openChest(52001);
  assert.equal(await page.locator('.wiki-chest-filter-type').inputValue(),'souls');
  assert.equal(await page.locator('.wiki-chest-filter-type').getAttribute('aria-label'),
   'Chest reward category');
  assert.equal(await verifyFacets('souls'),24);
  await openChest(52002);
  assert.equal(await page.locator('.wiki-chest-filter-type').inputValue(),'all');
  await page.locator('.wiki-chest-filter-type').selectOption('gold');
  assert.equal(await verifyFacets('gold'),6);
  assert.equal(await page.locator('.wiki-chest-gold-reward:not([hidden])').count(),6);
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
  console.log('Chromium chest categories: 127 gear, 24 Souls, gold, RU/EN, mobile and exempt level-up box');
 }finally{await context.close()}
}

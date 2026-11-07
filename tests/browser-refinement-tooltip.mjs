import assert from 'node:assert/strict';

// Actual DOM and click flow against the checked-in current-game snapshot.
// The visible item bonus is the whole part of +1.2 × grade; character DEF
// still carries fractional tenths until the final total is calculated.
const bonuses=[0,1,2,3,4,6,7,8,9,10,12];
export async function runRefinementTooltipSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1366,height:900}});
 await context.addInitScript(()=>{
  localStorage.setItem('ps-build-studio.v1',JSON.stringify({
   race:1,gender:0,job:0,level:45,
   equipment:{5:{id:13041,name:'Железные поножи'}},
   refinements:{'5:13041':0}
  }));
 });
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>
   document.querySelector('#catalogStatus')?.textContent?.includes('предметов')&&
   document.querySelector('.equipment-slot[data-slot-index="5"].equipped'),null,
   {timeout:25000});
  await page.locator('.equipment-slot[data-slot-index="5"]').click();
  const panel=page.locator('#stagePicker');
  await panel.locator('.stage-rich-fields').waitFor({state:'visible'});
  for(let grade=0;grade<=10;grade++){
   await panel.locator('[data-grade="'+grade+'"]').click();
   await page.waitForFunction(level=>
    document.querySelector('#stagePicker [data-grade="'+level+'"]')?.getAttribute('aria-pressed')==='true',
    grade);
   const result=await panel.locator('.stage-rich-fields').evaluate(dl=>{
    const keys=[...dl.querySelectorAll('dt')];
    const idx=keys.findIndex(k=>k.textContent.trim()==='Защита');
    return idx>=0?dl.querySelectorAll('dd')[idx]?.textContent.trim():null;
   });
   assert.equal(result,grade?'12+'+bonuses[grade]:'12',
    'Actual leggings Properties page must show server defense increment at +'+grade);
  }
  // Even for +3, the exact character defense is 15.6 and displays 15,
  // while the item shows 12+3. No premature per-piece rounding assumptions.
  await panel.locator('[data-grade="3"]').click();
  await page.locator('#hero').click();
  await page.locator('#stageAttributes').waitFor({state:'visible'});
  const def=page.locator('#stageBookPanel .stage-result-tile').filter({hasText:'Защита'});
  assert.equal(await def.locator('strong').first().innerText(),'15');
  await page.locator('#stageAttributes .stage-book-close').click();
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('.equipment-slot[data-slot-index="5"]').click();
  const english=await panel.locator('.stage-rich-fields').evaluate(dl=>{
   const keys=[...dl.querySelectorAll('dt')];
   const idx=keys.findIndex(k=>k.textContent.trim()==='Defense');
   return idx>=0?dl.querySelectorAll('dd')[idx]?.textContent.trim():null;
  });
  assert.equal(english,'12+3','English item description must share the same formula');
  assert.deepEqual(errors,[]);
  console.log('Chromium forging display: +0..+10 properties and RU/EN confirmed');
 }finally{await context.close()}
}

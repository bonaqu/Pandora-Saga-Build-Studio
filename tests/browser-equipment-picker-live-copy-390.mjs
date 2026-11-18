import assert from 'node:assert/strict';

// Public browser: no login, no production writes, real catalogs and picker.
export async function runEquipmentPickerLiveCopy390Smoke(browser,base){
 const ctx=await browser.newContext({viewport:{width:1366,height:900}});
 await ctx.addInitScript(()=>{
  localStorage.setItem('ps-build-studio.v1',JSON.stringify({
   race:3,gender:0,job:21,level:1,equipment:{},souls:{},
   refinements:{},gems:{}
  }));
 });
 await ctx.route('**/*',route=>route.request().url().startsWith(base+'/')?
  route.continue():route.abort());
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  await page.waitForFunction(()=>document.querySelectorAll('.equipment-slot').length===14,
   null,{timeout:30000});
  await page.locator('.equipment-slot[data-slot-index="0"]').click({button:'right'});
  await page.locator('.stage-gear-context-menu [data-gear-context-action="choose"]').click();
  const picker=page.locator('#stagePicker');
  await picker.locator('.stage-picker-list').waitFor({state:'visible'});
  const filter=picker.locator('.stage-picker-only-available');
  const checkbox=filter.locator('input[type="checkbox"]');
  assert.equal((await filter.innerText()).trim(),'Доступные на моём уровне');
  assert.equal(await checkbox.getAttribute('aria-label'),'Только доступные на моём уровне');
  assert.match((await picker.locator('.stage-picker-count').innerText()).trim(),
   /^\d+ подходящих · \d+ показано$/);
  assert.match((await picker.locator('.stage-picker-more').innerText()).trim(),
   /^Показать ещё \(\d+\)$/);
  assert.equal(await picker.locator('.studio-owner-interface-editor').count(),0);
  if(await filter.isVisible())await checkbox.check();
  const previousChecked=await checkbox.isChecked();
  const search=picker.locator('input[type="search"]');
  await search.click();
  await search.fill('___no-equipment-will-ever-have-this-name___');
  assert.equal((await picker.locator('.stage-picker-count').innerText()).trim(),
   '0 подходящих · 0 показано');
  assert.equal(await checkbox.isChecked(),previousChecked);
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  assert.equal((await picker.locator('.stage-picker-only-available').innerText()).trim(),
   'Available at my level');
  assert.equal(await picker.locator('.stage-picker-only-available input').getAttribute('aria-label'),
   'Only items available at my level');
  assert.equal((await picker.locator('.stage-picker-count').innerText()).trim(),
   '0 matching · 0 shown');
  assert.match((await picker.locator('.stage-picker-more').innerText()).trim(),
   /^Show more \(\d+\)$/);
  assert.equal(await picker.locator('input[type="search"]').inputValue(),
   '___no-equipment-will-ever-have-this-name___','Locale switch keeps search query');
  assert.equal(await picker.locator('.stage-picker-only-available input').isChecked(),
   previousChecked,'Locale switch keeps checkbox state');
  assert.deepEqual(errors,[],'No browser JavaScript errors');
 }finally{await ctx.close()}
 // Exercise a second genuine local-catalog hero with >48 Warrior weapons.
 // This verifies actual rendered buttons, tooltip ownership and session state.
 const pageCtx=await browser.newContext({viewport:{width:1366,height:850}});
 await pageCtx.addInitScript(()=>{
  localStorage.setItem('ps-build-studio.v1',JSON.stringify({
   race:0,gender:0,job:0,level:45,equipment:{},souls:{},
   refinements:{},gems:{}
  }));
 });
 await pageCtx.route('**/*',route=>route.request().url().startsWith(base+'/')?
  route.continue():route.abort());
 const page2=await pageCtx.newPage(),pagingErrors=[];
 page2.on('pageerror',error=>pagingErrors.push(error.message));
 try{
  await page2.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page2.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  await page2.locator('.equipment-slot[data-slot-index="0"]').click({button:'right'});
  await page2.locator('.stage-gear-context-menu [data-gear-context-action="choose"]').click();
  const panel=page2.locator('#stagePicker');
  const rows=panel.locator('.stage-picker-list [data-stage-choice]');
  const more=panel.locator('.stage-picker-more');
  const total=Number((await panel.locator('.stage-picker-count-matched').innerText()).trim());
  assert.ok(total>48,'Warrior weapon catalog must have >48 compatible items: '+total);
  assert.equal(await rows.count(),48);
  assert.equal(await more.isVisible(),true);
  const original=rows.first(),originalId=await original.getAttribute('data-stage-choice');
  await original.evaluate(node=>node.dataset.pickerStable='preserved');
  await more.click();
  assert.equal(await rows.count(),Math.min(total,96));
  assert.equal(await rows.first().getAttribute('data-stage-choice'),originalId);
  assert.equal(await rows.first().getAttribute('data-picker-stable'),'preserved',
   'More appends new cards without remounting existing item previews');
  let pages=1;
  while(await more.isVisible()){
   if(++pages>20)throw Error('Item paging did not converge');
   await more.click();
   assert.equal(await rows.first().getAttribute('data-picker-stable'),'preserved');
  }
  assert.equal(await rows.count(),total);
  assert.equal(await panel.locator('.stage-picker-count-shown').innerText(),String(total));
  assert.equal(await panel.locator('.stage-picker-more-count').innerText(),'0');
  assert.equal(await page2.evaluate(()=>document.activeElement?.hasAttribute(
   'data-stage-choice')),true,
   'Final More action transfers keyboard focus to a newly revealed item');
  // A reload must restore the active slot and expanded item page.
  await page2.reload({waitUntil:'domcontentloaded'});
  await page2.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  assert.equal(await panel.isVisible(),true,'Item picker remains open after F5');
  assert.equal(await rows.count(),total,'All revealed item rows survive F5');
  assert.equal(await more.isHidden(),true);
  const filter2=panel.locator('.stage-picker-only-available input');
  await filter2.check();
  const query2=panel.locator('input[type="search"]');
  await query2.fill('___no-compatible-items___');
  assert.equal(await rows.count(),0);
  await page2.reload({waitUntil:'domcontentloaded'});
  await page2.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  assert.equal(await panel.isVisible(),true);
  assert.equal(await filter2.isChecked(),true,'Level restriction survives F5');
  assert.equal(await query2.inputValue(),'___no-compatible-items___',
   'Text filter survives F5 without modifying the hero');
  assert.equal(await rows.count(),0);
  assert.deepEqual(pagingErrors,[]);
 }finally{await pageCtx.close()}
}

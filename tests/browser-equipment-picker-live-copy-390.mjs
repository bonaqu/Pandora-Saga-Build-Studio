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
}

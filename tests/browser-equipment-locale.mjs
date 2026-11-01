import assert from 'node:assert/strict';

// Real Chromium: opening the public Equipment catalog and switching languages
// must leave the same catalog records and interactions intact.
export async function runEquipmentLocaleSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1366,height:850}});
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>/\d+ навыков · \d+ предметов · \d+ душ/.test(
   document.querySelector('#catalogStatus')?.textContent||''),null,{timeout:20000});
  await page.locator('#nav [data-tab="equipment"]').click();
  const toolbar=page.locator('.equipment-catalog-toolbar');
  await toolbar.waitFor({state:'visible'});
  const search=toolbar.locator('input[type=search]');
  assert.equal(await search.getAttribute('placeholder'),'Поиск по названию');
  const first=page.locator('.equipment-catalog-layout .item-card').first();
  await first.waitFor({state:'visible'});
  const firstName=await first.locator('strong').innerText();
  assert.ok(firstName.length>0);
  // The workbench covers the header: its own switch must remain clickable.
  await page.locator('#dockLocale [data-dock-locale="en"]').click();
  await page.waitForFunction(()=>document.querySelector(
   '.equipment-catalog-toolbar input[type=search]')?.placeholder==='Search items');
  assert.equal(await page.locator('#dockLocale [data-dock-locale="en"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#locale [data-locale="en"]').getAttribute('aria-pressed'),'true');
  assert.equal(await toolbar.locator('select option[value="ring"]').innerText(),'Rings');
  assert.match(await page.locator('.equipment-catalog-head h3').innerText(),/Pandora Saga Equipment/);
  assert.equal(await page.locator('.equipment-catalog-layout .item-card').first()
   .locator('strong').innerText(),firstName,'Changing UI language must not fabricate item names');
  assert.match(await page.locator('.equipment-catalog-layout .item-info h3').innerText(),/Item details/);
  await toolbar.locator('select').selectOption('ring');
  const ring=page.locator('.equipment-catalog-layout .item-card').first();
  await ring.waitFor({state:'visible'});
  await ring.focus();
  assert.ok((await page.locator('.equipment-catalog-layout .item-info').innerText()).includes('Sources and details'));
  await page.locator('#dockLocale [data-dock-locale="ru"]').click();
  await page.waitForFunction(()=>document.querySelector(
   '.equipment-catalog-toolbar input[type=search]')?.placeholder==='Поиск по названию');
  assert.equal(await page.locator('#dockLocale [data-dock-locale="ru"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#locale [data-locale="ru"]').getAttribute('aria-pressed'),'true');
  assert.equal(await toolbar.locator('select option[value="ring"]').innerText(),'Кольца');
  assert.match(await page.locator('.equipment-catalog-layout .item-info h3').innerText(),/Сведения о предмете/);
  assert.deepEqual(errors,[]);
  console.log('Chromium equipment RU/EN smoke passed: filters, source records, names and inspector');
 }finally{await context.close()}
}

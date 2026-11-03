import assert from 'node:assert/strict';

// Actual encyclopedia category interactions with the verified bundled OS
// snapshot. All off-site requests are blocked; production D1 is read-only.
export async function runEffectItemsSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('[data-wiki-chapter="utility"]').click();
  const select=page.locator('.wiki-effect-type');
  await page.locator('[data-wiki-record="50022"]').waitFor({state:'visible',timeout:20000});
  assert.equal(await select.inputValue(),'all');
  assert.equal(await page.locator('[data-wiki-record]').count(),67,
   '71 source IDs collapse to 67 distinct visible entries (four exact duplicates)');
  const selectGroup=async type=>{
   await select.selectOption(type);
   await page.waitForFunction(value=>
    document.querySelector('.wiki-effect-type')?.value===value,type);
  };
  await selectGroup('harmful');
  assert.equal(await page.locator('[data-wiki-record]').count(),2);
  await page.locator('[data-wiki-record="50022"]').click();
  assert.match(await page.locator('.wiki-harmful-consumable-note').innerText(),/«Яд»/);
  assert.match(await page.locator('.wiki-effect-usage').allInnerTexts().then(rows=>rows.join(' ')),
   /Создание яда/);
  assert.match(await page.locator('.wiki-effect-usage').allInnerTexts().then(rows=>rows.join(' ')),
   /Пустая бутыль/);
  assert.match(await page.locator('.wiki-effect-usage').allInnerTexts().then(rows=>rows.join(' ')),
   /Противоядие/);
  await page.locator('[data-wiki-record="50056"]').click();
  const poisonDetails=(await page.locator('.wiki-effect-usage').allInnerTexts()).join(' ');
  assert.match(poisonDetails,/Создание яда/);
  assert.match(poisonDetails,/Яд/);
  assert.match(poisonDetails,/Скороговорка/);
  assert.match(poisonDetails,/техническая запись «Яд»/);
  assert.match(poisonDetails,/×1/);
  assert.equal(await page.locator('a[href="#wiki/skill/500000004"]').count(),1,
   'Technical Poison skill must open as a separate verified wiki record');
  await selectGroup('cure');
  assert.equal(await page.locator('[data-wiki-record]').count(),10);
  for(const id of ['50016','50057','50065'])
   assert.equal(await page.locator('[data-wiki-record="'+id+'"]').count(),1,id);
  await page.locator('[data-wiki-record="50016"]').click();
  assert.match(await page.locator('.wiki-effect-cure-note').innerText(),/один отрицательный эффект/);
  assert.match((await page.locator('.wiki-effect-usage').allInnerTexts()).join(' '),/Очищение/);
  await selectGroup('buff');
  assert.equal(await page.locator('[data-wiki-record]').count(),52);
  for(const id of ['50001','50014','50065','90005'])
   assert.equal(await page.locator('[data-wiki-record="'+id+'"]').count(),1,id);
  assert.equal(await page.locator('[data-wiki-record="50022"]').count(),0);
  await selectGroup('recovery');
  assert.equal(await page.locator('[data-wiki-record]').count(),20);
  for(const id of ['50001','50023','50061','50065'])
   assert.equal(await page.locator('[data-wiki-record="'+id+'"]').count(),1,id);
  assert.equal(await page.locator('[data-wiki-record="50014"]').count(),0);
  await selectGroup('other');
  assert.equal(await page.locator('[data-wiki-record]').count(),5);
  for(const id of ['50066','90021','90053'])
   assert.equal(await page.locator('[data-wiki-record="'+id+'"]').count(),1,id);
  // The detail panel is a modal and intentionally blocks the header.
  // Close it through the real UI before switching the site language.
  await selectGroup('review');
  assert.equal(await page.locator('[data-wiki-record]').count(),0);
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('.wiki-effect-type').waitFor({state:'visible'});
  assert.equal(await page.locator('.wiki-effect-type option:checked').innerText(),'Needs verification');
  await page.locator('.wiki-effect-type').selectOption('other');
  assert.equal(await page.locator('.wiki-effect-type option:checked').innerText(),'Other usable items');
  await page.locator('.wiki-effect-type').selectOption('harmful');
  assert.equal(await page.locator('[data-wiki-record]').count(),2);
  await page.locator('[data-wiki-record="50022"]').click();
  assert.match(await page.locator('.wiki-harmful-consumable-note').innerText(),/Poison/);
  await page.setViewportSize({width:390,height:780});
  const overflow=await page.evaluate(()=>
   Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-
   document.documentElement.clientWidth);
  assert.ok(overflow<=15,'Effect items overflow viewport: '+overflow);
  assert.deepEqual(errors,[]);
  console.log('Chromium effect items passed: negative/cure/positive/recovery/other, crafting, RU/EN and responsive');
 }finally{await context.close()}
}

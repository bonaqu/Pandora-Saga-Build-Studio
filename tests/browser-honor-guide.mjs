import assert from 'node:assert/strict';

// Independent browser context: a public reader never receives admin controls,
// and historic places are separate from the active OS map snapshot.
export async function runHonorGuideSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1280,height:850}});
 await context.route('**/*',route=>route.request().url().startsWith(base+'/')?
  route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('.wiki-categories [data-wiki-chapter="honor"]').click();
  const panel=page.locator('.wiki-page');
  await panel.locator('.wiki-honor-title').waitFor({state:'visible'});
  assert.match(await panel.innerText(),/23.10.2026/);
  assert.equal(await panel.locator('.wiki-honor-rank').count(),12);
  assert.match(await panel.locator('.wiki-honor-rank.is-moon').innerText(),
   /Министр|129\s*000/);
  assert.equal(await panel.locator('.wiki-honor-list-section').count(),2);
  assert.equal(await panel.locator('.wiki-honor-list-section').first()
   .locator('.wiki-honor-list-row').count(),3);
  assert.equal(await panel.locator('.wiki-honor-list-section').last()
   .locator('.wiki-honor-list-row').count(),2);
  assert.equal(await panel.locator('.wiki-honor-add').count(),0,
   'Public readers cannot edit zones or wars');
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('.wiki-honor-title').waitFor({state:'visible'});
  assert.equal((await page.locator('.wiki-honor-title').innerText()).trim(),
   'Honor points');
  assert.match(await panel.locator('.wiki-honor-rank.is-moon').innerText(),/Count/);
  await page.locator('#locale [data-locale="ru"]').click();
  const zone=panel.locator('.wiki-honor-list-row')
   .filter({hasText:'Эль Ведд'}).locator('.wiki-link');
  await zone.click();
  const historical=page.locator('.wiki-historic-roster');
  await historical.waitFor({state:'visible',timeout:20000});
  assert.equal(await historical.locator('.wiki-historic-mob').count(),22);
  assert.equal(await historical.locator('.wiki-historic-unverified').count(),3);
  assert.ok(await historical.locator('.wiki-historic-mob .wiki-link').count()>=19);
  assert.match(await historical.innerText(),/Страж вожака/);
  assert.deepEqual(errors,[]);
  console.log('Chromium Honor encyclopedia passed: RU/EN, 12 ranks, historic 22-mob linked roster');
 }finally{await context.close()}
}

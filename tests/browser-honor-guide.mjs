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
  assert.doesNotMatch(await panel.innerText(),
   /23.10.2026|Официальная новость|Источники:/);
  assert.equal(await panel.locator('.wiki-honor-dual,.wiki-honor-resource').count(),0,
   'Honor has no duplicate resource cards');
  assert.equal(await panel.locator('.wiki-honor-monthly-card').count(),3);
  assert.match(await panel.locator('.wiki-honor-monthly-card').first().innerText(),/Герцог/);
  assert.doesNotMatch(await panel.locator('.wiki-honor-list-section').first()
   .innerText(),/Muldian Uncivilized District|El Beht|Underground of Astir/);
  assert.equal(await panel.locator('.wiki-honor-rank').count(),12);
  assert.equal(await panel.locator('.wiki-honor-joining').count(),0,
   'Starting Honor belongs to the Squire rank, not a duplicated callout');
  assert.match(await panel.locator('#honor-rank-0 .wiki-honor-requirement').innerText(),/1 000/);
  assert.equal(await panel.locator('.wiki-honor-emblem-svg').count(),12);
  for(let i=0;i<5;i++)assert.equal(
   await panel.locator('#honor-rank-'+i+' svg polygon').count(),i+1);
  assert.ok(await panel.locator('#honor-rank-5 svg polygon').count()>=2);
  for(let i=6;i<11;i++)assert.ok(
   await panel.locator('#honor-rank-'+i+' svg path').count()>=i-5);
  assert.ok(await panel.locator('#honor-rank-11 svg path').count()>=3);
  const cloaks=panel.locator('.wiki-honor-cloak-link');
  assert.equal(await cloaks.count(),9,'All 9 cloak rewards resolve to catalog items');
  await cloaks.first().hover();
  await page.locator('#stage-gear-tooltip').waitFor({state:'visible'});
  await cloaks.first().click();
  assert.match(await panel.locator('h3').innerText(),/плащ победителя/);
  await page.goBack({waitUntil:'domcontentloaded'});
  await panel.locator('.wiki-honor-title').waitFor({state:'visible'});
  assert.match(await panel.locator('.wiki-honor-monthly-head').first().innerText(),/Награды/);
  assert.match(await panel.locator('.wiki-honor-rank.is-moon').innerText(),
   /Министр|129\s*000/);
  assert.equal(await panel.locator('.wiki-honor-list-section').count(),2);
  assert.equal(await panel.locator('.wiki-honor-list-section').first()
   .locator('.wiki-honor-list-row').count(),3);
  assert.equal(await panel.locator('.wiki-honor-list-section').last()
   .locator('.wiki-honor-list-row').count(),2);
  assert.equal(await panel.locator('.wiki-honor-add').count(),0,
   'Public readers cannot edit zones or wars');
  // The encyclopedia is a modal workbench. Close it before switching locale
  // through the actual clickable header control; opening Wiki restores Honor.
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('.wiki-honor-title').waitFor({state:'visible'});
  assert.equal((await page.locator('.wiki-honor-title').innerText()).trim(),
   'Honor');
  assert.match(await panel.locator('.wiki-honor-rank.is-moon').innerText(),/Count/);
  assert.doesNotMatch(await panel.locator('.wiki-honor-list-section').first()
   .innerText(),/Покинутые земли Мальдии|Подземные руины Астира/);
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="ru"]').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  const zone=panel.locator('.wiki-honor-list-row')
   .filter({hasText:'Эль Ведд'}).locator('.wiki-link');
  await zone.click();
  const native=page.locator('.wiki-page .wiki-map-monsters');
  await native.waitFor({state:'visible',timeout:20000});
  assert.equal(await native.locator('.wiki-mob-row').count(),22);
  assert.ok(await native.locator('.wiki-mob-row .wiki-link').count()>=19);
  assert.match(await native.innerText(),/Страж вожака/);
  assert.equal(await page.locator('.wiki-historic-notice,.wiki-historic-tag').count(),0);
  assert.doesNotMatch(await panel.innerText(),/Историческая PvP-локация|не представленная в актуальной карте OS/);
  assert.equal(await panel.locator('.wiki-map-roster-actions').count(),0,
   'Only authenticated administrators can edit the future monster roster');
  await page.locator('.wiki-categories [data-wiki-chapter="map"]').click();
  const ruins=page.locator('.wiki-list [data-wiki-record="astir-underground"]');
  await ruins.waitFor({state:'visible',timeout:15000});
  await ruins.click();
  assert.equal((await panel.locator('h3').innerText()).trim(),'Подземные руины Астира');
  assert.doesNotMatch(await panel.innerText(),/Историческая PvP-локация|недоступна на OS/);
  assert.deepEqual(errors,[]);
  console.log('Chromium Honor and future maps passed: RU/EN, 12 ranks, native 22-mob location grid');
 }finally{await context.close()}
}
